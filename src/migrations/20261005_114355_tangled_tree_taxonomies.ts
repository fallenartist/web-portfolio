import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "projects_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "tags_id" integer
  );

  CREATE TABLE "agencies" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "tags" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  WITH "source_tags" AS (
    SELECT DISTINCT
      btrim("tag") AS "title",
      lower(regexp_replace(regexp_replace(btrim("tag"), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) AS "base_slug"
    FROM "projects_tags"
    WHERE "tag" IS NOT NULL AND btrim("tag") <> ''
  ),
  "ranked_tags" AS (
    SELECT
      "title",
      "base_slug",
      row_number() OVER (PARTITION BY "base_slug" ORDER BY "title") AS "slug_rank"
    FROM "source_tags"
  )
  INSERT INTO "tags" ("title", "slug")
  SELECT
    "title",
    CASE
      WHEN "base_slug" = '' THEN 'tag-' || substr(md5("title"), 1, 8)
      WHEN "slug_rank" = 1 THEN "base_slug"
      ELSE "base_slug" || '-' || substr(md5("title"), 1, 8)
    END
  FROM "ranked_tags";

  INSERT INTO "projects_rels" ("order", "parent_id", "path", "tags_id")
  SELECT "project_tag"."_order", "project_tag"."_parent_id", 'tags', "tag"."id"
  FROM "projects_tags" AS "project_tag"
  INNER JOIN "tags" AS "tag" ON "tag"."title" = btrim("project_tag"."tag")
  WHERE "project_tag"."tag" IS NOT NULL AND btrim("project_tag"."tag") <> '';

  ALTER TABLE "projects_tags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_tags" CASCADE;
  ALTER TABLE "projects" ADD COLUMN "agency_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "agencies_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_tags_id_idx" ON "projects_rels" USING btree ("tags_id");
  CREATE INDEX "agencies_title_idx" ON "agencies" USING btree ("title");
  CREATE UNIQUE INDEX "agencies_slug_idx" ON "agencies" USING btree ("slug");
  CREATE INDEX "agencies_updated_at_idx" ON "agencies" USING btree ("updated_at");
  CREATE INDEX "agencies_created_at_idx" ON "agencies" USING btree ("created_at");
  CREATE INDEX "tags_title_idx" ON "tags" USING btree ("title");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  ALTER TABLE "projects" ADD CONSTRAINT "projects_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agencies_fk" FOREIGN KEY ("agencies_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_agency_idx" ON "projects" USING btree ("agency_id");
  CREATE INDEX "payload_locked_documents_rels_agencies_id_idx" ON "payload_locked_documents_rels" USING btree ("agencies_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "projects_tags" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "tag" varchar
  );

  INSERT INTO "projects_tags" ("_order", "_parent_id", "id", "tag")
  SELECT
    coalesce("project_tag"."order", 0),
    "project_tag"."parent_id",
    md5(
      "project_tag"."parent_id"::text || '-' || "tag"."id"::text || '-' ||
      coalesce("project_tag"."order", 0)::text
    ),
    "tag"."title"
  FROM "projects_rels" AS "project_tag"
  INNER JOIN "tags" AS "tag" ON "tag"."id" = "project_tag"."tags_id"
  WHERE "project_tag"."path" = 'tags';

  ALTER TABLE "projects" DROP CONSTRAINT "projects_agency_id_agencies_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_agencies_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tags_fk";
  DROP INDEX "projects_agency_idx";
  DROP INDEX "payload_locked_documents_rels_agencies_id_idx";
  DROP INDEX "payload_locked_documents_rels_tags_id_idx";
  ALTER TABLE "projects" DROP COLUMN "agency_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "agencies_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tags_id";
  ALTER TABLE "projects_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agencies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "agencies" CASCADE;
  DROP TABLE "tags" CASCADE;
  ALTER TABLE "projects_tags" ADD CONSTRAINT "projects_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_tags_order_idx" ON "projects_tags" USING btree ("_order");
  CREATE INDEX "projects_tags_parent_id_idx" ON "projects_tags" USING btree ("_parent_id");
  `)
}
