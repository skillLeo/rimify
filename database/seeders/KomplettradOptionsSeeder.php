<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\BalanceWeightColour;
use Illuminate\Database\Seeder;

/**
 * The two Wuchtgewicht colours the local Komplettrad flow needs — Silber (the default) and
 * Schwarz, both without surcharge — and deliberately NO RDKS sensor price for any make.
 *
 * Colours are not a price claim, and without at least one active colour no Komplettrad can be
 * added at all. A sensor price would be an invented market price, which this project forbids: the
 * empty `tpms_sensor_prices` table is what demonstrates the fail-closed checkout. Production starts
 * empty for both tables and the admin fills them (docs/specs/komplettrad.md D-037).
 *
 * Local and testing only, whoever calls it — and never part of ReleaseSeed::SEEDERS. Idempotent: a
 * colour is found by its slug, trashed rows included, so a re-run restores and updates rather than
 * colliding with the unique key.
 */
class KomplettradOptionsSeeder extends Seeder
{
    /** @var list<array{name: string, slug: string, hex: string, default: bool, sort: int}> */
    public const COLOURS = [
        ['name' => 'Silber', 'slug' => 'silber', 'hex' => '#C8CCD2', 'default' => true, 'sort' => 10],
        ['name' => 'Schwarz', 'slug' => 'schwarz', 'hex' => '#1A1C20', 'default' => false, 'sort' => 20],
    ];

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        foreach (self::COLOURS as $spec) {
            $colour = BalanceWeightColour::withTrashed()->firstOrNew(['slug' => $spec['slug']]);

            $colour->fill([
                'name_de' => $spec['name'],
                'swatch_hex' => $spec['hex'],
                'surcharge_cents' => 0,
                'currency' => 'EUR',
                'is_default' => false,
                'active' => true,
                'sort_order' => $spec['sort'],
            ]);
            $colour->deleted_at = null;
            $colour->save();

            if ($spec['default']) {
                // Exactly one default, whatever else the local database holds.
                $colour->makeDefault();
            }
        }
    }
}
