CREATE TABLE "order_payment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" text NOT NULL,
	"to_status" text NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_history_cod_valid" CHECK ("order_payment_history"."from_status" = 'pending' AND "order_payment_history"."to_status" = 'paid')
);
--> statement-breakpoint
ALTER TABLE "order_payment_history" ADD CONSTRAINT "order_payment_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_history_order_idx" ON "order_payment_history" USING btree ("order_id","created_at");