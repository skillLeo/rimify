<?php

declare(strict_types=1);

use App\Enums\CatalogueStatus;
use App\Models\Brand;
use App\Models\WheelModel;
use Database\Seeders\CommerceSeeder;

/**
 * Findings #18/#67: the search lists only brands RIMIFY sells Felgen of — a brand with at least one
 * published, non-deleted wheel model. A tyre maker, or a brand whose wheels are all drafts, is
 * neither a hit nor a "Meintest du …?".
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

/** @return array<string, mixed>|null */
function brandGroup(string $q): ?array
{
    $groups = test()->getJson('/api/v1/search?q='.rawurlencode($q))->assertOk()->json('groups');

    return collect($groups)->firstWhere('key', 'marken');
}

it('lists a brand with a published wheel model', function (): void {
    $model = WheelModel::query()->where('status', CatalogueStatus::Published->value)->with('brand')->firstOrFail();
    $name = $model->brand->name;

    $group = brandGroup($name);

    expect($group)->not->toBeNull()
        ->and(collect($group['items'])->pluck('label')->all())->toContain($name)
        ->and(collect($group['items'])->firstWhere('label', $name)['href'])->toBe('/felgen?marke='.rawurlencode($name));
});

it('never lists a brand without a published wheel model, nor suggests it', function (): void {
    Brand::factory()->named('Gummiwerk')->create();

    $drafts = Brand::factory()->named('Entwurfsrad')->create();
    WheelModel::factory()->draft()->create(['brand_id' => $drafts->id, 'name' => 'Nur ein Entwurf']);

    expect(brandGroup('gummiwerk'))->toBeNull()
        ->and(brandGroup('entwurfsrad'))->toBeNull();

    // One edit away from each: a suggestion would name a brand we do not sell wheels of.
    $this->getJson('/api/v1/search?q=gummiwerc')->assertOk()->assertJsonPath('suggestion', null);
    $this->getJson('/api/v1/search?q=entwurfsrat')->assertOk()->assertJsonPath('suggestion', null);
});

it('drops a brand once its last wheel model is deleted', function (): void {
    $brand = Brand::factory()->named('Kurzlebig')->create();
    $model = WheelModel::factory()->create(['brand_id' => $brand->id, 'name' => 'Kurzlebig Eins']);

    expect(brandGroup('kurzlebig'))->not->toBeNull();

    $model->delete();
    cache()->flush();

    expect(brandGroup('kurzlebig'))->toBeNull();
});
