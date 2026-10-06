import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings" DROP COLUMN "enable_autoplay";
    ALTER TABLE "settings" DROP COLUMN "autoplay_delay";
    ALTER TABLE "settings" DROP COLUMN "autoplay_interval";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings" ADD COLUMN "enable_autoplay" boolean DEFAULT true;
    ALTER TABLE "settings" ADD COLUMN "autoplay_delay" numeric DEFAULT 5000;
    ALTER TABLE "settings" ADD COLUMN "autoplay_interval" numeric DEFAULT 3000;
  `)
}
