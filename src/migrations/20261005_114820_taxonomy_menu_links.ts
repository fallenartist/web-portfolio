import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "menus_rels" ADD COLUMN "clients_id" integer;
  ALTER TABLE "menus_rels" ADD COLUMN "agencies_id" integer;
  ALTER TABLE "menus_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "menus_rels" ADD CONSTRAINT "menus_rels_clients_fk" FOREIGN KEY ("clients_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menus_rels" ADD CONSTRAINT "menus_rels_agencies_fk" FOREIGN KEY ("agencies_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menus_rels" ADD CONSTRAINT "menus_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "menus_rels_clients_id_idx" ON "menus_rels" USING btree ("clients_id");
  CREATE INDEX "menus_rels_agencies_id_idx" ON "menus_rels" USING btree ("agencies_id");
  CREATE INDEX "menus_rels_tags_id_idx" ON "menus_rels" USING btree ("tags_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "menus_rels" DROP CONSTRAINT "menus_rels_clients_fk";

  ALTER TABLE "menus_rels" DROP CONSTRAINT "menus_rels_agencies_fk";

  ALTER TABLE "menus_rels" DROP CONSTRAINT "menus_rels_tags_fk";

  DROP INDEX "menus_rels_clients_id_idx";
  DROP INDEX "menus_rels_agencies_id_idx";
  DROP INDEX "menus_rels_tags_id_idx";
  ALTER TABLE "menus_rels" DROP COLUMN "clients_id";
  ALTER TABLE "menus_rels" DROP COLUMN "agencies_id";
  ALTER TABLE "menus_rels" DROP COLUMN "tags_id";`)
}
