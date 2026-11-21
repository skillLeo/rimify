<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Gutachten\EntryDriver;

/*
 * Step 5 „Freigeben“. After the client's round of 08.11.2026, §3, the count of the Verwendungsbereich (D-440) and the
 * Achslastgrenze (D-441) were no longer asked; since his round of 18.11.2026, item 2 (D-485), the release asks nothing at all.
 * „Sind alle Fahrzeuge erfasst?“ is the optional switch on the paper's page — unswitched, a car the paper does not name is
 * „noch nicht bestätigt“, never „nicht freigegeben“ — and the Abnahme a combination needs comes from its codes alone. Every
 * other protection stays: an undescribed code still blocks the release. An axle-load limit the paper prints still works
 * through its codes of kind Tragfähigkeit (5KA, 5MK).
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
    $paper = ApprovalDocument::factory()->draft()->unanswered()->tyreIndex(TyreIndexSource::Document)->create(['page_count' => 8, ...$document]);

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
    it('releases with nothing asked: no Auflagen-Codes, no Reifengrößen, no pages — and keeps what was entered in the Protokoll', function (): void {
        $paper = questionsDraft();

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben")
            ->assertSessionHasNoErrors();

        $entry = AuditLog::query()->where('description', 'approval.released')->sole()->properties;

        expect($paper->refresh()->status->value)->toBe('published')
            ->and($entry)->not->toHaveKey('declared')
            ->and($entry['completeness'])->toBeNull()
            // By key and value: MySQL's JSON column orders an object's keys its own way.
            ->and($entry['entered'])->toEqual(['codes' => 0, 'sizes' => 1, 'withoutLoad' => 1, 'maxLoadKg' => null, 'withoutAbnahme' => 1, 'withAbnahme' => 0]);
    });

    it('no longer compares a count taken earlier with the entry, on the page or at the door', function (): void {
        $paper = questionsDraft();
        // A count from before, figures the entry does not match: 6 codes, 3 sizes.
        $paper->forceFill(['counted_codes' => 6, 'counted_codes_page' => 3, 'counted_sizes' => 3, 'counted_sizes_page' => 3, 'counted_abnahme' => 'none', 'counted_at' => now(), 'counted_before_entry' => true])->save();

        $this->actingAs(questionsAdmin(), 'admin')->get("/admin/gutachten/{$paper->id}")->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->where('blockers', fn ($blockers): bool => collect($blockers)->filter(fn (string $b): bool => str_contains($b, 'laut Verwendungsbereich'))->isEmpty())
            ->missing('document.count'));

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben")
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

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben")
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

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben")
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

describe('D-485: the release asks nothing', function (): void {
    it('releases without the completeness, and reads the paper as partial: a car it does not name is „noch nicht bestätigt“', function (): void {
        $paper = questionsDraft();
        $wheel = (int) Fitment::query()->where('approval_document_id', $paper->id)->value('wheel_config_id');
        $other = Vehicle::factory()->create(['max_speed_kmh' => 200]);

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben", ['completeness' => 'complete', 'abnahme' => 'all'])
            ->assertSessionHasNoErrors();

        // What a client posts is not read: the paper stays unswitched.
        expect($paper->refresh()->status->value)->toBe('published')
            ->and($paper->completeness)->toBeNull()
            ->and(app(FitmentResolver::class)->resolve($other->id, $wheel)->status->value)->toBe('UNKNOWN');

        // Switched on, the stronger answer: „nicht freigegeben“.
        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/vollstaendigkeit", ['complete' => true])->assertSessionHasNoErrors();

        expect(app(FitmentResolver::class)->resolve($other->id, $wheel)->status->value)->toBe('NOT_PERMITTED');
    });

    it('takes the Abnahme from the codes alone: a combination with one needs it, without one it does not', function (): void {
        $with = questionsDraft(['A1' => [ConditionKind::Abnahme, 'Abnahme durch eine Prüfstelle erforderlich.']]);
        $without = questionsDraft();

        foreach ([$with, $without] as $paper) {
            $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben")->assertSessionHasNoErrors();
        }

        $row = static fn (ApprovalDocument $paper): Fitment => Fitment::query()->where('approval_document_id', $paper->id)->sole();

        expect($row($with)->requires_entry)->toBeTrue()
            ->and($row($without)->requires_entry)->toBeFalse()
            ->and(app(FitmentResolver::class)->resolve($row($with)->vehicle_id, $row($with)->wheel_config_id)->requiresEntry)->toBeTrue();
    });

    it('still refuses a paper whose code has no description', function (): void {
        $paper = questionsDraft();
        $entry = (int) DB::table('document_car_entries')->where('approval_document_id', $paper->id)->value('id');

        $this->actingAs(questionsAdmin(), 'admin')->putJson("/admin/gutachten/{$paper->id}/erfassung/fahrzeuge/{$entry}", [
            'lines' => [['id' => null, 'front' => '225/40 R18 92Y', 'rear' => '225/40 R18 92Y', 'kw' => '', 'codes' => ['Q7']]],
            'codes' => [],
            'source_page' => 2,
        ])->assertOk();

        $this->actingAs(questionsAdmin(), 'admin')->post("/admin/gutachten/{$paper->id}/freigeben")
            ->assertSessionHasErrors('release');

        expect($paper->refresh()->status->value)->toBe('draft');
    });
});
