<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Order;
use App\Models\Vehicle;
use App\Services\Admin\AuditTrail;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * The Übersicht's lists: the newest orders, what waits on this role (oldest first), today's
 * sentences and the last changes — each row leading to a page that exists and that the role may open.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->travelTo(now()->setTimezone('UTC')->setDate(2026, 9, 26)->setTime(11, 40));
});

function listsAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @return array<string, mixed> */
function listsProps(string $role = 'super-admin'): array
{
    $props = [];

    test()->actingAs(listsAdmin($role), 'admin')->get('/admin')
        ->assertOk()
        ->assertInertia(function (AssertableInertia $page) use (&$props): void {
            $props = $page->toArray()['props'];
        });

    return $props;
}

function waitingFor(Vehicle $vehicle, string $confirmedAt): void
{
    DB::table('fitment_subscriptions')->insert([
        'email' => fake()->unique()->safeEmail(),
        'vehicle_id' => $vehicle->id,
        'confirm_token' => bin2hex(random_bytes(32)),
        'unsubscribe_token' => bin2hex(random_bytes(32)),
        'confirmed_at' => $confirmedAt,
        'unsubscribed_at' => null,
        'notified_at' => null,
        'created_at' => $confirmedAt,
        'updated_at' => $confirmedAt,
    ]);
}

describe('Neueste Bestellungen', function (): void {
    it('lists the eight newest placed orders, never a draft, each leading to itself', function (): void {
        Order::factory()->count(9)->sequence(fn ($s) => ['placed_at' => now()->subHours(9 - $s->index), 'order_number' => 'RMF-'.(100 + $s->index)])->create();
        Order::factory()->create(['status' => OrderStatus::Draft->value, 'placed_at' => null]);

        $rows = listsProps()['recentOrders'];

        expect($rows)->toHaveCount(8)
            ->and($rows[0]['number'])->toBe('RMF-108')
            ->and($rows[0]['ago'])->toBe("vor 1\u{00A0}Std.")
            ->and($rows[0]['href'])->toBe('/admin/bestellungen?q=RMF-108');

        $this->actingAs(listsAdmin(), 'admin')->get($rows[0]['href'])
            ->assertInertia(fn (AssertableInertia $page) => $page->has('orders', 1)->where('orders.0.number', 'RMF-108'));
    });

    it('is not there for a role that may not open orders', function (): void {
        expect(listsProps('content-editor')['recentOrders'])->toBeNull();
    });
});

describe('Zu erledigen', function (): void {
    it('lists what waits on the role, oldest first, each with its kind', function (): void {
        Order::factory()->create(['order_number' => 'RMF-NEW', 'status' => OrderStatus::Paid->value, 'paid_at' => now()->subDay()]);
        Order::factory()->create(['order_number' => 'RMF-OLD', 'status' => OrderStatus::InFulfilment->value, 'paid_at' => now()->subDays(5)]);
        ApprovalDocument::factory()->create(['status' => 'draft', 'report_number' => 'TG-77', 'created_at' => now()->subDays(3)]);
        waitingFor($bmw = Vehicle::factory()->create(['make' => 'BMW', 'model' => '3er', 'variant' => '320d']), now()->subDays(2)->toDateTimeString());
        waitingFor($bmw, now()->subDay()->toDateTimeString());

        $todo = listsProps()['todo'];

        expect(array_column($todo, 'title'))->toBe([
            'RMF-OLD versenden',
            'TG-77 prüfen',
            'BMW 3er 320d',
            'RMF-NEW versenden',
        ])
            ->and(array_column($todo, 'type'))->toBe(['Versand', 'Gutachten', 'Anfrage', 'Versand'])
            ->and($todo[2]['detail'])->toBe('2 Personen warten auf ein Gutachten')
            ->and($todo[2]['href'])->toBe('/admin/anfragen');
    });

    it('shows each role only its own kinds of work', function (): void {
        Order::factory()->create(['status' => OrderStatus::Paid->value]);
        ApprovalDocument::factory()->create(['status' => 'draft']);

        expect(array_unique(array_column(listsProps('order-manager')['todo'], 'type')))->toBe(['Versand'])
            ->and(array_unique(array_column(listsProps('compliance-editor')['todo'], 'type')))->toBe(['Gutachten'])
            ->and(listsProps('content-editor')['todo'])->toBe([]);
    });

    it('names failed background jobs for the role that looks after the system', function (): void {
        DB::table('failed_jobs')->insert(['uuid' => (string) str()->uuid(), 'connection' => 'database', 'queue' => 'default', 'payload' => '{}', 'exception' => 'x', 'failed_at' => now()]);

        $item = collect(listsProps()['todo'])->firstWhere('type', 'System');

        expect($item['title'])->toBe('1 Hintergrundaufgabe fehlgeschlagen')
            ->and($item['href'])->toBe('/admin/system');
    });

    it('leads every row to a page the role may open', function (string $role): void {
        Order::factory()->create(['status' => OrderStatus::Paid->value]);
        ApprovalDocument::factory()->create(['status' => 'draft']);
        waitingFor(Vehicle::factory()->create(), now()->toDateTimeString());

        foreach (listsProps($role)['todo'] as $item) {
            $this->actingAs(listsAdmin($role), 'admin')->get($item['href'])->assertOk();
        }
    })->with(['super-admin', 'order-manager', 'compliance-editor', 'support-agent']);
});

describe('Heute', function (): void {
    it('says in at most three sentences what to do now, each with its button', function (): void {
        Order::factory()->count(2)->create(['status' => OrderStatus::Paid->value]);
        ApprovalDocument::factory()->create(['status' => 'draft']);
        waitingFor(Vehicle::factory()->create(), now()->toDateTimeString());

        $today = listsProps()['today'];

        expect(array_column($today, 'sentence'))->toBe([
            '2 bezahlte Bestellungen warten auf den Versand.',
            'Ein Gutachten wartet auf Prüfung.',
            'Eine Kundin oder ein Kunde wartet auf ein Gutachten für ihr Auto.',
        ])
            ->and($today[0]['href'])->toBe('/admin/bestellungen?status=offen&sort=datum&richtung=auf');
    });

    it('says nothing when nothing is open', function (): void {
        expect(listsProps()['today'])->toBe([]);
    });
});

describe('Letzte Aktivität', function (): void {
    it('shows the last six changes in words, never a refused request', function (): void {
        foreach (range(1, 7) as $n) {
            AuditTrail::record(listsAdmin(), 'faq.reordered', ['count' => $n]);
        }

        AuditTrail::record(listsAdmin(), 'permission.denied', ['ability' => 'view', 'route' => 'admin.rollen.index']);

        $activity = listsProps()['activity'];

        expect($activity)->toHaveCount(6)
            ->and($activity[0]['person'])->toBe('Sabine Roth')
            ->and($activity[0]['sentence'])->toBe('Die Reihenfolge der FAQ wurde geändert.')
            ->and($activity[0]['ago'])->toBe('gerade eben');
    });

    it('is not there for a role that may not read the Protokoll', function (): void {
        expect(listsProps('order-manager')['activity'])->toBeNull();
    });
});
