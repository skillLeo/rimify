<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles\Import;

use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\VehicleImport;
use App\Models\VehicleImportRow;
use App\Services\Admin\Vehicles\VehicleImporter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * The server's own work on a vehicle file (the operator's brief of 12.11.2026, item H; D-462): reading it, checking it
 * against the cars, importing it — a part at a time, after the response of the request that asked how far it is, or
 * from the scheduler where the host runs one (`fahrzeuge:import-weiter`). No request waits for a whole file.
 *
 * One process works on a run at a time (a lock in the cache). Reading and checking stop after their part and go on from
 * where they stopped; the import itself runs to its end in one transaction, since half an import is no import: stopped
 * by anything, it writes nothing, and the next part starts it again.
 */
final class VehicleImportWork
{
    /** One part of the work: short enough for any host's limits, long enough to get on. */
    public const SLICE_SECONDS = 20.0;

    /** A process at work beats after every batch; one silent this long has stopped, and its run is taken over. */
    public const SILENT_SECONDS = 120;

    /** How often a run may stop on something unforeseen before it is given up. */
    private const ATTEMPTS = 3;

    public function __construct(private readonly VehicleImporter $importer) {}

    /** Works on the run for at most `$seconds` — the import itself always to its end —, unless another process does. */
    public function advance(int $id, float $seconds = self::SLICE_SECONDS): void
    {
        $import = VehicleImport::query()->find($id);

        if ($import === null || ! $import->working()) {
            return;
        }

        $lock = Cache::lock('vehicle-import:'.$id, $import->status === VehicleImport::APPLYING ? 3600 : 900);

        if (! $lock->get()) {
            // Held — by a process at work, or by one a time limit or a restart stopped, which never lets go: its heartbeat
            // says which. A silent one is taken over.
            $beat = Cache::store(self::progressStore())->get(self::beatKey($id));

            if (is_int($beat) && $beat >= time() - self::SILENT_SECONDS) {
                return;
            }

            $lock->forceRelease();

            if (! $lock->get()) {
                return;
            }
        }

        try {
            self::beat($id);
            self::keepRunning($import->status === VehicleImport::APPLYING ? 1800 : 600);
            $deadline = microtime(true) + $seconds;

            do {
                $import->refresh();
                $more = match ($import->status) {
                    VehicleImport::READING => $this->read($import, $deadline),
                    VehicleImport::CHECKING => $this->check($import, $deadline),
                    VehicleImport::APPLYING => $this->apply($import),
                    default => false,
                };
            } while ($more && microtime(true) < $deadline);
        } finally {
            $lock->release();
            Cache::store(self::progressStore())->forget(self::beatKey($id));
        }
    }

    /** Alive: written after every batch, read by a process that finds the run's lock held. */
    public static function beat(int $id): void
    {
        Cache::store(self::progressStore())->put(self::beatKey($id), time(), 3600);
    }

    /**
     * How far a run is, as the page shows it while the server works.
     *
     * @return array{step: string, done: int, total: int, unit: string}|null
     */
    public static function progress(VehicleImport $import): ?array
    {
        $kept = Cache::store(self::progressStore())->get(self::progressKey($import->id));

        return match ($import->status) {
            VehicleImport::READING => self::reading($import),
            VehicleImport::CHECKING => is_array($import->cursor['step'] ?? null)
                ? ['step' => (string) $import->cursor['step']['step'], 'done' => (int) $import->cursor['step']['done'], 'total' => (int) $import->cursor['step']['total'], 'unit' => 'rows']
                : ['step' => VehicleImporter::STEP_CARS, 'done' => 0, 'total' => (int) ($import->cursor['eligible'] ?? $import->rows_total ?? 0), 'unit' => 'rows'],
            VehicleImport::APPLYING => is_array($kept) ? [...$kept, 'unit' => 'rows'] : ['step' => 'Probelauf noch einmal prüfen', 'done' => 0, 'total' => 0, 'unit' => 'rows'],
            default => null,
        };
    }

    /** @return array{step: string, done: int, total: int, unit: string} */
    private static function reading(VehicleImport $import): array
    {
        $file = $import->cursor['file'] ?? null;

        return is_array($file)
            ? ['step' => 'Datei lesen', 'done' => (int) $file['offset'], 'total' => max(1, (int) $file['bytes']), 'unit' => 'bytes']
            : ['step' => 'Datei lesen', 'done' => 0, 'total' => max(1, (int) $import->bytes_total), 'unit' => 'bytes'];
    }

    /**
     * Reads the file from where the last part stopped: each row as the contract names it, what it is by itself
     * (VehicleImporter::readRow), counted for the gaps and checks (ImportTally), stored a batch at a time together with
     * where the reading stands. The first row names the columns; a new mapping starts a new reading.
     */
    private function read(VehicleImport $import, float $deadline): bool
    {
        try {
            $cursor = $import->cursor ?? [];

            if (! isset($cursor['file'])) {
                // A new reading — a new mapping —: the rows of the last one go first, a part at a time.
                while ($import->lines()->limit(5000)->delete() > 0) {
                    if (microtime(true) >= $deadline) {
                        return false;
                    }
                }

                $cursor = [
                    'file' => DatasetFile::prepare(Storage::disk('local')->path((string) $import->stored_as)),
                    'tally' => ImportTally::start()->state(),
                    'examples' => [],
                    'headers' => null,
                    'mapping' => null,
                    'index' => 0,
                    'eligible' => 0,
                ];
                $import->forceFill(['cursor' => $cursor, 'rows_done' => 0, 'rows_total' => null, 'error' => null])->save();
            }

            $reader = new DatasetFile($cursor['file']);
            $tally = ImportTally::from($cursor['tally']);
            $source = VehicleSource::from($import->source);
            $headers = $cursor['headers'];
            $mapping = $cursor['mapping'];
            $examples = (array) $cursor['examples'];
            $index = (int) $cursor['index'];
            $eligible = (int) ($cursor['eligible'] ?? 0);
            $batch = [];
            $ended = true;

            foreach ($reader->records() as $line => $cells) {
                if ($headers === null) {
                    $headers = self::headers($cells);
                    $named = array_values(array_filter($headers));
                    $mapping = array_filter(
                        // A mapping the person chose stands, even an empty one; a first reading guesses it.
                        is_array($import->mapping) ? $import->mapping : VehicleImporter::guessMapping($named, VehicleImport::savedMapping($source)),
                        static fn (string $header): bool => in_array($header, $named, true),
                    );

                    continue;
                }

                $raw = [];

                foreach ($headers as $i => $header) {
                    if ($header !== '') {
                        $raw[$header] = trim((string) ($cells[$i] ?? ''));
                    }
                }

                // A line with nothing in it is the end of a spreadsheet, not a car.
                if (implode('', $raw) === '') {
                    continue;
                }

                // What each column holds, from the first row that has a value: a column is chosen by what it says.
                foreach ($raw as $header => $value) {
                    if ($value !== '' && ! isset($examples[$header])) {
                        $examples[$header] = mb_substr($value, 0, 40);
                    }
                }

                $row = VehicleImporter::mapped($raw, $mapping, $line);
                $decided = VehicleImporter::readRow($row, $source);
                $tally->add($row, $index++, $decided['car']);
                $batch[] = [...$decided, 'line' => $line, 'row' => $row];

                if (count($batch) >= VehicleImporter::BATCH) {
                    $eligible += $this->store($import, $batch, ['file' => $reader->state(), 'tally' => $tally->state(), 'examples' => $examples, 'headers' => $headers, 'mapping' => $mapping, 'index' => $index, 'eligible' => $eligible]);
                    $batch = [];
                    self::beat($import->id);

                    if (microtime(true) >= $deadline) {
                        $ended = false;

                        break;
                    }
                }
            }

            $cursor = ['file' => $reader->state(), 'tally' => $tally->state(), 'examples' => $examples, 'headers' => $headers, 'mapping' => $mapping, 'index' => $index, 'eligible' => $eligible];
            $eligible += $this->store($import, $batch, $cursor);

            if (! $ended) {
                return false;
            }

            if ($headers === null) {
                throw ValidationException::withMessages(['file' => 'Die erste Zeile der Datei enthält keine Spaltennamen.']);
            }

            $named = array_values(array_filter($headers));

            if ($tally->rows() === 0) {
                throw ValidationException::withMessages(['file' => 'Unter der ersten Zeile steht nichts. Die Datei enthält keine Fahrzeuge.']);
            }

            $mapping = (array) $mapping;
            $complete = VehicleImporter::missing($mapping, $named) === [];

            $import->forceFill([
                'file' => ['headers' => $named],
                'mapping' => $mapping,
                'examples' => $examples,
                'checks' => $tally->checks($mapping, $named),
                'rows_total' => $tally->rows(),
                'rows_done' => $tally->rows(),
                // Without a column for every required field there is nothing to check: the page asks for the mapping.
                'summary' => [],
                'plan_hash' => null,
                'status' => $complete ? VehicleImport::CHECKING : VehicleImport::PREVIEWED,
                'cursor' => ['gaps' => $tally->gaps(), 'eligible' => $eligible, 'count' => (new CheckCount($eligible))->state()],
            ])->save();

            return $complete;
        } catch (ValidationException $refused) {
            $this->fail($import, (string) collect($refused->errors())->flatten()->first());

            return false;
        } catch (Throwable $error) {
            return $this->stumbled($import, $error, 'Die Datei ließ sich nicht zu Ende lesen.');
        }
    }

    /**
     * The first row: the names of the columns, each named once.
     *
     * @param  list<string>  $cells
     * @return list<string>
     */
    private static function headers(array $cells): array
    {
        $headers = array_map(static fn (string $h): string => trim($h), $cells);
        $named = array_values(array_filter($headers));

        if ($named === []) {
            throw ValidationException::withMessages(['file' => 'Die erste Zeile der Datei enthält keine Spaltennamen.']);
        }

        if (count(array_unique($named)) !== count($named)) {
            throw ValidationException::withMessages(['file' => 'Zwei Spalten heißen gleich. Gib jeder Spalte in der ersten Zeile einen eigenen Namen.']);
        }

        return $headers;
    }

    /**
     * A batch of rows and where the reading stands, together: a reading stopped between two batches goes on after the
     * last one stored, never twice over a row.
     *
     * @param  list<array<string, mixed>>  $batch
     * @param  array<string, mixed>  $cursor  where the reading stands after the batch; its `eligible` counts the rows before it
     * @return int the batch's rows that go on to the check against the cars
     */
    private function store(VehicleImport $import, array $batch, array $cursor): int
    {
        return DB::transaction(function () use ($import, $batch, $cursor): int {
            $eligible = 0;

            if ($batch !== []) {
                $rows = [];

                foreach (VehicleImporter::refuseDuplicates($import, $batch) as $row) {
                    $refused = $row['status'] === VehicleImporter::REFUSED;
                    $eligible += $refused ? 0 : 1;
                    $rows[] = [
                        'vehicle_import_id' => $import->id,
                        'line' => (int) $row['line'],
                        'cells' => json_encode(VehicleImportRow::cellsOf($row['row'])),
                        'status' => $row['status'],
                        'read_refused' => $refused,
                        'label' => $row['label'],
                        'keys' => $row['keys'],
                        'notes' => $row['notes'] === [] ? null : json_encode($row['notes']),
                        'reason' => $row['reason'],
                        'dup_key' => $row['dup_key'],
                        'number' => $row['number'],
                    ];
                }

                DB::table('vehicle_import_rows')->insert($rows);
            }

            $cursor['eligible'] = (int) ($cursor['eligible'] ?? 0) + $eligible;
            $import->forceFill(['cursor' => $cursor, 'rows_done' => (int) $cursor['index'], 'attempts' => 0])->save();

            return $eligible;
        });
    }

    /** The Probelauf against the cars, a batch at a time, until every row is decided — then its counts and fingerprint. */
    private function check(VehicleImport $import, float $deadline): bool
    {
        try {
            $cursor = (array) $import->cursor;
            $count = new CheckCount((int) ($cursor['eligible'] ?? 0), (array) ($cursor['count'] ?? []) + ['cars' => 0, 'open' => 0, 'gutachten' => 0]);

            // At least one batch, however little time is left: a part of the work always moves the run on.
            do {
                $step = $this->importer->checkStep($import);

                if ($step === false) {
                    $finished = $this->importer->finish($import, (array) ($cursor['gaps'] ?? []));
                    $import->forceFill(['status' => VehicleImport::PREVIEWED, 'summary' => $finished['summary'], 'plan_hash' => $finished['hash'], 'cursor' => null, 'attempts' => 0])->save();

                    return false;
                }

                $cursor = [...$cursor, 'step' => $count->add($step), 'count' => $count->state()];
                $import->forceFill(['cursor' => $cursor])->save();
                self::beat($import->id);
            } while (microtime(true) < $deadline);

            return false;
        } catch (Throwable $error) {
            return $this->stumbled($import, $error, 'Der Probelauf ließ sich nicht zu Ende bringen.');
        }
    }

    /**
     * The import, to its end in one transaction (VehicleImporter::apply). Refused — the cars changed, nothing to
     * import — or stopped, it writes nothing, and the run is a Probelauf again with the reason beside it.
     */
    private function apply(VehicleImport $import): bool
    {
        $admin = AdminUser::query()->find($import->applied_by);
        $store = Cache::store(self::progressStore());
        $key = self::progressKey($import->id);

        if ($admin === null) {
            $this->back($import, 'Wer den Import gestartet hat, ist nicht mehr im Team. Starte ihn bitte noch einmal.');

            return false;
        }

        // Counted before it begins, outside its transaction: an import a host stops every time is not begun a fourth time.
        if ($import->attempts >= self::ATTEMPTS) {
            $this->back($import, 'Der Import wurde dreimal unterbrochen, bevor er fertig war. An den Fahrzeugen hat sich nichts geändert.');

            return false;
        }

        VehicleImport::query()->whereKey($import->id)->increment('attempts');
        $id = (int) $import->id;

        try {
            $this->importer->apply($import, $admin, static function (string $step, int $done, int $total) use ($store, $key, $id): void {
                $store->put($key, ['step' => $step, 'done' => $done, 'total' => $total], 3600);
                self::beat($id);
            });
        } catch (PlanChanged $changed) {
            $this->back($import, $changed->getMessage());

            return false;
        } catch (ValidationException $refused) {
            $this->back($import, (string) collect($refused->errors())->flatten()->first());

            return false;
        } catch (Throwable $error) {
            report($error);
            $this->back($import, 'Der Import ist abgebrochen, bevor er fertig war. An den Fahrzeugen hat sich nichts geändert. Starte ihn bitte noch einmal.');

            return false;
        } finally {
            $store->forget($key);
        }

        // Imported: the rows keep what each became; the file itself is no longer read.
        ImportUpload::forget($import);

        return false;
    }

    /** A Probelauf again, with the reason the import did not go through. */
    private function back(VehicleImport $import, string $reason): void
    {
        VehicleImport::query()->whereKey($import->id)->where('status', VehicleImport::APPLYING)
            ->update(['status' => VehicleImport::PREVIEWED, 'applied_by' => null, 'attempts' => 0, 'error' => mb_substr($reason, 0, 1000)]);
    }

    /** Given up, with its reason: the file goes, and so do the rows of a reading that will not be finished. */
    private function fail(VehicleImport $import, string $reason): void
    {
        ImportUpload::forget($import);
        $import->lines()->delete();
        $import->forceFill(['status' => VehicleImport::FAILED, 'error' => mb_substr($reason, 0, 1000), 'cursor' => null, 'stored_as' => null])->save();
    }

    /**
     * Something unforeseen stopped a part of the work: the next part tries again from where the run stands, and after
     * the third time the run is given up with the reason.
     */
    private function stumbled(VehicleImport $import, Throwable $error, string $reason): bool
    {
        report($error);
        $attempts = $import->attempts + 1;

        if ($attempts >= self::ATTEMPTS) {
            $this->fail($import, $reason.' Lad die Datei bitte noch einmal hoch.');
        } else {
            VehicleImport::query()->whereKey($import->id)->update(['attempts' => $attempts]);
        }

        return false;
    }

    private static function progressKey(int $id): string
    {
        return 'vehicle-import-progress:'.$id;
    }

    private static function beatKey(int $id): string
    {
        return 'vehicle-import-beat:'.$id;
    }

    /** The import writes its progress from inside its transaction: to a store that transaction does not hold. */
    private static function progressStore(): string
    {
        return (string) config('rimify.vehicle_import.progress_store', 'file');
    }

    /**
     * A part of the work runs to its end even if the page that asked is closed or PHP's time limit is near. A web
     * request only: in a console process set_time_limit() would limit the whole process, which has none.
     */
    private static function keepRunning(int $seconds): void
    {
        if (app()->runningInConsole()) {
            return;
        }

        if (function_exists('ignore_user_abort')) {
            @ignore_user_abort(true);
        }

        if (function_exists('set_time_limit')) {
            @set_time_limit($seconds);
        }
    }
}
