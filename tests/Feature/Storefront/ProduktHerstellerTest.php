<?php

declare(strict_types=1);

use App\Enums\CatalogueStatus;
use App\Models\WheelModel;
use Database\Seeders\CommerceSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * GPSR on the product page: the manufacturer as entered for the wheel's brand in Katalog › Marken, or nothing —
 * never a name the shop made up.
 */

beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->model = WheelModel::query()->where('status', CatalogueStatus::Published->value)->with('brand')->orderBy('id')->firstOrFail();
});

it('names the manufacturer the brand carries', function (): void {
    $this->model->brand->forceFill([
        'manufacturer_name' => 'Beispiel Räder GmbH',
        'manufacturer_address' => "Werkstraße 1\n12345 Musterstadt",
        'manufacturer_contact' => 'https://beispiel-raeder.test/kontakt',
        'safety_note' => 'Montage nur durch eine Fachwerkstatt.',
    ])->save();

    $this->get('/felgen/'.$this->model->slug)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('product.manufacturer.name', 'Beispiel Räder GmbH')
            ->where('product.manufacturer.contact', 'https://beispiel-raeder.test/kontakt')
            ->where('product.manufacturer.euResponsible', null)
            ->where('product.manufacturer.safetyNote', 'Montage nur durch eine Fachwerkstatt.'));
});

it('names no manufacturer while the brand has none', function (): void {
    $this->get('/felgen/'.$this->model->slug)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('product.manufacturer', null));
});
