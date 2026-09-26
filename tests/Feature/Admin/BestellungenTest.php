<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Admin\Orders\OrderList;
use Database\Seeders\AccessSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * Verkauf › Bestellungen: every order, found by what the team knows about it; the filters in the
 * URL; the export takes exactly the set on screen, and only for a role that may take customer data
 * away.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function ordersAdmin(string $role = 'order-manager'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @param  array<string, mixed>  $attributes */
function anOrder(array $attributes = [], ?Customer $customer = null): Order
{
    return Order::factory()->create([
        ...($customer === null ? [] : ['customer_id' => $customer->id]),
        ...$attributes,
    ]);
}

/** A snapshot for one line, with or without Auflagen in its frozen verdict. */
function orderSnapshot(Order $order, bool $withConditions): void
{
    $line = OrderLine::factory()->create(['order_id' => $order->id]);

    OrderLineFitment::create([
        'order_line_id' => $line->id,
        'vehicle_id' => 1,
        'wheel_config_id' => 1,
        'fitment_id' => 1,
        'approval_document_id' => 1,
        'document_revision' => 1,
        'verdict' => ['status' => 'CONDITIONAL', 'conditions' => $withConditions ? [['code' => 'A01', 'textDe' => 'Eintragung erforderlich.']] : []],
        'verdict_status' => $withConditions ? 'CONDITIONAL' : 'PERMITTED',
        'requires_entry' => false,
        'engine_version' => '1',
        'computed_at' => now(),
    ]);
}

/**
 * The list's props for a query string.
 *
 * @return array<string, mixed>
 */
function ordersPage(string $query = '', string $role = 'order-manager'): array
{
    $props = [];

    test()->actingAs(ordersAdmin($role), 'admin')->get('/admin/bestellungen'.$query)
        ->assertOk()
        ->assertInertia(function (AssertableInertia $page) use (&$props): void {
            $page->component('Admin/Bestellungen/Index');
            $props = $page->toArray()['props'];
        });

    return $props;
}

/** @return list<string> */
function numbersOn(string $query = ''): array
{
    return array_column(ordersPage($query)['orders'], 'number');
}

describe('who may see it', function (): void {
    it('sends somebody who is not signed in to the sign-in', function (): void {
        $this->get('/admin/bestellungen')->assertRedirect('/admin/anmelden');
        $this->get('/admin/bestellungen/export?format=csv')->assertRedirect('/admin/anmelden');
    });

    it('opens for every role that may read orders and refuses the others', function (string $role, int $status): void {
        $this->actingAs(ordersAdmin($role), 'admin')->get('/admin/bestellungen')->assertStatus($status);
    })->with([
        ['super-admin', 200], ['order-manager', 200], ['support-agent', 200], ['accountant', 200],
        ['catalogue-manager', 403], ['compliance-editor', 403], ['content-editor', 403],
    ]);
});

describe('the rows', function (): void {
    it('says in words how each order stands, newest first', function (): void {
        $jonas = Customer::factory()->create(['firstname' => 'Jonas', 'lastname' => 'Weber', 'email' => 'jonas@example.de']);
        anOrder(['order_number' => 'RMF-A', 'status' => OrderStatus::Shipped->value, 'total_cents' => 142_500, 'placed_at' => now()->subDays(3), 'payment_method' => 'paypal'], $jonas);
        anOrder(['order_number' => 'RMF-B', 'status' => OrderStatus::PendingPayment->value, 'placed_at' => now()->subDay()]);

        $orders = ordersPage()['orders'];

        expect(array_column($orders, 'number'))->toBe(['RMF-B', 'RMF-A'])
            ->and($orders[1])->toMatchArray([
                'customer' => 'Jonas Weber',
                'email' => 'jonas@example.de',
                'total' => "1.425,00\u{00A0}€",
                'payment' => ['label' => 'Bezahlt', 'tone' => 'plain'],
                'fulfilment' => ['label' => 'Versendet', 'tone' => 'plain'],
                'paymentMethod' => 'PayPal',
                'demo' => false,
            ])
            ->and($orders[0]['payment'])->toBe(['label' => 'Offen', 'tone' => 'warn'])
            ->and($orders[0]['fulfilment']['label'])->toBe('–');
    });

    it('marks a seeded order as Demodaten, and no other', function (): void {
        $demo = anOrder(['order_number' => 'RMF-DEMO']);
        $model = WheelModel::factory()->create(['is_demo' => true]);
        $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id]);
        OrderLine::factory()->create(['order_id' => $demo->id, 'wheel_config_id' => $config->id]);
        anOrder(['order_number' => 'RMF-REAL']);

        $rows = collect(ordersPage()['orders'])->keyBy('number');

        expect($rows['RMF-DEMO']['demo'])->toBeTrue()
            ->and($rows['RMF-REAL']['demo'])->toBeFalse();
    });

    it('pages by 25 and opens the last real page for a page past the end', function (): void {
        Order::factory()->count(27)->create();

        $props = ordersPage('?seite=2');

        expect($props['orders'])->toHaveCount(2)
            ->and($props['pagination'])->toMatchArray(['current' => 2, 'last' => 2, 'total' => 27]);

        $this->actingAs(ordersAdmin(), 'admin')->get('/admin/bestellungen?seite=9')->assertRedirect('/admin/bestellungen?seite=2');
    });
});

describe('filters, search and sort', function (): void {
    it('narrows to the orders still to send, as the Übersicht counts them', function (): void {
        anOrder(['order_number' => 'RMF-PAID', 'status' => OrderStatus::Paid->value]);
        anOrder(['order_number' => 'RMF-FULFIL', 'status' => OrderStatus::InFulfilment->value]);
        anOrder(['order_number' => 'RMF-SENT', 'status' => OrderStatus::Shipped->value]);

        expect(numbersOn('?status=offen'))->toEqualCanonicalizing(['RMF-PAID', 'RMF-FULFIL'])
            ->and(numbersOn('?status=SHIPPED'))->toBe(['RMF-SENT']);
    });

    it('finds an order by number, e-mail, full name or car', function (): void {
        $petra = Customer::factory()->create(['firstname' => 'Petra', 'lastname' => 'Bauer', 'email' => 'p.bauer@example.de']);
        anOrder(['order_number' => 'RMF-2026-1004', 'vehicle_label' => 'BMW 3er 320d'], $petra);
        anOrder(['order_number' => 'RMF-2026-2000', 'vehicle_label' => 'Audi A4']);

        expect(numbersOn('?q=RMF-2026-10'))->toBe(['RMF-2026-1004'])
            ->and(numbersOn('?q=p.bauer'))->toBe(['RMF-2026-1004'])
            ->and(numbersOn('?q='.urlencode('Petra Bauer')))->toBe(['RMF-2026-1004'])
            ->and(numbersOn('?q=320d'))->toBe(['RMF-2026-1004'])
            // A wildcard typed is a character searched for, not a pattern.
            ->and(numbersOn('?q=%25'))->toBe([]);
    });

    it('reads a Zeitraum as Berlin days', function (): void {
        // 23:30 UTC on 1 September is 01:30 on 2 September in Berlin.
        anOrder(['order_number' => 'RMF-LATE', 'placed_at' => '2026-09-01 23:30:00']);

        expect(numbersOn('?von=2026-09-02&bis=2026-09-02'))->toBe(['RMF-LATE'])
            ->and(numbersOn('?von=2026-09-01&bis=2026-09-01'))->toBe([]);
    });

    it('filters by amount typed the German way, and refuses one it cannot read', function (): void {
        anOrder(['order_number' => 'RMF-SMALL', 'total_cents' => 99_999]);
        anOrder(['order_number' => 'RMF-LARGE', 'total_cents' => 100_000]);

        expect(numbersOn('?min=1.000'))->toBe(['RMF-LARGE'])
            ->and(numbersOn('?max=999,99'))->toBe(['RMF-SMALL']);

        $this->actingAs(ordersAdmin(), 'admin')->get('/admin/bestellungen?min=1,2,3')
            ->assertRedirect('/admin/bestellungen')
            ->assertSessionHasErrors('min');
    });

    it('keeps only orders sold under Auflagen, from the frozen snapshot', function (): void {
        orderSnapshot(anOrder(['order_number' => 'RMF-COND']), true);
        orderSnapshot(anOrder(['order_number' => 'RMF-PLAIN']), false);

        expect(numbersOn('?auflagen=1'))->toBe(['RMF-COND'])
            ->and(collect(ordersPage()['orders'])->firstWhere('number', 'RMF-COND')['conditions'])->toBeTrue();
    });

    it('sorts by total, and by status in the order an order moves through', function (): void {
        anOrder(['order_number' => 'RMF-1', 'total_cents' => 50_000, 'status' => OrderStatus::Shipped->value]);
        anOrder(['order_number' => 'RMF-2', 'total_cents' => 10_000, 'status' => OrderStatus::Draft->value]);
        anOrder(['order_number' => 'RMF-3', 'total_cents' => 90_000, 'status' => OrderStatus::Paid->value]);

        expect(numbersOn('?sort=summe&richtung=auf'))->toBe(['RMF-2', 'RMF-1', 'RMF-3'])
            ->and(numbersOn('?sort=status&richtung=auf'))->toBe(['RMF-2', 'RMF-3', 'RMF-1']);
    });

    it('refuses a filter it cannot read and opens the list without it, saying why', function (): void {
        $this->actingAs(ordersAdmin(), 'admin')->get('/admin/bestellungen?status=WHATEVER')
            ->assertRedirect('/admin/bestellungen')
            ->assertSessionHasErrors(['status' => 'Diesen Status gibt es nicht. Wähl bitte einen aus der Liste.']);
    });

    it('offers only the payment and shipping methods some order carries', function (): void {
        anOrder(['payment_method' => 'card']);
        anOrder(['payment_method' => 'klarna']);

        $options = ordersPage()['options'];

        expect($options['payment'])->toBe([['value' => 'card', 'label' => 'Kreditkarte'], ['value' => 'klarna', 'label' => 'Klarna']])
            ->and($options['shipping'])->toBe([]);
    });

    it('carries the filters in its own links, so a page is a view to share', function (): void {
        Order::factory()->count(27)->create(['status' => OrderStatus::Paid->value]);

        expect(ordersPage('?status=PAID&sort=summe&richtung=auf')['pagination']['next'])
            ->toBe('/admin/bestellungen?status=PAID&sort=summe&richtung=auf&seite=2');
    });
});

describe('the export', function (): void {
    it('is offered and allowed only to a role that may export orders', function (): void {
        expect(ordersPage('', 'support-agent')['exportUrls'])->toBeNull()
            ->and(ordersPage('', 'accountant')['exportUrls']['csv'])->toBe('/admin/bestellungen/export?format=csv');

        $this->actingAs(ordersAdmin('support-agent'), 'admin')->get('/admin/bestellungen/export?format=csv')->assertForbidden();
    });

    it('writes the filtered set as a CSV a German spreadsheet opens, with no cell that runs', function (): void {
        $evil = Customer::factory()->create(['firstname' => '=HYPERLINK("x")', 'lastname' => 'Test']);
        anOrder(['order_number' => 'RMF-X', 'status' => OrderStatus::Paid->value, 'total_cents' => 142_550], $evil);
        anOrder(['order_number' => 'RMF-Y', 'status' => OrderStatus::Shipped->value]);

        $response = $this->actingAs(ordersAdmin('accountant'), 'admin')->get('/admin/bestellungen/export?format=csv&status=PAID');
        $csv = $response->streamedContent();

        expect($response->headers->get('content-type'))->toStartWith('text/csv')
            ->and($csv)->toStartWith("\u{FEFF}Bestellnummer;Datum;")
            ->and($csv)->toContain('RMF-X')
            ->and($csv)->not->toContain('RMF-Y')
            ->and($csv)->toContain("'=HYPERLINK")
            ->and($csv)->toContain(';1425,5;');
    });

    it('writes an Excel file of the same set', function (): void {
        anOrder(['order_number' => 'RMF-X']);

        $response = $this->actingAs(ordersAdmin('accountant'), 'admin')->get('/admin/bestellungen/export?format=xlsx');

        expect($response->headers->get('content-type'))->toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->and(substr($response->streamedContent(), 0, 2))->toBe('PK');
    });

    it('records who took a copy, in which format, of what, and how many', function (): void {
        anOrder(['status' => OrderStatus::Paid->value]);
        anOrder(['status' => OrderStatus::Paid->value]);

        $this->actingAs(ordersAdmin('accountant'), 'admin')->get('/admin/bestellungen/export?format=xlsx&status=PAID')->streamedContent();

        $entry = AuditLog::query()->where('description', 'orders.exported')->latest('id')->firstOrFail();

        expect($entry->actor_email)->toBe('accountant@rimify.test')
            ->and($entry->properties['format'] ?? null)->toBe('xlsx')
            ->and($entry->properties['filters'] ?? null)->toBe(['status' => 'PAID'])
            ->and($entry->properties['count'] ?? null)->toBe(2);
    });

    it('refuses a format it does not write', function (): void {
        $this->actingAs(ordersAdmin('accountant'), 'admin')->get('/admin/bestellungen/export?format=pdf')
            ->assertRedirect('/admin/bestellungen')
            ->assertSessionHasErrors('format');
    });
});

it('puts Bestellungen in the rail with the orders still to send as its count', function (): void {
    anOrder(['status' => OrderStatus::Paid->value]);
    anOrder(['status' => OrderStatus::Shipped->value]);

    $this->actingAs(ordersAdmin(), 'admin')->get('/admin/bestellungen')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('admin.nav.1.key', 'verkauf')
            ->where('admin.nav.1.pages.0.label', 'Bestellungen')
            ->where('admin.nav.1.pages.0.count', 1));

    expect(OrderList::OPEN)->toBe('offen');
});
