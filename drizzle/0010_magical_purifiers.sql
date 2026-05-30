CREATE TABLE "correction_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" varchar(32) NOT NULL,
	"inspection_id" uuid,
	"ticket_id" uuid,
	"note" varchar(1000) NOT NULL,
	"created_by_auth_user_id" uuid NOT NULL,
	"created_by_email" varchar(320) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "correction_notes_target_type_valid" CHECK ("correction_notes"."target_type" in ('submitted_inspection', 'ticket')),
	CONSTRAINT "correction_notes_note_not_blank" CHECK (length(btrim("correction_notes"."note")) > 0),
	CONSTRAINT "correction_notes_target_matches_type" CHECK ((
        "correction_notes"."target_type" = 'submitted_inspection'
        and "correction_notes"."inspection_id" is not null
        and "correction_notes"."ticket_id" is null
      ) or (
        "correction_notes"."target_type" = 'ticket'
        and "correction_notes"."ticket_id" is not null
        and "correction_notes"."inspection_id" is null
      ))
);
--> statement-breakpoint
ALTER TABLE "correction_notes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "correction_notes" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "correction_notes" FROM authenticated;--> statement-breakpoint
ALTER TABLE "correction_notes" ADD CONSTRAINT "correction_notes_inspection_id_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correction_notes" ADD CONSTRAINT "correction_notes_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "correction_notes_inspection_id_idx" ON "correction_notes" USING btree ("inspection_id");--> statement-breakpoint
CREATE INDEX "correction_notes_ticket_id_idx" ON "correction_notes" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "correction_notes_created_at_idx" ON "correction_notes" USING btree ("created_at");