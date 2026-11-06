<?php

declare(strict_types=1);

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
                'li' => $case['li'], 'si' => $case['si'], 'marker' => $case['marker'],
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
    expect(TyreText::read('235/50R18'))->toBe(['width' => 235, 'aspect' => 50, 'diameter' => 18, 'li' => null, 'si' => null, 'marker' => null]);
});
