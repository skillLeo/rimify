<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\ReifenController;
use App\Http\Requests\Admin\TyreVariantRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Brand;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\TyreVariant;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/*
 * Katalog › Reifen (his admin item 10, D-302): tyres made and kept in the admin — one size of one profile per record, with
 * the EU tyre label from the start. A real tyre is offered only while it is available (D-301) and its label is complete on
 * record (D-303); one saved with the label incomplete is kept and listed for the backfill. A demonstration tyre is shown
 * and never changed. Every write asks TyreVariantPolicy (R-11) and leaves one Protokoll entry.
 */

beforeEach(function (): void {
    $this->seed([AccessSeeder::class, ReferenceDataSeeder::class]);
});

function reifenAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @param  array<string, mixed>  $override */
function reifenPayload(array $override = []): array
{
    return array_replace([
        'brand_id' => null,
        'brand_new' => 'Prüfreifen',
        'name' => 'Grip 7',
        'season' => 'sommer',
        'width_mm' => '225',
        'aspect' => '45',
        'diameter_in' => '18',
        'load_index' => '95',
        'speed_symbol' => 'y',
        'eu_fuel_class' => 'b',
        'eu_wet_grip_class' => 'A',
        'eu_noise_db' => '71',
        'eu_noise_class' => 'B',
        'eu_snow_grip' => false,
        'eu_ice_grip' => false,
        'eprel_id' => ' 381 090 ',
        'price' => '129,00',
        'available' => true,
    ], $override);
}

it('makes a tyre with its EU label: a tyre brand, the symbol’s rank from the table, offered, and one Protokoll entry @admin-210', function (): void {
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload())
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', ReifenController::CREATED);

    $tyre = TyreVariant::query()->with('brand')->sole();

    expect($tyre->brand->name)->toBe('Prüfreifen')
        // A tyre brand does not join the homepage's wall of wheel brands.
        ->and($tyre->brand->is_wheel_brand)->toBeFalse()
        ->and($tyre->label())->toBe('225/45 R18 95Y')
        // Y is rank 13 of the table — never typed, never compared as a letter.
        ->and($tyre->speed_rank)->toBe(13)
        ->and($tyre->eu_fuel_class)->toBe('B')
        ->and($tyre->eu_snow_grip)->toBeFalse()
        ->and($tyre->eprel_id)->toBe('381090')
        ->and($tyre->price_cents)->toBe(12_900)
        ->and($tyre->is_demo)->toBeFalse()
        ->and($tyre->offered())->toBeTrue();

    $entry = AuditLog::query()->where('description', 'tyre.created')->sole();
    expect($entry->properties['name'])->toBe('Prüfreifen Grip 7 225/45 R18 95Y')
        ->and($entry->properties['offered'])->toBeTrue();
});

it('keeps a tyre saved with its label incomplete, offers it not, and says what is missing (D-303) @admin-210', function (): void {
    $payload = reifenPayload(['eu_noise_class' => '', 'eu_ice_grip' => null, 'eprel_id' => '']);

    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', $payload)->assertSessionHasNoErrors();
    $tyre = TyreVariant::query()->sole();

    expect($tyre->offered())->toBeFalse()
        // Unanswered is not „Nein“: the ice grip is missing, not absent.
        ->and($tyre->eu_ice_grip)->toBeNull()
        ->and($tyre->missingLabel())->toBe(['Rollgeräuschklasse', 'Eisgriffigkeit', 'EPREL-Nummer']);

    $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen/'.$tyre->id)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Reifen/Edit')
            ->where('tyre.offered', false)
            ->where('tyre.missingLabel', ['Rollgeräuschklasse', 'Eisgriffigkeit', 'EPREL-Nummer'])
            ->where('tyre.ice', null)
            ->where('admin.breadcrumbs.2.label', 'Prüfreifen Grip 7 225/45 R18 95Y'));

    $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Reifen/Index')
            ->where('missingLabels', 1)
            ->where('tyres.0.offered', false)
            ->where('tyres.0.label', null)
            ->where('tyres.0.missingLabel', ['Rollgeräuschklasse', 'Eisgriffigkeit', 'EPREL-Nummer']));
});

it('lists the tyres by brand, profile and size, and filters them by stand, size, diameter and season @admin-210', function (): void {
    $brand = Brand::factory()->named('Prüfreifen')->create(['is_wheel_brand' => false]);
    $sold = TyreVariant::factory()->for($brand)->size(225, 45, 18.0)->create(['name' => 'Grip 7', 'season' => 'sommer']);
    $unavailable = TyreVariant::factory()->for($brand)->size(245, 40, 19.0)->create(['name' => 'Grip 7', 'season' => 'sommer', 'available' => false]);
    $unlabelled = TyreVariant::factory()->for($brand)->size(225, 45, 18.0)->unlabelled()->create(['name' => 'Winter 3', 'season' => 'winter']);
    $demo = TyreVariant::factory()->for($brand)->size(205, 55, 16.0)->unlabelled()->create(['name' => 'Beispiel', 'season' => 'sommer', 'is_demo' => true]);

    $ids = fn (string $query): array => collect(
        $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen'.$query)->assertOk()->viewData('page')['props']['tyres']
    )->pluck('id')->all();

    expect($ids(''))->toBe([$demo->id, $sold->id, $unavailable->id, $unlabelled->id])
        ->and($ids('?stand=im-shop'))->toBe([$sold->id])
        ->and($ids('?stand=nicht-verfuegbar'))->toBe([$unavailable->id])
        ->and($ids('?stand=label-fehlt'))->toBe([$unlabelled->id])
        ->and($ids('?stand=demo'))->toBe([$demo->id])
        ->and($ids('?q=225/45'))->toBe([$sold->id, $unlabelled->id])
        ->and($ids('?q=245%2F40+R19'))->toBe([$unavailable->id])
        ->and($ids('?q=Winter'))->toBe([$unlabelled->id])
        ->and($ids('?zoll=19'))->toBe([$unavailable->id])
        ->and($ids('?saison=winter'))->toBe([$unlabelled->id]);

    $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen?stand=gibt-es-nicht')
        ->assertRedirect('/admin/reifen')
        ->assertSessionHasErrors(['stand']);
});

it('refuses what does not read, under its own field, and never guesses @admin-210', function (array $override, string $field): void {
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload($override))->assertSessionHasErrors([$field]);

    expect(TyreVariant::query()->count())->toBe(0);
})->with([
    'a fuel class the regulation does not know' => [['eu_fuel_class' => 'F'], 'eu_fuel_class'],
    'a noise class D' => [['eu_noise_class' => 'D'], 'eu_noise_class'],
    'a noise no tyre makes' => [['eu_noise_db' => '120'], 'eu_noise_db'],
    'an EPREL number with letters' => [['eprel_id' => 'EU-381090'], 'eprel_id'],
    'a load index beyond the table' => [['load_index' => '112'], 'load_index'],
    'a speed symbol not on the list' => [['speed_symbol' => 'Z'], 'speed_symbol'],
    'an aspect between the steps' => [['aspect' => '42'], 'aspect'],
    'a diameter in halves' => [['diameter_in' => '16,5'], 'diameter_in'],
    'a price that does not read' => [['price' => 'teuer'], 'price'],
    'no season' => [['season' => ''], 'season'],
    'no brand at all' => [['brand_new' => ''], 'brand_id'],
]);

it('refuses one tyre twice, and one EPREL number on two tyres @admin-210', function (): void {
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload())->assertSessionHasNoErrors();

    // The same brand typed again, the same profile, size, load index and symbol: the same tyre.
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload(['brand_new' => 'prüfreifen', 'eprel_id' => '999999']))
        ->assertSessionHasErrors(['name' => TyreVariantRequest::DUPLICATE]);

    // Another size, the first one's EPREL number: refused, naming the tyre that has it — the list's search finds it.
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload(['width_mm' => '245']))
        ->assertSessionHasErrors(['eprel_id' => sprintf(TyreVariantRequest::EPREL_TAKEN, 'Prüfreifen Grip 7 225/45 R18 95Y')]);

    expect(TyreVariant::query()->count())->toBe(1);
});

it('finds a tyre by its EPREL number, though the number starts like a size @admin-210', function (): void {
    $labelled = TyreVariant::factory()->size(225, 45, 18.0)->create(['eprel_id' => '381090']);
    $sized = TyreVariant::factory()->size(381, 40, 19.0)->create(['eprel_id' => '555555']);

    $ids = fn (string $query): array => collect(
        $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen'.$query)->assertOk()->viewData('page')['props']['tyres']
    )->pluck('id')->sort()->values()->all();

    // `381090` read as a size is 381/09 and finds nothing; as an EPREL number it finds its tyre. `381` finds both.
    expect($ids('?q=381090'))->toBe([$labelled->id])
        ->and($ids('?q=381'))->toBe([$labelled->id, $sized->id])
        ->and($ids('?q=225/45'))->toBe([$labelled->id]);
});

it('says every refusal of a save in one round: a wrong width does not hide a price of 0,00 @admin-210', function (): void {
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload(['width_mm' => '22x', 'price' => '0,00']))
        ->assertSessionHasErrors(['width_mm', 'price']);
});

it('keeps a sold tyre’s size, load index and symbol as sold — the order names its Auflagen by that size @admin-210', function (): void {
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload())->assertSessionHasNoErrors();
    $tyre = TyreVariant::query()->sole();
    $order = Order::factory()->create();
    OrderLine::factory()->create(['order_id' => $order->id, 'wheel_config_id' => null, 'tyre_variant_id' => $tyre->id, 'quantity' => 4]);
    $kept = ['brand_id' => $tyre->brand_id, 'brand_new' => ''];

    $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen/'.$tyre->id)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('tyre.sold', true));

    foreach (['width_mm' => '235', 'aspect' => '40', 'diameter_in' => '19', 'load_index' => '96', 'speed_symbol' => 'W'] as $field => $value) {
        $this->actingAs(reifenAdmin(), 'admin')->put('/admin/reifen/'.$tyre->id, reifenPayload($kept + [$field => $value]))
            ->assertSessionHasErrors([$field => TyreVariantRequest::SOLD]);
    }

    expect($tyre->refresh()->label())->toBe('225/45 R18 95Y');

    // The rest is the shop's to change: the price, the label, whether it is available.
    $this->actingAs(reifenAdmin(), 'admin')->put('/admin/reifen/'.$tyre->id, reifenPayload($kept + ['price' => '139,00', 'eu_noise_db' => '70']))
        ->assertSessionHasNoErrors();

    expect($tyre->refresh()->price_cents)->toBe(13_900);
});

it('changes a tyre, names what changed in the Protokoll, and stops offering one marked not available @admin-210', function (): void {
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload())->assertSessionHasNoErrors();
    $tyre = TyreVariant::query()->sole();

    $this->actingAs(reifenAdmin(), 'admin')->put('/admin/reifen/'.$tyre->id, reifenPayload(['brand_id' => $tyre->brand_id, 'brand_new' => '', 'price' => '139,00', 'available' => false]))
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', ReifenController::SAVED);

    expect($tyre->refresh()->price_cents)->toBe(13_900)
        ->and($tyre->available)->toBeFalse()
        ->and($tyre->offered())->toBeFalse();

    $entry = AuditLog::query()->where('description', 'tyre.updated')->sole();
    expect($entry->properties['changed'])->toBe(['price_cents', 'available'])
        ->and($entry->properties['offered'])->toBeFalse();
});

it('starts „Weitere Größe“ from a tyre’s brand, profile and season — never its size or its label @admin-210', function (): void {
    $tyre = TyreVariant::factory()->size(225, 45, 18.0)->create(['name' => 'Grip 7', 'season' => 'winter']);

    $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen/neu?wie='.$tyre->id)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Reifen/Edit')
            ->where('tyre', null)
            ->where('template', ['brandId' => $tyre->brand_id, 'name' => 'Grip 7', 'season' => 'winter']));
});

it('takes a tyre out of the catalogue: kept on disk, offered no more, and written to the Protokoll @admin-210', function (): void {
    $tyre = TyreVariant::factory()->create();

    $this->actingAs(reifenAdmin(), 'admin')->delete('/admin/reifen/'.$tyre->id)
        ->assertRedirect('/admin/reifen')
        ->assertSessionHas('toast', ReifenController::DELETED);

    expect(TyreVariant::query()->find($tyre->id))->toBeNull()
        ->and(TyreVariant::withTrashed()->find($tyre->id))->not->toBeNull()
        ->and(AuditLog::query()->where('description', 'tyre.deleted')->exists())->toBeTrue();
});

it('shows a demonstration tyre and never changes or removes it @admin-210', function (): void {
    $demo = TyreVariant::factory()->unlabelled()->create(['is_demo' => true]);

    $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen/'.$demo->id)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('tyre.demo', true)->where('tyre.missingLabel', []));

    $this->actingAs(reifenAdmin(), 'admin')->put('/admin/reifen/'.$demo->id, reifenPayload(['brand_id' => $demo->brand_id, 'brand_new' => '']))->assertForbidden();
    $this->actingAs(reifenAdmin(), 'admin')->delete('/admin/reifen/'.$demo->id)->assertForbidden();

    expect($demo->refresh()->eu_fuel_class)->toBeNull()
        ->and($demo->trashed())->toBeFalse();
});

it('asks the catalogue’s rights on the server for every step (R-11) @admin-210', function (): void {
    $role = (int) DB::table('roles')->where('name', 'catalogue-manager')->value('id');
    DB::table('role_permissions')->where('role_id', $role)->where('module', 'catalogue')->whereIn('action', ['create', 'delete'])->update(['allowed' => false]);
    $tyre = TyreVariant::factory()->create();
    $manager = reifenAdmin('catalogue-manager');

    $this->actingAs($manager, 'admin')->get('/admin/reifen')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('can', ['create' => false, 'edit' => true, 'delete' => false]));
    $this->actingAs($manager, 'admin')->get('/admin/reifen/neu')->assertForbidden();
    $this->actingAs($manager, 'admin')->post('/admin/reifen', reifenPayload())->assertForbidden();
    $this->actingAs($manager, 'admin')->delete('/admin/reifen/'.$tyre->id)->assertForbidden();
    // Editing stays theirs.
    $this->actingAs($manager, 'admin')->put('/admin/reifen/'.$tyre->id, reifenPayload(['brand_id' => $tyre->brand_id, 'brand_new' => '', 'eprel_id' => '']))->assertSessionHasNoErrors();
});

it('shows the list to no one without the catalogue’s view right (R-11) @admin-210', function (): void {
    $role = (int) DB::table('roles')->where('name', 'catalogue-manager')->value('id');
    DB::table('role_permissions')->where('role_id', $role)->where('module', 'catalogue')->where('action', 'view')->update(['allowed' => false]);

    $this->actingAs(reifenAdmin('catalogue-manager'), 'admin')->get('/admin/reifen')->assertForbidden();
});
