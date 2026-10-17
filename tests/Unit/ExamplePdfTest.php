<?php

declare(strict_types=1);

use App\Services\Demo\ExamplePdf;
use setasign\Fpdi\PdfParser\PdfParser;
use setasign\Fpdi\PdfParser\StreamReader;
use setasign\Fpdi\PdfParser\Type\PdfArray;
use setasign\Fpdi\PdfParser\Type\PdfDictionary;
use setasign\Fpdi\PdfParser\Type\PdfStream;
use setasign\Fpdi\PdfParser\Type\PdfType;
use setasign\Fpdi\PdfReader\PdfReader;
use Tests\Support\MinimalPdf;

/*
 * The acceptance set's example copy of a Gutachten (decision 6, the operator's brief of 17.10.2026 §6, D-268): the
 * document byte for byte, and after it an incremental update that lays „BEISPIEL“ and the band over every page.
 */

/**
 * Each page's content streams in the stamped file, unfiltered, in order.
 *
 * @return list<list<string>>
 */
function stampedStreams(string $pdf): array
{
    $parser = new PdfParser(StreamReader::createByString($pdf));
    $reader = new PdfReader($parser);
    $pages = [];

    for ($i = 1; $i <= $reader->getPageCount(); $i++) {
        $contents = PdfArray::ensure(PdfDictionary::get($reader->getPage($i)->getPageDictionary(), 'Contents'))->value;
        $pages[] = array_map(static fn (PdfType $ref): string => PdfStream::ensure(PdfType::resolve($ref, $parser))->getUnfilteredStream(), $contents);
    }

    return $pages;
}

it('keeps the document byte for byte and lays the mark over every page', function (): void {
    $original = MinimalPdf::make(['Seite 1', 'Seite 2', 'Seite 3']);
    $copy = ExamplePdf::stamp($original);
    $pages = stampedStreams($copy);

    expect(str_starts_with($copy, $original))->toBeTrue()
        ->and(hash('sha256', $copy))->not->toBe(hash('sha256', $original))
        ->and($pages)->toHaveCount(3);

    foreach ($pages as $streams) {
        $overlay = end($streams);

        expect($streams)->toHaveCount(3)
            ->and($overlay)->toContain('(BEISPIEL) Tj')
            // See-through: the page under it stays readable.
            ->and($overlay)->toContain('/RimifyFaint gs')
            // The band, in Windows-1252: „–“ is \226.
            ->and($overlay)->toContain('(Kopie aus der RIMIFY-Testumgebung \226 dieses Gutachten ist bei uns nur als Beispiel hinterlegt.) Tj');
    }
});

it('draws each original page between a q and a Q of its own, so no state it leaves can turn the mark', function (): void {
    [$streams] = stampedStreams(ExamplePdf::stamp(MinimalPdf::make()));

    expect(trim($streams[0]))->toBe('q')
        ->and($streams[1])->toContain('(Seite 1) Tj')
        ->and(str_starts_with($streams[2], "Q\nq\n"))->toBeTrue();
});

it('keeps what the document draws beside its pages — its annotations, as the Nachtrag\'s „§22 53841*01“ is one', function (): void {
    $reader = new PdfReader(new PdfParser(StreamReader::createByString(ExamplePdf::stamp(MinimalPdf::make(['Seite 1', 'Seite 2'], annotated: true)))));

    expect($reader->getPage(1)->getAttribute('Annots', false))->not->toBeNull()
        ->and($reader->getPage(2)->getAttribute('Annots', false))->not->toBeNull();
});

it('turns its frame with the page: across and the top edge are as the page is shown', function (): void {
    [[, , $overlay]] = stampedStreams(ExamplePdf::stamp(MinimalPdf::make(rotate: 90)));

    expect($overlay)->toContain('0.00000 1.00000 -1.00000 0.00000 595.000 0.000 cm');
});

it('refuses a file it cannot extend with a sentence, never a guess', function (): void {
    $pdf = MinimalPdf::make();

    expect(fn () => ExamplePdf::stamp((string) preg_replace('/startxref\s+\d+/', 'startxref 9', $pdf)))
        ->toThrow(RuntimeException::class, 'Diese PDF-Datei führt ihr Verzeichnis als Stream')
        ->and(fn () => ExamplePdf::stamp('kein PDF'))
        ->toThrow(RuntimeException::class, 'Diese PDF-Datei endet nicht, wie eine PDF-Datei endet');
});
