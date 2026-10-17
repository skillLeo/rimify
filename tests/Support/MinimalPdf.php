<?php

declare(strict_types=1);

namespace Tests\Support;

/**
 * A small, valid PDF built in place — catalogue, page tree, one line of text per page, a classic cross-reference table —
 * for tests that need a file a PDF reader opens: the example stamp (ExamplePdf) and the acceptance set, whose real
 * Gutachten stay out of the repository. A page may carry an annotation, as the Nachtrag's margin mark is one, and turn.
 */
final class MinimalPdf
{
    /**
     * @param  list<string>  $pages  one line of text per page
     */
    public static function make(array $pages = ['Seite 1'], bool $annotated = false, int $rotate = 0): string
    {
        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            3 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $kids = [];
        $next = 4;

        foreach ($pages as $text) {
            $page = $next++;
            $content = $next++;
            $annotation = $annotated ? $next++ : null;
            $stream = 'BT /F1 12 Tf 72 720 Td ('.addcslashes($text, '()\\').') Tj ET';

            $objects[$content] = '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream";
            $objects[$page] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]'.($rotate !== 0 ? " /Rotate {$rotate}" : '')
                .' /Resources << /Font << /F1 3 0 R >> >> /Contents '.$content.' 0 R'
                .($annotation !== null ? " /Annots [{$annotation} 0 R]" : '').' >>';

            if ($annotation !== null) {
                $objects[$annotation] = '<< /Type /Annot /Subtype /Text /Rect [10 400 20 460] /Contents (Rand) >>';
            }

            $kids[] = "{$page} 0 R";
        }

        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', $kids).'] /Count '.count($kids).' >>';
        ksort($objects);

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $number => $body) {
            $offsets[$number] = strlen($pdf);
            $pdf .= "{$number} 0 obj\n{$body}\nendobj\n";
        }

        $xref = strlen($pdf);
        $size = max(array_keys($objects)) + 1;
        $pdf .= "xref\n0 {$size}\n0000000000 65535 f \n";

        for ($i = 1; $i < $size; $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }

        return $pdf."trailer\n<< /Size {$size} /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF\n";
    }
}
