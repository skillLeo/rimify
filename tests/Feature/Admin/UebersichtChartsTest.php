<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Enums\FitmentStatus;
use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Models\AdminUser;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Admin\Dashboard\ChartData;
use App\Services\Admin\Dashboard\Period;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ApprovalSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * The Übersicht's three charts: the numbers behind each, counted on the server, only for the roles
 * that may see them, arriving a moment after the page — and the tally the storefront writes for the
 * verdicts chart, which keeps nothing but a count.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->travelTo(now()->setTimezone('UTC')->setDate(2026, 9, 26)->setTime(11, 40));
});

function chartsAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function chartOrder(int $cents, string $placedAtUtc, ?WheelConfig $config = null): Order
{
    $order = Order::factory()->create(['status' => OrderStatus::Paid->value, 'total_cents' => $cents, 'placed_at' => $placedAtUtc]);

    if ($config !== null) {
        OrderLine::factory()->create(['order_id' => $order->id, 'kind' => OrderLineKind::Wheel->value, 'wheel_config_id' => $config->id]);
    }

    return $order;
}

describe('the verdict tally', function (): void {
    it('counts every size a customer checks against their car, by state, keeping nothing else', function (): void {
        $this->seed(ApprovalSeeder::class);
        $row = DB::table('fitments as f')
            ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
            ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
            ->where('f.status', FitmentStatus::Published->value)
            ->orderBy('f.id')
            ->first(['f.vehicle_id', 'wm.slug', 'wm.id as model']);
        $sizes = DB::table('wheel_configs')->where('wheel_model_id', $row->model)->count();

        $this->withCookies([VehicleContext::COOKIE => (new VehicleContext((int) $row->vehicle_id, true))->encode()])
            ->get('/felgen/'.$row->slug)
            ->assertOk();

        expect((int) DB::table('verdict_tallies')->where('day', '2026-09-26')->where('surface', 'pdp')->sum('n'))->toBe($sizes)
            // A count per day and state — and the demo marks (R-12), never anything about the person.
            ->and(DB::getSchemaBuilder()->getColumnListing('verdict_tallies'))->toBe(['id', 'day', 'surface', 'status', 'n', 'is_demo', 'demo_ref']);
    });

    it('counts nothing when no car is chosen — nothing was checked', function (): void {
        $this->seed(ApprovalSeeder::class);
        $slug = DB::table('wheel_models')->value('slug');

        $this->get('/felgen/'.$slug)->assertOk();

        expect(DB::table('verdict_tallies')->count())->toBe(0);
    });
});

describe('the chart data', function (): void {
    it('draws Umsatz per Berlin day, with the previous period day for day when comparing', function (): void {
        chartOrder(142_550, '2026-09-24 10:00:00');
        chartOrder(10_000, '2026-09-18 10:00:00');

        $revenue = app(ChartData::class)->revenue(Period::preset('7'), true);

        expect($revenue['points'])->toHaveCount(7)
            // Minor units and the day's paid orders: the page writes them (num.ts), chart and table alike.
            ->and($revenue['points'][4])->toBe(['key' => '2026-09-24', 'label' => '24.09.2026', 'value' => 142_550, 'orders' => 1])
            ->and($revenue['previous'])->toHaveCount(7)
            ->and($revenue['previous'][5]['value'])->toBe(10_000)
            ->and($revenue['total'])->toBe(142_550);
    });

    it('has nothing to draw while the period holds no paid order', function (): void {
        expect(app(ChartData::class)->revenue(Period::preset('7'), true))->toBeNull();
    });

    it('stacks the verdicts per week, Monday to Sunday, in their fixed order', function (): void {
        DB::table('verdict_tallies')->insert([
            ['day' => '2026-09-21', 'surface' => 'pdp', 'status' => 'PERMITTED', 'n' => 5],
            ['day' => '2026-09-23', 'surface' => 'pdp', 'status' => 'UNKNOWN', 'n' => 2],
            ['day' => '2026-09-14', 'surface' => 'pdp', 'status' => 'CONDITIONAL', 'n' => 3],
        ]);

        $chart = app(ChartData::class)->verdicts(Period::between('2026-09-14', '2026-09-26'));

        expect(array_column($chart['series'], 'label'))->toBe(['Freigegeben', 'Mit Auflagen', 'Nicht freigegeben', 'Unbekannt'])
            ->and(array_column($chart['weeks'], 'label'))->toBe(['KW 38', 'KW 39'])
            ->and($chart['weeks'][0]['values'])->toBe(['PERMITTED' => 0, 'CONDITIONAL' => 3, 'NOT_PERMITTED' => 0, 'UNKNOWN' => 0])
            ->and($chart['weeks'][1]['total'])->toBe(7)
            ->and($chart['weeks'][1]['range'])->toBe("21.09.\u{2013}26.09.2026")
            ->and($chart['since'])->toBe('14.09.2026');
    });

    it('has no verdicts to draw before anything was counted', function (): void {
        expect(app(ChartData::class)->verdicts(Period::preset('30')))->toBeNull();
    });

    it('ranks the Felgen by paid orders that hold them, a set of four counting once', function (): void {
        $a = WheelConfig::factory()->create(['wheel_model_id' => WheelModel::factory()->create(['name' => 'Alpha'])->id]);
        $b = WheelConfig::factory()->create(['wheel_model_id' => WheelModel::factory()->create(['name' => 'Beta'])->id]);

        chartOrder(10_000, '2026-09-20 10:00:00', $a);
        chartOrder(10_000, '2026-09-21 10:00:00', $a);
        $both = chartOrder(10_000, '2026-09-22 10:00:00', $b);
        // A second line of the same model on one order does not count twice.
        OrderLine::factory()->create(['order_id' => $both->id, 'kind' => OrderLineKind::Wheel->value, 'wheel_config_id' => $b->id]);
        // Refunded: not a sale.
        $refunded = chartOrder(10_000, '2026-09-23 10:00:00', $b);
        $refunded->update(['status' => OrderStatus::Refunded->value]);

        $bars = app(ChartData::class)->topWheels(Period::preset('30'));

        expect(array_column($bars, 'value'))->toBe([2, 1])
            ->and($bars[0]['label'])->toEndWith('Alpha')
            ->and($bars[0]['name'])->toBe('Alpha')
            // The size most of its orders took, as the label's second weight.
            ->and($bars[0]['size'])->toBe(GermanFormat::rimSize((string) $a->width_in, (string) $a->diameter_in));
    });

    it('shows the top seven, not more', function (): void {
        foreach (range(1, 9) as $n) {
            chartOrder(10_000, '2026-09-20 10:00:00', WheelConfig::factory()->create(['wheel_model_id' => WheelModel::factory()->create(['name' => "Modell {$n}"])->id]));
        }

        expect(app(ChartData::class)->topWheels(Period::preset('30')))->toHaveCount(7);
    });
});

describe('on the page', function (): void {
    it('sends the charts a moment after the figures', function (): void {
        chartOrder(10_000, '2026-09-24 10:00:00');

        $this->actingAs(chartsAdmin(), 'admin')->get('/admin?zeitraum=7')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->missing('charts')
                ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                    ->has('charts.revenue.points', 7)
                    ->where('charts.verdicts', null)
                    ->has('charts.topWheels')));
    });

    it('keeps each chart from a role that may not see what it draws', function (): void {
        $this->actingAs(chartsAdmin('support-agent'), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                    ->where('charts.revenue', false)));

        $this->actingAs(chartsAdmin('content-editor'), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                    ->where('charts.revenue', false)
                    ->where('charts.verdicts', false)
                    ->where('charts.topWheels', false)));
    });

    it('names the charts a role gets before they arrive, so their boxes stand from the first frame', function (): void {
        $this->actingAs(chartsAdmin(), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('chartKeys', ['revenue', 'verdicts', 'topWheels', 'coverage', 'demand'])
                ->where('coverageRows', DB::table('vehicles')->whereNull('deleted_at')->distinct()->count('make')));

        // The order team reads the reports too, so the verdicts; without the Gutachten right, no matrix.
        $this->actingAs(chartsAdmin('order-manager'), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('chartKeys', ['revenue', 'verdicts', 'topWheels'])
                ->where('coverageRows', 0));

        $this->actingAs(chartsAdmin('content-editor'), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('chartKeys', []));
    });

    it('lets one chart fail on its own: it is named, the others still arrive, the page stays', function (): void {
        chartOrder(10_000, '2026-09-24 10:00:00');

        // The verdicts' table is locked, say, for this one request: its query fails, nothing else does.
        DB::connection()->beforeExecuting(function (string $sql): void {
            if (str_contains($sql, 'verdict_tallies')) {
                throw new RuntimeException('Lock wait timeout exceeded on verdict_tallies');
            }
        });

        $this->actingAs(chartsAdmin(), 'admin')->get('/admin?zeitraum=7')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Uebersicht/Index')
                ->loadDeferredProps(fn (AssertableInertia $reload) => $reload
                    ->where('charts.failed', ['verdicts'])
                    ->where('charts.verdicts', null)
                    ->has('charts.revenue.points')
                    ->has('charts.coverage.rows')));
    });
});

it('uses Berlin days for the weeks as well', function (): void {
    // Sunday 20 September, 23:30 in Berlin, is still KW 38 there.
    expect(CarbonImmutable::parse('2026-09-20 21:30:00', 'UTC')->setTimezone('Europe/Berlin')->isoWeek())->toBe(38);
});
