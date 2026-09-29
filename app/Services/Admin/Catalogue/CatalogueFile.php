<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use DateTimeInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use League\Csv\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use Throwable;

/**
 * A supplier feed as rows of text, whatever it arrived as: CSV (semicolon or comma, UTF-8 or the
 * Windows encoding German Excel still writes) or an Excel workbook's first sheet. Its first row names
 * the columns. Numbers from a workbook come as the German text a person would type (`8,5`), so the
 * importer reads every source the same way.
 *
 * A file it cannot read is refused with a sentence, never half read.
 */
final class CatalogueFile
{
    /**
     * @return array{name: string, format: string, sha256: string, headers: list<string>, rows: list<array<string, string>>}
     */
    public static function read(UploadedFile $file): array
    {
        $path = (string) $file->getRealPath();
        $name = $file->getClientOriginalName();

        if ($path === '' || ! is_file($path)) {
            throw self::refuse('Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.');
        }

        if ((int) $file->getSize() > CatalogueImporter::MAX_BYTES) {
            throw self::refuse('Die Datei ist größer als 5 MB. Teil sie bitte auf.');
        }

        $bytes = (string) file_get_contents($path);
        // The format from the bytes, not the name: a workbook is a zip archive.
        $format = str_starts_with($bytes, "PK\x03\x04") ? 'xlsx' : 'csv';

        [$headers, $rows] = $format === 'xlsx' ? self::xlsx($path) : self::csv($bytes);

        $headers = array_map(static fn (mixed $h): string => trim((string) $h), $headers);

        if ($headers === [] || array_filter($headers) === []) {
            throw self::refuse('Die erste Zeile der Datei enthält keine Spaltennamen.');
        }

        if (count(array_unique(array_filter($headers))) !== count(array_filter($headers))) {
            throw self::refuse('Zwei Spalten heißen gleich. Gib jeder Spalte in der ersten Zeile einen eigenen Namen.');
        }

        if ($rows === []) {
            throw self::refuse('Unter der ersten Zeile steht nichts. Die Datei enthält keine Felgen.');
        }

        if (count($rows) > CatalogueImporter::MAX_ROWS) {
            throw self::refuse('Die Datei hat mehr als '.number_format(CatalogueImporter::MAX_ROWS, 0, ',', '.').' Zeilen. Teil sie bitte auf.');
        }

        $keyed = [];

        foreach ($rows as $line => $cells) {
            $row = [];

            foreach ($headers as $i => $header) {
                if ($header !== '') {
                    $row[$header] = trim((string) ($cells[$i] ?? ''));
                }
            }

            // A line with nothing in it is the end of a spreadsheet, not a wheel.
            if (implode('', $row) !== '') {
                $keyed[] = $row + ['_line' => (string) $line];
            }
        }

        return ['name' => $name, 'format' => $format, 'sha256' => hash('sha256', $bytes), 'headers' => array_values(array_filter($headers)), 'rows' => $keyed];
    }

    /** @return array{0: list<mixed>, 1: list<list<mixed>>} */
    private static function csv(string $bytes): array
    {
        $bytes = (string) preg_replace('/^\xEF\xBB\xBF/', '', $bytes);

        if (! mb_check_encoding($bytes, 'UTF-8')) {
            $bytes = (string) mb_convert_encoding($bytes, 'UTF-8', 'Windows-1252');
        }

        $first = strtok($bytes, "\n") ?: '';
        $delimiter = ';';
        $best = -1;

        foreach ([';', ',', "\t", '|'] as $candidate) {
            if (substr_count($first, $candidate) > $best) {
                $best = substr_count($first, $candidate);
                $delimiter = $candidate;
            }
        }

        try {
            $reader = CsvReader::createFromString($bytes);
            $reader->setDelimiter($delimiter);
            $lines = [];

            // Keyed by the file's own line number (the reader's offset counts from 0), so a row named in
            // the Probelauf is the line a spreadsheet shows, blank lines or not.
            foreach ($reader->getRecords() as $offset => $record) {
                $lines[(int) $offset + 1] = array_values($record);
            }
        } catch (Throwable) {
            throw self::refuse('Die CSV-Datei lässt sich nicht lesen. Speichere sie bitte als „CSV UTF-8“ und lad sie noch einmal hoch.');
        }

        // Not array_shift: that numbers the rows anew, and their keys are the file's line numbers.
        $first = array_key_first($lines);
        $headers = $first === null ? [] : $lines[$first];

        if ($first !== null) {
            unset($lines[$first]);
        }

        return [$headers, $lines];
    }

    /** @return array{0: list<mixed>, 1: list<list<mixed>>} */
    private static function xlsx(string $path): array
    {
        $reader = new XlsxReader;
        $lines = [];

        try {
            $reader->open($path);

            foreach ($reader->getSheetIterator() as $sheet) {
                foreach ($sheet->getRowIterator() as $number => $row) {
                    $lines[(int) $number] = array_map(self::cell(...), $row->toArray());

                    if (count($lines) > CatalogueImporter::MAX_ROWS + 1) {
                        break;
                    }
                }

                // The first sheet is the feed; the others are the supplier's notes.
                break;
            }
        } catch (Throwable) {
            throw self::refuse('Die Excel-Datei lässt sich nicht öffnen. Speichere sie bitte neu als .xlsx und lad sie noch einmal hoch.');
        } finally {
            $reader->close();
        }

        // Not array_shift: that numbers the rows anew, and their keys are the file's line numbers.
        $first = array_key_first($lines);
        $headers = $first === null ? [] : $lines[$first];

        if ($first !== null) {
            unset($lines[$first]);
        }

        return [$headers, $lines];
    }

    /** A workbook's number as the German text a person would type: `8,5`, never `8.5`. */
    private static function cell(mixed $value): string
    {
        return match (true) {
            is_float($value) => rtrim(rtrim(number_format($value, 4, ',', ''), '0'), ','),
            is_int($value) => (string) $value,
            is_bool($value) => $value ? '1' : '0',
            $value instanceof DateTimeInterface => $value->format('d.m.Y'),
            default => trim((string) $value),
        };
    }

    private static function refuse(string $sentence): ValidationException
    {
        return ValidationException::withMessages(['file' => $sentence]);
    }
}
