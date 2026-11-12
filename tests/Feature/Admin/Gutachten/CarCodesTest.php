<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCarEntry;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\Entry\CarCodes;
use App\Services\Admin\Approvals\Entry\CarCodesOnce;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use App\Services\Admin\Approvals\Entry\EngineRows;
use App\Services\Admin\Approvals\Entry\EntryModel;
use App\Services\Admin\Approvals\Entry\EntryView;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Gutachten\EntryDriver;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * „Allgemeine Codes dieses Fahrzeugs“ — what a Gutachten says of the car as a whole — belong to the car, not to one of its wheel
 * combinations (the client's review of 11.11, B; D-452): once per car (its HSN/TSN) and paper, and every combination of that car
 * carries them, in admin and in the shop. Before, they stood on the cell they were typed in, and the car's other combinations did not
 * say them.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
    CarCodes::forget();
});

function carCodesAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

function carCodesWheel(float $width, int $et): WheelConfig
{
    $model = WheelModel::query()->where('name', 'DB8GT')->first() ?? WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'DB8GT']);

    return WheelConfig::factory()->create([
        'wheel_model_id' => $model->id,
        'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id,
        'diameter_in' => 18.0, 'width_in' => $width, 'et_mm' => $et, 'bolt_holes' => 5, 'bolt_circle_mm' => 120.0, 'centre_bore_mm' => 72.5,
    ]);
}

/** @param  array<string, mixed>  $attributes */
function carCodesCar(array $attributes = []): Vehicle
{
    $k = 'e1*2001/116*0308*00-08';

    return Vehicle::factory()->create(['eg_nummer_raw' => $k, 'eg_nummer_norm' => $k, 'axle_load_front_kg' => 900, 'axle_load_rear_kg' => 1000, 'max_speed_kmh' => 200, 'power_kw' => 170, ...$attributes]);
}

/**
 * A paper with the 2B code, two wheel combinations, and these cars on both.
 *
 * @param  list<Vehicle>  $cars
 * @return array{0: ApprovalDocument, 1: WheelConfig, 2: WheelConfig}
 */
function carCodesPaper(object $test, array $cars): array
{
    $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Document)->create();
    $test->actingAs(carCodesAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => '2B', 'kind' => 'karosseriearbeit', 'text_de' => 'Die Radläufe sind zu bördeln.'])->assertSessionHasNoErrors();
    $narrow = carCodesWheel(8.0, 35);
    $wide = carCodesWheel(8.5, 25);
    EntryDriver::car($test, carCodesAdmin(), $document->id, $cars[0]->id, $narrow->id);
    $test->actingAs(carCodesAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/kombinationen", ['front_config_id' => $wide->id, 'rear_config_id' => $wide->id])->assertOk();
    $test->actingAs(carCodesAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge", ['vehicle_ids' => array_map(static fn (Vehicle $c): int => $c->id, $cars)])->assertOk();

    foreach (DocumentCarEntry::query()->where('approval_document_id', $document->id)->get() as $cell) {
        carCodesSave($test, $cell, []);
    }

    return [$document, $narrow, $wide];
}

/** @param list<string> $codes */
function carCodesSave(object $test, DocumentCarEntry $cell, array $codes, ?bool $changed = null): void
{
    $test->actingAs(carCodesAdmin(), 'admin')->putJson("/admin/gutachten/{$cell->approval_document_id}/erfassung/fahrzeuge/{$cell->id}", [
        'lines' => [['id' => null, 'front' => '225/35 R18 90W', 'rear' => '225/35 R18 90W', 'kw' => '', 'codes' => []]],
        'codes' => array_map(static fn (string $code): array => ['code' => $code, 'note' => null], $codes),
        ...($changed === null ? [] : ['codes_changed' => $changed]),
        'source_page' => 2,
    ])->assertOk();
}

function carCodesCell(ApprovalDocument $document, Vehicle $car, WheelConfig $wheel): DocumentCarEntry
{
    return DocumentCarEntry::query()->where('approval_document_id', $document->id)->where('vehicle_id', $car->id)
        ->whereHas('combination', static fn ($q) => $q->whereHas('front', static fn ($f) => $f->where('width_in', $wheel->width_in)->where('et_mm', $wheel->et_mm)))
        ->firstOrFail();
}

/** @return list<string> the codes the rows of this car and wheel carry themselves */
function carCodesOnRows(ApprovalDocument $document, Vehicle $car, WheelConfig $wheel): array
{
    return DB::table('fitment_conditions')->join('fitments', 'fitments.id', '=', 'fitment_conditions.fitment_id')
        ->where('fitments.approval_document_id', $document->id)->where('fitments.vehicle_id', $car->id)->where('fitments.wheel_config_id', $wheel->id)
        ->orderBy('code')->pluck('code')->map(static fn (mixed $c): string => (string) $c)->unique()->values()->all();
}

it('keeps a car\'s general codes once: typed in one wheel combination, every combination of the car carries them (B) @admin-452', function (): void {
    $car = carCodesCar(['hsn' => '0005', 'tsn' => '683']);
    [$document, $narrow, $wide] = carCodesPaper($this, [$car]);

    carCodesSave($this, carCodesCell($document, $car, $narrow), ['2B']);

    $view = app(EntryView::class)->lines(carCodesCell($document, $car, $wide));

    expect(carCodesOnRows($document, $car, $narrow))->toBe(['2B'])
        ->and(carCodesOnRows($document, $car, $wide))->toBe(['2B'])
        ->and(array_column($view['codes'], 'code'))->toBe(['2B'])
        ->and($view['codesFor'])->toBe(['car' => '0005/683', 'cells' => 2, 'cars' => 1])
        ->and(DB::table('document_vehicle_codes')->where('approval_document_id', $document->id)->count())->toBe(1);

    // Edited in the other combination, it is the car's again: gone from both.
    carCodesSave($this, carCodesCell($document, $car, $wide), []);

    expect(carCodesOnRows($document, $car, $narrow))->toBe([])->and(carCodesOnRows($document, $car, $wide))->toBe([]);
});

it('says them for every combination of the car in the shop, once released', function (): void {
    $car = carCodesCar(['hsn' => '0005', 'tsn' => '683']);
    [$document, $narrow, $wide] = carCodesPaper($this, [$car]);
    carCodesSave($this, carCodesCell($document, $car, $narrow), ['2B']);
    $this->actingAs(carCodesAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();
    $codes = static fn (WheelConfig $wheel): array => array_map(static fn (Condition $c): string => $c->code, app(FitmentResolver::class)->resolve($car->id, $wheel->id)->conditionGroups()->combination);

    expect($codes($narrow))->toBe(['2B'])->and($codes($wide))->toBe(['2B']);
});

it('shares them between the cars of one HSN/TSN in the paper, and with no other paper', function (): void {
    $first = carCodesCar(['hsn' => '0005', 'tsn' => '683']);
    $second = carCodesCar(['hsn' => '0005', 'tsn' => '683', 'vsn' => '00017']);
    $other = carCodesCar(['hsn' => '0005', 'tsn' => 'Z90']);
    [$document, $narrow, $wide] = carCodesPaper($this, [$first, $second, $other]);
    [$elsewhere, $elsewhereNarrow] = carCodesPaper($this, [$first]);

    carCodesSave($this, carCodesCell($document, $first, $narrow), ['2B']);

    expect(carCodesOnRows($document, $second, $wide))->toBe(['2B'])
        ->and(carCodesOnRows($document, $other, $narrow))->toBe([])
        ->and(carCodesOnRows($elsewhere, $first, $elsewhereNarrow))->toBe([])
        ->and(app(EntryView::class)->lines(carCodesCell($document, $second, $narrow))['codesFor'])->toBe(['car' => '0005/683', 'cells' => 4, 'cars' => 2]);
});

it('takes a car without key numbers as itself', function (): void {
    $car = carCodesCar(['hsn' => null, 'tsn' => null, 'source' => 'manuell_geprueft']);
    $twin = carCodesCar(['hsn' => null, 'tsn' => null, 'source' => 'manuell_geprueft']);
    [$document, $narrow] = carCodesPaper($this, [$car, $twin]);

    carCodesSave($this, carCodesCell($document, $car, $narrow), ['2B']);

    expect(carCodesOnRows($document, $car, $narrow))->toBe(['2B'])
        ->and(carCodesOnRows($document, $twin, $narrow))->toBe([])
        ->and(CarCodes::keyOfEntry(carCodesCell($document, $car, $narrow)))->toBe('#'.$car->id);
});

it('leaves the car\'s codes as another combination changed them when a form saves its lines alone', function (): void {
    $car = carCodesCar(['hsn' => '0005', 'tsn' => '683']);
    [$document, $narrow, $wide] = carCodesPaper($this, [$car]);
    carCodesSave($this, carCodesCell($document, $car, $narrow), ['2B']);

    // The other combination's form, loaded before: it changed nothing of them, and says so.
    carCodesSave($this, carCodesCell($document, $car, $wide), [], changed: false);

    expect(carCodesOnRows($document, $car, $wide))->toBe(['2B'])
        ->and(array_column(CarCodes::of(carCodesCell($document, $car, $wide)), 'code'))->toBe(['2B']);
});

it('gives a car the copied car\'s general codes with „Kopieren nach“', function (): void {
    $from = carCodesCar(['hsn' => '0005', 'tsn' => '683']);
    $to = carCodesCar(['hsn' => '0005', 'tsn' => 'Z90']);
    [$document, $narrow, $wide] = carCodesPaper($this, [$from, $to]);
    carCodesSave($this, carCodesCell($document, $from, $narrow), ['2B']);

    $this->actingAs(carCodesAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/".carCodesCell($document, $from, $narrow)->id.'/kopieren', [
        'ziele' => [carCodesCell($document, $to, $narrow)->id], 'modus' => 'hinzufuegen',
    ])->assertOk();

    expect(carCodesOnRows($document, $to, $narrow))->toBe(['2B'])
        ->and(carCodesOnRows($document, $to, $wide))->toBe(['2B']);
});

/**
 * The cells' codes as they stood before D-452, the car's set empty: each cell its own.
 *
 * @param  array<int, list<array{0: string, 1: string|null}>>  $byCell  cell => code, note
 */
function carCodesAsBefore(ApprovalDocument $document, array $byCell): void
{
    DB::table('document_vehicle_codes')->where('approval_document_id', $document->id)->delete();
    CarCodes::forget();
    $now = now();

    foreach ($byCell as $cell => $codes) {
        foreach ($codes as [$code, $note]) {
            DB::table('document_car_entry_codes')->insert(['document_car_entry_id' => $cell, 'code' => $code, 'note_de' => $note, 'created_at' => $now, 'updated_at' => $now]);
        }
    }
}

it('gathers the cells\' codes per car once: the same everywhere stays once, typed differently all of it, the car named (the migration)', function (): void {
    $car = carCodesCar(['hsn' => '0005', 'tsn' => '683']);
    $agreed = carCodesCar(['hsn' => '0005', 'tsn' => 'Z90']);
    [$document, $narrow, $wide] = carCodesPaper($this, [$car, $agreed]);
    $cell = static fn (Vehicle $v, WheelConfig $w): int => carCodesCell($document, $v, $w)->id;
    carCodesAsBefore($document, [
        $cell($car, $narrow) => [['2B', 'nur vorne']],
        $cell($car, $wide) => [['2B', 'auch hinten'], ['5C', null]],
        $cell($agreed, $narrow) => [['2B', null]],
        $cell($agreed, $wide) => [['2B', null]],
    ]);

    $gathered = (new CarCodesOnce(new DocumentEntryWriter))->gather();
    CarCodes::forget();

    expect($gathered)->toBe(['merged' => ["Gutachten {$document->id} · 0005/683 · 2 Zellen · 5C (nur bei 1 von 2)"], 'kept' => []])
        ->and(CarCodes::forDocument($document->id))->toBe([
            '0005/683' => [['code' => '2B', 'note' => 'nur vorne · auch hinten'], ['code' => '5C', 'note' => null]],
            '0005/Z90' => [['code' => '2B', 'note' => null]],
        ])
        ->and(DB::table('document_car_entry_codes')->count())->toBe(0);

    // The way back: each cell its car's whole set.
    (new CarCodesOnce(new DocumentEntryWriter))->spread();

    expect(DB::table('document_car_entry_codes')->where('document_car_entry_id', $cell($car, $narrow))->orderBy('code')->pluck('code')->all())->toBe(['2B', '5C']);
});

it('leaves a car carried from the rows before the five steps with each combination\'s own codes where they differ: a row says them for its wheel', function (): void {
    $car = carCodesCar(['hsn' => '0005', 'tsn' => '683']);
    [$document, $narrow, $wide] = carCodesPaper($this, [$car]);
    DB::table('document_tyre_lines')->whereIn('document_car_entry_id', DocumentCarEntry::query()->where('approval_document_id', $document->id)->pluck('id'))->update(['from_rows' => true]);
    $cell = static fn (WheelConfig $w): int => carCodesCell($document, $car, $w)->id;
    carCodesAsBefore($document, [$cell($narrow) => [['2B', null]]]);
    (new DocumentEntryWriter)->write($document);
    $rows = EngineRows::actual($document);

    $gathered = (new CarCodesOnce(new DocumentEntryWriter))->gather();

    expect($gathered['kept'])->toBe(["Gutachten {$document->id} · 0005/683 · 2 Zellen · 2B (nur bei 1 von 2)"])
        ->and($gathered['merged'])->toBe([])
        ->and(DB::table('document_car_entry_codes')->where('document_car_entry_id', $cell($narrow))->pluck('code')->all())->toBe(['2B'])
        ->and(CarCodes::forDocument($document->id))->toBe([])
        ->and((new CarCodesOnce(new DocumentEntryWriter))->rows($document)['added'])->toBe([])
        ->and(EngineRows::actual($document))->toBe($rows)
        ->and(carCodesOnRows($document, $car, $wide))->toBe([])
        ->and(app(EntryView::class)->lines(carCodesCell($document, $car, $narrow))['cellCodes'])->toBe([['code' => '2B', 'note' => null]]);
});

it('gives the released rows the codes of their car they lacked, and nothing else, said in the Protokoll', function (): void {
    $car = carCodesCar(['hsn' => '0005', 'tsn' => '683']);
    [$document, $narrow, $wide] = carCodesPaper($this, [$car]);
    carCodesSave($this, carCodesCell($document, $car, $narrow), ['2B']);
    $this->actingAs(carCodesAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();
    $document->refresh();
    $after = EngineRows::actual($document);
    // As the writer wrote them before D-452: the code on the cell it was typed in, the car's other combination without it.
    DB::table('fitment_conditions')->whereIn('fitment_id', DB::table('fitments')->where('approval_document_id', $document->id)->where('wheel_config_id', $wide->id)->pluck('id'))->delete();

    $once = new CarCodesOnce(new DocumentEntryWriter);
    $result = $once->rows($document);

    expect($result['left'])->toBe([])
        ->and($result['added'])->not->toBe([])
        ->and(carCodesOnRows($document, $car, $wide))->toBe(['2B'])
        ->and(EngineRows::actual($document))->toBe($after)
        ->and($once->rows($document)['added'])->toBe([])
        ->and(AuditLog::query()->where('description', 'approval.vehicle_codes_per_car')->sole()->properties['codes'])->toBe(['2B']);
});

it('writes back exactly what the shop reads, the car\'s codes included', function (): void {
    $car = carCodesCar(['hsn' => '0005', 'tsn' => '683']);
    [$document, $narrow] = carCodesPaper($this, [$car]);
    carCodesSave($this, carCodesCell($document, $car, $narrow), ['2B']);

    expect(EngineRows::actual($document))->toBe((new DocumentEntryWriter)->desired(EntryModel::of($document)));
});
