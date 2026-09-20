<?php

declare(strict_types=1);

use Illuminate\Support\Facades\File;

/*
 * D-023 — contact details have exactly one source of truth.
 *
 * The homepage and the Kontakt page shipped different numbers and different opening hours in the
 * source documents. Rendering every appearance from config is what stops that divergence being
 * reintroduced one page at a time, so these tests police the rule rather than the symptom.
 */

/** @return list<string> every file that could render a contact detail to a customer */
function renderableSources(): array
{
    $roots = [
        base_path('resources/views'),
        base_path('resources/js'),
        base_path('app'),
        base_path('routes'),
        base_path('database/seeders'),
    ];

    $files = [];

    foreach ($roots as $root) {
        if (! is_dir($root)) {
            continue;
        }

        foreach (File::allFiles($root) as $file) {
            if (in_array($file->getExtension(), ['php', 'vue', 'ts', 'js', 'blade'], true)) {
                $files[] = $file->getRealPath();
            }
        }
    }

    return $files;
}

it('ships the canonical contact details', function (): void {
    expect(config('rimify.contact.email'))->toBe('info@rimify.de')
        ->and(config('rimify.contact.phone'))->toBe('0211 1255555')
        ->and(config('rimify.contact.phone_intl'))->toBe('+49 211 1255555')
        ->and(config('rimify.contact.whatsapp'))->toBe('+49 176 4777777')
        ->and(config('rimify.contact.hours'))->toBe('Mo–Fr 9:00–18:00 Uhr');
});

it('uses en dashes in the opening hours, not hyphens', function (): void {
    $hours = (string) config('rimify.contact.hours');

    expect($hours)->toContain("\u{2013}")->not->toContain('-');
});

it('contains no trace of the superseded phone number anywhere in the codebase', function (): void {
    // `1234567` is the homepage's old number. Its reappearance means someone hard-coded a
    // contact detail instead of reading it from config.
    $offenders = [];

    foreach (renderableSources() as $path) {
        $contents = (string) file_get_contents($path);

        if (str_contains($contents, '1234567')) {
            $offenders[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $path);
        }
    }

    expect($offenders)->toBe([], 'Superseded contact number found in: '.implode(', ', $offenders));
});

it('hard-codes no phone number in any renderable file', function (): void {
    // Any German landline or mobile shape outside config is a divergence waiting to happen.
    $offenders = [];
    $configPath = config_path('rimify.php');

    foreach (renderableSources() as $path) {
        if ($path === $configPath) {
            continue;
        }

        $contents = (string) file_get_contents($path);

        // `0211 1255555`, `+49 211 …`, `+49 176 …` and friends.
        if (preg_match('/(\+49[\s\d]{9,}|\b0\d{2,4}[\s\/]\d{6,}\b)/', $contents) === 1) {
            $offenders[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $path);
        }
    }

    expect($offenders)->toBe([], 'Hard-coded phone number in: '.implode(', ', $offenders));
});

it('hard-codes no contact email in any renderable file', function (): void {
    $offenders = [];
    $configPath = config_path('rimify.php');

    foreach (renderableSources() as $path) {
        if ($path === $configPath) {
            continue;
        }

        if (str_contains((string) file_get_contents($path), 'info@rimify.de')) {
            $offenders[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $path);
        }
    }

    expect($offenders)->toBe([], 'Hard-coded contact email in: '.implode(', ', $offenders));
});
