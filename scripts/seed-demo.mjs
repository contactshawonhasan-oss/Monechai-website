// Local-only, repeatable import from the trusted legacy prototype source.
// Never execute untrusted input or run this script against a production database.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';
import postgres from 'postgres';

if (process.argv[2] !== '--demo' || process.env.NODE_ENV === 'production') {
  throw new Error('Demo seed requires --demo and must not run in production');
}
const url = new URL(process.env.DATABASE_URL ?? '');
if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
  throw new Error('Demo seed only supports loopback PostgreSQL; do not seed a remote database');
}
const source = await readFile(resolve('assets/js/products.js'), 'utf8');
const data = vm.runInNewContext(`${source}\n;({ products: PRODUCTS, categories: CATEGORIES })`, {}, {
  timeout: 1000,
  contextCodeGeneration: { strings: false, wasm: false },
});
if (data.products.length !== 24 || data.categories.length !== 9) {
  throw new Error('Legacy prototype changed; review the seed before continuing');
}
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sql = postgres(process.env.DATABASE_URL, { ssl: process.env.DATABASE_SSL === 'disable' ? false : 'require', max: 1 });
try {
  await sql.begin(async (tx) => {
    const ids = new Map();
    for (const [position, category] of data.categories.entries()) {
      const categorySlug = slug(category.name);
      const [row] = await tx`
        INSERT INTO categories (slug, name_en, sort_order)
        VALUES (${categorySlug}, ${category.name}, ${position})
        ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
        RETURNING id
      `;
      ids.set(category.name, row.id);
    }
    for (const product of data.products) {
      if (!ids.has(product.category) || !/^p\d{2}$/.test(product.id) || !Number.isSafeInteger(product.price) || product.price <= 0) {
        throw new Error(`Invalid prototype product ${product.id}`);
      }
      const productSlug = `demo-${product.id}-${slug(product.name)}`;
      const sku = `DEMO-${product.id.toUpperCase()}`;
      const [row] = await tx`
        INSERT INTO products (slug, sku, category_id, name_en, description_en, price_minor, compare_at_minor, is_demo, is_published)
        VALUES (${productSlug}, ${sku}, ${ids.get(product.category)}, ${product.name}, ${product.desc}, ${product.price * 100}, ${product.old > product.price ? product.old * 100 : null}, true, false)
        ON CONFLICT (sku) DO UPDATE SET
          name_en = EXCLUDED.name_en, description_en = EXCLUDED.description_en,
          price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor,
          updated_at = now()
        WHERE products.is_demo AND products.slug = EXCLUDED.slug
        RETURNING id
      `;
      if (!row) throw new Error(`Refusing to overwrite non-demo product ${sku}`);
      const [variant] = await tx`
        INSERT INTO product_variants (product_id, sku, track_inventory, stock_quantity)
        VALUES (${row.id}, ${sku}, true, 0)
        ON CONFLICT (sku) DO UPDATE SET sku = EXCLUDED.sku
        WHERE product_variants.product_id = EXCLUDED.product_id
        RETURNING id
      `;
      if (!variant) throw new Error(`Variant SKU belongs to another product: ${sku}`);
      // Historical Unsplash metadata is NOT served publicly; no verified product assets yet.
      await tx`
        INSERT INTO product_images (product_id, demo_source_url, alt_en, is_primary)
        SELECT ${row.id}, ${product.img}, ${product.name}, true
        WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = ${row.id})
      `;
    }
  });
  console.log('Demo seed complete: 9 categories, 24 unpublished products (not sellable).');
} finally {
  await sql.end();
}
