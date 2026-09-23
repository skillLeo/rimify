<?php

declare(strict_types=1);

use App\Enums\TyreSeason;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\TyreVariant;
use Database\Seeders\CatalogueSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * What an order has to carry to explain a Komplettrad eleven months later, and the flag that keeps
 * a demonstration tyre out of a real order (docs/specs/komplettrad.md §2.2, §2.3, §2.4).
 */

/** @return array<string, array{type: string, nullable: bool, default: string|null}> */
function komplettradColumnsOf(string $table): array
{
    $out = [];

    foreach (Schema::getColumns($table) as $column) {
        $out[$column['name']] = [
            'type' => $column['type'],
            'nullable' => (bool) $column['nullable'],
            'default' => $column['default'] === null ? null : (string) $column['default'],
        ];
    }

    return $out;
}

it('adds the three columns, nullable where an order may not have a Komplettrad', function (): void {
    $orders = komplettradColumnsOf('orders');
    $lines = komplettradColumnsOf('order_lines');
    $tyres = komplettradColumnsOf('tyre_variants');

    expect($orders['vehicle_make'])->toBe(['type' => 'varchar(255)', 'nullable' => true, 'default' => null])
        ->and($lines['balance_weight_colour_id'])->toBe(['type' => 'bigint unsigned', 'nullable' => true, 'default' => null])
        ->and($lines['tpms_sensor_price_id'])->toBe(['type' => 'bigint unsigned', 'nullable' => true, 'default' => null])
        ->and($tyres['is_demo']['nullable'])->toBeFalse()
        ->and($tyres['is_demo']['default'])->toBe('0');
});

it('places each column where the specification puts it', function (): void {
    $orders = Schema::getColumnListing('orders');
    $lines = Schema::getColumnListing('order_lines');
    $tyres = Schema::getColumnListing('tyre_variants');

    expect(array_search('vehicle_make', $orders, true))->toBe(array_search('vehicle_label', $orders, true) + 1)
        ->and(array_search('balance_weight_colour_id', $lines, true))->toBe(array_search('tyre_variant_id', $lines, true) + 1)
        ->and(array_search('tpms_sensor_price_id', $lines, true))->toBe(array_search('balance_weight_colour_id', $lines, true) + 1)
        ->and(array_search('is_demo', $tyres, true))->toBe(array_search('stock_qty', $tyres, true) + 1);
});

it('indexes both frozen option ids by name', function (): void {
    $indexes = [];

    foreach (Schema::getIndexes('order_lines') as $index) {
        $indexes[$index['name']] = $index['columns'];
    }

    expect($indexes['idx_order_line_weight_colour'])->toBe(['balance_weight_colour_id'])
        ->and($indexes['idx_order_line_tpms'])->toBe(['tpms_sensor_price_id']);
});

it('marks every seeded tyre as a demonstration, and keeps it so on a second run', function (): void {
    $this->seed(CatalogueSeeder::class);

    expect(TyreVariant::query()->count())->toBeGreaterThan(0)
        ->and(TyreVariant::withTrashed()->where('is_demo', false)->exists())->toBeFalse();

    // A database seeded before the column existed, with the migration's backfill undone: the
    // seeder's own `is_demo => true` has to restore it, or the next seed clears the backfill.
    DB::table('tyre_variants')->update(['is_demo' => false]);
    $this->seed(CatalogueSeeder::class);

    expect(TyreVariant::withTrashed()->where('is_demo', false)->exists())->toBeFalse()
        ->and(TyreVariant::query()->first()?->is_demo)->toBeTrue();
});

it('treats a tyre written past the seeder as real unless it says otherwise', function (): void {
    // The column default is false: a row the admin creates is stock, not a demonstration. Only
    // the seeder and the one-off backfill say demo.
    $tyre = TyreVariant::factory()->create();

    expect($tyre->fresh()?->is_demo)->toBeFalse();
});

it('fills the label fields and the demo flag through the model instead of dropping them', function (): void {
    // The old $fillable omitted eu_noise_class and eprel_id, so an admin create() would have
    // silently lost the EPREL entry — and with it the right to show the label at all (D7).
    $tyre = new TyreVariant(['eu_noise_class' => 'B', 'eprel_id' => '2402971', 'is_demo' => true]);

    expect($tyre->getAttributes())->toMatchArray(['eu_noise_class' => 'B', 'eprel_id' => '2402971'])
        ->and($tyre->is_demo)->toBeTrue();

    $stored = TyreVariant::factory()->create(['eu_noise_class' => null, 'eprel_id' => null]);
    $stored->update(['eu_noise_class' => 'A', 'eprel_id' => '834095', 'is_demo' => true]);

    expect($stored->fresh()?->eu_noise_class)->toBe('A')
        ->and($stored->fresh()?->eprel_id)->toBe('834095')
        ->and($stored->fresh()?->is_demo)->toBeTrue();
});

it('freezes the colour and the sensor price ids on a line, and the make on the order', function (): void {
    $line = OrderLine::factory()->create();

    expect($line->fresh()?->balance_weight_colour_id)->toBeNull()
        ->and($line->fresh()?->tpms_sensor_price_id)->toBeNull()
        ->and($line->order?->vehicle_make)->toBeNull();

    // update() goes through fill(), so this is the $fillable change and the columns in one go.
    $line->update(['balance_weight_colour_id' => 3, 'tpms_sensor_price_id' => 17]);
    $line->order?->update(['vehicle_make' => 'Volkswagen']);

    expect((int) $line->fresh()?->balance_weight_colour_id)->toBe(3)
        ->and((int) $line->fresh()?->tpms_sensor_price_id)->toBe(17)
        ->and(Order::query()->findOrFail($line->order_id)->vehicle_make)->toBe('Volkswagen');
});

it('keeps TyreSeason identical to the season CHECK the catalogue migration wrote', function (): void {
    $clause = DB::selectOne(
        'SELECT CHECK_CLAUSE AS clause FROM information_schema.CHECK_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = ?',
        ['chk_tyre_variants_season'],
    );

    expect($clause)->not->toBeNull();

    // MySQL stores the clause with escaped quotes (`_utf8mb4\'sommer\'`); MariaDB does not.
    preg_match_all("/'([a-z]+)'/", stripslashes((string) $clause?->clause), $matches);

    expect($matches[1])->toEqualCanonicalizing(TyreSeason::values())
        ->and(TyreSeason::values())->toBe(['sommer', 'winter', 'ganzjahres']);

    // And the database agrees case by case: every enum value is storable, anything else is not.
    foreach (TyreSeason::cases() as $season) {
        expect(TyreVariant::factory()->create(['season' => $season->value])->fresh()?->season)->toBe($season->value);
    }

    expect(fn () => TyreVariant::factory()->create(['season' => 'fruehling']))
        ->toThrow(QueryException::class, 'chk_tyre_variants_season');
});

it('labels each season as a qualifier and as the word on a card', function (): void {
    expect(TyreSeason::Sommer->labelDe())->toBe('Sommer')
        ->and(TyreSeason::Winter->labelDe())->toBe('Winter')
        ->and(TyreSeason::Ganzjahres->labelDe())->toBe('Ganzjahres')
        ->and(TyreSeason::Sommer->longLabelDe())->toBe('Sommerreifen')
        ->and(TyreSeason::Winter->longLabelDe())->toBe('Winterreifen')
        ->and(TyreSeason::Ganzjahres->longLabelDe())->toBe('Ganzjahresreifen')
        ->and(TyreSeason::from('ganzjahres'))->toBe(TyreSeason::Ganzjahres);
});
