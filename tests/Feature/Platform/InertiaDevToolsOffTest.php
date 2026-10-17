<?php

declare(strict_types=1);

use Inertia\DevTools\DevTools;

/*
 * Inertia's DevTools recorder is off unless asked for (D-269). Left to the package it records every request of a local
 * environment — the browser suites' servers among them — and cost 0,36 s on each.
 */

it('keeps the DevTools recorder off in a local environment unless asked for', function (): void {
    $environment = app()->environment();
    app()->detectEnvironment(static fn (): string => 'local');

    try {
        expect(app()->environment('local'))->toBeTrue()
            ->and(DevTools::enabled())->toBeFalse();

        config(['inertia.devtools.enabled' => true]);

        expect(DevTools::enabled())->toBeTrue();
    } finally {
        app()->detectEnvironment(static fn (): string => (string) $environment);
    }
});
