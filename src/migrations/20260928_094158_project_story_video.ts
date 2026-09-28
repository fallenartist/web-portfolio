import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_blocks_video_playback" AS ENUM('standard', 'background');
  CREATE TYPE "public"."enum_projects_blocks_video_aspect_ratio" AS ENUM('16-9', '4-3', '1-1', '9-16');
  CREATE TYPE "public"."enum_projects_blocks_video_width" AS ENUM('full', 'wide', 'half');
  CREATE TYPE "public"."enum_projects_blocks_video_position" AS ENUM('left', 'center', 'right');
  CREATE TABLE "projects_blocks_video" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "url" varchar NOT NULL,
    "poster_id" integer,
    "caption" varchar,
    "playback" "enum_projects_blocks_video_playback" DEFAULT 'standard' NOT NULL,
    "aspect_ratio" "enum_projects_blocks_video_aspect_ratio" DEFAULT '16-9' NOT NULL,
    "width" "enum_projects_blocks_video_width" DEFAULT 'wide' NOT NULL,
    "position" "enum_projects_blocks_video_position" DEFAULT 'center',
    "block_name" varchar
  );

  ALTER TABLE "projects_blocks_video" ADD CONSTRAINT "projects_blocks_video_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_blocks_video" ADD CONSTRAINT "projects_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_blocks_video_order_idx" ON "projects_blocks_video" USING btree ("_order");
  CREATE INDEX "projects_blocks_video_parent_id_idx" ON "projects_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_video_path_idx" ON "projects_blocks_video" USING btree ("_path");
  CREATE INDEX "projects_blocks_video_poster_idx" ON "projects_blocks_video" USING btree ("poster_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "projects_blocks_video" CASCADE;
  DROP TYPE "public"."enum_projects_blocks_video_playback";
  DROP TYPE "public"."enum_projects_blocks_video_aspect_ratio";
  DROP TYPE "public"."enum_projects_blocks_video_width";
  DROP TYPE "public"."enum_projects_blocks_video_position";`)
}
