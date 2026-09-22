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
    |
    | The client has given an e-mail address and service hours, and no phone number and no
    | WhatsApp. Those three are therefore null unless an environment variable names a real one: an
    | unset or empty variable is null, never a placeholder. Every surface that would have shown the
    | phone hides it and offers the e-mail instead — an invented number on the client's shop would be
    | exactly the confident wrong answer this product must never give.
    */
    'contact' => [
        'email' => env('RIMIFY_CONTACT_EMAIL', 'info@rimify.de'),
        'phone' => env('RIMIFY_CONTACT_PHONE') ?: null,
        'phone_intl' => env('RIMIFY_CONTACT_PHONE_INTL') ?: null,
        'whatsapp' => env('RIMIFY_CONTACT_WHATSAPP') ?: null,
        // En dashes, per German typography and the Copy Pack.
        'hours' => env('RIMIFY_CONTACT_HOURS', 'Mo–Fr 9:00–17:00 Uhr'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Service hours — the live status line
    |--------------------------------------------------------------------------
    |
    | The hours someone answers, computed in Europe/Berlin with the public holidays of the office's
    | state. The client has confirmed Mo–Fr 9–17 but not the state: DE-NW is an assumption pending
    | their answer, listed in docs/client-questions.md.
    */
    'service' => [
        'timezone' => 'Europe/Berlin',
        'region' => env('RIMIFY_SERVICE_REGION', 'DE-NW'),
        'weekdays' => [1, 2, 3, 4, 5],
        'from' => env('RIMIFY_SERVICE_FROM', '09:00'),
        'to' => env('RIMIFY_SERVICE_TO', '17:00'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Shipping
    |--------------------------------------------------------------------------
    |
    | Integer cents. The client has not given a shipping price or a free-shipping threshold, so
    | both are null until an environment variable names a real one. While the cost is null the
    | basket and the checkout say "Versandkosten werden noch festgelegt", keep shipping out of the
    | total, and the server refuses to place an order. A null threshold means no free shipping.
    */
    'shipping' => [
        'cost_cents' => is_numeric(env('RIMIFY_SHIPPING_COST_CENTS')) ? (int) env('RIMIFY_SHIPPING_COST_CENTS') : null,
        'free_from_cents' => is_numeric(env('RIMIFY_SHIPPING_FREE_FROM_CENTS')) ? (int) env('RIMIFY_SHIPPING_FREE_FROM_CENTS') : null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature flags
    |--------------------------------------------------------------------------
    */
    'features' => [
        // Fitting partners near the customer (H9). Off until the partner list is real.
        'partners' => (bool) env('RIMIFY_FEATURE_PARTNERS', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Photography
    |--------------------------------------------------------------------------
    |
    | Photographs are served from our own origin (public/images) and every slot keeps a drawn SVG
    | fallback, so a missing file degrades to the drawing and never to a grey box. The flag turns
    | the photographic layer off without a build; the host list widens the CSP's `img-src` for the
    | day the client puts images on a CDN. Named hosts only, never a wildcard —
    | tests/Feature/Platform/SecurityHeadersTest.php fails the build if a `*` appears.
    */
    'photography' => [
        'enabled' => (bool) env('RIMIFY_PHOTOGRAPHY', true),

        'hosts' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('RIMIFY_PHOTOGRAPHY_HOSTS', '')),
        ))),
    ],

    /*
    |--------------------------------------------------------------------------
    | Demo catalogue imagery
    |--------------------------------------------------------------------------
    |
    | Where `wheels:process-images` writes the transparent cut-outs of the demo wheels, and where
    | CatalogueSeeder reads their manifests from. Relative paths are taken from the project root.
    | The test suite points `wheels_dir` at an empty directory (phpunit.xml) so a test never picks
    | up whatever this machine happens to have rendered.
    */
    'demo' => [
        'wheels_dir' => env('RIMIFY_DEMO_WHEELS_DIR', 'storage/app/public/demo/wheels'),
        // The URL the manifests' `base` starts with: the public disk's symlink.
        'public_base' => env('RIMIFY_DEMO_WHEELS_URL', '/storage/demo/wheels'),
        // The free-licence source photographs, credited in docs/image-credits.md.
        'sources_dir' => env('RIMIFY_DEMO_SOURCES_DIR', 'storage/app/public/placeholder'),
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
