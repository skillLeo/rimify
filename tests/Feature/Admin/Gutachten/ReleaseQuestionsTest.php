<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCarEntry;
use App\Models\DocumentCondition;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Gutachten\EntryDriver;

/*
 * Step 5 „Freigeben“ after the client's round of 08.11.2026, §3: the count of the Verwendungsbereich — Auflagen-Codes and Reifengrößen,
 * each with its page (D-440) — and the Achslastgrenze (D-441) are no longer asked, shown or compared. „Ist das Gutachten vollständig
 * erfasst?“ stays (D-227: it decides what the shop says about a car the paper does not list), and so does the Abnahme question, which
 * he did not ask to remove. An axle-load limit the paper prints still works through its codes of kind Tragfähigkeit (5KA, 5MK).
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function questionsAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/** A draft with one car on one wheel: one line, and these codes on it. */
function questionsDraft(array $codes = [], array $document = []): ApprovalDocument
{
    $paper = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Document)->create(['page_count' => 8, ...$document]);

    foreach ($codes as $code => [$kind, $text]) {
        DocumentCondition::factory()->kind($kind, $text)->create(['approval_document_id' => $paper->id, 'code' => $code]);
    }

    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'Fragen']);
    $wheel = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id, 'diameter_in' => 18.0, 'max_load_kg' => null]);
    $entry = EntryDriver::car(test(), questionsAdmin(), $paper->id, Vehicle::factory()->create(['max_speed_kmh' => 200])->id, $wheel->id);

    test()->actingAs(questionsAdmin(), 'admin')->putJson("/admin/gutachten/{$paper->id}/erfassung/fahrzeuge/{$entry->id}", [
        'lines' => [['id' => null, 'front' => '225/40 R18 92Y', 'rear' => '225/40 R18 92Y', 'kw' => '', 'codes' => array_keys($codes)]],
        'codes' => [],
        'source_page' => 2,
    ])->assertOk();

    return $paper->refresh();
}

describe('§3.1: the count of codes and sizes (D-440)', function (): void {
    it('releases on the completeness and the Abnahme alone: no Auflagen-Codes, no Reifengrößen, no pages asked', function (): void {
        $paper = questionsDraft();

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben", ['completeness' => 'complete', 'abnahme' => 'none'])
            ->assertSessionHasNoErrors();

        expect($paper->refresh()->status->value)->toBe('published')
            ->and(AuditLog::query()->where('description', 'approval.released')->sole()->properties['declared'])
            ->toBe(['completeness' => 'complete', 'missing' => null, 'abnahme' => 'none']);
    });

    it('no longer compares a count taken earlier with the entry, on the page or at the door', function (): void {
        $paper = questionsDraft();
        // A count from before, figures the entry does not match: 6 codes, 3 sizes.
        $paper->forceFill(['counted_codes' => 6, 'counted_codes_page' => 3, 'counted_sizes' => 3, 'counted_sizes_page' => 3, 'counted_abnahme' => 'none', 'counted_at' => now(), 'counted_before_entry' => true])->save();

        $this->actingAs(questionsAdmin(), 'admin')->get("/admin/gutachten/{$paper->id}")->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->where('blockers', fn ($blockers): bool => collect($blockers)->filter(fn (string $b): bool => str_contains($b, 'laut Verwendungsbereich'))->isEmpty())
            ->missing('document.count'));

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben", ['completeness' => 'complete', 'abnahme' => 'none'])
            ->assertSessionHasNoErrors();

        expect($paper->refresh()->status->value)->toBe('published');
    });

    it('has no count of its own any more: the endpoint is gone', function (): void {
        $paper = questionsDraft();

        expect(Route::has('admin.gutachten.zaehlung'))->toBeFalse();

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/zaehlung", ['codes' => 1, 'codes_page' => 1, 'sizes' => 1, 'sizes_page' => 1, 'abnahme' => 'none'])
            ->assertMethodNotAllowed();

        expect($paper->refresh()->counted_codes)->toBeNull();
    });
});

describe('§3.2: the Achslastgrenze (D-441)', function (): void {
    it('asks for none, and an earlier answer no longer refuses a wheel without a tested load', function (): void {
        $paper = questionsDraft();
        $paper->forceFill(['counted_codes' => 0, 'counted_codes_page' => 1, 'counted_sizes' => 1, 'counted_sizes_page' => 1, 'counted_axle_limit_kg' => 1160, 'counted_axle_limit_page' => 3, 'counted_abnahme' => 'none', 'counted_at' => now()])->save();

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben", ['completeness' => 'complete', 'abnahme' => 'none'])
            ->assertSessionHasNoErrors();

        expect($paper->refresh()->status->value)->toBe('published');
    });

    it('still limits the tyres through the paper\'s own load codes: the RC200\'s 5MK, released without the question', function (): void {
        $paper = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create(['page_count' => 8]);
        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/auflagen", ['code' => '5MK', 'kind' => 'reifen_tragfaehigkeit', 'text_de' => 'Die Verwendung dieser Reifengröße ist nur zulässig an Fahrzeugausführungen bis zu einer zulässigen Achslast von 1850kg.', 'max_axle_load_kg' => 1850])
            ->assertSessionHasNoErrors();
        $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'NUE', 'type_designation' => 'RC200 8,5x20']);
        $wheel = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id, 'diameter_in' => 20.0, 'width_in' => 8.5]);
        $above = Vehicle::factory()->create(['axle_load_front_kg' => 1600, 'axle_load_rear_kg' => 1900, 'max_speed_kmh' => 200]);
        $within = Vehicle::factory()->create(['axle_load_front_kg' => 1600, 'axle_load_rear_kg' => 1800, 'max_speed_kmh' => 200]);

        foreach ([$above, $within] as $car) {
            $entry = EntryDriver::car($this, questionsAdmin(), $paper->id, $car->id, $wheel->id);
            $this->actingAs(questionsAdmin(), 'admin')->putJson("/admin/gutachten/{$paper->id}/erfassung/fahrzeuge/{$entry->id}", [
                'lines' => [['id' => null, 'front' => '255/45 R20 105', 'rear' => '255/45 R20 105', 'kw' => '', 'codes' => ['5MK']], ['id' => null, 'front' => '265/45 R20 108', 'rear' => '265/45 R20 108', 'kw' => '', 'codes' => []]],
                'codes' => [],
                'source_page' => 2,
            ])->assertOk();
        }

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben", ['completeness' => 'complete', 'abnahme' => 'none'])
            ->assertSessionHasNoErrors();

        $axles = static fn (Vehicle $car): array => FitmentTyreSize::query()->whereIn('fitment_id', Fitment::query()->where('vehicle_id', $car->id)->select('id'))
            ->where('width_mm', 255)->get()->map(fn (FitmentTyreSize $s): string => $s->axle->value)->all();
        $rear = static fn (Vehicle $car): array => array_map(static fn ($s): string => $s->key(), app(FitmentResolver::class)->resolve($car->id, $wheel->id)->rear->sizes);

        // Above the cap on the rear: the 255/45 is gone from that axle. Within it: kept, with its code.
        expect($axles($above))->toBe(['FRONT'])
            ->and($axles($within))->toBe(['ALL'])
            ->and($rear($above))->toBe(['265/45/20'])
            ->and($rear($within))->toContain('255/45/20');
    });
});

describe('what stays', function (): void {
    it('asks whether the paper is entered completely, as before (D-227)', function (): void {
        $paper = questionsDraft();

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben", ['abnahme' => 'none'])
            ->assertSessionHasErrors('completeness');
    });

    it('asks the Abnahme, and still refuses where the answer and the entry differ', function (): void {
        $paper = questionsDraft(['A1' => [ConditionKind::Abnahme, 'Abnahme durch eine Prüfstelle erforderlich.']]);

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben", ['completeness' => 'complete'])
            ->assertSessionHasErrors('abnahme');

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben", ['completeness' => 'complete', 'abnahme' => 'none'])
            ->assertSessionHasErrors(['release' => 'Noch nicht freigebbar: Der Verwendungsbereich verlangt keine Abnahme, aber bei einer Zeile ist eine erfasst. Prüf die Codes.']);

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben", ['completeness' => 'complete', 'abnahme' => 'all', 'abnahme_page' => 4])
            ->assertSessionHasNoErrors();

        expect($paper->refresh()->status->value)->toBe('published');
    });

    it('asks a paper without rows only the completeness: no Abnahme', function (): void {
        $paper = ApprovalDocument::factory()->draft()->create();

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben", ['completeness' => 'complete'])
            ->assertSessionDoesntHaveErrors(['abnahme', 'abnahme_page', 'completeness']);
    });
});
