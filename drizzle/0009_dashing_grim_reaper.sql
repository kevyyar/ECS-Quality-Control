CREATE TABLE "ticket_after_photo_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"storage_path" varchar(2048) NOT NULL,
	"uploaded_by_auth_user_id" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_after_photo_evidence_storage_path_not_blank" CHECK (length(btrim("ticket_after_photo_evidence"."storage_path")) > 0)
);
--> statement-breakpoint
ALTER TABLE "ticket_after_photo_evidence" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "ticket_after_photo_evidence" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "ticket_after_photo_evidence" FROM authenticated;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "resolution_note" varchar(1000);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "closed_by_auth_user_id" uuid;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "closed_by_email" varchar(320);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ticket_after_photo_evidence" ADD CONSTRAINT "ticket_after_photo_evidence_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ticket_after_photo_evidence_ticket_id_idx" ON "ticket_after_photo_evidence" USING btree ("ticket_id");--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_closure_metadata_matches_status" CHECK ((
        "tickets"."status" = 'open'
        and "tickets"."resolution_note" is null
        and "tickets"."closed_by_auth_user_id" is null
        and "tickets"."closed_by_email" is null
        and "tickets"."closed_at" is null
      ) or (
        "tickets"."status" = 'closed'
        and "tickets"."resolution_note" is not null
        and length(btrim("tickets"."resolution_note")) > 0
        and "tickets"."closed_by_auth_user_id" is not null
        and "tickets"."closed_by_email" is not null
        and "tickets"."closed_at" is not null
      ));