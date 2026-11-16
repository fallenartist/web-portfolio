import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" ADD COLUMN "cookies_privacy_page_id" integer;
  ALTER TABLE "settings" ADD COLUMN "cookies_icon_id" integer;
  ALTER TABLE "settings_locales" ADD COLUMN "cookies_title" varchar DEFAULT 'Cookies!';
  ALTER TABLE "settings_locales" ADD COLUMN "cookies_message" varchar DEFAULT 'Actually, just one cookie needed to better understand my visitors. Will you allow to use cookies for analytics?';
  ALTER TABLE "settings_locales" ADD COLUMN "cookies_details" varchar DEFAULT 'Includes approximate location, click activity and session recordings. Form input values are masked.';
  ALTER TABLE "settings_locales" ADD COLUMN "cookies_accept_label" varchar DEFAULT 'Sure!';
  ALTER TABLE "settings_locales" ADD COLUMN "cookies_reject_label" varchar DEFAULT 'Reject';
  ALTER TABLE "settings_locales" ADD COLUMN "cookies_privacy_label" varchar DEFAULT 'Privacy details';
  ALTER TABLE "settings" ADD CONSTRAINT "settings_cookies_privacy_page_id_pages_id_fk" FOREIGN KEY ("cookies_privacy_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "settings" ADD CONSTRAINT "settings_cookies_icon_id_media_id_fk" FOREIGN KEY ("cookies_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "settings_cookies_cookies_privacy_page_idx" ON "settings" USING btree ("cookies_privacy_page_id");
  CREATE INDEX "settings_cookies_cookies_icon_idx" ON "settings" USING btree ("cookies_icon_id");
  UPDATE "settings_locales" SET
    "cookies_title" = 'Ciasteczka!',
    "cookies_message" = 'Właściwie to wystarczy jedno ciasteczko, aby lepiej poznać odwiedzających moją stronę. Czy pozwolisz na używanie plików cookie do analityki?',
    "cookies_details" = 'Obejmuje przybliżoną lokalizację, kliknięcia i nagrania sesji. Wartości pól formularzy są maskowane.',
    "cookies_accept_label" = 'Jasne!',
    "cookies_reject_label" = 'Odrzucam',
    "cookies_privacy_label" = 'Szczegóły prywatności'
  WHERE "_locale" = 'pl';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" DROP CONSTRAINT "settings_cookies_privacy_page_id_pages_id_fk";

  ALTER TABLE "settings" DROP CONSTRAINT "settings_cookies_icon_id_media_id_fk";

  DROP INDEX "settings_cookies_cookies_privacy_page_idx";
  DROP INDEX "settings_cookies_cookies_icon_idx";
  ALTER TABLE "settings" DROP COLUMN "cookies_privacy_page_id";
  ALTER TABLE "settings" DROP COLUMN "cookies_icon_id";
  ALTER TABLE "settings_locales" DROP COLUMN "cookies_title";
  ALTER TABLE "settings_locales" DROP COLUMN "cookies_message";
  ALTER TABLE "settings_locales" DROP COLUMN "cookies_details";
  ALTER TABLE "settings_locales" DROP COLUMN "cookies_accept_label";
  ALTER TABLE "settings_locales" DROP COLUMN "cookies_reject_label";
  ALTER TABLE "settings_locales" DROP COLUMN "cookies_privacy_label";`)
}
