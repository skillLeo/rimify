<?php

declare(strict_types=1);

use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\CatalogueGapEvent;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Dashboard\Variant;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * One Übersicht, the figures of what each role opens the admin for: Katalog stock and data quality
 * instead of revenue, Gutachten documents, conflicts and demand, Support the customers waiting and
 * asking — decided by the role's rights, not its name.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->travelTo(CarbonImmutable::parse('2026-09-27 12:00', 'Europe/Berlin'));
});

function variantAdmin(string $role): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function variantKpis(string $role): array
{
    $keys = [];

    test()->actingAs(variantAdmin($role), 'admin')->get('/admin')
        ->assertInertia(function (AssertableInertia $page) use (&$keys): void {
            $keys = array_column($page->toArray()['props']['kpis'], null, 'key');
        });

    return $keys;
}

it('gives each seeded role the Übersicht of its work', function (string $role, Variant $variant): void {
    expect(Variant::for(variantAdmin($role)))->toBe($variant);

    $this->actingAs(variantAdmin($role), 'admin')->get('/admin')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('variant', $variant->value));
})->with([
    'the owner' => ['super-admin', Variant::Verkauf],
    'the order team' => ['order-manager', Variant::Verkauf],
    'the accountant' => ['accountant', Variant::Verkauf],
    'the catalogue' => ['catalogue-manager', Variant::Katalog],
    'the Gutachten' => ['compliance-editor', Variant::Gutachten],
    'support' => ['support-agent', Variant::Support],
    'content' => ['content-editor', Variant::Keine],
]);

describe('Katalog', function (): void {
    it('counts what can be bought, what not, what no Gutachten names and what is incomplete — no revenue @admin-207', function (): void {
        $photo = ['image_manifest' => ['src' => 'x.webp']];
        $model = WheelModel::factory()->create(['name' => 'CH-R']);
        $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id, ...$photo]);
        $complete = ['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'max_load_kg' => 750];

        // Available or not, never a count (D-299): the old figures in `stock_qty` are kept and no longer read.
        $approved = WheelConfig::factory()->create([...$complete, 'stock_qty' => 0, 'available' => true]);
        WheelConfig::factory()->create([...$complete, 'stock_qty' => 12, 'available' => false]);
        WheelConfig::factory()->create([...$complete, 'available' => true, 'price_cents' => 0, 'weight_g' => null]);
        // A draft model is not in the shop: none of its configurations count.
        WheelConfig::factory()->create(['wheel_model_id' => WheelModel::factory()->draft()->create()->id, 'available' => true]);

        Fitment::factory()->create([
            'wheel_config_id' => $approved->id,
            'vehicle_id' => Vehicle::factory()->create()->id,
            'approval_document_id' => ApprovalDocument::factory()->create(['status' => 'published'])->id,
            'status' => FitmentStatus::Published->value,
        ]);

        $kpis = variantKpis('catalogue-manager');

        expect(array_keys($kpis))->toBe(['bestand', 'ausverkauft', 'ohne-freigabe', 'unvollstaendig'])
            ->and($kpis['bestand']['value'])->toBe(2)
            ->and($kpis['bestand']['sub']['text'])->toBe('von 3 Ausführungen')
            ->and($kpis['ausverkauft']['value'])->toBe(1)
            ->and($kpis['ohne-freigabe']['value'])->toBe(2)
            ->and($kpis['unvollstaendig']['value'])->toBe(1);

        $this->actingAs(variantAdmin('catalogue-manager'), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('quality', 1)
                ->where('quality.0.title', fn (string $title): bool => str_ends_with($title, 'CH-R'))
                ->where('quality.0.missing', ['Preis', 'Gewicht'])
                ->loadDeferredProps(fn (AssertableInertia $reload) => $reload->where('charts.revenue', false)));
    });

    it('says so when the shop has nothing to count', function (): void {
        $kpis = variantKpis('catalogue-manager');

        expect($kpis['bestand']['value'])->toBe(0)
            ->and($kpis['bestand']['sub']['text'])->toBe('keine Ausführung verfügbar')
            ->and($kpis['unvollstaendig']['sub']['text'])->toBe('alle Daten gepflegt');
    });
});

describe('Gutachten', function (): void {
    it('shows documents, conflicts, the open demand and the vehicles to review — and no revenue curve', function (): void {
        ApprovalDocument::factory()->count(2)->create(['status' => 'published']);
        CatalogueGapEvent::record('NO_DOCUMENT', 'plp', vehicleId: Vehicle::factory()->create()->id);
        Vehicle::factory()->needsReview()->create();

        $kpis = variantKpis('compliance-editor');

        expect(array_keys($kpis))->toBe(['documents', 'conflicts', 'nachfrage', 'review'])
            ->and($kpis['documents']['value'])->toBe(2)
            ->and($kpis['conflicts']['sub']['text'])->toBe('kein offener Konflikt')
            ->and($kpis['nachfrage']['value'])->toBe(1)
            ->and($kpis['nachfrage']['href'])->toBe('/admin/nachfrage')
            ->and($kpis['nachfrage']['sub']['text'])->toBe('Letzte 30 Tage')
            ->and($kpis['review']['value'])->toBe(1);

        $this->actingAs(variantAdmin('compliance-editor'), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('quality', null)
                ->loadDeferredProps(fn (AssertableInertia $reload) => $reload->where('charts.revenue', false)->has('charts.coverage.rows')));
    });
});

describe('Support', function (): void {
    it('shows who waits and who asked, then the orders — never money', function (): void {
        $vehicle = Vehicle::factory()->create();
        $row = fn (array $extra): array => [
            'email' => fake()->unique()->safeEmail(),
            'vehicle_id' => $vehicle->id,
            'confirm_token' => bin2hex(random_bytes(32)),
            'unsubscribe_token' => bin2hex(random_bytes(32)),
            'source' => 'startseite',
            'notified_at' => null,
            'updated_at' => now(),
            ...$extra,
        ];

        DB::table('fitment_subscriptions')->insert([
            $row(['confirmed_at' => now()->subDays(2), 'created_at' => now()->subDays(2)]),
            $row(['confirmed_at' => now()->subDay(), 'created_at' => now()->subDay()]),
            $row(['confirmed_at' => null, 'created_at' => now()]),
            // The previous 30 days: one ask, so the change is +200 %.
            $row(['confirmed_at' => now()->subDays(40), 'notified_at' => now()->subDays(35), 'created_at' => now()->subDays(40)]),
        ]);

        $kpis = variantKpis('support-agent');

        expect(array_keys($kpis))->toBe(['wartend', 'anfragen', 'bestellungen', 'offen'])
            ->and($kpis['wartend']['value'])->toBe(2)
            ->and($kpis['wartend']['href'])->toBe('/admin/anfragen')
            ->and($kpis['anfragen']['value'])->toBe(3)
            ->and($kpis['anfragen']['sub']['text'])->toBe(GermanFormat::percent(200.0, true, 1).' zum Vorzeitraum')
            ->and($kpis)->not->toHaveKeys(['umsatz', 'bestellwert']);
    });
});

it('leaves a role with no figures of its own a sentence, not an empty row', function (): void {
    $this->actingAs(variantAdmin('content-editor'), 'admin')->get('/admin')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('kpis', [])->where('variant', 'keine'));
});
