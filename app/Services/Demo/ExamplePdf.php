<?php

declare(strict_types=1);

namespace App\Services\Demo;

use RuntimeException;
use setasign\Fpdi\PdfParser\PdfParser;
use setasign\Fpdi\PdfParser\StreamReader;
use setasign\Fpdi\PdfParser\Type\PdfArray;
use setasign\Fpdi\PdfParser\Type\PdfBoolean;
use setasign\Fpdi\PdfParser\Type\PdfDictionary;
use setasign\Fpdi\PdfParser\Type\PdfHexString;
use setasign\Fpdi\PdfParser\Type\PdfIndirectObjectReference;
use setasign\Fpdi\PdfParser\Type\PdfName;
use setasign\Fpdi\PdfParser\Type\PdfNull;
use setasign\Fpdi\PdfParser\Type\PdfNumeric;
use setasign\Fpdi\PdfParser\Type\PdfString;
use setasign\Fpdi\PdfParser\Type\PdfType;
use setasign\Fpdi\PdfReader\PdfReader;

/**
 * The acceptance set's own copy of a real Gutachten (decision 6, the operator's brief of 17.10.2026 §6): the document
 * exactly as it is, with „BEISPIEL“ across every page and a band along its top edge that says what the file is here. The
 * copy says it wherever it is opened — downloaded, forwarded, printed — and is never the same file as a real document's:
 * the client's own „ABE 53841“ had carried the very bytes of the set's Nachtrag (D-265).
 *
 * Added, never rebuilt: the original's bytes stay as they are and an incremental update (PDF 1.7, §7.5.6) lays the
 * mark over each page. Rebuilding the pages (FPDI's import) dropped what the document draws outside its page content
 * — the Nachtrag's own „§22 53841*01“ in the margin of every page is a watermark annotation — and a copy that loses a
 * line of its document is not that document. Nothing is covered: the mark is drawn see-through, the band only over the
 * top edge, where a Gutachten prints no figure. The band speaks as the shop's example page does (D-239).
 *
 * The original's pages are drawn between a `q` and a `Q` of their own, so whatever state they leave cannot turn the
 * mark. A file whose cross-reference is a stream (compressed, PDF 1.5) is refused with a sentence, not guessed at.
 */
final class ExamplePdf
{
    public const MARK = 'BEISPIEL';

    public const BAND = 'Kopie aus der RIMIFY-Testumgebung – dieses Gutachten ist bei uns nur als Beispiel hinterlegt.';

    /** The red both are drawn in — the shop's „Nicht freigegeben“ family — as PDF fill colour. */
    private const RED = '0.690 0.125 0.149 rg';

    /** The band's height and its sentence's size, in points. */
    private const BAND_PT = 17.0;

    private const BAND_FONT_PT = 7.5;

    /** Helvetica-Bold's advance widths (its AFM, per 1 000 em) for Windows-1252 32–126; then the few beyond it the texts use. */
    private const ASCII_WIDTHS = [
        278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
        556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
        975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
        667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
        333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
        611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
    ];

    private const OTHER_WIDTHS = [0x84 => 500, 0x93 => 500, 0x94 => 500, 0x96 => 556, 0xC4 => 722, 0xD6 => 778, 0xDC => 722, 0xDF => 611, 0xE4 => 556, 0xF6 => 611, 0xFC => 611];

    /**
     * The stamped copy of a PDF's bytes: the original, untouched, and after it the update that marks every page.
     *
     * @throws RuntimeException where the file cannot be extended this way
     */
    public static function stamp(string $original): string
    {
        if (preg_match('/startxref\s+(\d+)\s+%%EOF\s*$/', $original, $m) !== 1) {
            throw new RuntimeException('Diese PDF-Datei endet nicht, wie eine PDF-Datei endet: Der Beispiel-Stempel kann sie nicht ergänzen.');
        }

        $previous = (int) $m[1];

        if (substr($original, $previous, 4) !== 'xref') {
            throw new RuntimeException('Diese PDF-Datei führt ihr Verzeichnis als Stream: Der Beispiel-Stempel kann sie nicht ergänzen.');
        }

        $parser = new PdfParser(StreamReader::createByString($original));
        $reader = new PdfReader($parser);
        $trailer = $parser->getCrossReference()->getTrailer();
        $next = (int) PdfNumeric::ensure(PdfDictionary::get($trailer, 'Size'))->value;

        /** @var array<int, array{0: int, 1: string}> $objects number => [generation, body] */
        $objects = [];
        $add = static function (string $body) use (&$next, &$objects): int {
            $number = $next++;
            $objects[$number] = [0, $body];

            return $number;
        };

        $font = $add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
        $states = [
            'RimifyFaint' => $add('<< /Type /ExtGState /ca 0.13 /CA 0.13 >>'),
            'RimifyBand' => $add('<< /Type /ExtGState /ca 0.88 /CA 0.88 >>'),
            'RimifySolid' => $add('<< /Type /ExtGState /ca 1 /CA 1 >>'),
        ];
        $open = $add(self::stream("q\n"));

        for ($i = 1, $pages = $reader->getPageCount(); $i <= $pages; $i++) {
            $page = $reader->getPage($i);
            $object = $page->getPageObject();
            $dictionary = PdfDictionary::ensure($object->value);
            $box = $page->getBoundary();

            if ($box === false) {
                throw new RuntimeException("Seite {$i} dieser PDF-Datei nennt keine Größe: Der Beispiel-Stempel kann sie nicht ergänzen.");
            }

            $overlay = $add(self::stream(self::overlay($box->getLlx(), $box->getLly(), $box->getUrx(), $box->getUry(), (int) $page->getRotation())));

            $contents = [PdfIndirectObjectReference::create($open, 0)];
            $current = $dictionary->value['Contents'] ?? null;

            if ($current instanceof PdfArray) {
                array_push($contents, ...$current->value);
            } elseif ($current !== null) {
                $contents[] = $current;
            }

            $contents[] = PdfIndirectObjectReference::create($overlay, 0);

            $inherited = $page->getAttribute('Resources');
            $resources = $inherited === null ? [] : PdfDictionary::ensure(PdfType::resolve($inherited, $parser))->value;
            $fonts = self::entries($resources['Font'] ?? null, $parser);
            $fonts['RimifyBeispiel'] = PdfIndirectObjectReference::create($font, 0);
            $graphics = self::entries($resources['ExtGState'] ?? null, $parser);

            foreach ($states as $name => $number) {
                $graphics[$name] = PdfIndirectObjectReference::create($number, 0);
            }

            $resources['Font'] = PdfDictionary::create($fonts);
            $resources['ExtGState'] = PdfDictionary::create($graphics);

            $entries = $dictionary->value;
            $entries['Contents'] = PdfArray::create($contents);
            $entries['Resources'] = PdfDictionary::create($resources);

            $objects[(int) $object->objectNumber] = [(int) $object->generationNumber, self::write(PdfDictionary::create($entries))];
        }

        return self::append($original, $objects, $next, $trailer, $previous);
    }

    /**
     * The original, then the objects, a cross-reference section for them and a trailer that points back.
     *
     * @param  array<int, array{0: int, 1: string}>  $objects
     */
    private static function append(string $original, array $objects, int $size, PdfDictionary $trailer, int $previous): string
    {
        $out = str_ends_with($original, "\n") ? $original : $original."\n";
        $offsets = [];
        ksort($objects);

        foreach ($objects as $number => [$generation, $body]) {
            $offsets[$number] = [strlen($out), $generation];
            $out .= "{$number} {$generation} obj\n{$body}\nendobj\n";
        }

        $xref = strlen($out);
        $out .= "xref\n";
        $run = [];

        foreach (array_keys($offsets) as $number) {
            if ($run !== [] && $number !== end($run) + 1) {
                $out .= self::section($run, $offsets);
                $run = [];
            }

            $run[] = $number;
        }

        $out .= self::section($run, $offsets);

        $entries = ['Size' => PdfNumeric::create($size), 'Root' => $trailer->value['Root'], 'Prev' => PdfNumeric::create($previous)];

        foreach (['Info', 'ID'] as $key) {
            if (isset($trailer->value[$key])) {
                $entries[$key] = $trailer->value[$key];
            }
        }

        return $out."trailer\n".self::write(PdfDictionary::create($entries))."\nstartxref\n{$xref}\n%%EOF\n";
    }

    /**
     * @param  list<int>  $run  consecutive object numbers
     * @param  array<int, array{0: int, 1: int}>  $offsets
     */
    private static function section(array $run, array $offsets): string
    {
        $lines = $run[0].' '.count($run)."\n";

        foreach ($run as $number) {
            $lines .= sprintf("%010d %05d n \n", $offsets[$number][0], $offsets[$number][1]);
        }

        return $lines;
    }

    /**
     * What is drawn over one page, in the page's own space: a frame that turns with the page's /Rotate, so „across“ and
     * „the top edge“ are as the page is shown; the mark through its middle, corner to corner; the band along its top.
     */
    private static function overlay(float $x0, float $y0, float $x1, float $y1, int $rotation): string
    {
        $w = $x1 - $x0;
        $h = $y1 - $y0;

        [$frame, $width, $height] = match ((($rotation % 360) + 360) % 360) {
            90 => [[0, 1, -1, 0, $x1, $y0], $h, $w],
            180 => [[-1, 0, 0, -1, $x1, $y1], $w, $h],
            270 => [[0, -1, 1, 0, $x0, $y1], $h, $w],
            default => [[1, 0, 0, 1, $x0, $y0], $w, $h],
        };

        // Across: as large as the diagonal allows with a margin, its middle the page's (a cap is 0,72 em high).
        $angle = atan2($height, $width);
        $em = self::width(self::MARK) / 1000;
        $size = sqrt($width ** 2 + $height ** 2) * 0.62 / $em;
        $half = $em * $size / 2;
        $cap = 0.72 * $size / 2;
        [$cos, $sin] = [cos($angle), sin($angle)];
        $tx = $width / 2 - $half * $cos + $cap * $sin;
        $ty = $height / 2 - $half * $sin - $cap * $cos;

        // Along the top edge: the sentence, smaller where the page is narrow.
        $band = self::latin(self::BAND);
        $bandSize = min(self::BAND_FONT_PT, ($width - 24) * 1000 / max(1.0, self::width($band)));
        $bx = max(12.0, ($width - self::width($band) * $bandSize / 1000) / 2);
        $by = $height - self::BAND_PT + (self::BAND_PT - 0.72 * $bandSize) / 2;

        return implode("\n", [
            'Q',
            'q',
            vsprintf('%.5F %.5F %.5F %.5F %.3F %.3F cm', $frame),
            '/RimifyFaint gs',
            self::RED,
            'BT',
            sprintf('/RimifyBeispiel %.3F Tf', $size),
            sprintf('%.5F %.5F %.5F %.5F %.3F %.3F Tm', $cos, $sin, -$sin, $cos, $tx, $ty),
            '('.self::escape(self::MARK).') Tj',
            'ET',
            '/RimifyBand gs',
            '1 1 1 rg',
            sprintf('0 %.3F %.3F %.3F re', $height - self::BAND_PT, $width, self::BAND_PT),
            'f',
            '/RimifySolid gs',
            self::RED,
            'BT',
            sprintf('/RimifyBeispiel %.3F Tf', $bandSize),
            sprintf('1 0 0 1 %.3F %.3F Tm', $bx, $by),
            '('.self::escape($band).') Tj',
            'ET',
            'Q',
            '',
        ]);
    }

    /**
     * A dictionary's entries, followed where it is a reference.
     *
     * @return array<string, PdfType>
     */
    private static function entries(?PdfType $value, PdfParser $parser): array
    {
        return $value === null ? [] : PdfDictionary::ensure(PdfType::resolve($value, $parser))->value;
    }

    /** A value as PDF writes it; strings, hex strings and names as the original spelled them (FPDI keeps them raw). */
    private static function write(PdfType $value): string
    {
        return match (true) {
            $value instanceof PdfDictionary => '<< '.implode(' ', array_map(static fn (string $key, PdfType $v): string => '/'.$key.' '.self::write($v), array_keys($value->value), $value->value)).' >>',
            $value instanceof PdfArray => '['.implode(' ', array_map(static fn (PdfType $v): string => self::write($v), $value->value)).']',
            $value instanceof PdfIndirectObjectReference => $value->value.' '.$value->generationNumber.' R',
            $value instanceof PdfName => '/'.$value->value,
            $value instanceof PdfString => '('.$value->value.')',
            $value instanceof PdfHexString => '<'.$value->value.'>',
            $value instanceof PdfNumeric => is_int($value->value) ? (string) $value->value : rtrim(rtrim(sprintf('%.6F', $value->value), '0'), '.'),
            $value instanceof PdfBoolean => $value->value ? 'true' : 'false',
            $value instanceof PdfNull => 'null',
            default => throw new RuntimeException('Diese PDF-Datei enthält einen Wert, den der Beispiel-Stempel nicht abschreiben kann ('.$value::class.').'),
        };
    }

    private static function stream(string $content): string
    {
        return '<< /Length '.strlen($content)." >>\nstream\n".$content."\nendstream";
    }

    /** A PDF literal string's body: backslash and brackets escaped, every byte past ASCII as an octal escape. */
    private static function escape(string $latin): string
    {
        $out = '';

        foreach (str_split($latin) as $char) {
            $byte = ord($char);
            $out .= match (true) {
                $char === '\\', $char === '(', $char === ')' => '\\'.$char,
                $byte < 32 || $byte > 126 => sprintf('\\%03o', $byte),
                default => $char,
            };
        }

        return $out;
    }

    /** The text's advance in 1/1000 em of Helvetica-Bold. */
    private static function width(string $latin): float
    {
        $total = 0;

        foreach (str_split($latin) as $char) {
            $byte = ord($char);
            $total += ($byte >= 32 && $byte <= 126) ? self::ASCII_WIDTHS[$byte - 32] : (self::OTHER_WIDTHS[$byte] ?? 556);
        }

        return (float) $total;
    }

    /** Helvetica's standard encoding here is Windows-1252: „ü“, „–“ and „“ “ are in it. */
    private static function latin(string $text): string
    {
        return (string) mb_convert_encoding($text, 'Windows-1252', 'UTF-8');
    }
}
