CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"product_name" text NOT NULL,
	"product_sku" text NOT NULL,
	"variant_sku" text NOT NULL,
	"variant_label" text NOT NULL,
	"attributes" jsonb NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_minor" integer NOT NULL,
	"line_total_minor" integer NOT NULL,
	CONSTRAINT "order_items_amount_valid" CHECK ("order_items"."quantity" BETWEEN 1 AND 20 AND "order_items"."unit_price_minor" > 0 AND "order_items"."line_total_minor" = "order_items"."unit_price_minor" * "order_items"."quantity")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_token" text NOT NULL,
	"order_number" text NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"area" text NOT NULL,
	"note" text,
	"shipping_zone_code" text NOT NULL,
	"shipping_zone_name" text NOT NULL,
	"subtotal_minor" integer NOT NULL,
	"shipping_minor" integer NOT NULL,
	"discount_minor" integer DEFAULT 0 NOT NULL,
	"total_minor" integer NOT NULL,
	"payment_method" text DEFAULT 'cod' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"status" text DEFAULT 'placed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_public_token_unique" UNIQUE("public_token"),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "orders_payment_method_valid" CHECK ("orders"."payment_method" = 'cod'),
	CONSTRAINT "orders_payment_status_valid" CHECK ("orders"."payment_status" IN ('pending','paid','failed','refunded')),
	CONSTRAINT "orders_status_valid" CHECK ("orders"."status" IN ('placed','confirmed','shipped','delivered','cancelled')),
	CONSTRAINT "orders_totals_valid" CHECK ("orders"."subtotal_minor" > 0 AND "orders"."shipping_minor" >= 0 AND "orders"."discount_minor" >= 0 AND "orders"."total_minor" = "orders"."subtotal_minor" + "orders"."shipping_minor" - "orders"."discount_minor"),
	CONSTRAINT "orders_contact_valid" CHECK (length(trim("orders"."customer_name")) > 0 AND length(trim("orders"."address")) > 0 AND length(trim("orders"."area")) > 0 AND "orders"."phone" ~ '^\+8801[3-9][0-9]{8}$')
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"fee_minor" integer NOT NULL,
	"free_above_minor" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_zone_code_valid" CHECK ("shipping_zones"."code" IN ('inside-dhaka', 'outside-dhaka')),
	CONSTRAINT "shipping_zone_name_valid" CHECK (length(trim("shipping_zones"."name")) > 0),
	CONSTRAINT "shipping_zone_fee_valid" CHECK ("shipping_zones"."fee_minor" >= 0),
	CONSTRAINT "shipping_zone_threshold_valid" CHECK ("shipping_zones"."free_above_minor" IS NULL OR "shipping_zones"."free_above_minor" > 0)
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_zone_code_shipping_zones_code_fk" FOREIGN KEY ("shipping_zone_code") REFERENCES "public"."shipping_zones"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_items_order_variant_idx" ON "order_items" USING btree ("order_id","variant_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at","id");