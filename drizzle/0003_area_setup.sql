CREATE TABLE "area_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "area_types_name_not_blank" CHECK (length(btrim("area_types"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"area_type_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "areas_name_not_blank" CHECK (length(btrim("areas"."name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_area_type_id_area_types_id_fk" FOREIGN KEY ("area_type_id") REFERENCES "public"."area_types"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "areas_building_id_idx" ON "areas" USING btree ("building_id");
--> statement-breakpoint
CREATE INDEX "areas_area_type_id_idx" ON "areas" USING btree ("area_type_id");
--> statement-breakpoint
ALTER TABLE "area_types" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "areas" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "area_types" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "area_types" FROM authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "areas" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "areas" FROM authenticated;
--> statement-breakpoint
INSERT INTO "area_types" ("name") VALUES
	('Restroom'),
	('Office'),
	('Hallway'),
	('Lobby'),
	('Breakroom'),
	('Stairwell'),
	('Elevator'),
	('Common Area');
