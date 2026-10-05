import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings"
    ADD COLUMN "project_guide_title" varchar DEFAULT 'Projects' NOT NULL,
    ADD COLUMN "project_guide_instruction" varchar DEFAULT 'Select a node or connection to explore related projects.' NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings"
    DROP COLUMN "project_guide_title",
    DROP COLUMN "project_guide_instruction";
  `)
}
