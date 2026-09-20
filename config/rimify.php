<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Fitment engine
    |--------------------------------------------------------------------------
    */

    'engine_version' => env('RIMIFY_ENGINE_VERSION', '1'),

    /*
    | A safety margin above the derived legal minimum, in steps of the speed-symbol table.
    |
    | Zero reproduces the legal minimum exactly, and zero is the only value that does. The key
    | exists so that a commercial decision to be stricter than the law is CONFIGURATION with a
    | name and a default, rather than a hard-coded value buried in a reference table where nobody
    | could later tell it apart from the legal figure.
    |
    | It may only ever raise the requirement. There is no negative direction: the derivation is
    | the floor, and the Gutachten overrides it upward (R-06).
    */
    'speed_symbol_margin_steps' => (int) env('RIMIFY_SPEED_SYMBOL_MARGIN_STEPS', 0),

    'load_index_margin_steps' => (int) env('RIMIFY_LOAD_INDEX_MARGIN_STEPS', 0),

    /*
    |--------------------------------------------------------------------------
    | PKW-Liste import
    |--------------------------------------------------------------------------
    */

    'import' => [
        'path' => env('RIMIFY_PKWLISTE_IMPORT_PATH', 'storage/app/imports'),

        // A diff that would soft-delete more than this share of the catalogue is held for review
        // rather than applied: that shape of diff is almost always a truncated export.
        'delete_threshold' => (float) env('RIMIFY_IMPORT_DELETE_THRESHOLD', 0.15),
    ],

    /*
    |--------------------------------------------------------------------------
    | Contact details — one source of truth (D-023)
    |--------------------------------------------------------------------------
    |
    | The homepage and the Kontakt page carried different numbers and different opening hours
    | because they were written at different times. Every appearance now renders from here: the
    | homepage FAQ card, the FAQ help card, the Kontakt page, the footer and the order emails.
    |
    | A hard-coded phone number in a Blade file or an SFC is a defect, and
    | tests/Feature/Content/ContactDetailsTest.php fails the build if one appears.
    */
    'contact' => [
        'email' => env('RIMIFY_CONTACT_EMAIL', 'info@rimify.de'),
        'phone' => env('RIMIFY_CONTACT_PHONE', '0211 1255555'),
        'phone_intl' => env('RIMIFY_CONTACT_PHONE_INTL', '+49 211 1255555'),
        'whatsapp' => env('RIMIFY_CONTACT_WHATSAPP', '+49 176 4777777'),
        // En dashes, per German typography and the Copy Pack.
        'hours' => env('RIMIFY_CONTACT_HOURS', 'Mo–Fr 9:00–18:00 Uhr'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Photography — TEMPORARY, for client review only
    |--------------------------------------------------------------------------
    |
    | The build pack is explicit that every visual ships as inline SVG: "External images cannot
    | load in this environment. A grey box with a picture icon is a failure." The drawn art layer
    | in resources/js/art exists for exactly that reason and remains the default.
    |
    | This flag layers remote photography OVER that art so the client can review photographic
    | compositions before committing to licensed assets. Every slot keeps its drawn version as the
    | fallback, so a blocked, throttled or dead URL degrades to the wheel and never to a grey box.
    |
    | Turn it off before launch, or replace resources/js/media/photos.ts with the client's own
    | licensed files on our origin. Unsplash is not a licence RIMIFY holds.
    */
    'photography' => [
        'enabled' => (bool) env('RIMIFY_STOCK_PHOTOGRAPHY', true),

        /*
         * Exact hosts added to the CSP's `img-src` while the flag is on. Hosts only, never a
         * wildcard — tests/Feature/Platform/SecurityHeadersTest.php fails the build if a `*`
         * appears anywhere in the policy, which is the rule that stops this becoming permanent.
         */
        /*
         * The default list is not a guess — it is every host `design-reference/shared/art.js`
         * actually fetches from, and leaving one out is not a safe failure. The design layers
         * each photograph over a drawn SVG and reveals the drawing on `onerror`, so a blocked
         * host does not leave a gap: it silently swaps in different artwork. That is how the
         * eight marque logos were rendering as bold text instead of marks.
         *
         *   images.unsplash.com   the two direct `photo-…` URLs, and where every download 302s to
         *   unsplash.com          `ART.photo` builds `/photos/<id>/download?...`, which redirects
         *   cdn.simpleicons.org   seven of the eight marque logos in `LOGO`
         *   upload.wikimedia.org  the Mercedes mark, the one logo not on simpleicons
         *   plus.unsplash.com     kept from before; harmless and may be needed by licensed swaps
         */
        'hosts' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env(
                'RIMIFY_STOCK_PHOTOGRAPHY_HOSTS',
                'https://images.unsplash.com,https://plus.unsplash.com,https://unsplash.com,https://cdn.simpleicons.org,https://upload.wikimedia.org',
            )),
        ))),
    ],

    /*
    |--------------------------------------------------------------------------
    | Approval documents
    |--------------------------------------------------------------------------
    */

    'gutachten' => [
        'disk' => env('RIMIFY_GUTACHTEN_DISK', 'local'),

        // How far the supersession chain is walked when checking for a cycle. A revision chain
        // deeper than this is itself a data problem worth surfacing.
        'max_supersede_depth' => 20,
    ],

];
