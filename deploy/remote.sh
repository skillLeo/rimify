#!/usr/bin/env bash
#
# Runs ON the production host after every deploy. Deliberately light: nothing here compiles the
# front end — that happens on GitHub's runner and arrives ready-made on the `deploy` branch. The
# host is shared, and a build there once exhausted the account's process limit for every site on it.
#
# Idempotent: safe to run twice, and it creates .env on the very first run.

set -euo pipefail

APP="${APP_DIR:-$HOME/domains/rimify.skillleo.com/public_html}"
PHP="${PHP_BIN:-/opt/alt/php84/usr/bin/php}"
NODE="${NODE_BIN:-/opt/alt/alt-nodejs22/root/usr/bin/node}"
SSR_PORT="${SSR_PORT:-13714}"

cd "$APP"
echo "== code: $(git log -1 --format='%h %s')"

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

# ── Smoke ──────────────────────────────────────────────────────────────────────
for path in / /felgen /faq /rechtliches/impressum; do
    printf '   %-26s %s\n' "$path" "$(curl -s -o /dev/null --max-time 30 -w '%{http_code}' "${APP_URL:-https://rimify.skillleo.com}$path")"
done
