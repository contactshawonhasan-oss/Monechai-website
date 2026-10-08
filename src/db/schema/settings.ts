import { sql } from "drizzle-orm";
import { boolean, check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Single row. No unverified contact or shipping defaults; COD is the only implemented method.
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  storeName: text("store_name").notNull().default("Monechai"),
  whatsappNumber: text("whatsapp_number"),
  hotline: text("hotline"),
  supportEmail: text("support_email"),
  contactAddress: text("contact_address"),
  codEnabled: boolean("cod_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("site_settings_singleton", sql`${t.id} = 1`),
  check("site_settings_store_name", sql`length(trim(${t.storeName})) > 0`),
]);
