import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" ADD COLUMN "root_logo_id" integer;
  ALTER TABLE "settings" ADD COLUMN "up_logo_id" integer;
  ALTER TABLE "settings" ADD CONSTRAINT "settings_root_logo_id_media_id_fk" FOREIGN KEY ("root_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "settings" ADD CONSTRAINT "settings_up_logo_id_media_id_fk" FOREIGN KEY ("up_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "settings_root_logo_idx" ON "settings" USING btree ("root_logo_id");
  CREATE INDEX "settings_up_logo_idx" ON "settings" USING btree ("up_logo_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" DROP CONSTRAINT "settings_root_logo_id_media_id_fk";
  
  ALTER TABLE "settings" DROP CONSTRAINT "settings_up_logo_id_media_id_fk";
  
  DROP INDEX "settings_root_logo_idx";
  DROP INDEX "settings_up_logo_idx";
  ALTER TABLE "settings" DROP COLUMN "root_logo_id";
  ALTER TABLE "settings" DROP COLUMN "up_logo_id";`)
}
