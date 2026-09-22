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
# By hand: `php artisan down`, then pull, then `bash deploy/remote.sh`.

set -euo pipefail

APP="${APP_DIR:-$HOME/domains/rimify.skillleo.com/public_html}"
PHP="${PHP_BIN:-/opt/alt/php84/usr/bin/php}"
NODE="${NODE_BIN:-/opt/alt/alt-nodejs22/root/usr/bin/node}"
SSR_PORT="${SSR_PORT:-13714}"

cd "$APP"
echo "== code: $(git log -1 --format='%h %s')"

# A manual run may not have taken the site down first. This covers that case; it is a no-op when
# the workflow already did. It may fail before composer has run, hence `|| true`.
"$PHP" artisan down --retry=60 > /dev/null 2>&1 || true

# ── Environment ────────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
    cp .env.example .env
    echo "== .env created from .env.example"
fi

set_env() { "$PHP" deploy/env.php "$1" "${2:-}"; }
set_env APP_ENV production
set_env APP_DEBUG false
set_env APP_URL "${APP_URL:-https://rimify.skillleo.com}"
set_env LOG_STACK daily
set_env LOG_LEVEL warning
set_env SESSION_DRIVER file
set_env CACHE_STORE file
set_env QUEUE_CONNECTION sync
set_env MAIL_MAILER log
set_env DB_HOST "${DB_HOST:-localhost}"
set_env DB_PORT "${DB_PORT:-3306}"
set_env DB_DATABASE "${DB_DATABASE:-}"
set_env DB_USERNAME "${DB_USERNAME:-}"
set_env DB_PASSWORD "${DB_PASSWORD:-}"
set_env INERTIA_SSR_PORT "$SSR_PORT"
set_env INERTIA_SSR_URL "http://127.0.0.1:$SSR_PORT"
grep -q '^APP_KEY=base64' .env || "$PHP" artisan key:generate --force --no-interaction

# ── Writable directories ───────────────────────────────────────────────────────
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache

# ── PHP dependencies and schema ────────────────────────────────────────────────
COMPOSER="$(command -v composer || echo /usr/local/bin/composer)"
"$PHP" "$COMPOSER" install --no-dev --optimize-autoloader --no-interaction --no-progress 2>&1 | tail -1
"$PHP" artisan migrate --force --no-interaction

# A brand-new database gets the reference data and the demonstration catalogue once. An existing
# one is never re-seeded: that would overwrite whatever has been edited since.
VEHICLES="$("$PHP" artisan tinker --execute='echo \Illuminate\Support\Facades\DB::table("vehicles")->count();' 2>/dev/null | tail -1)"
if [ "$VEHICLES" = "0" ]; then
    echo "== empty database: seeding"
    "$PHP" artisan db:seed --force --no-interaction
fi

# The seeded data this release changes (renamed demo catalogue, retired fitments, corrected
# content), applied once per release and recorded. A no-op on every later deploy.
"$PHP" artisan rimify:release-seed --no-interaction

# The demo imagery is served from storage/app/public through the public/storage link.
[ -L public/storage ] || "$PHP" artisan storage:link --no-interaction

# ── Caches ─────────────────────────────────────────────────────────────────────
"$PHP" artisan optimize:clear > /dev/null
"$PHP" artisan optimize > /dev/null
echo "== caches rebuilt"

# ── SSR ────────────────────────────────────────────────────────────────────────
# Stop only this site's renderer: node processes whose command line names this app's bundle.
for pid in $(pgrep -u "$(id -u)" -x node || true); do
    if tr '\0' ' ' < "/proc/$pid/cmdline" | grep -q "$APP/bootstrap/ssr/ssr.js"; then
        kill "$pid" && echo "== stopped renderer $pid"
    fi
done
sleep 1
INERTIA_SSR_PORT="$SSR_PORT" nohup setsid "$NODE" "$APP/bootstrap/ssr/ssr.js" > storage/logs/ssr.log 2>&1 < /dev/null &
sleep 3
grep -q 'started' storage/logs/ssr.log && echo "== renderer running on $SSR_PORT" || { echo "== renderer did not start"; tail -5 storage/logs/ssr.log; }

# ── Live ───────────────────────────────────────────────────────────────────────
# Last, and only when everything above succeeded (set -e).
"$PHP" artisan up
echo "== site is up"

# ── Smoke ──────────────────────────────────────────────────────────────────────
for path in / /felgen /faq /rechtliches/impressum; do
    printf '   %-26s %s\n' "$path" "$(curl -s -o /dev/null --max-time 30 -w '%{http_code}' "${APP_URL:-https://rimify.skillleo.com}$path")"
done
