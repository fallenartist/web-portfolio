import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_page_image_width" AS ENUM('content', 'wide');
  CREATE TYPE "public"."enum_pages_blocks_page_video_width" AS ENUM('content', 'wide');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_page_image_width" AS ENUM('content', 'wide');
  CREATE TYPE "public"."enum__pages_v_blocks_page_video_width" AS ENUM('content', 'wide');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('en', 'pl');
  CREATE TABLE "pages_blocks_page_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_page_text_locales" (
    "text" jsonb,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "pages_blocks_page_image" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "image_id" integer,
    "width" "enum_pages_blocks_page_image_width" DEFAULT 'content',
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_page_image_locales" (
    "alt" varchar,
    "caption" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "pages_blocks_page_video" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "url" varchar,
    "width" "enum_pages_blocks_page_video_width" DEFAULT 'content',
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_page_video_locales" (
    "caption" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "pages" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_pages_status" DEFAULT 'draft'
  );

  CREATE TABLE "pages_locales" (
    "title" varchar,
    "meta_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_pages_v_blocks_page_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_page_text_locales" (
    "text" jsonb,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_pages_v_blocks_page_image" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "image_id" integer,
    "width" "enum__pages_v_blocks_page_image_width" DEFAULT 'content',
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_page_image_locales" (
    "alt" varchar,
    "caption" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_pages_v_blocks_page_video" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "url" varchar,
    "width" "enum__pages_v_blocks_page_video_width" DEFAULT 'content',
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_page_video_locales" (
    "caption" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_pages_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_slug" varchar,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__pages_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__pages_v_published_locale",
    "latest" boolean
  );

  CREATE TABLE "_pages_v_locales" (
    "version_title" varchar,
    "version_meta_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  ALTER TABLE "menus_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "pages_blocks_page_text" ADD CONSTRAINT "pages_blocks_page_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_text_locales" ADD CONSTRAINT "pages_blocks_page_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_page_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_image" ADD CONSTRAINT "pages_blocks_page_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_image" ADD CONSTRAINT "pages_blocks_page_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_image_locales" ADD CONSTRAINT "pages_blocks_page_image_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_page_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_video" ADD CONSTRAINT "pages_blocks_page_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_video_locales" ADD CONSTRAINT "pages_blocks_page_video_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_page_video"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_text" ADD CONSTRAINT "_pages_v_blocks_page_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_text_locales" ADD CONSTRAINT "_pages_v_blocks_page_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_page_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_image" ADD CONSTRAINT "_pages_v_blocks_page_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_image" ADD CONSTRAINT "_pages_v_blocks_page_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_image_locales" ADD CONSTRAINT "_pages_v_blocks_page_image_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_page_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_video" ADD CONSTRAINT "_pages_v_blocks_page_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_video_locales" ADD CONSTRAINT "_pages_v_blocks_page_video_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_page_video"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_page_text_order_idx" ON "pages_blocks_page_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_page_text_parent_id_idx" ON "pages_blocks_page_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_text_path_idx" ON "pages_blocks_page_text" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_page_text_locales_locale_parent_id_unique" ON "pages_blocks_page_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_page_text_locales_parent_id_idx" ON "pages_blocks_page_text_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_image_order_idx" ON "pages_blocks_page_image" USING btree ("_order");
  CREATE INDEX "pages_blocks_page_image_parent_id_idx" ON "pages_blocks_page_image" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_image_path_idx" ON "pages_blocks_page_image" USING btree ("_path");
  CREATE INDEX "pages_blocks_page_image_image_idx" ON "pages_blocks_page_image" USING btree ("image_id");
  CREATE UNIQUE INDEX "pages_blocks_page_image_locales_locale_parent_id_unique" ON "pages_blocks_page_image_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_page_image_locales_parent_id_idx" ON "pages_blocks_page_image_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_video_order_idx" ON "pages_blocks_page_video" USING btree ("_order");
  CREATE INDEX "pages_blocks_page_video_parent_id_idx" ON "pages_blocks_page_video" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_video_path_idx" ON "pages_blocks_page_video" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_page_video_locales_locale_parent_id_unique" ON "pages_blocks_page_video_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_page_video_locales_parent_id_idx" ON "pages_blocks_page_video_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_text_order_idx" ON "_pages_v_blocks_page_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_page_text_parent_id_idx" ON "_pages_v_blocks_page_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_text_path_idx" ON "_pages_v_blocks_page_text" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_page_text_locales_locale_parent_id_unique" ON "_pages_v_blocks_page_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_page_text_locales_parent_id_idx" ON "_pages_v_blocks_page_text_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_image_order_idx" ON "_pages_v_blocks_page_image" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_page_image_parent_id_idx" ON "_pages_v_blocks_page_image" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_image_path_idx" ON "_pages_v_blocks_page_image" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_page_image_image_idx" ON "_pages_v_blocks_page_image" USING btree ("image_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_page_image_locales_locale_parent_id_unique" ON "_pages_v_blocks_page_image_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_page_image_locales_parent_id_idx" ON "_pages_v_blocks_page_image_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_video_order_idx" ON "_pages_v_blocks_page_video" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_page_video_parent_id_idx" ON "_pages_v_blocks_page_video" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_video_path_idx" ON "_pages_v_blocks_page_video" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_page_video_locales_locale_parent_id_unique" ON "_pages_v_blocks_page_video_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_page_video_locales_parent_id_idx" ON "_pages_v_blocks_page_video_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_locales_parent_id_idx" ON "_pages_v_locales" USING btree ("_parent_id");
  ALTER TABLE "menus_rels" ADD CONSTRAINT "menus_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "menus_rels_pages_id_idx" ON "menus_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "menus_rels" DROP CONSTRAINT "menus_rels_pages_fk";
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
   ALTER TABLE "pages_blocks_page_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_page_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_page_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_page_image_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_page_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_page_video_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_page_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_page_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_page_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_page_image_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_page_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_page_video_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_page_text" CASCADE;
  DROP TABLE "pages_blocks_page_text_locales" CASCADE;
  DROP TABLE "pages_blocks_page_image" CASCADE;
  DROP TABLE "pages_blocks_page_image_locales" CASCADE;
  DROP TABLE "pages_blocks_page_video" CASCADE;
  DROP TABLE "pages_blocks_page_video_locales" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_page_text" CASCADE;
  DROP TABLE "_pages_v_blocks_page_text_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_page_image" CASCADE;
  DROP TABLE "_pages_v_blocks_page_image_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_page_video" CASCADE;
  DROP TABLE "_pages_v_blocks_page_video_locales" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;


  DROP INDEX "menus_rels_pages_id_idx";
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  ALTER TABLE "menus_rels" DROP COLUMN "pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  DROP TYPE "public"."enum_pages_blocks_page_image_width";
  DROP TYPE "public"."enum_pages_blocks_page_video_width";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_page_image_width";
  DROP TYPE "public"."enum__pages_v_blocks_page_video_width";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";`)
}
