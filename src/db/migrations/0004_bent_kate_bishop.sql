CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"store_name" text DEFAULT 'Monechai' NOT NULL,
	"whatsapp_number" text,
	"hotline" text,
	"support_email" text,
	"contact_address" text,
	"cod_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton" CHECK ("site_settings"."id" = 1),
	CONSTRAINT "site_settings_store_name" CHECK (length(trim("site_settings"."store_name")) > 0)
);
--> statement-breakpoint
INSERT INTO "site_settings" ("id") VALUES (1);
