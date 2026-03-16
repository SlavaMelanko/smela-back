DROP INDEX "unique_user_permission";--> statement-breakpoint
DROP INDEX "refresh_tokens_user_active_index";--> statement-breakpoint
DROP INDEX "refresh_tokens_cleanup_index";--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_permission_id_pk" PRIMARY KEY("user_id","permission_id");--> statement-breakpoint
ALTER TABLE "user_permissions" DROP COLUMN "id";