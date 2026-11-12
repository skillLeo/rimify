<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\PairConditions;
use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCarEntry;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentPreview;
use App\Services\Admin\Approvals\Entry\CombinationCodesToSets;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use App\Services\Admin\Approvals\Entry\EngineRows;
use App\Services\Admin\Approvals\Entry\EntryModel;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Gutachten\EntryDriver;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * An Auflage typed beside a combination of step 4 belongs to that combination — both its axles, and no other (the client's review of
 * 11.11, A and E; D-451). Before, the engine hung codes on tyre sizes: a code on „225/35 R18 | 255/35 R18“ reached „225/35 R18 |
 * 225/35 R18“ through the size they share (D-437 took it off that side), and the shop said it for one axle („11A · Hinterachse“). Now
 * the combination's row of the list holds it (`document_tyre_combination_conditions`), for the wheels of the cell it was typed in.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function setCodesAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

function setCodesWheel(float $width = 8.0, int $et = 35): WheelConfig
{
    $model = WheelModel::query()->where('name', 'DB8GT')->first() ?? WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'DB8GT']);

    return WheelConfig::factory()->create([
        'wheel_model_id' => $model->id,
        'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id,
        'diameter_in' => 18.0, 'width_in' => $width, 'et_mm' => $et, 'bolt_holes' => 5, 'bolt_circle_mm' => 120.0, 'centre_bore_mm' => 72.5,
    ]);
}

/** @param  array<string, array{0: string, 1: string, 2?: int}>  $codes  code => kind, sentence, axle load */
function setCodesPaper(object $test, array $codes): ApprovalDocument
{
    $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Document)->create();

    foreach ($codes as $code => [$kind, $text]) {
        $test->actingAs(setCodesAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => $code, 'kind' => $kind, 'text_de' => $text, 'max_axle_load_kg' => $codes[$code][2] ?? null])->assertSessionHasNoErrors();
    }

    return $document;
}

function setCodesCar(): Vehicle
{
    $k = 'e1*2001/116*0308*00-08';

    return Vehicle::factory()->create(['eg_nummer_raw' => $k, 'eg_nummer_norm' => $k, 'axle_load_front_kg' => 900, 'axle_load_rear_kg' => 1000, 'max_speed_kmh' => 200, 'power_kw' => 170]);
}

/** @param  list<array{0: string, 1: string, 2: list<string>}>  $lines */
function setCodesLines(object $test, DocumentCarEntry $entry, array $lines): void
{
    $test->actingAs(setCodesAdmin(), 'admin')->putJson("/admin/gutachten/{$entry->approval_document_id}/erfassung/fahrzeuge/{$entry->id}", [
        'lines' => array_map(static fn (array $line): array => ['id' => null, 'front' => $line[0], 'rear' => $line[1], 'kw' => '', 'codes' => $line[2]], $lines),
        'codes' => [],
        'source_page' => 2,
    ])->assertOk();
}

/**
 * A released paper with these lines and codes, on one car, and that car's answer for the wheel.
 *
 * @param  list<array{0: string, 1: string, 2: list<string>}>  $lines
 * @param  array<string, array{0: string, 1: string, 2?: int}>  $codes  code => kind, sentence, axle load
 */
function setCodesVerdict(object $test, array $lines, array $codes): FitmentVerdict
{
    $document = setCodesPaper($test, $codes);
    $wheel = setCodesWheel();
    $car = setCodesCar();
    setCodesLines($test, EntryDriver::car($test, setCodesAdmin(), $document->id, $car->id, $wheel->id), $lines);
    $test->actingAs(setCodesAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();

    return app(FitmentResolver::class)->resolve($car->id, $wheel->id);
}

/** @return array<string, list<string>> each size the answer names on that axle, with the codes it carries itself */
function setCodesOn(FitmentVerdict $verdict, string $axle): array
{
    $out = [];

    foreach (($axle === 'FRONT' ? $verdict->front : $verdict->rear)->sizes as $size) {
        /** @var TyreSize $size */
        $out[$size->key()] = array_map(static fn (Condition $c): string => $c->code, $size->conditions);
    }

    return $out;
}

/** @param list<Condition> $conditions @return list<string> */
function setCodesCodes(array $conditions): array
{
    return array_values(array_unique(array_map(static fn (Condition $c): string => $c->code, $conditions)));
}

/** @return array<string, list<string>> combination => its own codes */
function setCodesPairs(FitmentVerdict $verdict): array
{
    return collect($verdict->pairConditions)->mapWithKeys(static fn (PairConditions $p): array => [$p->key() => setCodesCodes($p->conditions)])->all();
}

it('keeps 11A with „225/35 R18 | 255/35 R18“ for both its axles, and off „225/35 R18 | 225/35 R18“ that shares a size (E) @admin-451', function (): void {
    $verdict = setCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $groups = $verdict->conditionGroups();
    $bördeln = $verdict->pairConditions[0]->conditions[0]->sentenceDe();

    expect(setCodesOn($verdict, 'FRONT'))->toBe(['225/35/18' => []])
        ->and(setCodesOn($verdict, 'REAR'))->toBe(['225/35/18' => [], '255/35/18' => []])
        ->and(setCodesPairs($verdict))->toBe(['225/35/18|255/35/18' => ['11A']])
        // The set Nr. 2 says Bördeln on both its axles; the set Nr. 1 — and four of 225/35 — on neither.
        ->and(setCodesCodes($groups->forSet('225/35/18', '255/35/18', 'Vorderachse')))->toBe(['11A'])
        ->and(setCodesCodes($groups->forSet('255/35/18', '225/35/18', 'Hinterachse')))->toBe(['11A'])
        ->and(setCodesCodes($groups->forSet('225/35/18', '225/35/18')))->toBe([])
        ->and(setCodesCodes($groups->forSize('225/35/18')))->toBe([])
        ->and(setCodesCodes($groups->combination))->toBe([])
        // Said once, under the combination — never under one axle.
        ->and($groups->toArray()['pairs'])->toBe([['pair' => '225/35 R18 vorn, 255/35 R18 hinten', 'conditions' => [$bördeln], 'entry' => false]])
        ->and($groups->toArray()['sizes'])->toBe([])
        // The rim alone still carries every Auflage a combination it may be fitted with could bring.
        ->and($verdict->status->value)->toBe('CONDITIONAL')
        ->and(setCodesCodes($verdict->conditions))->toBe(['11A']);
});

it('keeps a code with its combination where both its sizes stand in others without it — what D-437 could not say', function (): void {
    $verdict = setCodesVerdict($this, [
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
        ['225/35 R18 90W', '235/35 R18 90W', []],
        ['235/35 R18 90W', '255/35 R18 90W', []],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $groups = $verdict->conditionGroups();

    expect(setCodesOn($verdict, 'FRONT'))->toBe(['225/35/18' => [], '235/35/18' => []])
        ->and(setCodesOn($verdict, 'REAR'))->toBe(['255/35/18' => [], '235/35/18' => []])
        ->and(setCodesCodes($groups->forSet('225/35/18', '255/35/18', 'Vorderachse')))->toBe(['11A'])
        ->and(setCodesCodes($groups->forSet('225/35/18', '235/35/18', 'Vorderachse')))->toBe([])
        ->and(setCodesCodes($groups->forSet('255/35/18', '235/35/18', 'Hinterachse')))->toBe([]);
});

it('leaves a tyre\'s own load code on the sizes it was typed beside: which tyre it limits is the point', function (): void {
    $verdict = setCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['5KA']],
    ], ['5KA' => ['reifen_tragfaehigkeit', 'Die Verwendung dieser Reifengröße ist nur zulässig bis zu einer zulässigen Achslast von 1100 kg.', 1100]]);

    expect(setCodesOn($verdict, 'FRONT')['225/35/18'])->toBe(['5KA'])
        ->and(setCodesOn($verdict, 'REAR')['255/35/18'])->toBe(['5KA'])
        ->and($verdict->pairConditions)->toBe([]);
});

it('shows the combination\'s code in step 5\'s preview under that combination alone, as the shop will (E)', function (): void {
    $verdict = setCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $document = ApprovalDocument::query()->latest('id')->firstOrFail();
    $preview = app(DocumentPreview::class)->for($document, (int) $verdict->vehicle->id);
    $groups = $preview[0]['conditionGroups'];

    expect($groups['combination'])->toBe([])
        ->and($groups['sizes'])->toBe([])
        ->and(collect($groups['pairs'])->pluck('pair')->all())->toBe(['225/35 R18 vorn, 255/35 R18 hinten'])
        ->and($groups['pairs'][0]['conditions'])->toHaveCount(1);
});

it('keeps a code typed in one cell of a car off the wheels of its other cells: the list is the car\'s, the code the cell\'s', function (): void {
    $document = setCodesPaper($this, ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $narrow = setCodesWheel(8.0, 35);
    $wide = setCodesWheel(8.5, 25);
    $car = setCodesCar();
    $first = EntryDriver::car($this, setCodesAdmin(), $document->id, $car->id, $narrow->id);
    $this->actingAs(setCodesAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/kombinationen", ['front_config_id' => $wide->id, 'rear_config_id' => $wide->id])->assertOk();
    $this->actingAs(setCodesAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge", ['vehicle_ids' => [$car->id]])->assertOk();
    $second = DocumentCarEntry::query()->where('approval_document_id', $document->id)->where('vehicle_id', $car->id)->whereKeyNot($first->id)->firstOrFail();

    setCodesLines($this, $first, [['225/35 R18 90W', '225/35 R18 90W', []], ['225/35 R18 90W', '255/35 R18 90W', ['11A']]]);
    setCodesLines($this, $second, [['225/35 R18 90W', '225/35 R18 90W', []], ['225/35 R18 90W', '255/35 R18 90W', []]]);
    $this->actingAs(setCodesAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();

    $resolver = app(FitmentResolver::class);

    expect(setCodesPairs($resolver->resolve($car->id, $narrow->id)))->toBe(['225/35/18|255/35/18' => ['11A']])
        ->and(setCodesPairs($resolver->resolve($car->id, $wide->id)))->toBe([])
        ->and($resolver->resolve($car->id, $wide->id)->status->value)->toBe('PERMITTED')
        ->and(DB::table('document_tyre_combination_conditions')->pluck('wheel_config_id')->all())->toBe([$narrow->id]);
});

it('writes back exactly what the shop reads, the combinations\' codes included', function (): void {
    setCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $document = ApprovalDocument::query()->latest('id')->firstOrFail();
    $actual = EngineRows::actual($document);

    expect($actual)->toBe((new DocumentEntryWriter)->desired(EntryModel::of($document)))
        ->and(collect($actual['list'])->pluck('codes')->filter()->values()->all())->toHaveCount(1);
});

/** The rows as DocumentEntryWriter wrote them under D-437: 11A on the rear size of its combination, none on the combination. */
function setCodesAsBefore(ApprovalDocument $document): int
{
    DB::table('document_tyre_combination_conditions')->delete();
    $rear = (int) DB::table('fitment_tyre_sizes')->join('fitments', 'fitments.id', '=', 'fitment_tyre_sizes.fitment_id')
        ->where('fitments.approval_document_id', $document->id)->where('fitment_tyre_sizes.width_mm', 255)->value('fitment_tyre_sizes.id');
    DB::table('fitment_tyre_size_conditions')->insert(['fitment_tyre_size_id' => $rear, 'code' => '11A', 'created_at' => now(), 'updated_at' => now()]);

    return $rear;
}

it('moves a released paper\'s code once: off the size, onto its combination for that wheel, nothing else, said in the Protokoll', function (): void {
    $verdict = setCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $document = ApprovalDocument::query()->latest('id')->firstOrFail();
    $after = EngineRows::actual($document);
    $rear = setCodesAsBefore($document);
    $before = EngineRows::actual($document);
    $resolve = static fn (): FitmentVerdict => app(FitmentResolver::class)->resolve((int) $verdict->vehicle->id, (int) $verdict->wheel?->id);

    expect(setCodesOn($resolve(), 'REAR')['255/35/18'])->toBe(['11A'])->and($resolve()->pairConditions)->toBe([]);

    $move = new CombinationCodesToSets(new DocumentEntryWriter);
    $dry = $move->move($document, write: false);
    expect($dry['moved'])->toHaveCount(1)->and($dry['additions'])->toBe(1)->and(EngineRows::actual($document))->toBe($before);

    $result = $move->move($document);
    $moved = $resolve();

    expect($result['moved'])->toHaveCount(1)
        ->and($result['left'])->toBe([])
        ->and(EngineRows::actual($document))->toBe($after)
        ->and(DB::table('fitment_tyre_size_conditions')->where('fitment_tyre_size_id', $rear)->count())->toBe(0)
        ->and(setCodesPairs($moved))->toBe(['225/35/18|255/35/18' => ['11A']])
        // The answer: every Auflage it had, the same status — only said with its combination now.
        ->and(setCodesCodes($moved->conditions))->toBe(['11A'])
        ->and($moved->status->value)->toBe('CONDITIONAL')
        ->and($move->move($document)['additions'])->toBe(0)
        ->and(AuditLog::query()->where('description', 'approval.combination_codes_to_sets')->sole()->properties['codes'])->toBe(['11A']);
});

it('leaves a row that differs in anything else than such a code, and names it', function (): void {
    setCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $document = ApprovalDocument::query()->latest('id')->firstOrFail();
    $rear = setCodesAsBefore($document);
    DB::table('fitments')->where('approval_document_id', $document->id)->update(['permitted_et_min' => 20]);

    $result = (new CombinationCodesToSets(new DocumentEntryWriter))->move($document);

    expect($result['moved'])->toBe([])
        ->and($result['left'])->toHaveCount(1)
        ->and(DB::table('fitment_tyre_size_conditions')->where('fitment_tyre_size_id', $rear)->pluck('code')->all())->toBe(['11A']);
});

it('puts a combination\'s codes back on its sizes for that wheel, both sides, on the way back — never fewer than before', function (): void {
    $verdict = setCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $document = ApprovalDocument::query()->latest('id')->firstOrFail();

    expect((new CombinationCodesToSets(new DocumentEntryWriter))->back($document->id))->toBeGreaterThanOrEqual(2);

    $back = app(FitmentResolver::class)->resolve((int) $verdict->vehicle->id, (int) $verdict->wheel?->id);

    expect(DB::table('document_tyre_combination_conditions')->count())->toBe(0)
        ->and(setCodesOn($back, 'REAR')['255/35/18'])->toBe(['11A'])
        ->and(setCodesCodes($back->conditions))->toBe(['11A'])
        ->and($back->status)->toBe($verdict->status);
});

it('round-trips: back onto the sizes, then moved again, leaves the rows and the answer exactly as they were', function (): void {
    $verdict = setCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18 90W', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $document = ApprovalDocument::query()->latest('id')->firstOrFail();
    $rows = EngineRows::actual($document);
    $move = new CombinationCodesToSets(new DocumentEntryWriter);

    $move->back($document->id);
    $result = $move->move($document);
    $again = app(FitmentResolver::class)->resolve((int) $verdict->vehicle->id, (int) $verdict->wheel?->id);

    expect($result['left'])->toBe([])
        ->and(EngineRows::actual($document))->toBe($rows)
        ->and($again->toArray()['pairConditions'])->toBe($verdict->toArray()['pairConditions'])
        ->and($again->toArray()['tyres'])->toBe($verdict->toArray()['tyres'])
        ->and($again->status)->toBe($verdict->status);
});

it('takes away an entry that only carried the moved code: the same size and figures stand for both axles (the demo\'s 68B)', function (): void {
    // The combination prints its front size without figures: it takes them from the size's own line, and needs no entry of its own.
    $verdict = setCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln']]);
    $document = ApprovalDocument::query()->latest('id')->firstOrFail();
    $after = EngineRows::actual($document);
    setCodesAsBefore($document);
    // D-437 wrote the front side of a combination as a second entry of its own, for one axle, to carry the code.
    $both = DB::table('fitment_tyre_sizes')->join('fitments', 'fitments.id', '=', 'fitment_tyre_sizes.fitment_id')
        ->where('fitments.approval_document_id', $document->id)->where('fitment_tyre_sizes.width_mm', 225)->where('fitment_tyre_sizes.axle', 'ALL')
        ->first(['fitment_tyre_sizes.*']);
    $front = DB::table('fitment_tyre_sizes')->insertGetId([...collect((array) $both)->except(['id', 'entry_key'])->all(), 'axle' => 'FRONT']);
    DB::table('fitment_tyre_size_conditions')->insert(['fitment_tyre_size_id' => $front, 'code' => '11A', 'created_at' => now(), 'updated_at' => now()]);

    $result = (new CombinationCodesToSets(new DocumentEntryWriter))->move($document);
    $moved = app(FitmentResolver::class)->resolve((int) $verdict->vehicle->id, (int) $verdict->wheel?->id);

    expect($result['left'])->toBe([])
        ->and($result['moved'])->toHaveCount(2)
        ->and(DB::table('fitment_tyre_sizes')->where('id', $front)->exists())->toBeFalse()
        ->and(EngineRows::actual($document))->toBe($after)
        ->and(setCodesPairs($moved))->toBe(['225/35/18|255/35/18' => ['11A']])
        ->and(setCodesCodes($moved->conditions))->toBe(['11A']);
});

it('leaves such an entry where its code would land on no combination, and names it', function (): void {
    setCodesVerdict($this, [
        ['225/35 R18 90W', '225/35 R18 90W', []],
        ['225/35 R18', '255/35 R18 90W', ['11A']],
    ], ['11A' => ['karosseriearbeit', 'Bördeln'], '11B' => ['karosseriearbeit', 'Kotflügel ausstellen']]);
    $document = ApprovalDocument::query()->latest('id')->firstOrFail();
    $both = DB::table('fitment_tyre_sizes')->join('fitments', 'fitments.id', '=', 'fitment_tyre_sizes.fitment_id')
        ->where('fitments.approval_document_id', $document->id)->where('fitment_tyre_sizes.width_mm', 225)->where('fitment_tyre_sizes.axle', 'ALL')
        ->first(['fitment_tyre_sizes.*']);
    $front = DB::table('fitment_tyre_sizes')->insertGetId([...collect((array) $both)->except(['id', 'entry_key'])->all(), 'axle' => 'FRONT']);
    DB::table('fitment_tyre_size_conditions')->insert(['fitment_tyre_size_id' => $front, 'code' => '11B', 'created_at' => now(), 'updated_at' => now()]);

    $result = (new CombinationCodesToSets(new DocumentEntryWriter))->move($document);

    expect($result['left'])->toHaveCount(1)
        ->and(DB::table('fitment_tyre_size_conditions')->where('fitment_tyre_size_id', $front)->pluck('code')->all())->toBe(['11B']);
});
