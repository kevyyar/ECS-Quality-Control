CREATE TABLE "internal_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"manager" boolean DEFAULT false NOT NULL,
	"supervisor" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "internal_users_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "internal_users_requires_capability" CHECK ("internal_users"."manager" OR "internal_users"."supervisor")
);
--> statement-breakpoint
ALTER TABLE "internal_users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "internal_users" FROM anon;
--> statement-breakpoint
REVOKE ALL ON TABLE "internal_users" FROM authenticated;
