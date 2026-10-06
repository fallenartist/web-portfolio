import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_appearance_project_title_placement" AS ENUM('below', 'overlay');

    CREATE TABLE "appearance" (
      "id" serial PRIMARY KEY NOT NULL,
      "menu_background_color" varchar DEFAULT '#f4f4f4' NOT NULL,
      "project_title_placement" "enum_appearance_project_title_placement" DEFAULT 'below' NOT NULL,
      "project_title_font_size" numeric DEFAULT 112 NOT NULL,
      "project_title_mobile_font_size" numeric DEFAULT 48 NOT NULL,
      "project_title_dim_color" varchar DEFAULT '#000000' NOT NULL,
      "project_title_dim_intensity" numeric DEFAULT 35 NOT NULL,
      "story_text_width" numeric DEFAULT 50 NOT NULL,
      "story_text_font_size" numeric DEFAULT 30 NOT NULL,
      "story_text_quote_font_size" numeric DEFAULT 60 NOT NULL,
      "story_text_text_color" varchar DEFAULT '#222222' NOT NULL,
      "project_description_font_family" varchar DEFAULT 'October Condensed' NOT NULL,
      "project_description_font_size" numeric DEFAULT 30 NOT NULL,
      "project_description_text_color" varchar DEFAULT '#222222' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now(),
      "created_at" timestamp(3) with time zone DEFAULT now()
    );

    INSERT INTO "appearance" (
      "project_title_placement",
      "project_title_font_size",
      "project_title_mobile_font_size",
      "project_title_dim_color",
      "project_title_dim_intensity",
      "story_text_width",
      "story_text_font_size",
      "story_text_quote_font_size",
      "story_text_text_color",
      "project_description_font_family",
      "project_description_font_size",
      "project_description_text_color",
      "updated_at",
      "created_at"
    )
    SELECT
      "project_title_placement"::text::"enum_appearance_project_title_placement",
      COALESCE("project_title_font_size", 112),
      COALESCE("project_title_mobile_font_size", 48),
      COALESCE("project_title_dim_color", '#000000'),
      COALESCE("project_title_dim_intensity", 35),
      COALESCE("story_text_width", 50),
      COALESCE("story_text_font_size", 30),
      COALESCE("story_text_quote_font_size", 60),
      COALESCE("story_text_text_color", '#222222'),
      COALESCE("project_description_font_family", 'October Condensed'),
      COALESCE("project_description_font_size", 30),
      COALESCE("project_description_text_color", '#222222'),
      COALESCE("updated_at", now()),
      COALESCE("created_at", now())
    FROM "settings"
    ORDER BY "id"
    LIMIT 1;

    INSERT INTO "appearance" ("menu_background_color")
    SELECT '#f4f4f4'
    WHERE NOT EXISTS (SELECT 1 FROM "appearance");

    ALTER TABLE "settings"
      DROP COLUMN "project_title_placement",
      DROP COLUMN "project_title_font_size",
      DROP COLUMN "project_title_mobile_font_size",
      DROP COLUMN "project_title_dim_color",
      DROP COLUMN "project_title_dim_intensity",
      DROP COLUMN "story_text_width",
      DROP COLUMN "story_text_font_size",
      DROP COLUMN "story_text_quote_font_size",
      DROP COLUMN "story_text_text_color",
      DROP COLUMN "project_description_font_family",
      DROP COLUMN "project_description_font_size",
      DROP COLUMN "project_description_text_color";

    DROP TYPE "public"."enum_settings_project_title_placement";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_settings_project_title_placement" AS ENUM('below', 'overlay');

    ALTER TABLE "settings"
      ADD COLUMN "project_title_placement" "enum_settings_project_title_placement" DEFAULT 'below' NOT NULL,
      ADD COLUMN "project_title_font_size" numeric DEFAULT 112,
      ADD COLUMN "project_title_mobile_font_size" numeric DEFAULT 48 NOT NULL,
      ADD COLUMN "project_title_dim_color" varchar DEFAULT '#000000',
      ADD COLUMN "project_title_dim_intensity" numeric DEFAULT 35,
      ADD COLUMN "story_text_width" numeric DEFAULT 50 NOT NULL,
      ADD COLUMN "story_text_font_size" numeric DEFAULT 30 NOT NULL,
      ADD COLUMN "story_text_quote_font_size" numeric DEFAULT 60 NOT NULL,
      ADD COLUMN "story_text_text_color" varchar DEFAULT '#222222' NOT NULL,
      ADD COLUMN "project_description_font_family" varchar DEFAULT 'October Condensed' NOT NULL,
      ADD COLUMN "project_description_font_size" numeric DEFAULT 30 NOT NULL,
      ADD COLUMN "project_description_text_color" varchar DEFAULT '#222222' NOT NULL;

    UPDATE "settings" AS s
    SET
      "project_title_placement" = a."project_title_placement"::text::"enum_settings_project_title_placement",
      "project_title_font_size" = a."project_title_font_size",
      "project_title_mobile_font_size" = a."project_title_mobile_font_size",
      "project_title_dim_color" = a."project_title_dim_color",
      "project_title_dim_intensity" = a."project_title_dim_intensity",
      "story_text_width" = a."story_text_width",
      "story_text_font_size" = a."story_text_font_size",
      "story_text_quote_font_size" = a."story_text_quote_font_size",
      "story_text_text_color" = a."story_text_text_color",
      "project_description_font_family" = a."project_description_font_family",
      "project_description_font_size" = a."project_description_font_size",
      "project_description_text_color" = a."project_description_text_color"
    FROM "appearance" AS a
    WHERE a."id" = (SELECT MIN("id") FROM "appearance");

    DROP TABLE "appearance";
    DROP TYPE "public"."enum_appearance_project_title_placement";
  `)
}
