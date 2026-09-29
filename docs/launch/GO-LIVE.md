# RIMIFY — go-live runbook

Follow it top to bottom, in one SSH session on the Hostinger account. Every step has the exact command, what a
correct result looks like, and what to do when it is not that. Nothing here is run by the build; you run it.

**Do not start** until these are true (`docs/launch/BLOCKED.md` has the owners):

- The production domain points at this Hostinger account, and hPanel shows a valid SSL certificate for it.
- The cars the released Gutachten name are in — typed from the Gutachten themselves („Fahrzeug aus diesem
  Gutachten anlegen“, `source` = `gutachten`) or from a vehicle data import. A Gutachten is only released when
  every car it names has an authoritative source (`VehicleSource::releasable()`); a development car
  (`entwicklung`) is refused everywhere. A database seeded before `7f9446a5` holds the 74 development cars as demo
  rows: `demo:assert-clean` fails until `php artisan demo:purge --force` hides them (never deletes, R-04).
- The real catalogue is in and **at least one wheel is published with a freigegebenes Gutachten** for a car. The
  example catalogue never reaches production, so without one real wheel the smoke test (§5) cannot pass —
  and a shop without a wheel is not ready to open.
- The mail account on the shop's domain exists (SMTP host, user, password), with SPF, DKIM and DMARC set.
- The media bucket's key is at hand for Einstellungen › Medien und Speicher (or already entered).
- The rollback has been rehearsed on staging once and timed (§7.4). Until then this runbook is untested there.

Payments: this release opens the shop with `RIMIFY_PAYMENTS=none` — it shows every wheel and its verdict and
refuses orders with a sentence, until the payments brief lands (Stripe, entered in the admin by hand).

---

## 0 · Session setup (every time)

```bash
ssh -p 65002 <user>@<host>                       # the account's SSH access from hPanel
export APP="$HOME/domains/<production-domain>/public_html"   # the whole project lives INSIDE public_html
export PHP=/opt/alt/php84/usr/bin/php
cd "$APP" && git log -1 --format='%h %s'
```

**Correct:** the last line prints the commit the site runs, e.g. `9cb03cd feat(launch): …`.
**If not:** `cd` fails → the domain folder is wrong; list `~/domains/` and use the production domain's
`public_html`. `git` says *not a git repository* → this folder was never deployed; do the first install
(§4.0) instead of §1–§3.

Database values for the commands below, read from `.env` (the password never appears on a command line):

```bash
eval "$(grep -E '^DB_(HOST|PORT|DATABASE|USERNAME|PASSWORD)=' .env)"
export MYSQL_PWD="$DB_PASSWORD"
echo "$DB_DATABASE on $DB_HOST:$DB_PORT as $DB_USERNAME"
```

**Correct:** one line naming the database, e.g. `u2906…_rimify on localhost:3306 as u2906…_rimify`.
**If not:** an empty name → `.env` lacks the DB lines; restore them from your copy (`~/rimify.env.backup`).

---

## 1 · Before anything: a backup and a way back

```bash
mkdir -p ~/backups && export TS=$(date +%Y%m%d-%H%M)

# The database — with its triggers (R-12 lives in them) and in one consistent snapshot
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" --single-transaction --routines --triggers \
  --no-tablespaces "$DB_DATABASE" | gzip > ~/backups/rimify-$TS.sql.gz

# The release as it runs now: its commit, its .env, and the files (code, vendor, build, uploads)
git rev-parse HEAD > ~/backups/rimify-$TS.commit
cp .env ~/backups/rimify-$TS.env
tar -czf ~/backups/rimify-$TS-release.tar.gz --exclude=./storage/logs --exclude=./storage/framework -C "$APP" .

ls -lh ~/backups/rimify-$TS*
gunzip -c ~/backups/rimify-$TS.sql.gz | tail -1
gunzip -c ~/backups/rimify-$TS.sql.gz | grep -c 'CREATE.*TRIGGER'
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -N -e \
  "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = DATABASE();" "$DB_DATABASE" \
  | tee ~/backups/rimify-$TS.triggers
```

**Correct:** four files listed (the dump a few MB, the release archive a few hundred MB); the dump's last line
reads `-- Dump completed on <today>`; the two trigger counts are **the same number** — 14 on a database
migrated to the 2026-09-29 release (four for R-12's audit log and fitment snapshots, one for the frozen
RIMIFY-Check, one against a document superseding itself, eight demo-row guards); an older release has fewer.
**If not:**
- *Access denied* → the `.env` values are not the database's; check hPanel › Datenbanken.
- *PROCESS privilege* → the `--no-tablespaces` flag is missing; it is in the command above.
- The dump ends without `Dump completed` → the disk is full or the connection dropped; free space
  (`du -sh ~/backups`) and run it again. **Do not go on without a complete dump.**
- The two trigger counts differ → stop: the dump would restore a database without its immutability.

The restore is written out in §7 and rehearsed there. Keep these files until the release has run a week.

---

## 2 · Preflight on the target — green, with the 403

```bash
$PHP artisan rimify:preflight
```

**Correct** (production, before this release): every row `GO` except the ones marked here, and the last line `GO.`

| Prüfung | Correct | If not |
|---|---|---|
| Anwendungsschlüssel | GO · gesetzt | `$PHP artisan key:generate --force` — only on a first install; on a live shop a new key logs everyone out and breaks signed links |
| Umgebung | GO · `production, Debug aus` | set `APP_ENV=production` and `APP_DEBUG=false` in `.env`, then `$PHP artisan config:cache`. A production started with debug on is switched off at boot and **fails this row** until `.env` says false |
| Adresse | GO · `https://<domain>` | `APP_URL` in `.env` |
| Server-Rendering | GO · Renderer antwortet … heute N Seiten ohne | start it: `bash deploy/ssr-watch.sh`, wait 5 s, run again |
| E-Mail | GO · `smtp, Absender …@<domain>` | `MAIL_MAILER=smtp` and the account's `MAIL_*` values; a sender on another domain is a warning — fix it, or mail lands in spam |
| Zahlung | Warnung · kein Zahlungsanbieter (BLOCKED #3) | expected until the payments brief; **`sandbox` here is NO-GO** |
| Zahlungsschlüssel | – · keine Schlüssel in .env | a refused key fails this row (a live key in `.env`, a key of the other mode): take it out of `.env` |
| Datenbank / Migrationen | GO / GO · alle ausgeführt | `ausstehend` before the deploy is normal on a release that brings migrations; after §4 it must read `alle ausgeführt` |
| Demodaten | GO · keine | `$PHP artisan demo:purge --force`, then find how they got there — production never holds demo rows (R-12) |
| Speicher: Quelle | GO · Einstellungen im Admin | enter the bucket in Einstellungen › Medien und Speicher |
| **Speicher: S3-Audit** | **GO · 10 Prüfungen, 0 Warnungen** — this includes the probe that **`invoices/` answers 403** | `$PHP artisan rimify:s3-audit` names the row; row 5 must read `200/200/200` and **403 on `invoices/`**; a 200 there means invoices are public — fix the bucket policy before anything else |
| Speicher-Tabelle | GO · vorhanden | run the migrations (§4) |

**If any row says NO-GO, stop here.** Fix it and run the preflight again; nothing below starts on a red board.

---

## 3 · Maintenance, with the German holding page

```bash
$PHP artisan down --render="errors::503" --retry=60 --secret="$(openssl rand -hex 16)" | tee ~/backups/rimify-$TS.down
```

**Correct:** `INFO  Application is now in maintenance mode.` and a line with the bypass address. Open the site
in a private window: it shows **„RIMIFY ist gerade in Wartung.“** in the shop's own design, HTTP 503 with
`Retry-After: 60`. The bypass address (`https://<domain>/<secret>`) lets you — and only you — see the site
while it is down; it is saved in `~/backups/rimify-$TS.down`.
**If not:** the framework's grey page → the views were not deployed; `ls resources/views/errors/503.blade.php`.

---

## 4 · Deploy, migrate, warm the caches, restart the renderer, leave maintenance

### 4.0 First install on an empty folder (once)

```bash
cd "$HOME/domains/<production-domain>"
git clone --branch deploy --depth 1 git@github.com:skillLeo/rimify.git public_html.new
# public_html must contain the project itself: move hPanel's default files aside, then
mv public_html public_html.hpanel && mv public_html.new public_html && cd "$APP"
cp ~/rimify.env.backup .env   # or create .env from .env.example and fill DB_*, MAIL_*, APP_URL
```

Then continue with 4.2 (skip 4.1). The empty database is seeded with the reference data only: no car, no
wheel and no demo row. The cars come from the vehicle data import, the wheels from Katalog › Import.

### 4.1 Fetch the release

```bash
cd "$APP"
git fetch --depth 1 origin deploy && git reset --hard FETCH_HEAD
git log -1 --format='%h %s'
```

**Correct:** the new commit's line. `.env` is untracked and stays.
**If not:** *Permission denied (publickey)* → the host's key is not on the GitHub account (Settings › SSH keys).

### 4.2 The release script

```bash
TARGET_ENV=production bash deploy/remote.sh 2>&1 | tee ~/backups/rimify-$TS.deploy.log
```

It migrates, applies the release's seeded data once, rebuilds the caches, restarts the renderer, waits for
it to answer, installs the two cron lines, takes the site out of maintenance — and runs the smoke test.

**Correct** — the log reads, in this order (lines abbreviated):

```
== code: <sha> <subject>
No demo data.
  INFO  Running migrations.  … (or: Nothing to migrate.)
Release seed v4 already applied.   (or: Release seed v4 applied.)
== caches rebuilt
== stopped renderer <pid>
== renderer ready on 13714
== renderer watchdog and scheduler in cron
== site is up
Smoke-Test gegen https://<domain>
… (the table of §5, every row ok)
```

**If not** — the script stops at the first failure with the site **still in maintenance**:

| Where it stopped | What it means | What to do |
|---|---|---|
| `Demo data found in production` | demo rows in the live database (R-12) | `$PHP artisan demo:purge --force`, find the cause, run 4.2 again |
| a migration error | the schema could not be changed | read the error; if unclear, roll back (§7) — the dump is from before the migration |
| `renderer NOT ready after 30 s` | node did not start | `tail -20 storage/logs/ssr.log`; a port in use → `bash deploy/ssr-watch.sh`; then run 4.2 again |
| `add these two lines in hPanel` | the host refused `crontab` | add them in hPanel (§6) and go on — this is not a failure |
| the smoke test fails (§5) | the site is up but wrong | §5 says per row; when in doubt, roll back (§7) |

---

## 5 · `rimify:smoke`

`remote.sh` runs it last. Run it again by hand at any time:

```bash
$PHP artisan rimify:smoke
```

**Correct:** exit code 0 and every row `ok`:

| Prüfung | Correct result |
|---|---|
| Startseite | ok · 200, auf dem Server gerendert |
| Produktseite ohne JavaScript | ok · „<model>“ und <price> im HTML |
| HSN/TSN-Abfrage und Freigabe | ok · Freigegeben für <car> (<HSN>/<TSN>) — or „Mit Auflagen freigegeben für …“ |
| Gutachten-PDF | ok · öffnet, Seite <n> |
| Testbestellung | übersprungen · Keine Testzahlung in dieser Umgebung (im Live-Shop immer aus). |
| Admin-Anmeldung | ok · 200, Anmeldeformular gerendert |
| Speicher-Präfixe | ok · Bucket: 10 Prüfungen, invoices/ antwortet 403 |

The last line reads `Smoke-Test bestanden.`

**If not:**
- *Admin-Anmeldung: HTTP 404* → `.env` has `RIMIFY_ADMIN_ENABLED=false` (the review preview's setting):
  remove the line or set it to `true`, then `$PHP artisan config:cache`.
- *ohne Server-Rendering ausgeliefert* / *kein Preis im gerenderten HTML* → the renderer is not answering:
  `bash deploy/ssr-watch.sh`, wait 5 s, run the smoke again. Search engines see an empty page until this is ok.
- *Keine freigegebene Felge im Shop* → no published wheel with a freigegebenes Gutachten (see „Do not start“).
- *keine Freigabe auf der Produktseite* → the lookup or the engine answers differently than the admin shows:
  **roll back** (§7) — a verdict the shop cannot show correctly is never left online.
- *kein PDF-Link* / the PDF is not `%PDF-` → the Gutachten file is missing from the bucket: re-upload it in
  Gutachten › the document.
- *invoices/ ist öffentlich lesbar* → **take the site down at once** (`$PHP artisan down --render="errors::503"`),
  fix the bucket policy, run `rimify:s3-audit`, then `up` again.

---

## 6 · The two cron lines (hPanel)

`remote.sh` installs them itself where the host allows `crontab`. Where it printed *add these two lines in
hPanel*, open **hPanel › Erweitert › Cron-Jobs**, choose „Benutzerdefiniert“ and *every minute* (`* * * * *`)
for both, with these commands (your `<production-domain>`):

```
SSR_PORT=13714 NODE_BIN=/opt/alt/alt-nodejs22/root/usr/bin/node bash /home/<user>/domains/<production-domain>/public_html/deploy/ssr-watch.sh
cd /home/<user>/domains/<production-domain>/public_html && /opt/alt/php84/usr/bin/php artisan schedule:run
```

The first keeps the renderer alive: it does nothing while the renderer answers and starts it within a minute
when the host has stopped it. The second runs the scheduler — `demo:assert-clean` every day at 04:30 Berlin (R-12).

**Correct — what it looks like when it works:**

```bash
crontab -l | grep -F "$APP"                       # both lines, once each
tail -3 storage/logs/ssr.log                      # after a stop: "… renderer restarted by ssr-watch"
pkill -u "$(id -u)" -f "$APP/bootstrap/ssr/ssr.js"; sleep 70; curl -s -m 2 http://127.0.0.1:13714/health
```

The last line kills the renderer on purpose; about a minute later the health check answers again (`OK` or a
JSON line) and `ssr.log` has a new *restarted by ssr-watch* line. The admin's System page shows the pages
served without rendering in that minute as an amber row — expected, and it clears within the hour.
**If not:** nothing restarts → the cron line is missing or its path is wrong; `crontab -l`, and compare the
path with `echo "$APP"`.

---

## 7 · Rollback

Use it when the smoke test or the first hour shows something the shop must not show, and it is not a
one-line fix. It returns code **and** database to §1's backup.

> Orders placed between §1 and the rollback are in the new database only. On the first go-live there are
> none (no payment provider yet). On a later release: before restoring, export them —
> `$PHP artisan tinker --execute="echo App\Models\Order::where('created_at','>=',now()->subHours(2))->pluck('order_number');"` —
> and re-enter them from the order e-mails; or, if the release's migrations only added things,
> prefer 7.3 without 7.2.

### 7.1 Down

```bash
cd "$APP" && $PHP artisan down --render="errors::503" --retry=60
```

### 7.2 The database back to §1 (≈ time measured below)

```bash
# drop every table (the dump recreates them), then load the dump
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -N -e \
  "SELECT CONCAT('DROP TABLE IF EXISTS \`', table_name, '\`;') FROM information_schema.tables WHERE table_schema = DATABASE();" \
  "$DB_DATABASE" | { echo 'SET FOREIGN_KEY_CHECKS=0;'; cat; } | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" "$DB_DATABASE"
gunzip -c ~/backups/rimify-$TS.sql.gz | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" "$DB_DATABASE"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -N -e \
  "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = DATABASE();" "$DB_DATABASE"
```

**Correct:** no output from the first two commands; the last prints the number in `~/backups/rimify-$TS.triggers`.
**If not:** *Access denied* → run §0's `eval` and `export MYSQL_PWD` again (a new shell forgets them).

### 7.3 The code back to §1

```bash
git reset --hard "$(cat ~/backups/rimify-$TS.commit)" 2>/dev/null \
  || { mkdir -p ~/rollback && tar -xzf ~/backups/rimify-$TS-release.tar.gz -C "$APP"; }
cp ~/backups/rimify-$TS.env .env
$PHP artisan optimize:clear > /dev/null && $PHP artisan optimize > /dev/null
bash deploy/ssr-watch.sh; sleep 3; curl -s -m 2 http://127.0.0.1:13714/health
git log -1 --format='%h %s'
```

The `git reset` works while the old commit is still in the folder's history; the archive covers the case
where a shallow fetch has dropped it.
**Correct:** the health check answers; the last line is the commit from `~/backups/rimify-$TS.commit`.

### 7.4 Up, and prove it

```bash
$PHP artisan up && $PHP artisan rimify:smoke
```

**Correct:** every smoke row ok, as in §5.

### Rollback timing

| Where | Database | Dump | Restore (7.2) | Code + caches + renderer (7.3) | Whole rollback, down to up |
|---|---|---|---|---|---|
| Local rehearsal (Windows, MySQL 8.4), 2026-09-29 | a scratch copy of the development database, 5,5 MB dump, 14 triggers | 0,4 s | 2,5 s | 1,5 s | **6,8 s**, smoke 7/7 ok |
| **Staging (Hostinger), rehearse once before go-live** | | | | | ___ min — write it here |

The local row proves the steps, not the time on the host: the same MySQL, but no network between the shell
and the database, SSD, and no `git reset` (the code was already the backup's commit), so 7.3 is caches and
renderer only. The restore dropped a table the "bad release" had added (every table goes, not only the dump's)
and brought all 14 triggers back. It ran against a copy (`rimify_wf_rollback`), served by the development app
with its config cached to that copy, as production's `.env` would point it; the smoke test's test order was
written there and the copy was dropped afterwards.

Rehearse on staging exactly as written: §1 (backup), §3 (down), §7.2–7.4, and time from `down` to the smoke
test's last row. If the whole rollback takes longer than ten minutes, say so before go-live: the release
window has to be planned around it.

---

## 8 · The first hour

Every ten minutes for the first hour, then at the end of the day:

| What | Command / place | Correct | If not |
|---|---|---|---|
| Errors | `tail -50 storage/logs/laravel-$(date +%F).log` | no `ERROR` or `CRITICAL` lines since the release | a repeated error on a shop page → roll back (§7); one-off `404` lines are bots |
| Pages without server rendering | Admin › System (row „Server-Rendering“) — or `grep -c 'SSR-Fallback' storage/logs/laravel-$(date +%F).log` | green, or amber with a count that stops rising | rising → `bash deploy/ssr-watch.sh`; the log line names each URL |
| Queue | Admin › System (row „Warteschlange“); this host runs jobs at once (`QUEUE_CONNECTION=sync`) | no failed jobs | a failed job raises an alert in the Protokoll; read it there |
| Slow queries | `tail -20 storage/logs/slow-queries-$(date +%F).log` | empty, or a handful under a second | the same statement again and again → note it; it is a fix for the next release, not a rollback |
| The renderer | `curl -s -m 2 http://127.0.0.1:13714/health` | answers | §6 |
| A real visit | the shop in a private window on a phone and a desktop: home, a wheel, HSN/TSN, the Gutachten PDF | as in the smoke test | §5 |

There is no external error tracker (Sentry or similar) — that needs an account; the log and the System page
are the tracker until one is chosen.

---

## 9 · Confirm before you tell anyone it is live

- [ ] `grep -E '^APP_(ENV|DEBUG)=' .env` → `APP_ENV=production` and `APP_DEBUG=false`; `grep RIMIFY_ADMIN_ENABLED .env` → nothing, or `true`
- [ ] `$PHP artisan demo:assert-clean` → `No demo data.`
- [ ] `$PHP artisan rimify:mail-test <your address>` → `Sent …` — and the mail arrives, from `…@<domain>`, not in spam
- [ ] `grep -E '^RIMIFY_PAYMENTS=' .env` → `RIMIFY_PAYMENTS=none` (never `sandbox` on the live shop). Where the
      sandbox is on (staging), every test order carries the tag „Testbestellung“ in Verkauf › Bestellungen and, on its page, „Testbestellung über die Testzahlung – dabei fließt kein Geld …“
- [ ] `$PHP artisan rimify:preflight` → `GO.`
- [ ] `$PHP artisan rimify:smoke` → every row ok
- [ ] Keep `~/backups/rimify-$TS*` for a week
