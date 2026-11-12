#!/bin/bash
# The machine the browser suites run on, on CI (the operator's brief of 12.11.2026, D-460): what resume/gate.sh finds ready on
# the Mac, built from nothing. One MariaDB 11.8.9 (the host's engine) on :3308 holds every database the suites name — the
# admin's (DEV, from .env), the e2e shop and its empty twin and the client's acceptance shop (rebuilt by the suites' own
# global setups) and Pest's for the lists' tagged tests. DEV gets what the Mac's grew by hand: the demo set, the review
# accounts with the development password (never the preview's, D-141), one draft „QA-ENTWURF“ and the released Borbet papers
# (tests/E2eData, D-427). Then the generated assets, the build and the SSR server. Run from the checkout's root.
set -euo pipefail

DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=root
DB_PASS=root
DEV_DB=rimify_dev

sql() { docker exec db mariadb -u"$DB_USER" -p"$DB_PASS" -e "$1"; }

echo "::group::Databases"
for name in "$DEV_DB" rimify_test rimify_wf_e2e rimify_wf_e2e_leer rimify_wf_abnahme_e2e; do
    sql "CREATE DATABASE IF NOT EXISTS \`$name\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
done
sql "SELECT VERSION()"
echo "::endgroup::"

echo "::group::.env"
cp .env.example .env
set_env() { # key value — replaces the key's line, or adds it
    if grep -qE "^$1=" .env; then sed -i -E "s#^$1=.*#$1=$2#" .env; else printf '%s=%s\n' "$1" "$2" >> .env; fi
}
set_env APP_ENV local
set_env APP_DEBUG true
set_env APP_URL http://127.0.0.1:8000
set_env DB_CONNECTION mysql
set_env DB_HOST "$DB_HOST"
set_env DB_PORT "$DB_PORT"
set_env DB_DATABASE "$DEV_DB"
set_env DB_USERNAME "$DB_USER"
set_env DB_PASSWORD "$DB_PASS"
set_env SESSION_DRIVER database
set_env CACHE_STORE database
set_env QUEUE_CONNECTION database
set_env MAIL_MAILER log
set_env FILESYSTEM_DISK local
set_env INERTIA_SSR_ENABLED true
set_env INERTIA_SSR_URL http://127.0.0.1:13714
set_env RIMIFY_FEATURE_KEY_NUMBERS on
php artisan key:generate --force
php artisan config:clear
echo "::endgroup::"

echo "::group::Generated assets"
npm run ocr:assets
php artisan wheels:fetch-photos
php artisan wheels:process-images
npm run 3d:assets
php artisan storage:link || true
echo "::endgroup::"

echo "::group::Build"
npm run build
echo "::endgroup::"

echo "::group::DEV: the demo set, the review accounts, the draft, the Borbet papers"
DEMO_DATA=1 php -d memory_limit=2G artisan migrate:fresh --seed --force --no-interaction
php artisan db:seed --class='Database\Seeders\ReviewAccountsSeeder' --force --no-interaction
php artisan tinker --execute='App\Models\ApprovalDocument::query()->where("report_number", "QA-ENTWURF")->exists() || App\Models\ApprovalDocument::factory()->draft()->create(["report_number" => "QA-ENTWURF", "is_demo" => false]);'
TEST_DB_HOST="$DB_HOST" TEST_DB_PORT="$DB_PORT" TEST_DB_DATABASE="$DEV_DB" TEST_DB_USERNAME="$DB_USER" TEST_DB_PASSWORD="$DB_PASS" \
    php -d memory_limit=2G vendor/bin/pest tests/E2eData
echo "::endgroup::"

# Playwright starts its servers before a suite's global setup rebuilds the shops: on a fresh machine their databases must
# already answer, as on the Mac, where the last run left them. Seeded the way the global setups seed them. Not the client's
# acceptance shop: it is released from his own Gutachten PDFs, which never leave the Mac (the repository is public).
echo "::group::The shops' databases, seeded once before the suites rebuild them"
DB_DATABASE=rimify_wf_e2e php -d memory_limit=2G artisan migrate:fresh --seed --seeder='Database\Seeders\E2eShopSeeder' --force --no-interaction
DB_DATABASE=rimify_wf_e2e_leer php -d memory_limit=2G artisan migrate:fresh --seed --seeder='Database\Seeders\E2eEmptyShopSeeder' --force --no-interaction
echo "::endgroup::"

echo "::group::SSR"
INERTIA_SSR_PORT=13714 nohup node bootstrap/ssr/ssr.js > "${RUNNER_TEMP:-/tmp}/ssr.log" 2>&1 &
for i in $(seq 1 30); do
    if curl -s -o /dev/null http://127.0.0.1:13714/health || curl -s -o /dev/null http://127.0.0.1:13714; then echo "SSR up after ${i} s"; break; fi
    sleep 1
done
echo "::endgroup::"
