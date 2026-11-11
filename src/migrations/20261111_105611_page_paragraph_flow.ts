import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_page_text" ADD COLUMN "keep_paragraphs_together" boolean DEFAULT true;
  ALTER TABLE "_pages_v_blocks_page_text" ADD COLUMN "keep_paragraphs_together" boolean DEFAULT true;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_page_text" DROP COLUMN "keep_paragraphs_together";
  ALTER TABLE "_pages_v_blocks_page_text" DROP COLUMN "keep_paragraphs_together";`)
}
