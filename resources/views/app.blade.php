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

    {{-- The homepage's LCP image on the desktop document: the hero cut-out, fetched before the
         bundle asks for it. The phone document's LCP is the headline, so it preloads nothing. --}}
    @if (($page['component'] ?? '') === 'Startseite/Desktop')
        <link rel="preload" as="image" fetchpriority="high" type="image/avif"
              imagesrcset="/images/hero-wheel/hero-wheel-480.avif 480w, /images/hero-wheel/hero-wheel-768.avif 768w, /images/hero-wheel/hero-wheel-1136.avif 1136w"
              imagesizes="(min-width: 1280px) 540px, (min-width: 1024px) 40vw, (min-width: 768px) 336px, 70vw">
    @endif

    @routes(nonce: Vite::cspNonce())
    @vite(['resources/css/app.css', 'resources/js/app.ts'])
    @inertiaHead
</head>
{{-- The device split is decided on the server (R-08); the class lets stylesheets follow it. --}}
<body class="{{ ($page['props']['isMobile'] ?? false) ? 'is-mobile' : 'is-desktop' }}">
    @inertia
</body>
</html>
