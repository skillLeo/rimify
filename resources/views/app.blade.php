<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    {{-- The policy in the document as well: the host replaces the header with its own (App\Support\ContentSecurityPolicy).
         First in the head, before anything it governs. --}}
    @if ($policy = \App\Support\ContentSecurityPolicy::meta(request()))
        <meta http-equiv="Content-Security-Policy" content="{{ $policy }}">
    @endif
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

    {{-- A storefront page's stylesheets in the document: the first paint waits for nothing but the HTML. Their links
         below stay, disabled — fetched by nobody, found by the bundle (App\Support\InlineStyles). --}}
    @foreach (\App\Support\InlineStyles::for($page['component'] ?? '') as $sheet)
        <style nonce="{{ \Illuminate\Support\Facades\Vite::cspNonce() }}">{!! $sheet['css'] !!}</style>
    @endforeach
    @vite(['resources/css/app.css', 'resources/js/app.ts'])
    {{-- The page component's stylesheets (and its layout's) in the head with the entry's, so the
         server-rendered page never paints unstyled and shifts at hydration. Styles only — the
         page's script stays a dynamic import (App\Support\PageStyles says why). --}}
    @foreach (\App\Support\PageStyles::for($page['component'] ?? '') as $href)
        <link rel="stylesheet" href="{{ $href }}" @disabled(\App\Support\InlineStyles::has($href))>
    @endforeach
    {{-- The page's own script chunks fetched beside the entry, not after it has run: fetched and compiled, never run
         here — the page's import runs them. Every page on the desk, the admin's on the phone too, never the shop's on the
         phone (App\Support\PageModules, D-279, D-282). At the scripts' low priority, so they never take the stylesheets'
         bandwidth (AppServiceProvider). --}}
    @foreach (\App\Support\PageModules::for($page['component'] ?? '', (bool) ($page['props']['isMobile'] ?? false)) as $href)
        <link rel="modulepreload" href="{{ $href }}" nonce="{{ \Illuminate\Support\Facades\Vite::cspNonce() }}" fetchpriority="low" data-page-chunk>
    @endforeach
    {{-- A desktop page paints once its last element is parsed: SiteFooter's in the shop, AdminLayout's in the admin. With
         the stylesheets in the document nothing else held the first paint back: a footer painted half-built at the foot
         of a short page grew upwards as its last rows arrived, CLS 0,024 at 1440 (D-177); the Übersicht was painted with
         its header half-parsed — the Zeitraum's three buttons beside the title — and rearranged when the rest arrived,
         0,039 at 768 on a loaded machine (D-274). The admin's sign-in and invitation pages have no layout and carry
         the element themselves: a page without it would paint only when its parse ends, and Chrome warns of it. The phone's first paint is its LCP and keeps its head start. --}}
    @if (! ($page['props']['isMobile'] ?? false))
        <link rel="expect" href="#seitenende" blocking="render">
    @endif
    @if (($page['component'] ?? '') === 'Startseite/Mobile')
        {{-- The phone homepage opened part-way down — a reload, back/forward, a link with a hash — renders every
             section from its first frame; every other visit lets the sections below skip their layout (D-178). --}}
        <script nonce="{{ \Illuminate\Support\Facades\Vite::cspNonce() }}">
            (function () {
                try {
                    var nav = performance.getEntriesByType('navigation')[0];
                    if (location.hash || (nav && (nav.type === 'reload' || nav.type === 'back_forward'))) {
                        document.documentElement.classList.add('cv-off');
                    }
                } catch (e) {}
            })();
        </script>
    @endif
    @inertiaHead
</head>
{{-- The device split is decided on the server (R-08); the class lets stylesheets follow it. --}}
<body class="{{ ($page['props']['isMobile'] ?? false) ? 'is-mobile' : 'is-desktop' }}">
    @inertia
</body>
</html>
