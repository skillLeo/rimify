<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles\Import;

use App\Services\Admin\Catalogue\CatalogueFile;
use Generator;
use Illuminate\Validation\ValidationException;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use Throwable;

/**
 * A vehicle dataset read as a stream (the operator's brief of 12.11.2026, item H; D-462): a record at a time, from
 * where the last part of the work stopped, never the whole file in memory. It reads what CatalogueFile reads, the same
 * way — CSV with a semicolon, comma, tab or bar, in UTF-8, Windows-1252 or UTF-16, or an Excel workbook's first sheet —
 * and numbers the rows as a spreadsheet shows them.
 *
 * prepare() looks at the file once: its format, its encoding over all of it (one byte that is no UTF-8 makes the whole
 * file Windows-1252, as before), its delimiter from the first line. A workbook and UTF-16 text are copied once to UTF-8
 * text beside the file, since neither can be read from the middle; a workbook's copy carries each row's own number.
 *
 * The state is plain data — where the next record begins and how many came before — so a reading stopped by a time
 * limit goes on in another process.
 */
final class DatasetFile
{
    private const BLOCK = 1 << 20;

    /** The delimiters CatalogueFile chooses from, in its order: a tie goes to the first. */
    private const DELIMITERS = [';', ',', "\t", '|'];

    /**
     * @param  array{format: string, path: string, delimiter: string, escape: string, encoding: string, numbered: bool, offset: int, record: int, bytes: int}  $state
     */
    public function __construct(private array $state) {}

    /**
     * @return array{format: string, path: string, delimiter: string, escape: string, encoding: string, numbered: bool, offset: int, record: int, bytes: int}
     */
    public static function prepare(string $path): array
    {
        if (! is_file($path) || ! is_readable($path)) {
            throw self::refuse('Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.');
        }

        $head = (string) file_get_contents($path, false, null, 0, 4);

        // The format from the bytes, not the name: a workbook is a zip archive.
        if (str_starts_with($head, "PK\x03\x04")) {
            return self::workbook($path);
        }

        $read = $path;
        $start = 0;

        // Excel's „Unicode-Text“ is UTF-16 with its byte order mark: read as such, never as Windows-1252 with a NUL after
        // every letter.
        if (str_starts_with($head, "\xFF\xFE") || str_starts_with($head, "\xFE\xFF")) {
            $read = $path.'.utf8';
            self::fromUtf16($path, $read, str_starts_with($head, "\xFF\xFE"));
        } elseif (str_starts_with($head, "\xEF\xBB\xBF")) {
            $start = 3;
        }

        return [
            'format' => 'csv',
            'path' => $read,
            'delimiter' => self::delimiter($read, $start),
            'escape' => '\\',
            'encoding' => self::utf8($read, $start) ? 'UTF-8' : 'Windows-1252',
            'numbered' => false,
            'offset' => $start,
            'record' => 0,
            'bytes' => (int) filesize($read),
        ];
    }

    /**
     * The file's records from where the state stands, keyed by their line: the record's number in the file, counted
     * from one with empty lines among them, or — in a workbook's copy — the row's own number. An empty line is skipped.
     *
     * @return Generator<int, list<string>>
     */
    public function records(): Generator
    {
        $handle = fopen($this->state['path'], 'rb');

        if ($handle === false) {
            throw self::refuse('Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.');
        }

        fseek($handle, $this->state['offset']);

        try {
            while (true) {
                $cells = fgetcsv($handle, null, $this->state['delimiter'], '"', $this->state['escape']);

                if ($cells === false) {
                    if (! feof($handle)) {
                        throw self::refuse($this->state['format'] === 'xlsx'
                            ? 'Die Excel-Datei lässt sich nicht öffnen. Speichere sie bitte neu als .xlsx und lad sie noch einmal hoch.'
                            : 'Die CSV-Datei lässt sich nicht lesen. Speichere sie bitte als „CSV UTF-8“ und lad sie noch einmal hoch.');
                    }

                    return;
                }

                $this->state['offset'] = (int) ftell($handle);
                $this->state['record']++;

                if ($cells === [null]) {
                    continue;
                }

                $line = $this->state['numbered'] ? (int) array_shift($cells) : $this->state['record'];
                $cells = array_map(static fn (mixed $cell): string => (string) $cell, $cells);

                if ($this->state['encoding'] !== 'UTF-8') {
                    $cells = array_map(static fn (string $cell): string => (string) mb_convert_encoding($cell, 'UTF-8', 'Windows-1252'), $cells);
                }

                yield $line => $cells;
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * Where the next record begins: after the last one handed out.
     *
     * @return array{format: string, path: string, delimiter: string, escape: string, encoding: string, numbered: bool, offset: int, record: int, bytes: int}
     */
    public function state(): array
    {
        return $this->state;
    }

    /** @return array{format: string, path: string, delimiter: string, escape: string, encoding: string, numbered: bool, offset: int, record: int, bytes: int} */
    private static function workbook(string $path): array
    {
        $copy = $path.'.csv';
        $out = fopen($copy, 'wb');
        $reader = new XlsxReader;

        if ($out === false) {
            throw self::refuse('Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.');
        }

        try {
            $reader->open($path);

            foreach ($reader->getSheetIterator() as $sheet) {
                foreach ($sheet->getRowIterator() as $number => $row) {
                    if (fputcsv($out, [(string) $number, ...array_map(CatalogueFile::cell(...), $row->toArray())], ';', '"', '', "\n") === false) {
                        throw new \RuntimeException('The copy of the workbook could not be written.');
                    }
                }

                // The first sheet is the feed; the others are the supplier's notes.
                break;
            }
        } catch (ValidationException $refused) {
            throw $refused;
        } catch (Throwable) {
            throw self::refuse('Die Excel-Datei lässt sich nicht öffnen. Speichere sie bitte neu als .xlsx und lad sie noch einmal hoch.');
        } finally {
            $reader->close();
            fclose($out);
        }

        return ['format' => 'xlsx', 'path' => $copy, 'delimiter' => ';', 'escape' => '', 'encoding' => 'UTF-8', 'numbered' => true, 'offset' => 0, 'record' => 0, 'bytes' => (int) filesize($copy)];
    }

    /** UTF-16 text to UTF-8 text, a block at a time: a pair of surrogates is never cut between two blocks. */
    private static function fromUtf16(string $from, string $to, bool $little): void
    {
        $in = fopen($from, 'rb');
        $out = fopen($to, 'wb');

        if ($in === false || $out === false) {
            throw self::refuse('Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.');
        }

        fseek($in, 2);
        $carry = '';
        $encoding = $little ? 'UTF-16LE' : 'UTF-16BE';

        while (! feof($in)) {
            $block = $carry.(string) fread($in, self::BLOCK);
            $carry = '';

            // Whole code units only, and a high surrogate waits for its partner.
            if (strlen($block) % 2 === 1) {
                $carry = substr($block, -1);
                $block = substr($block, 0, -1);
            }

            if (strlen($block) >= 2 && ! feof($in)) {
                $unit = $little ? ord($block[-1]) : ord($block[-2]);

                if ($unit >= 0xD8 && $unit <= 0xDB) {
                    $carry = substr($block, -2).$carry;
                    $block = substr($block, 0, -2);
                }
            }

            fwrite($out, (string) mb_convert_encoding($block, 'UTF-8', $encoding));
        }

        if ($carry !== '') {
            fwrite($out, (string) mb_convert_encoding($carry, 'UTF-8', $encoding));
        }

        fclose($in);
        fclose($out);
    }

    /**
     * Whether the whole file reads as UTF-8 — checked a block at a time, each cut after a line break or before a
     * character's first byte, so no character is split between two blocks.
     */
    private static function utf8(string $path, int $start): bool
    {
        $in = fopen($path, 'rb');

        if ($in === false) {
            return true;
        }

        fseek($in, $start);
        $carry = '';

        try {
            while (! feof($in)) {
                $block = $carry.(string) fread($in, self::BLOCK);
                $cut = feof($in) ? strlen($block) : self::boundary($block);
                $carry = substr($block, $cut);

                if (! mb_check_encoding(substr($block, 0, $cut), 'UTF-8')) {
                    return false;
                }
            }

            return $carry === '' || mb_check_encoding($carry, 'UTF-8');
        } finally {
            fclose($in);
        }
    }

    /** Where a block may be cut: after its last line break, or else before the first byte of its last character. */
    private static function boundary(string $block): int
    {
        $newline = strrpos($block, "\n");

        if ($newline !== false) {
            return $newline + 1;
        }

        $at = strlen($block);

        // Back over at most three continuation bytes (10xxxxxx) to the byte that starts the character.
        for ($i = 0; $i < 4 && $at > 0; $i++) {
            $byte = ord($block[$at - 1]);
            $at--;

            if (($byte & 0xC0) !== 0x80) {
                return $byte < 0x80 ? $at + 1 : $at;
            }
        }

        return $at;
    }

    /**
     * The delimiter as CatalogueFile chose it: the candidate the file's first line holds most often — its first line
     * that is not empty, as strtok() hands it out.
     */
    private static function delimiter(string $path, int $start): string
    {
        $in = fopen($path, 'rb');
        $first = '';

        if ($in !== false) {
            fseek($in, $start);

            while (($line = fgets($in)) !== false) {
                if ($line !== "\n") {
                    $first = rtrim($line, "\n");

                    break;
                }
            }

            fclose($in);
        }

        $delimiter = ';';
        $best = -1;

        foreach (self::DELIMITERS as $candidate) {
            if (substr_count($first, $candidate) > $best) {
                $best = substr_count($first, $candidate);
                $delimiter = $candidate;
            }
        }

        return $delimiter;
    }

    private static function refuse(string $sentence): ValidationException
    {
        return ValidationException::withMessages(['file' => $sentence]);
    }
}
