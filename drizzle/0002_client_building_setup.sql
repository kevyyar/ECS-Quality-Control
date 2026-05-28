CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_name_not_blank" CHECK (length(btrim("clients"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buildings_name_not_blank" CHECK (length(btrim("buildings"."name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "buildings_client_id_idx" ON "buildings" USING btree ("client_id");
--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "buildings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "clients" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "clients" FROM authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "buildings" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "buildings" FROM authenticated;
