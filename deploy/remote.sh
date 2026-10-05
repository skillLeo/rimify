#!/usr/bin/env bash
#
# Runs ON the production host after every deploy. Deliberately light: nothing here compiles the
# front end — that happens on GitHub's runner and arrives ready-made on the `deploy` branch. The
# host is shared, and a build there once exhausted the account's process limit for every site on it.
#
# Idempotent: safe to run twice, and it creates .env on the very first run.
#
# Order, and why: the site is in maintenance mode before this starts (the workflow's SSH step runs
# `artisan down` with the old code, before checking out the new). This script then migrates, applies
# the release's seeded data once (`rimify:release-seed`), rebuilds the caches and restarts SSR, and
# brings the site back with `artisan up` as its LAST step. `set -e` means any failure stops here with
# the site still in maintenance: a maintenance page, never new code on an unmigrated schema.
#
# By hand: `php artisan down --render="errors::503"`, then pull, then `bash deploy/remote.sh` —
# docs/launch/GO-LIVE.md is the full runbook, backup and rollback included.

set -euo pipefail

APP="${APP_DIR:-$HOME/domains/rimify.skillleo.com/public_html}"
PHP="${PHP_BIN:-/opt/alt/php84/usr/bin/php}"
NODE="${NODE_BIN:-/opt/alt/alt-nodejs22/root/usr/bin/node}"
SSR_PORT="${SSR_PORT:-13714}"
# The renderer listens on this socket file: the shared host reaches no port a customer's process opens,
# and a socket (0600) is this account's alone (D-047). SSR_SOCKET= (empty) keeps the TCP port.
SSR_SOCKET="${SSR_SOCKET-$APP/storage/framework/ssr.sock}"
# RIMIFY_CRON=manual: the two cron lines are printed for hPanel, never written with crontab.
RIMIFY_CRON="${RIMIFY_CRON:-install}"

# What this host is. `production` (the default): the client's shop — no demo row, ever (R-12), and
# the release stops if it finds one. `staging`: a review preview — the admin is on, and its
# demonstration data is written once, flagged as such on every screen (DemoGuard allows it there).
TARGET_ENV="${TARGET_ENV:-production}"
case "$TARGET_ENV" in
    production|staging) ;;
    *) echo "== TARGET_ENV must be production or staging, not $TARGET_ENV"; exit 1 ;;
esac

cd "$APP"
echo "== code: $(git log -1 --format='%h %s')"

# CLAUDE.md R-04.1, before anything changes: the reset's own flag as this environment requires it — absent in the live
# shop, `true` or `false` on a test server (deploy/check-env.php). The host step runs the same check against the fetched
# release before it takes the site down; this covers a manual run.
if [ -f .env ]; then
    "$PHP" deploy/check-env.php .env "$TARGET_ENV"
fi

# A manual run may not have taken the site down first. This covers that case; it is a no-op when
# the workflow already did. It may fail before composer has run, hence `|| true`.
"$PHP" artisan down --render="errors::503" --retry=60 > /dev/null 2>&1 || true

# ── Environment ────────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
    cp .env.example .env
    echo "== .env created from .env.example"
    # A new test server decides the reset's flag before its first release (GO-LIVE.md §4.4); a new live shop passes.
    "$PHP" deploy/check-env.php .env "$TARGET_ENV"
fi

set_env() { "$PHP" deploy/env.php "$1" "${2:-}"; }
set_env APP_ENV "$TARGET_ENV"
if [ "$TARGET_ENV" = staging ]; then
    set_env DEMO_DATA 1
    set_env RIMIFY_ADMIN_ENABLED true
    # The client's review: the board, the feedback button and the review accounts.
    set_env RIMIFY_REVIEW true
    # Test orders end to end: a page that says it is a test chooses how the payment ends.
    set_env RIMIFY_PAYMENTS sandbox
    # A preview sends no mail: every message goes to the log.
    set_env MAIL_MAILER log
else
    set_env DEMO_DATA 0
    set_env RIMIFY_REVIEW false
    set_env RIMIFY_PAYMENTS none
    # CLAUDE.md R-04.1: the live shop's .env has no RIMIFY_RESET_ERLAUBT line at all — deploy/check-env.php refused the
    # release above if it had one. A test server's line is set there by hand, once — never by this script.
    # Production's mail settings are the operator's (.env, GO-LIVE.md): never overwritten here, and
    # rimify:preflight refuses a production that only writes its mail to the log.
fi
set_env APP_DEBUG false
set_env APP_URL "${APP_URL:-https://rimify.skillleo.com}"
set_env LOG_STACK daily
set_env LOG_LEVEL warning
set_env SESSION_DRIVER file
set_env CACHE_STORE file
set_env QUEUE_CONNECTION sync
set_env DB_HOST "${DB_HOST:-localhost}"
set_env DB_PORT "${DB_PORT:-3306}"
set_env DB_DATABASE "${DB_DATABASE:-}"
set_env DB_USERNAME "${DB_USERNAME:-}"
set_env DB_PASSWORD "${DB_PASSWORD:-}"
set_env INERTIA_SSR_PORT "$SSR_PORT"
set_env INERTIA_SSR_URL "http://127.0.0.1:$SSR_PORT"
if [ -n "$SSR_SOCKET" ]; then set_env RIMIFY_SSR_SOCKET "$SSR_SOCKET"; fi
grep -q '^APP_KEY=base64' .env || "$PHP" artisan key:generate --force --no-interaction

# ── Writable directories ───────────────────────────────────────────────────────
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache

# ── PHP dependencies and schema ────────────────────────────────────────────────
COMPOSER="$(command -v composer || echo /usr/local/bin/composer)"
"$PHP" "$COMPOSER" install --no-dev --optimize-autoloader --no-interaction --no-progress 2>&1 | tail -1
# R-12: a production database holds no demo rows. Found any, the release stops here, still in
# maintenance. A staging preview holds them on purpose.
if [ "$TARGET_ENV" = production ]; then
    "$PHP" artisan demo:assert-clean --no-interaction
fi
"$PHP" artisan migrate --force --no-interaction

# A brand-new database gets the reference data once — and, on staging only, the development cars
# and the example catalogue (the seeders refuse both in production: the live shop's cars come from
# the vehicle data import). An existing one is never re-seeded: that would overwrite whatever has been
# edited since. "Brand-new" is read from the reference data, which every environment gets.
SEEDED="$("$PHP" artisan tinker --execute='echo \Illuminate\Support\Facades\DB::table("load_index_table")->count();' 2>/dev/null | tail -1)"
if [ "$SEEDED" = "0" ]; then
    echo "== empty database: seeding"
    "$PHP" artisan db:seed --force --no-interaction
fi

# The seeded data this release changes (renamed demo catalogue, retired fitments, corrected
# content), applied once per release and recorded. A no-op on every later deploy.
"$PHP" artisan rimify:release-seed --no-interaction

# Staging: the admin's demonstration data, written once — the Übersicht, the orders, the Protokoll.
# Never again on a later deploy: its frozen snapshots may not be rewritten (R-12), and a set that is
# there is kept (`demo:reanchor` moves its dates, `demo:purge` takes it away).
if [ "$TARGET_ENV" = staging ]; then
    DEMO_ROWS="$("$PHP" artisan tinker --execute='echo \App\Services\Demo\DemoTables::setTotal();' 2>/dev/null | tail -1)"
    if [ "$DEMO_ROWS" = "0" ]; then
        # Not where a person took it away (the strip, demo:purge, Testumgebung zurücksetzen): that stays so.
        echo "== staging: writing the demonstration data, unless it was removed"
        "$PHP" artisan demo:seed --unless-removed --no-interaction | tail -2
    else
        echo "== staging: demonstration data present ($DEMO_ROWS rows)"
    fi

    # The review accounts (docs/review/ACCOUNTS.md): made or refreshed on every staging deploy.
    "$PHP" artisan db:seed --class=ReviewAccountsSeeder --force --no-interaction
fi

# The demo imagery is served from storage/app/public through the public/storage link. Made with
# `ln`, not `artisan storage:link`: this shared host disables PHP's `exec()`, and Laravel's
# Filesystem::link() reaches for it, so the artisan command aborts the whole release.
[ -L public/storage ] || ln -s "$APP/storage/app/public" public/storage

# ── Caches ─────────────────────────────────────────────────────────────────────
"$PHP" artisan optimize:clear > /dev/null
"$PHP" artisan optimize > /dev/null
echo "== caches rebuilt"

# Outside the live shop, the files the web server serves itself (/storage: the PDFs, the pictures) carry noindex like
# every page; the live shop's are open. Also removes the old preview password's files (D-088): nothing on any copy
# asks for a password but the admin's own sign-in.
"$PHP" artisan rimify:storage-headers --no-interaction

# ── SSR ────────────────────────────────────────────────────────────────────────
# Stop only this site's renderer: node processes whose command line names this app's bundle.
for pid in $(pgrep -u "$(id -u)" -x node || true); do
    if tr '\0' ' ' < "/proc/$pid/cmdline" | grep -q "$APP/bootstrap/ssr/ssr.js"; then
        kill "$pid" && echo "== stopped renderer $pid"
    fi
done
sleep 1
INERTIA_SSR_PORT="$SSR_PORT" INERTIA_SSR_SOCKET="$SSR_SOCKET" nohup setsid "$NODE" "$APP/bootstrap/ssr/ssr.js" > storage/logs/ssr.log 2>&1 < /dev/null &

# Readiness: the site is not opened before the renderer answers. Up to 30 seconds; if it never does,
# the release stops here with the site still in maintenance (set -e) — a page without server
# rendering is empty for search engines, and that is not how a release goes live.
renderer_health() {
    if [ -n "$SSR_SOCKET" ]; then
        curl -s -m 2 -o /dev/null -f --unix-socket "$SSR_SOCKET" http://localhost/health
    else
        curl -s -m 2 -o /dev/null -f "http://127.0.0.1:$SSR_PORT/health"
    fi
}
READY=0
for _ in $(seq 1 30); do
    if renderer_health; then READY=1; break; fi
    sleep 1
done
if [ "$READY" = 1 ]; then
    echo "== renderer ready on ${SSR_SOCKET:-port $SSR_PORT}"
else
    echo "== renderer NOT ready after 30 s — the site stays in maintenance. storage/logs/ssr.log:"
    tail -5 storage/logs/ssr.log
    exit 1
fi

# Two lines in cron, every minute (docs/launch/GO-LIVE.md §6). The host may stop the renderer between
# releases: the watchdog starts it again within about half a minute (deploy/ssr-watch.sh looks twice a run; it
# does nothing while the renderer answers). The scheduler runs what routes/console.php plans — demo:assert-clean daily in
# production (R-12). Idempotent: this app's two lines replaced, every other line on the account kept.
WATCH="* * * * * SSR_PORT=$SSR_PORT NODE_BIN=$NODE bash $APP/deploy/ssr-watch.sh > /dev/null 2>&1"
SCHEDULE="* * * * * cd $APP && $PHP artisan schedule:run > /dev/null 2>&1"
if [ "$RIMIFY_CRON" != manual ] && command -v crontab > /dev/null 2>&1 && { crontab -l 2> /dev/null | grep -v -F "$APP/deploy/ssr-watch.sh" | grep -v -F "cd $APP && "; echo "$WATCH"; echo "$SCHEDULE"; } | crontab - 2> /dev/null; then
    echo "== renderer watchdog and scheduler in cron"
else
    echo "== add these two lines in hPanel → Erweitert → Cron-Jobs (every minute):"
    echo "   SSR_PORT=$SSR_PORT NODE_BIN=$NODE bash $APP/deploy/ssr-watch.sh"
    echo "   cd $APP && $PHP artisan schedule:run"
fi

# ── Live ───────────────────────────────────────────────────────────────────────
# Last, and only when everything above succeeded (set -e).
"$PHP" artisan up
echo "== site is up"

# ── Smoke ──────────────────────────────────────────────────────────────────────
# The shop as a visitor without JavaScript sees it, the lookup, the PDF, the admin's sign-in, the
# storage prefixes — and a test order where the sandbox is on. Non-zero on any failure: then follow
# GO-LIVE.md's rollback.
"$PHP" artisan rimify:smoke --no-interaction
