<?php

declare(strict_types=1);

use App\Console\Commands\ReleaseSeed;
use App\Models\BalanceWeightColour;
use App\Models\TpmsSensorPrice;
use App\Models\WheelModel;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * The two things the client configures for a Komplettrad: the colours a Wuchtgewicht can have and
 * what an RDKS sensor costs per car make (docs/specs/komplettrad.md §2.1, §2.3, D-037).
 *
 * Both tables start empty and absence is how "unknown" is stored, so the schema itself refuses
 * every value that would turn an unknown into a claim: a price of zero, a lower-case currency, a
 * mis-cased hex, a make key that is not the normalised slug.
 */

/** A raw balance_weight_colours row, written past the model so only the schema can refuse it. */
function weightColourRow(array $overrides = []): array
{
    return array_merge([
        'name_de' => 'Silber',
        'slug' => 'silber',
        'swatch_hex' => '#C8CCD2',
        'surcharge_cents' => 0,
        'currency' => 'EUR',
        'is_default' => false,
        'active' => true,
        'sort_order' => 0,
        'created_at' => now(),
        'updated_at' => now(),
    ], $overrides);
}

/** A raw tpms_sensor_prices row. */
function tpmsPriceRow(array $overrides = []): array
{
    return array_merge([
        'make_key' => 'volkswagen',
        'make_label_de' => 'Volkswagen',
        'price_cents' => 4_900,
        'currency' => 'EUR',
        'active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ], $overrides);
}

/** @return array<string, array{unique: bool, columns: list<string>}> */
function indexesOf(string $table): array
{
    $out = [];

    foreach (Schema::getIndexes($table) as $index) {
        $out[$index['name']] = ['unique' => (bool) $index['unique'], 'columns' => $index['columns']];
    }

    return $out;
}

function komplettradOptionsIn(string $environment, Closure $run): void
{
    $previous = app()['env'];

    try {
        app()['env'] = $environment;
        $run();
    } finally {
        app()['env'] = $previous;
    }
}

it('creates both tables with every column the specification names', function (): void {
    expect(Schema::hasColumns('balance_weight_colours', [
        'id', 'name_de', 'slug', 'swatch_hex', 'surcharge_cents', 'currency', 'is_default', 'active',
        'sort_order', 'created_at', 'updated_at', 'deleted_at',
    ]))->toBeTrue();

    expect(Schema::hasColumns('tpms_sensor_prices', [
        'id', 'make_key', 'make_label_de', 'price_cents', 'currency', 'active',
        'created_at', 'updated_at', 'deleted_at',
    ]))->toBeTrue();
});

it('names its unique keys and indexes as the specification does', function (): void {
    $colours = indexesOf('balance_weight_colours');

    expect($colours['uq_weight_colour_slug'])->toBe(['unique' => true, 'columns' => ['slug']])
        ->and($colours['uq_weight_colour_name'])->toBe(['unique' => true, 'columns' => ['name_de']])
        ->and($colours['idx_weight_colour_order'])->toBe(['unique' => false, 'columns' => ['active', 'sort_order']]);

    $prices = indexesOf('tpms_sensor_prices');

    expect($prices['uq_tpms_make'])->toBe(['unique' => true, 'columns' => ['make_key']])
        ->and($prices['idx_tpms_active'])->toBe(['unique' => false, 'columns' => ['active', 'make_key']]);
});

it('defaults the money, the flags and the order so a colour never needs a price to exist', function (): void {
    $id = DB::table('balance_weight_colours')->insertGetId([
        'name_de' => 'Silber', 'slug' => 'silber', 'created_at' => now(), 'updated_at' => now(),
    ]);
    $colour = BalanceWeightColour::query()->findOrFail($id);

    expect($colour->swatch_hex)->toBeNull()
        ->and($colour->surcharge_cents)->toBe(0)
        ->and($colour->currency)->toBe('EUR')
        ->and($colour->is_default)->toBeFalse()
        ->and($colour->active)->toBeTrue()
        ->and($colour->sort_order)->toBe(0);

    $id = DB::table('tpms_sensor_prices')->insertGetId([
        'make_key' => 'porsche', 'make_label_de' => 'Porsche', 'price_cents' => 18_900,
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $price = TpmsSensorPrice::query()->findOrFail($id);

    expect($price->price_cents)->toBe(18_900)
        ->and($price->currency)->toBe('EUR')
        ->and($price->active)->toBeTrue();
});

it('refuses a sensor price of zero: absence is how unknown is stored', function (): void {
    expect(fn () => DB::table('tpms_sensor_prices')->insert(tpmsPriceRow(['price_cents' => 0])))
        ->toThrow(QueryException::class, 'chk_tpms_price');

    expect(DB::table('tpms_sensor_prices')->count())->toBe(0);
});

it('refuses a lower-case currency on either table', function (string $table, string $check): void {
    $row = $table === 'balance_weight_colours' ? weightColourRow() : tpmsPriceRow();

    expect(fn () => DB::table($table)->insert(array_merge($row, ['currency' => 'eur'])))
        ->toThrow(QueryException::class, $check);
})->with([
    'colours' => ['balance_weight_colours', 'chk_weight_colour_currency'],
    'prices' => ['tpms_sensor_prices', 'chk_tpms_currency'],
]);

it('refuses a make key that is not the normalised slug', function (string $key): void {
    // The key is what the checkout joins on; anything but MakeName::key()'s shape would never match.
    expect(fn () => DB::table('tpms_sensor_prices')->insert(tpmsPriceRow(['make_key' => $key])))
        ->toThrow(QueryException::class, 'chk_tpms_make_key');
})->with([
    'upper case' => ['Volkswagen'],
    'leading hyphen' => ['-vw'],
    'underscore' => ['vw_group'],
    'diacritic' => ['škoda'],
    'inner space' => ['alfa romeo'],
    'empty' => [''],
]);

it('accepts every well-formed make key', function (string $key): void {
    DB::table('tpms_sensor_prices')->insert(tpmsPriceRow(['make_key' => $key]));

    expect(DB::table('tpms_sensor_prices')->where('make_key', $key)->exists())->toBeTrue();
})->with(['volkswagen', 'mercedes-benz', 'ds', 'byd', 'a1']);

it('refuses a mis-cased or malformed swatch and accepts none at all', function (): void {
    // Case-sensitive on purpose: the form request upper-cases, and the column must not accept
    // what the form would never send.
    foreach (['#c8ccd2', 'C8CCD2', '#GGGGGG'] as $hex) {
        expect(fn () => DB::table('balance_weight_colours')->insert(weightColourRow(['swatch_hex' => $hex])))
            ->toThrow(QueryException::class, 'chk_weight_colour_hex');
    }

    DB::table('balance_weight_colours')->insert(weightColourRow(['swatch_hex' => null]));
    DB::table('balance_weight_colours')->insert(weightColourRow(['name_de' => 'Schwarz', 'slug' => 'schwarz', 'swatch_hex' => '#1A1C20']));

    expect(DB::table('balance_weight_colours')->count())->toBe(2);
});

it('keeps a trashed colour blocking its slug and name, so a re-creation must restore it', function (): void {
    $silber = BalanceWeightColour::factory()->create(['name_de' => 'Silber', 'slug' => 'silber']);
    $silber->delete();

    expect(BalanceWeightColour::query()->where('slug', 'silber')->exists())->toBeFalse();

    // Soft deletes plus a unique key: the trashed row still owns the slug and the name.
    expect(fn () => BalanceWeightColour::factory()->create(['name_de' => 'Silber matt', 'slug' => 'silber']))
        ->toThrow(QueryException::class, 'uq_weight_colour_slug');
    expect(fn () => BalanceWeightColour::factory()->create(['name_de' => 'Silber', 'slug' => 'silber-2']))
        ->toThrow(QueryException::class, 'uq_weight_colour_name');

    // The path the admin store action takes instead: look the slug up withTrashed() and restore.
    $trashed = BalanceWeightColour::withTrashed()->where('slug', 'silber')->firstOrFail();
    $trashed->restore();

    expect(BalanceWeightColour::query()->where('slug', 'silber')->count())->toBe(1)
        ->and(BalanceWeightColour::withTrashed()->count())->toBe(1);
});

it('keeps a trashed make blocking its key, so a re-creation must restore it', function (): void {
    $vw = TpmsSensorPrice::factory()->ofMake('volkswagen', 'Volkswagen')->create(['price_cents' => 4_900]);
    $vw->delete();

    expect(fn () => TpmsSensorPrice::factory()->ofMake('volkswagen', 'VW')->create(['price_cents' => 5_900]))
        ->toThrow(QueryException::class, 'uq_tpms_make');

    $trashed = TpmsSensorPrice::withTrashed()->where('make_key', 'volkswagen')->firstOrFail();
    $trashed->restore();

    expect(TpmsSensorPrice::query()->where('make_key', 'volkswagen')->value('price_cents'))->toBe(4_900);
});

it('names the default colour: the active default, else the first active by sort order, else none', function (): void {
    expect(BalanceWeightColour::default())->toBeNull();

    // An inactive default is no default at all.
    BalanceWeightColour::factory()->asDefault()->inactive()->create(['sort_order' => 0]);
    expect(BalanceWeightColour::default())->toBeNull();

    $second = BalanceWeightColour::factory()->create(['sort_order' => 20]);
    $first = BalanceWeightColour::factory()->create(['sort_order' => 10]);
    expect(BalanceWeightColour::default()?->id)->toBe($first->id);

    $chosen = BalanceWeightColour::factory()->asDefault()->create(['sort_order' => 30]);
    expect(BalanceWeightColour::default()?->id)->toBe($chosen->id);

    $chosen->update(['active' => false]);
    expect(BalanceWeightColour::default()?->id)->toBe($first->id);

    $first->delete();
    expect(BalanceWeightColour::default()?->id)->toBe($second->id);
});

it('moves the default flag in one transaction so exactly one row ever carries it', function (): void {
    $a = BalanceWeightColour::factory()->asDefault()->create();
    $b = BalanceWeightColour::factory()->create();
    $c = BalanceWeightColour::factory()->create();
    // A trashed default must not come back as a second default when it is restored.
    $trashed = BalanceWeightColour::factory()->asDefault()->create();
    $trashed->delete();

    $c->makeDefault();

    expect(BalanceWeightColour::withTrashed()->where('is_default', true)->pluck('id')->all())->toBe([$c->id])
        ->and($a->fresh()?->is_default)->toBeFalse()
        ->and($b->fresh()?->is_default)->toBeFalse()
        ->and($c->fresh()?->is_default)->toBeTrue();

    $trashed->restore();
    expect(BalanceWeightColour::query()->where('is_default', true)->count())->toBe(1);

    // Idempotent: making the default the default again changes nothing.
    $c->makeDefault();
    expect(BalanceWeightColour::query()->where('is_default', true)->pluck('id')->all())->toBe([$c->id]);
});

it('prices a sensor by the normalised make key, and only while the row is active', function (): void {
    $vw = TpmsSensorPrice::factory()->ofMake('volkswagen', 'Volkswagen')->create(['price_cents' => 4_900]);

    // 'VW', 'vw' and 'Volkswagen' are one make: the key unifies them, whatever the cookie holds.
    foreach (['VW', 'vw', 'Volkswagen', ' volkswagen ', 'VOLKSWAGEN'] as $spelling) {
        expect(TpmsSensorPrice::forMake($spelling)?->id)->toBe($vw->id, $spelling)
            ->and(TpmsSensorPrice::forMake($spelling)?->price_cents)->toBe(4_900);
    }

    // No make is no price: null, never a guess and never somebody else's row.
    expect(TpmsSensorPrice::forMake(null))->toBeNull()
        ->and(TpmsSensorPrice::forMake(''))->toBeNull()
        ->and(TpmsSensorPrice::forMake('   '))->toBeNull()
        ->and(TpmsSensorPrice::forMake('Porsche'))->toBeNull();

    $vw->update(['active' => false]);
    expect(TpmsSensorPrice::forMake('VW'))->toBeNull();

    $vw->update(['active' => true]);
    $vw->delete();
    expect(TpmsSensorPrice::forMake('VW'))->toBeNull();
});

it('ships factories whose sensor price is never a plausible figure', function (): void {
    $prices = TpmsSensorPrice::factory()->count(3)->create();

    expect($prices->pluck('price_cents')->unique()->all())->toBe([1])
        ->and($prices->pluck('make_key')->unique()->count())->toBe(3)
        ->and($prices->first()?->active)->toBeTrue();

    $colours = BalanceWeightColour::factory()->count(3)->create();

    expect($colours->pluck('slug')->unique()->count())->toBe(3)
        ->and($colours->pluck('name_de')->unique()->count())->toBe(3);

    foreach ($colours as $colour) {
        expect($colour->swatch_hex)->toMatch('/^#[0-9A-F]{6}$/')
            ->and($colour->surcharge_cents)->toBe(0)
            ->and($colour->is_default)->toBeFalse();
    }
});

it('seeds Silber as the default and Schwarz, both without surcharge, and no sensor price at all', function (): void {
    $this->seed(KomplettradOptionsSeeder::class);

    $colours = BalanceWeightColour::query()->active()->orderBy('sort_order')->get();

    expect($colours->pluck('slug')->all())->toBe(['silber', 'schwarz'])
        ->and($colours->pluck('name_de')->all())->toBe(['Silber', 'Schwarz'])
        ->and($colours->where('is_default', true)->pluck('slug')->all())->toBe(['silber'])
        ->and($colours->pluck('surcharge_cents')->unique()->all())->toBe([0])
        ->and($colours->pluck('currency')->unique()->all())->toBe(['EUR'])
        ->and(BalanceWeightColour::default()?->slug)->toBe('silber');

    foreach ($colours as $colour) {
        expect($colour->swatch_hex)->toMatch('/^#[0-9A-F]{6}$/');
    }

    // D-037: a seeded sensor price would be an invented market price. None, in any environment.
    expect(TpmsSensorPrice::withTrashed()->count())->toBe(0);
});

it('is safe to run twice and restores a trashed colour instead of duplicating it', function (): void {
    $this->seed(KomplettradOptionsSeeder::class);
    $ids = BalanceWeightColour::query()->orderBy('id')->pluck('id', 'slug')->all();

    BalanceWeightColour::query()->where('slug', 'schwarz')->firstOrFail()->delete();
    // A local admin moved the default; the seeder puts it back where the demo flow expects it.
    BalanceWeightColour::factory()->asDefault()->create(['name_de' => 'Rot', 'slug' => 'rot']);

    $this->seed(KomplettradOptionsSeeder::class);

    expect(BalanceWeightColour::withTrashed()->count())->toBe(3)
        ->and(BalanceWeightColour::query()->orderBy('id')->pluck('id', 'slug')->all())->toMatchArray($ids)
        ->and(BalanceWeightColour::query()->where('slug', 'schwarz')->exists())->toBeTrue()
        ->and(BalanceWeightColour::query()->where('is_default', true)->pluck('slug')->all())->toBe(['silber']);
});

it('seeds no colour outside the local and testing environments', function (): void {
    komplettradOptionsIn('production', function (): void {
        // `--force`: in production db:seed asks for confirmation, and a test cannot answer.
        $this->artisan('db:seed', ['--class' => KomplettradOptionsSeeder::class, '--force' => true])->assertSuccessful();
        expect(BalanceWeightColour::withTrashed()->count())->toBe(0);

        $this->artisan('db:seed', ['--class' => DatabaseSeeder::class, '--force' => true])->assertSuccessful();
        expect(BalanceWeightColour::withTrashed()->count())->toBe(0)
            ->and(TpmsSensorPrice::withTrashed()->count())->toBe(0)
            // The catalogue is still seeded: only the Komplettrad options are held back.
            ->and(WheelModel::query()->count())->toBeGreaterThan(0);
    });

    // And never on a live database through the release seed either.
    expect(ReleaseSeed::SEEDERS)->not->toContain(KomplettradOptionsSeeder::class);
});

it('is called by the database seeder in the testing environment', function (): void {
    $this->seed(DatabaseSeeder::class);

    expect(BalanceWeightColour::query()->active()->count())->toBe(2)
        ->and(BalanceWeightColour::query()->where('is_default', true)->count())->toBe(1)
        ->and(TpmsSensorPrice::withTrashed()->count())->toBe(0);
});
