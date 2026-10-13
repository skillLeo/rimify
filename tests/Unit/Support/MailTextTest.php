<?php

declare(strict_types=1);

use App\Support\MailText;
use Illuminate\Mail\Markdown;

/*
 * MailText::literal — a value as a Markdown mail prints it: as written (D-205). The proof is the mail's own parser:
 * what comes out of it, read as text, is what went in.
 */

/** What a reader sees of a Markdown paragraph: the parser's HTML, tags off, entities back. Blank-separated. */
function mailReads(string $markdown): string
{
    $html = (string) Markdown::parse($markdown);

    return trim((string) preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
}

function oneLine(string $text): string
{
    return trim((string) preg_replace('/\s+/u', ' ', $text));
}

/** @return list<string> every Auflage sentence of the three transcribed Gutachten */
function gutachtenSentences(): array
{
    $sentences = [];

    foreach (['abe-55255.json', 'abe-53841.json', '366-0350-21-WIRD-N1.json'] as $file) {
        $data = json_decode((string) file_get_contents(dirname(__DIR__, 3).'/docs/gutachten/'.$file), true, flags: JSON_THROW_ON_ERROR);

        foreach ($data['conditions'] ?? [] as $condition) {
            if (is_string($condition['text_de'] ?? null) && $condition['text_de'] !== '') {
                $sentences[] = $condition['text_de'];
            }
        }
    }

    return array_values(array_unique($sentences));
}

it('prints every sign Markdown reads as syntax as itself', function (string $written): void {
    expect(mailReads(MailText::literal($written)))->toBe(oneLine($written));
})->with([
    'emphasis' => ['Typgenehmigung e1*2001/116*0314*10 und __fett__ und Feld_K_unten'],
    'a link' => ['[Hier klicken](https://example.org/falle)'],
    'an image' => ['![Zähler](https://example.org/zaehler.png)'],
    'a heading' => ['# Wichtig'],
    'a numbered line' => ['1. Die Radabdeckung ist herzustellen.'],
    'a numbered line with a bracket' => ['2) Nur an Achse 2.'],
    'a bullet' => ['- nur feingliedrige Schneeketten'],
    'a plus' => ['+ 225/40 R18'],
    'a rule under a line' => ["Reifen\n===="],
    'a table' => ["| a | b |\n|---|---|\n| 1 | 2 |"],
    'code' => ['`rm -rf` und ~~~'],
    'markup' => ['<a href="https://example.org">x</a> & <b>fett</b>'],
    'an entity typed out' => ['&copy; &amp; &#42;'],
    'a backslash' => ['C:\\Felgen\\*neu*'],
    'four spaces in' => ['    eingerückt'],
    'a quote mark' => ['> zitiert'],
]);

it('makes nothing of them: no link, image, emphasis, heading, list, table or code', function (): void {
    $html = (string) Markdown::parse(MailText::literal(
        "# Wichtig\n\n[x](https://example.org) ![y](https://example.org/p.png) *a* _b_ `c`\n\n1. eins\n- zwei\n\n| a |\n|---|\n| 1 |\n\n<script>alert(1)</script>"
    ));

    expect($html)->not->toMatch('/<(a|img|em|strong|h[1-6]|ol|ul|li|table|code|pre|script|blockquote)\b/');
});

it('leaves every Auflage of the three Gutachten as the document prints it — and Markdown alone does not @kunde-21', function (): void {
    $sentences = gutachtenSentences();
    $changedByMarkdown = [];

    expect(count($sentences))->toBeGreaterThan(50);

    foreach ($sentences as $sentence) {
        // As the order mail prints it: one list item per Auflage.
        expect(mailReads('- '.MailText::literal($sentence)))->toBe(oneLine($sentence));

        if (mailReads('- '.e($sentence)) !== oneLine($sentence)) {
            $changedByMarkdown[] = $sentence;
        }
    }

    // What the mail did before, on these very documents: read as Markdown, the Auflage that names an EG type approval
    // — „… ab einschließlich EG-Typgenehmigungs-Nr. e1*93/81*…“ — lost its stars to italics. One of 177 on 13.10.2026.
    expect($changedByMarkdown)->not->toBeEmpty()
        ->and(implode(' ', $changedByMarkdown))->toContain('EG-Typgenehmigungs-Nr. e1*');
});
