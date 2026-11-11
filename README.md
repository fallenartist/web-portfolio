# Web portfolio

Next.js 16 / React 19 portfolio with an SVG D3 treemap and Payload 3 admin at `/admin`. Content and authentication use PostgreSQL. Uploaded media lives in `public/media` and must be persisted when deploying.

## Local development

Use Node 26.x and pnpm 9.15.9. `.nvmrc` and the Docker configurations default to Node 26. The supported fallback versions are Node 22.23.4+ (22.x) and Node 24.22.1+ (24.x), matching the installed Payload requirements.

Node 26 no longer bundles Corepack. Install pnpm explicitly with `npm install --global pnpm@9.15.9` (use a user-owned npm prefix on shared hosting), or install Corepack separately if you prefer it. Select Node 26 for both the MyDevil website and SSH build/migration commands, and use the **Production** environment for `test.lenart.pl`.

Node 26.5.0 was checked locally with frozen-lockfile installation, lint, all 67 tests, the production build/server, read-only page/admin/media checks, migration status, and an in-memory Sharp thumbnail conversion. MyDevil's Passenger startup and FreeBSD image-processing support still need to be verified on the test server. The Docker configuration has not been built locally.

1. `pnpm install --frozen-lockfile`
2. Copy `.env.example` to `.env`, set `DATABASE_URI` and a strong `PAYLOAD_SECRET`.
3. `pnpm payload migrate`
4. `pnpm dev`

Alternatively, `docker compose up` starts PostgreSQL and the app. Once the app container is running and pnpm is installed, run `docker compose exec payload pnpm payload migrate` to initialize the schema before using the app. Compose uses an isolated development database with local-only app port exposure; its example database credentials are not for production.

## English and Polish

The website keeps the same URLs in both languages. On a first visit it uses the browser's preferred supported language, falling back to English. The EN / PL controls beside the menu save an explicit choice in a one-year cookie. Links containing `?lang=en` or `?lang=pl` set that preference and redirect to the same URL with only the language parameter removed; other filters remain intact. Admin, APIs and static assets are excluded from this behavior.

In Payload, choose **English** or **Polski** in the content locale selector to edit translations. Project titles, descriptions, excerpts, story text, captions, media alt text, discipline/industry/tag titles, menu labels and site settings support translation. Images, relationships, slugs, colours, presentation settings and story order are shared. Missing Polish text falls back to English. The admin interface language is independent of the content locale.

Under **Settings → Languages**, enable **Polski** when the translation is ready. Polish is disabled by default, and English stays available. While disabled, the language switcher is hidden and Polish browser preferences, saved choices and `?lang=pl` links all serve English. You can still edit Polish translations in admin. This availability setting is shared across content locales and takes effect on the next page request.

Apply `20261109_160000_language_selection` before running this code against an existing database. Back up first: the migration moves existing text into English locale tables, including nested blocks and menu items. Its rollback restores English and removes Polish translations, so export translations before rolling back.

`node --env-file=.env scripts/verify-localization.mjs /path/to/pre-migration.dump` tests preservation, Payload fallback, independent translation updates and rollback on a disposable copy of a local database backup. It never migrates the source database. The backup argument can be omitted if the configured local database has not yet been migrated.

## Content pages

**Pages** is the first item under **Content** in the admin navigation and Dashboard. Create standalone pages with a title, shared URL slug and optional search description, then add/reorder **Text**, **Image** and **Vimeo video** blocks. Media can use content width or a wider layout. Pages use a scrolling article layout with a regular title, separate from the project hero layout. Vimeo uses its own playback controls and is included in video analytics.

Page body typography shares the Projects **Appearance → Story text** font size, responsive scaling, colour and paragraph spacing. Text blocks default to two flowing columns on desktop, with an optional single-column setting. Text and media can also use **Half text column** width and a **Left / Centre / Right** position. Consecutive opposite-side half blocks share a row (for example, a left portrait plus right biography); centre-aligned halves get a separate row. A half occupies `(text-column width − column gap) / 2`, matching the flowing text columns. Layouts stack into a single full-width column on mobile.

**Show title on page** can be turned off per page when the content needs a custom heading. It defaults to on, including for existing pages. The title field, menu labels, breadcrumbs and browser/search titles keep their usual behaviour. Rich-text **Heading 1** shares the displayed page title's typography and spans flowing text columns; **Heading 2** and **Heading 3** use related smaller styles. All heading levels remain available in the editor.

The Pages editor previews the same body type sizes from Appearance and shares the frontend heading styles. Headings inherit October Condensed instead of Payload's admin UI font; editing colours continue to follow the admin theme for contrast. In two-column text blocks, **Keep paragraphs together** defaults to on and requests whole-paragraph column breaks. It can leave uneven columns, and browsers may still split paragraphs that cannot fit. Turn it off to allow paragraph splitting for more balanced columns. This affects layout only; it does not insert line breaks into the stored text.

Insert images inside a **Text** block using the editor's **Upload** command (+ menu or `/`). Edit an inserted image to choose **Full width**, **Left — wrap text**, or **Right — wrap text**, with optional alt text and a caption. Wrapped photos use half the current text column, excluding its gap; text continues below them, and small screens stack images at full width. These inline images and their options are part of the localized text. Separate Image blocks retain their existing row layout. The first image on a page loads eagerly; later images remain lazy-loaded.

Text, image alternative text, captions and search descriptions support English/Polish with the existing site language availability controls and English fallback. Block order and standalone media are shared. Save drafts while preparing content, then publish; drafts are excluded from public routes, API results and navigation. Add a published page to **Menus → Internal Link → Content item → Pages** to make it appear in navigation. URLs use a single shared slug such as `/about-me`; existing portfolio/system routes are reserved. No pages or menu entries are seeded.

Apply `20261110_091745_content_pages` before running this feature. It creates the empty Pages/draft/localization tables and adds Pages relationships to menus and document locks. The local database was backed up to `/private/tmp/portfolio-before-content-pages-1794305532255.dump` before applying it. Its rollback removes Pages and their versions, so back up content before rolling back. Read-only local checks: `node --env-file=.env --import tsx scripts/smoke-content-pages.mjs http://127.0.0.1:3104`.

`20261110_111135_content_page_layout` adds the block layout fields to Pages and their versions. The local database was backed up to `/private/tmp/portfolio-before-page-layout-1794309201444.dump` before applying it. Its rollback removes the new controls and converts half-width media back to content width.

`20261111_103102_page_title_visibility` adds the title-visibility checkbox to Pages and saved versions with a default of true. The local database was backed up to `/private/tmp/portfolio-before-page-title-visibility-1794393315697.dump` before applying it. Back up the database before applying it elsewhere.

`20261111_105611_page_paragraph_flow` adds the paragraph-keeping option to text blocks and their saved versions with a default of true. The local database was backed up to `/private/tmp/portfolio-before-paragraph-flow-1794395618338.dump` before applying it.

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

Next.js and `eslint-config-next` are pinned to 16.4.6, with Sharp at 0.35.5. Payload packages are pinned together at [3.93.0](https://github.com/payloadcms/payload/releases/tag/v3.93.0), including its Undici 7.30.1 dependency. The update includes the [Next.js 16.4.1 security fixes](https://github.com/vercel/next.js/releases/tag/v16.4.1) and subsequent patches through [16.4.6](https://github.com/vercel/next.js/releases/tag/v16.4.6).

The lockfile also updates source-map-js to 1.2.2, fast-uri to 3.1.9 and the development toolchain's Zod to 4.6.7. A scoped override selects [Happy DOM 21.0.4](https://github.com/capricorn86/happy-dom/releases/tag/v21.0.4) only for `@lexical/headless@0.50.0`, whose declared range still selects vulnerable 20.x releases. Version 21 disables external stylesheet and iframe loading by default. Rich-text HTML import/export, Polish text, escaping and DOM cleanup are covered by compatibility tests. Remove the override once the supported Lexical dependency range includes the fixed release.

Audits on November 9 report **zero high or critical findings** in both production and development dependencies. Production has one remaining low-severity deepmerge advisory with no published fix. The full tree additionally has one moderate minimatch advisory in ESLint's TypeScript tooling, whose fix requires a new major version outside the current dependency range. Neither finding is suppressed. These remain recorded for follow-up; the September notes below describe the earlier upgrade and its audit at that time.

## Dependency maintenance — September 2026

Payload packages are pinned together at 3.90.1, Next.js / eslint-config-next at 16.3.6, and React / React DOM at 19.3.0. GraphQL stays on the compatible 16.x major. TypeScript stays on 5.9.3. ESLint stays on 9.39.5: ESLint 10 was tested but Next's React/import/accessibility plugins do not support its API yet. Although ESLint 9 is deprecated upstream, it is the compatible version for this toolchain. Do not suppress peer conflicts to force an upgrade.

A scoped pnpm override upgrades the deprecated Drizzle loader's transitive esbuild to 0.25.x to resolve its security advisory. Migration generation, migration SQL, type generation and the production build were checked with this dependency set. The final audit returned zero known vulnerabilities.

Compatibility references: [Payload installation](https://payloadcms.com/docs/getting-started/installation), [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16).

## Database upgrades and deployment

Automatic development schema pushing is disabled. Use reviewed migrations in `src/migrations` and back up the database before applying them.

`20261109_211952_dependency_security_indexes` adds the 11 localized-parent indexes introduced by Payload 3.93.0. Apply it after the language migrations and before serving the upgraded application. Its down migration removes only those indexes. The local database was backed up to `/private/tmp/portfolio-before-payload-security-1794259241151.dump` before applying it; keep a durable copy before relying on this temporary backup.

`20260924_082754_dependency_upgrade` adds Payload session/KV tables and previously unrecorded content fields. It tolerates fields/tables already created by earlier development pushes and preserves legacy columns. Its down operation deliberately refuses to delete tables that may predate the migration; rollback requires the pre-upgrade database backup. Payload may warn about prior development pushes when the migration history contains `dev` / batch `-1`; inspect the pending SQL and backup before proceeding.

The local database was backed up to `/private/tmp/portfolio-pre-upgrade-20260924/database.dump` before this upgrade. All original collection/global record counts were checked after migration. Keep a durable copy of this backup before relying on it for rollback; `/private/tmp` is temporary storage.

Frontend content is rendered dynamically, so CMS edits appear on the next request and builds do not connect to PostgreSQL. Database failures remain server errors rather than being disguised as missing projects. Full discipline/project paths are validated. The old `/my-route` sample now returns 404 and never reads users.

`pnpm build` emits standalone output for the Dockerfile. `pnpm start` runs that output locally, links the existing static/media assets, and reads `.env`; set `PORT` to choose a port. The image needs `DATABASE_URI` and `PAYLOAD_SECRET` at runtime and a persistent `/app/public/media` volume. Run migrations separately before serving traffic. The repo has no production email adapter; configure one before relying on password-reset email delivery.

## Renderer experiment

SVG remains the application renderer. The isolated HTML/SVG comparison is in `public/treemap-prototype`; it is excluded from the Docker build and is not used by the app. See its README for standalone serving instructions. It was not demonstrated to outperform SVG in Safari.
