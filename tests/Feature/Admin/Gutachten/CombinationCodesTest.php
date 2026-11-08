<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\Entry\CombinationCodeRepair;
use App\Services\Admin\Approvals\Entry\EngineRows;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Gutachten\EntryDriver;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * An Auflage typed beside one combination of step 4 belongs to that combination (the client's round of 08.11.2026, §5: „requirements
 * … created for a specific combination are also displayed for other combinations“). The engine hangs codes on tyre sizes, and reads
 * every entry of one size together: a code on „225/35 R18 | 255/35 R18“ reached „225/35 R18 | 225/35 R18“ through the front size the
 * two share — on the preview's ABE 53841, 11A „Bördeln“, at every surface that shows Auflagen and in the Komplettrad's set (D-437).
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function pairCodesAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

function pairCodesWheel(): WheelConfig
{
    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'DB8GT']);

    return WheelConfig::factory()->create([
        'wheel_model_id' => $model->id,
        'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id,
        'diameter_in' => 18.0, 'width_in' => 8.0, 'et_mm' => 35, 'bolt_holes' => 5, 'bolt_circle_mm' => 120.0, 'centre_bore_mm' => 72.5,
    ]);
}

/**
 * A released paper with these lines and codes, on one car, and that car's answer for the wheel.
 *
 * @param  list<array{0: string, 1: string, 2: list<string>}>  $lines
 * @param  array<string, array{0: string, 1: string, 2?: int}>  $codes  code => kind, sentence, axle load
 */
function pairCodesVerdict(object $test, array $lines, array $codes): FitmentVerdict
{
    $k = 'e1*2001/116*0308*00-08';
    $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Document)->create();

    foreach ($codes as $code => [$kind, $text]) {
        $test->actingAs(pairCodesAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => $code, 'kind' => $kind, 'text_de' => $text, 'max_axle_load_kg' => $codes[$code][2] ?? null])->assertSessionHasNoErrors();
    }

    $wheel = pairCodesWheel();
    $car = Vehicle::factory()->create(['eg_nummer_raw' => $k, 'eg_nummer_norm' => $k, 'axle_load_front_kg' => 900, 'axle_load_rear_kg' => 1000, 'max_speed_kmh' => 200, 'power_kw' => 170]);
    $entry = EntryDriver::car($test, pairCodesAdmin(), $document->id, $car->id, $wheel->id);

    $test->actingAs(pairCodesAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}", [
        'lines' => array_map(static fn (array $line): array => ['id' => null, 'front' => $line[0], 'rear' => $line[1], 'kw' => '', 'codes' => $line[2]], $lines),
        'codes' => [],
        'source_page' => 2,
    ])->assertOk();

    $test->actingAs(pairCodesAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();

    return app(FitmentResolver::class)->resolve($car->id, $wheel->id);
}

/** @return array<string, list<string>> each size the answer names on that axle, with the codes it carries itself */
function pairCodesOn(FitmentVerdict $verdict, string $axle): array
{
    $out = [];

    foreach (($axle === 'FRONT' ? $verdict->front : $verdict->rear)->sizes as $size) {
        /** @var TyreSize $size */
        $out[$size->key()] = array_map(static fn (Condition $c): string => $c->code, $size->conditions);
    }

    return $out;
}

/** @param list<Condition> $conditions @return list<string> */
function pairCodesCodes(array $conditions): array
{
    return array_values(array_unique(array_map(static fn (Condition $c): string => $c->code, $conditions)));
}

it('keeps 11A with „225/35 R18 | 255/35 R18“ and off „225/35 R18 | 225/35 R18“, as on the preview\'s ABE 53841', function (): void {
    $verdict = pairCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $groups = $verdict->conditionGroups();

    expect(pairCodesOn($verdict, 'FRONT'))->toBe(['225/35/18' => []])
        ->and(pairCodesOn($verdict, 'REAR'))->toBe(['225/35/18' => [], '255/35/18' => ['11A']])
        // The set Nr. 1: neither axle says Bördeln. The set Nr. 2: its rear does.
        ->and(pairCodesCodes($groups->forSet('225/35/18', '225/35/18')))->toBe([])
        ->and(pairCodesCodes($groups->forSet('255/35/18', '225/35/18')))->toBe(['11A'])
        ->and(pairCodesCodes($groups->combination))->toBe([])
        // The rim alone still carries every Auflage a size it may be fitted with could bring.
        ->and($verdict->status->value)->toBe('CONDITIONAL')
        ->and(pairCodesCodes($verdict->conditions))->toBe(['11A']);
});

it('keeps a code where both sizes of its combination stand in others without it: on both, as before — never on neither', function (): void {
    $verdict = pairCodesVerdict($this, [
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
        ['225/35 R18 90W', '235/35 R18 90W', []],
        ['235/35 R18 90W', '255/35 R18 90W', []],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);

    expect(pairCodesOn($verdict, 'FRONT')['225/35/18'])->toBe(['11A'])
        ->and(pairCodesOn($verdict, 'REAR')['255/35/18'])->toBe(['11A']);
});

it('leaves a tyre\'s own load code on the size it was typed beside: which tyre it limits is the point', function (): void {
    $verdict = pairCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['5KA']],
    ], ['5KA' => ['reifen_tragfaehigkeit', 'Die Verwendung dieser Reifengröße ist nur zulässig bis zu einer zulässigen Achslast von 1100 kg.', 1100]]);

    expect(pairCodesOn($verdict, 'FRONT')['225/35/18'])->toBe(['5KA'])
        ->and(pairCodesOn($verdict, 'REAR')['255/35/18'])->toBe(['5KA']);
});

it('puts a released paper\'s rows right once: the code off the size it bled to, nothing else, said in the Protokoll', function (): void {
    $verdict = pairCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $document = ApprovalDocument::query()->latest('id')->firstOrFail();
    $front = DB::table('fitment_tyre_sizes')->where('width_mm', 225)->where('axle', 'FRONT')->value('id');
    // As DocumentEntryWriter wrote it before D-437.
    DB::table('fitment_tyre_size_conditions')->insert(['fitment_tyre_size_id' => $front, 'code' => '11A', 'created_at' => now(), 'updated_at' => now()]);
    $before = EngineRows::actual($document);

    expect(pairCodesOn(app(FitmentResolver::class)->resolve((int) $verdict->vehicle->id, (int) $verdict->wheel?->id), 'FRONT'))->toBe(['225/35/18' => ['11A']]);

    $dry = app(CombinationCodeRepair::class)->repair($document, write: false);
    expect($dry['removed'])->toHaveCount(1)->and(EngineRows::actual($document))->toBe($before);

    $result = app(CombinationCodeRepair::class)->repair($document);
    $after = EngineRows::actual($document);

    expect($result['removed'])->toHaveCount(1)
        ->and($result['left'])->toBe([])
        ->and(pairCodesOn(app(FitmentResolver::class)->resolve((int) $verdict->vehicle->id, (int) $verdict->wheel?->id), 'FRONT'))->toBe(['225/35/18' => []])
        ->and(app(CombinationCodeRepair::class)->repair($document)['removed'])->toBe([])
        ->and(AuditLog::query()->where('description', 'approval.combination_codes_corrected')->sole()->properties['codes'])->toBe(['11A']);

    // Everything but that one code stands as it stood.
    foreach ($before['rows'] as $key => $row) {
        foreach ($row['sizes'] as $i => $size) {
            $size['codes'] = array_values(array_diff($size['codes'], $size['width_mm'] === 225 && $size['axle'] === 'FRONT' ? ['11A'] : []));
            $row['sizes'][$i] = $size;
        }

        expect($after['rows'][$key])->toBe($row);
    }
});

it('leaves a row that differs in anything else than such a code, and names it', function (): void {
    pairCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $document = ApprovalDocument::query()->latest('id')->firstOrFail();
    $front = DB::table('fitment_tyre_sizes')->where('width_mm', 225)->where('axle', 'FRONT')->value('id');
    DB::table('fitment_tyre_size_conditions')->insert(['fitment_tyre_size_id' => $front, 'code' => '11A', 'created_at' => now(), 'updated_at' => now()]);
    DB::table('fitments')->where('approval_document_id', $document->id)->update(['permitted_et_min' => 20]);

    $result = app(CombinationCodeRepair::class)->repair($document);

    expect($result['removed'])->toBe([])
        ->and($result['left'])->toHaveCount(1)
        ->and(DB::table('fitment_tyre_size_conditions')->where('fitment_tyre_size_id', $front)->pluck('code')->all())->toBe(['11A']);
});
