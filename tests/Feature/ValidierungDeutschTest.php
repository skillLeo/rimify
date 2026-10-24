<?php

declare(strict_types=1);

use Illuminate\Support\Arr;

/*
 * The admin audit's F-34 (ADMIN-AUDIT.md): with APP_LOCALE=de and no German validation file, a rule without its own
 * message answered with its key — the sign-in said „validation.max.string“ to a long address. lang/de/validation.php
 * now holds a German sentence for every rule the framework knows; a Form Request's own message still comes first.
 */

it('has a German sentence for every rule the framework knows', function (): void {
    $english = require base_path('vendor/laravel/framework/src/Illuminate/Translation/lang/en/validation.php');
    $german = require lang_path('de/validation.php');
    $missing = [];

    foreach (array_keys(Arr::dot(Arr::except($english, ['custom', 'attributes']))) as $key) {
        if (! Arr::has($german, $key)) {
            $missing[] = $key;
        }
    }

    expect($missing)->toBe([])
        ->and(count(Arr::dot(Arr::except($english, ['custom', 'attributes']))))->toBeGreaterThan(100);
});

it('answers the sign-in in German where its request has no message of its own', function (): void {
    app()->setLocale('de');

    $this->from('/admin/anmelden')->post('/admin/anmelden', ['email' => str_repeat('x', 300).'@rimify.test', 'password' => 'irgendwas-12345'])
        ->assertSessionHasErrors(['email' => 'Höchstens 255 Zeichen.']);

    expect(__('validation.required'))->toBe('Bitte füll dieses Feld aus.');
});
