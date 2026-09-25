import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "categories"
    SET "color" = CASE "slug"
      WHEN 'identity' THEN 'rgb(250, 200, 0)'
      WHEN 'interactive' THEN 'rgb(50, 0, 250)'
      WHEN 'offline' THEN 'rgb(250, 0, 50)'
      ELSE "color"
    END
    WHERE "slug" IN ('identity', 'interactive', 'offline');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "categories"
    SET "color" = CASE "slug"
      WHEN 'identity' THEN 'rgb(50, 0, 250)'
      WHEN 'interactive' THEN 'rgb(250, 0, 50)'
      WHEN 'offline' THEN 'rgb(250, 200, 0)'
      ELSE "color"
    END
    WHERE "slug" IN ('identity', 'interactive', 'offline');
  `)
}
