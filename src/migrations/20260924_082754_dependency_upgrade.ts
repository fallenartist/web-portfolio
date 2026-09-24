import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Additive and idempotent: older development databases already contain some
// of these fields. Preserve legacy columns and their data for backup/rollback.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE t.typname = 'enum_menus_items_type' AND n.nspname = 'public') THEN
      CREATE TYPE "public"."enum_menus_items_type" AS ENUM('internal', 'external');
    END IF;
  END $$;
  CREATE TABLE IF NOT EXISTS "users_sessions" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "created_at" timestamp(3) with time zone,
    "expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "menus_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "type" "enum_menus_items_type" DEFAULT 'internal' NOT NULL,
    "external_link" varchar,
    "open_in_new_tab" boolean DEFAULT false
  );

  CREATE TABLE IF NOT EXISTS "menus" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "menus_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "categories_id" integer,
    "projects_id" integer
  );

  CREATE TABLE IF NOT EXISTS "payload_kv" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "data" jsonb NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_title" varchar DEFAULT 'Design Portfolio' NOT NULL,
    "meta_description" varchar DEFAULT 'A portfolio of design work',
    "root_category_title" varchar DEFAULT 'WORK',
    "root_category_slug" varchar DEFAULT 'work',
    "enable_autoplay" boolean DEFAULT true,
    "autoplay_delay" numeric DEFAULT 5000,
    "autoplay_interval" numeric DEFAULT 3000,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;
  ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "color" varchar;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "excerpt" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_url" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_width" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_height" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_filename" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_url" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_width" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_height" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_filename" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_large_url" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_large_width" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_large_height" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_large_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_large_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_large_filename" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "menus_id" integer;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_sessions_parent_id_fk' AND conrelid = 'public.users_sessions'::regclass) THEN
      ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menus_items_parent_id_fk' AND conrelid = 'public.menus_items'::regclass) THEN
      ALTER TABLE "menus_items" ADD CONSTRAINT "menus_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menus_rels_parent_fk' AND conrelid = 'public.menus_rels'::regclass) THEN
      ALTER TABLE "menus_rels" ADD CONSTRAINT "menus_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menus_rels_categories_fk' AND conrelid = 'public.menus_rels'::regclass) THEN
      ALTER TABLE "menus_rels" ADD CONSTRAINT "menus_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menus_rels_projects_fk' AND conrelid = 'public.menus_rels'::regclass) THEN
      ALTER TABLE "menus_rels" ADD CONSTRAINT "menus_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menus_items_order_idx" ON "menus_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menus_items_parent_id_idx" ON "menus_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menus_updated_at_idx" ON "menus" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "menus_created_at_idx" ON "menus" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "menus_rels_order_idx" ON "menus_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "menus_rels_parent_idx" ON "menus_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "menus_rels_path_idx" ON "menus_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "menus_rels_categories_id_idx" ON "menus_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "menus_rels_projects_id_idx" ON "menus_rels" USING btree ("projects_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_menus_fk' AND conrelid = 'public.payload_locked_documents_rels'::regclass) THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menus_fk" FOREIGN KEY ("menus_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "media_sizes_small_sizes_small_filename_idx" ON "media" USING btree ("sizes_small_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_medium_sizes_medium_filename_idx" ON "media" USING btree ("sizes_medium_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_menus_id_idx" ON "payload_locked_documents_rels" USING btree ("menus_id");`)
}

export async function down(): Promise<void> {
  throw new Error(
    'This migration adopts existing development tables. Restore the pre-upgrade database backup to roll back without deleting pre-existing content.',
  )
}
