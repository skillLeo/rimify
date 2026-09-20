<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Resolver\VehicleDisambiguator;
use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Domain\Fitment\Support\BuildWindow;
use Illuminate\Support\Collection;
use Tests\Support\Fitment\InMemoryVehicleRepository;
use Tests\Support\Fitment\VehicleFixtures;

/*
 * R-01. The single most consequential rule in the product: one key-number pair can mean more than
 * one car, and the two that differ, differ in exactly the fields the legal answer is derived from.
 */

beforeEach(function (): void {
    $this->resolver = new VehicleResolver(VehicleFixtures::repository());
});

it('returns a Collection for every outcome, never null and never a bare model', function (): void {
    expect($this->resolver->byKeyNumbers('1860', 'AAS'))->toBeInstanceOf(Collection::class)
        ->and($this->resolver->byKeyNumbers('0005', '582'))->toBeInstanceOf(Collection::class)
        ->and($this->resolver->byKeyNumbers('9999', 'XXX'))->toBeInstanceOf(Collection::class)
        ->and($this->resolver->byKeyNumbers('', ''))->toBeInstanceOf(Collection::class);
});

it('resolves the demo pair to two genuinely different vehicles', function (): void {
    $matches = $this->resolver->byKeyNumbers('1860', 'AAS');

    expect($matches)->toHaveCount(2)
        ->and($this->resolver->needsDisambiguation('1860', 'AAS'))->toBeTrue();
});

it('treats the single-result case as a collection of one, not a special branch', function (): void {
    $matches = $this->resolver->byKeyNumbers('0005', '582');

    expect($matches)->toHaveCount(1)
        ->and($this->resolver->needsDisambiguation('0005', '582'))->toBeFalse()
        ->and($matches->first()?->variant)->toBe('3er Coupe');
});

it('exposes no way to take the first match', function (): void {
    // The mechanism by which the demo API produces a confident wrong answer is an accessor that
    // returns one row. If one is ever added, this fails.
    $methods = get_class_methods(VehicleResolver::class);

    foreach ($methods as $method) {
        expect(strtolower($method))
            ->not->toContain('first')
            ->not->toContain('single')
            ->not->toContain('one');
    }
});

it('returns an empty collection for an unknown pair, never null', function (): void {
    $matches = $this->resolver->byKeyNumbers('4711', 'XYZ');

    expect($matches)->toBeInstanceOf(Collection::class)
        ->and($matches)->toBeEmpty()
        ->and($matches->isEmpty())->toBeTrue();
});

it('normalises what the customer typed', function (string $hsn, string $tsn): void {
    // Customers type from a printed document in whatever case, sometimes with a stray space.
    expect($this->resolver->byKeyNumbers($hsn, $tsn))->toHaveCount(2);
})->with([
    'as printed' => ['1860', 'AAS'],
    'lower case tsn' => ['1860', 'aas'],
    'mixed case' => ['1860', 'AaS'],
    'leading space' => [' 1860', 'AAS'],
    'trailing space' => ['1860', 'AAS '],
    'inner space' => ['18 60', 'A AS'],
]);

it('left-pads a short HSN rather than querying a different manufacturer', function (): void {
    // '0005' arriving as '5' from a system that cast it to an integer somewhere upstream.
    expect($this->resolver->byKeyNumbers('5', '582'))->toHaveCount(1)
        ->and(VehicleResolver::normaliseHsn('5'))->toBe('0005')
        ->and(VehicleResolver::normaliseHsn('35'))->toBe('0035')
        ->and(VehicleResolver::normaliseHsn('0583'))->toBe('0583');
});

it('rejects malformed key numbers by returning nothing, not by throwing', function (string $hsn, string $tsn): void {
    // A typo is not an exception; it is an empty result and, in the UI, three routes forward.
    expect($this->resolver->byKeyNumbers($hsn, $tsn))->toBeEmpty();
})->with([
    'empty hsn' => ['', 'AAS'],
    'empty tsn' => ['1860', ''],
    'hsn too long' => ['18600', 'AAS'],
    'tsn too long' => ['1860', 'AASX'],
    'punctuation' => ['18-60', 'AAS'],
    'symbol in tsn' => ['1860', 'A*S'],
]);

it('hides a soft-deleted vehicle from resolution', function (): void {
    $repository = new InMemoryVehicleRepository([
        new VehicleRecord(
            id: 99, hsn: '1860', tsn: 'AAS', vsn: '00099',
            make: 'Audi', model: 'RS 4', variant: 'RS 4 Avant Quattro', typeDesignation: 'B9',
            buildWindow: BuildWindow::unbounded(),
            axleLoadFrontKg: 1210, axleLoadRearKg: 1235, maxSpeedKmh: 280,
            isDeleted: true,
        ),
    ]);

    expect((new VehicleResolver($repository))->byKeyNumbers('1860', 'AAS'))->toBeEmpty();
});

/*
 * The disambiguation differ.
 */

it('shows only the attributes that actually differ', function (): void {
    $distinction = (new VehicleDisambiguator)->distinguish($this->resolver->byKeyNumbers('1860', 'AAS'));

    // Identical across both candidates, so shown in neither row: power, body, doors, seats, drive.
    expect($distinction->attributes)->not->toContain('power')
        ->not->toContain('body_form')
        ->not->toContain('doors')
        ->not->toContain('seats')
        ->not->toContain('drive_axle');
});

it('surfaces exactly the fields the legal answer is derived from, for the demo pair', function (): void {
    $distinction = (new VehicleDisambiguator)->distinguish($this->resolver->byKeyNumbers('1860', 'AAS'));

    // Top speed and front axle load ARE the tyre specification's inputs. The build period is
    // shown too because it is the discriminator an owner can actually recognise.
    expect($distinction->attributes)->toContain('build_period')
        ->toContain('max_speed')
        ->toContain('axle_load_front')
        ->and($distinction->isRequired())->toBeTrue()
        ->and($distinction->indistinguishable)->toBeFalse();
});

it('orders the shown attributes the way an owner recognises their car', function (): void {
    $distinction = (new VehicleDisambiguator)->distinguish($this->resolver->byKeyNumbers('1860', 'AAS'));

    $expectedOrder = array_values(array_filter(
        VehicleDisambiguator::PRIORITY,
        static fn (string $a): bool => in_array($a, $distinction->attributes, true),
    ));

    expect($distinction->attributes)->toBe($expectedOrder)
        ->and($distinction->attributes[0])->toBe('build_period');
});

it('renders each candidate row with the differing values and its VSN', function (): void {
    $distinction = (new VehicleDisambiguator)->distinguish($this->resolver->byKeyNumbers('1860', 'AAS'));

    [$first, $second] = $distinction->rows;

    expect($first['vsn'])->toBe('00001')
        ->and($second['vsn'])->toBe('00017')
        ->and($first['values']['max_speed'])->toBe('280 km/h')
        ->and($second['values']['max_speed'])->toBe('290 km/h')
        ->and($first['values']['build_period'])->toBe("03/2018\u{2013}11/2019")
        // Still in production — never a coerced end date.
        ->and($second['values']['build_period'])->toBe("12/2019\u{2013}heute")
        ->and($first['values']['axle_load_front'])->toBe('1.210 kg')
        ->and($second['values']['axle_load_front'])->toBe('1.225 kg');
});

it('shows every row the same set of keys, so the chooser is a real table', function (): void {
    $distinction = (new VehicleDisambiguator)->distinguish($this->resolver->byKeyNumbers('1860', 'AAS'));

    foreach ($distinction->rows as $row) {
        expect(array_keys($row['values']))->toBe($distinction->attributes);
    }
});

it('needs no disambiguation for a single candidate', function (): void {
    $distinction = (new VehicleDisambiguator)->distinguish($this->resolver->byKeyNumbers('0005', '582'));

    expect($distinction->isRequired())->toBeFalse()
        ->and($distinction->attributes)->toBe([])
        ->and($distinction->candidateCount())->toBe(1);
});

it('flags candidates that differ in nothing displayable instead of choosing one', function (): void {
    // Guessing here is exactly the confident wrong answer the governing rule forbids.
    $distinction = (new VehicleDisambiguator)->distinguish(VehicleFixtures::indistinguishablePair());

    expect($distinction->indistinguishable)->toBeTrue()
        ->and($distinction->attributes)->toBe([])
        ->and($distinction->isRequired())->toBeTrue()
        ->and($distinction->rows)->toHaveCount(2)
        // The VSN is the only separator, and it is not in what the customer typed.
        ->and($distinction->rows[0]['vsn'])->not->toBe($distinction->rows[1]['vsn']);
});

it('carries German labels and the reading help for the UI', function (): void {
    $payload = (new VehicleDisambiguator)
        ->distinguish($this->resolver->byKeyNumbers('1860', 'AAS'))
        ->toArray();

    expect($payload['labels']['build_period'])->toBe('Bauzeitraum')
        ->and($payload['labels']['max_speed'])->toBe('Höchstgeschwindigkeit')
        ->and($payload['labels']['axle_load_front'])->toBe('Achslast vorn')
        ->and($payload['required'])->toBeTrue()
        ->and(VehicleDisambiguator::HEADING_DE)->toBe('Zu dieser Schlüsselnummer gibt es mehrere Varianten.')
        ->and(VehicleDisambiguator::READING_HELP_DE)->toContain('Zulassungsbescheinigung');
});

it('reports a needs_review vehicle as unusable before any fitment question is asked', function (): void {
    $vehicle = VehicleFixtures::needsReview();

    expect($vehicle->hasCompleteLegalData())->toBeFalse()
        ->and(VehicleFixtures::rs4First()->hasCompleteLegalData())->toBeTrue();
});

it('labels a vehicle the way the chooser and the header show it', function (): void {
    expect(VehicleFixtures::rs4First()->label())->toBe('Audi RS 4 Avant Quattro (B9)')
        ->and(VehicleFixtures::rs4Second()->labelWithPeriod())
        ->toBe("Audi RS 4 Avant Quattro (B9), 12/2019\u{2013}heute")
        ->and(VehicleFixtures::bmw3er()->keyNumbers())->toBe('0005/582');
});
