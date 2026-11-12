<?php

declare(strict_types=1);

use App\Domain\Fitment\Derivation\IndexTables;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\TyreVariant;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Storage\StorageSettings;
use App\Support\TyreText;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Gutachten\EntryDriver;

/*
 * Every load index with every speed symbol, on every path a tyre comes in by (the client's review of 11.11, D; D-453): typed in step 4,
 * pasted with „Mehrere einfügen“ (the box sends each line as the shop writes it), copied with „Kopieren nach“, and typed in the tyre
 * catalogue — one reading of what the paper prints, (W) and (Y) in each bracket form among it.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

dataset('printed', [
    '92(W)' => ['225/40 R18 92(W)', 92, '(W)'],
    '92 (W)' => ['225/40 R18 92 (W)', 92, '(W)'],
    '(97W) on a ZR size' => ['245/40 ZR18 (97W)', 97, '(W)'],
    '94W XL' => ['225/45 R17 94W XL', 94, 'W'],
    '115/113R on a C tyre' => ['235/65 R16 C 115/113R', 115, 'R'],
    '(92Y)' => ['225/40 R18 (92Y)', 92, '(Y)'],
    '93(Y)' => ['245/35 ZR19 93(Y)', 93, '(Y)'],
    '91 V' => ['205/55 R16 91 V', 91, 'V'],
    '79J' => ['155/80 R13 79J', 79, 'J'],
]);

function svcAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

function svcWheel(float $diameter): WheelConfig
{
    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'Prüfrad '.$diameter]);

    return WheelConfig::factory()->create([
        'wheel_model_id' => $model->id,
        'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id,
        'diameter_in' => $diameter, 'width_in' => 7.5, 'et_mm' => 35, 'bolt_holes' => 5, 'bolt_circle_mm' => 112.0, 'centre_bore_mm' => 66.6,
    ]);
}

/** @return array{li: int|null, si: string|null, rowLi: int|null, rowSi: string|null} what the line and the shop's row hold */
function svcStored(DocumentCarEntry $cell): array
{
    $line = DB::table('document_tyre_lines')->where('document_car_entry_id', $cell->id)->orderBy('position')->first();
    $size = DB::table('fitment_tyre_sizes')->join('fitments', 'fitments.id', '=', 'fitment_tyre_sizes.fitment_id')
        ->where('fitments.approval_document_id', $cell->approval_document_id)->where('fitments.vehicle_id', $cell->vehicle_id)
        ->orderBy('fitment_tyre_sizes.id')->first(['fitment_tyre_sizes.min_load_index', 'fitment_tyre_sizes.min_speed_symbol']);

    return [
        'li' => $line?->front_load_index === null ? null : (int) $line->front_load_index,
        'si' => $line?->front_speed_symbol,
        'rowLi' => $size?->min_load_index === null ? null : (int) $size->min_load_index,
        'rowSi' => $size?->min_speed_symbol,
    ];
}

it('reads what the paper prints the same typed, pasted and copied in step 4', function (string $text, int $li, string $si): void {
    $tyre = TyreText::read($text) ?? throw new LogicException("unread: {$text}");
    $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Document)->create();
    $wheel = svcWheel((float) $tyre['diameter']);
    $cars = Vehicle::factory()->count(3)->create();
    $cells = array_map(static fn (Vehicle $car): DocumentCarEntry => EntryDriver::car(test(), svcAdmin(), $document->id, $car->id, $wheel->id), $cars->all());
    $save = fn (DocumentCarEntry $cell, string $typed) => $this->actingAs(svcAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$cell->id}", [
        'lines' => [['id' => null, 'front' => $typed, 'rear' => $typed, 'kw' => '', 'codes' => []]], 'codes' => [], 'source_page' => 2,
    ])->assertOk();

    // Typed as printed; pasted, the box sends the line as the shop writes it (tyreLabel, TyreText::label).
    $save($cells[0], $text);
    $save($cells[1], TyreText::label($tyre));
    $this->actingAs(svcAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$cells[0]->id}/kopieren", ['ziele' => [$cells[2]->id], 'modus' => 'ersetzen'])->assertOk();

    $want = ['li' => $li, 'si' => $si, 'rowLi' => $li, 'rowSi' => $si];

    expect(svcStored($cells[0]))->toBe($want)
        ->and(svcStored($cells[1]))->toBe($want)
        ->and(svcStored($cells[2]))->toBe($want);
})->with('printed');

it('reads the same in the tyre catalogue: the symbol as printed, and its load index with it where none is typed', function (string $text, int $li, string $si): void {
    $tyre = TyreText::read($text) ?? throw new LogicException("unread: {$text}");
    $service = trim((string) preg_replace('/^.*R\s*\d{2}(\s*C)?/i', '', $text));
    $rank = app(IndexTables::class)->speedSymbol($si)?->rank;

    $this->actingAs(svcAdmin(), 'admin')->post('/admin/reifen', [
        'brand_id' => null, 'brand_new' => 'Prüfreifen', 'name' => 'Grip '.$li.$si, 'season' => 'sommer',
        'width_mm' => (string) $tyre['width'], 'aspect' => (string) $tyre['aspect'], 'diameter_in' => (string) $tyre['diameter'],
        'load_index' => '', 'speed_symbol' => $service,
        'eu_fuel_class' => 'B', 'eu_wet_grip_class' => 'A', 'eu_noise_db' => '71', 'eu_noise_class' => 'B', 'eu_snow_grip' => false, 'eu_ice_grip' => false,
        'eprel_id' => (string) (380000 + $li), 'price' => '129,00', 'available' => true,
    ])->assertSessionHasNoErrors();

    $stored = TyreVariant::query()->where('name', 'Grip '.$li.$si)->sole();

    expect($stored->load_index)->toBe($li)
        ->and($stored->speed_symbol)->toBe($si)
        ->and($stored->speed_rank)->toBe($rank)
        ->and($rank)->not->toBeNull();
})->with('printed');

it('ranks (W) above W and below Y, and never derives it as a minimum (D-453)', function (): void {
    $tables = app(IndexTables::class);
    $deriver = new SpeedSymbolDeriver($tables);
    $rank = static fn (string $s): ?int => $tables->speedSymbol($s)?->rank;

    expect($rank('W'))->toBe(14)
        ->and($rank('(W)'))->toBe(15)
        ->and($rank('Y'))->toBe(16)
        ->and($rank('(Y)'))->toBe(17)
        ->and((string) $deriver->forTopSpeed(270))->toBe('W')
        ->and((string) $deriver->forTopSpeed(271))->toBe('Y')
        ->and((string) $deriver->forTopSpeed(301))->toBe('(Y)')
        ->and(DB::table('speed_symbol_table')->orderBy('speed_rank')->pluck('symbol')->all())->toBe(TyreText::SYMBOLS);
});
