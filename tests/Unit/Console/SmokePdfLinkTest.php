<?php

declare(strict_types=1);

use App\Console\Commands\Smoke;

/*
 * The smoke test finds the product page's „Gutachten öffnen“ link wherever `href` stands among its attributes: after
 * the product page's rework `class` came first, and the smoke on the preview reported no link (03.10.2026) while the
 * link was there.
 */

it('finds the Gutachten link whatever order its attributes stand in', function (string $html, string $expected): void {
    expect(Smoke::pdfLink($html))->toBe($expected);
})->with([
    'href first' => ['<p><a href="/storage/gutachten/abe-55255.pdf#page=10" target="_blank">Gutachten öffnen (PDF, Seite 10)</a></p>', '/storage/gutachten/abe-55255.pdf#page=10'],
    'class first, as the page renders it' => ['<p class="fit__pdf"><a class="link" href="/storage/gutachten/abe-55255.pdf#page=10" target="_blank" rel="noopener">
        Gutachten öffnen (PDF, Seite 10)</a></p>', '/storage/gutachten/abe-55255.pdf#page=10'],
    'an entity in the address, decoded' => ['<a class="link" href="/storage/gutachten/x.pdf?v=2&amp;s=1#page=3" rel="noopener">Gutachten öffnen</a>', '/storage/gutachten/x.pdf?v=2&s=1#page=3'],
]);

it('finds nothing where there is no Gutachten link', function (): void {
    expect(Smoke::pdfLink('<a class="link" href="/felgen">Alle Felgen</a>'))->toBeNull()
        ->and(Smoke::pdfLink('<p>Gutachten öffnen</p>'))->toBeNull();
});

it('follows an example document through the page that marks it, to the file behind that page (D-239)', function (): void {
    $product = '<p class="fit__pdf"><a class="link" href="https://rimify.skillleo.com/gutachten/5/beispiel?seite=6" target="_blank">Gutachten öffnen (Beispiel, PDF, Seite 6)</a></p>';
    $example = '<p class="ex__open"><a class="btn btn--secondary" href="/storage/gutachten/abe-55255.pdf#page=6" target="_blank" rel="noopener">Das Dokument öffnen (PDF, Seite 6)</a></p>';

    expect(Smoke::pdfLink($product))->toBe('https://rimify.skillleo.com/gutachten/5/beispiel?seite=6')
        ->and(Smoke::isExamplePage('https://rimify.skillleo.com/gutachten/5/beispiel?seite=6'))->toBeTrue()
        ->and(Smoke::isExamplePage('/gutachten/5/beispiel'))->toBeTrue()
        ->and(Smoke::isExamplePage('/storage/gutachten/abe-55255.pdf#page=6'))->toBeFalse()
        ->and(Smoke::isExamplePage('/gutachten/5/beispielseite'))->toBeFalse()
        ->and(Smoke::pdfLink($example, 'Das Dokument öffnen'))->toBe('/storage/gutachten/abe-55255.pdf#page=6');
});
