import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "show_title" boolean DEFAULT true;
  ALTER TABLE "_pages_v" ADD COLUMN "version_show_title" boolean DEFAULT true;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN "show_title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_show_title";`)
}
