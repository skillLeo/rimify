@php
    /**
     * The prototype's document contract, reproduced exactly.
     *
     * Three things here are load-bearing and were wrong before:
     *
     *  1. `is-mobile` / `is-desktop` belongs on <body>, not <html>. Every responsive rule in the
     *     design is written `body.is-mobile …` — roughly a hundred of them, covering button and
     *     field heights, the grid collapse, the footer columns and every 44px touch target. With
     *     the class on <html> not one of them matched, so the phone was being served the desktop
     *     metrics of a layout that was never drawn for them.
     *  2. `data-page` belongs on <body>. `shared/app.js` reads it to pick the header state and the
     *     page builder; without it every page boots as the Startseite.
     *  3. `#top` and `#bottom` must exist and be empty. The header, the blue vehicle bar, the
     *     footer and the phone's bottom navigation are all written into them at runtime.
     */
    $isMobile = (bool) ($page['props']['isMobile'] ?? false);
    /*
     * Normally shared by HandleInertiaRequests. An error page is the exception: a 404 is thrown
     * during routing, so no route matched and none of the web middleware ran — the prop is simply
     * absent. Falling back to the component name keeps `data-page` correct there, where falling
     * back to a literal would render the error page as the Startseite.
     */
    $designPage = $page['props']['designPage']
        ?? \App\Support\Design\PrototypePage::forComponent($page['component'] ?? null);

    /*
     * The admin screens carry `class="hide"` on both slots in the design's own shells.
     * `app.js` empties #top for them but still writes the storefront footer into #bottom, so
     * without this the admin pages would end with a black marketing footer the design hides.
     */
    $chromeClass = str_starts_with($designPage, 'admin-') ? 'hide' : '';

    /*
     * The real catalogue, in the shape the design's runtime reads.
     *
     * Emitted as a JSON data block rather than shared as an Inertia prop, because the runtime is
     * plain scripts with no access to the Vue page object — and because sharing it as a prop as
     * well would put the same payload in the document twice.
     *
     * NOT emitted on the visual fixture routes: those exist to compare our pages against the
     * prototype, and the prototype shows the design's demonstration data. Feeding them the real
     * catalogue would change every price and product name on the page and fail every baseline
     * for a reason that has nothing to do with fidelity.
     */
    /*
     * Two signals, because one of them cannot reach every page.
     *
     * The cookie is the normal route and covers a whole browsing context. It cannot work on an
     * error page: a 404 is thrown during routing, before the `web` group runs, so EncryptCookies
     * never decrypts anything and the value arrives as ciphertext. That is why the 404 was the one
     * fixture case still being served the live catalogue.
     *
     * The query flag survives that, because it needs no middleware at all. Both are confined to
     * local and testing, so neither can switch a production shop to demonstration data.
     */
    $wantsDemoData = app()->environment('local', 'testing') && (
        request()->cookie(\App\Http\Controllers\Dev\FixtureController::DEMO_DATA_COOKIE) === '1'
        || request()->query('__demo') === '1'
    );

    $liveData = $wantsDemoData
        ? null
        : app(\App\Services\Storefront\LiveData::class)->payload(
            $page['props']['vehicleId'] ?? null,
        );
@endphp
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{--
        tokens.css is a byte-for-byte copy of the prototype's, and its first line imports Lato and
        IBM Plex Mono from Google Fonts. That import is part of the copy: the design was drawn and
        measured with those exact faces, and a self-hosted substitute changes every text metric on
        the page, which moves every box below it.
    --}}
    @routes(nonce: Vite::cspNonce())
    @vite(['resources/css/app.css', 'resources/js/app.ts'])
    @inertiaHead
</head>
<body class="{{ $isMobile ? 'is-mobile' : 'is-desktop' }}" data-page="{{ $designPage }}">
    <div id="top" class="{{ $chromeClass }}"></div>

    @inertia

    <div id="bottom" class="{{ $chromeClass }}"></div>

    @if ($liveData !== null)
        {{--
            A data block, not a script: it carries no executable code, so the runtime reads it with
            getElementById + JSON.parse and our CSP needs no inline-script exception for it.
        --}}
        <script type="application/json" id="rimify-live-data" nonce="{{ Vite::cspNonce() }}">@json($liveData)</script>
    @endif

    {{--
        The prototype's runtime, served verbatim from public/prototype/shared and in the prototype's
        own order — data and art first, then the page builders, then app.js last because it boots on
        load and expects the other four to have registered themselves.

        These are copies, not ports. Every component's markup lives in the template strings inside
        them, so shipping the files is what makes our markup identical to the design's rather than
        merely similar to it.

        They are NOT loaded with <script> tags here. `app.js` boots itself the moment it runs, and
        from a tag in this document that is always too early: it would draw against the
        server-rendered HTML, Vue would then hydrate and replace that DOM, and the runtime would
        have to boot a second time to refill it.

        Booting twice is not harmless. `art.js` numbers every generated SVG gradient from a running
        counter, so the first pass produces `url(#gfadeh1)` and the second `url(#gfadeh38)` — every
        gradient in the document silently renamed, and 405 nodes reported as different.

        So resources/js/app.ts injects these six files, in this order, once Vue has mounted. The
        runtime then boots exactly once, against the final DOM, with its counter starting at 1
        exactly as it does in the prototype.
    --}}
</body>
</html>
