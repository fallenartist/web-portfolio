import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" ADD COLUMN "story_text_width" numeric DEFAULT 50 NOT NULL;
  ALTER TABLE "settings" ADD COLUMN "story_text_font_size" numeric DEFAULT 30 NOT NULL;
  ALTER TABLE "settings" ADD COLUMN "story_text_quote_font_size" numeric DEFAULT 60 NOT NULL;
  ALTER TABLE "settings" ADD COLUMN "story_text_text_color" varchar DEFAULT '#222222' NOT NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" DROP COLUMN "story_text_width";
  ALTER TABLE "settings" DROP COLUMN "story_text_font_size";
  ALTER TABLE "settings" DROP COLUMN "story_text_quote_font_size";
  ALTER TABLE "settings" DROP COLUMN "story_text_text_color";`)
}
