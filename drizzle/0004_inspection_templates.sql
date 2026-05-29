CREATE TABLE "inspection_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" varchar(1000),
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inspection_templates_name_not_blank" CHECK (length(btrim("inspection_templates"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "inspection_template_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inspection_template_sections_name_not_blank" CHECK (length(btrim("inspection_template_sections"."name")) > 0),
	CONSTRAINT "inspection_template_sections_position_positive" CHECK ("inspection_template_sections"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "inspection_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"section_id" uuid,
	"position" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inspection_template_items_name_not_blank" CHECK (length(btrim("inspection_template_items"."name")) > 0),
	CONSTRAINT "inspection_template_items_position_positive" CHECK ("inspection_template_items"."position" > 0)
);
--> statement-breakpoint
ALTER TABLE "inspection_template_sections" ADD CONSTRAINT "inspection_template_sections_template_id_inspection_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."inspection_templates"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inspection_template_items" ADD CONSTRAINT "inspection_template_items_template_id_inspection_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."inspection_templates"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inspection_template_items" ADD CONSTRAINT "inspection_template_items_section_id_inspection_template_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."inspection_template_sections"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "inspection_template_sections_template_id_idx" ON "inspection_template_sections" USING btree ("template_id");
--> statement-breakpoint
CREATE INDEX "inspection_template_items_template_id_idx" ON "inspection_template_items" USING btree ("template_id");
--> statement-breakpoint
CREATE INDEX "inspection_template_items_section_id_idx" ON "inspection_template_items" USING btree ("section_id");
--> statement-breakpoint
ALTER TABLE "inspection_templates" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "inspection_template_sections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "inspection_template_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspection_templates" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspection_templates" FROM authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspection_template_sections" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspection_template_sections" FROM authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspection_template_items" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "inspection_template_items" FROM authenticated;
--> statement-breakpoint
WITH starter_templates(name, description) AS (
	VALUES
		('Restroom', 'Starter Inspection Template for restroom Areas.'),
		('Office', 'Starter Inspection Template for office Areas.'),
		('Hallway', 'Starter Inspection Template for hallway Areas.'),
		('Lobby', 'Starter Inspection Template for lobby Areas.')
), inserted_templates AS (
	INSERT INTO "inspection_templates" ("name", "description")
	SELECT name, description FROM starter_templates
	RETURNING "id", "name"
)
INSERT INTO "inspection_template_items" ("template_id", "position", "name", "description")
SELECT inserted_templates."id", starter_items."position", starter_items."name", starter_items."description"
FROM inserted_templates
JOIN (
	VALUES
		('Restroom', 1, 'Fixtures', 'Sinks, toilets, urinals, and dispensers are clean and stocked.'),
		('Restroom', 2, 'Floors', 'Floors are clean, dry, and free of debris.'),
		('Restroom', 3, 'Mirrors', 'Mirrors are clean and streak-free.'),
		('Office', 1, 'Work surfaces', 'Desks, tables, and counters are clean.'),
		('Office', 2, 'Trash', 'Trash and recycling are removed.'),
		('Office', 3, 'Floors', 'Floors are vacuumed or mopped and free of debris.'),
		('Hallway', 1, 'Floors', 'Floors are clean and free of debris.'),
		('Hallway', 2, 'Walls and doors', 'Walls, doors, and touch points are clean.'),
		('Hallway', 3, 'Trash', 'Trash containers are emptied and clean.'),
		('Lobby', 1, 'Entry glass', 'Entry glass and doors are clean.'),
		('Lobby', 2, 'Reception surfaces', 'Reception surfaces are clean and organized.'),
		('Lobby', 3, 'Floors', 'Floors are clean and presentable.')
) AS starter_items(template_name, position, name, description)
	ON starter_items.template_name = inserted_templates."name";
