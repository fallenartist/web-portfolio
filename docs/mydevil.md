# MyDevil test deployment

The test target is `test.lenart.pl`, SSH `figle@s44.mydevil.net`, PostgreSQL `pgsql44.mydevil.net`, database/user `p1105_lenart_pl`. The existing `lenart.pl` website is separate.

Local deployment settings are in the Git-ignored `.env.mydevil.local` (mode 600). The dedicated SSH key is `~/.ssh/lenart_mydevil_ed25519`. Never copy this private key or commit runtime secrets.

## Layout

Under `~/domains/test.lenart.pl/public_nodejs/`:

- `app.js` and `package.json`: CommonJS Passenger bootstrap copied from `scripts/mydevil/`.
- `current`: symlink to the active source release under `releases/`.
- `shared/.env`: private runtime configuration, including a distinct Payload secret and preview HTTP credentials.
- `MEDIA_DIR` in that file points to the absolute `shared/media` directory, so a portable bundle never uses the build machine's upload path.
- `shared/media/`: persistent uploaded originals and generated sizes. Each release's `public/media` links to `../../../shared/media`.
- `shared/backups/`: database exports and the backed-up MyDevil placeholder page.
- `tooling/`: project-local pnpm 9.15.9 and Node/npm 26 links, without changing other websites' tools.

The public directory at the Passenger root stays empty after its placeholder is backed up, so Next handles assets through the preview access gate. When `PREVIEW_PASSWORD` is set, every application route requires HTTP Basic authentication and receives no-index headers. The preview login is stored locally in `.env.mydevil.local`. Payload admin authentication remains separate. Leave `PREVIEW_PASSWORD` unset on the final public site.

## Building and deploying

Install dependencies on the target OS with the committed lockfile. Sharp 0.35.5 was verified on FreeBSD, including a real temporary Payload upload and generated thumbnail sizes. Next 16.4.6 needs its matching optional `@next/swc-wasm-nodejs` dependency when building on FreeBSD; `scripts/mydevil/prepare-build.mjs` links it into Next's compiler fallback path, preserving incomplete empty cache directories.

The initial MD1 build exhausted a 512 MB JavaScript heap. Its preferred deployment uses a local Node 26 build and FreeBSD-installed dependencies at runtime. Build locally, then package only portable output:

```sh
pnpm install --frozen-lockfile
MYDEVIL_BUILD=1 pnpm build
tar --exclude=node_modules --exclude='.env*' \
  --exclude='.next/standalone/public' \
  --exclude='.next/standalone/.next/static' \
  -czf /path/to/private/build.tar.gz .next/standalone .next/static
```

Upload and extract this archive in the matching source release, which already has its own FreeBSD `node_modules`, then create `.next/standalone/node_modules` as a symlink to `../../node_modules`. Never upload the local/macOS dependencies or local environment files. `scripts/start.mjs` links the release's public files and static assets into the standalone directory. Passenger runs the generated standalone server via the CommonJS bootstrap.

`MYDEVIL_BUILD=1` selects one build worker and webpack memory optimizations. A direct server build may be retried if sufficient memory is available, after running `node26 scripts/mydevil/prepare-build.mjs`. Call Next directly to preserve a chosen heap limit; `pnpm build` overrides `NODE_OPTIONS` with its existing deprecation flag.

After verifying the build and content, switch `current` to the new release and run `devil www restart test.lenart.pl`. Keep the previous release and a matching database/media backup for rollback. Never overwrite the shared media directory during code deployments.

Run `node26 --env-file=../../shared/.env --import tsx scripts/mydevil/verify-test.mjs` from the test source release to check the gate, public pages, authenticated admin, private-file isolation and upload/thumbnail/delete flow. It only accepts the specific test database, creates one temporary media record, and removes it in `finally`.

## Initial content copy

The local PostgreSQL server is 17.7 and the target is 16.10. The initial copy uses a plain PostgreSQL 17 dump with ownership and ACL statements omitted. Remove only the unsupported `SET transaction_timeout = 0;` statement. Restore with `psql --single-transaction -v ON_ERROR_STOP=1`, only after checking the target has no tables and saving a pre-restore backup.

The first approved copy preserved 11 projects, 1 Page, 71 media records, 1 user, 1 menu and 36 migration-history records. Existing migrations are preserved, not replayed. Local and remote dump backups were created; keep an additional durable copy before launch. Local content remains the editing source until the final launch transfer. After launch, edit live content and refresh development copies from production as needed.

## Verified test release

The active release is `releases/20261111-node26-r2`. Verification passed for preview protection, JavaScript/CSS delivery, the Project Map redirect, published Pages, authenticated Dashboard/Page editor access, existing media delivery, and temporary upload/thumbnail/delete cleanup. The media collection returned to 71 records and no test upload files remained. Account-wide usage after verification was approximately 643 MB of the 1 GB RAM allocation and 15.1 GB of 25 GB disk space.

This preview is a snapshot. New local edits and uploads are not automatically synchronized to it. Keep editing locally until the final launch transfer is agreed.

## Production launch — 12 November 2026

`https://lenart.pl` now runs Node 26 in Production mode, with one Passenger process, HTTPS enforced, TLS 1.2 minimum and MyDevil cache disabled. DNS and email configuration were preserved. `www.lenart.pl` also serves the application. The unused `ddns-synology.php` endpoint is retired.

The application root is `~/domains/lenart.pl/public_nodejs/`, using the same bootstrap/current/releases/shared structure described above. The launch release is `releases/20261112-polish-launch`. Its separate production PostgreSQL database/user is `p1105_lenart_liv` on `pgsql44.mydevil.net`. Runtime secrets live in `shared/.env`, with no preview password. Never commit or serve that file. Uploads live in the absolute `shared/media` directory.

The approved final local snapshot contains 14 projects, 1 published Page, 86 media records, 1 admin user, 1 menu and 36 migration-history records. Polish translations are editable localized CMS content; Polish availability is enabled in Settings. Existing English text, URLs, relationships and media are preserved. Three projects had no English descriptions, so their descriptions were left empty in both languages.

**Production admin is now the source of truth for content.** Edit at `https://lenart.pl/admin`; local edits do not synchronize automatically. Future code releases must preserve the production database and shared uploads. Back up both before migrations or content imports. Refresh local development content from production when needed, rather than overwriting production with an older local snapshot.

To conserve the MD1 memory allowance, `test.lenart.pl` now runs a small temporary 302 redirect to the live domain. Its previous database and release remain intact. The original preview bootstrap, runtime settings and current-release path are saved under its `shared/backups/pre-live-*` files. Restore those together and restart the preview when an isolated staging session is needed; account for the RAM required by a second Next/Payload process. Do not restore `shared/.env.launch-preview` for normal staging: it points to production content.

Before the domain switch, the old PHP website and vhost configuration were saved under `~/lenart-launch-backups/20261112/`. Original `public_html` files remain untouched. The production database import, its pre-restore backup and restore log are under production `shared/backups/`. The existing Google site-verification HTML was retained in the new release.

For an emergency return to the old static website, remove only the Node vhost (`devil www del lenart.pl`, **without `--remove`**), re-add `devil www add lenart.pl php`, and verify HTTPS/certificate bindings and the saved vhost options. This changes routing; it does not restore or erase production CMS content. For code rollback, switch `current` to a verified compatible release and restart `lenart.pl`; database changes may require their own recovery plan.

Launch checks passed for all 17 sitemap URLs, both frontend languages, the single target-language switch, browser-language detection, saved-language preference, About list markup, media, JS/CSS delivery, login and private-file isolation. Production robots allow indexing and advertise the new sitemap. Local validation passed 69 tests, lint and the Node 26 production build.
