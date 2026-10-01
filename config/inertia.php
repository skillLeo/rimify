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
];
