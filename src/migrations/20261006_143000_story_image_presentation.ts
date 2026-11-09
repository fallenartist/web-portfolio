import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_projects_blocks_image_presentation" AS ENUM('auto', 'center', 'full');
    ALTER TABLE "projects_blocks_image"
      ADD COLUMN "presentation" "enum_projects_blocks_image_presentation" DEFAULT 'auto' NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "projects_blocks_image" DROP COLUMN "presentation";
    DROP TYPE "public"."enum_projects_blocks_image_presentation";
  `)
}
