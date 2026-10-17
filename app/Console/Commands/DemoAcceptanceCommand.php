<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Storefront\VehicleKey;
use App\Models\Vehicle;
use App\Services\Demo\AcceptanceSeeder;
use Illuminate\Console\Command;
use RuntimeException;

/**
 * `rimify:demo --abnahme`: writes the acceptance set (AcceptanceSeeder) — the small shop the client is shown his 34
 * points in, every row born demo. Refused in production and wherever DEMO_DATA is off (DemoGuard); taken away again by
 * System › Zurücksetzen › Demodaten, in one press.
 */
final class DemoAcceptanceCommand extends Command
{
    protected $signature = 'rimify:demo
        {--abnahme : The acceptance set: DB8GT2, its two Gutachten, three demo cars, tyres and the Komplettrad accessories}
        {--pdfs= : Where the Gutachten PDFs are (default: the documents disk of this installation)}
        {--neben-gleicher-pdf : Write the set beside a real Gutachten that is the very same PDF file (the operator\'s decision for the client\'s preview, 14.10.2026)}
        {--beispiel-pdfs : Give a set already written its marked example copies of the Gutachten PDFs, in place (decision 6, 17.10.2026)}';

    protected $description = 'Write the acceptance set the client reviews his list in (local, staging and testing only)';

    public function handle(): int
    {
        if (! $this->option('abnahme')) {
            $this->error('Name the set: rimify:demo --abnahme. (The admin\'s demonstration figures are demo:seed.)');

            return self::INVALID;
        }

        if ($this->option('beispiel-pdfs')) {
            try {
                foreach ((new AcceptanceSeeder)->giveExampleCopies() as $note) {
                    $this->line($note);
                }
            } catch (RuntimeException $e) {
                $this->error($e->getMessage());

                return self::FAILURE;
            }

            return self::SUCCESS;
        }

        try {
            ['counts' => $counts, 'notes' => $notes] = (new AcceptanceSeeder(is_string($this->option('pdfs')) ? $this->option('pdfs') : null, null, (bool) $this->option('neben-gleicher-pdf')))->seed();
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        if ($counts !== []) {
            $this->table(['Tabelle', 'Zeilen'], array_map(static fn (string $t, int $n): array => [$t, $n], array_keys($counts), $counts));
            $this->info(sprintf('Abnahme-Satz geschrieben: %d Zeilen, alle als Demodaten.', array_sum($counts)));
        }

        foreach (AcceptanceSeeder::CARS as $key => $car) {
            $vehicle = Vehicle::query()->where('demo_ref', 'abnahme:vehicle:'.$key)->first();

            if ($vehicle !== null) {
                $this->line(sprintf('  %s %s %s · HSN %s · TSN %s · /felgen?fahrzeug=%s', $car['make'], $car['model'], $car['variant'], $car['hsn'], $car['tsn'], VehicleKey::of($vehicle)));
            }
        }

        foreach ($notes as $note) {
            $this->warn($note);
        }

        return self::SUCCESS;
    }
}
