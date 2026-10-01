import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_settings_project_title_placement" AS ENUM('below', 'overlay');
  ALTER TABLE "settings" ADD COLUMN "project_title_placement" "enum_settings_project_title_placement" DEFAULT 'below' NOT NULL;
  ALTER TABLE "settings" ADD COLUMN "project_title_font_size" numeric DEFAULT 112;
  ALTER TABLE "settings" ADD COLUMN "project_title_dim_color" varchar DEFAULT '#000000';
  ALTER TABLE "settings" ADD COLUMN "project_title_dim_intensity" numeric DEFAULT 35;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" DROP COLUMN "project_title_placement";
  ALTER TABLE "settings" DROP COLUMN "project_title_font_size";
  ALTER TABLE "settings" DROP COLUMN "project_title_dim_color";
  ALTER TABLE "settings" DROP COLUMN "project_title_dim_intensity";
  DROP TYPE "public"."enum_settings_project_title_placement";`)
}
