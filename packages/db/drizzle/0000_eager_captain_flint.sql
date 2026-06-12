CREATE TABLE "error_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"component_stack" text,
	"url" text,
	"user_agent" text,
	"user_id" text,
	"app_name" text NOT NULL,
	"environment" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "error_groups" (
	"fingerprint" text PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"app_name" text NOT NULL,
	"environment" text NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_url" text,
	"count" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_members" (
	"org_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	CONSTRAINT "forge_members_org_id_user_id_pk" PRIMARY KEY("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "forge_orgs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"gitea_org" text NOT NULL,
	"display_name" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forge_orgs_gitea_org_unique" UNIQUE("gitea_org")
);
--> statement-breakpoint
CREATE TABLE "forge_previews" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"repo_id" text NOT NULL,
	"pr_number" integer NOT NULL,
	"url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"avatar_url" text,
	"gitea_token" text,
	"gitea_username" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forge_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "forge_workflows" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"repo_id" text NOT NULL,
	"org_id" text NOT NULL,
	"name" text DEFAULT 'CI' NOT NULL,
	"yaml" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forge_members" ADD CONSTRAINT "forge_members_org_id_forge_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."forge_orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_members" ADD CONSTRAINT "forge_members_user_id_forge_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."forge_users"("id") ON DELETE cascade ON UPDATE no action;