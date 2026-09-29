<?php

declare(strict_types=1);

use App\Http\Requests\Admin\BrandManufacturerRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Brand;
use Database\Seeders\AccessSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * Block G, GPSR (Verordnung (EU) 2023/988, Art. 19): per brand, the manufacturer's name, postal address and
 * electronic contact — all three or none — the responsible person in the EU where one is entered, and the safety
 * information. Entered by a person in Katalog › Marken, audited, never filled in by the shop; the product page prints
 * them as entered.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->brand = Brand::factory()->create(['name' => 'Beispielmarke', 'slug' => 'beispielmarke']);
});

function herstellerAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @return array<string, string> */
function herstellerForm(array $over = []): array
{
    return [
        'manufacturerName' => 'Beispiel Räder GmbH',
        'manufacturerAddress' => "Werkstraße 1\n12345 Musterstadt\nDeutschland",
        'manufacturerContact' => 'info@beispiel-raeder.test',
        'euResponsibleName' => '',
        'euResponsibleAddress' => '',
        'euResponsibleContact' => '',
        'safetyNote' => 'Montage nur durch eine Fachwerkstatt.',
        ...$over,
    ];
}

it('stores the manufacturer, audits which fields changed, and reports the brand complete', function (): void {
    $this->actingAs(herstellerAdmin(), 'admin')->from('/admin/marken')
        ->put('/admin/marken/'.$this->brand->id.'/hersteller', herstellerForm())
        ->assertRedirect('/admin/marken')->assertSessionHasNoErrors();

    $brand = $this->brand->fresh();

    expect($brand->manufacturer())->toBe([
        'name' => 'Beispiel Räder GmbH',
        'address' => "Werkstraße 1\n12345 Musterstadt\nDeutschland",
        'contact' => 'info@beispiel-raeder.test',
        'euResponsible' => null,
        'safetyNote' => 'Montage nur durch eine Fachwerkstatt.',
    ])->and($brand->eu_responsible_name)->toBeNull();

    $entry = AuditLog::query()->where('description', 'brand.manufacturer_updated')->sole();

    expect($entry->properties['changed'])->toBe(['manufacturer_name', 'manufacturer_address', 'manufacturer_contact', 'safety_note'])
        ->and($entry->properties['complete'])->toBeTrue();

    $this->actingAs(herstellerAdmin(), 'admin')->get('/admin/marken')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('brands', fn ($rows): bool => collect($rows)->firstWhere('id', $this->brand->id)['manufacturerComplete'] === true));
});

it('refuses half a manufacturer, half a responsible person, and a contact that is neither mail nor web address', function (array $over, string $field, string $sentence): void {
    $this->actingAs(herstellerAdmin(), 'admin')->from('/admin/marken')
        ->put('/admin/marken/'.$this->brand->id.'/hersteller', herstellerForm($over))
        ->assertSessionHasErrors([$field => $sentence]);

    expect($this->brand->fresh()->manufacturer_name)->toBeNull();
})->with([
    'no address' => [['manufacturerAddress' => ''], 'manufacturerName', BrandManufacturerRequest::INCOMPLETE],
    'a responsible person alone' => [['euResponsibleName' => 'EU Vertreter GmbH'], 'euResponsibleName', BrandManufacturerRequest::RESPONSIBLE_INCOMPLETE],
    'a phone number as contact' => [['manufacturerContact' => '+49 123 456'], 'manufacturerContact', 'Als Kontakt eine E-Mail-Adresse oder eine Webadresse mit https://.'],
]);

it('lets only who may edit the catalogue enter it', function (): void {
    $this->actingAs(herstellerAdmin('accountant'), 'admin')
        ->put('/admin/marken/'.$this->brand->id.'/hersteller', herstellerForm())
        ->assertForbidden();

    expect($this->brand->fresh()->manufacturer_name)->toBeNull();
});
