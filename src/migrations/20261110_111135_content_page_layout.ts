import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_page_text_width" AS ENUM('content', 'half');
  CREATE TYPE "public"."enum_pages_blocks_page_text_alignment" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_pages_blocks_page_text_columns" AS ENUM('two', 'one');
  CREATE TYPE "public"."enum_pages_blocks_page_image_alignment" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_pages_blocks_page_video_alignment" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_page_text_width" AS ENUM('content', 'half');
  CREATE TYPE "public"."enum__pages_v_blocks_page_text_alignment" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_page_text_columns" AS ENUM('two', 'one');
  CREATE TYPE "public"."enum__pages_v_blocks_page_image_alignment" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_page_video_alignment" AS ENUM('left', 'center', 'right');
  ALTER TYPE "public"."enum_pages_blocks_page_image_width" ADD VALUE 'half';
  ALTER TYPE "public"."enum_pages_blocks_page_video_width" ADD VALUE 'half';
  ALTER TYPE "public"."enum__pages_v_blocks_page_image_width" ADD VALUE 'half';
  ALTER TYPE "public"."enum__pages_v_blocks_page_video_width" ADD VALUE 'half';
  ALTER TABLE "pages_blocks_page_text" ADD COLUMN "width" "enum_pages_blocks_page_text_width" DEFAULT 'content';
  ALTER TABLE "pages_blocks_page_text" ADD COLUMN "alignment" "enum_pages_blocks_page_text_alignment" DEFAULT 'left';
  ALTER TABLE "pages_blocks_page_text" ADD COLUMN "columns" "enum_pages_blocks_page_text_columns" DEFAULT 'two';
  ALTER TABLE "pages_blocks_page_image" ADD COLUMN "alignment" "enum_pages_blocks_page_image_alignment" DEFAULT 'left';
  ALTER TABLE "pages_blocks_page_video" ADD COLUMN "alignment" "enum_pages_blocks_page_video_alignment" DEFAULT 'left';
  ALTER TABLE "_pages_v_blocks_page_text" ADD COLUMN "width" "enum__pages_v_blocks_page_text_width" DEFAULT 'content';
  ALTER TABLE "_pages_v_blocks_page_text" ADD COLUMN "alignment" "enum__pages_v_blocks_page_text_alignment" DEFAULT 'left';
  ALTER TABLE "_pages_v_blocks_page_text" ADD COLUMN "columns" "enum__pages_v_blocks_page_text_columns" DEFAULT 'two';
  ALTER TABLE "_pages_v_blocks_page_image" ADD COLUMN "alignment" "enum__pages_v_blocks_page_image_alignment" DEFAULT 'left';
  ALTER TABLE "_pages_v_blocks_page_video" ADD COLUMN "alignment" "enum__pages_v_blocks_page_video_alignment" DEFAULT 'left';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_page_image" ALTER COLUMN "width" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_page_image" ALTER COLUMN "width" SET DEFAULT 'content'::text;
  DROP TYPE "public"."enum_pages_blocks_page_image_width";
  CREATE TYPE "public"."enum_pages_blocks_page_image_width" AS ENUM('content', 'wide');
  ALTER TABLE "pages_blocks_page_image" ALTER COLUMN "width" SET DEFAULT 'content'::"public"."enum_pages_blocks_page_image_width";
  ALTER TABLE "pages_blocks_page_image" ALTER COLUMN "width" SET DATA TYPE "public"."enum_pages_blocks_page_image_width" USING (CASE WHEN "width" = 'half' THEN 'content' ELSE "width" END)::"public"."enum_pages_blocks_page_image_width";
  ALTER TABLE "pages_blocks_page_video" ALTER COLUMN "width" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_page_video" ALTER COLUMN "width" SET DEFAULT 'content'::text;
  DROP TYPE "public"."enum_pages_blocks_page_video_width";
  CREATE TYPE "public"."enum_pages_blocks_page_video_width" AS ENUM('content', 'wide');
  ALTER TABLE "pages_blocks_page_video" ALTER COLUMN "width" SET DEFAULT 'content'::"public"."enum_pages_blocks_page_video_width";
  ALTER TABLE "pages_blocks_page_video" ALTER COLUMN "width" SET DATA TYPE "public"."enum_pages_blocks_page_video_width" USING (CASE WHEN "width" = 'half' THEN 'content' ELSE "width" END)::"public"."enum_pages_blocks_page_video_width";
  ALTER TABLE "_pages_v_blocks_page_image" ALTER COLUMN "width" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_page_image" ALTER COLUMN "width" SET DEFAULT 'content'::text;
  DROP TYPE "public"."enum__pages_v_blocks_page_image_width";
  CREATE TYPE "public"."enum__pages_v_blocks_page_image_width" AS ENUM('content', 'wide');
  ALTER TABLE "_pages_v_blocks_page_image" ALTER COLUMN "width" SET DEFAULT 'content'::"public"."enum__pages_v_blocks_page_image_width";
  ALTER TABLE "_pages_v_blocks_page_image" ALTER COLUMN "width" SET DATA TYPE "public"."enum__pages_v_blocks_page_image_width" USING (CASE WHEN "width" = 'half' THEN 'content' ELSE "width" END)::"public"."enum__pages_v_blocks_page_image_width";
  ALTER TABLE "_pages_v_blocks_page_video" ALTER COLUMN "width" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_page_video" ALTER COLUMN "width" SET DEFAULT 'content'::text;
  DROP TYPE "public"."enum__pages_v_blocks_page_video_width";
  CREATE TYPE "public"."enum__pages_v_blocks_page_video_width" AS ENUM('content', 'wide');
  ALTER TABLE "_pages_v_blocks_page_video" ALTER COLUMN "width" SET DEFAULT 'content'::"public"."enum__pages_v_blocks_page_video_width";
  ALTER TABLE "_pages_v_blocks_page_video" ALTER COLUMN "width" SET DATA TYPE "public"."enum__pages_v_blocks_page_video_width" USING (CASE WHEN "width" = 'half' THEN 'content' ELSE "width" END)::"public"."enum__pages_v_blocks_page_video_width";
  ALTER TABLE "pages_blocks_page_text" DROP COLUMN "width";
  ALTER TABLE "pages_blocks_page_text" DROP COLUMN "alignment";
  ALTER TABLE "pages_blocks_page_text" DROP COLUMN "columns";
  ALTER TABLE "pages_blocks_page_image" DROP COLUMN "alignment";
  ALTER TABLE "pages_blocks_page_video" DROP COLUMN "alignment";
  ALTER TABLE "_pages_v_blocks_page_text" DROP COLUMN "width";
  ALTER TABLE "_pages_v_blocks_page_text" DROP COLUMN "alignment";
  ALTER TABLE "_pages_v_blocks_page_text" DROP COLUMN "columns";
  ALTER TABLE "_pages_v_blocks_page_image" DROP COLUMN "alignment";
  ALTER TABLE "_pages_v_blocks_page_video" DROP COLUMN "alignment";
  DROP TYPE "public"."enum_pages_blocks_page_text_width";
  DROP TYPE "public"."enum_pages_blocks_page_text_alignment";
  DROP TYPE "public"."enum_pages_blocks_page_text_columns";
  DROP TYPE "public"."enum_pages_blocks_page_image_alignment";
  DROP TYPE "public"."enum_pages_blocks_page_video_alignment";
  DROP TYPE "public"."enum__pages_v_blocks_page_text_width";
  DROP TYPE "public"."enum__pages_v_blocks_page_text_alignment";
  DROP TYPE "public"."enum__pages_v_blocks_page_text_columns";
  DROP TYPE "public"."enum__pages_v_blocks_page_image_alignment";
  DROP TYPE "public"."enum__pages_v_blocks_page_video_alignment";`)
}
