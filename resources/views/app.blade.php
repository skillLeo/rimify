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

    {{-- The typeface used above the fold, fetched before the stylesheet asks for it. --}}
    <link rel="preload" href="/fonts/archivo-latin-wdth.woff2" as="font" type="font/woff2" crossorigin>

    {{-- The homepage's LCP image on both documents: the picture the hero shows — the shadowless
         `bare` frame, else the square one — fetched before the bundle asks for it. With no
         photograph the hero draws an outline and nothing is preloaded. `imagesizes` must equal the
         picture's `sizes` (HERO_SIZES_DESKTOP / HERO_SIZES_PHONE in
         Components/Mobile/Home/calloutSlots.ts; calloutSlots.test.ts holds them equal). --}}
    @if (in_array($page['component'] ?? '', ['Startseite/Desktop', 'Startseite/Mobile'], true))
        @php
            $heroManifest = $page['props']['hero']['product']['imageManifest'] ?? null;
            $heroPicture = is_array($heroManifest) && is_array($heroManifest['bare'] ?? null) ? $heroManifest['bare'] : $heroManifest;
            $heroSet = is_array($heroPicture) && isset($heroPicture['base'], $heroPicture['widths']) && is_array($heroPicture['widths'])
                ? implode(', ', array_map(fn ($w) => $heroPicture['base'].'-'.$w.'.avif '.$w.'w', $heroPicture['widths']))
                : null;
            $heroSizes = ($page['component'] ?? '') === 'Startseite/Mobile'
                ? '(min-width: 768px) calc(77vw - 49px), calc(77vw - 31px)'
                : '(min-width: 1280px) 500px, (min-width: 1024px) 33vw, (min-width: 768px) 373px, calc(67vw - 27px)';
        @endphp
        @if ($heroSet !== null)
            <link rel="preload" as="image" fetchpriority="high" type="image/avif"
                  imagesrcset="{{ $heroSet }}"
                  imagesizes="{{ $heroSizes }}">
        @endif
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
