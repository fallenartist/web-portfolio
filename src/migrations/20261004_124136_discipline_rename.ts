import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" RENAME TO "disciplines";
  ALTER TABLE "projects" RENAME COLUMN "category_id" TO "discipline_id";
  ALTER TABLE "menus_rels" RENAME COLUMN "categories_id" TO "disciplines_id";
  ALTER TABLE "payload_locked_documents_rels" RENAME COLUMN "categories_id" TO "disciplines_id";
  ALTER TABLE "settings" RENAME COLUMN "root_category_title" TO "root_discipline_title";
  ALTER TABLE "settings" RENAME COLUMN "root_category_slug" TO "root_discipline_slug";
  ALTER TABLE "projects" DROP CONSTRAINT "projects_category_id_categories_id_fk";
  ALTER TABLE "disciplines" DROP CONSTRAINT "categories_parent_id_categories_id_fk";
  ALTER TABLE "disciplines" DROP CONSTRAINT "categories_thumbnail_id_media_id_fk";
  ALTER TABLE "menus_rels" DROP CONSTRAINT "menus_rels_categories_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
  DROP INDEX "projects_category_idx";
  DROP INDEX "categories_parent_idx";
  DROP INDEX "categories_thumbnail_idx";
  DROP INDEX "categories_updated_at_idx";
  DROP INDEX "categories_created_at_idx";
  DROP INDEX "menus_rels_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_categories_id_idx";
  ALTER TABLE "projects" ADD CONSTRAINT "projects_discipline_id_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."disciplines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_parent_id_disciplines_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."disciplines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menus_rels" ADD CONSTRAINT "menus_rels_disciplines_fk" FOREIGN KEY ("disciplines_id") REFERENCES "public"."disciplines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_disciplines_fk" FOREIGN KEY ("disciplines_id") REFERENCES "public"."disciplines"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_discipline_idx" ON "projects" USING btree ("discipline_id");
  CREATE INDEX "disciplines_parent_idx" ON "disciplines" USING btree ("parent_id");
  CREATE INDEX "disciplines_thumbnail_idx" ON "disciplines" USING btree ("thumbnail_id");
  CREATE INDEX "disciplines_updated_at_idx" ON "disciplines" USING btree ("updated_at");
  CREATE INDEX "disciplines_created_at_idx" ON "disciplines" USING btree ("created_at");
  CREATE INDEX "menus_rels_disciplines_id_idx" ON "menus_rels" USING btree ("disciplines_id");
  CREATE INDEX "payload_locked_documents_rels_disciplines_id_idx" ON "payload_locked_documents_rels" USING btree ("disciplines_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "disciplines" RENAME TO "categories";
  ALTER TABLE "projects" RENAME COLUMN "discipline_id" TO "category_id";
  ALTER TABLE "menus_rels" RENAME COLUMN "disciplines_id" TO "categories_id";
  ALTER TABLE "payload_locked_documents_rels" RENAME COLUMN "disciplines_id" TO "categories_id";
  ALTER TABLE "settings" RENAME COLUMN "root_discipline_title" TO "root_category_title";
  ALTER TABLE "settings" RENAME COLUMN "root_discipline_slug" TO "root_category_slug";
  ALTER TABLE "projects" DROP CONSTRAINT "projects_discipline_id_disciplines_id_fk";
  ALTER TABLE "categories" DROP CONSTRAINT "disciplines_parent_id_disciplines_id_fk";
  ALTER TABLE "categories" DROP CONSTRAINT "disciplines_thumbnail_id_media_id_fk";
  ALTER TABLE "menus_rels" DROP CONSTRAINT "menus_rels_disciplines_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_disciplines_fk";
  DROP INDEX "projects_discipline_idx";
  DROP INDEX "disciplines_parent_idx";
  DROP INDEX "disciplines_thumbnail_idx";
  DROP INDEX "disciplines_updated_at_idx";
  DROP INDEX "disciplines_created_at_idx";
  DROP INDEX "menus_rels_disciplines_id_idx";
  DROP INDEX "payload_locked_documents_rels_disciplines_id_idx";
  ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menus_rels" ADD CONSTRAINT "menus_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category_id");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_thumbnail_idx" ON "categories" USING btree ("thumbnail_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "menus_rels_categories_id_idx" ON "menus_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");`)
}
