<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles\Import;

use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\VehicleImport;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use ZipArchive;

/**
 * A vehicle file of any size, brought to the server in parts (the operator's brief of 12.11.2026, item H; D-462): no
 * single request carries more than the host takes — upload_max_filesize and post_max_size decide the size of a part,
 * never of the file —, and a part that went missing is asked for again from where the file stands.
 *
 * The parts are written one after another into the run's own file on the private disk, each under the run's lock, at
 * the place it says it belongs; a part that arrives out of turn is answered with the bytes the server holds
 * (PartOutOfTurn), and the browser goes on from there.
 */
final class ImportUpload
{
    private const MAX_PART = 4 * 1024 * 1024;

    private const MIN_PART = 64 * 1024;

    /** The run's file's folder on the private disk (config rimify.vehicle_import.directory). */
    public static function directory(): string
    {
        return (string) config('rimify.vehicle_import.directory', 'vehicle-imports');
    }

    /** The size of a part: half of what the host takes in one request, at most 4 MB — or what the configuration fixes. */
    public static function partBytes(): int
    {
        $fixed = (int) config('rimify.vehicle_import.part_bytes', 0);

        if ($fixed > 0) {
            return $fixed;
        }

        $limit = min(self::iniBytes((string) ini_get('upload_max_filesize')), self::iniBytes((string) ini_get('post_max_size')));

        return max(self::MIN_PART, min(self::MAX_PART, intdiv($limit, 2)));
    }

    /** A php.ini size — `1536M`, `2G`, `512K`, `0` for none — in bytes. */
    public static function iniBytes(string $value): int
    {
        $value = trim($value);

        if (preg_match('/^(\d+)\s*([KMG]?)/i', $value, $m) !== 1 || (int) $m[1] <= 0) {
            return PHP_INT_MAX;
        }

        return (int) $m[1] * match (strtoupper($m[2])) {
            'G' => 1024 ** 3,
            'M' => 1024 ** 2,
            'K' => 1024,
            default => 1,
        };
    }

    public function start(AdminUser $admin, string $name, int $bytes, VehicleSource $source): VehicleImport
    {
        $import = VehicleImport::query()->create([
            'admin_user_id' => $admin->id,
            'file_name' => mb_substr(trim($name) === '' ? 'fahrzeuge.csv' : trim($name), 0, 200),
            'source' => $source->value,
            'status' => VehicleImport::UPLOADING,
            'bytes_total' => $bytes,
            'bytes_done' => 0,
        ]);

        $path = self::directory().'/'.$import->id.'.upload';

        if (! Storage::disk('local')->put($path, '')) {
            throw self::refuse('Auf dem Server lässt sich die Datei gerade nicht ablegen. Versuch es bitte später noch einmal.');
        }

        $import->forceFill(['stored_as' => $path])->save();

        return $import;
    }

    /**
     * One part, written where it says it belongs.
     *
     * @return int the bytes the server holds now
     *
     * @throws PartOutOfTurn when the part does not start where the file ends
     */
    public function append(VehicleImport $import, int $offset, UploadedFile $part): int
    {
        return DB::transaction(function () use ($import, $offset, $part): int {
            $import = VehicleImport::query()->lockForUpdate()->findOrFail($import->id);

            if ($import->status !== VehicleImport::UPLOADING) {
                throw self::refuse('Der Server nimmt für diese Datei keine Teile mehr an. Lad die Datei bitte noch einmal hoch.');
            }

            if ($offset !== $import->bytes_done) {
                throw new PartOutOfTurn($import->bytes_done);
            }

            $size = (int) $part->getSize();

            if ($size <= 0 || $import->bytes_done + $size > (int) $import->bytes_total) {
                throw self::refuse('Es ist mehr angekommen, als die Datei groß ist. Lad sie bitte noch einmal hoch.');
            }

            $target = Storage::disk('local')->path((string) $import->stored_as);
            $from = fopen((string) $part->getRealPath(), 'rb');
            $to = fopen($target, 'c+b');

            if ($from === false || $to === false) {
                throw self::refuse('Ein Teil der Datei ist nicht angekommen. Lad die Datei bitte noch einmal hoch.');
            }

            try {
                // Whatever an earlier attempt left past the bytes counted goes: the file is what was counted, and this part.
                ftruncate($to, $offset);
                fseek($to, $offset);
                $written = stream_copy_to_stream($from, $to);
                fflush($to);
            } finally {
                fclose($from);
                fclose($to);
            }

            if ($written !== $size) {
                throw self::refuse('Auf dem Server ist nicht genug Platz für die Datei.');
            }

            $import->forceFill(['bytes_done' => $import->bytes_done + $size])->save();

            return $import->bytes_done;
        });
    }

    /** The whole file is there: it is checked against its announced size and handed to the Probelauf. */
    public function finish(VehicleImport $import): VehicleImport
    {
        $refused = null;

        $finished = DB::transaction(function () use ($import, &$refused): VehicleImport {
            $import = VehicleImport::query()->lockForUpdate()->findOrFail($import->id);

            if ($import->status !== VehicleImport::UPLOADING) {
                return $import;
            }

            $path = Storage::disk('local')->path((string) $import->stored_as);
            clearstatcache(true, $path);

            if ($import->bytes_done !== (int) $import->bytes_total || ! is_file($path) || filesize($path) !== (int) $import->bytes_total) {
                throw self::refuse('Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.');
            }

            try {
                $format = self::format($path);

                // A zip that is no workbook is a folder of files, as the dataset comes: the one table in it is taken out and
                // read in its place (D-478) — the CSV first, else the workbook.
                if ($format === 'zip') {
                    [$path, $format] = self::unpack($path, (string) $import->stored_as);
                    $import->bytes_total = (int) filesize($path);
                }
            } catch (ValidationException $notTable) {
                // A file that is no table goes no further: the run says why and its file goes (D-498). Before, it stood
                // „uploading“ for a day, until the sweep closed it with a sentence that was not its own. A file not yet
                // complete (above) stays open: its missing parts may still come.
                $refused = $notTable;
                $reason = collect($notTable->errors())->flatten()->first();
                self::forget($import);
                $import->forceFill(['status' => VehicleImport::FAILED, 'error' => is_string($reason) ? $reason : 'Die Datei lässt sich nicht lesen.', 'stored_as' => null])->save();

                return $import;
            }

            $import->forceFill([
                'file_sha256' => (string) hash_file('sha256', $path),
                'file_format' => $format,
                'status' => VehicleImport::READING,
                'cursor' => null,
                'error' => null,
            ])->save();

            return $import;
        });

        if ($refused !== null) {
            throw $refused;
        }

        return $finished;
    }

    /**
     * The file's format from its bytes, not its name: a workbook is a zip archive, so a zip is a workbook only when it holds
     * one. A SQL dump is refused in words — the page would otherwise read its statements as a table.
     *
     * @return 'csv'|'xlsx'|'zip'
     */
    private static function format(string $path): string
    {
        $head = (string) file_get_contents($path, false, null, 0, 4096);

        if (str_starts_with($head, "PK\x03\x04")) {
            $zip = new ZipArchive;

            if ($zip->open($path) !== true) {
                throw self::refuse('Die Datei lässt sich nicht öffnen. Sie ist beschädigt oder kein Archiv. Lad bitte die CSV- oder die Excel-Datei hoch.');
            }

            $workbook = $zip->locateName('[Content_Types].xml') !== false;
            $zip->close();

            return $workbook ? 'xlsx' : 'zip';
        }

        // A picture, a PDF or any other binary file is no table (D-498): before, it was read as one line of CSV. UTF-16 text
        // has NUL bytes too, and comes with its byte order mark (DatasetFile).
        $utf16 = str_starts_with($head, "\xFF\xFE") || str_starts_with($head, "\xFE\xFF");

        if (preg_match('/^(?:\x89PNG|GIF8|%PDF|\xFF\xD8\xFF)/', $head) === 1 || (! $utf16 && str_contains($head, "\0"))) {
            throw self::refuse('Das ist keine Tabelle, sondern ein Bild oder eine andere Datei, die sich nicht als Text lesen lässt. Lad bitte die Fahrzeugliste als CSV- oder Excel-Datei hoch (.csv, .xlsx) oder das ZIP-Archiv des Datensatzes.');
        }

        if (preg_match('/^(?:\xEF\xBB\xBF)?\s*(?:--|\/\*!|CREATE\s+TABLE|INSERT\s+INTO|DROP\s+TABLE|SET\s+(?:NAMES|SQL_MODE))/i', $head) === 1) {
            throw self::refuse('Das ist eine SQL-Datei. SQL-Dateien lesen wir nicht. Nimm die Tabelle als CSV- oder Excel-Datei (.csv, .xlsx) – im Datensatz liegt sie im Ordner „CSV“ oder „XLSX“.');
        }

        return 'csv';
    }

    /**
     * The table out of a zip: the one CSV in it, else the one workbook; written beside the zip, which goes. A zip with none
     * — or with several to choose from — says which files it holds.
     *
     * @return array{0: string, 1: 'csv'|'xlsx'}
     */
    private static function unpack(string $path, string $storedAs): array
    {
        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            throw self::refuse('Das Archiv lässt sich nicht öffnen. Lad bitte die CSV- oder die Excel-Datei hoch.');
        }

        $found = ['csv' => [], 'xlsx' => [], 'sql' => []];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = (string) $zip->getNameIndex($i);
            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

            if (str_ends_with($name, '/') || str_contains($name, '__MACOSX/') || str_starts_with(basename($name), '.') || ! isset($found[$ext])) {
                continue;
            }

            $found[$ext][] = $name;
        }

        $kind = $found['csv'] !== [] ? 'csv' : ($found['xlsx'] !== [] ? 'xlsx' : null);

        if ($kind === null) {
            $zip->close();

            throw self::refuse($found['sql'] !== []
                ? 'In diesem Archiv liegt nur eine SQL-Datei. SQL-Dateien lesen wir nicht. Nimm die CSV- oder die Excel-Datei aus dem Datensatz.'
                : 'In diesem Archiv liegt keine CSV- und keine Excel-Datei. Lad bitte die Tabelle selbst hoch (.csv oder .xlsx).');
        }

        if (count($found[$kind]) > 1) {
            $zip->close();

            throw self::refuse('In diesem Archiv liegen mehrere Tabellen ('.implode(', ', array_map('basename', $found[$kind])).'). Entpack es und lad die eine hoch, die du importieren willst.');
        }

        $out = $path.'.unzipped';
        $in = $zip->getStream($found[$kind][0]);
        $to = fopen($out, 'wb');

        if ($in === false || $to === false || stream_copy_to_stream($in, $to) === false) {
            $zip->close();

            throw self::refuse('Die Datei „'.basename($found[$kind][0]).'“ lässt sich aus dem Archiv nicht lesen. Entpack es und lad sie selbst hoch.');
        }

        fclose($in);
        fclose($to);
        $zip->close();
        Storage::disk('local')->delete($storedAs);

        // The next steps read the file under the name the run keeps; the unpacked table takes the zip's place.
        rename($out, $path);

        return [$path, $kind];
    }

    /** The run's file and the copies made of it to read from. */
    public static function forget(VehicleImport $import): void
    {
        if ($import->stored_as === null) {
            return;
        }

        Storage::disk('local')->delete([$import->stored_as, $import->stored_as.'.utf8', $import->stored_as.'.csv']);
    }

    private static function refuse(string $sentence): ValidationException
    {
        return ValidationException::withMessages(['file' => $sentence]);
    }
}
