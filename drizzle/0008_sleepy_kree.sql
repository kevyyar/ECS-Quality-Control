CREATE TABLE "inspection_item_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_item_id" uuid NOT NULL,
	"evidence_type" varchar(32) NOT NULL,
	"storage_path" varchar(2048) NOT NULL,
	"uploaded_by_auth_user_id" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inspection_item_evidence_type_valid" CHECK ("inspection_item_evidence"."evidence_type" in ('before_photo')),
	CONSTRAINT "inspection_item_evidence_storage_path_not_blank" CHECK (length(btrim("inspection_item_evidence"."storage_path")) > 0)
);
--> statement-breakpoint
ALTER TABLE "inspection_item_evidence" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "inspection_item_evidence" ADD CONSTRAINT "inspection_item_evidence_inspection_item_id_inspection_items_id_fk" FOREIGN KEY ("inspection_item_id") REFERENCES "public"."inspection_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inspection_item_evidence_item_id_idx" ON "inspection_item_evidence" USING btree ("inspection_item_id");