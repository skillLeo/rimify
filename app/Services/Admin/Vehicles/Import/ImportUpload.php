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
    public const DIRECTORY = 'vehicle-imports';

    private const MAX_PART = 4 * 1024 * 1024;

    private const MIN_PART = 64 * 1024;

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

        $path = self::DIRECTORY.'/'.$import->id.'.upload';

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
        return DB::transaction(function () use ($import): VehicleImport {
            $import = VehicleImport::query()->lockForUpdate()->findOrFail($import->id);

            if ($import->status !== VehicleImport::UPLOADING) {
                return $import;
            }

            $path = Storage::disk('local')->path((string) $import->stored_as);
            clearstatcache(true, $path);

            if ($import->bytes_done !== (int) $import->bytes_total || ! is_file($path) || filesize($path) !== (int) $import->bytes_total) {
                throw self::refuse('Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.');
            }

            $head = (string) file_get_contents($path, false, null, 0, 4);

            $import->forceFill([
                'file_sha256' => (string) hash_file('sha256', $path),
                // The format from the bytes, not the name: a workbook is a zip archive.
                'file_format' => str_starts_with($head, "PK\x03\x04") ? 'xlsx' : 'csv',
                'status' => VehicleImport::READING,
                'cursor' => null,
                'error' => null,
            ])->save();

            return $import;
        });
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
