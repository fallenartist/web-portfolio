import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Copy existing text into English locale rows before removing the original columns.
// Images, relationships, slugs and block ordering remain shared between languages.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "_locales" AS ENUM ('en', 'pl');

    CREATE TABLE "projects_blocks_image_locales" (
      "caption" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL,
      CONSTRAINT "projects_blocks_image_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "projects_blocks_image"("id") ON DELETE CASCADE
    );

    INSERT INTO "projects_blocks_image_locales" ("caption", "_locale", "_parent_id")
      SELECT "caption", 'en', id FROM "projects_blocks_image";

    ALTER TABLE "projects_blocks_image" DROP COLUMN "caption";

    CREATE UNIQUE INDEX "projects_blocks_image_locales_locale_parent_id_unique" ON "projects_blocks_image_locales" ("_locale", "_parent_id");

    CREATE TABLE "projects_blocks_video_locales" (
      "caption" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL,
      CONSTRAINT "projects_blocks_video_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "projects_blocks_video"("id") ON DELETE CASCADE
    );

    INSERT INTO "projects_blocks_video_locales" ("caption", "_locale", "_parent_id")
      SELECT "caption", 'en', id FROM "projects_blocks_video";

    ALTER TABLE "projects_blocks_video" DROP COLUMN "caption";

    CREATE UNIQUE INDEX "projects_blocks_video_locales_locale_parent_id_unique" ON "projects_blocks_video_locales" ("_locale", "_parent_id");

    CREATE TABLE "projects_blocks_text_locales" (
      "content" jsonb NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL,
      CONSTRAINT "projects_blocks_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "projects_blocks_text"("id") ON DELETE CASCADE
    );

    INSERT INTO "projects_blocks_text_locales" ("content", "_locale", "_parent_id")
      SELECT "content", 'en', id FROM "projects_blocks_text";

    ALTER TABLE "projects_blocks_text" DROP COLUMN "content";

    CREATE UNIQUE INDEX "projects_blocks_text_locales_locale_parent_id_unique" ON "projects_blocks_text_locales" ("_locale", "_parent_id");

    CREATE TABLE "projects_locales" (
      "title" varchar NOT NULL,
      "description" jsonb,
      "excerpt" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL,
      CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "projects"("id") ON DELETE CASCADE
    );

    INSERT INTO "projects_locales" ("title", "description", "excerpt", "_locale", "_parent_id")
      SELECT "title", "description", "excerpt", 'en', id FROM "projects";

    ALTER TABLE "projects" DROP COLUMN "title", DROP COLUMN "description", DROP COLUMN "excerpt";

    CREATE INDEX "projects_title_idx" ON "projects_locales" ("title", "_locale");

    CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" ("_locale", "_parent_id");

    CREATE TABLE "disciplines_locales" (
      "title" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL,
      CONSTRAINT "disciplines_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "disciplines"("id") ON DELETE CASCADE
    );

    INSERT INTO "disciplines_locales" ("title", "_locale", "_parent_id")
      SELECT "title", 'en', id FROM "disciplines";

    ALTER TABLE "disciplines" DROP COLUMN "title";

    CREATE UNIQUE INDEX "disciplines_locales_locale_parent_id_unique" ON "disciplines_locales" ("_locale", "_parent_id");

    CREATE TABLE "industries_locales" (
      "title" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL,
      CONSTRAINT "industries_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "industries"("id") ON DELETE CASCADE
    );

    INSERT INTO "industries_locales" ("title", "_locale", "_parent_id")
      SELECT "title", 'en', id FROM "industries";

    ALTER TABLE "industries" DROP COLUMN "title";

    CREATE INDEX "industries_title_idx" ON "industries_locales" ("title", "_locale");

    CREATE UNIQUE INDEX "industries_locales_locale_parent_id_unique" ON "industries_locales" ("_locale", "_parent_id");

    CREATE TABLE "tags_locales" (
      "title" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL,
      CONSTRAINT "tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "tags"("id") ON DELETE CASCADE
    );

    INSERT INTO "tags_locales" ("title", "_locale", "_parent_id")
      SELECT "title", 'en', id FROM "tags";

    ALTER TABLE "tags" DROP COLUMN "title";

    CREATE INDEX "tags_title_idx" ON "tags_locales" ("title", "_locale");

    CREATE UNIQUE INDEX "tags_locales_locale_parent_id_unique" ON "tags_locales" ("_locale", "_parent_id");

    CREATE TABLE "media_locales" (
      "alt" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL,
      CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "media"("id") ON DELETE CASCADE
    );

    INSERT INTO "media_locales" ("alt", "_locale", "_parent_id")
      SELECT "alt", 'en', id FROM "media";

    ALTER TABLE "media" DROP COLUMN "alt";

    CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" ("_locale", "_parent_id");

    CREATE TABLE "menus_items_sub_items_locales" (
      "title" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL,
      CONSTRAINT "menus_items_sub_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "menus_items_sub_items"("id") ON DELETE CASCADE
    );

    INSERT INTO "menus_items_sub_items_locales" ("title", "_locale", "_parent_id")
      SELECT "title", 'en', id FROM "menus_items_sub_items";

    ALTER TABLE "menus_items_sub_items" DROP COLUMN "title";

    CREATE UNIQUE INDEX "menus_items_sub_items_locales_locale_parent_id_unique" ON "menus_items_sub_items_locales" ("_locale", "_parent_id");

    CREATE TABLE "menus_items_locales" (
      "title" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL,
      CONSTRAINT "menus_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "menus_items"("id") ON DELETE CASCADE
    );

    INSERT INTO "menus_items_locales" ("title", "_locale", "_parent_id")
      SELECT "title", 'en', id FROM "menus_items";

    ALTER TABLE "menus_items" DROP COLUMN "title";

    CREATE UNIQUE INDEX "menus_items_locales_locale_parent_id_unique" ON "menus_items_locales" ("_locale", "_parent_id");

    CREATE TABLE "settings_locales" (
      "site_title" varchar DEFAULT 'Design Portfolio' NOT NULL,
      "meta_description" varchar DEFAULT 'A portfolio of design work',
      "root_discipline_title" varchar DEFAULT 'WORK',
      "project_guide_title" varchar DEFAULT 'Projects' NOT NULL,
      "project_guide_instruction" varchar DEFAULT 'Select a node or connection to explore related projects.' NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL,
      CONSTRAINT "settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "settings"("id") ON DELETE CASCADE
    );

    INSERT INTO "settings_locales" ("site_title", "meta_description", "root_discipline_title", "project_guide_title", "project_guide_instruction", "_locale", "_parent_id")
      SELECT "site_title", "meta_description", "root_discipline_title", "project_guide_title", "project_guide_instruction", 'en', id FROM "settings";

    ALTER TABLE "settings" DROP COLUMN "site_title", DROP COLUMN "meta_description", DROP COLUMN "root_discipline_title", DROP COLUMN "project_guide_title", DROP COLUMN "project_guide_instruction";

    CREATE UNIQUE INDEX "settings_locales_locale_parent_id_unique" ON "settings_locales" ("_locale", "_parent_id");
  `)
}

// Rolling back restores English content; export Polish translations before rollback.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "projects_blocks_image" ADD COLUMN "caption" varchar;

    UPDATE "projects_blocks_image" AS source SET "caption" = localized."caption"
      FROM "projects_blocks_image_locales" AS localized WHERE localized."_parent_id" = source.id AND localized."_locale" = 'en';

    DROP TABLE "projects_blocks_image_locales";

    ALTER TABLE "projects_blocks_video" ADD COLUMN "caption" varchar;

    UPDATE "projects_blocks_video" AS source SET "caption" = localized."caption"
      FROM "projects_blocks_video_locales" AS localized WHERE localized."_parent_id" = source.id AND localized."_locale" = 'en';

    DROP TABLE "projects_blocks_video_locales";

    ALTER TABLE "projects_blocks_text" ADD COLUMN "content" jsonb;

    UPDATE "projects_blocks_text" AS source SET "content" = localized."content"
      FROM "projects_blocks_text_locales" AS localized WHERE localized."_parent_id" = source.id AND localized."_locale" = 'en';

    ALTER TABLE "projects_blocks_text" ALTER COLUMN "content" SET NOT NULL;

    DROP TABLE "projects_blocks_text_locales";

    ALTER TABLE "projects" ADD COLUMN "title" varchar, ADD COLUMN "description" jsonb, ADD COLUMN "excerpt" varchar;

    UPDATE "projects" AS source SET "title" = localized."title", "description" = localized."description", "excerpt" = localized."excerpt"
      FROM "projects_locales" AS localized WHERE localized."_parent_id" = source.id AND localized."_locale" = 'en';

    ALTER TABLE "projects" ALTER COLUMN "title" SET NOT NULL;

    DROP TABLE "projects_locales";

    CREATE INDEX "projects_title_idx" ON "projects" ("title");

    ALTER TABLE "disciplines" ADD COLUMN "title" varchar;

    UPDATE "disciplines" AS source SET "title" = localized."title"
      FROM "disciplines_locales" AS localized WHERE localized."_parent_id" = source.id AND localized."_locale" = 'en';

    ALTER TABLE "disciplines" ALTER COLUMN "title" SET NOT NULL;

    DROP TABLE "disciplines_locales";

    ALTER TABLE "industries" ADD COLUMN "title" varchar;

    UPDATE "industries" AS source SET "title" = localized."title"
      FROM "industries_locales" AS localized WHERE localized."_parent_id" = source.id AND localized."_locale" = 'en';

    ALTER TABLE "industries" ALTER COLUMN "title" SET NOT NULL;

    DROP TABLE "industries_locales";

    CREATE INDEX "industries_title_idx" ON "industries" ("title");

    ALTER TABLE "tags" ADD COLUMN "title" varchar;

    UPDATE "tags" AS source SET "title" = localized."title"
      FROM "tags_locales" AS localized WHERE localized."_parent_id" = source.id AND localized."_locale" = 'en';

    ALTER TABLE "tags" ALTER COLUMN "title" SET NOT NULL;

    DROP TABLE "tags_locales";

    CREATE INDEX "tags_title_idx" ON "tags" ("title");

    ALTER TABLE "media" ADD COLUMN "alt" varchar;

    UPDATE "media" AS source SET "alt" = localized."alt"
      FROM "media_locales" AS localized WHERE localized."_parent_id" = source.id AND localized."_locale" = 'en';

    DROP TABLE "media_locales";

    ALTER TABLE "menus_items_sub_items" ADD COLUMN "title" varchar;

    UPDATE "menus_items_sub_items" AS source SET "title" = localized."title"
      FROM "menus_items_sub_items_locales" AS localized WHERE localized."_parent_id" = source.id AND localized."_locale" = 'en';

    ALTER TABLE "menus_items_sub_items" ALTER COLUMN "title" SET NOT NULL;

    DROP TABLE "menus_items_sub_items_locales";

    ALTER TABLE "menus_items" ADD COLUMN "title" varchar;

    UPDATE "menus_items" AS source SET "title" = localized."title"
      FROM "menus_items_locales" AS localized WHERE localized."_parent_id" = source.id AND localized."_locale" = 'en';

    ALTER TABLE "menus_items" ALTER COLUMN "title" SET NOT NULL;

    DROP TABLE "menus_items_locales";

    ALTER TABLE "settings" ADD COLUMN "site_title" varchar DEFAULT 'Design Portfolio', ADD COLUMN "meta_description" varchar DEFAULT 'A portfolio of design work', ADD COLUMN "root_discipline_title" varchar DEFAULT 'WORK', ADD COLUMN "project_guide_title" varchar DEFAULT 'Projects', ADD COLUMN "project_guide_instruction" varchar DEFAULT 'Select a node or connection to explore related projects.';

    UPDATE "settings" AS source SET "site_title" = localized."site_title", "meta_description" = localized."meta_description", "root_discipline_title" = localized."root_discipline_title", "project_guide_title" = localized."project_guide_title", "project_guide_instruction" = localized."project_guide_instruction"
      FROM "settings_locales" AS localized WHERE localized."_parent_id" = source.id AND localized."_locale" = 'en';

    ALTER TABLE "settings" ALTER COLUMN "site_title" SET NOT NULL;

    ALTER TABLE "settings" ALTER COLUMN "project_guide_title" SET NOT NULL;

    ALTER TABLE "settings" ALTER COLUMN "project_guide_instruction" SET NOT NULL;

    DROP TABLE "settings_locales";

    DROP TYPE "_locales";
  `)
}
