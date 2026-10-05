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
- The rollback has been rehearsed on staging and timed (§7.4) — done on the preview on 2026-09-29: 14,4 s.

Payments: this release opens the shop with `RIMIFY_PAYMENTS=none` — it shows every wheel and its verdict and
refuses orders with a sentence, until the payments brief lands (Stripe, entered in the admin by hand).

**Staging (the review preview) runs this same runbook** with three differences, found on its first run
(2026-09-29, see „Where this runbook was wrong“ at the end): `TARGET_ENV=staging` in §4.2, the preflight rows
that are production's only (§2), and a smoke test whose product rows wait for a released, priced real wheel (§5).

---

## 0 · Session setup (every time)

**The supported way in is a deploy key, never a password on a command line** (01.10.2026: a host password passed to
`plink -pw` was refused by the permission check as credential leakage, rightly).

1. Once, on the machine that deploys: `ssh-keygen -t ed25519 -N "" -C rimify-<env>-deploy -f ~/.ssh/rimify_<env>_deploy`.
   The private key stays on that machine — never in the repository, never in chat.
2. Once, in a browser: **hPanel › Erweitert › SSH-Zugang › SSH-Schlüssel › SSH-Schlüssel hinzufügen**, name
   `rimify-<env>-deploy`, paste the one line of `~/.ssh/rimify_<env>_deploy.pub`.
3. Pin the host's key the first time and compare its fingerprint with the one hPanel shows (SSH-Zugang): the first
   connection writes it (`-o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=~/.ssh/rimify_known_hosts`), every
   later one checks it (`StrictHostKeyChecking=yes`). The preview's: `SHA256:2LJK6xK6Z8j0IFeeYiHXlDocIPO1ZAgQDlUPIzf9KJc`.
4. Every session: `ssh -i ~/.ssh/rimify_<env>_deploy -o IdentitiesOnly=yes -o UserKnownHostsFile=~/.ssh/rimify_known_hosts -p 65002 <user>@<host>`.
   Long steps (§1, §4) run detached (`nohup setsid bash … > ~/backups/….log 2>&1 &`) and their log is read afterwards:
   a dropped connection must never stop a release half-way.

**Fallback, for a host that ever refuses keys:** hPanel › Erweitert › SSH-Zugang shows the account's password; type it
at the prompt of `ssh -p 65002 <user>@<host>` (never as an argument), or a browser terminal where hPanel offers one.
The runbook below is the same either way.

```bash
ssh -p 65002 <user>@<host>                       # the account's SSH access from hPanel (with -i for the deploy key)
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
echo "$TS" > ~/backups/current-ts   # a second SSH session reads it back: export TS=$(cat ~/backups/current-ts)

# The database — with its triggers (R-12 lives in them) and in one consistent snapshot
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" --single-transaction --routines --triggers \
  --no-tablespaces "$DB_DATABASE" | gzip > ~/backups/rimify-$TS.sql.gz

# The release as it runs now: its commit, its .env, and the files (code, vendor, build, uploads)
git rev-parse HEAD > ~/backups/rimify-$TS.commit
cp .env ~/backups/rimify-$TS.env
tar -czf ~/backups/rimify-$TS-release.tar.gz --exclude=./storage/logs --exclude=./storage/framework -C "$APP" .

ls -lh ~/backups/rimify-$TS*
gunzip -c ~/backups/rimify-$TS.sql.gz | tail -1 | grep -c 'Dump completed'   # 1; printing the line itself dropped the SSH session on Hostinger
gunzip -c ~/backups/rimify-$TS.sql.gz | grep -c 'CREATE.*TRIGGER'
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -N -e \
  "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = DATABASE();" "$DB_DATABASE" \
  | tee ~/backups/rimify-$TS.triggers
```

**Correct:** four files listed (the dump a few MB, the release archive a few hundred MB — on the preview,
2026-09-30: 436 KB and 179 MB, all four in about half a minute); the dump's last line reads
`-- Dump completed on <today>` (the `grep -c` prints `1`); the two trigger counts are **the same number** — 22 on a database
migrated to the 2026-09-30 release (four for R-12's audit log and fitment snapshots, one for the frozen
RIMIFY-Check, one against a document superseding itself, eight demo-row guards, two keeping the payment provider's
events as received, two keeping issued invoices unchanged, four keeping the invoice numbers gapless); an older
release has fewer.
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
$PHP artisan rimify:preflight --no-interaction
```

`--no-interaction` matters: on a host whose running release predates the command, Laravel answers *Command
"rimify:preflight" is not defined* and offers to run **`rimify:release-seed` instead (yes/no)** — the preview's
first run met exactly that prompt. Then there is no preflight to read before the release: go on to §3 and read
it after §4.2 (`$PHP artisan rimify:preflight`), where the new release has it.

**Correct** (production, before this release): every row `GO` except the ones marked here, and the last line `GO.`
On staging, *Umgebung* reads `staging`, *Zahlung* `sandbox`, *E-Mail* `log` and *Demodaten* a count — each
expected there, each NO-GO in production.

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
| Bekannte Passwörter | GO · kein Konto öffnet mit einem Passwort, das im Repository stand | the row names each account: set a new password with `printf '%s\n' "$NEW" \| $PHP artisan rimify:admin-passwort <email> --grund="…"` (asked for on stdin, never an argument; every session of the account ends). Since D-141 the seeders put a development password on no shared copy and reset none — a NO-GO here means someone set one by hand |

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

The repository is private (since 03.10.2026). A host reads it with a read-only deploy key of its own and a
`github-rimify` alias in `~/.ssh/config` — never with a key that is already another repository's deploy key (GitHub
refuses it: *Key is already in use*; hPanel's `id_rsa` on the preview account belongs to `skillleo_v1`). The preview's
was made on 03.10.2026: `~/.ssh/rimify_deploy`, created on the host with one command the operator approved by hand,
its public line added under **GitHub › skillLeo/rimify › Settings › Deploy keys**, *Allow write access* off. Another
host account needs one more such key, the same way.

```bash
cd "$HOME/domains/<production-domain>"
git clone --branch deploy --depth 1 git@github-rimify:skillLeo/rimify.git public_html.new
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
**If not:** *Permission denied (publickey)* or *Repository not found* → the host's read key is not among rimify's
deploy keys (GitHub › Settings › Deploy keys), or `origin` is not `git@github-rimify:skillLeo/rimify.git`
(`git remote -v`; §4.0).

### 4.2 The release script

```bash
TARGET_ENV=production bash deploy/remote.sh 2>&1 | tee ~/backups/rimify-$TS.deploy.log
# staging (the review preview):  TARGET_ENV=staging bash deploy/remote.sh …
# the cron lines printed for hPanel instead of written (§6):  RIMIFY_CRON=manual TARGET_ENV=… bash deploy/remote.sh …
```

The renderer listens on a socket file, `storage/framework/ssr.sock` (D-047): Hostinger accepts no connection to
a port a customer's process opens — the renderer said „started“ and nothing ever reached it.

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
== renderer ready on /home/<user>/domains/<production-domain>/public_html/storage/framework/ssr.sock
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
| `renderer NOT ready after 30 s` | node did not start, or started where it cannot be reached | `tail -20 storage/logs/ssr.log`. *„Inertia SSR server started.“* with no socket path → the release predates D-047 and listens on a TCP port the host never lets anyone reach: deploy a release with the socket. Otherwise `bash deploy/ssr-watch.sh`; then run 4.2 again |
| `add these two lines in hPanel` | the host refused `crontab` | add them in hPanel (§6) and go on — this is not a failure |
| the smoke test fails (§5) | the site is up but wrong | §5 says per row; when in doubt, roll back (§7) |

### 4.3 Payments (the live shop, once)

A person, on the production site, never through the repository (R-16, `docs/dev/STRIPE.md`):

1. **Einstellungen › Zahlung**: Livemodus, the live publishable and secret key, the live webhook's signing secret;
   „Verbindung testen“ names the account.
2. **Stripe-Dashboard (live) › Entwickler › Webhooks**: the endpoint `https://<domain>/webhooks/stripe` with the
   seven events `StripeGateway::EVENTS` names.
3. **Apple Pay**: Stripe-Dashboard › Einstellungen › Zahlungsmethoden › Apple Pay › Domain hinzufügen; put the file
   Stripe offers at `public/.well-known/apple-developer-merchantid-domain-association` and press „Verifizieren“.
4. `.env`: `RIMIFY_PAYMENTS=stripe` — and `RIMIFY_SELLER_SMALL_BUSINESS` stays `false` (the client: normal VAT,
   30.09.2026); `php artisan config:cache`. The seller and the shipping (BLOCKED 19, 20) are entered by the client
   in **Einstellungen › Verkäufer & Versand**, with no box ticked as „Platzhalter“; the `RIMIFY_SELLER_*` and
   shipping lines in `.env` only answer while that page was never saved.
5. **Einstellungen › Zahlung › Rechnungsnummern**, once and for good: the first invoice number and the first credit
   note number the client's own accounting will issue next, the check box, „Rechnungsnummern eröffnen“. The page
   shows the first number as the invoice will print it (`RE-001043`) — compare it with the accounting before
   pressing. It cannot be undone; the Protokoll names who did it. Until it is done every invoice is a test invoice.

**Correct:** `rimify:preflight` shows Zahlung „Stripe im Livemodus“, Stripe-Webhook GO, Verkäuferangaben GO,
Versand und Lieferzeit GO, Rechnungsnummern GO („nächste RE-… und GS-…, eröffnet am … von …“). **If not**, the row
says what is missing, in a sentence.

### 4.4 `RIMIFY_RESET_ERLAUBT` — the reset's own flag, per environment

System › Zurücksetzen and `rimify:reset` empty a test shop (CLAUDE.md R-04.1). The server's own yes is one of the
four conditions, and the value it may have depends on the server:

| Environment | Required in `.env` | Without it |
|---|---|---|
| staging (the review preview) | `RIMIFY_RESET_ERLAUBT=true` — or `false` where the reset is meant to be off | the release refuses before maintenance; the screen would answer 404 to the Super-Admin |
| production (the live shop) | **no line at all** | — |

**Setting it in production is a defect**, whatever the value — `false` included: the live shop has no reset to allow
or forbid, and a line there is one typo away from `true`. The host step runs `php deploy/check-env.php .env
<production|staging>` against the fetched release **before** `artisan down`, and `deploy/remote.sh` runs it again
before it changes anything; either refuses with the line named. `rimify:preflight` fails a production `.env` that
has the line, and `rimify:smoke` asserts the result: on staging the screen answers 200 to a Super-Admin and 404 to
every other role, in production 404 to everyone, the Super-Admin included.

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

On the review preview the product rows (product page, lookup, PDF, test order) read *Keine freigegebene Felge im
Shop* until a real wheel is released and priced: its example catalogue is drafts only (release seed v4), and the
golden record's DB8GT2 waits for the operator to release both Gutachten and enter a price (PRESENT.md, steps 3–4).
That row is then expected — every other row must be ok.

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

The first keeps the renderer alive: it looks twice a run — at once and half a minute later — does nothing while
the renderer answers, and starts it within about half a minute when the host has stopped it; the pages are
server-rendered again from the first one after the restart (the gateway asks a renderer whose socket is newer
than its rest at once). Measured on the preview with one look a minute (02.10.2026): renderer back after 52 s,
the first server-rendered page after 65 s (HOST-FINDINGS 10). The second runs the scheduler — `demo:assert-clean` every day at 04:30 Berlin (R-12),
`orders:expire` every ten minutes (an order unpaid after 24 hours expires and its stock goes back), and a pulse
every minute that `rimify:preflight` reads („Zeitplan (Cron)“ turns GO within a minute of the line running).

**The second line is load-bearing:** without it no unpaid order ever expires, and the stock it holds stays reserved
for good. The shop says so rather than rely on memory — Admin › System shows a row „Zeitplan“ that turns amber, with
a banner on every admin page, once the pulse is an hour old (at once where it never ran). The pulse is kept in the
database, so a deploy's cache clear does not reset it.

**Correct — what it looks like when it works:**

```bash
crontab -l | grep -F "$APP"                       # both lines, once each
tail -3 storage/logs/ssr.log                      # after a stop: "… renderer restarted by ssr-watch"
pkill -u "$(id -u)" -f "$APP/bootstrap/ssr/ssr.js"; sleep 70; curl -s -m 2 --unix-socket "$APP/storage/framework/ssr.sock" http://localhost/health
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
# The dump names each trigger's DEFINER; setting one needs the SET USER privilege, which a shared host's account
# lacks — the load then stops at the first trigger with ERROR 1227 and leaves half a database. Without the clause
# every trigger is created for this same account.
gunzip -c ~/backups/rimify-$TS.sql.gz | sed -E 's/DEFINER=`[^`]+`@`[^`]+`//g' \
  | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" "$DB_DATABASE"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -N -e \
  "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = DATABASE();" "$DB_DATABASE"
```

**Correct:** no output from the first two commands; the last prints the number in `~/backups/rimify-$TS.triggers`.
**If not:** *Access denied* → run §0's `eval` and `export MYSQL_PWD` again (a new shell forgets them).
*ERROR 1227 … SET USER privilege* → the `sed` was left out: run the two commands above again, whole. **Never go on
to 7.4 with a trigger count that differs** — `artisan up` on half a database serves errors on every page.

### 7.3 The code back to §1

```bash
git reset --hard "$(cat ~/backups/rimify-$TS.commit)" 2>/dev/null \
  || { mkdir -p ~/rollback && tar -xzf ~/backups/rimify-$TS-release.tar.gz -C "$APP"; }
cp ~/backups/rimify-$TS.env .env
$PHP artisan optimize:clear > /dev/null && $PHP artisan optimize > /dev/null
# The renderer still running is the release you are leaving: stop it, so the watchdog starts the one now on disk.
pkill -u "$(id -u)" -f "$APP/bootstrap/ssr/ssr.js"; sleep 1
bash deploy/ssr-watch.sh; sleep 3; curl -s -m 2 --unix-socket "$APP/storage/framework/ssr.sock" http://localhost/health
git log -1 --format='%h %s'
```

The `git reset` works while the old commit is still in the folder's history; the archive covers the case
where a shallow fetch has dropped it. The `pkill` is not optional: `ssr-watch.sh` does nothing while a renderer
answers, and the one answering after a code rollback still holds the newer release's pages in memory — every
page would be rendered from components the restored code no longer sends props for.
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
| **Staging (Hostinger, MariaDB), 2026-09-29**, with both Borbet drafts in | the preview's database, 429 KB dump, 14 triggers | 0,24 s (archive 8,0 s) | 3,2 s | 5,6 s | **14,4 s**, smoke: every row ok but the product row, which waits for a released, priced wheel (§5) |
| **Staging, 2026-09-30 — a real release, then its rollback** | the preview's database after Block G, 436 KB dump; 18 triggers before the release, 22 after | 0,25 s (archive 31,8 s, 179 MB) | 3,5 s | 6,4 s | **16,1 s**, smoke: every row ok but the product row (§5) |
| **Staging, 2026-10-01 — down first, then §1, then 7.2–7.4** | the preview's database with the three Gutachten released and the DB8GT2 priced, 470 KB dump, 22 triggers; a marker table stood in for what a bad release adds | 1,3 s with commit, `.env` and trigger count (no archive: the commit was in the folder's history) | 2,5 s: marker gone, 22 of 22 triggers, the same rows in orders, audit_logs, fitments, admin_users, review_feedback | 19,2 s (4 s of it the two waits) | **25,1 s**, smoke: every row ok, the product row included |
| **Staging, 2026-10-02 — the same, with the hPanel cron lines in** (release `e982af1a`) | 476 KB dump, 22 triggers, 74 tables; marker table as above | 1,3 s, dump complete, 22 triggers in the dump and live | 2,5 s: marker gone, 22 of 22 triggers; orders 755, audit_logs 955, fitments 3014, admin_users 15, review_feedback 1 — before and after alike | 18,6 s | **24,5 s**, smoke: all 8 rows ok — the product row (229,00 € in the HTML without JavaScript) and the sandbox test order included |

The local row proves the steps, not the time on the host: the same MySQL, but no network between the shell
and the database, SSD, and no `git reset` (the code was already the backup's commit), so 7.3 is caches and
renderer only. The restore dropped a table the "bad release" had added (every table goes, not only the dump's)
and brought all 14 triggers back. It ran against a copy (`rimify_wf_rollback`), served by the development app
with its config cached to that copy, as production's `.env` would point it; the smoke test's test order was
written there and the copy was dropped afterwards.

The staging row is the second rehearsal on the host. The first, run exactly as §7.2 then read, **failed**: the
load stopped at the first trigger (*ERROR 1227 … SET USER privilege* — the dump names each trigger's DEFINER),
left 0 of 14 triggers and most tables missing, and 7.4 took the site up on it: the preview answered with errors
for about two minutes until the same dump was loaded without the DEFINER clauses. §7.2 now strips them and says
never to go on with a differing trigger count; the second rehearsal followed that text and is the number above.

The third rehearsal is the first with a real switch, the way a go-live would need it: the preview went down first
(so nothing saved on it meanwhile was lost), was backed up at `c7ed307d`, got the new release `996ff32e` by §4 —
whose migration adds four triggers and four columns — and was then rolled back by §7.1–7.4 as written. The
restore dropped what the release had added (22 triggers back to 18, `invoice_sequences` back to its old columns),
`git reset` found the old commit, and the renderer came back with the old code's pages — which needed the `pkill`
now in §7.3: without it the watchdog would have left the new release's renderer answering. The new release then
went back on (16,8 s). The whole rehearsal, down to the last deploy's smoke, took 88 s.

The fourth (2026-10-01) is the way to rehearse on a preview someone is reviewing: down first, then §1, so the
backup and the restore hold the same rows and nothing anyone saved is lost; a marker table stands in for what a
release adds, and the restore must drop it. It did, with 22 of 22 triggers and every counted table unchanged. 7.3
took 19,2 s against 6,4 s the day before (measured as a whole, not split into its steps); the whole rollback stays
far inside the ten minutes below.

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
| The renderer | `curl -s -m 2 --unix-socket "$APP/storage/framework/ssr.sock" http://localhost/health` | answers | §6 |
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
- [ ] `$PHP artisan rimify:go-live-check` → exit 0, and its count line shows nothing open „beim Kunden“ under „Recht
      und Pflichtangaben“ — while one of those is open the checkout takes no real payment (D-168); the client reads the
      same list in System › Was fehlt
- [ ] `grep RIMIFY_FEATURE_KEY_NUMBERS .env` → nothing or `auto`: the search by HSN/TSN opens by itself once the vehicle
      dataset is imported (KeyNumberSearch, D-167); `on` belongs to a development copy only
- [ ] Keep `~/backups/rimify-$TS*` for a week

---

## 10 · CI: what each push runs, and what it costs

The repository is private since 03.10.2026, so GitHub Actions bills its minutes: 2.000 a month on the free plan, on
runners with 2 cores. The workflows were split so that an everyday push costs a fraction of a release (D-148).
**Before moving a job into Checks, widening a matrix or adding the browser suite to CI, put its minutes against this
table** — at the old cost of 35–46 minutes a push, the month held about 50 pushes.

| A push to … | What runs | Billed minutes |
|---|---|---|
| `main`, code | **Checks** (`checks.yml`): Pint, Larastan, ESLint, Stylelint, vue-tsc, Vitest and Pest `--parallel` on MariaDB 11.8, in one job; the **Deploy** build | 13–16 measured on 4 cores (03.10.2026, while public); 15–20 expected on 2 |
| `main`, tests only (`tests/**`, `e2e/**`) | Checks; no Deploy build | 10–13 measured; ≈ 12–17 expected |
| `main`, documentation only (`docs/**`, `*.md`) | nothing | 0 |
| `release` — `git push origin <commit>:release` | **Release** (`release.yml`): the same on MariaDB, plus Pest `--parallel` on MySQL 8.4 | 22 measured on 4 cores; ≈ 25 expected on 2 |

2.000 minutes are about 100–130 everyday code pushes a month; documentation pushes are free. Both workflows run the
one job definition in `suite.yml`, so the everyday run and the release run cannot drift apart. The browser suite does
not run in CI: it runs locally, the whole suite three times in a row clean before a report. A production release is
a commit with a green **Release** run. Read a run's real cost under „Billable time“ on its page, or with
`C:\tools\gh\bin\gh.exe run view <id>` on the deploying machine.

---

## Where this runbook was wrong — its first run on the host (staging, 2026-09-29)

Followed top to bottom on the review preview, release `a1f6aabd` (26.09.) → `cbf439ce`. What did not go as
written, and what the runbook says now:

| Step | What the runbook said | What happened | Now |
|---|---|---|---|
| §1 | print the dump's last line | the SSH session dropped („Software caused connection abort“) — twice, on that one line | `… \| tail -1 \| grep -c 'Dump completed'` → `1` |
| §1 → later | one session holds `$TS` | a detached release and the rollback run in other sessions; `$TS` was gone | `TS` also written to `~/backups/current-ts` |
| §2 | `rimify:preflight` before the release | the running release predates the command: „not defined“, and Laravel offered to run **`rimify:release-seed` instead** (no was the default) | `--no-interaction`; read the preflight after §4.2 when the host's release lacks it; the staging rows named |
| §4.2 | `TARGET_ENV=production` | the preview is staging | both written out |
| §4.2 | „renderer ready on 13714“ | *renderer NOT ready after 30 s*, site left in maintenance. The host accepts no connection to a port a customer's process opens: the renderer, a bare Node server and PHP's own server all said „listening“ and all answered „connection refused“ — from SSH and from the web server. No page on the preview had ever been server-rendered | the renderer on a socket file (D-047, `cbf439ce`); the table's advice for this line rewritten |
| §4.2 / §6 | `remote.sh` writes the cron lines | writing the account's crontab from a release is the operator's step (§6) | `RIMIFY_CRON=manual` prints them; on the preview they are **not yet in hPanel** |
| §5 | every smoke row ok | *Keine freigegebene Felge im Shop*: the preview's only real wheel waits for the operator's release and price | said in §5 as the one expected row on the preview |
| §6–§8 | health at `127.0.0.1:13714` | nothing listens there any more | `curl --unix-socket …/storage/framework/ssr.sock http://localhost/health` |
| §7.2 | load the dump as it is | *ERROR 1227 … SET USER privilege* at the first trigger; half a database; 7.4 then opened the site on it (≈ 2 min of errors on the preview) | the DEFINER clauses stripped on load; stop before 7.4 on a differing trigger count |
| §7 timing | `bc` for the arithmetic (the rehearsal script) | not installed on the host | shell arithmetic on `date +%s%N` |

Also seen: the push to `main` did **not** trigger Hostinger's own Git integration this time (`public_html`, `vendor/`
and `.env` intact a minute after the push) — the hPanel setting is still worth checking before production.