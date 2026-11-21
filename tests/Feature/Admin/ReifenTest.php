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
use App\Support\EditStamp;
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

it('offers tyre makers in the brand list, not wheel brands — and keeps the brand a tyre already has (the admin audit\'s F-09)', function (): void {
    Brand::factory()->create(['name' => 'BBS', 'is_wheel_brand' => true]);
    Brand::factory()->create(['name' => 'Continental', 'is_wheel_brand' => false]);
    $both = Brand::factory()->create(['name' => 'Borbet', 'is_wheel_brand' => true]);
    $tyre = TyreVariant::factory()->create(['brand_id' => $both->id, 'is_demo' => false]);

    $offered = fn (string $url): array => array_column($this->actingAs(reifenAdmin(), 'admin')->get($url)->viewData('page')['props']['brands'], 'label');

    expect($offered('/admin/reifen/neu'))->toContain('Continental')->toContain('Borbet')->not->toContain('BBS')
        // The tyre shown keeps its own brand in the list, whatever kind it is.
        ->and($offered("/admin/reifen/{$tyre->id}"))->toContain('Borbet');
});

it('makes a tyre with its EU label: a tyre brand, the symbol’s rank from the table, offered, and one Protokoll entry @admin-210', function (): void {
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload())
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', ReifenController::CREATED);

    $tyre = TyreVariant::query()->with('brand')->sole();

    expect($tyre->brand->name)->toBe('Prüfreifen')
        // A tyre brand does not join the homepage's wall of wheel brands.
        ->and($tyre->brand->is_wheel_brand)->toBeFalse()
        ->and($tyre->label())->toBe('225/45 R18 95Y')
        // Y is rank 16 of the table (J and K below L, D-442; (W) below Y, D-453) — never typed, never compared as a letter.
        ->and($tyre->speed_rank)->toBe(16)
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
            ->where('models.0.offered', 0)
            ->where('models.0.missingLabels', 1));
});

it('lists the tyre models with what their sizes add up to, and finds one by any of its sizes: stand, size, diameter, season @admin-210', function (): void {
    $brand = Brand::factory()->named('Prüfreifen')->create(['is_wheel_brand' => false]);
    TyreVariant::factory()->for($brand)->size(225, 45, 18.0)->create(['name' => 'Grip 7', 'season' => 'sommer', 'price_cents' => 12_900]);
    TyreVariant::factory()->for($brand)->size(245, 40, 19.0)->create(['name' => 'Grip 7', 'season' => 'sommer', 'available' => false, 'price_cents' => 15_900]);
    TyreVariant::factory()->for($brand)->size(225, 45, 18.0)->unlabelled()->create(['name' => 'Winter 3', 'season' => 'winter']);
    TyreVariant::factory()->for($brand)->size(205, 55, 16.0)->unlabelled()->create(['name' => 'Beispiel', 'season' => 'sommer', 'is_demo' => true]);

    $names = fn (string $query): array => collect(
        $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen'.$query)->assertOk()->viewData('page')['props']['models']
    )->pluck('name')->all();

    expect($names(''))->toBe(['Beispiel', 'Grip 7', 'Winter 3'])
        ->and($names('?stand=im-shop'))->toBe(['Grip 7'])
        ->and($names('?stand=nicht-verfuegbar'))->toBe(['Grip 7'])
        ->and($names('?stand=label-fehlt'))->toBe(['Winter 3'])
        ->and($names('?stand=demo'))->toBe(['Beispiel'])
        ->and($names('?q=225/45'))->toBe(['Grip 7', 'Winter 3'])
        ->and($names('?q=245%2F40+R19'))->toBe(['Grip 7'])
        ->and($names('?q=Winter'))->toBe(['Winter 3'])
        ->and($names('?zoll=19'))->toBe(['Grip 7'])
        ->and($names('?saison=winter'))->toBe(['Winter 3']);

    $row = collect($this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen')->viewData('page')['props']['models'])->firstWhere('name', 'Grip 7');

    expect($row)->not->toHaveKey('suppliers')
        ->and($row)->toMatchArray([
            'brand' => 'Prüfreifen',
            'season' => 'sommer',
            'sizes' => 2,
            'diameters' => "18–19\u{00A0}Zoll",
            'priceFromCents' => 12_900,
            'missingLabels' => 0,
            'offered' => 1,
            'photos' => 0,
            'thumb' => null,
            'demo' => false,
        ])->and($row['href'])->toStartWith('/admin/reifen/modell/');

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
    'a price that does not read' => [['price' => 'teuer'], 'price'],
    'no season' => [['season' => ''], 'season'],
    'no brand at all' => [['brand_new' => ''], 'brand_id'],
]);

// D-481: the form of a size is checked, not its figures — the client's „305/70 R22.5 160F“ among them. A symbol the shop's
// table does not rank (F, Z) is kept with rank 0 and matched exactly, never by rank (D-484).
it('takes any figure in the form of a size, and keeps a symbol it cannot rank with rank 0 (D-481, D-484)', function (array $override, array $stored): void {
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload($override))->assertSessionHasNoErrors();

    expect(TyreVariant::query()->sole()->only(array_keys($stored)))->toEqual($stored);
})->with([
    'a load index above 120' => [['load_index' => '121'], ['load_index' => 121]],
    'a symbol the table does not rank' => [['speed_symbol' => 'Z'], ['speed_symbol' => 'Z', 'speed_rank' => 0]],
    'an aspect between the steps' => [['aspect' => '42'], ['aspect' => 42]],
    'a rim in halves, written with a comma' => [['diameter_in' => '16,5'], ['diameter_in' => 16.5]],
    'the client\'s truck size' => [['width_mm' => '305', 'aspect' => '70', 'diameter_in' => '22.5', 'load_index' => '160', 'speed_symbol' => 'F'], ['width_mm' => 305, 'aspect' => 70, 'diameter_in' => 22.5, 'load_index' => 160, 'speed_symbol' => 'F', 'speed_rank' => 0]],
    // The rest of the brief's table, the deep check of 21.11.2026: as the catalogue holds a tyre — one index, one symbol.
    'his truck size with a comma' => [['width_mm' => '305', 'aspect' => '70', 'diameter_in' => '22,5', 'load_index' => '160', 'speed_symbol' => 'F'], ['diameter_in' => 22.5, 'load_index' => 160, 'speed_symbol' => 'F']],
    '315/80 R22.5 156 L' => [['width_mm' => '315', 'aspect' => '80', 'diameter_in' => '22.5', 'load_index' => '156', 'speed_symbol' => 'L'], ['width_mm' => 315, 'aspect' => 80, 'diameter_in' => 22.5, 'load_index' => 156, 'speed_symbol' => 'L']],
    '225/45 R17 91 (Y)' => [['width_mm' => '225', 'aspect' => '45', 'diameter_in' => '17', 'load_index' => '91', 'speed_symbol' => '(Y)'], ['width_mm' => 225, 'aspect' => 45, 'diameter_in' => 17.0, 'load_index' => 91, 'speed_symbol' => '(Y)']],
    '205/55 R16 94 A8' => [['width_mm' => '205', 'aspect' => '55', 'diameter_in' => '16', 'load_index' => '94', 'speed_symbol' => 'A8'], ['load_index' => 94, 'speed_symbol' => 'A8', 'speed_rank' => 0]],
    '265/70 R19,5 140 M' => [['width_mm' => '265', 'aspect' => '70', 'diameter_in' => '19,5', 'load_index' => '140', 'speed_symbol' => 'M'], ['diameter_in' => 19.5, 'load_index' => 140, 'speed_symbol' => 'M']],
]);

it('takes a tyre with a load index above 109, as a heavy car needs, up to the 120 the table prints (D-310) @admin-210', function (): void {
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload(['width_mm' => '285', 'aspect' => '40', 'diameter_in' => '22', 'load_index' => '110']))
        ->assertSessionHasNoErrors();
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload(['width_mm' => '285', 'aspect' => '45', 'diameter_in' => '22', 'load_index' => '120', 'eprel_id' => '381091']))
        ->assertSessionHasNoErrors();

    expect(TyreVariant::query()->orderBy('load_index')->pluck('load_index')->all())->toBe([110, 120]);
});

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
    TyreVariant::factory()->size(225, 45, 18.0)->create(['name' => 'Beschriftet', 'eprel_id' => '381090']);
    TyreVariant::factory()->size(381, 40, 19.0)->create(['name' => 'Gemessen', 'eprel_id' => '555555']);

    $names = fn (string $query): array => collect(
        $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen'.$query)->assertOk()->viewData('page')['props']['models']
    )->pluck('name')->sort()->values()->all();

    // `381090` read as a size is 381/09 and finds nothing; as an EPREL number it finds its tyre. `381` finds both.
    expect($names('?q=381090'))->toBe(['Beschriftet'])
        ->and($names('?q=381'))->toBe(['Beschriftet', 'Gemessen'])
        ->and($names('?q=225/45'))->toBe(['Beschriftet']);
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

// D-496, found by the click-through of release 46: the form showed 22,5 as „22“, so the next save would have cut the half inch.
it('keeps a half inch as written — in the form, the sold lock, the duplicate check, the list, its filter and its search (D-496)', function (): void {
    $truck = ['width_mm' => '305', 'aspect' => '70', 'diameter_in' => '22,5', 'load_index' => '160', 'speed_symbol' => 'F', 'eprel_id' => ''];
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload($truck))->assertSessionHasNoErrors();
    $tyre = TyreVariant::query()->sole();

    $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen/'.$tyre->id)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('tyre.diameter', '22,5'));

    // One tyre twice is one tyre twice at 22,5 too; 22 is another size.
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload($truck + ['brand_id' => $tyre->brand_id, 'brand_new' => '']))
        ->assertSessionHasErrors(['name' => TyreVariantRequest::DUPLICATE]);
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload(['diameter_in' => '22'] + $truck + ['brand_id' => $tyre->brand_id, 'brand_new' => '']))
        ->assertSessionHasNoErrors();

    // Sold: the form's own „22,5“ (or „22.5“) changes nothing; „22“ is a change of size, refused.
    OrderLine::factory()->create(['order_id' => Order::factory()->create()->id, 'wheel_config_id' => null, 'tyre_variant_id' => $tyre->id, 'quantity' => 4]);
    $kept = ['brand_id' => $tyre->brand_id, 'brand_new' => ''];

    foreach (['22,5', '22.5'] as $same) {
        $this->actingAs(reifenAdmin(), 'admin')->put('/admin/reifen/'.$tyre->id, reifenPayload($kept + ['diameter_in' => $same] + $truck))->assertSessionHasNoErrors();
    }

    $this->actingAs(reifenAdmin(), 'admin')->put('/admin/reifen/'.$tyre->id, reifenPayload($kept + ['diameter_in' => '22'] + $truck))
        ->assertSessionHasErrors(['diameter_in' => TyreVariantRequest::SOLD]);

    expect((float) $tyre->refresh()->diameter_in)->toBe(22.5);

    $page = fn (string $query): array => $this->actingAs(reifenAdmin(), 'admin')->get('/admin/reifen'.$query)->assertOk()->viewData('page')['props'];

    expect(collect($page('')['models'])->pluck('diameters')->all())->toBe(["22–22,5\u{00A0}Zoll"])
        ->and(collect($page('')['options']['diameters'])->pluck('label')->all())->toBe(['22 Zoll', '22,5 Zoll'])
        ->and($page('?zoll=22,5')['models'])->toHaveCount(1)
        ->and($page('?q=305%2F70+R22,5')['models'])->toHaveCount(1)
        ->and($page('?q=305%2F70+R22.5')['models'])->toHaveCount(1);
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

it('refuses a tyre saved from a page opened before the last save, and keeps that save (the admin audit\'s F-25)', function (): void {
    $this->actingAs(reifenAdmin(), 'admin')->post('/admin/reifen', reifenPayload())->assertSessionHasNoErrors();
    $tyre = TyreVariant::query()->latest('id')->firstOrFail();
    $url = '/admin/reifen/'.$tyre->id;
    $stale = $this->actingAs(reifenAdmin(), 'admin')->get($url)->viewData('page')['props']['stamp'];

    // Another tab lowers the price; this tab still holds the old one beside its own change.
    $this->actingAs(reifenAdmin(), 'admin')->from($url)->put($url, reifenPayload(['brand_id' => $tyre->brand_id, 'brand_new' => null, 'price' => '119,90']))
        ->assertSessionHasNoErrors();
    $this->actingAs(reifenAdmin(), 'admin')->from($url)->withHeader(EditStamp::HEADER, $stale)
        ->put($url, reifenPayload(['brand_id' => $tyre->brand_id, 'brand_new' => null, 'eu_noise_db' => '70']))
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect($tyre->refresh()->price_cents)->toBe(11_990)->and($tyre->eu_noise_db)->toBe(71);
});
