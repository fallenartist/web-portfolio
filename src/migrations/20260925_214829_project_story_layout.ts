import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_blocks_image_width" AS ENUM('full', 'wide', 'half');
  CREATE TYPE "public"."enum_projects_blocks_image_position" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_projects_blocks_text_width" AS ENUM('narrow', 'medium', 'wide');
  CREATE TYPE "public"."enum_projects_blocks_text_position" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_projects_blocks_text_text_align" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_projects_hero_presentation_title_position" AS ENUM('top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right');
  CREATE TABLE "projects_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"width" "enum_projects_blocks_image_width" DEFAULT 'wide' NOT NULL,
  	"position" "enum_projects_blocks_image_position" DEFAULT 'center',
  	"block_name" varchar
  );
  
  CREATE TABLE "projects_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb NOT NULL,
  	"width" "enum_projects_blocks_text_width" DEFAULT 'narrow' NOT NULL,
  	"position" "enum_projects_blocks_text_position" DEFAULT 'center' NOT NULL,
  	"text_align" "enum_projects_blocks_text_text_align" DEFAULT 'left' NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "projects" ADD COLUMN "hero_presentation_show_title" boolean DEFAULT false;
  ALTER TABLE "projects" ADD COLUMN "hero_presentation_title_position" "enum_projects_hero_presentation_title_position" DEFAULT 'center';
  ALTER TABLE "projects" ADD COLUMN "hero_presentation_tint_color" varchar DEFAULT '#000000';
  ALTER TABLE "projects" ADD COLUMN "hero_presentation_tint_opacity" numeric DEFAULT 35;
  ALTER TABLE "projects_blocks_image" ADD CONSTRAINT "projects_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_blocks_image" ADD CONSTRAINT "projects_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_text" ADD CONSTRAINT "projects_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_blocks_image_order_idx" ON "projects_blocks_image" USING btree ("_order");
  CREATE INDEX "projects_blocks_image_parent_id_idx" ON "projects_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_image_path_idx" ON "projects_blocks_image" USING btree ("_path");
  CREATE INDEX "projects_blocks_image_image_idx" ON "projects_blocks_image" USING btree ("image_id");
  CREATE INDEX "projects_blocks_text_order_idx" ON "projects_blocks_text" USING btree ("_order");
  CREATE INDEX "projects_blocks_text_parent_id_idx" ON "projects_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_text_path_idx" ON "projects_blocks_text" USING btree ("_path");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "projects_blocks_image" CASCADE;
  DROP TABLE "projects_blocks_text" CASCADE;
  ALTER TABLE "projects" DROP COLUMN "hero_presentation_show_title";
  ALTER TABLE "projects" DROP COLUMN "hero_presentation_title_position";
  ALTER TABLE "projects" DROP COLUMN "hero_presentation_tint_color";
  ALTER TABLE "projects" DROP COLUMN "hero_presentation_tint_opacity";
  DROP TYPE "public"."enum_projects_blocks_image_width";
  DROP TYPE "public"."enum_projects_blocks_image_position";
  DROP TYPE "public"."enum_projects_blocks_text_width";
  DROP TYPE "public"."enum_projects_blocks_text_position";
  DROP TYPE "public"."enum_projects_blocks_text_text_align";
  DROP TYPE "public"."enum_projects_hero_presentation_title_position";`)
}
