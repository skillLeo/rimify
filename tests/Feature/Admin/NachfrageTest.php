<?php

declare(strict_types=1);

use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Brand;
use App\Models\CatalogueGapEvent;
use App\Models\DemandMark;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Services\Admin\AuditDescriber;
use App\Services\Admin\Dashboard\Demand;
use App\Services\Admin\Dashboard\Period;
use Carbon\CarbonImmutable;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * Nachfrage-Lücken: the cars asked for without an approved wheel, ranked by how often and how
 * recently, read against the catalogue as it is now — and the team's two answers to each gap,
 * refused on the server for a role that may only read.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->travelTo(CarbonImmutable::parse('2026-09-27 12:00', 'Europe/Berlin'));
});

function nfAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function nfVehicle(string $make = 'BMW', string $model = 'X3', string $variant = 'X3 M40i', array $attributes = []): Vehicle
{
    return Vehicle::factory()->create(['make' => $make, 'model' => $model, 'variant' => $variant, ...$attributes]);
}

/** `$n` asks for a car, `$daysAgo` Berlin days back. */
function nfAsk(Vehicle $vehicle, int $n = 1, int $daysAgo = 0): void
{
    for ($i = 0; $i < $n; $i++) {
        CatalogueGapEvent::query()->create([
            'vehicle_id' => $vehicle->id,
            'reason_code' => 'NO_DOCUMENT',
            'surface' => 'plp',
            'occurred_at' => CarbonImmutable::now()->subDays($daysAgo),
        ]);
    }
}

function nfWaiting(Vehicle $vehicle, int $people = 1): void
{
    for ($i = 0; $i < $people; $i++) {
        DB::table('fitment_subscriptions')->insert([
            'email' => fake()->unique()->safeEmail(),
            'vehicle_id' => $vehicle->id,
            'confirm_token' => bin2hex(random_bytes(32)),
            'unsubscribe_token' => bin2hex(random_bytes(32)),
            'confirmed_at' => now()->subDays(60),
            'source' => 'startseite',
            'created_at' => now()->subDays(60),
            'updated_at' => now()->subDays(60),
        ]);
    }
}

function nfCover(Vehicle $vehicle): void
{
    Fitment::factory()->create([
        'vehicle_id' => $vehicle->id,
        'approval_document_id' => ApprovalDocument::factory()->create(['status' => 'published'])->id,
        'status' => FitmentStatus::Published->value,
    ]);
}

function nfRanked(string $state = 'offen'): array
{
    return app(Demand::class)->ranked(Period::preset('30'), $state);
}

describe('the ranking', function (): void {
    it('lists the cars asked for that have no approved wheel, the most asked first', function (): void {
        $x3 = nfVehicle();
        $golf = nfVehicle('Volkswagen', 'Golf', 'GTI');
        $covered = nfVehicle('Audi', 'A4', 'Avant');
        $gone = nfVehicle('Opel', 'Astra', 'K');

        nfAsk($x3, 5);
        nfAsk($golf, 2);
        nfAsk($covered, 9);
        nfCover($covered);
        nfAsk($gone, 9);
        $gone->delete();

        $demand = nfRanked();

        expect(array_column($demand['rows'], 'title'))->toBe(['BMW X3 M40i', 'Volkswagen Golf GTI'])
            ->and($demand['rows'][0]['asked'])->toBe(5)
            ->and($demand['rows'][0]['weight'])->toBe(100)
            ->and($demand['rows'][1]['weight'])->toBe(40)
            ->and($demand['rows'][0]['key'])->toBe('v:'.$x3->id)
            ->and($demand['asks'])->toBe(7);
    });

    it('weighs a fortnight-old ask half as much, and a person waiting as three asks', function (): void {
        $old = nfVehicle('Audi', 'A6', 'Avant');
        $fresh = nfVehicle('Audi', 'A3', 'Sportback');
        $waited = nfVehicle('Audi', 'Q5', 'Sportback');

        nfAsk($old, 4, daysAgo: 14);   // 4 × ½ = 2
        nfAsk($fresh, 3);              // 3
        nfWaiting($waited);            // 0 asks in the period, 1 person × 3 = 3, older

        $rows = nfRanked()['rows'];

        expect(array_column($rows, 'title'))->toBe(['Audi A3 Sportback', 'Audi Q5 Sportback', 'Audi A6 Avant'])
            ->and(array_column($rows, 'score'))->toBe([3.0, 3.0, 2.0])
            ->and($rows[1]['asked'])->toBe(0)
            ->and($rows[1]['waiting'])->toBe(1);
    });

    it('counts only the asks of the Zeitraum', function (): void {
        $x3 = nfVehicle();
        nfAsk($x3, 3, daysAgo: 45);

        expect(nfRanked()['rows'])->toBe([])
            ->and(app(Demand::class)->ranked(Period::preset('90'))['rows'][0]['asked'])->toBe(3);
    });

    it('lists key numbers the catalogue does not know, and drops them once a car of theirs is served', function (): void {
        CatalogueGapEvent::record('VEHICLE_NOT_FOUND', 'selector', hsn: '0005', tsn: 'ABC');
        CatalogueGapEvent::record('VEHICLE_NOT_FOUND', 'selector', hsn: '0005', tsn: 'ABC');

        $row = nfRanked()['rows'][0];

        expect($row['key'])->toBe('k:0005-ABC')
            ->and($row['kind'])->toBe('keys')
            ->and($row['title'])->toBe('HSN 0005 · TSN ABC')
            ->and($row['detail'])->toBe('Nicht im Fahrzeugkatalog')
            ->and($row['asked'])->toBe(2);

        $known = nfVehicle('BMW', '1er', '118i', ['hsn' => '0005', 'tsn' => 'ABC']);
        expect(nfRanked()['rows'][0]['detail'])->toContain('inzwischen im Katalog');

        nfCover($known);
        expect(nfRanked()['rows'])->toBe([]);
    });

    it('prepares the request to a wheel brand with what identifies the car', function (): void {
        $x3 = nfVehicle(attributes: ['hsn' => '0005', 'tsn' => 'BLX', 'type_designation' => 'G01', 'build_from' => '2017-11-01', 'build_to' => null, 'power_kw' => 260]);
        nfAsk($x3);

        $mail = app(Demand::class)->ranked(Period::preset('30'), 'offen', 'Dr. Mirjam Halbach')['rows'][0]['mail'];

        expect($mail['subject'])->toBe('Gutachten-Anfrage: BMW X3 M40i')
            ->and($mail['body'])->toContain("Fahrzeug: BMW X3 M40i\nTyp: G01\nHSN/TSN: 0005 / BLX\nBauzeitraum: 11/2017–heute\nLeistung: 260 kW")
            ->and($mail['body'])->toContain('(ABE, Teilegutachten oder ECE)')
            ->and($mail['body'])->toEndWith("Mit freundlichen Grüßen\nDr. Mirjam Halbach\nRIMIFY");
    });

    it('keeps each gap in the bucket of its mark, and counts every bucket', function (): void {
        $a = nfVehicle('Audi', 'A3', 'Sportback');
        $b = nfVehicle('Audi', 'A4', 'Avant');
        $c = nfVehicle('Audi', 'A5', 'Coupe');
        nfAsk($a, 3);
        nfAsk($b, 2);
        nfAsk($c, 1);

        DemandMark::query()->create(['gap_key' => 'v:'.$b->id, 'state' => DemandMark::WATCHED, 'marked_at' => now()]);
        DemandMark::query()->create(['gap_key' => 'v:'.$c->id, 'state' => DemandMark::REQUESTED, 'marked_at' => now(), 'brand_id' => Brand::factory()->create(['name' => 'BBS'])->id]);

        expect(nfRanked()['counts'])->toBe(['offen' => 1, 'beobachtet' => 1, 'angefordert' => 1, 'alle' => 3])
            ->and(array_column(nfRanked('offen')['rows'], 'title'))->toBe(['Audi A3 Sportback'])
            ->and(nfRanked('angefordert')['rows'][0]['mark']['label'])->toBe('Bei BBS angefordert am 27.09.2026')
            ->and(nfRanked('alle')['rows'])->toHaveCount(3);
    });
});

describe('the page', function (): void {
    it('opens for a role that may read the Gutachten area, with the actions only for one that may change it', function (): void {
        nfAsk(nfVehicle());

        $this->actingAs(nfAdmin('compliance-editor'), 'admin')->get('/admin/nachfrage')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Nachfrage/Index')
                ->where('can.mark', true)
                ->has('demand.rows', 1)
                ->where('admin.breadcrumbs.0', ['label' => 'Übersicht', 'href' => '/admin'])
                ->where('admin.breadcrumbs.1', ['label' => 'Nachfrage', 'href' => null]));

        $this->actingAs(nfAdmin('catalogue-manager'), 'admin')->get('/admin/nachfrage')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('can.mark', false)->where('brands', []));

        $this->actingAs(nfAdmin('content-editor'), 'admin')->get('/admin/nachfrage')->assertForbidden();
    });

    it('says it when nothing was asked for', function (): void {
        $this->actingAs(nfAdmin(), 'admin')->get('/admin/nachfrage?stand=alle')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('state', 'alle')
                ->where('demand.rows', [])
                ->where('demand.counts.alle', 0)
                ->where('searches', []));
    });

    it('shares the Übersicht’s remembered Zeitraum', function (): void {
        $admin = nfAdmin();
        $this->actingAs($admin, 'admin')->get('/admin?zeitraum=90');

        $this->actingAs($admin->refresh(), 'admin')->get('/admin/nachfrage')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('period.key', '90'));
    });

    it('lists the searches of the Zeitraum that found nothing', function (): void {
        DB::table('search_misses')->insert([
            ['query' => 'felgen tesla model y', 'misses' => 7, 'last_missed_at' => now()->subDay(), 'created_at' => now(), 'updated_at' => now()],
            ['query' => 'alt', 'misses' => 40, 'last_missed_at' => now()->subDays(60), 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->actingAs(nfAdmin(), 'admin')->get('/admin/nachfrage')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('searches', 1)
                ->where('searches.0.query', 'felgen tesla model y')
                ->where('searches.0.misses', 7));
    });
});

describe('marking a gap', function (): void {
    it('records it as watched, and says so in the Protokoll', function (): void {
        $x3 = nfVehicle();

        $this->actingAs(nfAdmin('compliance-editor'), 'admin')
            ->post('/admin/nachfrage/markierung', ['key' => 'v:'.$x3->id, 'state' => 'watched'])
            ->assertRedirect()
            ->assertSessionHas('toast', 'Als beobachtet markiert.');

        $mark = DemandMark::query()->sole();
        expect($mark->state)->toBe('watched')
            ->and($mark->admin_user_id)->toBe(nfAdmin('compliance-editor')->id);

        $entry = DB::table('audit_logs')->where('description', 'demand.marked')->sole();
        expect(json_decode((string) $entry->properties, true))->toMatchArray(['gap' => 'BMW X3 M40i', 'state' => 'watched']);
    });

    it('records the brand a Gutachten was requested of, and replaces an earlier mark', function (): void {
        $x3 = nfVehicle();
        $bbs = Brand::factory()->create(['name' => 'BBS']);
        $admin = nfAdmin('compliance-editor');

        $this->actingAs($admin, 'admin')->post('/admin/nachfrage/markierung', ['key' => 'v:'.$x3->id, 'state' => 'watched']);
        $this->actingAs($admin, 'admin')
            ->post('/admin/nachfrage/markierung', ['key' => 'v:'.$x3->id, 'state' => 'requested', 'brand_id' => $bbs->id])
            ->assertSessionHas('toast', 'Als angefordert markiert.');

        $mark = DemandMark::query()->sole();
        expect($mark->state)->toBe('requested')->and($mark->brand_id)->toBe($bbs->id);

        $entry = AuditLog::query()->where('description', 'demand.marked')->latest('id')->firstOrFail();
        expect(app(AuditDescriber::class)->describe($entry))->toMatchArray([
            'sentence' => 'Für „BMW X3 M40i“ wurde das Gutachten bei BBS angefordert.',
            'area' => 'Gutachten',
        ]);
    });

    it('marks key numbers the catalogue does not know', function (): void {
        $this->actingAs(nfAdmin(), 'admin')
            ->post('/admin/nachfrage/markierung', ['key' => 'k:0005-ABC', 'state' => 'watched'])
            ->assertSessionHasNoErrors();

        expect(DemandMark::query()->sole()->gap_key)->toBe('k:0005-ABC');
    });

    it('refuses what is not a gap, a brand on a mere watch, and a car no longer in the catalogue', function (array $input): void {
        $gone = nfVehicle();
        $gone->delete();
        $input['key'] = str_replace('GONE', (string) $gone->id, (string) ($input['key'] ?? ''));

        $this->actingAs(nfAdmin(), 'admin')->post('/admin/nachfrage/markierung', $input)->assertSessionHasErrors();

        expect(DemandMark::query()->count())->toBe(0);
    })->with([
        'no key' => [['state' => 'watched']],
        'a made-up key' => [['key' => 'x:1', 'state' => 'watched']],
        'an unknown state' => [['key' => 'k:0005-ABC', 'state' => 'done']],
        'a brand on a watch' => [['key' => 'k:0005-ABC', 'state' => 'watched', 'brand_id' => 1]],
        'a deleted car' => [['key' => 'v:GONE', 'state' => 'watched']],
    ]);

    it('is refused on the server to a role that may only read the Gutachten area', function (): void {
        $x3 = nfVehicle();

        $this->actingAs(nfAdmin('catalogue-manager'), 'admin')
            ->post('/admin/nachfrage/markierung', ['key' => 'v:'.$x3->id, 'state' => 'watched'])
            ->assertForbidden();
        $this->actingAs(nfAdmin('content-editor'), 'admin')
            ->delete('/admin/nachfrage/markierung', ['key' => 'v:'.$x3->id])
            ->assertForbidden();

        expect(DemandMark::query()->count())->toBe(0);
    });

    it('takes a mark back, which opens the gap again', function (): void {
        $x3 = nfVehicle();
        nfAsk($x3);
        DemandMark::query()->create(['gap_key' => 'v:'.$x3->id, 'state' => DemandMark::WATCHED, 'marked_at' => now()]);

        $this->actingAs(nfAdmin(), 'admin')
            ->delete('/admin/nachfrage/markierung', ['key' => 'v:'.$x3->id])
            ->assertSessionHas('toast', 'Markierung aufgehoben. Die Lücke ist wieder offen.');

        expect(DemandMark::query()->count())->toBe(0)
            ->and(nfRanked()['counts']['offen'])->toBe(1)
            ->and(DB::table('audit_logs')->where('description', 'demand.unmarked')->count())->toBe(1);
    });
});

it('puts the five open gaps most in demand on the Übersicht, for the Gutachten roles only', function (): void {
    foreach (range(1, 7) as $i) {
        nfAsk(nfVehicle('Audi', 'A'.$i, 'Avant'), $i);
    }

    $this->actingAs(nfAdmin('compliance-editor'), 'admin')->get('/admin')
        ->assertInertia(fn (AssertableInertia $page) => $page->loadDeferredProps(fn (AssertableInertia $reload) => $reload
            ->has('charts.demand.rows', 5)
            ->where('charts.demand.rows.0.title', 'Audi A7 Avant')
            ->where('charts.demand.counts.offen', 7)));

    $this->actingAs(nfAdmin('order-manager'), 'admin')->get('/admin')
        ->assertInertia(fn (AssertableInertia $page) => $page->loadDeferredProps(fn (AssertableInertia $reload) => $reload->where('charts.demand', false)));
});
