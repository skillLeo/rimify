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
    | state. The client has confirmed Mo–Fr 9–17 but not the state, so the region is null until
    | RIMIFY_SERVICE_REGION names one (docs/client-questions.md). While it is null, a day that is a
    | public holiday in any German state makes no live claim: the status line shows the hours.
    */
    'service' => [
        'timezone' => 'Europe/Berlin',
        'region' => env('RIMIFY_SERVICE_REGION') ?: null,
        'weekdays' => [1, 2, 3, 4, 5],
        'from' => env('RIMIFY_SERVICE_FROM', '09:00'),
        'to' => env('RIMIFY_SERVICE_TO', '17:00'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Shipping
    |--------------------------------------------------------------------------
    |
    | The fallback only: the client enters the shipping in Einstellungen › Verkäufer & Versand
    | (App\Support\Shipping), and once that page is saved these values are never read again.
    | Integer cents. While the cost is null the basket and the checkout say "Versandkosten werden
    | noch festgelegt", keep shipping out of the total, and the server refuses to place an order.
    | A null threshold means no free shipping.
    */
    'shipping' => [
        'cost_cents' => is_numeric(env('RIMIFY_SHIPPING_COST_CENTS')) ? (int) env('RIMIFY_SHIPPING_COST_CENTS') : null,
        'free_from_cents' => is_numeric(env('RIMIFY_SHIPPING_FREE_FROM_CENTS')) ? (int) env('RIMIFY_SHIPPING_FREE_FROM_CENTS') : null,
        // The delivery time as the checkout states it before the order („3–5 Werktage“), in the client's words.
        // Null until they give one: then a real order is refused, as without a shipping price.
        'delivery_time' => env('RIMIFY_DELIVERY_TIME'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Komplettrad
    |--------------------------------------------------------------------------
    |
    | Two prices in integer cents: what mounting and balancing one wheel costs, and what one RDKS
    | sensor costs for a car make with no row of its own.
    |
    | These are DEPLOYMENT DEFAULTS ONLY. Both are set in the admin (docs/specs/komplettrad.md §13),
    | and a value stored there wins — including a deliberately cleared one, which is why
    | KomplettradSettings distinguishes "no row" from "a row holding null" rather than reading these
    | keys directly. They answer on a fresh install, where no row exists yet.
    |
    | Null everywhere is the shipped state: the basket then shows "wird noch festgelegt" for that
    | component, leaves it out of the total, and the server refuses an order containing a
    | Komplettrad. The Felgen-only purchase is unaffected.
    */
    'komplettrad' => [
        'mounting_per_wheel_cents' => is_numeric(env('RIMIFY_MOUNTING_PER_WHEEL_CENTS'))
            ? (int) env('RIMIFY_MOUNTING_PER_WHEEL_CENTS')
            : null,
        'tpms_default_price_cents' => is_numeric(env('RIMIFY_TPMS_DEFAULT_PRICE_CENTS'))
            ? (int) env('RIMIFY_TPMS_DEFAULT_PRICE_CENTS')
            : null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Admin panel
    |--------------------------------------------------------------------------
    |
    | Whether the panel exists on this deployment at all. False and every `admin/*` path answers
    | the same designed 404 an unknown URL gets — no sign-in screen, so nothing says there is
    | something behind it, and no password can open it either.
    |
    | On by default, because a developer's machine and the real shop both want it. It is turned OFF
    | on the preview server while the panel is being built: a client shown a half-finished screen
    | reads it as a finished one and reports its gaps as faults.
    */
    // The client's review of the admin (the review release §3): the review board, the feedback button
    // and its list. On wherever the shop is not live; the live shop never shows it.
    'review' => [
        'enabled' => filter_var(env('RIMIFY_REVIEW', env('APP_ENV', 'production') !== 'production'), FILTER_VALIDATE_BOOL),
    ],

    // The preview's password (App\Support\PreviewGate): HTTP basic auth over the whole site — pages, admin and the
    // files under /storage — while it is reachable from outside without its legal texts. Set by hand in the preview's
    // .env, never in the repository; both empty (the live shop, a developer's machine) is no gate at all.
    'preview' => [
        'user' => env('RIMIFY_PREVIEW_USER'),
        'password' => env('RIMIFY_PREVIEW_PASSWORD'),
    ],

    // How orders are paid (App\Payments\Payments). `none` until a provider is configured (BLOCKED #3):
    // the shop then takes no orders. `sandbox` runs test orders end to end, and is the default where the
    // review is on (Payments refuses it anywhere else, whatever this says).
    'payments' => [
        'driver' => env('RIMIFY_PAYMENTS', filter_var(env('RIMIFY_REVIEW', env('APP_ENV', 'production') !== 'production'), FILTER_VALIDATE_BOOL) ? 'sandbox' : 'none'),
    ],

    // The seller as the law names it — on the invoice (§ 14 UStG), in the Widerrufsformular, in the order mail. The
    // client's own data, typed in by hand: never guessed, never the brand name in its place. Null until given; an
    // invoice is then issued as a test invoice only, and the preflight says what is missing (App\Support\Seller).
    // The fallback only, like the shipping above: Einstellungen › Verkäufer & Versand wins once it is saved. The
    // Kleinunternehmer flag stays here — a tax decision for a deploy, not a field anyone changes in passing.
    'seller' => [
        'name' => env('RIMIFY_SELLER_NAME'),
        'street' => env('RIMIFY_SELLER_STREET'),
        'zip' => env('RIMIFY_SELLER_ZIP'),
        'city' => env('RIMIFY_SELLER_CITY'),
        'email' => env('RIMIFY_SELLER_EMAIL'),
        'vat_id' => env('RIMIFY_SELLER_VAT_ID'),
        'tax_number' => env('RIMIFY_SELLER_TAX_NUMBER'),
        'register' => env('RIMIFY_SELLER_REGISTER'),
        // Kleinunternehmer under § 19 UStG: the one switch for the invoice (no VAT, the § 19 sentence), every price
        // note on the site and the order summaries (no VAT line). Off unless the client's tax adviser says so.
        'small_business' => filter_var(env('RIMIFY_SELLER_SMALL_BUSINESS', false), FILTER_VALIDATE_BOOL),
    ],

    // The database engines — and their release series — the test suite runs against (D-052): the app
    // refuses any other at the first connection (DatabaseEngine). MariaDB 11.8 is the Hostinger host's
    // (read 2026-09-29, 11.8.9); MySQL 8.4 is CLAUDE.md §4's. CI runs the suite on both
    // (.github/workflows/tests.yml); a test keeps the two lists equal.
    'database' => [
        'engines' => ['MariaDB 11.8', 'MySQL 8.4'],
    ],

    // Server-side rendering's bounds (App\Support\Ssr\BoundedSsrGateway), in seconds: how long to
    // wait for the renderer to answer the phone, how long for a page, and how long to leave it alone
    // after it failed. The browser renders meanwhile; nothing on the page depends on which one drew it.
    'ssr' => [
        'connect_timeout' => (float) env('RIMIFY_SSR_CONNECT_TIMEOUT', 0.5),
        'timeout' => (float) env('RIMIFY_SSR_TIMEOUT', 2.5),
        'pause' => (int) env('RIMIFY_SSR_PAUSE', 30),
        // The renderer's socket file where it listens on one (the shared host, D-047); null: TCP at inertia.ssr.url.
        'socket' => env('RIMIFY_SSR_SOCKET'),
    ],

    // A query at least this slow is written to storage/logs/slow-queries-*.log (SlowQueries).
    'slow_query_ms' => (int) env('RIMIFY_SLOW_QUERY_MS', 500),

    'admin' => [
        'enabled' => filter_var(env('RIMIFY_ADMIN_ENABLED', true), FILTER_VALIDATE_BOOL),
        // Where the help menu's „Hilfe per E-Mail" writes to. Null by default: an address nobody
        // was asked to read is not offered (docs/design/sections/admin-shell.md §6.4).
        'support_email' => env('RIMIFY_ADMIN_SUPPORT_EMAIL'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature flags
    |--------------------------------------------------------------------------
    */
    'features' => [
        // Fitting partners near the customer (H9). Off until the partner list is real.
        'partners' => (bool) env('RIMIFY_FEATURE_PARTNERS', false),
        // "Sag mir Bescheid" by e-mail (F2). It is a double opt-in, so it only works where mail
        // really leaves the server. The preview's mail driver is `log`, where a confirmation would
        // never arrive and nobody would ever be told. Off until outgoing mail is configured; while
        // it is off, the forms offer the shop's e-mail address instead.
        'notify_by_mail' => (bool) env('RIMIFY_FEATURE_NOTIFY_BY_MAIL', false),
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
    | Brand logos
    |--------------------------------------------------------------------------
    |
    | Where `scripts/brand-logo.mjs` writes the processed one-colour logos and the manifest the
    | brand wall reads their aspect from (app/Support/BrandLogos.php). They live under public/ and
    | are committed, so a deploy carries them with no extra step. A relative path is taken from the
    | project root; a test points this at a directory of its own.
    */
    'brand_logos' => [
        'dir' => env('RIMIFY_BRAND_LOGOS_DIR', 'public/images/brands'),
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
        // The example finishes' placeholder drawings (DemoPlaceholders); `demo:purge` removes them
        // with the catalogue. The test suite writes its own elsewhere (phpunit.xml).
        'placeholders_dir' => env('RIMIFY_DEMO_PLACEHOLDERS_DIR', 'storage/app/public/demo/placeholders'),
        'placeholders_base' => env('RIMIFY_DEMO_PLACEHOLDERS_URL', '/storage/demo/placeholders'),
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
