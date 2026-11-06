#!/usr/bin/env bash
# The release, built by hand on a Mac or Linux box: the twin of release-ohne-ci.ps1 (docs/ops/DEPLOY-OHNE-CI.md). The same tree the
# Deploy workflow commits to the `deploy` branch — main's source, the production vendor/, the compiled bundles, the shipped assets
# and the previous release's .github/ — on top of the previous release, so the host pulls a fast-forward.
#
#   scripts/deploy/release-ohne-ci.sh --commit <sha> --release <n> [--push] [--work <dir>]
#
# --release is the release's number, printed with its date at the foot of the preview's shop and admin (ReleaseStamp).
#
# What is taken unchanged from the previous release (built by CI on Linux), because none of its inputs changed since: public/ocr,
# public/3d, storage/app/public/demo — and vendor/ as the starting point, into which composer then installs from the lock, so only
# what the lock changed differs. The bundles are the ones the gates ran against. Run it from the checkout the gates ran in.
set -euo pipefail

commit=''
release=''
push=0
work="${TMPDIR:-/tmp}/rimify-release-build"

while [ $# -gt 0 ]; do
    case "$1" in
        --commit) commit="$2"; shift 2 ;;
        --release) release="$2"; shift 2 ;;
        --push) push=1; shift ;;
        --work) work="$2"; shift 2 ;;
        *) echo "unknown option: $1" >&2; exit 2 ;;
    esac
done

[ -n "$commit" ] && [ -n "$release" ] || { echo 'usage: release-ohne-ci.sh --commit <sha> --release <n> [--push] [--work <dir>]' >&2; exit 2; }

repo="$(cd "$(dirname "$0")/../.." && pwd)"
say() { echo "== $*"; }
g() { git -c core.autocrlf=false -c user.name=SkillLeo -c user.email=hassam.dev.571@gmail.com "$@"; }
remote='https://github.com/skillLeo/rimify.git'

sha="$(git -C "$repo" rev-parse --verify "$commit^{commit}")"
subject="$(git -C "$repo" log -1 --format='%h %s' "$sha")"
say "release of $subject"

if [ -n "$(git -C "$repo" status --porcelain --untracked-files=no -- app bootstrap config database public/index.php resources routes composer.json composer.lock package.json package-lock.json)" ]; then
    echo 'the checkout has changes the release would not carry' >&2
    exit 1
fi

[ "$(git -C "$repo" rev-parse HEAD)" = "$sha" ] || { echo 'HEAD is not the commit to release: the bundles in the working tree were built from HEAD' >&2; exit 1; }

rm -rf "$work"
git clone -q --no-hardlinks -c core.autocrlf=false "$repo" "$work"
cd "$work"
g checkout -q --detach "$sha"

g fetch -q --depth=1 "$remote" deploy
prev="$(git rev-parse FETCH_HEAD)"
say "previous release ${prev:0:8}: $(git log -1 --format='%s' "$prev")"

# The previous release's built trees may be carried over only while nothing they are made from has changed since the commit that
# release was built from (its subject names it): the OCR assets, the 3D assets, the demo imagery.
source_commit="$(git log -1 --format='%s' "$prev" | sed -E 's/^release:[[:space:]]*([0-9a-f]{7,40}).*$/\1/')"
if ! git cat-file -e "$source_commit^{commit}" 2>/dev/null; then
    g fetch -q "$remote" "$source_commit" 2>/dev/null || g fetch -q "$remote" main
fi
git cat-file -e "$source_commit^{commit}" || { echo "the previous release does not name the commit it was built from: '$source_commit'" >&2; exit 1; }
if ! git diff --quiet "$source_commit" "$sha" -- public/ocr public/3d storage/app/public/demo scripts/ocr-assets.mjs scripts/3d database/seeders/content/wheel-photos.php app/Console/Commands/FetchWheelPhotos.php app/Console/Commands/ProcessWheelImages.php; then
    echo "something the shipped assets are made from changed since $source_commit - build them as the workflow does (npm run ocr:assets, wheels:fetch-photos, wheels:process-images, npm run 3d:assets) instead of carrying them over" >&2
    exit 1
fi

# Into the index and onto the disk, modes and bytes as CI wrote them.
g checkout -q "$prev" -- vendor public/ocr public/3d storage/app/public/demo
# The package manifests too, so they keep the mode CI gave them; composer writes them again below.
for f in bootstrap/cache/packages.php bootstrap/cache/services.php; do
    if git cat-file -e "$prev:$f" 2>/dev/null; then g checkout -q "$prev" -- "$f"; fi
done
say "carried over from the release of $source_commit: vendor (as the base), public/ocr, public/3d, storage/app/public/demo"

# PHP dependencies, production only, from the lock: composer changes what the lock changed and nothing else.
composer install --no-dev --optimize-autoloader --no-interaction --no-progress --prefer-dist 2>&1 | grep -E 'Upgrading|Downgrading|- Installing|- Removing|Nothing to install|Generating|error|Problem' | sed 's/^/   /' || true
# The release ships code only (the workflow's reason: stripe-php's README carries a sample key).
find vendor -type f -name '*.md' -delete

php artisan rimify:reset-baseline --check | tail -1

# The bundles the gates ran against, and which build this is.
for dir in public/build bootstrap/ssr; do
    rm -rf "$work/$dir"
    mkdir -p "$(dirname "$work/$dir")"
    cp -R "$repo/$dir" "$work/$dir"
done
stamp="{\"release\":$release,\"commit\":\"${sha:0:8}\",\"built\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
printf '%s\n' "$stamp" > "$work/public/build/release.json"
say "stamp $stamp"

g add -f -A vendor public/build bootstrap/ssr
g add database/baseline/testumgebung.sql
for f in bootstrap/cache/packages.php bootstrap/cache/services.php; do
    if [ -e "$f" ]; then g add -f "$f"; fi
done

# As the workflow: a release carries the previous release's .github/ unchanged; the host never reads it.
g rm -r -q --cached .github
if git cat-file -e "$prev:.github" 2>/dev/null; then g read-tree --prefix=.github/ "$prev:.github"; fi

tree="$(g write-tree)"
release_commit="$(g commit-tree "$tree" -p "$prev" -m "release: $subject")"
say "release commit $release_commit"

say 'what differs from the previous release, by area'
git diff --stat=200 "$prev" "$release_commit" | sed -E 's/\|.*$//' | grep '/' | awk -F/ '{ print $1 "/" $2 }' | sort | uniq -c | sort -rn | head -30
say "executable files: previous $(git ls-tree -r "$prev" | grep -c '^100755' || true), this $(git ls-tree -r "$release_commit" | grep -c '^100755' || true)"
say "files: previous $(git ls-tree -r --name-only "$prev" | wc -l | tr -d ' '), this $(git ls-tree -r --name-only "$release_commit" | wc -l | tr -d ' ')"
printf '%s' "$release_commit" > "$work/../rimify-release-commit.txt"

if [ "$push" -eq 1 ]; then
    g push "$remote" "$release_commit:refs/heads/deploy"
    say 'pushed to deploy'
fi
