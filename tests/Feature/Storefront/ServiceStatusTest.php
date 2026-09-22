<?php

declare(strict_types=1);

use App\Services\Storefront\ServiceStatus;
use Carbon\CarbonImmutable;

/**
 * F9 — the live status line. Hours from configuration (the client's Mo–Fr 9–17), public holidays
 * of NRW (an assumption pending the client's answer), Europe/Berlin.
 */
function statusAt(string $berlinTime): array
{
    return (new ServiceStatus)->now(CarbonImmutable::parse($berlinTime, 'Europe/Berlin'));
}

it('says until when someone answers during the hours', function (): void {
    $status = statusAt('2026-09-23 10:15'); // a Wednesday

    expect($status['open'])->toBeTrue()
        ->and($status['label'])->toBe('Jetzt erreichbar – bis 17:00 Uhr');
});

it('names today when the office opens later the same day', function (): void {
    $status = statusAt('2026-09-23 07:30');

    expect($status['open'])->toBeFalse()
        ->and($status['label'])->toBe('Wieder erreichbar ab heute, 9:00 Uhr');
});

it('closes at 17:00, the client\'s hours', function (): void {
    expect(statusAt('2026-09-23 16:59')['open'])->toBeTrue()
        ->and(statusAt('2026-09-23 17:00')['open'])->toBeFalse()
        ->and(statusAt('2026-09-23 17:00')['label'])->toBe('Wieder erreichbar ab morgen, 9:00 Uhr');
});

it('names tomorrow after closing time', function (): void {
    expect(statusAt('2026-09-23 18:00')['label'])->toBe('Wieder erreichbar ab morgen, 9:00 Uhr');
});

it('names Monday on a weekend', function (): void {
    expect(statusAt('2026-09-26 12:00')['label'])->toBe('Wieder erreichbar ab Montag, 9:00 Uhr');
});

it('knows a public holiday of North Rhine-Westphalia', function (): void {
    // Fronleichnam 2026 (a Thursday) is a holiday in NRW; the next working day is the Friday.
    $status = statusAt('2026-06-04 11:00');

    expect($status['open'])->toBeFalse()
        ->and($status['label'])->toBe('Wieder erreichbar ab morgen, 9:00 Uhr');
});

it('reads the hours from the configuration', function (): void {
    config(['rimify.service.to' => '16:30']);

    expect(statusAt('2026-09-23 16:00')['label'])->toBe('Jetzt erreichbar – bis 16:30 Uhr')
        ->and(statusAt('2026-09-23 16:30')['open'])->toBeFalse();
});

it('is shared with every page', function (): void {
    $this->get('/kontakt')->assertInertia(fn ($page) => $page->has('serviceStatus.open')->has('serviceStatus.label'));
});
