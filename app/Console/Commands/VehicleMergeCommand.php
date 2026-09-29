<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Admin\Vehicles\DatasetVehicle;
use App\Services\Admin\Vehicles\VehicleMerge;
use Illuminate\Console\Command;
use SplFileObject;

/**
 * `vehicles:merge datensatz.csv` — the dry run of the later merge (Block C, item 8): which cars of a bought
 * vehicle dataset fill a car typed from a Gutachten, which wait for a person, which are new. Nothing is
 * written without `--apply --by=<admin e-mail>`, and then only the matched cars' empty fields.
 */
class VehicleMergeCommand extends Command
{
    protected $signature = 'vehicles:merge
        {file : CSV with the columns quelle, fahrzeug_id, hsn, tsn, hersteller, handelsname, variante, fahrzeugtyp, eg_nummer, baubeginn, bauende, achslast_vorn_kg, achslast_hinten_kg, hoechstgeschwindigkeit_kmh, leistung_kw}
        {--apply : Fill the matched cars; without it, only the dry run}
        {--by= : The e-mail of the admin who applies it (needs Fahrzeuge › Bearbeiten)}';

    protected $description = 'Merge a vehicle dataset onto the cars typed from Gutachten: dry run first, never overwriting what a person entered';

    private const LABELS = [
        VehicleMerge::MATCHED => 'passt',
        VehicleMerge::AMBIGUOUS => 'unklar',
        VehicleMerge::NEW => 'neu',
        VehicleMerge::KNOWN => 'bekannt',
    ];

    public function handle(VehicleMerge $merge): int
    {
        $path = (string) $this->argument('file');

        if (! is_file($path) || ! is_readable($path)) {
            $this->error("Die Datei {$path} gibt es nicht oder sie ist nicht lesbar.");

            return self::FAILURE;
        }

        $plan = $merge->plan($this->rows($path));

        $this->table(['Datensatz', 'Ergebnis', 'Fahrzeug', 'Füllt', 'Bleibt (Datensatz sagt anderes)', 'Grund'], array_map(static fn (array $e): array => [
            $e['row']->label(),
            self::LABELS[$e['status']] ?? $e['status'],
            $e['vehicle'] === null ? '–' : '#'.$e['vehicle']->id,
            implode(', ', array_keys($e['fills'])) ?: '–',
            implode(', ', array_map(static fn (string $c, array $d): string => "{$c}: {$d['ours']} (Datensatz {$d['theirs']})", array_keys($e['kept']), $e['kept'])) ?: '–',
            $e['reason'] ?? '',
        ], $plan));

        $counts = array_count_values(array_column($plan, 'status'));
        $this->line(sprintf(
            'passt %d · unklar %d · neu %d · bekannt %d',
            $counts[VehicleMerge::MATCHED] ?? 0,
            $counts[VehicleMerge::AMBIGUOUS] ?? 0,
            $counts[VehicleMerge::NEW] ?? 0,
            $counts[VehicleMerge::KNOWN] ?? 0,
        ));

        if (! (bool) $this->option('apply')) {
            $this->info('Probelauf: nichts geändert. Mit --apply --by=<E-Mail> werden die passenden Fahrzeuge ergänzt.');

            return self::SUCCESS;
        }

        $admin = AdminUser::query()->where('email', (string) $this->option('by'))->first();

        if ($admin === null || ! $admin->may(PermissionModule::Vehicles, PermissionAction::Edit)) {
            $this->error('Zum Anwenden braucht es --by=<E-Mail> eines Admins, der Fahrzeuge bearbeiten darf.');

            return self::FAILURE;
        }

        $this->info($merge->apply($plan, $admin).' Fahrzeuge ergänzt. Unklare und neue Zeilen sind unverändert.');

        return self::SUCCESS;
    }

    /** @return iterable<DatasetVehicle> */
    private function rows(string $path): iterable
    {
        $file = new SplFileObject($path);
        $file->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY | SplFileObject::READ_AHEAD);
        $header = null;

        foreach ($file as $cells) {
            if (! is_array($cells) || $cells === [null]) {
                continue;
            }

            $cells = array_map(static fn ($c): string => trim((string) $c, " \t\n\r\0\x0B\u{FEFF}"), $cells);

            if ($header === null) {
                $header = array_map('mb_strtolower', $cells);

                continue;
            }

            yield DatasetVehicle::fromRow(array_combine($header, array_pad(array_slice($cells, 0, count($header)), count($header), '')));
        }
    }
}
