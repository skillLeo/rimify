# Static cuts of Archivo for the Gutachten facsimile on the homepage (finding 116, D-231).
#
# The facsimile sets its small print narrow: Archivo's width axis at 85 % (the page) and 70 % (the phone's crops). WebKit
# as Playwright runs it applies that axis to the spacing but not to the letters, so the words overlap; a static cut has no
# axis to get wrong in any engine. Same outlines as the variable font at those coordinates, so Chromium looks as before.
#
# Instanced from the variable fonts the shop serves (latin + latin-ext merged for Š in „Škoda“), subset to Latin, Latin-1,
# Š/š and the punctuation the facsimile prints, as WOFF2 — weights 400, 500 and 600, the ones the facsimile uses.
# fontTools runs in WebAssembly (@web-alchemy/fonttools) through npx: a generator, not a dependency of the shop.
#
#   powershell -File scripts/fonts/doc-cuts.ps1        writes public/fonts/archivo-doc-<width>-<weight>.woff2
$ErrorActionPreference = 'Continue'
$root = Resolve-Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..\..')
$work = Join-Path ([IO.Path]::GetTempPath()) 'rimify-doc-cuts'
New-Item -ItemType Directory -Force $work | Out-Null
Set-Location $work
Copy-Item (Join-Path $root 'public\fonts\archivo-latin-wdth.woff2') "$work\src-latin.woff2" -Force
Copy-Item (Join-Path $root 'public\fonts\archivo-latin-ext-wdth.woff2') "$work\src-ext.woff2" -Force
$tool = '@web-alchemy/fonttools@1.4.0'
$unicodes = 'U+0020-007E,U+00A0-00FF,U+0160-0161,U+2010-2014,U+2018-201E,U+2026,U+2009,U+202F,U+2212'

foreach ($w in 70, 85) {
    foreach ($g in 400, 500, 600) {
        $name = "archivo-doc-$w-$g"
        npx --yes --package $tool fonttools varLib.instancer src-latin.woff2 "wdth=$w" "wght=$g" -o "$name-latin.ttf" 2>&1 | Out-Null
        npx --yes --package $tool fonttools varLib.instancer src-ext.woff2 "wdth=$w" "wght=$g" -o "$name-ext.ttf" 2>&1 | Out-Null
        npx --yes --package $tool pyftmerge "$name-latin.ttf" "$name-ext.ttf" --output-file="$name-merged.ttf" 2>&1 | Out-Null
        npx --yes --package $tool pyftsubset "$name-merged.ttf" "--unicodes=$unicodes" --flavor=woff2 "--output-file=$name.woff2" --layout-features='*' 2>&1 | Out-Null
        Copy-Item "$work\$name.woff2" (Join-Path $root "public\fonts\$name.woff2") -Force
        '{0} {1} bytes' -f "$name.woff2", (Get-Item "$work\$name.woff2").Length
    }
}
