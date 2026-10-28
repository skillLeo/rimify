# DEPLOY-OHNE-CI — a release while GitHub Actions is down

For: whoever has to put a release on the preview (or, on the operator's word, on production) when the „Deploy“
workflow cannot run. Written during the first such release, 13.10.2026, when GitHub refused every job („recent account
payments have failed or your spending limit needs to be increased“). It replaces one thing only — the **build** of the
`deploy` branch. Everything on the host is `docs/launch/GO-LIVE.md`, unchanged.

## What Actions does, and what stands in for each part

| The workflow | By hand |
|---|---|
| **Checks** on every push: Pint, Larastan, Pest on MariaDB, type check, lint, Vitest | `composer verify` on the machine that builds — all of it, on the commit to release (§1) |
| **Release** suite: the same on MySQL 8.4 as well, and Playwright | Playwright is in `composer verify`. MySQL 8.4: `composer test:mysql` where a local MySQL 8.4 exists; otherwise **recorded as unverified** in the release note (§5) |
| **Deploy** › *Build the release*: production `vendor/`, OCR assets, demo imagery, 3D assets, bundles, release stamp, commit on top of the previous release, push to `deploy` | `scripts/deploy/release-ohne-ci.ps1` (§2) |
| **Deploy** › *Post-release steps* (only with `SSH_RELEASE=true`; never set) | The host step, as always: GO-LIVE §1, §3, §4 (§3 here) |

## 1 · Before building: everything CI would have proven

On the commit to release, with nothing else running beside the heavy steps (`docs/dev/DATABASE.md`):

```
composer verify        # secrets, Pint, Larastan, Pest with coverage (min 85), type check, lint, Vitest, build,
                       # Playwright (both configs), npm run qa
npm run kundenliste    # the client's list; writes docs/review/KUNDENLISTE.md
```

A red or skipped step is not a release (CLAUDE.md §7). Restart the local SSR renderer after the build, before
Playwright. The bundles in `public/build` and `bootstrap/ssr` at the end of this are the ones the release ships.

## 2 · Build the release

```
powershell -File scripts/deploy/release-ohne-ci.ps1 -Commit <sha> -Release <n>          # builds, proves, pushes nothing
powershell -File scripts/deploy/release-ohne-ci.ps1 -Commit <sha> -Release <n> -Push    # and pushes the release to `deploy`
```

`-Release` is the release's number (21 for the human-QA release of 28.10.2026). It goes into `public/build/release.json`
and is printed with the build's date at the foot of the preview's shop and admin („Testumgebung · Release 21 vom …“,
`App\Support\ReleaseStamp`); the live shop never prints it.

What it does, and why it is the same tree the workflow would commit:

1. **A clean clone** of the commit, checked out without CRLF conversion (`core.autocrlf=false`), in
   `C:\rimify\release-build` — never the working tree.
2. **The previous release as the base.** It fetches `deploy`, reads from its subject which commit it was built from,
   and takes over unchanged what CI built there on Linux: `vendor/`, `public/ocr`, `public/3d`,
   `storage/app/public/demo`, the two package manifests. It **refuses** if anything those are made from changed since
   (the OCR script, the 3D scripts, the photo map, the two `wheels:` commands) — then they must be built as the
   workflow builds them, and this document needs a section it does not have yet.
3. **`composer install --no-dev --optimize-autoloader` from the lock**, into that base: composer changes what the lock
   changed and nothing else. `*.md` under `vendor/` is deleted, as in the workflow.
4. **The reset baseline** is checked against the migrations (`rimify:reset-baseline --check`); a migration that is not
   in it stops the build — rebuild it on MariaDB first and commit it.
5. **The bundles the gates ran against** are copied in (it refuses if `HEAD` is not the commit, or the tree differs in
   anything the release ships), and `public/build/release.json` is stamped with the commit and the time.
6. **The commit**: the tree on top of the previous release, `.github/` carried over from it, message
   `release: <commit> <subject>` — so the host pulls a fast-forward, exactly as after a CI build.
7. **The proof.** It prints what differs from the previous release, by area. Read it before pushing:
   `vendor/` may differ only in the packages the lock changed plus `vendor/composer/*`; the count of executable files
   must be the previous release's.

The first run (release of `11720fd5`, dry): 141 files in `public/build`, 13 in `bootstrap/ssr`, our own source since
`ac0bbcc6`, and in `vendor/` exactly `league/commonmark` (6 files, 2.10.1 → 2.10.3) and four files of
`vendor/composer`. Nothing else.

## 3 · On the host

GO-LIVE §0 (session), §1 (backup, and the way back), §3 (maintenance), §4.1 (fetch `deploy`), §4.2 (`deploy/remote.sh`:
migrations, release seed, caches, renderer on its socket, up), §5 (`rimify:smoke`). For the preview,
`scripts/deploy/vorschau-release.sh` runs them in that order: copied to the host and started detached
(`nohup setsid bash … &`, so it outlives the SSH session), it writes `~/backups/rimify-<time>.run.log`, which is read
in a second session. It refuses — with the site still up on the old code — when the fetch fails or the fetched
release's own `deploy/check-env.php` does not accept the `.env`. Nothing here differs from a CI release: the host
pulls the `deploy` branch and never learns who built it.

Afterwards, each read on the host:

- `rimify:smoke` in full, and which steps it skipped and why (an empty shop skips the product steps).
- `rimify:append-only-check` — the triggers on `order_line_fitments` and `audit_logs` are there and raise 45000 (R-12).
- `rimify:reset-baseline --check` — the shipped baseline holds every migration that just ran.
- The two cron lines (GO-LIVE §6): the scheduler's last beat is under two minutes old.
- The page itself: the footer reads `Testumgebung · Stand <commit>`, and the protected elements of the homepage are
  there (`docs/design/PROTECTED.md`).

## 4 · When Actions is back

Re-run „Checks“ and „Release“ on the released commit (`gh run rerun <id>`), and let „Deploy“ build the same commit
once: its tree must equal the hand-built one except for `public/build`, `bootstrap/ssr` (other machine, other hashes)
and `release.json`. A difference anywhere else is a finding.

## 5 · The release note

Every hand-built release gets one entry below: the commit, who built it, what was proven locally, and what was not.

| Date | Release of | Proven locally | Not proven |
|---|---|---|---|
| 13.10.2026, 21:02 UTC (preview) | `d126238d` → release `4d7a6184`, on top of `44350a22` (the CI release of `ac0bbcc6`) | Pint, Larastan; Pest 2.545 passed, coverage 93,0 % (MariaDB 11.8.9); Vitest 1.542 passed; Playwright main config 411 passed, mobile config 184 passed; `npm run qa`; the client's list 73 passed. The release against the previous one: `vendor/` differs in `league/commonmark` (6 files) and 4 files of `vendor/composer`; executable files 253 = 253. On the host: migration `2026_10_07_000200` ran, 49 s from maintenance to up, baseline holds all 83 migrations, reset screen 200 for the Super-Admin and 404 for six roles. | **The MySQL 8.4 leg** — neither in CI nor here (`composer test:mysql` not run for this build). CI's own build of the same commit, for comparison (§4). |
| 14.10.2026, 12:22 UTC (preview) | `9964382e` → release `731a9fc4`, on top of `4d7a6184` | Pint, Larastan; Pest 2.598 passed, coverage 93,0 % (MariaDB 11.8.9) — run alone, after a first run I voided by running one test file beside it on the same database; Vitest 1.548 passed; Playwright main config 416 passed and 2 failed — both traced and fixed (D-223), the six specs they touch then three times at both widths: 78 passed; mobile config 183 passed, 1 failed (latency at 4× CPU, 232 ms once in the suite, alone 10 of 10, measured against the hero change: not it); `npm run qa` passed; the client's list 73 passed. The release against the previous one: bundles, resources, app, tests, docs, three regenerated autoload files — no package changed, no new migration (baseline 83), executable files 253 = 253. On the host: 48 s from maintenance to up. Smoke red on two rows: „Warenkorb und Kasse (ohne Bestellung)“ — my own check, looking for the order button on a step it cannot reach (D-224, fixed on `main`, comes with the next release) — and the bucket's CORS (ADMIN-GEFUNDEN 502). Afterwards, against the live preview: the image rule 18 of 18, the width test green; the acceptance set seeded beside the client's wheel (941 rows, all demo, D-222). | **The MySQL 8.4 leg** (`composer test:mysql`) — not run. CI's own build of the same commit, for comparison (§4). |
| 28.10.2026, 06:21 UTC (preview, **release 21**, the human QA pass) | `fe83dda8` → release `43582ac0`, on top of `3bb7df22` (an unfinished first build of `499e2524`: the script's `$release` collided with the new `-Release`, fixed in `fe83dda8`) | Pint, Larastan, ESLint (0 errors), Stylelint, vue-tsc; Vitest 1.748; Pest 684 unit / 2.427 feature on MariaDB 11.8.9 **and** MySQL 8.4 (on `f3da5e66`, PHP identical since); Playwright main 470/0, widths 8/8, qa green (on `e0ccea8e`, code identical to the release). On the host: 59 s in `remote.sh`, 98 migrations, baseline holds all 98, smoke passed (test order skipped), append-only 6/6, renderer newer than the bundle, socket healthy; the footer reads „Testumgebung · Release 21 vom 28.10.2026, 07:19 Uhr · Stand fe83dda8“ in shop and admin. | **The phone suite: 190 of 192** — „a sheet link navigates and the history has no dead entry“ failed 2 of 192 on WebKit in two runs (once the browser crashed on Back), passes alone 24 of 25; labelled HQ-16, not caused by this release. CI's own build (§4). |

### What the first hand-built release met on the host (13.10.2026)

Not caused by the build, and each would have met a CI release the same way:

- **`rimify:smoke` ended red on two rows.** „Gutachten-PDF: HTTP 403“ — the shop's storage had been switched to the S3
  bucket after the client uploaded two Gutachten PDFs to the host's disk; nothing copies files at the switch, and the
  product page links a PDF wherever storage points *now* (`FelgenController::pdfLink`). Repaired the same hour by copying
  exactly those two files into the bucket under their keys, each read back with the SHA-256 on record; both addresses
  answer 200 as PDF. „Speicher-Präfixe: 7 CORS“ — the bucket's IAM user may not read the bucket's CORS setting
  (`s3:GetBucketCORS` denied), so the audit cannot tell a missing rule from an unreadable one; that is the bucket
  owner's to grant or to set.
- **The smoke placed its sandbox order in the client's shop** (RMF-2026-0003, 400,00 €, test payment, stock returned,
  invoice issued): it orders whenever a real product is on sale and payments are in test mode, and until 10.10. the
  preview had none. An order's frozen approval is never deleted (R-12), so it stays. **Before the next release to an
  instance the client works in, the smoke must stop before paying** — tracked as the first thing to change.
- **The host's tree is not clean after a release**: `vendor/composer/installed.php` reads as modified, because
  `deploy/remote.sh` runs composer there and it rewrites the install path. The next release resets it; nothing to do.
