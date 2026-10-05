<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#0b0f14">

    {{-- Installable on a phone: the manifest and the touch icon only work from the head. --}}
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="RIMIFY">

    {{-- No font preload: the first paint takes the metric-matched fallback (fonts-fallback.css), and the swap moves
         nothing; 90 KB of font in the first round of requests held the first paint back on a phone (fonts.css). --}}

    {{-- The desktop homepage's hero pictures — the photograph the stage shows and its second wheel — fetched before
         the bundle asks for them; the phone's frame stands below the first screen and gets none (App\Support\HeroPreload
         says why, and holds `imagesizes` equal to the pictures' `sizes`). --}}
    @foreach (\App\Support\HeroPreload::links($page) as $heroPicture)
        <link rel="preload" as="image" fetchpriority="high" type="{{ $heroPicture['type'] }}"
              imagesrcset="{{ $heroPicture['srcset'] }}"
              imagesizes="{{ $heroPicture['sizes'] }}">
    @endforeach

    @if (str_starts_with($page['component'] ?? '', 'Admin/'))
        {{-- The admin's content keeps 960 px. Decided before the first paint — the same answer the layout then
             starts from, so nothing opens and snaps shut (AdminLayout, railResize.ts): in a window without room for
             the rail at the width this person gave it, the rail is drawn as wide as there is room for; without room
             even for its narrowest 232 px, it is collapsed by the window, with no handle to pull at.
             Asked from the head, in the first frame that shows the shell (a frame callback runs before that frame's
             layout, and only once the stylesheets are in): at the end of the body it ran after the browser had
             painted the open rail, and the page jumped by the rail's width (CLS 0,19 at 1024 px, 05.10.2026). --}}
        <script nonce="{{ \Illuminate\Support\Facades\Vite::cspNonce() }}">
            (function () {
                var scheduled = false;
                var observer = new MutationObserver(function () {
                    if (!scheduled && document.querySelector('.adm')) {
                        scheduled = true;
                        observer.disconnect();
                        requestAnimationFrame(fit);
                    }
                });

                function fit() {
                    var shell = document.querySelector('.adm');
                    if (!shell || !window.matchMedia('(min-width: 1024px)').matches) return;
                    var room = Math.min(400, shell.clientWidth - 960);
                    var width = parseInt(shell.style.getPropertyValue('--rail-w'), 10) || 260;
                    if (room < 232) {
                        shell.setAttribute('data-rail', 'collapsed');
                        shell.setAttribute('data-rail-forced', '');
                    } else if (room < width) {
                        shell.style.setProperty('--rail-w', room + 'px');
                        shell.setAttribute('data-labels', room < 248 ? 'short' : 'full');
                    }
                }

                observer.observe(document.documentElement, { childList: true, subtree: true });
            })();
        </script>
    @endif

    @vite(['resources/css/app.css', 'resources/js/app.ts'])
    {{-- The page component's stylesheets (and its layout's) in the head with the entry's, so the
         server-rendered page never paints unstyled and shifts at hydration. Styles only — the
         page's script stays a dynamic import (App\Support\PageStyles says why). --}}
    @foreach (\App\Support\PageStyles::for($page['component'] ?? '') as $href)
        <link rel="stylesheet" href="{{ $href }}">
    @endforeach
    @inertiaHead
</head>
{{-- The device split is decided on the server (R-08); the class lets stylesheets follow it. --}}
<body class="{{ ($page['props']['isMobile'] ?? false) ? 'is-mobile' : 'is-desktop' }}">
    @inertia
</body>
</html>
