<?php

declare(strict_types=1);

/*
 * Demonstration data for the admin (DemoDashboardSeeder, `php artisan demo:*`).
 *
 * Written only where both hold: the environment is one of these, and DEMO_DATA=1. Production is
 * never one of them, whatever the flag says — and `demo:assert-clean` fails a deploy that finds a
 * single demo row there (R-12).
 */
return [
    'enabled' => (bool) env('DEMO_DATA', false),

    'environments' => ['local', 'staging', 'testing'],
];
