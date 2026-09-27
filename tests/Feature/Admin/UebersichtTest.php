<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Models\AdminUser;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Admin\Dashboard\SalesFigures;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * Übersicht: real figures for one remembered Zeitraum, only the figures of the areas a role may
 * open, each linked to the list that shows exactly what it counts, and a sentence where there is
 * nothing to count.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    // 26 September 2026, 13:40 in Berlin.
    $this->travelTo(now()->setTimezone('UTC')->setDate(2026, 9, 26)->setTime(11, 40));
});

function dashAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/**
 * @return array<string, mixed>
 */
function dashProps(string $query = '', string $role = 'super-admin'): array
{
    $props = [];

    test()->actingAs(dashAdmin($role), 'admin')->get('/admin'.$query)
        ->assertOk()
        ->assertInertia(function (AssertableInertia $page) use (&$props): void {
            $page->component('Admin/Uebersicht/Index');
            $props = $page->toArray()['props'];
        });

    return $props;
}

/** @return array<string, array<string, mixed>> */
function dashTiles(string $query = '', string $role = 'super-admin'): array
{
    return collect(dashProps($query, $role)['kpis'])->keyBy('key')->all();
}

function dashOrder(int $cents, string $placedAtUtc, OrderStatus $status = OrderStatus::Paid): Order
{
    return Order::factory()->create(['status' => $status->value, 'total_cents' => $cents, 'placed_at' => $placedAtUtc, 'paid_at' => $placedAtUtc]);
}

describe('who sees what', function (): void {
    it('shows each role the tiles of the areas it may open', function (string $role, array $keys): void {
        expect(array_keys(dashTiles('', $role)))->toBe($keys);
    })->with([
        ['super-admin', ['umsatz', 'bestellungen', 'bestellwert', 'offen']],
        ['order-manager', ['umsatz', 'bestellungen', 'bestellwert', 'offen']],
        // Support: who waits and who asked, then the orders — never money (UebersichtVariantsTest).
        ['support-agent', ['wartend', 'anfragen', 'bestellungen', 'offen']],
        ['accountant', ['umsatz', 'bestellungen', 'bestellwert', 'offen']],
        ['content-editor', []],
    ]);

    it('keeps the money figures for a role that may read reports but not orders, without a link it could not open', function (): void {
        // The catalogue role, cut down to the reports right alone: a controller, say.
        $role = DB::table('roles')->where('name', 'catalogue-manager')->value('id');
        DB::table('role_permissions')->where('role_id', $role)->where('module', '!=', 'reports')->update(['allowed' => false]);

        $tiles = dashTiles('', 'catalogue-manager');

        expect(array_keys($tiles))->toBe(['umsatz', 'bestellwert'])
            ->and($tiles['umsatz']['href'])->toBeNull();
    });
});

describe('the figures', function (): void {
    it('counts paid, unrefunded orders of the period as numbers, and compares them with the period before', function (): void {
        dashOrder(100_000, '2026-09-24 10:00:00');
        dashOrder(50_000, '2026-09-25 10:00:00', OrderStatus::Shipped);
        dashOrder(99_999, '2026-09-25 11:00:00', OrderStatus::Refunded);
        dashOrder(99_999, '2026-09-25 12:00:00', OrderStatus::PendingPayment);
        // The 30 days before 28.08.–26.09.2026 are 29.07.–27.08.2026 in Berlin.
        dashOrder(75_000, '2026-08-20 10:00:00');

        $tiles = dashTiles();

        // The figure goes out in minor units; the page writes it (num.ts formatMoney: 1.500,00 €).
        // A change always carries one decimal, so the tiles' lines read alike.
        expect($tiles['umsatz'])->toMatchArray(['value' => 150_000, 'unit' => 'EUR'])
            ->and($tiles['umsatz']['sub'])->toBe(['text' => "+100,0\u{00A0}% zum Vorzeitraum", 'kind' => 'delta', 'direction' => 'up'])
            ->and($tiles['bestellungen'])->toMatchArray(['value' => 2, 'unit' => null])
            ->and($tiles['bestellungen']['sub']['text'])->toBe("+100,0\u{00A0}% zum Vorzeitraum")
            ->and($tiles['bestellwert']['value'])->toBe(75_000)
            ->and($tiles['bestellwert']['sub'])->toBe(['text' => "0,0\u{00A0}% zum Vorzeitraum", 'kind' => 'delta', 'direction' => 'flat'])
            ->and($tiles['umsatz']['series'])->toHaveCount(30);
    });

    it('gives each figure one line — a fact about the orders it counts — when not comparing', function (): void {
        dashOrder(100_000, '2026-09-24 10:00:00');
        dashOrder(50_000, '2026-09-25 10:00:00', OrderStatus::Shipped);
        // Not counted, so not the latest nor the largest either.
        dashOrder(250_000, '2026-09-26 08:00:00', OrderStatus::Refunded);

        $tiles = dashTiles('?vergleich=0');

        // Whole euros in a tile's line too; tables keep the cents.
        expect($tiles['umsatz']['sub'])->toBe(['text' => "stärkster Tag 24.09. \u{00B7} 1.000,00\u{00A0}€", 'kind' => 'note', 'direction' => null])
            ->and($tiles['bestellungen']['sub']['text'])->toBe('letzte gestern')
            ->and($tiles['bestellwert']['sub']['text'])->toBe("höchster Bestellwert 1.000,00\u{00A0}€");
    });

    it('takes the later of two equally strong days, and says a recent order in hours', function (): void {
        dashOrder(20_000, '2026-09-20 10:00:00');
        dashOrder(20_000, '2026-09-22 10:00:00');
        // 09:40 UTC is 11:40 in Berlin: two hours before the clock's 13:40.
        dashOrder(5_000, '2026-09-26 09:40:00');

        $tiles = dashTiles('?vergleich=0');

        expect($tiles['umsatz']['sub']['text'])->toBe("stärkster Tag 22.09. \u{00B7} 200,00\u{00A0}€")
            ->and($tiles['bestellungen']['sub']['text'])->toBe("letzte vor 2\u{00A0}Std.");
    });

    it('dates the last order in a range that ended before today, and says a brand-new one in seconds', function (): void {
        dashOrder(30_000, '2026-08-10 10:00:00');

        // 01.–31.08.2026, over by now: „letzte vor 47 Tagen“ would read as „none since“.
        expect(dashTiles('?zeitraum=eigen&von=2026-08-01&bis=2026-08-31&vergleich=0')['bestellungen']['sub']['text'])->toBe('letzte am 10.08.2026');

        dashOrder(5_000, '2026-09-26 11:39:30');

        expect(dashTiles('?zeitraum=7&vergleich=0')['bestellungen']['sub']['text'])->toBe('letzte vor Sekunden');
    });

    it('files an order under the Berlin day it was placed on', function (): void {
        // 22:30 UTC on 25 September is 00:30 on 26 September in Berlin — today, the last point.
        dashOrder(10_000, '2026-09-25 22:30:00');

        $series = dashTiles('?zeitraum=7')['umsatz']['series'];

        expect($series)->toHaveCount(7)
            ->and($series[6])->toBe(10_000)
            ->and($series[5])->toBe(0);
    });

    it('draws weeks, not days, for a period longer than a month — the last point a whole week ending today', function (): void {
        dashOrder(10_000, '2026-09-26 08:00:00');
        dashOrder(20_000, '2026-09-20 08:00:00');
        dashOrder(40_000, '2026-09-19 08:00:00');

        $series = dashTiles('?zeitraum=90')['umsatz']['series'];

        expect($series)->toHaveCount(13)
            ->and($series[12])->toBe(30_000)
            ->and($series[11])->toBe(40_000);
    });

    it('shows zero as a figure, and a figure it cannot compute as none — saying why', function (): void {
        $tiles = dashTiles('?vergleich=0');

        expect($tiles['umsatz'])->toMatchArray(['value' => 0, 'series' => []])
            ->and($tiles['umsatz']['sub']['text'])->toBe('keine bezahlte Bestellung')
            ->and($tiles['bestellungen']['value'])->toBe(0)
            // An average of no orders has no figure: the line says why, in a few words.
            ->and($tiles['bestellwert']['value'])->toBeNull()
            ->and($tiles['bestellwert']['sub'])->toBe(['text' => 'noch keine bezahlte Bestellung', 'kind' => 'reason', 'direction' => null])
            ->and($tiles['offen']['value'])->toBe(0)
            ->and($tiles['offen']['sub']['text'])->toBe('alles versendet');
    });

    it('never leaves a tile without its one line', function (): void {
        foreach (['', '?vergleich=0', '?zeitraum=7'] as $query) {
            foreach (dashTiles($query) as $tile) {
                expect($tile['sub']['text'])->toBeString()->not->toBe('');
            }
        }
    });

    it('names a previous period without orders instead of a change it cannot compute', function (): void {
        dashOrder(10_000, '2026-09-24 10:00:00');

        expect(dashTiles()['umsatz']['sub'])->toBe(['text' => 'Vorzeitraum ohne bezahlte Bestellung', 'kind' => 'reason', 'direction' => null]);
    });

    it('computes no change at all when comparing is off', function (): void {
        dashOrder(10_000, '2026-09-24 10:00:00');
        dashOrder(10_000, '2026-08-20 10:00:00');

        expect(dashTiles('?vergleich=0')['umsatz']['sub']['kind'])->toBe('note');
    });

    it('counts the open orders now, whatever the period, and says how long the oldest has waited', function (): void {
        dashOrder(10_000, '2026-09-23 09:00:00');
        dashOrder(10_000, '2026-01-01 09:00:00', OrderStatus::InFulfilment);

        $open = dashTiles('?zeitraum=7')['offen'];

        expect($open['value'])->toBe(2)
            ->and($open['sub'])->toBe(['text' => 'älteste seit 268 Tagen', 'kind' => 'note', 'direction' => null]);
    });
});

describe('the Zeitraum', function (): void {
    it('remembers the period a person chose, and opens on it next time', function (): void {
        dashProps('?zeitraum=7&vergleich=0');

        $period = dashProps()['period'];

        expect($period['key'])->toBe('7')
            ->and($period['compare'])->toBeFalse()
            ->and($period['range'])->toBe("20.09.\u{2013}26.09.2026");
    });

    it('takes an own range and names the one it is compared with', function (): void {
        $period = dashProps('?zeitraum=eigen&von=2026-09-01&bis=2026-09-10')['period'];

        expect($period)->toMatchArray(['key' => 'eigen', 'days' => 10, 'range' => "01.09.\u{2013}10.09.2026", 'previousRange' => "22.08.\u{2013}31.08.2026"]);
    });

    it('refuses a range it cannot read and opens the remembered one, saying why', function (): void {
        $this->actingAs(dashAdmin(), 'admin')->get('/admin?zeitraum=eigen&von=2026-09-10&bis=2026-09-01')
            ->assertRedirect('/admin')
            ->assertSessionHasErrors(['bis' => 'Das Enddatum liegt vor dem Anfangsdatum.']);
    });

    it('says when the figures were counted, in German and in Berlin time', function (): void {
        expect(dashProps()['asOf'])->toBe("26.09.2026, 13:40\u{00A0}Uhr");
    });
});

describe('where each figure leads', function (): void {
    it('opens the list of exactly the orders a money figure counts', function (): void {
        dashOrder(100_000, '2026-09-24 10:00:00');
        dashOrder(99_999, '2026-09-25 11:00:00', OrderStatus::Refunded);

        $href = dashTiles()['umsatz']['href'];

        expect($href)->toBe('/admin/bestellungen?status=bezahlt&von=2026-08-28&bis=2026-09-26');

        $this->actingAs(dashAdmin(), 'admin')->get($href)
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->has('orders', 1));
    });

    it('opens the open orders oldest first', function (): void {
        expect(dashTiles()['offen']['href'])->toBe('/admin/bestellungen?status=offen&sort=datum&richtung=auf');
    });

    it('links every tile only to a list that opens, for every role', function (string $role): void {
        foreach (dashTiles('', $role) as $tile) {
            if ($tile['href'] !== null) {
                $this->actingAs(dashAdmin($role), 'admin')->get($tile['href'])->assertOk();
            }
        }
    })->with(['super-admin', 'catalogue-manager', 'compliance-editor', 'order-manager', 'support-agent', 'accountant']);
});

it('says so when seeded demonstration orders are among the ones counted', function (): void {
    $order = dashOrder(10_000, '2026-09-24 10:00:00');
    $model = WheelModel::factory()->create(['is_demo' => true]);
    OrderLine::factory()->create(['order_id' => $order->id, 'wheel_config_id' => WheelConfig::factory()->create(['wheel_model_id' => $model->id])->id]);

    expect(dashProps()['demo'])->toBeTrue();
});

it('exports the period day by day for a role that may export reports, and only for it', function (): void {
    dashOrder(142_550, '2026-09-24 10:00:00');

    $csv = $this->actingAs(dashAdmin('accountant'), 'admin')->get('/admin/uebersicht/export?zeitraum=7')->streamedContent();

    expect($csv)->toStartWith("\u{FEFF}Datum;\"Umsatz (EUR)\";Bestellungen;")
        ->and($csv)->toContain('24.09.2026;1425,5;1;1425,5');

    $this->actingAs(dashAdmin('support-agent'), 'admin')->get('/admin/uebersicht/export?zeitraum=7')->assertForbidden();
});

it('draws a short first week of the curve at a whole week’s rate, never as a dip the data does not have', function (): void {
    // Nine days of one order each, folded into weeks: two days, then seven — both a week's worth.
    expect(SalesFigures::fold(array_fill(0, 9, 1), 7))->toBe([7, 7])
        ->and(SalesFigures::fold([3, 3, 3], 1))->toBe([3, 3, 3]);
});
