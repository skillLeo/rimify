<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\BalanceWeightColour;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Testing\AssertableInertia;

/**
 * Wuchtgewichte-Farben (docs/specs/komplettrad.md §6, §9.2).
 *
 * Every write is authorised on the server (R-11): the matrix decides, never a role name, and a
 * denied attempt is evidence in `audit_logs`. Money is typed the German way and parsed once; a
 * figure nobody can read unambiguously is refused rather than guessed (CLAUDE.md §2).
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

/** The seeded account for a role, as AccessSeeder names it. */
function wgAdmin(string $role): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function wgPayload(array $overrides = []): array
{
    return [
        'nameDe' => 'Silber',
        'swatchHex' => '#C8CCD2',
        'surcharge' => '0,00',
        'isDefault' => true,
        'active' => true,
        'sortOrder' => 10,
        ...$overrides,
    ];
}

/** @return Builder<AuditLog> */
function wgAudit(string $event): Builder
{
    return AuditLog::query()->where('log_name', 'admin')->where('description', $event);
}

it('sends a guest to the sign-in screen for every route', function (): void {
    $colour = BalanceWeightColour::factory()->create();

    $this->get('/admin/wuchtgewichte')->assertRedirect('/admin/anmelden');
    $this->post('/admin/wuchtgewichte', wgPayload())->assertRedirect('/admin/anmelden');
    $this->patch('/admin/wuchtgewichte/'.$colour->getKey(), wgPayload())->assertRedirect('/admin/anmelden');
    $this->delete('/admin/wuchtgewichte/'.$colour->getKey())->assertRedirect('/admin/anmelden');

    expect(BalanceWeightColour::query()->count())->toBe(1);
});

it('lets a writing role create, edit and delete a colour', function (string $role): void {
    $admin = wgAdmin($role);

    $this->actingAs($admin, 'admin')
        ->from('/admin/wuchtgewichte')
        ->post('/admin/wuchtgewichte', wgPayload(['surcharge' => '2,50']))
        ->assertRedirect('/admin/wuchtgewichte')
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Gespeichert.');

    $colour = BalanceWeightColour::query()->sole();

    expect($colour->name_de)->toBe('Silber')
        ->and($colour->slug)->toBe('silber')
        ->and($colour->swatch_hex)->toBe('#C8CCD2')
        ->and($colour->surcharge_cents)->toBe(250)
        ->and($colour->currency)->toBe('EUR')
        ->and($colour->is_default)->toBeTrue()
        ->and($colour->active)->toBeTrue()
        ->and($colour->sort_order)->toBe(10);

    $this->actingAs($admin, 'admin')
        ->from('/admin/wuchtgewichte')
        ->patch('/admin/wuchtgewichte/'.$colour->getKey(), wgPayload([
            'nameDe' => 'Silber matt', 'surcharge' => '3,00', 'sortOrder' => 20, 'active' => false,
        ]))
        ->assertRedirect('/admin/wuchtgewichte')
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Gespeichert.');

    $colour->refresh();

    expect($colour->name_de)->toBe('Silber matt')
        ->and($colour->slug)->toBe('silber-matt')
        ->and($colour->surcharge_cents)->toBe(300)
        ->and($colour->sort_order)->toBe(20)
        ->and($colour->active)->toBeFalse();

    $this->actingAs($admin, 'admin')
        ->from('/admin/wuchtgewichte')
        ->delete('/admin/wuchtgewichte/'.$colour->getKey())
        ->assertRedirect('/admin/wuchtgewichte')
        ->assertSessionHas('toast', 'Gelöscht.');

    // Soft-deleted, never gone: an order line may still point at this id.
    expect(BalanceWeightColour::query()->count())->toBe(0)
        ->and(BalanceWeightColour::withTrashed()->count())->toBe(1);
})->with(['super-admin', 'catalogue-manager']);

it('refuses the index and every mutation to a role without the catalogue module', function (string $role): void {
    $existing = BalanceWeightColour::factory()->create(['name_de' => 'Schwarz', 'slug' => 'schwarz']);
    $admin = wgAdmin($role);

    $this->actingAs($admin, 'admin')->get('/admin/wuchtgewichte')->assertForbidden();
    $this->actingAs($admin, 'admin')->post('/admin/wuchtgewichte', wgPayload())->assertForbidden();
    $this->actingAs($admin, 'admin')
        ->patch('/admin/wuchtgewichte/'.$existing->getKey(), wgPayload(['nameDe' => 'Anders']))
        ->assertForbidden();
    $this->actingAs($admin, 'admin')->delete('/admin/wuchtgewichte/'.$existing->getKey())->assertForbidden();

    $existing->refresh();

    expect(BalanceWeightColour::withTrashed()->count())->toBe(1)
        ->and($existing->name_de)->toBe('Schwarz')
        ->and($existing->trashed())->toBeFalse();
})->with(['content-editor', 'accountant']);

it('lets a reading role view the list and refuses every write', function (string $role): void {
    $existing = BalanceWeightColour::factory()->create(['name_de' => 'Schwarz', 'slug' => 'schwarz']);
    $admin = wgAdmin($role);

    $this->actingAs($admin, 'admin')
        ->get('/admin/wuchtgewichte')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Wuchtgewichte/Index')
            ->has('colours', 1)
            ->where('can.create', false)
            ->where('can.update', false)
            ->where('can.delete', false)
        );

    $this->actingAs($admin, 'admin')->post('/admin/wuchtgewichte', wgPayload())->assertForbidden();
    $this->actingAs($admin, 'admin')
        ->patch('/admin/wuchtgewichte/'.$existing->getKey(), wgPayload(['nameDe' => 'Anders']))
        ->assertForbidden();
    $this->actingAs($admin, 'admin')->delete('/admin/wuchtgewichte/'.$existing->getKey())->assertForbidden();

    $existing->refresh();

    expect(BalanceWeightColour::withTrashed()->count())->toBe(1)
        ->and($existing->name_de)->toBe('Schwarz')
        ->and($existing->trashed())->toBeFalse();
})->with(['support-agent', 'compliance-editor', 'order-manager']);

it('parses German money input: 1.425,00 € becomes 142500 cents', function (): void {
    $this->actingAs(wgAdmin('super-admin'), 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['surcharge' => "1.425,00\u{00A0}€"]))
        ->assertSessionHasNoErrors();

    expect(BalanceWeightColour::query()->sole()->surcharge_cents)->toBe(142500);
});

it('refuses an ambiguous price with the sentence that names the fix', function (string $input): void {
    $this->actingAs(wgAdmin('super-admin'), 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['surcharge' => $input]))
        ->assertSessionHasErrors([
            'surchargeCents' => 'Bitte schreib den Aufpreis deutsch, zum Beispiel 0,00 oder 2,50.',
        ]);

    expect(BalanceWeightColour::query()->count())->toBe(0);
})->with(['49.00', '1.42,00']);

it('keeps exactly one default across a second isDefault save', function (): void {
    $admin = wgAdmin('super-admin');

    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => 'Silber', 'isDefault' => true]))
        ->assertSessionHasNoErrors();
    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => 'Schwarz', 'swatchHex' => '#1A1C20', 'isDefault' => true]))
        ->assertSessionHasNoErrors();

    expect(BalanceWeightColour::query()->where('is_default', true)->count())->toBe(1)
        ->and(BalanceWeightColour::default()?->slug)->toBe('schwarz');

    // And back again through an update.
    $silber = BalanceWeightColour::query()->where('slug', 'silber')->sole();

    $this->actingAs($admin, 'admin')
        ->patch('/admin/wuchtgewichte/'.$silber->getKey(), wgPayload(['nameDe' => 'Silber', 'isDefault' => true]))
        ->assertSessionHasNoErrors();

    expect(BalanceWeightColour::query()->where('is_default', true)->count())->toBe(1)
        ->and(BalanceWeightColour::default()?->slug)->toBe('silber');
});

it('logs a denied write to audit_logs with its ability and route', function (): void {
    $this->actingAs(wgAdmin('content-editor'), 'admin')
        ->post('/admin/wuchtgewichte', wgPayload())
        ->assertForbidden();

    $entry = wgAudit('permission.denied')->sole();

    expect($entry->properties->get('ability'))->toBe('create')
        ->and($entry->properties->get('route'))->toBe('admin.wuchtgewichte.store')
        ->and($entry->actor_email)->toBe('content-editor@rimify.test')
        ->and(BalanceWeightColour::query()->count())->toBe(0);
});

it('derives the slug from the name and never reads a posted one', function (): void {
    $admin = wgAdmin('super-admin');

    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => ' Silber ', 'slug' => 'gepostet']))
        ->assertSessionHasNoErrors();
    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => 'Schwarz matt', 'isDefault' => false]))
        ->assertSessionHasNoErrors();

    expect(BalanceWeightColour::query()->orderBy('id')->pluck('slug', 'name_de')->all())
        ->toBe(['Silber' => 'silber', 'Schwarz matt' => 'schwarz-matt']);
});

it('refuses a name that slugs to nothing', function (): void {
    $this->actingAs(wgAdmin('super-admin'), 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => '***']))
        ->assertSessionHasErrors(['slug']);

    expect(BalanceWeightColour::query()->count())->toBe(0);
});

it('restores a deleted colour when it is created again instead of failing the unique rule', function (): void {
    $admin = wgAdmin('super-admin');

    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => 'Silber']))
        ->assertSessionHasNoErrors();

    $silber = BalanceWeightColour::query()->sole();

    $this->actingAs($admin, 'admin')->delete('/admin/wuchtgewichte/'.$silber->getKey())->assertRedirect();

    expect(BalanceWeightColour::onlyTrashed()->count())->toBe(1);

    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => 'Silber', 'surcharge' => '1,00']))
        ->assertSessionHasNoErrors();

    $restored = BalanceWeightColour::query()->sole();

    expect($restored->getKey())->toBe($silber->getKey())
        ->and($restored->trashed())->toBeFalse()
        ->and($restored->surcharge_cents)->toBe(100)
        ->and(BalanceWeightColour::withTrashed()->count())->toBe(1);
});

it('refuses a live duplicate name with the German sentence', function (): void {
    $admin = wgAdmin('super-admin');

    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => 'Silber']))
        ->assertSessionHasNoErrors();
    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => 'silber']))
        ->assertSessionHasErrors([
            'slug' => 'Diese Bezeichnung gibt es schon – bearbeite die vorhandene Farbe.',
        ]);
    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => 'Silber']))
        ->assertSessionHasErrors([
            'nameDe' => 'Diese Bezeichnung gibt es schon – bearbeite die vorhandene Farbe.',
        ]);

    expect(BalanceWeightColour::query()->count())->toBe(1);
});

it('refuses renaming a colour onto a deleted one and names the route forward', function (): void {
    $admin = wgAdmin('super-admin');
    $silber = BalanceWeightColour::factory()->create(['name_de' => 'Silber', 'slug' => 'silber']);
    $schwarz = BalanceWeightColour::factory()->create(['name_de' => 'Schwarz', 'slug' => 'schwarz']);

    $this->actingAs($admin, 'admin')->delete('/admin/wuchtgewichte/'.$silber->getKey())->assertRedirect();

    $this->actingAs($admin, 'admin')
        ->patch('/admin/wuchtgewichte/'.$schwarz->getKey(), wgPayload(['nameDe' => 'Silber', 'isDefault' => false]))
        ->assertSessionHasErrors([
            'nameDe' => 'Diese Bezeichnung gehörte einer gelöschten Farbe. Leg sie als neue Farbe an – dann stellen wir die gelöschte wieder her.',
        ]);

    expect($schwarz->refresh()->name_de)->toBe('Schwarz');
});

it('promotes the next active colour when the default is deleted', function (): void {
    $silber = BalanceWeightColour::factory()->asDefault()->create(['name_de' => 'Silber', 'slug' => 'silber', 'sort_order' => 10]);
    $grau = BalanceWeightColour::factory()->inactive()->create(['name_de' => 'Grau', 'slug' => 'grau', 'sort_order' => 15]);
    $schwarz = BalanceWeightColour::factory()->create(['name_de' => 'Schwarz', 'slug' => 'schwarz', 'sort_order' => 20]);

    $this->actingAs(wgAdmin('super-admin'), 'admin')
        ->delete('/admin/wuchtgewichte/'.$silber->getKey())
        ->assertRedirect();

    expect($schwarz->refresh()->is_default)->toBeTrue()
        ->and($grau->refresh()->is_default)->toBeFalse()
        ->and(BalanceWeightColour::withTrashed()->find($silber->getKey())?->is_default)->toBeFalse()
        ->and(BalanceWeightColour::query()->where('is_default', true)->count())->toBe(1);
});

it('allows deleting the last active colour, after which there is no default at all', function (): void {
    $silber = BalanceWeightColour::factory()->asDefault()->create(['name_de' => 'Silber', 'slug' => 'silber']);

    $this->actingAs(wgAdmin('super-admin'), 'admin')
        ->delete('/admin/wuchtgewichte/'.$silber->getKey())
        ->assertRedirect();

    // The storefront now refuses Kompletträder rather than inventing a colour (CLAUDE.md §2).
    expect(BalanceWeightColour::default())->toBeNull()
        ->and(BalanceWeightColour::query()->count())->toBe(0);
});

it('writes an audit entry for create, update and delete', function (): void {
    $admin = wgAdmin('catalogue-manager');

    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['surcharge' => '2,50']))
        ->assertSessionHasNoErrors();

    $colour = BalanceWeightColour::query()->sole();
    $created = wgAudit('weight_colour.created')->sole();

    expect($created->causer_type)->toBe(AdminUser::class)
        ->and((int) $created->causer_id)->toBe((int) $admin->getKey())
        ->and($created->actor_email)->toBe('catalogue-manager@rimify.test')
        ->and($created->properties->get('id'))->toBe((int) $colour->getKey())
        ->and($created->properties->get('name_de'))->toBe('Silber')
        ->and($created->properties->get('surcharge_cents'))->toBe(250);

    $this->actingAs($admin, 'admin')
        ->patch('/admin/wuchtgewichte/'.$colour->getKey(), wgPayload(['surcharge' => '3,00']))
        ->assertSessionHasNoErrors();

    $updated = wgAudit('weight_colour.updated')->sole();

    expect($updated->properties->get('id'))->toBe((int) $colour->getKey())
        ->and($updated->properties->get('old'))->toMatchArray(['surcharge_cents' => 250])
        ->and($updated->properties->get('attributes'))->toMatchArray(['surcharge_cents' => 300]);

    $this->actingAs($admin, 'admin')->delete('/admin/wuchtgewichte/'.$colour->getKey())->assertRedirect();

    $deleted = wgAudit('weight_colour.deleted')->sole();

    expect($deleted->properties->get('id'))->toBe((int) $colour->getKey())
        ->and($deleted->properties->get('name_de'))->toBe('Silber')
        ->and(wgAudit('permission.denied')->exists())->toBeFalse();
});

it('normalises the hex value and refuses a malformed one', function (): void {
    $admin = wgAdmin('super-admin');

    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => 'Silber', 'swatchHex' => 'c8ccd2']))
        ->assertSessionHasNoErrors();
    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => 'Schwarz', 'swatchHex' => '', 'isDefault' => false]))
        ->assertSessionHasNoErrors();
    $this->actingAs($admin, 'admin')
        ->post('/admin/wuchtgewichte', wgPayload(['nameDe' => 'Grau', 'swatchHex' => '#zzzzzz', 'isDefault' => false]))
        ->assertSessionHasErrors([
            'swatchHex' => 'Bitte schreib den Farbwert als Hex-Code mit sechs Stellen, zum Beispiel #C8CCD2.',
        ]);

    expect(BalanceWeightColour::query()->orderBy('id')->pluck('swatch_hex', 'slug')->all())
        ->toBe(['silber' => '#C8CCD2', 'schwarz' => null]);
});

it('ships the colours with formatted prices beside their cents and the caller\'s write rights', function (): void {
    BalanceWeightColour::factory()->asDefault()->withSurcharge(250)->create(['name_de' => 'Silber', 'slug' => 'silber', 'sort_order' => 10]);
    BalanceWeightColour::factory()->create(['name_de' => 'Schwarz', 'slug' => 'schwarz', 'swatch_hex' => null, 'sort_order' => 20]);

    $this->actingAs(wgAdmin('super-admin'), 'admin')
        ->get('/admin/wuchtgewichte')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Wuchtgewichte/Index')
            ->has('colours', 2)
            ->where('colours.0.nameDe', 'Silber')
            ->where('colours.0.slug', 'silber')
            ->where('colours.0.surchargeCents', 250)
            ->where('colours.0.surcharge', GermanFormat::money(250))
            ->where('colours.0.isDefault', true)
            ->where('colours.1.swatchHex', null)
            ->where('can.create', true)
            ->where('can.update', true)
            ->where('can.delete', true)
        );
});

it('shares admin.can on admin routes', function (): void {
    $this->actingAs(wgAdmin('catalogue-manager'), 'admin')
        ->get('/admin/wuchtgewichte')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('admin.can.catalogue', true)
            ->where('admin.can.approvals', true)
            ->where('admin.can.roles', false)
        );
});

// Its own test: Inertia's shared props accumulate across requests made by one test instance, so
// an admin request in the same test would leave the key behind and hide a leak.
it('never shares admin.can on the storefront', function (): void {
    $this->get('/kontakt')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->missing('admin'));
});
