<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Support\CatalogueVersion;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Two demonstration shipping methods for the preview (his round of 08.11, §7B; D-449): „Express“ and „Versichert“, born demo
 * (`is_demo`, `demo_ref` `abnahme:versand:…`), so the client can try the choice at the checkout and the demo purge takes them
 * away again. Written behind the methods already there, never in place of one, and nothing twice. Both cost more than the
 * client's own „Standardversand“ (his shipping setting, carried over), so his stays what a basket goes by until one is chosen.
 */
final class AcceptanceShipping
{
    public const PREFIX = AcceptanceSet::PREFIX.'versand:';

    /** @var list<array{ref: string, name: string, description: string, price_cents: int, free_from_cents: int|null, min: int, max: int}> */
    public const METHODS = [
        ['ref' => 'express', 'name' => 'Express', 'description' => 'Beispiel: schneller zugestellt.', 'price_cents' => 5_990, 'free_from_cents' => null, 'min' => 1, 'max' => 2],
        ['ref' => 'versichert', 'name' => 'Versichert', 'description' => 'Beispiel: mit Sendungsverfolgung, ab dem Warenwert ohne Versandkosten.', 'price_cents' => 3_990, 'free_from_cents' => 200_000, 'min' => 3, 'max' => 5],
    ];

    /**
     * @return array<string, int> rows written, by table: none where they stand already
     *
     * @throws RuntimeException where demo data may not be written
     */
    public function seed(): array
    {
        DemoGuard::ensure();
        $written = 0;
        $position = (int) DB::table('shipping_methods')->max('position');

        foreach (self::METHODS as $method) {
            if (DB::table('shipping_methods')->where('demo_ref', self::PREFIX.$method['ref'])->exists()) {
                continue;
            }

            DB::table('shipping_methods')->insert([
                'name' => $method['name'],
                'description_de' => $method['description'],
                'price_cents' => $method['price_cents'],
                'currency' => 'EUR',
                'free_from_cents' => $method['free_from_cents'],
                'delivery_min_days' => $method['min'],
                'delivery_max_days' => $method['max'],
                'countries' => json_encode(['DE']),
                'product_types' => null,
                'position' => ++$position,
                'active' => true,
                'is_demo' => true,
                'demo_ref' => self::PREFIX.$method['ref'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $written++;
        }

        if ($written > 0) {
            DemoTables::forget();
            CatalogueVersion::changed();
        }

        return $written === 0 ? [] : ['shipping_methods' => $written];
    }
}
