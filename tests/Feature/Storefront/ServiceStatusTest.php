<?php

declare(strict_types=1);

use App\Services\Storefront\ServiceStatus;
use Carbon\CarbonImmutable;

/**
 * F9 — the live status line, findings #4/#80. Hours from configuration (the client's Mo–Fr 9–17),
 * Europe/Berlin, worded for an e-mail channel: the Servicezeit, never "erreichbar", no reply time.
 *
 * The office's state is not confirmed, so the region defaults to null. A day that is a public
 * holiday in any German state then makes no live claim at all: the line shows the hours.
 */
function statusAt(string $berlinTime): array
{
    return (new ServiceStatus)->now(CarbonImmutable::parse($berlinTime, 'Europe/Berlin'));
}

beforeEach(function (): void {
    config(['rimify.contact.hours' => 'Mo–Fr 9:00–17:00 Uhr']);
});

it('has no service region until the client names one', function (): void {
    // The value the application boots with; no environment variable names a state.
    $config = require base_path('config/rimify.php');

    expect($config['service']['region'])->toBeNull();
});

it('says until when the service hours run', function (): void {
    $status = statusAt('2026-09-23 10:15'); // a Wednesday

    expect($status['open'])->toBeTrue()
        ->and($status['label'])->toBe('Servicezeit – heute bis 17:00 Uhr');
});

it('names today when the hours start later the same day', function (): void {
    $status = statusAt('2026-09-23 07:30');

    expect($status['open'])->toBeFalse()
        ->and($status['label'])->toBe('Nächste Servicezeit: heute ab 9:00 Uhr');
});

it('closes at 17:00, the client\'s hours', function (): void {
    expect(statusAt('2026-09-23 16:59')['open'])->toBeTrue()
        ->and(statusAt('2026-09-23 17:00')['open'])->toBeFalse()
        ->and(statusAt('2026-09-23 17:00')['label'])->toBe('Nächste Servicezeit: morgen ab 9:00 Uhr');
});

it('names tomorrow after closing time', function (): void {
    expect(statusAt('2026-09-23 18:00')['label'])->toBe('Nächste Servicezeit: morgen ab 9:00 Uhr');
});

it('names Monday on a weekend', function (): void {
    expect(statusAt('2026-09-26 12:00')['label'])->toBe('Nächste Servicezeit: Montag ab 9:00 Uhr');
});

it('never says "erreichbar" and names no reply time', function (): void {
    foreach (['2026-09-23 10:15', '2026-09-23 18:00', '2026-09-26 12:00', '2026-06-04 11:00'] as $at) {
        expect(statusAt($at)['label'])->not->toContain('erreichbar')->not->toContain('antworten');
    }
});

describe('with no state configured', function (): void {
    it('makes no live claim on a holiday of some states only', function (): void {
        // Fronleichnam 2026 (a Thursday): a holiday in BW, BY, HE, NW, RP and SL, a working day elsewhere.
        $status = statusAt('2026-06-04 11:00');

        expect($status['open'])->toBeFalse()
            ->and($status['label'])->toBe('Servicezeiten: Mo–Fr 9:00–17:00 Uhr');
    });

    it('makes no live claim on a nationwide holiday either', function (): void {
        // Christmas Day 2026 is a Friday.
        expect(statusAt('2026-12-25 10:00')['label'])->toBe('Servicezeiten: Mo–Fr 9:00–17:00 Uhr');
    });

    it('does not promise tomorrow when tomorrow is a holiday somewhere', function (): void {
        // The evening before Fronleichnam: naming Thursday or Friday could both be wrong.
        $status = statusAt('2026-06-03 18:00');

        expect($status['open'])->toBeFalse()
            ->and($status['label'])->toBe('Servicezeiten: Mo–Fr 9:00–17:00 Uhr');
    });

    it('reads the hours shown from the contact configuration', function (): void {
        config(['rimify.contact.hours' => 'Mo–Do 8:00–16:00 Uhr']);

        expect(statusAt('2026-06-04 11:00')['label'])->toBe('Servicezeiten: Mo–Do 8:00–16:00 Uhr');
    });
});

describe('with the state configured', function (): void {
    it('knows a public holiday of North Rhine-Westphalia', function (): void {
        config(['rimify.service.region' => 'DE-NW']);

        $status = statusAt('2026-06-04 11:00');

        expect($status['open'])->toBeFalse()
            ->and($status['label'])->toBe('Nächste Servicezeit: morgen ab 9:00 Uhr');
    });

    it('treats a value that names no German state as no state', function (): void {
        config(['rimify.service.region' => 'DE-XX']);

        expect(statusAt('2026-06-04 11:00')['label'])->toBe('Servicezeiten: Mo–Fr 9:00–17:00 Uhr')
            ->and(statusAt('2026-09-23 10:15')['label'])->toBe('Servicezeit – heute bis 17:00 Uhr');
    });

    it('stays open on a holiday of another state', function (): void {
        // Reformationstag 2025 (a Friday) is a holiday in Lower Saxony, not in Bavaria.
        config(['rimify.service.region' => 'DE-BY']);

        expect(statusAt('2025-10-31 11:00')['label'])->toBe('Servicezeit – heute bis 17:00 Uhr');
    });
});

it('reads the hours from the configuration', function (): void {
    config(['rimify.service.to' => '16:30']);

    expect(statusAt('2026-09-23 16:00')['label'])->toBe('Servicezeit – heute bis 16:30 Uhr')
        ->and(statusAt('2026-09-23 16:30')['open'])->toBeFalse();
});

it('is shared with every page', function (): void {
    $this->get('/kontakt')->assertInertia(fn ($page) => $page->has('serviceStatus.open')->has('serviceStatus.label'));
});
