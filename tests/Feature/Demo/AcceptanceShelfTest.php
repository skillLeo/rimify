<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\WheelModel;
use App\Services\Demo\AcceptanceShelf;
use App\Services\Demo\DemoPurge;
use App\Services\Storefront\HomeShelf;
use App\Services\Storefront\ProductCards;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;

/*
 * Demonstration rims for the client's preview (`rimify:demo --abnahme --regal`, the operator's brief of 29.10.2026 §0):
 * three models, two colours each, published as demo under `abnahme:regal:` — so the shelf can hold eight (#5), one
 * carries typed stars (#19) and one colour of another is not available (admin item 7). No photo, no Gutachten.
 */

beforeEach(function (): void {
    config(['demo.enabled' => true]);
    $this->seed(ReferenceDataSeeder::class);
});

it('writes three demo rims in two colours each, published, every row marked — and nothing twice', function (): void {
    $this->artisan('rimify:demo', ['--regal' => true])->expectsOutputToContain('Regal-Beispiele geschrieben')->assertSuccessful();

    $models = WheelModel::query()->where('demo_ref', 'like', AcceptanceShelf::PREFIX.'%')->with('finishes')->orderBy('demo_ref')->get();

    expect($models)->toHaveCount(3)
        ->and($models->every(fn (WheelModel $m): bool => $m->is_demo && $m->status->value === 'published' && str_ends_with($m->name, '(Demo)')))->toBeTrue()
        ->and($models->sum(fn (WheelModel $m): int => $m->finishes->count()))->toBe(6)
        ->and(Brand::query()->where('demo_ref', AcceptanceShelf::PREFIX.'brand')->value('name'))->toBe('RIMIFY Demo')
        // No photograph anywhere: the shop draws the outline and says it is a placeholder.
        ->and(DB::table('wheel_finishes')->whereIn('wheel_model_id', $models->pluck('id'))->whereNotNull('image_manifest')->count())->toBe(0)
        // No Gutachten names them: no car is ever told they fit.
        ->and(DB::table('fitments as f')->join('wheel_configs as c', 'c.id', '=', 'f.wheel_config_id')->whereIn('c.wheel_model_id', $models->pluck('id'))->count())->toBe(0);

    // Stars typed on the first; the second colour of the third not available.
    expect((float) $models[0]->getAttribute('stated_rating'))->toBe(4.7)
        ->and(DB::table('wheel_configs')->whereIn('wheel_model_id', $models->pluck('id'))->where('available', false)->count())->toBe(1);

    expect((new AcceptanceShelf)->seed())->toBe([])
        ->and(WheelModel::query()->where('demo_ref', 'like', AcceptanceShelf::PREFIX.'%')->count())->toBe(3);
});

it('puts six cards in the catalogue, one with „Anfrage“, and the shelf takes them — until the demo data goes', function (): void {
    (new AcceptanceShelf)->seed();

    $cards = collect(app(ProductCards::class)->catalogue(limit: null))->filter(fn (array $card): bool => str_contains($card['modelName'], 'Regal-Beispiel'));
    expect($cards)->toHaveCount(6)
        ->and($cards->where('inStock', false)->count())->toBe(1)
        ->and($cards->firstWhere('inStock', false)['enquiry'])->toStartWith('Anfrage zur Verfügbarkeit: RIMIFY Demo Regal-Beispiel 3 (Demo) Graphit, ')
        ->and($cards->whereNotNull('statedRating')->count())->toBe(2);

    expect(app(HomeShelf::class)->catalogue()['cards'])->toHaveCount(6);

    app(DemoPurge::class)->run('Test');
    expect(WheelModel::withTrashed()->where('demo_ref', 'like', AcceptanceShelf::PREFIX.'%')->exists())->toBeFalse()
        ->and(Brand::query()->where('demo_ref', AcceptanceShelf::PREFIX.'brand')->exists())->toBeFalse();
});

it('is never written in production', function (): void {
    app()->detectEnvironment(fn (): string => 'production');

    expect(fn () => (new AcceptanceShelf)->seed())->toThrow(RuntimeException::class);
    expect(WheelModel::query()->where('demo_ref', 'like', AcceptanceShelf::PREFIX.'%')->exists())->toBeFalse();
});
