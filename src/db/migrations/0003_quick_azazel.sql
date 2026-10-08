CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "history_from_valid" CHECK ("order_status_history"."from_status" IS NULL OR "order_status_history"."from_status" IN ('pending_confirmation','confirmed','packed','shipped','delivered','cancelled')),
	CONSTRAINT "history_to_valid" CHECK ("order_status_history"."to_status" IN ('pending_confirmation','confirmed','packed','shipped','delivered','cancelled'))
);
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_status_valid";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending_confirmation';--> statement-breakpoint
UPDATE "orders" SET "status" = 'pending_confirmation' WHERE "status" = 'placed';--> statement-breakpoint
INSERT INTO "order_status_history" ("order_id", "to_status", "created_at")
SELECT "id", "status", "created_at" FROM "orders";--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "history_order_idx" ON "order_status_history" USING btree ("order_id","created_at","id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_valid" CHECK ("orders"."status" IN ('pending_confirmation','confirmed','packed','shipped','delivered','cancelled'));