CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar(24) DEFAULT 'draft' NOT NULL,
	"client_id" uuid NOT NULL,
	"building_id" uuid NOT NULL,
	"client_name_snapshot" varchar(160) NOT NULL,
	"building_name_snapshot" varchar(160) NOT NULL,
	"started_by_auth_user_id" uuid NOT NULL,
	"started_by_email" varchar(320) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inspections_status_valid" CHECK ("inspections"."status" in ('draft', 'submitted'))
);
--> statement-breakpoint
CREATE TABLE "inspection_area_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_id" uuid NOT NULL,
	"source" varchar(24) DEFAULT 'planned' NOT NULL,
	"position" integer NOT NULL,
	"area_id" uuid NOT NULL,
	"area_type_id" uuid NOT NULL,
	"inspection_template_id" uuid NOT NULL,
	"area_name_snapshot" varchar(160) NOT NULL,
	"area_type_name_snapshot" varchar(160) NOT NULL,
	"inspection_template_name_snapshot" varchar(160) NOT NULL,
	"inspection_template_description_snapshot" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inspection_area_inspections_source_valid" CHECK ("inspection_area_inspections"."source" in ('planned', 'one_off')),
	CONSTRAINT "inspection_area_inspections_position_positive" CHECK ("inspection_area_inspections"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "inspection_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_inspection_id" uuid NOT NULL,
	"source_template_item_id" uuid,
	"source_template_section_id" uuid,
	"position" integer NOT NULL,
	"section_name_snapshot" varchar(160),
	"item_name_snapshot" varchar(160) NOT NULL,
	"item_description_snapshot" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inspection_items_position_positive" CHECK ("inspection_items"."position" > 0)
);
--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inspection_area_inspections" ADD CONSTRAINT "inspection_area_inspections_inspection_id_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inspection_area_inspections" ADD CONSTRAINT "inspection_area_inspections_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inspection_area_inspections" ADD CONSTRAINT "inspection_area_inspections_area_type_id_area_types_id_fk" FOREIGN KEY ("area_type_id") REFERENCES "public"."area_types"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inspection_area_inspections" ADD CONSTRAINT "inspection_area_inspections_inspection_template_id_inspection_templates_id_fk" FOREIGN KEY ("inspection_template_id") REFERENCES "public"."inspection_templates"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_area_inspection_id_inspection_area_inspections_id_fk" FOREIGN KEY ("area_inspection_id") REFERENCES "public"."inspection_area_inspections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "inspections_status_idx" ON "inspections" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "inspections_building_id_idx" ON "inspections" USING btree ("building_id");
--> statement-breakpoint
CREATE INDEX "inspections_started_at_idx" ON "inspections" USING btree ("started_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "inspections_one_active_draft_per_building" ON "inspections" USING btree ("building_id") WHERE "inspections"."status" = 'draft';
--> statement-breakpoint
CREATE INDEX "inspection_area_inspections_inspection_id_idx" ON "inspection_area_inspections" USING btree ("inspection_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "inspection_area_inspections_inspection_position_unique" ON "inspection_area_inspections" USING btree ("inspection_id","position");
--> statement-breakpoint
CREATE INDEX "inspection_items_area_inspection_id_idx" ON "inspection_items" USING btree ("area_inspection_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "inspection_items_area_inspection_position_unique" ON "inspection_items" USING btree ("area_inspection_id","position");
--> statement-breakpoint
ALTER TABLE "inspections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "inspection_area_inspections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "inspection_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspections" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspections" FROM authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspection_area_inspections" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspection_area_inspections" FROM authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspection_items" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspection_items" FROM authenticated;
