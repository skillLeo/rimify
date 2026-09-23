<?php

declare(strict_types=1);

/*
 * R-13 as an executable rule: the fitment engine depends on no HTTP, Inertia or Vue-facing code,
 * so the storefront, the admin panel, Rimify Check and the order pipeline can only ever call the
 * identical service.
 */

arch('the fitment engine has no HTTP or Inertia dependency')
    ->expect('App\Domain\Fitment')
    ->not->toUse([
        'Illuminate\Http',
        'Illuminate\Routing',
        'Illuminate\Support\Facades\Request',
        'Illuminate\Support\Facades\Route',
        'Inertia',
        'App\Http',
    ]);

arch('the pure engine never touches Eloquent models or the database')
    ->expect([
        'App\Domain\Fitment\Data',
        'App\Domain\Fitment\Derivation',
        'App\Domain\Fitment\Verdict',
        'App\Domain\Fitment\Resolver',
        'App\Domain\Fitment\Conflict',
        'App\Domain\Fitment\Contracts',
        // The tyre rules answer "may this tyre go on this wheel on this car"; a query written
        // straight into them is the drift R-13 exists to prevent.
        'App\Domain\Fitment\Tyres',
    ])
    ->not->toUse([
        'App\Models',
        'App\Enums',
        'Illuminate\Database',
        'Illuminate\Support\Facades',
    ]);

arch('the codebase declares strict types')
    ->expect('App')
    ->toUseStrictTypes();

arch('no debugging calls survive')
    ->expect(['dd', 'dump', 'ray', 'var_dump', 'print_r'])
    ->not->toBeUsed();
