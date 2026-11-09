import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "projects_rels" ADD COLUMN "industries_id" integer;

    INSERT INTO "projects_rels" ("order", "parent_id", "path", "industries_id")
    SELECT 1, "id", 'industries', "industry_id"
    FROM "projects"
    WHERE "industry_id" IS NOT NULL;

    ALTER TABLE "projects_rels"
      ADD CONSTRAINT "projects_rels_industries_fk"
      FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id")
      ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "projects_rels_industries_id_idx" ON "projects_rels" USING btree ("industries_id");

    ALTER TABLE "projects" DROP CONSTRAINT "projects_industry_id_industries_id_fk";
    DROP INDEX "projects_industry_idx";
    ALTER TABLE "projects" DROP COLUMN "industry_id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "projects" ADD COLUMN "industry_id" integer;

    UPDATE "projects" AS "project"
    SET "industry_id" = "selection"."industries_id"
    FROM (
      SELECT DISTINCT ON ("parent_id") "parent_id", "industries_id"
      FROM "projects_rels"
      WHERE "path" = 'industries' AND "industries_id" IS NOT NULL
      ORDER BY "parent_id", "order" ASC NULLS LAST, "id" ASC
    ) AS "selection"
    WHERE "project"."id" = "selection"."parent_id";

    ALTER TABLE "projects"
      ADD CONSTRAINT "projects_industry_id_industries_id_fk"
      FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id")
      ON DELETE set null ON UPDATE no action;
    CREATE INDEX "projects_industry_idx" ON "projects" USING btree ("industry_id");

    DELETE FROM "projects_rels" WHERE "path" = 'industries';
    ALTER TABLE "projects_rels" DROP CONSTRAINT "projects_rels_industries_fk";
    DROP INDEX "projects_rels_industries_id_idx";
    ALTER TABLE "projects_rels" DROP COLUMN "industries_id";
  `)
}
