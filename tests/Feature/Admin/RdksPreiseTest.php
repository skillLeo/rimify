<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\OrderLine;
use App\Models\TpmsSensorPrice;
use App\Models\Vehicle;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia;

/**
 * RDKS-Sensorpreise je Marke (docs/specs/komplettrad.md §6, §9.2).
 *
 * The price is keyed on MakeName::key(), so `VW` and `Volkswagen` are one make; a price of 0,00 €
 * is refused because it would claim the sensors are free; and a price change never touches an
 * order that was already placed — its lines are frozen at purchase (§6.6). Every write is
 * authorised on the server (R-11) and a denied attempt is evidence in `audit_logs`.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

/** The seeded account for a role, as AccessSeeder names it. */
function rdksAdmin(string $role): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function rdksPayload(array $overrides = []): array
{
    return [
        'make' => 'Volkswagen',
        'price' => '49,00',
        'active' => true,
        ...$overrides,
    ];
}

/** @return Builder<AuditLog> */
function rdksAudit(string $event): Builder
{
    return AuditLog::query()->where('log_name', 'admin')->where('description', $event);
}

it('sends a guest to the sign-in screen for every route', function (): void {
    $price = TpmsSensorPrice::factory()->create();

    $this->get('/admin/rdks-preise')->assertRedirect('/admin/anmelden');
    $this->post('/admin/rdks-preise', rdksPayload())->assertRedirect('/admin/anmelden');
    $this->patch('/admin/rdks-preise/'.$price->getKey(), rdksPayload())->assertRedirect('/admin/anmelden');
    $this->delete('/admin/rdks-preise/'.$price->getKey())->assertRedirect('/admin/anmelden');

    expect(TpmsSensorPrice::query()->count())->toBe(1);
});

it('lets a writing role create, edit and delete a price', function (string $role): void {
    $admin = rdksAdmin($role);

    $this->actingAs($admin, 'admin')
        ->from('/admin/rdks-preise')
        ->post('/admin/rdks-preise', rdksPayload(['make' => 'vw']))
        ->assertRedirect('/admin/rdks-preise')
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Gespeichert.');

    $price = TpmsSensorPrice::query()->sole();

    // The key unifies the spelling; the label keeps what the admin meant.
    expect($price->make_key)->toBe('volkswagen')
        ->and($price->make_label_de)->toBe('VW')
        ->and($price->price_cents)->toBe(4900)
        ->and($price->currency)->toBe('EUR')
        ->and($price->active)->toBeTrue();

    $this->actingAs($admin, 'admin')
        ->from('/admin/rdks-preise')
        ->patch('/admin/rdks-preise/'.$price->getKey(), rdksPayload(['make' => 'Volkswagen', 'price' => '59,00', 'active' => false]))
        ->assertRedirect('/admin/rdks-preise')
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Gespeichert.');

    $price->refresh();

    expect($price->make_key)->toBe('volkswagen')
        ->and($price->make_label_de)->toBe('Volkswagen')
        ->and($price->price_cents)->toBe(5900)
        ->and($price->active)->toBeFalse();

    $this->actingAs($admin, 'admin')
        ->from('/admin/rdks-preise')
        ->delete('/admin/rdks-preise/'.$price->getKey())
        ->assertRedirect('/admin/rdks-preise')
        ->assertSessionHas('toast', 'Gelöscht.');

    // Soft-deleted, never gone: an order line may still point at this id.
    expect(TpmsSensorPrice::query()->count())->toBe(0)
        ->and(TpmsSensorPrice::withTrashed()->count())->toBe(1);
})->with(['super-admin', 'catalogue-manager']);

it('refuses the index and every mutation to a role without the catalogue module', function (string $role): void {
    $existing = TpmsSensorPrice::factory()->ofMake('porsche', 'Porsche')->create(['price_cents' => 18900]);
    $admin = rdksAdmin($role);

    $this->actingAs($admin, 'admin')->get('/admin/rdks-preise')->assertForbidden();
    $this->actingAs($admin, 'admin')->post('/admin/rdks-preise', rdksPayload())->assertForbidden();
    $this->actingAs($admin, 'admin')
        ->patch('/admin/rdks-preise/'.$existing->getKey(), rdksPayload(['make' => 'Porsche', 'price' => '1,00']))
        ->assertForbidden();
    $this->actingAs($admin, 'admin')->delete('/admin/rdks-preise/'.$existing->getKey())->assertForbidden();

    $existing->refresh();

    expect(TpmsSensorPrice::withTrashed()->count())->toBe(1)
        ->and($existing->price_cents)->toBe(18900)
        ->and($existing->trashed())->toBeFalse();
})->with(['content-editor', 'accountant']);

it('lets a reading role view the list and refuses every write', function (string $role): void {
    $existing = TpmsSensorPrice::factory()->ofMake('porsche', 'Porsche')->create(['price_cents' => 18900]);
    $admin = rdksAdmin($role);

    $this->actingAs($admin, 'admin')
        ->get('/admin/rdks-preise')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Rdks/Index')
            ->has('prices', 1)
            ->where('can.create', false)
            ->where('can.update', false)
            ->where('can.delete', false)
        );

    $this->actingAs($admin, 'admin')->post('/admin/rdks-preise', rdksPayload())->assertForbidden();
    $this->actingAs($admin, 'admin')
        ->patch('/admin/rdks-preise/'.$existing->getKey(), rdksPayload(['make' => 'Porsche', 'price' => '1,00']))
        ->assertForbidden();
    $this->actingAs($admin, 'admin')->delete('/admin/rdks-preise/'.$existing->getKey())->assertForbidden();

    $existing->refresh();

    expect(TpmsSensorPrice::withTrashed()->count())->toBe(1)
        ->and($existing->price_cents)->toBe(18900)
        ->and($existing->trashed())->toBeFalse();
})->with(['support-agent', 'compliance-editor', 'order-manager']);

it('keys VW and Volkswagen to one make and refuses the second with the German sentence', function (): void {
    $admin = rdksAdmin('super-admin');

    $this->actingAs($admin, 'admin')
        ->post('/admin/rdks-preise', rdksPayload(['make' => 'VW']))
        ->assertSessionHasNoErrors();
    $this->actingAs($admin, 'admin')
        ->post('/admin/rdks-preise', rdksPayload(['make' => 'Volkswagen', 'price' => '99,00']))
        ->assertSessionHasErrors([
            'makeKey' => 'Für diese Marke ist schon ein Preis hinterlegt – bearbeite ihn dort.',
        ]);

    $price = TpmsSensorPrice::query()->sole();

    expect($price->make_key)->toBe('volkswagen')
        ->and($price->price_cents)->toBe(4900);
});

it('restores a deleted make instead of colliding with it', function (): void {
    $admin = rdksAdmin('super-admin');

    $this->actingAs($admin, 'admin')
        ->post('/admin/rdks-preise', rdksPayload(['make' => 'Porsche', 'price' => '189,00']))
        ->assertSessionHasNoErrors();

    $porsche = TpmsSensorPrice::query()->sole();

    $this->actingAs($admin, 'admin')->delete('/admin/rdks-preise/'.$porsche->getKey())->assertRedirect();

    expect(TpmsSensorPrice::onlyTrashed()->count())->toBe(1)
        ->and(TpmsSensorPrice::forMake('Porsche'))->toBeNull();

    $this->actingAs($admin, 'admin')
        ->post('/admin/rdks-preise', rdksPayload(['make' => 'porsche', 'price' => '199,00']))
        ->assertSessionHasNoErrors();

    $restored = TpmsSensorPrice::query()->sole();

    expect($restored->getKey())->toBe($porsche->getKey())
        ->and($restored->trashed())->toBeFalse()
        ->and($restored->price_cents)->toBe(19900)
        ->and($restored->make_label_de)->toBe('Porsche')
        ->and(TpmsSensorPrice::withTrashed()->count())->toBe(1)
        ->and(TpmsSensorPrice::forMake('Porsche')?->price_cents)->toBe(19900);
});

it('refuses a price of 0,00 because it would claim the sensors are free', function (string $input): void {
    $this->actingAs(rdksAdmin('super-admin'), 'admin')
        ->post('/admin/rdks-preise', rdksPayload(['price' => $input]))
        ->assertSessionHasErrors([
            'priceCents' => 'Ein Preis von 0,00 € würde behaupten, die Sensoren wären kostenlos. Lass die Marke lieber ganz weg.',
        ]);

    expect(TpmsSensorPrice::query()->count())->toBe(0);
})->with(['0,00', '0']);

it('refuses an ambiguous price with the sentence that names the fix', function (string $input): void {
    $this->actingAs(rdksAdmin('super-admin'), 'admin')
        ->post('/admin/rdks-preise', rdksPayload(['price' => $input]))
        ->assertSessionHasErrors(['priceCents' => 'Bitte schreib den Preis deutsch, zum Beispiel 49,00.']);

    expect(TpmsSensorPrice::query()->count())->toBe(0);
})->with(['49.00', '1.42,00', '']);

it('refuses an empty make', function (): void {
    $this->actingAs(rdksAdmin('super-admin'), 'admin')
        ->post('/admin/rdks-preise', rdksPayload(['make' => '   ']))
        ->assertSessionHasErrors(['makeKey' => 'Bitte gib die Automarke an.']);

    expect(TpmsSensorPrice::query()->count())->toBe(0);
});

it('parses German money input: 1.425,00 € becomes 142500 cents', function (): void {
    $this->actingAs(rdksAdmin('super-admin'), 'admin')
        ->post('/admin/rdks-preise', rdksPayload(['price' => "1.425,00\u{00A0}€"]))
        ->assertSessionHasNoErrors();

    expect(TpmsSensorPrice::query()->sole()->price_cents)->toBe(142500);
});

it('never changes a placed order when the price changes', function (): void {
    $price = TpmsSensorPrice::factory()->ofMake('volkswagen', 'Volkswagen')->create(['price_cents' => 4900]);

    $line = OrderLine::factory()->create([
        'kind' => 'ACCESSORY',
        'label' => 'RDKS-Sensoren · Volkswagen',
        'quantity' => 4,
        'unit_price_cents' => 4900,
        'line_total_cents' => 19600,
        'tpms_sensor_price_id' => $price->getKey(),
    ]);

    $this->actingAs(rdksAdmin('super-admin'), 'admin')
        ->patch('/admin/rdks-preise/'.$price->getKey(), rdksPayload(['price' => '189,00']))
        ->assertSessionHasNoErrors();

    $line->refresh();

    expect($price->refresh()->price_cents)->toBe(18900)
        ->and($line->unit_price_cents)->toBe(4900)
        ->and($line->line_total_cents)->toBe(19600)
        ->and($line->label)->toBe('RDKS-Sensoren · Volkswagen');
});

it('refuses renaming a make onto a deleted one and names the route forward', function (): void {
    $admin = rdksAdmin('super-admin');
    $porsche = TpmsSensorPrice::factory()->ofMake('porsche', 'Porsche')->create(['price_cents' => 18900]);
    $audi = TpmsSensorPrice::factory()->ofMake('audi', 'Audi')->create(['price_cents' => 5900]);

    $this->actingAs($admin, 'admin')->delete('/admin/rdks-preise/'.$porsche->getKey())->assertRedirect();

    $this->actingAs($admin, 'admin')
        ->patch('/admin/rdks-preise/'.$audi->getKey(), rdksPayload(['make' => 'Porsche', 'price' => '59,00']))
        ->assertSessionHasErrors([
            'makeKey' => 'Für diese Marke gab es schon einmal einen Preis. Leg ihn als neuen Preis an – dann stellen wir den gelöschten wieder her.',
        ]);

    expect($audi->refresh()->make_key)->toBe('audi');
});

it('logs a denied write to audit_logs with its ability and route', function (): void {
    $this->actingAs(rdksAdmin('accountant'), 'admin')
        ->post('/admin/rdks-preise', rdksPayload())
        ->assertForbidden();

    $entry = rdksAudit('permission.denied')->sole();

    expect($entry->properties->get('ability'))->toBe('create')
        ->and($entry->properties->get('route'))->toBe('admin.rdks.store')
        ->and($entry->actor_email)->toBe('accountant@rimify.test')
        ->and(TpmsSensorPrice::query()->count())->toBe(0);
});

it('writes an audit entry for create, update and delete', function (): void {
    $admin = rdksAdmin('catalogue-manager');

    $this->actingAs($admin, 'admin')
        ->post('/admin/rdks-preise', rdksPayload())
        ->assertSessionHasNoErrors();

    $price = TpmsSensorPrice::query()->sole();
    $created = rdksAudit('tpms_price.created')->sole();

    expect($created->causer_type)->toBe(AdminUser::class)
        ->and((int) $created->causer_id)->toBe((int) $admin->getKey())
        ->and($created->actor_email)->toBe('catalogue-manager@rimify.test')
        ->and($created->properties->get('make_key'))->toBe('volkswagen')
        ->and($created->properties->get('price_cents'))->toBe(4900);

    $this->actingAs($admin, 'admin')
        ->patch('/admin/rdks-preise/'.$price->getKey(), rdksPayload(['price' => '59,00']))
        ->assertSessionHasNoErrors();

    $updated = rdksAudit('tpms_price.updated')->sole();

    expect($updated->properties->get('make_key'))->toBe('volkswagen')
        ->and($updated->properties->get('old'))->toBe(['price_cents' => 4900])
        ->and($updated->properties->get('new'))->toBe(['price_cents' => 5900]);

    $this->actingAs($admin, 'admin')->delete('/admin/rdks-preise/'.$price->getKey())->assertRedirect();

    $deleted = rdksAudit('tpms_price.deleted')->sole();

    expect($deleted->properties->get('make_key'))->toBe('volkswagen')
        ->and(rdksAudit('permission.denied')->exists())->toBeFalse();
});

it('ships the prices with formatted money, the makes of the vehicle table and the caller\'s rights', function (): void {
    TpmsSensorPrice::factory()->ofMake('volkswagen', 'Volkswagen')->create(['price_cents' => 4900]);
    TpmsSensorPrice::factory()->ofMake('porsche', 'Porsche')->inactive()->create(['price_cents' => 18900]);
    $vehicle = Vehicle::factory()->create();

    $this->actingAs(rdksAdmin('super-admin'), 'admin')
        ->get('/admin/rdks-preise')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Rdks/Index')
            ->has('prices', 2)
            ->where('prices.0.makeKey', 'porsche')
            ->where('prices.0.makeLabelDe', 'Porsche')
            ->where('prices.0.priceCents', 18900)
            ->where('prices.0.price', GermanFormat::money(18900))
            ->where('prices.0.active', false)
            ->where('prices.1.makeKey', 'volkswagen')
            ->where('prices.1.price', GermanFormat::money(4900))
            ->where('makes', fn (Collection $makes) => $makes->contains($vehicle->make))
            ->where('can.create', true)
            ->where('can.update', true)
            ->where('can.delete', true)
        );
});
