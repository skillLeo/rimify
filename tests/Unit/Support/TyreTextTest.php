<?php

declare(strict_types=1);

use App\Domain\Fitment\Derivation\ReferenceTables;
use App\Support\TyreText;

/*
 * The notations a Gutachten prints (the Gutachten rework §6), and the second real paper's: „HL 255/35R20 100“. One list,
 * read by this test and by the browser's (Erfassung/tyreInput.test.ts), so the two readings can never drift apart.
 */

/** @return array<string, mixed> */
function tyreNotations(): array
{
    return json_decode((string) file_get_contents(__DIR__.'/../../Fixtures/tyre-notations.json'), true, flags: JSON_THROW_ON_ERROR);
}

it('reads every notation with the load index, the symbol and the marker apart', function (): void {
    $reads = tyreNotations()['reads'];
    expect($reads)->not->toBeEmpty();

    foreach ($reads as $case) {
        $tyre = TyreText::read($case['text']);

        expect($tyre)->not->toBeNull($case['text'])
            ->and($tyre)->toBe([
                'width' => $case['width'], 'aspect' => $case['aspect'], 'diameter' => $case['diameter'],
                'li' => $case['li'], 'li2' => $case['li2'], 'si' => $case['si'], 'marker' => $case['marker'],
            ], $case['text'])
            ->and(TyreText::label($tyre))->toBe($case['label'], $case['text']);
    }
});

it('refuses what does not read rather than guess', function (): void {
    $refuses = tyreNotations()['refuses'];
    expect($refuses)->not->toBeEmpty();

    foreach ($refuses as $text) {
        expect(TyreText::read($text))->toBeNull((string) json_encode($text));
    }
});

it('keeps a figure the paper does not print as not given', function (): void {
    expect(TyreText::read('235/50R18'))->toBe(['width' => 235, 'aspect' => 50, 'diameter' => 18, 'li' => null, 'li2' => null, 'si' => null, 'marker' => null]);
});

// The client's round of 08.11.2026, §4 (D-442): „There are additional speed ratings that can be combined with the load index. Please make
// sure all possible combinations are available.“ Every pairing of a load index 0 to 279 and a symbol J to (Y) reads.
it('reads every load index with every speed symbol, and every symbol in the order the engine ranks them', function (): void {
    foreach ([0, 9, 70, 91, 120, 121, 199, 279] as $index) {
        foreach (TyreText::SYMBOLS as $symbol) {
            $tyre = TyreText::read("225/40 R18 {$index}{$symbol}");

            expect($tyre['li'] ?? null)->toBe($index, "{$index}{$symbol}")
                ->and($tyre['si'] ?? null)->toBe($symbol, "{$index}{$symbol}");
        }
    }

    expect(TyreText::SYMBOLS)->toBe(array_column(ReferenceTables::SPEED_SYMBOLS, 'symbol'))
        ->and(TyreText::read('225/40 R18 280W'))->toBeNull();
});

// The operator's decision of 09.11.2026 (D-445): „ZR“ without a service description only says above 240 km/h, with no stated limit
// (ECE-R 30). Never W, never any symbol: the size alone, „speed symbol not given“ — the same fail-closed rule as any size without one.
it('reads a bare ZR as the size alone, with no speed symbol and no load index — never W', function (): void {
    foreach (['225/40 ZR18', '225/40ZR18', '225/40 Z R 18'] as $text) {
        expect(TyreText::read($text))->toBe(['width' => 225, 'aspect' => 40, 'diameter' => 18, 'li' => null, 'li2' => null, 'si' => null, 'marker' => null], $text);
    }

    // With its service description it says what it prints, the bracket form the category above 300 km/h.
    expect(TyreText::read('225/40 ZR18 92W')['si'] ?? null)->toBe('W')
        ->and(TyreText::read('225/40 ZR18 (92Y)')['si'] ?? null)->toBe('(Y)');
});
