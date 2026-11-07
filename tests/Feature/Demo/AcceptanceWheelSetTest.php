<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\WheelSets;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Storefront\VehicleContext;
use App\Http\Controllers\Admin\GutachtenController;
use App\Models\ApprovalDocument;
use App\Models\DocumentWheelCombination;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Demo\AcceptanceSeeder;
use App\Services\Demo\AcceptanceWheelSet;
use App\Services\Demo\DemoPurge;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\MinimalPdf;

/*
 * The client's mockup as a click on the preview (`rimify:demo --satz`, the operator's brief of 07.11.2026): the DB8GT2 with 8,5 × 18
 * ET 35 in front and 8,5 × 19 ET 35 behind, for a fourth demo car, on a paper that says it is an example.
 */

beforeEach(function (): void {
    config(['demo.enabled' => true]);
    $this->seed(ReferenceDataSeeder::class);
    // The set's example PDFs, and the purge that deletes them: never on the disk parallel tests read.
    Storage::fake(GutachtenController::DISK);

    $dir = sys_get_temp_dir().'/rimify-abnahme-pdfs-satz';
    $data = require database_path('seeders/content/abnahme/gutachten.php');

    foreach ($data['documents'] as $key => $document) {
        $path = $dir.'/'.$document['pdf']['source'];
        is_dir(dirname($path)) || mkdir(dirname($path), 0777, true);
        file_put_contents($path, MinimalPdf::make(["stand-in for {$key}"]));
        $data['documents'][$key]['pdf']['sha256'] = hash_file('sha256', $path);
    }

    (new AcceptanceSeeder($dir, $data))->seed();
});

/** @return array{car: Vehicle, front: WheelConfig, rear: WheelConfig} */
function satzParts(): array
{
    $car = Vehicle::query()->where('demo_ref', AcceptanceWheelSet::PREFIX.'vehicle')->firstOrFail();
    $finish = WheelConfig::query()->where('diameter_in', 18.0)->whereHas('wheelModel', static fn ($q) => $q->where('demo_ref', AcceptanceSeeder::WHEEL_REF))->orderBy('id')->firstOrFail();
    $rear = WheelConfig::query()->where('diameter_in', 19.0)->where('wheel_finish_id', $finish->wheel_finish_id)->firstOrFail();

    return ['car' => $car, 'front' => $finish, 'rear' => $rear];
}

it('writes the paper, the car and a set in each colour, every row marked as demo, and nothing twice', function (): void {
    $this->artisan('rimify:demo', ['--satz' => true])->expectsOutputToContain('Satz vorne und hinten geschrieben')->assertSuccessful();

    $document = ApprovalDocument::query()->where('demo_ref', AcceptanceWheelSet::PREFIX.'doc')->firstOrFail();

    expect((bool) $document->is_demo)->toBeTrue()
        ->and($document->status->value)->toBe('published')
        ->and($document->kba_number)->toBe(AcceptanceWheelSet::NUMBER)
        ->and(Fitment::query()->where('approval_document_id', $document->id)->where('status', 'published')->count())->toBe(4)
        ->and(DB::table('fitment_wheel_sets')->whereIn('front_fitment_id', Fitment::query()->where('approval_document_id', $document->id)->select('id'))->count())->toBe(2)
        ->and(DocumentWheelCombination::query()->where('approval_document_id', $document->id)->count())->toBe(1)
        ->and(Vehicle::query()->where('demo_ref', AcceptanceWheelSet::PREFIX.'vehicle')->sole()->getAttribute('is_demo'))->toBeTruthy();

    expect((new AcceptanceWheelSet)->seed())->toBe([])
        ->and(ApprovalDocument::query()->where('demo_ref', AcceptanceWheelSet::PREFIX.'doc')->count())->toBe(1);
});

it('refuses to stand without the acceptance set\'s wheel, in a sentence', function (): void {
    DB::table('wheel_models')->where('demo_ref', AcceptanceSeeder::WHEEL_REF)->update(['demo_ref' => 'abnahme:wheel:anderes']);

    $this->artisan('rimify:demo', ['--satz' => true])->expectsOutputToContain('Der Abnahme-Satz fehlt')->assertFailed();
});

it('gives the shop what the mockup shows: a set for the car, sold, and tyres across the two wheels', function (): void {
    (new AcceptanceWheelSet)->seed();
    ['car' => $car, 'front' => $front, 'rear' => $rear] = satzParts();

    $set = app(WheelSets::class)->find($car->id, $front->id, $rear->id);

    expect($set)->not->toBeNull()
        ->and($set->combined()->isSellable())->toBeTrue();

    $offer = app(TyreEligibility::class)->mixedOfferFor($set->combined());

    expect($offer->refusal)->toBeNull()
        ->and($offer->pairs)->toHaveCount(2)
        // Each combination can be bought: no dead end in the demonstration.
        ->and(array_map(static fn ($pair): bool => $pair->sets !== [], $offer->pairs))->toBe([true, true]);

    // On one wheel alone nothing has changed: its axle's sizes, and no pair.
    expect($set->front->rear->hasPermittedSizes())->toBeFalse()
        ->and(app(TyreEligibility::class)->mixedOfferFor($set->front)->pairs)->toBe([]);

    $page = $this->withCookies([VehicleContext::COOKIE => (new VehicleContext($car->id, true))->encode()])->get('/felgen/'.AcceptanceSeeder::SLUG)->assertOk()->viewData('page');
    $sets = collect($page['props']['wheelSets']);

    expect($sets)->toHaveCount(2)
        ->and(str_replace("\u{00A0}", ' ', (string) $sets->first()['label']))->toBe('Vorne 2 × 8,5 × 18 ET 35 · Hinten 2 × 8,5 × 19 ET 35');
});

it('goes with the rest of the demo data, and comes back on the same car', function (): void {
    (new AcceptanceWheelSet)->seed();

    app(DemoPurge::class)->run('Test');

    expect(AcceptanceWheelSet::present())->toBeFalse()
        ->and(Vehicle::query()->where('demo_ref', AcceptanceWheelSet::PREFIX.'vehicle')->exists())->toBeFalse();
});
