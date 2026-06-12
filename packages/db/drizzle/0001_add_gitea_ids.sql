ALTER TABLE "forge_orgs" ADD COLUMN "gitea_id" integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "forge_orgs_gitea_id_unique" ON "forge_orgs" USING btree ("gitea_id");--> statement-breakpoint
ALTER TABLE "forge_users" ADD COLUMN "gitea_user_id" integer;--> statement-breakpoint
CREATE INDEX "forge_users_gitea_user_id_idx" ON "forge_users" USING btree ("gitea_user_id");
