import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX "projects_blocks_image_locales_parent_id_idx" ON "projects_blocks_image_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_video_locales_parent_id_idx" ON "projects_blocks_video_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_text_locales_parent_id_idx" ON "projects_blocks_text_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_locales_parent_id_idx" ON "projects_locales" USING btree ("_parent_id");
  CREATE INDEX "disciplines_locales_parent_id_idx" ON "disciplines_locales" USING btree ("_parent_id");
  CREATE INDEX "industries_locales_parent_id_idx" ON "industries_locales" USING btree ("_parent_id");
  CREATE INDEX "tags_locales_parent_id_idx" ON "tags_locales" USING btree ("_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "menus_items_sub_items_locales_parent_id_idx" ON "menus_items_sub_items_locales" USING btree ("_parent_id");
  CREATE INDEX "menus_items_locales_parent_id_idx" ON "menus_items_locales" USING btree ("_parent_id");
  CREATE INDEX "settings_locales_parent_id_idx" ON "settings_locales" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "projects_blocks_image_locales_parent_id_idx";
  DROP INDEX "projects_blocks_video_locales_parent_id_idx";
  DROP INDEX "projects_blocks_text_locales_parent_id_idx";
  DROP INDEX "projects_locales_parent_id_idx";
  DROP INDEX "disciplines_locales_parent_id_idx";
  DROP INDEX "industries_locales_parent_id_idx";
  DROP INDEX "tags_locales_parent_id_idx";
  DROP INDEX "media_locales_parent_id_idx";
  DROP INDEX "menus_items_sub_items_locales_parent_id_idx";
  DROP INDEX "menus_items_locales_parent_id_idx";
  DROP INDEX "settings_locales_parent_id_idx";`)
}
