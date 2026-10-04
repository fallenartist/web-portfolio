import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_menus_items_sub_items_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_menus_items_sub_items_internal_destination" AS ENUM('content', 'projects');
  ALTER TYPE "public"."enum_menus_items_type" ADD VALUE 'group';
  CREATE TABLE "menus_items_sub_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"type" "enum_menus_items_sub_items_type" DEFAULT 'internal' NOT NULL,
  	"internal_destination" "enum_menus_items_sub_items_internal_destination" DEFAULT 'content',
  	"external_link" varchar,
  	"open_in_new_tab" boolean DEFAULT false
  );

  ALTER TABLE "settings" ADD COLUMN "projects_overview_slug" varchar DEFAULT 'projects' NOT NULL;
  ALTER TABLE "menus_items_sub_items" ADD CONSTRAINT "menus_items_sub_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menus_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "menus_items_sub_items_order_idx" ON "menus_items_sub_items" USING btree ("_order");
  CREATE INDEX "menus_items_sub_items_parent_id_idx" ON "menus_items_sub_items" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "menus_items_sub_items" CASCADE;
  UPDATE "menus_items" SET "type" = 'internal' WHERE "type" = 'group';
  ALTER TABLE "menus_items" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "menus_items" ALTER COLUMN "type" SET DEFAULT 'internal'::text;
  DROP TYPE "public"."enum_menus_items_type";
  CREATE TYPE "public"."enum_menus_items_type" AS ENUM('internal', 'external');
  ALTER TABLE "menus_items" ALTER COLUMN "type" SET DEFAULT 'internal'::"public"."enum_menus_items_type";
  ALTER TABLE "menus_items" ALTER COLUMN "type" SET DATA TYPE "public"."enum_menus_items_type" USING "type"::"public"."enum_menus_items_type";
  ALTER TABLE "settings" DROP COLUMN "projects_overview_slug";
  DROP TYPE "public"."enum_menus_items_sub_items_type";
  DROP TYPE "public"."enum_menus_items_sub_items_internal_destination";`)
}
