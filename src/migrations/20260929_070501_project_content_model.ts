import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_hero_type" AS ENUM('image', 'video');
  CREATE TYPE "public"."enum_projects_hero_video_fit" AS ENUM('cover', 'contain');
  ALTER TABLE "projects_blocks_video" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "projects_blocks_video" ADD COLUMN "loop" boolean DEFAULT false;
  ALTER TABLE "projects_blocks_video" ADD COLUMN "muted" boolean DEFAULT false;
  ALTER TABLE "projects_blocks_video" ADD COLUMN "controls" boolean DEFAULT true;
  ALTER TABLE "projects_blocks_text" ADD COLUMN "quote" boolean DEFAULT false;
  ALTER TABLE "projects" ADD COLUMN "hero_type" "enum_projects_hero_type" DEFAULT 'image' NOT NULL;
  ALTER TABLE "projects" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "projects" ADD COLUMN "hero_video_u_r_l" varchar;
  ALTER TABLE "projects" ADD COLUMN "hero_video_cover_id" integer;
  ALTER TABLE "projects" ADD COLUMN "hero_video_fit" "enum_projects_hero_video_fit" DEFAULT 'cover';
  ALTER TABLE "projects" ADD COLUMN "hero_autoplay" boolean DEFAULT false;
  ALTER TABLE "projects" ADD COLUMN "hero_loop" boolean DEFAULT false;
  ALTER TABLE "projects" ADD COLUMN "hero_muted" boolean DEFAULT false;
  ALTER TABLE "projects" ADD COLUMN "hero_controls" boolean DEFAULT true;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_hero_video_cover_id_media_id_fk" FOREIGN KEY ("hero_video_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "projects_hero_hero_image_idx" ON "projects" USING btree ("hero_image_id");
  CREATE INDEX "projects_hero_hero_video_cover_idx" ON "projects" USING btree ("hero_video_cover_id");
  UPDATE "projects" AS project
  SET "hero_image_id" = (
    SELECT gallery."image_id"
    FROM "projects_gallery" AS gallery
    WHERE gallery."_parent_id" = project."id"
    ORDER BY gallery."hero" DESC NULLS LAST, gallery."_order" ASC
    LIMIT 1
  );
  INSERT INTO "projects_blocks_image" (
    "_order", "_parent_id", "_path", "id", "image_id", "caption", "width", "position"
  )
  SELECT
    gallery."_order",
    gallery."_parent_id",
    'story',
    'migrated-gallery-' || gallery."id",
    gallery."image_id",
    gallery."title",
    'wide',
    'center'
  FROM "projects_gallery" AS gallery
  WHERE gallery."image_id" IS NOT NULL
    AND gallery."image_id" IS DISTINCT FROM (
      SELECT selected."image_id"
      FROM "projects_gallery" AS selected
      WHERE selected."_parent_id" = gallery."_parent_id"
      ORDER BY selected."hero" DESC NULLS LAST, selected."_order" ASC
      LIMIT 1
    )
    AND NOT EXISTS (
      SELECT 1 FROM "projects_blocks_image" block WHERE block."_parent_id" = gallery."_parent_id" AND block."_path" = 'story'
      UNION ALL
      SELECT 1 FROM "projects_blocks_text" block WHERE block."_parent_id" = gallery."_parent_id" AND block."_path" = 'story'
      UNION ALL
      SELECT 1 FROM "projects_blocks_video" block WHERE block."_parent_id" = gallery."_parent_id" AND block."_path" = 'story'
    );
  UPDATE "projects_blocks_video"
  SET "autoplay" = true, "loop" = true, "muted" = true, "controls" = false
  WHERE "playback" = 'background';
  ALTER TABLE "projects_gallery" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_gallery" CASCADE;
  ALTER TABLE "projects_blocks_image" DROP COLUMN "width";
  ALTER TABLE "projects_blocks_image" DROP COLUMN "position";
  ALTER TABLE "projects_blocks_video" DROP COLUMN "playback";
  ALTER TABLE "projects_blocks_video" DROP COLUMN "aspect_ratio";
  ALTER TABLE "projects_blocks_video" DROP COLUMN "width";
  ALTER TABLE "projects_blocks_video" DROP COLUMN "position";
  ALTER TABLE "projects_blocks_text" DROP COLUMN "width";
  ALTER TABLE "projects_blocks_text" DROP COLUMN "position";
  ALTER TABLE "projects_blocks_text" DROP COLUMN "text_align";
  ALTER TABLE "projects" DROP COLUMN "hero_presentation_show_title";
  ALTER TABLE "projects" DROP COLUMN "hero_presentation_title_position";
  ALTER TABLE "projects" DROP COLUMN "hero_presentation_tint_color";
  ALTER TABLE "projects" DROP COLUMN "hero_presentation_tint_opacity";
  DROP TYPE "public"."enum_projects_blocks_image_width";
  DROP TYPE "public"."enum_projects_blocks_image_position";
  DROP TYPE "public"."enum_projects_blocks_video_playback";
  DROP TYPE "public"."enum_projects_blocks_video_aspect_ratio";
  DROP TYPE "public"."enum_projects_blocks_video_width";
  DROP TYPE "public"."enum_projects_blocks_video_position";
  DROP TYPE "public"."enum_projects_blocks_text_width";
  DROP TYPE "public"."enum_projects_blocks_text_position";
  DROP TYPE "public"."enum_projects_blocks_text_text_align";
  DROP TYPE "public"."enum_projects_hero_presentation_title_position";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_blocks_image_width" AS ENUM('full', 'wide', 'half');
  CREATE TYPE "public"."enum_projects_blocks_image_position" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_projects_blocks_video_playback" AS ENUM('standard', 'background');
  CREATE TYPE "public"."enum_projects_blocks_video_aspect_ratio" AS ENUM('16-9', '4-3', '1-1', '9-16');
  CREATE TYPE "public"."enum_projects_blocks_video_width" AS ENUM('full', 'wide', 'half');
  CREATE TYPE "public"."enum_projects_blocks_video_position" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_projects_blocks_text_width" AS ENUM('narrow', 'medium', 'wide');
  CREATE TYPE "public"."enum_projects_blocks_text_position" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_projects_blocks_text_text_align" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_projects_hero_presentation_title_position" AS ENUM('top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right');
  CREATE TABLE "projects_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"title" varchar,
  	"hero" boolean DEFAULT false,
  	"featured" boolean DEFAULT false
  );
  
  ALTER TABLE "projects" DROP CONSTRAINT "projects_hero_image_id_media_id_fk";
  
  ALTER TABLE "projects" DROP CONSTRAINT "projects_hero_video_cover_id_media_id_fk";
  
  DROP INDEX "projects_hero_hero_image_idx";
  DROP INDEX "projects_hero_hero_video_cover_idx";
  ALTER TABLE "projects_blocks_image" ADD COLUMN "width" "enum_projects_blocks_image_width" DEFAULT 'wide' NOT NULL;
  ALTER TABLE "projects_blocks_image" ADD COLUMN "position" "enum_projects_blocks_image_position" DEFAULT 'center';
  ALTER TABLE "projects_blocks_video" ADD COLUMN "playback" "enum_projects_blocks_video_playback" DEFAULT 'standard' NOT NULL;
  ALTER TABLE "projects_blocks_video" ADD COLUMN "aspect_ratio" "enum_projects_blocks_video_aspect_ratio" DEFAULT '16-9' NOT NULL;
  ALTER TABLE "projects_blocks_video" ADD COLUMN "width" "enum_projects_blocks_video_width" DEFAULT 'wide' NOT NULL;
  ALTER TABLE "projects_blocks_video" ADD COLUMN "position" "enum_projects_blocks_video_position" DEFAULT 'center';
  ALTER TABLE "projects_blocks_text" ADD COLUMN "width" "enum_projects_blocks_text_width" DEFAULT 'narrow' NOT NULL;
  ALTER TABLE "projects_blocks_text" ADD COLUMN "position" "enum_projects_blocks_text_position" DEFAULT 'center' NOT NULL;
  ALTER TABLE "projects_blocks_text" ADD COLUMN "text_align" "enum_projects_blocks_text_text_align" DEFAULT 'left' NOT NULL;
  ALTER TABLE "projects" ADD COLUMN "hero_presentation_show_title" boolean DEFAULT false;
  ALTER TABLE "projects" ADD COLUMN "hero_presentation_title_position" "enum_projects_hero_presentation_title_position" DEFAULT 'center';
  ALTER TABLE "projects" ADD COLUMN "hero_presentation_tint_color" varchar DEFAULT '#000000';
  ALTER TABLE "projects" ADD COLUMN "hero_presentation_tint_opacity" numeric DEFAULT 35;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_gallery_order_idx" ON "projects_gallery" USING btree ("_order");
  CREATE INDEX "projects_gallery_parent_id_idx" ON "projects_gallery" USING btree ("_parent_id");
  CREATE INDEX "projects_gallery_image_idx" ON "projects_gallery" USING btree ("image_id");
  ALTER TABLE "projects_blocks_video" DROP COLUMN "autoplay";
  ALTER TABLE "projects_blocks_video" DROP COLUMN "loop";
  ALTER TABLE "projects_blocks_video" DROP COLUMN "muted";
  ALTER TABLE "projects_blocks_video" DROP COLUMN "controls";
  ALTER TABLE "projects_blocks_text" DROP COLUMN "quote";
  ALTER TABLE "projects" DROP COLUMN "hero_type";
  ALTER TABLE "projects" DROP COLUMN "hero_image_id";
  ALTER TABLE "projects" DROP COLUMN "hero_video_u_r_l";
  ALTER TABLE "projects" DROP COLUMN "hero_video_cover_id";
  ALTER TABLE "projects" DROP COLUMN "hero_video_fit";
  ALTER TABLE "projects" DROP COLUMN "hero_autoplay";
  ALTER TABLE "projects" DROP COLUMN "hero_loop";
  ALTER TABLE "projects" DROP COLUMN "hero_muted";
  ALTER TABLE "projects" DROP COLUMN "hero_controls";
  DROP TYPE "public"."enum_projects_hero_type";
  DROP TYPE "public"."enum_projects_hero_video_fit";`)
}
