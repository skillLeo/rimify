# The preview release, run detached on the host (GO-LIVE §1 backup, §3 down, §4.1 fetch, §4.2 remote.sh); its log is read afterwards.
# Since 05.10.2026 (the operator's brief §0, GO-LIVE §4.4): the reset's flag goes into .env first, and the fetched
# release's own deploy/check-env.php checks it — a refusal stops here with the site still up on the old code.
export APP="$HOME/domains/rimify.skillleo.com/public_html"
export PHP=/opt/alt/php84/usr/bin/php
cd "$APP" || exit 1
mkdir -p ~/backups
TS=$(date -u +%Y%m%d-%H%M)
echo "$TS" > ~/backups/current-ts
LOG=~/backups/rimify-$TS.run.log
{
  echo "== start $(date -u +%FT%TZ) from $(git log -1 --format=%h)"
  "$PHP" deploy/env.php RIMIFY_RESET_ERLAUBT true
  if ! git fetch --depth 1 origin deploy > /dev/null 2>&1; then echo "== fetch failed: nothing changed"; exit 1; fi
  echo "== fetched $(git log -1 --format='%h %s' FETCH_HEAD)"
  git show FETCH_HEAD:deploy/check-env.php > /tmp/rimify-check-env.php
  if ! "$PHP" /tmp/rimify-check-env.php .env staging; then echo "== check-env refused: nothing changed, the site is up on the old code"; rm -f /tmp/rimify-check-env.php; exit 1; fi
  rm -f /tmp/rimify-check-env.php
  eval "$(grep -E '^DB_(HOST|PORT|DATABASE|USERNAME|PASSWORD)=' .env)"
  MYSQL_PWD="$DB_PASSWORD" mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" --single-transaction --routines --triggers "$DB_DATABASE" | gzip > ~/backups/rimify-$TS.sql.gz
  chmod 600 ~/backups/rimify-$TS.sql.gz
  echo "== backup $(stat -c %s ~/backups/rimify-$TS.sql.gz) bytes"
  "$PHP" artisan down --render="errors::503" --retry=60 > /dev/null 2>&1
  T0=$(date +%s)
  git reset --hard FETCH_HEAD > /dev/null
  echo "== now $(git log -1 --format='%h %s')"
  "$PHP" deploy/env.php RIMIFY_OPERATOR_NAME "SkillLeo SMC Pvt Ltd"
  RIMIFY_CRON=manual TARGET_ENV=staging bash deploy/remote.sh > ~/backups/rimify-$TS.deploy.log 2>&1
  echo "== remote.sh exit $? after $(( $(date +%s) - T0 )) s"
  tail -45 ~/backups/rimify-$TS.deploy.log
  echo "== end $(date -u +%FT%TZ)"
} > "$LOG" 2>&1
