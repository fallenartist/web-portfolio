# Web portfolio

Next.js 16 / React 19 portfolio with an SVG D3 treemap and Payload 3 admin at `/admin`. Content and authentication use PostgreSQL. Uploaded media lives in `public/media` and must be persisted when deploying.

## Local development

Use Node 22.16+ (22.x) or Node 24.x, and pnpm 9.15.9.

1. `pnpm install --frozen-lockfile`
2. Copy `.env.example` to `.env`, set `DATABASE_URI` and a strong `PAYLOAD_SECRET`.
3. `pnpm payload migrate`
4. `pnpm dev`

Alternatively, `docker compose up` starts PostgreSQL and the app. Run `docker compose run --rm payload pnpm payload migrate` to initialize the schema before using the app. Compose uses an isolated development database with local-only app port exposure; its example database credentials are not for production.

## English and Polish

The website keeps the same URLs in both languages. On a first visit it uses the browser's preferred supported language, falling back to English. The EN / PL controls beside the menu save an explicit choice in a one-year cookie. Links containing `?lang=en` or `?lang=pl` set that preference and redirect to the same URL with only the language parameter removed; other filters remain intact. Admin, APIs and static assets are excluded from this behavior.

In Payload, choose **English** or **Polski** in the content locale selector to edit translations. Project titles, descriptions, excerpts, story text, captions, media alt text, discipline/industry/tag titles, menu labels and site settings support translation. Images, relationships, slugs, colours, presentation settings and story order are shared. Missing Polish text falls back to English. The admin interface language is independent of the content locale.

Under **Settings → Languages**, enable **Polski** when the translation is ready. Polish is disabled by default, and English stays available. While disabled, the language switcher is hidden and Polish browser preferences, saved choices and `?lang=pl` links all serve English. You can still edit Polish translations in admin. This availability setting is shared across content locales and takes effect on the next page request.

Apply `20261109_160000_language_selection` before running this code against an existing database. Back up first: the migration moves existing text into English locale tables, including nested blocks and menu items. Its rollback restores English and removes Polish translations, so export translations before rolling back.

`node --env-file=.env scripts/verify-localization.mjs /path/to/pre-migration.dump` tests preservation, Payload fallback, independent translation updates and rollback on a disposable copy of a local database backup. It never migrates the source database. The backup argument can be omitted if the configured local database has not yet been migrated.

## Analytics

Website analytics use PostHog. The frontend captures cookieless page views and explicit events; the Payload Dashboard displays a native **Website activity** widget above the collection cards. Reporting stays behind admin authentication, and the personal API key is only used on the server. The open Dashboard refreshes automatically every five minutes while visible and resumes when you return to the tab. Successful summaries are cached for five minutes; expired requests await fresh data. Available periods are 7, 30 and 90 days. Queries have a 30-second timeout with separate connection/timeout messages. Refresh/Retry allows manual recovery; a failed refresh retains the last successful report for the same period, with a visible warning and its original update time.

To connect an account:

1. Create a PostHog project in the EU region (or set `POSTHOG_REGION=us` for a US project).
2. In PostHog **Settings → Project → Web analytics**, enable **Cookieless tracking**. The SDK uses `cookieless_mode: 'always'`; PostHog discards cookieless events unless this project setting is enabled. Visitor estimates reset daily and cannot identify returning visitors across days.
3. Set runtime environment variables from `.env.example`: `POSTHOG_PROJECT_TOKEN` (the public project token), `POSTHOG_PROJECT_ID` (the numeric ID) and `POSTHOG_PERSONAL_API_KEY` (a personal key restricted to this project with **Query Read** permission). The private key must never use a `NEXT_PUBLIC_` prefix or be entered in public CMS content.
4. Set `POSTHOG_ENABLED=true` when ready to collect events. The widget can read historical data while tracking is disabled. Restart the app after changing environment variables.
5. Set product spending limits in PostHog billing before enabling tracking. Session replay, autocapture, performance capture, exceptions, heatmaps, surveys and feature flag requests are disabled in this integration. These can be introduced deliberately later; this code does not change billing or enforce account spending limits.
6. If a previously saved Dashboard layout does not show the new widget, open **Dashboard → Edit Dashboard → Add → Website activity**, or reset the layout.

The SDK is only loaded on public pages. Development, localhost and browsers with an admin authentication cookie are excluded. Local testing can be explicitly enabled using `POSTHOG_TRACK_DEVELOPMENT=true` and `POSTHOG_TRACK_LOCALHOST=true`; keep these off in normal use. Do Not Track is respected. Query strings and URL fragments are removed from captured URL properties; contact events record the method, not email addresses or phone numbers.

Verify live capture in a private browser window so the admin-cookie exclusion does not apply. Local smoke checks can be run against a production preview with `node --env-file=.env --import tsx scripts/smoke-analytics.mjs http://127.0.0.1:3104`.

Events: `$pageview`, `$pageleave`, `project_opened`, `map_node_selected`, `outbound_link_clicked`, `contact_clicked`, `video_started`, `video_progress`, `video_completed`, `video_left` and `language_changed`. Explicit events include the actual served language. Page views are emitted by the D3 navigation and map components rather than the SDK's History API autocapture, so resizing does not count another view and map selections do not inflate project-open counts. Page-view traffic sources use the external referrer hostname or Direct. The Dashboard uses UTC dates; the current period includes today's partial data.

**Video engagement** appears below the project/source breakdowns, with the top 12 videos by starts. Vimeo player events confirm actual playback, including autoplay, rather than play-button clicks. A random in-memory viewing ID groups cumulative snapshots; resumes and loops retain the same viewing. The widget shows manual/autoplay starts, completions and completion rate, average percentage watched (unique coverage), and recorded early exits with their average playback position. Coverage merges watched intervals, excludes seeking and hidden-tab playback, and counts replayed sections once. Watch time includes replays, so it can exceed video duration. Completion requires reaching the end (or a loop boundary) with at least 90% coverage. Milestones fire once per viewing, with additional snapshots on pause/background and best-effort exits on navigation/pagehide. No per-second analytics events are sent. Ongoing viewings are represented by their latest received snapshot; exits can be lost if the browser terminates. Viewings must start in the selected UTC period. Earlier `video_played` button-click events are excluded; historical playback cannot be reconstructed. Only Vimeo IDs, project paths and labels are sent, never private embed hashes or full video URLs.

Sessions, average session duration and bounce rate come from PostHog's native `sessions` table, for sessions containing at least one page view and starting in the selected period. Session duration is displayed in seconds, minutes or hours; bounce comparisons use percentage points. Page-leave tracking is enabled to record time on the final page without enabling general click autocapture or recordings. Older sessions captured before this addition may understate duration, and active sessions continue changing as events arrive. Missing session measurements display a dash rather than a misleading zero.

API reference: [PostHog query API](https://posthog.com/docs/api/queries). Cookieless setup: [PostHog cookieless tracking](https://posthog.com/tutorials/cookieless-tracking).

## Validation

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm audit`
- `pnpm generate:types` and `pnpm generate:importmap` after schema/editor changes

`node --env-file=.env scripts/verify-migrations.mjs` tests the upgrade on temporary PostgreSQL databases. This development check reads the configured local schema and uses the current OS user's local PostgreSQL administrator role through `/tmp` to create/remove only its own test databases.

## Security maintenance — November 2026

Next.js and `eslint-config-next` are pinned to 16.4.6, with Sharp at 0.35.5. Payload remains at 3.90.1, whose declared Next.js peer range includes this release. The update includes the [Next.js 16.4.1 security fixes](https://github.com/vercel/next.js/releases/tag/v16.4.1) and subsequent patches through [16.4.6](https://github.com/vercel/next.js/releases/tag/v16.4.6).

The production dependency audit on November 9 reported no Next.js advisories and no critical findings. It still reported 27 findings in other dependencies (9 high, 12 moderate, 6 low), including Undici, Happy DOM, source-map-js, fast-uri and deepmerge. These need a separate compatibility and exposure review before going live; this upgrade does not establish that the entire dependency tree is clear. The September notes below describe the earlier upgrade and its audit at that time.

## Dependency maintenance — September 2026

Payload packages are pinned together at 3.90.1, Next.js / eslint-config-next at 16.3.6, and React / React DOM at 19.3.0. GraphQL stays on the compatible 16.x major. TypeScript stays on 5.9.3. ESLint stays on 9.39.5: ESLint 10 was tested but Next's React/import/accessibility plugins do not support its API yet. Although ESLint 9 is deprecated upstream, it is the compatible version for this toolchain. Do not suppress peer conflicts to force an upgrade.

A scoped pnpm override upgrades the deprecated Drizzle loader's transitive esbuild to 0.25.x to resolve its security advisory. Migration generation, migration SQL, type generation and the production build were checked with this dependency set. The final audit returned zero known vulnerabilities.

Compatibility references: [Payload installation](https://payloadcms.com/docs/getting-started/installation), [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16).

## Database upgrades and deployment

Automatic development schema pushing is disabled. Use reviewed migrations in `src/migrations` and back up the database before applying them.

`20260924_082754_dependency_upgrade` adds Payload session/KV tables and previously unrecorded content fields. It tolerates fields/tables already created by earlier development pushes and preserves legacy columns. Its down operation deliberately refuses to delete tables that may predate the migration; rollback requires the pre-upgrade database backup. Payload may warn about prior development pushes when the migration history contains `dev` / batch `-1`; inspect the pending SQL and backup before proceeding.

The local database was backed up to `/private/tmp/portfolio-pre-upgrade-20260924/database.dump` before this upgrade. All original collection/global record counts were checked after migration. Keep a durable copy of this backup before relying on it for rollback; `/private/tmp` is temporary storage.

Frontend content is rendered dynamically, so CMS edits appear on the next request and builds do not connect to PostgreSQL. Database failures remain server errors rather than being disguised as missing projects. Full discipline/project paths are validated. The old `/my-route` sample now returns 404 and never reads users.

`pnpm build` emits standalone output for the Dockerfile. `pnpm start` runs that output locally, links the existing static/media assets, and reads `.env`; set `PORT` to choose a port. The image needs `DATABASE_URI` and `PAYLOAD_SECRET` at runtime and a persistent `/app/public/media` volume. Run migrations separately before serving traffic. The repo has no production email adapter; configure one before relying on password-reset email delivery.

## Renderer experiment

SVG remains the application renderer. The isolated HTML/SVG comparison is in `public/treemap-prototype`; it is excluded from the Docker build and is not used by the app. See its README for standalone serving instructions. It was not demonstrated to outperform SVG in Safari.
