<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Support\Money;
use Closure;
use ErrorException;
use Illuminate\Support\Facades\File;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Cell\StringCell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Options;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A list as a file, CSV or XLSX, for every admin list that exports (BRIEF-2 §2.9).
 *
 * CSV is what a German spreadsheet opens as it is: UTF-8 with a byte-order mark, semicolons, one
 * header row. XLSX keeps numbers as numbers: an amount (a Money) is a figure Excel can sum, shown with
 * two decimals and the euro sign in the reader's own locale; text stays text.
 *
 * Nothing a customer typed becomes a formula: in the CSV a cell a spreadsheet would run (`=`, `+`,
 * `-`, `@`, tab, return) gets a leading apostrophe, and in the XLSX every text value is written as a
 * string cell, never through the library's guess, which turns `=…` into a formula.
 *
 * Rows arrive as an iterable, so a large export streams instead of being held in memory.
 */
final class ListExport
{
    public const FORMATS = ['csv', 'xlsx'];

    /**
     * @param  list<string>  $header
     * @param  iterable<list<string|int|float|Money|null>>  $rows
     */
    public static function download(string $basename, string $format, array $header, iterable $rows): StreamedResponse
    {
        return $format === 'xlsx'
            ? self::xlsx($basename.'.xlsx', $header, $rows)
            : self::csv($basename.'.csv', $header, $rows);
    }

    /**
     * @param  list<string>  $header
     * @param  iterable<list<string|int|float|Money|null>>  $rows
     */
    private static function csv(string $filename, array $header, iterable $rows): StreamedResponse
    {
        return response()->streamDownload(static function () use ($header, $rows): void {
            $out = fopen('php://output', 'wb');

            if ($out === false) {
                return;
            }

            fwrite($out, "\u{FEFF}");
            fputcsv($out, array_map(self::defuse(...), $header), ';', '"', '');

            foreach ($rows as $row) {
                fputcsv($out, array_map(static fn (string|int|float|Money|null $cell): string => self::defuse(self::csvCell($cell)), $row), ';', '"', '');
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * @param  list<string>  $header
     * @param  iterable<list<string|int|float|Money|null>>  $rows
     */
    private static function xlsx(string $filename, array $header, iterable $rows): StreamedResponse
    {
        return response()->streamDownload(static function () use ($header, $rows): void {
            $temp = self::tempFolder();
            $writer = new Writer(new Options(tempFolder: $temp));
            $writer->openToFile('php://output');

            $bold = (new Style)->withFontBold(true);
            // Format codes are locale-free: Excel shows this as 1.425,50 € on a German machine.
            $money = (new Style)->withFormat('#,##0.00 "€"');
            $writer->addRow(new Row(array_map(static fn (string $h): Cell => new StringCell($h, $bold), $header)));

            foreach ($rows as $row) {
                $writer->addRow(new Row(array_map(static fn (string|int|float|Money|null $value): Cell => match (true) {
                    is_string($value) => new StringCell($value, null),
                    // A spreadsheet's numbers are binary floats: the amount becomes one here, at the
                    // file's edge, from its exact decimal digits — never by dividing cents.
                    $value instanceof Money => Cell::fromValue((float) $value->toDecimal(), $money),
                    default => Cell::fromValue($value, is_float($value) ? $money : null),
                }, $row)));
            }

            self::closeWriter($writer->close(...), $temp);
        }, $filename, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    /**
     * Where the XLSX writer keeps its working files: a folder of our own, so what it could not remove can be swept —
     * an hour on, at the next export.
     */
    private static function tempFolder(): string
    {
        $dir = storage_path('framework/cache/xlsx');
        File::ensureDirectoryExists($dir);

        foreach (File::directories($dir) as $folder) {
            if ((int) filemtime($folder) < time() - 3600) {
                File::deleteDirectory($folder);
            }
        }

        return $dir;
    }

    /**
     * Closes the writer. It copies the finished file to the output first and only then removes its working folder,
     * so a folder Windows will not let go of yet — a scanner holding one of its files for a moment (BestellungenTest,
     * one run in twenty under load, 05.10.2026) — is left to the sweep rather than turned into a failed download.
     * Only that is let go: an `rmdir` or `unlink` inside our own temp folder; anything else is still an error.
     *
     * @param  Closure(): void  $close
     */
    public static function closeWriter(Closure $close, string $tempFolder): void
    {
        try {
            $close();
        } catch (ErrorException $e) {
            $message = $e->getMessage();
            $cleanup = (str_starts_with($message, 'rmdir(') || str_starts_with($message, 'unlink('))
                && str_contains(str_replace('\\', '/', $message), str_replace('\\', '/', $tempFolder));

            if (! $cleanup) {
                throw $e;
            }
        }
    }

    /**
     * A number in a CSV is written the German way, so the spreadsheet reads `1425,5` as a number; an
     * amount of money keeps both its cents, `1425,50`, from its integer digits.
     */
    private static function csvCell(string|int|float|Money|null $value): string
    {
        return match (true) {
            $value === null => '',
            $value instanceof Money => str_replace('.', ',', $value->toDecimal()),
            is_float($value) => str_replace('.', ',', rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.')),
            default => (string) $value,
        };
    }

    /**
     * A cell a spreadsheet would run as a formula is kept as text. A plain signed number (`-5`, `+12,5`)
     * runs nothing and stays as it is: an ET of −5 mm must come back as the file had it (K2-19).
     */
    public static function defuse(string $cell): string
    {
        if ($cell === '' || ! in_array($cell[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return $cell;
        }

        return preg_match('/^[+-]\d+(?:[.,]\d+)?$/', $cell) === 1 ? $cell : "'".$cell;
    }
}
