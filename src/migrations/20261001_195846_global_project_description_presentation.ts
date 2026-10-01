import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" ADD COLUMN "project_description_font_family" varchar DEFAULT 'October Condensed' NOT NULL;
  ALTER TABLE "settings" ADD COLUMN "project_description_font_size" numeric DEFAULT 30 NOT NULL;
  ALTER TABLE "settings" ADD COLUMN "project_description_text_color" varchar DEFAULT '#222222' NOT NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" DROP COLUMN "project_description_font_family";
  ALTER TABLE "settings" DROP COLUMN "project_description_font_size";
  ALTER TABLE "settings" DROP COLUMN "project_description_text_color";`)
}
