# The release, built by hand while GitHub Actions is down (docs/ops/DEPLOY-OHNE-CI.md): the same tree the Deploy
# workflow commits to the `deploy` branch — main's source, the production vendor/, the compiled bundles, the shipped
# assets and the previous release's .github/ — on top of the previous release, so the host pulls a fast-forward.
#
#   powershell -File scripts/deploy/release-ohne-ci.ps1 -Commit <sha> [-Push] [-Work <dir>]
#
# What is taken unchanged from the previous release (built by CI on Linux) because none of its inputs changed since:
# public/ocr, public/3d, storage/app/public/demo — and vendor/ as the starting point, into which composer then installs
# from the lock, so only what the lock changed differs. The bundles are the ones the gates ran against.
param([Parameter(Mandatory = $true)][string]$Commit, [switch]$Push, [string]$Work = 'C:\rimify\release-build')
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$work = $Work
$git = @('-c', 'core.autocrlf=false', '-c', 'core.fileMode=false', '-c', 'user.name=SkillLeo', '-c', 'user.email=hassam.dev.571@gmail.com')

function Say($m) { Write-Output "== $m" }
function G { & git @git @args; if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') failed ($LASTEXITCODE)" } }

$sha = (& git -C $repo rev-parse --verify "$Commit^{commit}").Trim()
$subject = (& git -C $repo log -1 --format='%h %s' $sha).Trim()
Say "release of $subject"

if ((& git -C $repo status --porcelain --untracked-files=no -- app bootstrap config database public/index.php resources routes composer.json composer.lock package.json package-lock.json vite.config.ts) -ne $null) { throw 'the working tree differs from the commit in files the release ships: the bundles would not be those of this commit' }
if ((& git -C $repo rev-parse HEAD).Trim() -ne $sha) { throw 'HEAD is not the commit to release: the bundles in the working tree were built from HEAD' }

if (Test-Path $work) { Remove-Item -Recurse -Force $work }
& git clone -q --no-hardlinks -c core.autocrlf=false -c core.fileMode=false $repo $work
if ($LASTEXITCODE -ne 0) { throw 'clone failed' }
Set-Location $work
G checkout -q --detach $sha

G -c credential.https://github.com.helper=manager fetch -q --depth=1 https://github.com/skillLeo/rimify.git deploy
$prev = (& git rev-parse FETCH_HEAD).Trim()
Say "previous release $($prev.Substring(0, 8)): $((& git log -1 --format='%s' $prev).Trim())"

# The previous release's built trees may be carried over only while nothing they are made from has changed since the
# commit that release was built from (its subject names it): the OCR assets, the 3D assets, the demo imagery.
$source = ((& git log -1 --format='%s' $prev) -replace '^release:\s*([0-9a-f]{7,40}).*$', '$1').Trim()
& git cat-file -e "$source^{commit}" 2>$null
if ($LASTEXITCODE -ne 0) { throw "the previous release does not name the commit it was built from: '$source'" }
& git diff --quiet $source $sha -- public/ocr public/3d storage/app/public/demo scripts/ocr-assets.mjs scripts/3d database/seeders/content/wheel-photos.php app/Console/Commands/FetchWheelPhotos.php app/Console/Commands/ProcessWheelImages.php
if ($LASTEXITCODE -ne 0) { throw "something the shipped assets are made from changed since $source - build them as the workflow does (npm run ocr:assets, wheels:fetch-photos, wheels:process-images, npm run 3d:assets) instead of carrying them over" }

# Into the index and onto the disk, modes and bytes as CI wrote them.
G checkout -q $prev -- vendor public/ocr public/3d storage/app/public/demo
# The package manifests too, so they keep the mode CI gave them; composer writes them again below.
foreach ($f in 'bootstrap/cache/packages.php', 'bootstrap/cache/services.php') {
    & git cat-file -e "$prev`:$f" 2>$null
    if ($LASTEXITCODE -eq 0) { G checkout -q $prev -- $f }
}
Say "carried over from the release of $source`: vendor (as the base), public/ocr, public/3d, storage/app/public/demo"

# PHP dependencies, production only, from the lock: composer changes what the lock changed and nothing else.
# Through cmd, so composer's progress on stderr is text and not an error to this script.
$out = & cmd /c "composer install --no-dev --optimize-autoloader --no-interaction --no-progress --prefer-dist 2>&1"
$composerExit = $LASTEXITCODE
$out | Select-String -Pattern 'Upgrading|Downgrading|- Installing|- Removing|Nothing to install|Generating|error|Problem' | ForEach-Object { "   " + $_.Line.Trim() }
if ($composerExit -ne 0) { $out | Select-Object -Last 15; throw 'composer install failed' }
# The release ships code only (the workflow's reason: stripe-php's README carries a sample key).
Get-ChildItem vendor -Recurse -File -Filter *.md | Remove-Item -Force

& php artisan rimify:reset-baseline --check | Select-Object -Last 1
if ($LASTEXITCODE -ne 0) { throw 'the reset baseline does not hold every migration: rebuild it on MariaDB first (php artisan rimify:reset-baseline)' }

# The bundles the gates ran against, and which build this is.
foreach ($dir in 'public\build', 'bootstrap\ssr') {
    if (Test-Path "$work\$dir") { Remove-Item -Recurse -Force "$work\$dir" }
    Copy-Item -Recurse "$repo\$dir" "$work\$dir"
}
$stamp = '{"commit":"' + $sha.Substring(0, 8) + '","built":"' + [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ') + '"}'
[IO.File]::WriteAllText("$work\public\build\release.json", "$stamp`n", (New-Object Text.UTF8Encoding($false)))
Say "stamp $stamp"

G add -f -A vendor public/build bootstrap/ssr
G add database/baseline/testumgebung.sql
foreach ($f in 'bootstrap/cache/packages.php', 'bootstrap/cache/services.php') { if (Test-Path $f) { G add -f $f } }

# As the workflow: a release carries the previous release's .github/ unchanged; the host never reads it.
G rm -r -q --cached .github
& git cat-file -e "$prev`:.github" 2>$null
if ($LASTEXITCODE -eq 0) { G read-tree --prefix=.github/ "$prev`:.github" }

$tree = (& git @git write-tree).Trim()
$release = (& git @git commit-tree $tree -p $prev -m "release: $subject").Trim()
Say "release commit $release"

Say 'what differs from the previous release, by area'
& git diff --stat=200 $prev $release | ForEach-Object { ($_ -split '\|')[0].Trim() } | Where-Object { $_ -match '/' } | ForEach-Object { $p = $_ -split '/'; if ($p[0] -eq 'vendor') { "vendor/$($p[1])/$($p[2])" } elseif ($p[0] -in 'public', 'bootstrap', 'storage') { "$($p[0])/$($p[1])" } else { $p[0] } } | Group-Object | Sort-Object Count -Descending | ForEach-Object { '   {0,5}  {1}' -f $_.Count, $_.Name }
$x1 = @(& git ls-tree -r $prev | Select-String -Pattern '^100755').Count
$x2 = @(& git ls-tree -r $release | Select-String -Pattern '^100755').Count
Say "executable files: previous $x1, this $x2"
Say "files: previous $(@(& git ls-tree -r --name-only $prev).Count), this $(@(& git ls-tree -r --name-only $release).Count)"
[IO.File]::WriteAllText("$work\..\release-commit.txt", $release)

if ($Push) {
    G -c credential.https://github.com.helper=manager push https://github.com/skillLeo/rimify.git "$release`:refs/heads/deploy"
    Say "pushed to deploy"
}
