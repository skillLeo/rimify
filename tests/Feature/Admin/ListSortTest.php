<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\FahrzeugeController;
use App\Http\Controllers\Admin\ProtokollController;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Brand;
use App\Models\TyreVariant;
use App\Models\Vehicle;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Catalogue\TyreList;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Http\Response;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;

/*
 * The admin audit's F-32 (Human QA, 28.10.2026): Reifen, Fahrzeuge and the Protokoll had one fixed order, while Felgen and
 * Bestellungen sort. Each now sorts by its headings — the Protokoll by „Neueste zuerst“ / „Älteste zuerst“ —, the order
 * lives in the address, every page link keeps it, an order alone filters nothing, and an order the list does not know is
 * refused in German.
 */

beforeEach(function (): void {
    $this->seed([AccessSeeder::class, ReferenceDataSeeder::class]);
});

function sortAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/**
 * @param  TestResponse<Response>  $response
 * @return array<string, mixed>
 */
function sortProps(TestResponse $response): array
{
    $props = [];
    $response->assertOk()->assertInertia(function (AssertableInertia $page) use (&$props): void {
        $props = $page->toArray()['props'];
    });

    return $props;
}

it('sorts Katalog › Reifen by name, size and price, both ways, and keeps the order in its page links', function (): void {
    $brand = Brand::factory()->create(['name' => 'Prüfreifen', 'is_wheel_brand' => false]);
    $tyre = fn (string $name, int $diameter, int $cents) => TyreVariant::factory()->create([
        'brand_id' => $brand->id, 'name' => $name, 'diameter_in' => $diameter, 'width_mm' => 225, 'aspect' => 45, 'price_cents' => $cents, 'is_demo' => false,
    ]);
    $tyre('Alpha', 19, 15_000);
    $tyre('Beta', 17, 9_000);
    $tyre('Gamma', 18, 21_000);

    $names = fn (string $query): array => array_column(sortProps($this->actingAs(sortAdmin(), 'admin')->get('/admin/reifen'.$query))['tyres'], 'name');

    expect($names(''))->toBe(['Alpha', 'Beta', 'Gamma'])
        ->and($names('?sort=reifen&richtung=ab'))->toBe(['Gamma', 'Beta', 'Alpha'])
        ->and($names('?sort=groesse&richtung=auf'))->toBe(['Beta', 'Gamma', 'Alpha'])
        ->and($names('?sort=preis&richtung=ab'))->toBe(['Gamma', 'Alpha', 'Beta']);

    $props = sortProps($this->actingAs(sortAdmin(), 'admin')->get('/admin/reifen?sort=preis&richtung=ab'));
    // An order alone filters nothing: no „gefiltert“, no reset.
    expect($props['filtered'])->toBeFalse()
        ->and($props['filters'])->toMatchArray(['sort' => 'preis', 'richtung' => 'ab'])
        ->and($props['query'])->toBe(['sort' => 'preis', 'richtung' => 'ab']);

    // The next page keeps the order.
    foreach (range(1, TyreList::PER_PAGE) as $i) {
        $tyre('Zeta '.$i, 16, 5_000 + $i);
    }

    $paged = sortProps($this->actingAs(sortAdmin(), 'admin')->get('/admin/reifen?sort=preis&richtung=ab'));
    expect($paged['pagination']['next'])->toBe('/admin/reifen?sort=preis&richtung=ab&seite=2');
});

it('refuses an order Katalog › Reifen does not know, in German, and opens the plain list', function (): void {
    $this->actingAs(sortAdmin(), 'admin')->get('/admin/reifen?sort=lagerbestand')
        ->assertRedirect('/admin/reifen')
        ->assertSessionHasErrors(['sort' => 'Nach diesem Feld lässt sich nicht sortieren.']);
});

it('sorts Fahrzeuge by vehicle, HSN/TSN, build period and approvals, and keeps the order in its page links', function (): void {
    $car = fn (string $make, string $hsn, string $from) => Vehicle::factory()->create([
        'make' => $make, 'model' => 'Modell', 'variant' => 'Variante', 'hsn' => $hsn, 'tsn' => 'AAA', 'build_from' => $from, 'is_demo' => false,
    ]);
    $car('Audi', '0588', '2016-01-01');
    $car('BMW', '0005', '2019-01-01');
    $car('Cupra', '1860', '2012-01-01');

    $makes = fn (string $query): array => array_map(
        static fn (array $v): string => explode(' ', $v['name'])[0],
        sortProps($this->actingAs(sortAdmin(), 'admin')->get('/admin/fahrzeuge'.$query))['vehicles'],
    );

    expect($makes(''))->toBe(['Audi', 'BMW', 'Cupra'])
        ->and($makes('?sort=fahrzeug&richtung=ab'))->toBe(['Cupra', 'BMW', 'Audi'])
        // Leading zeros sort as the papers print them: 0005 before 0588.
        ->and($makes('?sort=hsn&richtung=auf'))->toBe(['BMW', 'Audi', 'Cupra'])
        ->and($makes('?sort=bauzeit&richtung=ab'))->toBe(['BMW', 'Audi', 'Cupra']);

    $props = sortProps($this->actingAs(sortAdmin(), 'admin')->get('/admin/fahrzeuge?sort=bauzeit&richtung=ab'));
    expect($props['filters'])->toMatchArray(['q' => '', 'marke' => '', 'sort' => 'bauzeit', 'richtung' => 'ab']);

    foreach (range(1, FahrzeugeController::PER_PAGE + 1) as $i) {
        $car('Dacia', str_pad((string) $i, 4, '0', STR_PAD_LEFT), '2010-01-01');
    }

    $paged = sortProps($this->actingAs(sortAdmin(), 'admin')->get('/admin/fahrzeuge?marke=Dacia&sort=hsn&richtung=ab'));
    expect($paged['pagination']['next'])->toBe('/admin/fahrzeuge?marke=Dacia&sort=hsn&richtung=ab&seite=2')
        ->and($paged['vehicles'][0]['keys'])->toBe('HSN 0031 · TSN AAA');
});

it('reads the Protokoll from the oldest entry on when asked, says so on its pager, and keeps it across pages', function (): void {
    $admin = sortAdmin();

    foreach (range(1, ProtokollController::PER_PAGE + 1) as $i) {
        AuditTrail::record($admin, 'admin.password_changed');
    }

    $first = AuditLog::query()->min('id');
    $newest = sortProps($this->actingAs($admin, 'admin')->get('/admin/protokoll'));
    $oldest = sortProps($this->actingAs($admin, 'admin')->get('/admin/protokoll?reihenfolge=alt'));

    expect($newest['oldestFirst'])->toBeFalse()
        ->and($newest['entries'][0]['id'])->toBeGreaterThan($first)
        ->and($oldest['oldestFirst'])->toBeTrue()
        ->and($oldest['entries'][0]['id'])->toBe($first)
        // An order, not a filter.
        ->and($oldest['filtered'])->toBeFalse()
        ->and($oldest['pagination']['next'])->toBe('/admin/protokoll?reihenfolge=alt&seite=2');

    $this->actingAs($admin, 'admin')->get('/admin/protokoll?reihenfolge=neueste')
        ->assertSessionHasErrors(['reihenfolge' => 'Diese Reihenfolge gibt es nicht. Das Protokoll zeigt die neuesten Einträge zuerst.']);
});
