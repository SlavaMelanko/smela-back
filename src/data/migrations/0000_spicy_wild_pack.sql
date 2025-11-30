CREATE TYPE "public"."auth_provider" AS ENUM('local', 'google', 'github');--> statement-breakpoint
CREATE TYPE "public"."action" AS ENUM('view', 'create', 'edit', 'delete');--> statement-breakpoint
CREATE TYPE "public"."resource" AS ENUM('users', 'admins');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'user', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."token_status" AS ENUM('pending', 'used', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."token_type" AS ENUM('email_verification', 'password_reset');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('new', 'verified', 'trial', 'active', 'suspended', 'archived', 'pending');--> statement-breakpoint
CREATE TABLE "auth" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" "action" NOT NULL,
	"resource" "resource" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" "role" NOT NULL,
	"permission_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "token_type" NOT NULL,
	"status" "token_status" DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100),
	"email" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"status" "status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "auth" ADD CONSTRAINT "auth_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_auth" ON "auth" USING btree ("provider","identifier");--> statement-breakpoint
CREATE INDEX "auth_user_id_index" ON "auth" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_permission" ON "permissions" USING btree ("action","resource");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_role_permission" ON "role_permissions" USING btree ("role","permission_id");--> statement-breakpoint
CREATE INDEX "user_type_index" ON "tokens" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "tokens_expires_at_index" ON "tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tokens_status_expires_index" ON "tokens" USING btree ("status","expires_at");