<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#0b0f14">

    {{-- The typeface used above the fold, fetched before the stylesheet asks for it. --}}
    <link rel="preload" href="/fonts/archivo-latin-wdth.woff2" as="font" type="font/woff2" crossorigin>

    @routes(nonce: Vite::cspNonce())
    @vite(['resources/css/app.css', 'resources/js/app.ts'])
    @inertiaHead
</head>
{{-- The device split is decided on the server (R-08); the class lets stylesheets follow it. --}}
<body class="{{ ($page['props']['isMobile'] ?? false) ? 'is-mobile' : 'is-desktop' }}">
    @inertia
</body>
</html>
