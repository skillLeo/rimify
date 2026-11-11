<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Storefront\VehicleKey;
use App\Models\Vehicle;
use App\Services\Demo\AcceptanceSeeder;
use App\Services\Demo\AcceptanceShelf;
use App\Services\Demo\AcceptanceShipping;
use App\Services\Demo\AcceptanceTrialPaper;
use App\Services\Demo\AcceptanceWheelSet;
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
        {--beispiel-pdfs : Give a set already written its marked example copies of the Gutachten PDFs, in place (decision 6, 17.10.2026)}
        {--regal : Also three demonstration rims for the homepage shelf, stars and „Anfrage“ (AcceptanceShelf, 29.10.2026)}
        {--satz : Also a fourth demo car on a paper naming 18 inch in front and 19 behind (AcceptanceWheelSet, 07.11.2026)}
        {--ausprobieren : Also a draft paper „Demo – zum Ausprobieren“ to click through the five steps on (AcceptanceTrialPaper, 07.11.2026)}
        {--versand : Also two demo shipping methods, Express and Versichert, to choose between at the checkout (AcceptanceShipping, 11.11.2026)}';

    protected $description = 'Write the acceptance set the client reviews his list in (local, staging and testing only)';

    public function handle(): int
    {
        // The preview's demonstration rims alone, beside a set already written (the operator's brief of 29.10.2026).
        if ($this->option('regal') && ! $this->option('abnahme')) {
            return $this->shelf();
        }

        // The set of two versions and the draft to try the five steps on, alone, beside a set already written (07.11.2026).
        if (($this->option('satz') || $this->option('ausprobieren') || $this->option('versand')) && ! $this->option('abnahme')) {
            return $this->extras();
        }

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

        // The preview's shelf of eight, the stars and „Anfrage“ shown on demonstration rims (the operator's brief of 29.10.2026).
        if ($this->option('regal') && $this->shelf() !== self::SUCCESS) {
            return self::FAILURE;
        }

        return $this->extras();
    }

    /** What --satz, --ausprobieren and --versand add beside the set; each writes nothing twice. */
    private function extras(): int
    {
        if ($this->option('satz') && $this->wheelSet() !== self::SUCCESS) {
            return self::FAILURE;
        }

        if ($this->option('ausprobieren') && $this->trialPaper() !== self::SUCCESS) {
            return self::FAILURE;
        }

        return $this->option('versand') ? $this->shipping() : self::SUCCESS;
    }

    private function shipping(): int
    {
        try {
            $written = (new AcceptanceShipping)->seed();
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info($written === []
            ? 'Die Demo-Versandarten sind schon da.'
            : sprintf('Demo-Versandarten geschrieben: %d, als Demodaten (abnahme:versand:). Einstellungen › Versand zeigt sie.', $written['shipping_methods']));

        return self::SUCCESS;
    }

    private function trialPaper(): int
    {
        try {
            $written = (new AcceptanceTrialPaper)->seed();
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info($written === []
            ? 'Der Entwurf „'.AcceptanceTrialPaper::NUMBER.'“ ist schon da.'
            : 'Entwurf „'.AcceptanceTrialPaper::NUMBER.'“ angelegt, als Demodaten: Admin › Gutachten öffnet ihn bei Schritt 2.');

        return self::SUCCESS;
    }

    private function wheelSet(): int
    {
        try {
            $set = (new AcceptanceWheelSet)->seed();
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info($set === []
            ? 'Der Satz vorne und hinten ist schon da.'
            : sprintf('Satz vorne und hinten geschrieben: %d Zeilen, alle als Demodaten (abnahme:satz:).', array_sum($set)));

        return self::SUCCESS;
    }

    private function shelf(): int
    {
        try {
            $shelf = (new AcceptanceShelf)->seed();
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info($shelf === []
            ? 'Die Regal-Beispiele sind schon da.'
            : sprintf('Regal-Beispiele geschrieben: %d Zeilen, alle als Demodaten (abnahme:regal:).', array_sum($shelf)));

        return self::SUCCESS;
    }
}
