import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_menus_items_internal_destination" AS ENUM('content', 'projects');
  ALTER TABLE "menus_items" ADD COLUMN "internal_destination" "enum_menus_items_internal_destination" DEFAULT 'content';
  UPDATE "menus_items"
  SET "type" = 'internal', "internal_destination" = 'projects', "external_link" = NULL, "open_in_new_tab" = false
  WHERE "external_link" IN ('/projects', '/projects/');`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "menus_items"
  SET "type" = 'external', "external_link" = '/projects', "open_in_new_tab" = false
  WHERE "internal_destination" = 'projects';
  ALTER TABLE "menus_items" DROP COLUMN "internal_destination";
  DROP TYPE "public"."enum_menus_items_internal_destination";`)
}
