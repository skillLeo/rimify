<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderLine;
use App\Services\Demo\DemoDashboard;
use App\Services\Demo\DemoPurge;
use App\Services\Demo\DemoTables;
use Carbon\CarbonImmutable;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\DemoDashboardSeeder;
use Illuminate\Support\Facades\DB;

/*
 * The admin's demonstration data (DemoDashboard): fenced to local, staging and testing with
 * DEMO_DATA=1; every row born demo; totals, VAT, dates and snapshots as the shop's own; the same
 * story on every run; and gone again — exactly it, recorded — with `demo:purge` (R-12).
 */

beforeEach(function (): void {
    config(['demo.enabled' => true]);
});

function demoAnchor(): CarbonImmutable
{
    return CarbonImmutable::parse('2026-09-27', 'Europe/Berlin');
}

/** The demo set at a quarter of the shop's pace, on the seeded catalogue. */
function demoSeeded(float $scale = 0.25): void
{
    test()->seed(ApprovalSeeder::class);
    app(DemoDashboard::class)->seed(demoAnchor(), $scale);
}

/**
 * What the demo rows say, without the ids the database hands out.
 *
 * @return array<string, mixed>
 */
function demoFingerprint(): array
{
    return [
        'orders' => DB::table('orders')->where('is_demo', true)->orderBy('demo_ref')
            ->get(['demo_ref', 'order_number', 'status', 'total_cents', 'tax_cents', 'placed_at', 'paid_at', 'shipped_at', 'tracking_code', 'vehicle_label'])->toArray(),
        'lines' => DB::table('order_lines')->where('is_demo', true)->orderBy('demo_ref')->get(['demo_ref', 'kind', 'label', 'quantity', 'line_total_cents'])->toArray(),
        'snapshots' => DB::table('order_line_fitments')->where('is_demo', true)->orderBy('demo_ref')->get(['demo_ref', 'verdict', 'verdict_status', 'computed_at'])->toArray(),
        'checks' => DB::table('verdict_tallies')->where('is_demo', true)->orderBy('demo_ref')->get(['demo_ref', 'day', 'status', 'n'])->toArray(),
        'activity' => DB::table('audit_logs')->where('is_demo', true)->orderBy('demo_ref')->get(['demo_ref', 'description', 'properties', 'created_at'])->toArray(),
        'demand' => DB::table('catalogue_gap_events')->where('is_demo', true)->orderBy('demo_ref')->get(['demo_ref', 'vehicle_id', 'hsn', 'tsn', 'occurred_at'])->toArray(),
    ];
}

describe('the fence', function (): void {
    it('refuses production, whatever the flag and with --force', function (): void {
        app()['env'] = 'production';

        $this->artisan('demo:seed')->expectsOutputToContain('never written in production')->assertFailed();
        expect(fn () => $this->artisan('db:seed', ['--class' => DemoDashboardSeeder::class, '--force' => true])->run())
            ->toThrow(RuntimeException::class, 'never written in production');
        $this->artisan('demo:break-queue')->assertFailed();

        expect(DemoTables::total())->toBe(0);
    });

    it('refuses without DEMO_DATA=1, and outside local, staging and testing', function (): void {
        config(['demo.enabled' => false]);
        $this->artisan('demo:seed')->expectsOutputToContain('DEMO_DATA=1')->assertFailed();

        config(['demo.enabled' => true]);
        app()['env'] = 'preview';
        $this->artisan('demo:seed')->expectsOutputToContain('only in local, staging or testing')->assertFailed();

        expect(DemoTables::total())->toBe(0);
    });

    it('takes only the scales and dates it knows', function (): void {
        $this->artisan('demo:seed', ['--scale' => '2'])->assertExitCode(2);
        $this->artisan('demo:seed', ['--anchor' => '2026-02-30'])->assertExitCode(2);

        expect(DemoTables::total())->toBe(0);
    });
});

describe('the story', function (): void {
    it('writes orders that add up: totals from lines, VAT inside, payment after the order, shipment after the payment', function (): void {
        demoSeeded();

        $orders = Order::query()->where('is_demo', true)->with('lines')->get();
        expect($orders->count())->toBeGreaterThan(100);

        foreach ($orders as $order) {
            $lines = $order->lines->sum('line_total_cents');

            expect($order->order_number)->toStartWith('RMF-D-')
                ->and($order->subtotal_cents)->toBe($lines)
                ->and($order->total_cents)->toBe($lines + $order->shipping_cents)
                ->and($order->tax_cents)->toBe((int) round($order->total_cents - $order->total_cents / 1.19))
                ->and($order->placed_at)->not->toBeNull();

            if ($order->paid_at !== null) {
                expect($order->paid_at->greaterThan($order->placed_at))->toBeTrue();
            }

            if ($order->shipped_at !== null) {
                expect($order->paid_at)->not->toBeNull()
                    ->and($order->shipped_at->greaterThan($order->paid_at))->toBeTrue()
                    ->and($order->tracking_code)->not->toBeNull();
            }
        }

        // Every wheel sold has its Prüfnachweis, and only a wheel the verdict permitted was sold.
        $wheels = DB::table('order_lines')->where('is_demo', true)->where('kind', 'WHEEL');
        $snapshots = DB::table('order_line_fitments')->whereIn('order_line_id', (clone $wheels)->select('id'));

        expect((clone $snapshots)->count())->toBe($wheels->count())
            ->and((clone $snapshots)->whereNotIn('verdict_status', ['PERMITTED', 'CONDITIONAL'])->count())->toBe(0)
            ->and(DB::table('orders')->where('is_demo', true)->distinct()->count('order_number'))->toBe($orders->count());
    });

    it('stamps each snapshot at the sale, from the resolver', function (): void {
        demoSeeded();

        $line = DB::table('order_lines as l')->join('orders as o', 'o.id', '=', 'l.order_id')
            ->where('l.is_demo', true)->where('l.kind', 'WHEEL')->orderBy('l.id')->first(['l.id', 'o.placed_at']);
        $snapshot = DB::table('order_line_fitments')->where('order_line_id', $line->id)->first();

        expect(CarbonImmutable::parse($snapshot->computed_at, 'UTC')->equalTo(CarbonImmutable::parse($line->placed_at, 'UTC')))->toBeTrue()
            ->and(json_decode($snapshot->verdict, true)['snapshot']['computedAt'])->toBe(CarbonImmutable::parse($line->placed_at, 'UTC')->format('Y-m-d\TH:i:s\Z'));
    });

    it('changes nothing when run twice, and tells the same story again after a purge', function (): void {
        demoSeeded();
        $first = demoFingerprint();
        $counts = DemoTables::counts();
        $touched = DB::table('orders')->where('is_demo', true)->max('updated_at');

        app(DemoDashboard::class)->seed(demoAnchor(), 0.25);

        expect(DemoTables::counts())->toBe($counts)
            ->and(DB::table('orders')->where('is_demo', true)->max('updated_at'))->toBe($touched)
            ->and(demoFingerprint())->toEqual($first);

        app(DemoPurge::class)->run('Test');
        app(DemoDashboard::class)->seed(demoAnchor(), 0.25);

        expect(demoFingerprint())->toEqual($first);
    });

    it('refuses a second set on another anchor or scale — that is demo:reanchor', function (): void {
        demoSeeded();

        expect(fn () => app(DemoDashboard::class)->seed(demoAnchor()->addDay(), 0.25))->toThrow(RuntimeException::class, 'demo:reanchor')
            ->and(fn () => app(DemoDashboard::class)->seed(demoAnchor(), 1.0))->toThrow(RuntimeException::class, 'demo:reanchor');
    });

    it('never touches a row it did not create', function (): void {
        $real = Order::factory()->create();
        $before = DB::table('orders')->where('id', $real->id)->first();
        $customer = DB::table('customers')->where('id', $real->customer_id)->first();

        demoSeeded();
        app(DemoPurge::class)->run('Test');

        expect(DB::table('orders')->where('id', $real->id)->first())->toEqual($before)
            ->and(DB::table('customers')->where('id', $real->customer_id)->first())->toEqual($customer);
    });

    it('names a demo team that can never sign in', function (): void {
        demoSeeded();

        $team = DB::table('admin_users')->where('is_demo', true)->get(['email', 'status', 'password']);

        expect($team)->toHaveCount(5)
            ->and($team->pluck('status')->unique()->all())->toBe(['suspended'])
            ->and($team->every(static fn (object $u): bool => str_starts_with($u->password, '$2y$')))->toBeTrue();

        $this->post('/admin/anmelden', ['email' => $team[0]->email, 'password' => 'irgendwas'])->assertSessionHasErrors();
        $this->assertGuest('admin');
    });
});

describe('demo:purge', function (): void {
    it('leaves no demo row, keeps every real one, and writes exactly one entry that stays', function (): void {
        demoSeeded();
        $realEntry = AuditLog::create(['log_name' => 'admin', 'description' => 'faq.updated']);
        $entries = DB::table('audit_logs')->where('is_demo', false)->count();
        $this->artisan('demo:break-queue')->assertSuccessful();

        $this->artisan('demo:purge', ['--force' => true])->assertSuccessful();

        expect(DemoTables::total())->toBe(0)
            ->and(DemoTables::set())->toBeNull()
            ->and(DB::table('audit_logs')->where('is_demo', false)->count())->toBe($entries + 1)
            ->and(DB::table('audit_logs')->where('id', $realEntry->id)->exists())->toBeTrue();

        $record = AuditLog::query()->where('description', 'demo.purged')->sole();

        expect($record->getAttribute('is_demo'))->toBeFalsy()
            ->and($record->properties['total'])->toBeGreaterThan(100)
            ->and($record->properties['tables'])->toHaveKeys(['orders', 'order_line_fitments', 'audit_logs', 'jobs'])
            ->and($record->properties['anchor'])->toBe('2026-09-27')
            ->and($record->properties['environment'])->toBe('testing')
            ->and($record->actor_email)->toStartWith('Konsole (demo:purge');
    });

    it('goes child first: no snapshot is left without its line, and a real snapshot stays', function (): void {
        demoSeeded();
        $realLine = OrderLine::factory()->create();
        DB::table('order_line_fitments')->insert([
            'order_line_id' => $realLine->id, 'vehicle_id' => 1, 'wheel_config_id' => 1, 'fitment_id' => 1, 'approval_document_id' => 1,
            'document_revision' => 1, 'verdict' => '{}', 'verdict_status' => 'PERMITTED', 'requires_entry' => false, 'engine_version' => '1', 'computed_at' => now(),
        ]);

        app(DemoPurge::class)->run('Test');

        $orphans = DB::table('order_line_fitments as f')->leftJoin('order_lines as l', 'l.id', '=', 'f.order_line_id')->whereNull('l.id')->count();

        expect($orphans)->toBe(0)
            ->and(DB::table('order_line_fitments')->pluck('order_line_id')->all())->toBe([$realLine->id]);
    });

    it('does nothing, and writes nothing, where there is no demo data', function (): void {
        $this->artisan('demo:purge', ['--force' => true])->expectsOutputToContain('No demo data')->assertSuccessful();

        expect(DB::table('audit_logs')->count())->toBe(0);
    });
});

describe('demo:assert-clean', function (): void {
    it('passes a clean database and fails one with a single planted demo row', function (): void {
        $this->artisan('demo:assert-clean')->assertSuccessful();

        DB::table('customers')->insert(['email' => 'x@example.com', 'is_demo' => true, 'demo_ref' => 'demo:customer:planted', 'created_at' => now(), 'updated_at' => now()]);

        $this->artisan('demo:assert-clean')->expectsOutputToContain('customers')->assertFailed();
    });

    it('fails on a stalled demo queue too', function (): void {
        $this->artisan('demo:break-queue')->assertSuccessful();

        $this->artisan('demo:assert-clean')->assertFailed();
    });
});

describe('demo:reanchor', function (): void {
    it('moves the story to a new last day through a purge and a fresh seed, never an update', function (): void {
        demoSeeded();
        $last = DB::table('orders')->where('is_demo', true)->max('placed_at');

        $this->artisan('demo:reanchor', ['--anchor' => '2026-10-04'])->assertSuccessful();

        expect(DemoTables::set())->toBe(['anchor' => '2026-10-04', 'scale' => 0.25])
            ->and(CarbonImmutable::parse(DB::table('orders')->where('is_demo', true)->max('placed_at'))->diffInDays(CarbonImmutable::parse($last), true))->toBeGreaterThan(6.0)
            ->and(AuditLog::query()->where('description', 'demo.purged')->count())->toBe(1);
    });

    it('removes nothing where it may not write', function (): void {
        demoSeeded();
        $total = DemoTables::total();
        config(['demo.enabled' => false]);

        $this->artisan('demo:reanchor')->assertFailed();

        expect(DemoTables::total())->toBe($total);
    });
});
