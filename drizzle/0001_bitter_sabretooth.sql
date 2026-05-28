CREATE TABLE "company_branding" (
	"singleton_key" varchar(32) PRIMARY KEY DEFAULT 'company_branding' NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"logo_url" varchar(2048),
	"primary_brand_color" varchar(7) NOT NULL,
	"contact_phone" varchar(40),
	"contact_email" varchar(320),
	"contact_website" varchar(2048),
	"contact_address" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_branding_singleton_key" CHECK ("company_branding"."singleton_key" = 'company_branding'),
	CONSTRAINT "company_branding_primary_color_hex" CHECK ("company_branding"."primary_brand_color" ~ '^#[0-9A-Fa-f]{6}$')
);
--> statement-breakpoint
ALTER TABLE "company_branding" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "company_branding" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "company_branding" FROM authenticated;
