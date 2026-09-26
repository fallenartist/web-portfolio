import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "clients" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "projects" ADD COLUMN "client_id" integer;
    ALTER TABLE "projects" ADD COLUMN "industry_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "clients_id" integer;

    UPDATE "projects" AS "project"
    SET "industry_id" = "selection"."industries_id"
    FROM (
      SELECT DISTINCT ON ("parent_id") "parent_id", "industries_id"
      FROM "projects_rels"
      WHERE "path" = 'industries' AND "industries_id" IS NOT NULL
      ORDER BY "parent_id", "order" ASC NULLS LAST, "id" ASC
    ) AS "selection"
    WHERE "project"."id" = "selection"."parent_id";

    ALTER TABLE "projects_rels" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "projects_rels" CASCADE;
    CREATE INDEX "clients_title_idx" ON "clients" USING btree ("title");
    CREATE UNIQUE INDEX "clients_slug_idx" ON "clients" USING btree ("slug");
    CREATE INDEX "clients_updated_at_idx" ON "clients" USING btree ("updated_at");
    CREATE INDEX "clients_created_at_idx" ON "clients" USING btree ("created_at");
    ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "projects" ADD CONSTRAINT "projects_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clients_fk" FOREIGN KEY ("clients_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "projects_client_idx" ON "projects" USING btree ("client_id");
    CREATE INDEX "projects_industry_idx" ON "projects" USING btree ("industry_id");
    CREATE INDEX "payload_locked_documents_rels_clients_id_idx" ON "payload_locked_documents_rels" USING btree ("clients_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "projects_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "industries_id" integer
    );

    INSERT INTO "projects_rels" ("order", "parent_id", "path", "industries_id")
    SELECT 1, "id", 'industries', "industry_id"
    FROM "projects"
    WHERE "industry_id" IS NOT NULL;

    ALTER TABLE "projects" DROP CONSTRAINT "projects_client_id_clients_id_fk";
    ALTER TABLE "projects" DROP CONSTRAINT "projects_industry_id_industries_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_clients_fk";
    DROP INDEX "projects_client_idx";
    DROP INDEX "projects_industry_idx";
    DROP INDEX "payload_locked_documents_rels_clients_id_idx";
    ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
    CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
    CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
    CREATE INDEX "projects_rels_industries_id_idx" ON "projects_rels" USING btree ("industries_id");
    ALTER TABLE "projects" DROP COLUMN "client_id";
    ALTER TABLE "projects" DROP COLUMN "industry_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "clients_id";
    ALTER TABLE "clients" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "clients" CASCADE;
  `)
}
