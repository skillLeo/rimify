<?php

declare(strict_types=1);

/*
 * Only what differs from the package's own config (vendor/inertiajs/inertia-laravel/config/inertia.php, merged with
 * this file key by key at the top level): the pages live in resources/js/Pages, with a capital P. The package looks
 * in `js/pages`, which a Windows checkout forgives and Linux does not — every page assertion of the suite failed on
 * CI for it ("Inertia page component file … does not exist"). InertiaPagesPathTest keeps the spelling honest.
 */
return [
    'pages' => [
        'ensure_pages_exist' => false,
        'paths' => [resource_path('js/Pages')],
        'extensions' => ['js', 'jsx', 'svelte', 'ts', 'tsx', 'vue'],
    ],

    /*
     * DevTools off unless asked for (INERTIA_DEVTOOLS_ENABLED=true). Left unset, the package records every request of a
     * local environment — the browser suites' servers included — one file each, and prunes the folder after every
     * response: on this project 36 057 files and 1,24 GB by 17.10.2026, and 0,36 s added to every local request (D-269).
     * The block is the package's own otherwise; this file replaces a top-level key whole.
     */
    'devtools' => [
        'enabled' => (bool) env('INERTIA_DEVTOOLS_ENABLED', false),
        'except' => ['telescope*', 'horizon*', '_inertia/devtools*'],
        'storage' => [
            'path' => storage_path('inertia-devtools'),
            'ttl' => (int) env('INERTIA_DEVTOOLS_TTL_HOURS', 24),
            'prune_interval' => (int) env('INERTIA_DEVTOOLS_PRUNE_INTERVAL_SECONDS', 300),
            'limit' => (int) env('INERTIA_DEVTOOLS_LIMIT', 100),
        ],
        'middleware' => ['web'],
        'gate' => env('INERTIA_DEVTOOLS_GATE'),
        'redact' => [
            'keys' => ['password', 'password_confirmation', 'current_password', 'token', '_token', 'access_token', 'refresh_token', 'secret', 'client_secret', 'api_key'],
            'headers' => ['cookie', 'set-cookie', 'authorization', 'proxy-authorization', 'x-xsrf-token', 'x-csrf-token'],
        ],
    ],
];
