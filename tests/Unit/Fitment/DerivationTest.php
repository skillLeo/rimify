<?php

declare(strict_types=1);

use App\Domain\Fitment\Derivation\IndexTables;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\ReferenceTables;
use App\Domain\Fitment\Derivation\SpeedSymbol;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Exceptions\ReferenceDataMissing;

/*
 * The two derivations decide what RIMIFY is legally allowed to offer. Every assertion here is
 * about failing closed: the wrong answer in the permissive direction is the one that costs a
 * customer their Hauptuntersuchung.
 */

beforeEach(function (): void {
    $this->tables = IndexTables::fromReferenceTables();
    $this->loadIndex = new LoadIndexDeriver($this->tables);
    $this->speed = new SpeedSymbolDeriver($this->tables);
});

it('derives the load index of every worked example in the spec', function (int $axleLoadKg, int $expected): void {
    expect($this->loadIndex->forAxle($axleLoadKg)?->index)->toBe($expected);
})->with([
    // Audi RS 4 Avant B9 (1860/AAS) — front and rear, from the client's own demo data.
    'RS4 B9 front 1210kg → 605.0' => [1210, 91],
    'RS4 B9 rear 1235kg → 617.5' => [1235, 92],
    // Audi RS4 2.7 Avant B5 (7967/307)
    'RS4 B5 front 1145kg → 572.5' => [1145, 89],
    'RS4 B5 rear 1140kg → 570.0' => [1140, 89],
    // Audi RS4 4.2 TFSI B6 (7967/AAE) — front and rear differ by three steps on one car.
    'RS4 B6 front 1230kg → 615.0' => [1230, 91],
    'RS4 B6 rear 1100kg → 550.0' => [1100, 88],
    // BMW Z8 4.9 E52 (0005/674)
    'Z8 front 920kg → 460.0' => [920, 81],
    'Z8 rear 1070kg → 535.0' => [1070, 87],
    // VW Fox 1.2 5Z (0603/AAT)
    'Fox front 765kg → 382.5' => [765, 75],
    'Fox rear 750kg → 375.0' => [750, 74],
]);

it('picks the first index whose capacity actually reaches the load', function (): void {
    // Index 91 carries 615 kg. An axle load of exactly 1230 kg is 615.0 per tyre — 91 is enough.
    expect($this->loadIndex->forAxle(1230)?->index)->toBe(91);

    // One kilogram more is 615.5 per tyre, which 91 no longer covers.
    expect($this->loadIndex->forAxle(1231)?->index)->toBe(92);
});

it('does not round the per-tyre mass down to the previous index', function (): void {
    // 1211 kg is 605.5 kg per tyre. Integer division would give 605, which index 91 (615 kg)
    // covers either way — but 1231 kg is 615.5, where truncating to 615 would wrongly accept 91.
    expect($this->loadIndex->forAxle(1231)?->capacityKg)->toBe(630)
        ->and($this->loadIndex->forAxle(1211)?->index)->toBe(91);
});

it('returns null rather than zero for unusable axle data', function (?int $axleLoadKg): void {
    // A zero index would compare as "any tyre is sufficient" and permit everything (R-03).
    expect($this->loadIndex->forAxle($axleLoadKg))->toBeNull();
})->with([
    'null' => [null],
    'zero' => [0],
    'negative' => [-1],
    'very negative' => [-1500],
]);

it('returns null for a load beyond the passenger-car table rather than guessing', function (): void {
    expect($this->loadIndex->forAxle(10_000))->toBeNull();
});

it('derives the minimum speed symbol for the worked examples', function (int $kmh, string $expected): void {
    expect($this->speed->forTopSpeed($kmh)?->symbol)->toBe($expected);
})->with([
    // The spec's worked-example table printed T here. It was generated from a reduced
    // symbol set missing N, P, Q, R, S and U, so T was simply the first symbol still present.
    // The complete table gives P — docs/decisions.md D-018, resolved.
    'VW Fox 148 km/h' => [148, 'P'],
    'Z8 and RS4 B5 250 km/h' => [250, 'W'],
    'RS4 B9 first variant 280 km/h' => [280, 'Y'],
    'RS4 B9 second variant 290 km/h' => [290, 'Y'],
]);

it('derives the correct symbol at every boundary of the complete table', function (int $kmh, string $expected): void {
    // Exhaustive, including the six symbols the truncated table omitted. A missing row does not
    // fail loudly — it silently returns the next symbol that happens to be present — so the only
    // defence is asserting every boundary.
    expect($this->speed->forTopSpeed($kmh)?->symbol)->toBe($expected);
})->with([
    'below the table' => [1, 'L'],
    'exactly L' => [120, 'L'],
    'one above L' => [121, 'M'],
    'exactly M' => [130, 'M'],
    'one above M' => [131, 'N'],
    'exactly N' => [140, 'N'],
    'one above N' => [141, 'P'],
    'exactly P' => [150, 'P'],
    'one above P' => [151, 'Q'],
    'exactly Q' => [160, 'Q'],
    'one above Q' => [161, 'R'],
    'exactly R' => [170, 'R'],
    'one above R' => [171, 'S'],
    'exactly S' => [180, 'S'],
    'one above S' => [181, 'T'],
    'exactly T' => [190, 'T'],
    'one above T' => [191, 'U'],
    'exactly U' => [200, 'U'],
    'one above U' => [201, 'H'],
    'exactly H' => [210, 'H'],
    'one above H' => [211, 'V'],
    'exactly V' => [240, 'V'],
    'one above V' => [241, 'W'],
    'exactly W' => [270, 'W'],
    'one above W' => [271, 'Y'],
    'exactly Y' => [300, 'Y'],
    'above every rating' => [301, '(Y)'],
    'far above every rating' => [420, '(Y)'],
]);

it('covers every symbol in the table across the speed range', function (): void {
    // If a row were dropped, the symbol it names would simply never be derived. This notices.
    $derived = [];

    for ($kmh = 1; $kmh <= 320; $kmh++) {
        $symbol = $this->speed->forTopSpeed($kmh)?->symbol;

        if ($symbol !== null) {
            $derived[$symbol] = true;
        }
    }

    expect(array_keys($derived))->toEqualCanonicalizing(
        array_column(ReferenceTables::SPEED_SYMBOLS, 'symbol')
    );
});

it('reproduces the legal minimum exactly when the safety margin is zero', function (): void {
    $legal = new SpeedSymbolDeriver($this->tables, marginSteps: 0);

    for ($kmh = 1; $kmh <= 320; $kmh++) {
        expect($legal->forTopSpeed($kmh)?->symbol)->toBe($this->speed->forTopSpeed($kmh)?->symbol);
    }

    // That the shipped DEFAULT is 0 is a Laravel concern, asserted in
    // tests/Feature/Fitment/EngineConfigTest.php — this suite boots no framework (R-13).
});

it('raises the requirement by the configured margin, and only ever upward', function (): void {
    $stricter = new SpeedSymbolDeriver($this->tables, marginSteps: 1);

    expect($stricter->forTopSpeed(148)?->symbol)->toBe('Q')      // legal P, one step up
        ->and($stricter->forTopSpeed(210)?->symbol)->toBe('V')   // legal H, one step up
        // Clamps at the top of the table rather than wrapping or falling back to null.
        ->and($stricter->forTopSpeed(301)?->symbol)->toBe('(Y)');

    // A margin can never be used to permit a weaker tyre.
    expect(fn () => new SpeedSymbolDeriver($this->tables, marginSteps: -1))
        ->toThrow(InvalidArgumentException::class);
});

it('returns null rather than a symbol for unusable speed data', function (?int $kmh): void {
    expect($this->speed->forTopSpeed($kmh))->toBeNull();
})->with(['null' => [null], 'zero' => [0], 'negative' => [-5]]);

it('ranks the whole table in speed order, which is not alphabetical order', function (): void {
    $bySpeed = array_map(
        static fn (SpeedSymbol $s): string => $s->symbol,
        $this->tables->speedSymbols,
    );

    expect($bySpeed)->toBe(['L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', '(Y)']);

    $alphabetical = $bySpeed;
    sort($alphabetical);
    expect($alphabetical)->not->toBe($bySpeed);
});

it('ranks H between U and V, which the alphabet does not', function (): void {
    $u = $this->tables->speedSymbol('U');
    $h = $this->tables->speedSymbol('H');
    $v = $this->tables->speedSymbol('V');

    expect($h?->rank)->toBeGreaterThan($u?->rank)
        ->and($h?->rank)->toBeLessThan($v?->rank);

    // The bug this design prevents: ordering by letter puts H FIRST, so a 210 km/h car would be
    // told a 200 km/h U tyre is sufficient.
    $letters = ['U', 'H', 'V'];
    sort($letters);
    expect($letters)->toBe(['H', 'U', 'V'])->not->toBe(['U', 'H', 'V']);
});

it('never lets a lower-rated symbol satisfy a higher-rated requirement', function (): void {
    $required = $this->speed->forTopSpeed(210);   // H
    $u = $this->tables->speedSymbol('U');
    $v = $this->tables->speedSymbol('V');

    expect($u?->isAtLeast($required))->toBeFalse()
        ->and($v?->isAtLeast($required))->toBeTrue()
        ->and($required?->isAtLeast($required))->toBeTrue();
});

it('resolves a document symbol whatever case or spacing it was transcribed in', function (): void {
    expect($this->tables->speedSymbol('y')?->symbol)->toBe('Y')
        ->and($this->tables->speedSymbol(' V ')?->symbol)->toBe('V')
        ->and($this->tables->speedSymbol('(y)')?->symbol)->toBe('(Y)');
});

it('returns null for a symbol it does not recognise, never rank zero', function (?string $symbol): void {
    // A symbol that fell through to rank 0 would compare as "no requirement at all".
    expect($this->tables->speedSymbol($symbol))->toBeNull();
})->with([
    'unknown letter' => ['ZR'],
    'empty' => [''],
    'whitespace' => ['   '],
    'null' => [null],
    'a number' => ['91'],
]);

it('refuses to construct an index table that is empty', function (): void {
    // An empty table must not look like "no minimum applies".
    expect(fn () => new IndexTables([], [new SpeedSymbol('Y', 11, 300)]))
        ->toThrow(ReferenceDataMissing::class);

    expect(fn () => new IndexTables(IndexTables::fromReferenceTables()->loadIndices, []))
        ->toThrow(ReferenceDataMissing::class);
});

it('takes the stricter of a derived and a document minimum', function (): void {
    $derived = $this->loadIndex->forAxle(1210);          // 91
    $documentStricter = $this->tables->loadIndex(95);
    $documentLaxer = $this->tables->loadIndex(88);

    // R-06: the stricter always governs, whichever side it came from.
    expect($derived?->stricterOf($documentStricter)->index)->toBe(95)
        ->and($derived?->stricterOf($documentLaxer)->index)->toBe(91)
        ->and($derived?->stricterOf(null)->index)->toBe(91);

    $derivedSpeed = $this->speed->forTopSpeed(210);      // H, rank 8
    expect($derivedSpeed?->stricterOf($this->tables->speedSymbol('W'))->symbol)->toBe('W')
        ->and($derivedSpeed?->stricterOf($this->tables->speedSymbol('T'))->symbol)->toBe('H');
});
