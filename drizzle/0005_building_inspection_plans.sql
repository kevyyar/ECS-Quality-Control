CREATE TABLE "building_inspection_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "building_inspection_plan_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"inspection_template_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "building_inspection_plan_entries_position_positive" CHECK ("building_inspection_plan_entries"."position" > 0)
);
--> statement-breakpoint
ALTER TABLE "building_inspection_plans" ADD CONSTRAINT "building_inspection_plans_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "building_inspection_plan_entries" ADD CONSTRAINT "building_inspection_plan_entries_plan_id_building_inspection_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."building_inspection_plans"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "building_inspection_plan_entries" ADD CONSTRAINT "building_inspection_plan_entries_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "building_inspection_plan_entries" ADD CONSTRAINT "building_inspection_plan_entries_inspection_template_id_inspection_templates_id_fk" FOREIGN KEY ("inspection_template_id") REFERENCES "public"."inspection_templates"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "building_inspection_plans_building_id_unique" ON "building_inspection_plans" USING btree ("building_id");
--> statement-breakpoint
CREATE INDEX "building_inspection_plan_entries_plan_id_idx" ON "building_inspection_plan_entries" USING btree ("plan_id");
--> statement-breakpoint
CREATE INDEX "building_inspection_plan_entries_area_id_idx" ON "building_inspection_plan_entries" USING btree ("area_id");
--> statement-breakpoint
CREATE INDEX "building_inspection_plan_entries_template_id_idx" ON "building_inspection_plan_entries" USING btree ("inspection_template_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "building_inspection_plan_entries_plan_area_unique" ON "building_inspection_plan_entries" USING btree ("plan_id","area_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "building_inspection_plan_entries_plan_position_unique" ON "building_inspection_plan_entries" USING btree ("plan_id","position");
--> statement-breakpoint
ALTER TABLE "building_inspection_plans" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "building_inspection_plan_entries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "building_inspection_plans" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "building_inspection_plans" FROM authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "building_inspection_plan_entries" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "building_inspection_plan_entries" FROM authenticated;
