# What the Hostinger host is — measured, not assumed

The preview (`rimify.skillleo.com`, staging since 29.09.2026) runs on the client's Hostinger shared plan. Each
finding below was found by running the release there and seeing it fail or differ; each names what changed in
the shop because of it. The production host is expected to be the same kind of plan — every item applies to it.

| # | Finding | How it showed | What the shop does about it | Where |
|---|---|---|---|---|
| 1 | **The database is MariaDB 11.8.9, not MySQL.** `SELECT VERSION()` → `11.8.9-MariaDB-log`. | Every test had run on MySQL 8.4.9 (CLAUDE.md §4). | The suite now runs on MariaDB 11.8 by default and on MySQL 8.4 as well (2.037 tests green on MariaDB); CI has one leg each; the app refuses an engine or release series the suite has not run against, at its first connection, naming both; the preflight has a row for it. CHECK, SIGNAL, FULLTEXT, collation and strict mode measured alike; MariaDB's `SHOW CREATE TABLE` leaves out `ON DELETE RESTRICT` (its default) — `information_schema` confirms the rule. | D-052, `1411c342`, `docs/dev/DATABASE.md` |
| 2 | **No TCP port a customer's process opens can be reached** — not from SSH, not from the web. | The SSR renderer said „started“ and no page was ever server-rendered; PHP's own server the same. | The renderer listens on a Unix socket, `storage/framework/ssr.sock` (`RIMIFY_SSR_SOCKET`); pages wait at most ~0,5 s + 2,5 s for it and pause SSR 30 s after a failure. | D-047, `cbf439ce`, GO-LIVE §4.2 |
| 3 | **A dump's triggers cannot be restored as dumped**: the account lacks `SET USER`, so `DEFINER=` fails with ERROR 1227. | The first rollback rehearsal stopped at the first trigger and left half a database. | GO-LIVE §7.2 strips the `DEFINER` clauses and compares the trigger count before going up again. The rehearsal then took 14,4 s. | D-050, GO-LIVE §7.2 |
| 4 | **Writing the crontab is not ours to do.** | `remote.sh` installing the two cron lines was refused as persistence. | `RIMIFY_CRON=manual` prints them; a person adds them in hPanel (GO-LIVE §6). The scheduler writes a pulse every minute and the preflight reads it („Zeitplan (Cron)“), so a missing line is visible. Still open on the preview: the renderer watchdog and the scheduler — `orders:expire` does not run there until they are added. | GO-LIVE §6, `42d9d156` |
| 5 | **No queue worker can be supervised.** | Shared plan: no Supervisor, no long-running process kept alive. | The queue stays `sync`; the payment webhook's work runs straight after its 200 (`afterResponse`), so Stripe never waits for the invoice and the mail. The preflight's queue row says so. | D-054 |
| 6 | **hPanel's own Git integration can empty `public_html`.** | On 23.09. it pulled `main` (no `vendor/`, no build) and deleted the untracked `.env`: a blank 500 on every path. | The host is checked out on `deploy` (built by CI from `main`); a copy of the working `.env` is kept outside the web root. Until hPanel → Git tracks `deploy` or auto-deploy is off, a push to `main` can repeat it. | GO-LIVE §4.0, memory of 23.09. |
| 7 | **SSH drops on a large output line or a loopback connect** („Software caused connection abort“); `plink -m` does not work; uploads by pscp/sftp abort. | Printing a dump's last line; `curl` to the host's own address. | Host scripts print counts, not dumps; they run detached (`nohup setsid …`) and are polled; releases are pulled from GitHub, never uploaded. | GO-LIVE §0 |
| 8 | **`bc` is not installed**; PHP for the app is `/opt/alt/php84/usr/bin/php` (8.4), Node `/opt/alt/alt-nodejs22/root/usr/bin/node`. | Timing arithmetic in the rollback script. | Shell arithmetic (`$(( ))`); the paths are named in GO-LIVE §0. | GO-LIVE §0 |
| 9 | **Invoices live on the private disk**, outside `public_html/public`. | By design; checked because the shared plan serves everything under `public/`. | `storage/app/private/invoices/`, reachable only by a signed link; the preflight's „Rechnungen“ row fails if the folder is ever under the public path. | `315b2bc4`, `42d9d156` |

## Still to measure there

- The renderer watchdog after the hPanel cron lines are in: kill the renderer, wait a minute, the socket answers
  again and `ssr.log` has a *restarted by ssr-watch* line (GO-LIVE §6, „Correct“).
- Outgoing mail from the host with the client's sender domain (SPF, DKIM, DMARC — BLOCKED 5): `rimify:mail-test`.
- A Stripe webhook reaching `/webhooks/stripe` on the preview once the test keys are in (`docs/dev/STRIPE.md`).
