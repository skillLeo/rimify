<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCarEntry;
use App\Models\DocumentCondition;
use App\Models\DocumentConditionRework;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Services\Admin\AuditDescriber;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Gutachten\EntryDriver;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * A code deleted from the whole paper in step 4 (the client's request of 12.11.2026, G; D-461): where it stands is said first — in
 * step 4's own words, „in 2 Kombinationen und in den „Allgemeinen Codes“ von 1 Fahrzeug“ —, then it goes from every
 * one of those places, from the Auflagenverzeichnis with its rework measurements, and from the rows; one Protokoll entry names it.
 * On a draft only: a released paper changes through a new Fassung and the release door. A count that moved since it was shown is
 * asked again, never deleted over.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function codeDelAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function codeDelWheel(): WheelConfig
{
    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'DB8GT']);

    return WheelConfig::factory()->create([
        'wheel_model_id' => $model->id,
        'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id,
        'diameter_in' => 18.0, 'width_in' => 8.0, 'et_mm' => 35, 'bolt_holes' => 5, 'bolt_circle_mm' => 120.0, 'centre_bore_mm' => 72.5,
    ]);
}

/**
 * A draft with 11A and 2B described, one car on one wheel: 11A beside a combination, beside a size and among the car's general
 * codes, with one rework measurement; 2B beside the size alone.
 *
 * @return array{document: ApprovalDocument, car: Vehicle, wheel: WheelConfig, entry: DocumentCarEntry}
 */
function codeDelPaper(object $test): array
{
    $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Document)->create();

    foreach (['11A' => ['karosseriearbeit', 'Bördeln der Radlaufkante.'], '2B' => ['hinweis', 'Nur mit Schneeketten der Firma X.']] as $code => [$kind, $text]) {
        $test->actingAs(codeDelAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => $code, 'kind' => $kind, 'text_de' => $text])->assertSessionHasNoErrors();
    }

    DocumentConditionRework::query()->create([
        'document_condition_id' => DocumentCondition::query()->where('approval_document_id', $document->id)->where('code', '11A')->value('id'),
        'vehicle_type' => 'E90', 'axle' => 'REAR', 'from_mm' => 15, 'to_mm' => 30, 'flare_mm' => null, 'note_de' => null,
    ]);

    $k = 'e1*2001/116*0308*00-08';
    $car = Vehicle::factory()->create(['eg_nummer_raw' => $k, 'eg_nummer_norm' => $k, 'axle_load_front_kg' => 900, 'axle_load_rear_kg' => 1000, 'max_speed_kmh' => 200, 'power_kw' => 170]);
    $wheel = codeDelWheel();
    $entry = EntryDriver::car($test, codeDelAdmin(), $document->id, $car->id, $wheel->id);

    $test->actingAs(codeDelAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}", [
        'lines' => [
            ['id' => null, 'front' => '225/35 R18 90W', 'rear' => '255/35 R18 90W', 'kw' => '', 'codes' => ['11A']],
            ['id' => null, 'front' => '225/40 R18 92W', 'rear' => '225/40 R18 92W', 'kw' => '', 'codes' => ['11A', '2B']],
        ],
        'codes' => [['code' => '11A', 'note' => null]],
        'source_page' => 2,
    ])->assertOk();

    return ['document' => $document, 'car' => $car, 'wheel' => $wheel, 'entry' => $entry];
}

/** @return array<string, mixed> */
function codeDelUsage(object $test, ApprovalDocument $document, string $code, string $role = 'super-admin'): array
{
    return $test->actingAs(codeDelAdmin($role), 'admin')->getJson("/admin/gutachten/{$document->id}/erfassung/codes/verwendung?code=".rawurlencode($code))
        ->assertOk()->json();
}

it('says where a code stands in step 4\'s words, and deletes it from all of them, the list, its measurements and the rows', function (): void {
    ['document' => $document] = codeDelPaper($this);
    $asked = codeDelUsage($this, $document, '11A');

    expect($asked['uses'])->toBe(['combinations' => 2, 'cars' => 1, 'rows' => 0, 'reworks' => 1])
        ->and($asked['sentence'])->toBe('„11A“ wird in 2 Kombinationen und in den „Allgemeinen Codes“ von 1 Fahrzeug verwendet. Mit dem Code geht 1 Maß der Nacharbeit.')
        // The rows the steps wrote carry it before.
        ->and(DB::table('fitment_conditions as fc')->join('fitments as f', 'f.id', '=', 'fc.fitment_id')->where('f.approval_document_id', $document->id)->where('fc.code', '11A')->exists()
            || DB::table('document_tyre_combination_conditions as c')->join('document_tyre_combinations as t', 't.id', '=', 'c.document_tyre_combination_id')->where('t.approval_document_id', $document->id)->where('c.code', '11A')->exists())->toBeTrue();

    $answer = $this->actingAs(codeDelAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/codes/loeschen", ['code' => '11A', 'seen' => $asked['uses']])
        ->assertOk()->json();

    expect($answer['toast'])->toBe('„11A“ ist aus diesem Gutachten gelöscht.')
        ->and($answer['deleted'])->toBe('11A')
        ->and(codeDelUsage($this, $document, '11A')['uses'])->toBe(['combinations' => 0, 'cars' => 0, 'rows' => 0, 'reworks' => 0])
        ->and(DocumentCondition::query()->where('approval_document_id', $document->id)->pluck('code')->all())->toBe(['2B'])
        ->and(DocumentConditionRework::query()->count())->toBe(0)
        ->and(DB::table('fitment_conditions')->where('code', '11A')->count())->toBe(0)
        ->and(DB::table('fitment_tyre_size_conditions')->where('code', '11A')->count())->toBe(0)
        // 2B, beside the same combination, stays where it was typed.
        ->and(codeDelUsage($this, $document, '2B')['uses']['combinations'])->toBe(1);

    $log = AuditLog::query()->where('description', 'approval.code_deleted')->sole();

    expect($log->properties['code'] ?? null)->toBe('11A')
        ->and([$log->properties['combinations'] ?? null, $log->properties['cars'] ?? null, $log->properties['reworks'] ?? null])->toBe([2, 1, 1])
        ->and(app(AuditDescriber::class)->describe($log)['sentence'])->toContain('wurde der Code „11A“ überall gelöscht. „11A“ wird in 2 Kombinationen');
});

it('releases the paper without the code: the shop no longer asks for it — less strict on purpose', function (): void {
    ['document' => $document, 'car' => $car, 'wheel' => $wheel] = codeDelPaper($this);
    $asked = codeDelUsage($this, $document, '11A');

    $this->actingAs(codeDelAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/codes/loeschen", ['code' => '11A', 'seen' => $asked['uses']])->assertOk();
    $this->actingAs(codeDelAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document->refresh()))->assertSessionHasNoErrors();

    $verdict = app(FitmentResolver::class)->resolve($car->id, $wheel->id);
    $codes = array_map(static fn (Condition $c): string => $c->code, [...$verdict->conditions, ...collect($verdict->conditionGroups())->flatten()->filter(static fn (mixed $c): bool => $c instanceof Condition)->all()]);

    expect($codes)->not->toContain('11A')
        ->and($verdict->status->value)->not->toBe('UNKNOWN');
});

it('asks again where the count moved since it was shown, and deletes nothing', function (): void {
    ['document' => $document] = codeDelPaper($this);
    $asked = codeDelUsage($this, $document, '11A');
    $stale = [...$asked['uses'], 'combinations' => $asked['uses']['combinations'] + 1];

    $this->actingAs(codeDelAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/codes/loeschen", ['code' => '11A', 'seen' => $stale])
        ->assertUnprocessable()->assertJsonValidationErrors(['code' => DocumentConditions::USES_MOVED]);

    expect(codeDelUsage($this, $document, '11A')['uses'])->toBe($asked['uses'])
        ->and(AuditLog::query()->where('description', 'approval.code_deleted')->exists())->toBeFalse();
});

it('deletes an unused code and one only typed, never described, the same way', function (): void {
    ['document' => $document] = codeDelPaper($this);
    $this->actingAs(codeDelAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => '99Z', 'kind' => 'hinweis', 'text_de' => 'Nur ein Beispiel.'])->assertSessionHasNoErrors();

    $unused = codeDelUsage($this, $document, '99Z');
    expect($unused['sentence'])->toBe('„99Z“ wird in diesem Gutachten nirgends verwendet.');
    $this->actingAs(codeDelAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/codes/loeschen", ['code' => '99Z', 'seen' => $unused['uses']])->assertOk();

    expect(DocumentCondition::query()->where('approval_document_id', $document->id)->where('code', '99Z')->exists())->toBeFalse();
});

it('refuses a released paper — it changes through a new Fassung and the release door — and a role that may not edit it (R-11)', function (): void {
    ['document' => $document] = codeDelPaper($this);
    $asked = codeDelUsage($this, $document, '2B');
    $this->actingAs(codeDelAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document->refresh()))->assertSessionHasNoErrors();

    $this->actingAs(codeDelAdmin(), 'admin')->getJson("/admin/gutachten/{$document->id}/erfassung/codes/verwendung?code=2B")->assertForbidden();
    $this->actingAs(codeDelAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/codes/loeschen", ['code' => '2B', 'seen' => $asked['uses']])->assertForbidden();

    ['document' => $draft] = codeDelPaper($this);
    $this->actingAs(codeDelAdmin('support-agent'), 'admin')->postJson("/admin/gutachten/{$draft->id}/erfassung/codes/loeschen", ['code' => '2B', 'seen' => $asked['uses']])->assertForbidden();

    expect(DocumentCondition::query()->where('code', '2B')->count())->toBe(2);
});

it('takes a code off one combination with its ×, and leaves it on the other: the shop asks for it there alone', function (): void {
    ['document' => $document, 'car' => $car, 'wheel' => $wheel, 'entry' => $entry] = codeDelPaper($this);
    $save = fn (array $first, array $second) => $this->actingAs(codeDelAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}", [
        'lines' => [
            ['id' => null, 'front' => '225/35 R18 90W', 'rear' => '255/35 R18 90W', 'kw' => '', 'codes' => $first],
            ['id' => null, 'front' => '225/40 R18 92W', 'rear' => '225/40 R18 92W', 'kw' => '', 'codes' => $second],
        ],
        'codes' => [],
        'source_page' => 2,
    ])->assertOk();

    // No general code, so only the combinations carry 11A; then the × on the first one's tag, as step 4 saves it.
    $save(['11A'], ['11A']);
    expect(codeDelUsage($this, $document, '11A')['uses']['combinations'])->toBe(2);
    $save([], ['11A']);
    expect(codeDelUsage($this, $document, '11A')['uses']['combinations'])->toBe(1);

    $this->actingAs(codeDelAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document->refresh()))->assertSessionHasNoErrors();

    $byCombination = DB::table('document_tyre_combination_conditions as c')
        ->join('document_tyre_combinations as t', 't.id', '=', 'c.document_tyre_combination_id')
        ->where('t.approval_document_id', $document->id)->where('c.code', '11A')
        ->get(['t.front_width_mm', 't.rear_width_mm'])->map(static fn (object $r): string => $r->front_width_mm.'|'.$r->rear_width_mm)->all();

    expect($byCombination)->toBe(['225|225']);

    $codes = static fn (array $conditions): array => array_map(static fn (Condition $c): string => $c->code, $conditions);
    $pairs = collect(app(FitmentResolver::class)->resolve($car->id, $wheel->id)->pairConditions)
        ->mapWithKeys(static fn ($p): array => [$p->key() => $codes($p->conditions)])->all();

    expect(collect($pairs)->filter(static fn (array $c, string $key): bool => str_contains($key, '255'))->flatten()->all())->not->toContain('11A');
});
