CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_bn" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug"),
	CONSTRAINT "categories_slug_valid" CHECK ("categories"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "categories_name_nonempty" CHECK (length(trim("categories"."name_en")) > 0)
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"storage_key" text,
	"demo_source_url" text,
	"alt_en" text NOT NULL,
	"alt_bn" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "images_source_valid" CHECK (("product_images"."storage_key" IS NOT NULL AND "product_images"."demo_source_url" IS NULL AND length(trim("product_images"."storage_key")) > 0) OR ("product_images"."storage_key" IS NULL AND "product_images"."demo_source_url" IS NOT NULL)),
	CONSTRAINT "images_sort_nonnegative" CHECK ("product_images"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"label" text DEFAULT 'Default' NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"price_minor" integer,
	"track_inventory" boolean DEFAULT true NOT NULL,
	"stock_quantity" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku"),
	CONSTRAINT "variants_sku_nonempty" CHECK (length(trim("product_variants"."sku")) > 0),
	CONSTRAINT "variants_label_nonempty" CHECK (length(trim("product_variants"."label")) > 0),
	CONSTRAINT "variants_price_positive" CHECK ("product_variants"."price_minor" IS NULL OR "product_variants"."price_minor" > 0),
	CONSTRAINT "variants_stock_valid" CHECK (("product_variants"."track_inventory" AND "product_variants"."stock_quantity" IS NOT NULL AND "product_variants"."stock_quantity" >= 0) OR (NOT "product_variants"."track_inventory" AND "product_variants"."stock_quantity" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"sku" text NOT NULL,
	"category_id" uuid NOT NULL,
	"name_en" text NOT NULL,
	"name_bn" text,
	"description_en" text,
	"description_bn" text,
	"price_minor" integer NOT NULL,
	"compare_at_minor" integer,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"badge" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_slug_valid" CHECK ("products"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "products_sku_nonempty" CHECK (length(trim("products"."sku")) > 0),
	CONSTRAINT "products_name_nonempty" CHECK (length(trim("products"."name_en")) > 0),
	CONSTRAINT "products_price_positive" CHECK ("products"."price_minor" > 0),
	CONSTRAINT "products_compare_valid" CHECK ("products"."compare_at_minor" IS NULL OR "products"."compare_at_minor" > "products"."price_minor"),
	CONSTRAINT "products_demo_unpublished" CHECK (NOT ("products"."is_demo" AND "products"."is_published"))
);
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "images_one_primary_per_product_idx" ON "product_images" USING btree ("product_id") WHERE "product_images"."is_primary" = true;--> statement-breakpoint
CREATE INDEX "images_product_order_idx" ON "product_images" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE INDEX "variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_category_published_idx" ON "products" USING btree ("category_id","is_published");--> statement-breakpoint
CREATE INDEX "products_published_created_idx" ON "products" USING btree ("is_published","created_at","id");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("is_featured") WHERE "products"."is_published" = true;--> statement-breakpoint
CREATE INDEX "products_name_search_idx" ON "products" USING gin (to_tsvector('simple', "name_en"));