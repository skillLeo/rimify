# Moving the plan to Hostinger's data centre in Germany — runbook

> **Status: written 06.10.2026, not run.** It runs on the operator's word only (brief „AFTER CI“, §2) — the move takes
> seven websites offline for up to four hours, and Hostinger allows one data-centre change in 30 days, so there is no
> moving back for a month. The rollback below is a restore in place, on the new server, never a move back.

## 0 · What is decided

| What | Where | Note |
|---|---|---|
| Web server and database — preview and live shop | **Hostinger, data centre Germany** (Frankfurt am Main) | brief „AFTER CI“ §2; `rimify:go-live-check` passes „Serverstandort in Deutschland“ on a `de-…` server only (D-181) |
| Media, Gutachten PDFs, invoices (the bucket) | AWS S3 `eu-north-1` (Stockholm, Sweden) — **unchanged** | an EU region; nothing in this runbook touches it |
| Mail (Amazon SES, once adopted) | AWS `eu-north-1`, the bucket's account | brief §3 |
| Payments | **Stripe Payments Europe, Ltd.**, One Wilton Park, Wilton Place, Dublin 2, Ireland | the Stripe contracting entity for an account registered in Germany (stripe.com/legal/ssa); confirmed on the account once its test keys are in (Einstellungen › Zahlung › „Verbindung testen“ names the account's country — `DE` means this entity) |
| Never | United Kingdom, USA | |

This is not a question for the Kanzlei: the location is decided (`docs/client-questions.md` 35).

## 1 · Where the plan is today — read 06.10.2026 over the deploy key

| | Today |
|---|---|
| Server | `us-bos-web1780.main-hosting.eu` — Hostinger's Boston data centre, **USA** |
| Database | on the same server (`DB_HOST=localhost`), MariaDB `11.8.9-MariaDB-log` |
| PHP / Node | 8.4.25 (`/opt/alt/php84`) / 22.18.0 (`/opt/alt/alt-nodejs22`) |
| Account, home | `u290685119`, `/home/u290685119` |
| SSH | `46.202.183.38:65002`, host key pinned in `~/.ssh/rimify_known_hosts` |
| Renderer socket | `/home/u290685119/domains/rimify.skillleo.com/public_html/storage/framework/ssr.sock` (`RIMIFY_SSR_SOCKET` in `.env`) |
| Cron | in hPanel › Erweitert › Cron-Jobs (`crontab -l` shows nothing on this plan) |
| Apple Pay file | none on the preview (`public/.well-known/` does not exist) |

**The plan carries seven websites, and a data-centre change moves all of them:** codefixxer.com,
homeprosguru.codefixxer.com, pasticcere.skillleo.com, rimify.skillleo.com, sargodhagas.com, skillleo.com,
whoislastprophet.com. All seven are on Hostinger's nameservers (`dns-parking.com`). rimify.skillleo.com and three
others answer through Hostinger's CDN (`179.61.189.92`, `91.108.100.74` for the preview, TTL 60 s); **codefixxer.com,
skillleo.com and whoislastprophet.com point straight at `46.202.183.38`**, the address that changes.

The live shop's domain, **rimify.de, has its nameservers at IONOS** (`ui-dns.*`): its records are changed there, by
whoever holds the IONOS login — Hostinger cannot change them.

## 2 · A setting, not a migration — and what it costs

In hPanel the data centre is a setting of the plan; changing it starts **Hostinger's own transfer** of the whole plan
— files, databases, mailboxes (Hostinger support: „Server locations“, article 1583267; „How to change the data
center“, article 5577027). What Hostinger states about it:

- once in **30 days**;
- **up to 4 hours**, during which hPanel is locked for the plan;
- the plan gets a **new IP address**;
- what is written on the old server while the transfer runs may not arrive — orders, uploads, admin edits.

Germany is offered for web and cloud hosting plans. **The list for this plan is shown only in hPanel** — the first
step below reads it, and if „Deutschland“ is not in it, stop: this runbook does not apply, and route 2 in §3 does.

What the move costs, each with the step that pays it:

| Cost | Why | Step |
|---|---|---|
| New IP | a new server | §5.3 SSH; §5.2 DNS where a record names the IP |
| DNS TTL lowered beforehand | the records that name the IP keep the old one for their TTL | §4.2 |
| New TLS certificate | issued on the new server; the shop sends HSTS (two years, `includeSubDomains`, `preload`), so a browser that has seen it refuses the site outright on any certificate error — there is no click-through | §5.4 |
| Apple Pay domain file re-verified | Apple checks the file on the domain; the live shop only, once Apple Pay is set up (GO-LIVE §4.3) | §5.8 |
| Two cron lines recreated | the renderer's watchdog and the scheduler; the transfer may not carry them, and their paths name the old server's layout | §5.6 |
| SSR socket path re-checked | `.env` names the socket by absolute path; a socket file copied from the old server is dead (the renderer removes a stale one itself, `resources/js/ssrSocket.ts`) | §5.7 |
| Database moved with its triggers | the append-only guarantee (R-12) lives in triggers, and a dump loaded on a shared host can lose them or bring them back refusing nothing (D-050) | §5.5, the acceptance test |
| Reset baseline rebuilt | the reset replaces the schema from a baseline built on the host's engine; a different engine version on the new server needs a new one | §5.9 |
| Seven websites down | the whole plan moves | §4.1 |

## 3 · Two routes — pick before anything

1. **The live shop is not on this plan yet — open its plan in Germany.** A plan bought with the data centre
   „Deutschland“ needs no move: nothing is transferred, no other website is touched, and GO-LIVE runs as written.
   This is the recommended route for the live shop. The preview can stay where it is until route 2 is wanted.
2. **Move this plan** — the preview and the six other websites with it. The rest of this runbook.

Both end in the same place for the live shop. Route 2 alone has a 30-day lock and a four-hour window.

## 4 · Before the day

### 4.1 Agree the window (operator)

- Up to four hours with **all seven websites** in maintenance or unreachable. Tell the owners of the other six.
- **Not before 11.10.2026, 20:00**: until then the preview's last reset can be undone (on the operator's word), and an
  undo across a data-centre move has never been tested.
- A weekday evening, Berlin time, with someone on the IONOS login reachable once rimify.de is live.

### 4.2 Lower the TTLs — at least 24 hours ahead (operator)

- hPanel › Domains › DNS-Zone for **skillleo.com, codefixxer.com, whoislastprophet.com**: every `A` and `AAAA`
  record that names `46.202.183.38` → TTL **300**.
- Once rimify.de is live: IONOS › Domains › rimify.de › DNS → its `A`/`AAAA` records → TTL **300**.
- The preview's records answer through the CDN with TTL 60: nothing to do.

Check from any machine the next day: `nslookup -type=a skillleo.com` (and the others) — the answer's TTL is 300 or less.

### 4.3 Read what the plan offers (operator, nothing changes)

hPanel › Hosting › the plan › Rechenzentrum / „Serverstandort ändern“: the list must contain **Deutschland**. Close the
dialog without choosing. If it is missing: stop, route 1.

## 5 · The move

Two people's steps: **operator** in hPanel and the browser, **Claude** over the deploy key (never a password on a
command line — GO-LIVE §0). Every Claude step is read back to the operator with its result.

### 5.1 Down, and the last backup (Claude)

```bash
cd ~/domains/rimify.skillleo.com/public_html && export PHP=/opt/alt/php84/usr/bin/php APP="$PWD"
$PHP artisan down --render="errors::503" --retry=600
```

Then GO-LIVE **§1 exactly as written** — dump with triggers, commit, `.env`, release archive, trigger count — and in
addition, for the comparison after the move:

```bash
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -N -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name" "$DB_DATABASE" > ~/backups/rimify-$TS.tables
for t in orders order_lines order_line_fitments audit_logs fitments vehicles approval_documents admin_users; do echo "$t $(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -N -e "SELECT COUNT(*) FROM $t" "$DB_DATABASE")"; done | tee ~/backups/rimify-$TS.counts
$PHP artisan rimify:append-only-check | tee ~/backups/rimify-$TS.append-only
sha256sum ~/backups/rimify-$TS.sql.gz ~/backups/rimify-$TS-release.tar.gz > ~/backups/rimify-$TS.sha256
```

**Then copy the four backup files and `.sha256` off the server** (Claude, `scp` with the deploy key, into
`C:\rimify\backups\umzug-$TS\`): the transfer moves `~/backups` too, and a backup that only exists on the thing being
moved is no backup.

**Correct:** GO-LIVE §1's checks hold (dump complete, trigger counts equal); `rimify:append-only-check` ends
„Protokoll und Prüfnachweise lehnen jede Änderung ab.“; the local copy's SHA-256 sums match `.sha256`.
**If not:** stop here, `artisan up`, nothing has moved.

The other six websites: their owners take them down or accept that writes during the transfer may be lost.

### 5.2 Start the transfer (operator)

hPanel › Hosting › the plan › Rechenzentrum › **Deutschland** › confirm. hPanel locks the plan until Hostinger is
done (up to four hours; Hostinger e-mails when it is).

Afterwards, in hPanel › Domains › DNS-Zone: the records of skillleo.com, codefixxer.com and whoislastprophet.com name
the **new** IP (Hostinger rewrites its own zones; if one still names `46.202.183.38`, change it to the new IP shown in
hPanel › Hosting › Details). rimify.de, once live: at IONOS, by hand.

### 5.3 SSH to the new server (operator, then Claude)

The new server has a new address and a new host key. **Operator:** hPanel › Erweitert › SSH-Zugang — read the IP,
the port and the host key's SHA256 fingerprint, and check the deploy key `rimify-preview-deploy` is still listed (add
it again from `~/.ssh/rimify_preview_deploy.pub` if not). **Claude:** connect once with
`-o StrictHostKeyChecking=accept-new` into a **new** known-hosts file, compare the fingerprint it wrote
(`ssh-keygen -lf`) with the one hPanel shows, and only on a match replace the old pin and the address in the deploy
script. A mismatch: stop and say so — something else is answering.

```bash
hostname                                   # de-…-web…  — anything else: Hostinger moved the plan elsewhere; stop
cd ~/domains/rimify.skillleo.com/public_html && export PHP=/opt/alt/php84/usr/bin/php APP="$PWD"
$PHP -v | head -1; /opt/alt/alt-nodejs22/root/usr/bin/node -v
echo "$HOME"                               # /home/u290685119 — a different home changes §5.6 and §5.7
```

### 5.4 The certificate, before anything is opened (Claude, from outside)

```bash
curl -sv -o /dev/null https://rimify.skillleo.com/ 2>&1 | grep -E 'subject:|issuer:|expire date:|SSL certificate verify'
```

**Correct:** `subject: CN=rimify.skillleo.com` (or a name list containing it), a known issuer, an expiry date in the
future, `SSL certificate verify ok`. **If not:** hPanel › Sicherheit › SSL › the domain › „Installieren“ (operator);
the site stays in maintenance until this line is correct — HSTS leaves no second chance for a visitor.

### 5.5 The database — the acceptance test (Claude)

```bash
eval "$(grep -E '^DB_(HOST|PORT|DATABASE|USERNAME|PASSWORD)=' .env)"; export MYSQL_PWD="$DB_PASSWORD"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -N -e "SELECT VERSION(); SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = DATABASE();" "$DB_DATABASE"
for t in orders order_lines order_line_fitments audit_logs fitments vehicles approval_documents admin_users; do echo "$t $(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -N -e "SELECT COUNT(*) FROM $t" "$DB_DATABASE")"; done | diff - ~/backups/rimify-$TS.counts && echo "counts equal"
$PHP artisan rimify:append-only-check
```

**This is the acceptance test of the move, and it has two parts that must both hold:**

1. the trigger count equals `~/backups/rimify-$TS.triggers`, and the row counts are equal (`counts equal`);
2. `rimify:append-only-check` — the same probe a reset runs after its restore (the reset brief's §3.1, R-12.3) — ends
   **„Protokoll und Prüfnachweise lehnen jede Änderung ab.“**: the four triggers are there by name, an UPDATE and a
   DELETE of a real Protokoll entry and of a real Prüfnachweis are refused with **SQLSTATE 45000**, and deleting the
   order line under a Prüfnachweis is refused with error 1451. Counting cannot see a trigger that refuses nothing;
   this does.

**If either fails:** the database Hostinger brought over is not the one that left. Load our own dump, with the
DEFINER clauses stripped (D-050: the account lacks SET USER, and a dump that names a DEFINER stops at the first
trigger) — GO-LIVE **§7.2 exactly as written**, from `~/backups/rimify-$TS.sql.gz` (or the local copy, uploaded
with `scp`, its SHA-256 checked) — then run this step again from the top. **Never go on with a check that does not
hold:** the shop would take orders whose proof of approval can be changed.

The engine version: if `VERSION()` is not `11.8.9-MariaDB…`, note it — §5.9 depends on it.

### 5.6 The two cron lines (operator)

hPanel › Erweitert › Cron-Jobs: GO-LIVE §6's two lines, every minute, with this plan's paths:

```
SSR_PORT=13714 NODE_BIN=/opt/alt/alt-nodejs22/root/usr/bin/node bash /home/u290685119/domains/rimify.skillleo.com/public_html/deploy/ssr-watch.sh
cd /home/u290685119/domains/rimify.skillleo.com/public_html && /opt/alt/php84/usr/bin/php artisan schedule:run
```

If the transfer carried them, check the paths against §5.3's `$HOME` and the Node path; if not, add them. **Correct:**
within two minutes `rimify:preflight` shows „Zeitplan (Cron)“ GO, and §5.7's health check answers.

### 5.7 The renderer's socket (Claude)

```bash
grep -E '^RIMIFY_SSR_SOCKET=' .env                     # must be "$APP/storage/framework/ssr.sock" with §5.3's $APP
$PHP artisan config:clear && $PHP artisan config:cache
pkill -u "$(id -u)" -f "$APP/bootstrap/ssr/ssr.js"; bash deploy/ssr-watch.sh; sleep 5
curl -s -m 2 --unix-socket "$APP/storage/framework/ssr.sock" http://localhost/health
```

**Correct:** the `.env` line names this server's path (if the home changed, correct it with `sed -i` on that one
line, then `config:cache`); the health check answers. **If not:** `tail -20 storage/logs/ssr.log` — GO-LIVE §4.2's
table says per line.

### 5.8 Apple Pay (operator — the live shop only, once Apple Pay is set up)

Stripe-Dashboard (live) › Einstellungen › Zahlungsmethoden › Apple Pay › the domain › **„Verifizieren“**. The file
`public/.well-known/apple-developer-merchantid-domain-association` moved with the files; Apple fetches it from the
new address. **Correct:** „Verifiziert“. On the preview there is nothing to do: no file, no Apple Pay.

### 5.9 The reset baseline (Claude)

The reset (`rimify:reset`, System › Zurücksetzen) replaces the schema from `database/baseline/testumgebung.sql`, built
by CI on MariaDB 11.8.9 — the host's engine (CLAUDE.md §4).

- **Same engine (`11.8.9`):** rebuild it locally on `C:\rimify\tools\mariadb-11.8.9` (`php artisan
  rimify:reset-baseline` against a scratch database, as `.github/workflows/deploy.yml` does) — it is written to read
  the same however often it is written, so `git diff --exit-code database/baseline/` must be empty; then on the host
  `$PHP artisan rimify:reset-baseline --check` → exit 0.
- **Another version:** the new engine is the engine now. In one change: the CI image in `suite.yml`, `release.yml`
  and `deploy.yml`, the list in `config/rimify.php` › `database.engines`, the local copy under `C:\rimify\tools`,
  `docs/dev/DATABASE.md`; a green run on both legs; the baseline rebuilt on it and shipped by a deploy; then
  `rimify:reset-baseline --check` on the host → exit 0. Until that release is out, the preview's reset stays unused.

### 5.10 Up, and prove it (Claude)

```bash
$PHP artisan up && $PHP artisan rimify:smoke && $PHP artisan rimify:go-live-check
```

**Correct:** every smoke row as in GO-LIVE §5; `rimify:go-live-check` now shows **„Serverstandort in Deutschland“ —
erfüllt** („Nach dem Namensschema des Hosts steht der Server de-… in Deutschland.“). The protected elements
(`docs/design/PROTECTED.md`) are looked at on the deployed page itself — they once vanished through seeded data, not
code (D-089): the hero photograph, and the numbers section once a wheel is published, as the smoke's homepage row
asserts. Then `rimify:go-live-check --markdown=docs/review/WAS-FEHLT.md` — the line moves from „beim Host“ to
„erfüllt“.

### 5.11 Afterwards

- DNS TTLs back to 3600 (operator, §4.2's records) once a day has passed without trouble.
- The backups from §5.1 stay a week on the server and in `C:\rimify\backups\umzug-$TS\`.
- `docs/review/WAS-FEHLT.md`, `docs/launch/HOST-FINDINGS.md` (server name, IP, the times measured) and
  `docs/client-questions.md` 35 updated; the deploy script's address and pin committed where they live.

## 6 · Rollback

**There is no moving back for 30 days.** A rollback is a restore on the new server to §5.1's state — code, `.env`,
files and database — which GO-LIVE §7 already does and has rehearsed on this host (24,5 s, 02.10.2026):

| Where it went wrong | What to do |
|---|---|
| Before §5.2 (nothing moved) | `$PHP artisan up`; the old server is untouched |
| The transfer fails, or Hostinger reports it incomplete | Hostinger support (hPanel › Hilfe) — the plan is theirs while it is locked; ask for the old server to be kept serving until the transfer is complete; keep §5.1's local copy at hand |
| §5.4 certificate wrong | stay in maintenance; reinstall the certificate in hPanel; no visitor reaches the site meanwhile |
| §5.5 acceptance fails twice — once on Hostinger's copy, once on our own dump | stay in maintenance; GO-LIVE §7.2 again from the **local** copy (SHA-256 checked), run §5.5; if it still fails, the new server's engine refuses the triggers — that is a finding for the operator, not something to open on |
| §5.6–§5.10 fail | GO-LIVE **§7.1–§7.4 as written** on the new server: down, database from §5.1's dump (DEFINER stripped), code from `rimify-$TS.commit` or the archive, `.env` from `rimify-$TS.env`, renderer restarted with the `pkill`, up, smoke |
| A website of the other six is broken | its owner's matter; Hostinger moved its files and database the same way — its own backup |

**The trigger probe closes every row that touches the database:** after any restore, `rimify:append-only-check`
must end „Protokoll und Prüfnachweise lehnen jede Änderung ab.“ before `artisan up`.

## 7 · Record

When it has run: one line in `docs/decisions.md` — the date, the old and new server names, the IP, the time from
`down` to the last smoke row, and whether §5.5 passed on Hostinger's copy or needed our own dump.
