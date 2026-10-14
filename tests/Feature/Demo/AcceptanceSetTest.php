<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Domain\Storefront\VehicleContext;
use App\Domain\Storefront\VehicleKey;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\BalanceWeightColour;
use App\Models\Brand;
use App\Models\Vehicle;
use App\Models\WheelModel;
use App\Services\Demo\AcceptanceSeeder;
use App\Services\Demo\DemoPurge;
use App\Services\Storefront\Basket;
use App\Services\Storefront\FitmentDetail;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/*
 * The acceptance set (`rimify:demo --abnahme`, the operator's brief „THE 34“ §1.3): the BORBET DB8GT2 on its two real
 * Gutachten, three demo cars with the figures of their papers, tyres and the Komplettrad's accessories — every row born
 * demo, sold with the test payment off production only, and taken away again in one press.
 */

beforeEach(function (): void {
    config(['demo.enabled' => true]);
    $this->seed(ReferenceDataSeeder::class);
});

/**
 * The set as the command writes it — with stand-in PDFs: the client's documents stay out of the repository, so the test
 * gives each a file of its own and the data that file's SHA-256, and the seeder checks it as it checks the real one.
 */
function seedAcceptanceSet(): void
{
    $dir = sys_get_temp_dir().'/rimify-abnahme-pdfs';
    $data = require database_path('seeders/content/abnahme/gutachten.php');

    foreach ($data['documents'] as $key => $document) {
        $path = $dir.'/'.$document['pdf']['source'];
        is_dir(dirname($path)) || mkdir(dirname($path), 0777, true);
        file_put_contents($path, "%PDF-1.4\n% stand-in for {$key}\n");
        $data['documents'][$key]['pdf']['sha256'] = hash_file('sha256', $path);
    }

    (new AcceptanceSeeder($dir, $data))->seed();
}

function acceptanceCar(string $key): Vehicle
{
    return Vehicle::query()->where('demo_ref', 'abnahme:vehicle:'.$key)->firstOrFail();
}

function acceptanceConfig(int $inch, string $finish): int
{
    return (int) DB::table('wheel_configs as c')
        ->join('wheel_models as m', 'm.id', '=', 'c.wheel_model_id')
        ->join('wheel_finishes as f', 'f.id', '=', 'c.wheel_finish_id')
        ->where('m.demo_ref', AcceptanceSeeder::WHEEL_REF)
        ->where('c.diameter_in', $inch)
        ->where('f.name_de', $finish)
        ->value('c.id');
}

it('writes the wheel, its two Gutachten, three cars, tyres and accessories — every row born demo', function (): void {
    seedAcceptanceSet();

    $model = WheelModel::query()->where('demo_ref', AcceptanceSeeder::WHEEL_REF)->firstOrFail();

    expect($model->is_demo)->toBeTrue()
        ->and($model->status->value)->toBe('published')
        ->and($model->refusedAsDemo())->toBeFalse()
        ->and(WheelModel::query()->onSale()->pluck('id')->all())->toBe([$model->id])
        ->and($model->configs()->count())->toBe(4)
        ->and($model->configs()->pluck('price_cents')->sort()->values()->all())->toBe([22_900, 22_900, 26_900, 26_900]);

    expect(DB::table('approval_documents')->where('is_demo', true)->where('demo_ref', 'like', 'abnahme:doc:%')->count())->toBe(2)
        ->and(DB::table('approval_documents')->where('is_demo', false)->count())->toBe(0)
        ->and(DB::table('vehicles')->where('is_demo', true)->where('demo_ref', 'like', 'abnahme:vehicle:%')->count())->toBe(3)
        ->and(DB::table('tyre_variants')->where('is_demo', true)->where('demo_ref', 'like', 'abnahme:tyre:%')->count())->toBe(14)
        ->and(DB::table('balance_weight_colours')->where('is_demo', true)->count())->toBe(2)
        ->and(DB::table('tpms_sensor_prices')->where('is_demo', true)->count())->toBe(1)
        ->and(DB::table('fitments as f')->join('wheel_configs as c', 'c.id', '=', 'f.wheel_config_id')->where('c.wheel_model_id', $model->id)->count())->toBe(12);

    // The cars are named in an address by their key numbers (the client's #8).
    expect(VehicleKey::of(acceptanceCar('e90')))->toBe('0005-Z90-00001');
});

it('answers from the two real Gutachten: Abnahme and Radlauf for the E46 at 19 Zoll, no tyre answer above 210 km/h without a table', function (): void {
    seedAcceptanceSet();
    $resolver = app(FitmentResolver::class);

    $e46 = $resolver->resolve((int) acceptanceCar('e46')->id, acceptanceConfig(19, 'Schwarz matt'));
    $codes = array_map(static fn ($c): string => $c->code, $e46->conditions);

    expect($e46->status)->toBe(VerdictStatus::Conditional)
        ->and($e46->isSellable())->toBeTrue()
        ->and($e46->notesOnly())->toBeFalse()
        ->and($codes)->toContain('A01', 'K42');

    // The Nachtrag prints no table for high speed: the E90's 222 km/h leaves the tyres unconfirmed, so the 18-inch rim
    // is not sold to it (R-03) — the fourth state, never folded into „nicht freigegeben“ (R-07).
    $e90 = $resolver->resolve((int) acceptanceCar('e90')->id, acceptanceConfig(18, 'Bronze matt'));

    expect($e90->status)->toBe(VerdictStatus::Unknown)
        ->and($e90->isSellable())->toBeFalse()
        ->and($e90->reason?->code)->toBe('TYRE_UNKNOWN');
});

it('keeps the Gutachten\'s wording as printed beside the arranged Auflagen, every sentence with its page @kunde-21', function (): void {
    seedAcceptanceSet();
    $verdict = app(FitmentResolver::class)->resolve((int) acceptanceCar('e46')->id, acceptanceConfig(19, 'Schwarz matt'));
    $original = app(FitmentDetail::class)->for($verdict)['original'];
    $printed = array_column($original, 'text');

    // Every sentence of the answer's documents — nothing left out because the verdict line says it — and none of ours.
    expect($verdict->conditions)->not->toBeEmpty();

    foreach ($verdict->conditions as $condition) {
        str_starts_with($condition->code, 'KW ')
            ? expect($printed)->not->toContain($condition->sentenceDe())
            : expect($printed)->toContain($condition->sentenceDe());
    }

    // The page each stands on, where the document gives one — the codes never (R-15).
    expect(array_filter(array_column($original, 'page')))->not->toBeEmpty()
        ->and(implode(' ', $printed))->not->toMatch('/\b(A01|K42|K1c)\b/');
});

it('sells the set with the test payment off production, and never in production', function (): void {
    seedAcceptanceSet();
    $request = Request::create('/felgen', 'GET', [], [VehicleContext::COOKIE => (new VehicleContext((int) acceptanceCar('e90')->id))->encode()]);
    $request->setLaravelSession(app('session')->driver('array'));
    $config = acceptanceConfig(19, 'Schwarz matt');
    $basket = app(Basket::class);

    expect($basket->refusalFor($request, $config, quantity: 4))->toBeNull();

    $environment = app()->environment();
    app()->detectEnvironment(static fn (): string => 'production');

    try {
        expect($basket->refusalFor($request, $config, quantity: 4))->toBe(Basket::WHEEL_GONE)
            ->and(WheelModel::query()->onSale()->count())->toBe(0)
            ->and(Artisan::call('rimify:demo', ['--abnahme' => true]))->toBe(1);
    } finally {
        app()->detectEnvironment(static fn (): string => (string) $environment);
    }
});

it('says on the listing what the product page says: demo data, ordered with the test payment — never „noch nicht“', function (): void {
    seedAcceptanceSet();

    $this->get('/felgen')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('demo', true)->where('acceptance', true));

    // In production the set is not on sale (the basket refuses it): the listing makes no such offer and says what the
    // product page says there — demo data, not to be ordered.
    $environment = app()->environment();
    app()->detectEnvironment(static fn (): string => 'production');

    try {
        $this->get('/felgen')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('demo', true)->where('acceptance', false));
    } finally {
        app()->detectEnvironment(static fn (): string => (string) $environment);
    }
});

it('releases no Gutachten without its very PDF, and writes nothing then', function (): void {
    expect(Artisan::call('rimify:demo', ['--abnahme' => true, '--pdfs' => sys_get_temp_dir().'/rimify-no-pdfs']))->toBe(1)
        ->and(Artisan::output())->toContain('Ohne das PDF wird kein Gutachten freigegeben')
        ->and(DB::table('wheel_models')->count())->toBe(0)
        ->and(DB::table('approval_documents')->count())->toBe(0);
});

it('refuses to double a real DB8GT2', function (): void {
    $brand = Brand::query()->create(['name' => 'BORBET', 'slug' => 'borbet', 'is_wheel_brand' => true]);
    WheelModel::query()->create(['brand_id' => $brand->id, 'name' => 'DB8GT2', 'slug' => AcceptanceSeeder::SLUG, 'spoke_count' => 6, 'status' => 'draft']);

    expect(Artisan::call('rimify:demo', ['--abnahme' => true]))->toBe(1)
        ->and(Artisan::output())->toContain('Die echte BORBET DB8GT2 ist schon im Shop')
        ->and(DB::table('approval_documents')->count())->toBe(0);
});

it('refuses to double a Gutachten the shop holds under another name: the same PDF is the same document', function (): void {
    // As on the client's preview on 13.10.2026: the set's Nachtrag, entered by hand as „ABE, KBA 53841“ — another kind,
    // another number, the very same file.
    $dir = sys_get_temp_dir().'/rimify-abnahme-pdfs';
    $data = require database_path('seeders/content/abnahme/gutachten.php');

    foreach ($data['documents'] as $key => $document) {
        $path = $dir.'/'.$document['pdf']['source'];
        is_dir(dirname($path)) || mkdir(dirname($path), 0777, true);
        file_put_contents($path, "%PDF-1.4\n% stand-in for {$key}\n");
        $data['documents'][$key]['pdf']['sha256'] = hash_file('sha256', $path);
    }

    ApprovalDocument::factory()->draft()->create([
        'kind' => 'ABE', 'kba_number' => '53841',
        'pdf_sha256' => $data['documents']['nachtrag-366-0350-21']['pdf']['sha256'],
    ]);

    expect(fn () => (new AcceptanceSeeder($dir, $data))->seed())
        ->toThrow(RuntimeException::class, 'dieselbe PDF-Datei liegt dort als „ABE 53841“')
        ->and(DB::table('wheel_models')->count())->toBe(0)
        ->and(DB::table('approval_documents')->where('is_demo', true)->count())->toBe(0);
});

it('goes in one press, the shop\'s own accessories untouched, the cars hidden and never deleted (R-04)', function (): void {
    $own = BalanceWeightColour::query()->create(['name_de' => 'Gold', 'slug' => 'gold', 'swatch_hex' => '#B08D57', 'surcharge_cents' => 0, 'currency' => 'EUR', 'is_default' => true, 'active' => true, 'sort_order' => 1]);
    seedAcceptanceSet();

    // The shop has a colour of its own: the set brings none.
    expect(DB::table('balance_weight_colours')->where('is_demo', true)->count())->toBe(0);

    app(DemoPurge::class)->run('Test');

    expect(WheelModel::withTrashed()->where('demo_ref', AcceptanceSeeder::WHEEL_REF)->exists())->toBeFalse()
        ->and(DB::table('approval_documents')->count())->toBe(0)
        ->and(DB::table('fitments')->count())->toBe(0)
        ->and(DB::table('tyre_variants')->count())->toBe(0)
        ->and(DB::table('tpms_sensor_prices')->count())->toBe(0)
        ->and(DB::table('brands')->where('is_demo', true)->count())->toBe(0)
        ->and(DB::table('vehicles')->where('demo_ref', 'like', 'abnahme:%')->whereNull('deleted_at')->count())->toBe(0)
        ->and(DB::table('vehicles')->where('demo_ref', 'like', 'abnahme:%')->count())->toBe(3)
        ->and(BalanceWeightColour::query()->find($own->id))->not->toBeNull();

    // Written again on the same database: the hidden cars come back, nothing collides.
    seedAcceptanceSet();
    expect(DB::table('vehicles')->where('demo_ref', 'like', 'abnahme:%')->whereNull('deleted_at')->count())->toBe(3);
});

it('marks every row it seeds as Demodaten in the admin list that shows it — not only in the database (the brief of 14.10.2026, §6)', function (): void {
    $this->seed(AccessSeeder::class);
    seedAcceptanceSet();
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    // The list, the prop that holds its rows, and how many rows of its table were born demo.
    $lists = [
        '/admin/gutachten' => ['documents', DB::table('approval_documents')->where('is_demo', true)->count()],
        '/admin/fahrzeuge' => ['vehicles', DB::table('vehicles')->where('is_demo', true)->whereNull('deleted_at')->count()],
        '/admin/felgen' => ['wheels', DB::table('wheel_models')->where('is_demo', true)->count()],
        '/admin/zubehoerpreise/wuchtgewichte' => ['colours', DB::table('balance_weight_colours')->where('is_demo', true)->count()],
        '/admin/zubehoerpreise/rdks' => ['prices', DB::table('tpms_sensor_prices')->where('is_demo', true)->count()],
    ];

    foreach ($lists as $url => [$prop, $born]) {
        expect($born)->toBeGreaterThan(0, $url);

        $this->actingAs($admin, 'admin')->get($url)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->where($prop, fn ($rows): bool => collect($rows)->where('demo', true)->count() === $born));
    }
});
