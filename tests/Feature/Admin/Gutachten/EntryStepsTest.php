<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Enums\DocumentStatus;
use App\Enums\TyreIndexSource;
use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCarEntry;
use App\Models\DocumentCondition;
use App\Models\DocumentTyreCombination;
use App\Models\DocumentTyreLine;
use App\Models\DocumentWheelSize;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\Approvals\Entry\DocumentEntryProof;
use App\Services\Admin\Approvals\Entry\DocumentEntryReader;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use App\Services\Admin\Approvals\Entry\EntryModel;
use App\Services\Admin\Approvals\Entry\PairListCheck;
use App\Services\Admin\PermissionMatrix;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Gutachten\EntryDriver;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * The five steps' own endpoints (the Gutachten rework, Phase 2, with the client's changes of 05.11.2026): one wheel size, single
 * cars found by their details, a line of vorne + hinten per tyre, copied to other cars; and what the release asks of it. Every
 * endpoint: its Form Request, its Policy, what it writes.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

const STEPS_K = 'e1*2007/46*0356*04';

function stepsAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A wheel in one size and two colours, as the catalogue holds it. */
function stepsWheel(array $size = []): WheelConfig
{
    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'NUE', 'type_designation' => 'RC200 8,5x20']);
    $dimension = $size + ['diameter_in' => 20.0, 'width_in' => 8.5, 'et_mm' => 35, 'bolt_holes' => 5, 'bolt_circle_mm' => 120.0, 'centre_bore_mm' => 65.1];
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id, ...$dimension]);
    WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id, ...$dimension]);

    return $config;
}

/** @return array<string, mixed> */
function stepsLine(string $front, ?string $rear = null, array $more = []): array
{
    return ['id' => null, 'front' => $front, 'rear' => $rear ?? $front, 'kw' => '', 'codes' => [], ...$more];
}

/** Step 2: the same version front and rear. */
function stepsCombination(ApprovalDocument $document, WheelConfig $config): mixed
{
    return test()->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/kombinationen", ['front_config_id' => $config->id, 'rear_config_id' => $config->id])->assertOk();
}

function stepsSave(DocumentCarEntry $entry, array $lines, array $codes = [], ?int $page = 2): void
{
    test()->actingAs(stepsAdmin(), 'admin')->putJson("/admin/gutachten/{$entry->approval_document_id}/erfassung/fahrzeuge/{$entry->id}", ['lines' => $lines, 'codes' => $codes, 'source_page' => $page])->assertOk();
}

describe('step 2: the wheel, and what the paper prints', function (): void {
    it('takes a version, not a colour: every colour of it gets the row, and a change of version moves the car', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = stepsWheel();
        $vehicle = Vehicle::factory()->create();

        $id = stepsCombination($document, $wheel)->json('entry.combinations.0.id');
        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge", ['vehicle_ids' => [$vehicle->id]])->assertOk();

        expect(Fitment::query()->where('approval_document_id', $document->id)->count())->toBe(2)
            ->and(DocumentWheelSize::query()->where('approval_document_id', $document->id)->count())->toBe(1)
            ->and(AuditLog::query()->where('description', 'approval.combination_added')->count())->toBe(1);

        $other = WheelConfig::factory()->create(['wheel_model_id' => $wheel->wheel_model_id, 'wheel_finish_id' => $wheel->wheel_finish_id, 'diameter_in' => 20.0, 'width_in' => 9.0, 'et_mm' => 30, 'bolt_holes' => 5, 'bolt_circle_mm' => 120.0, 'centre_bore_mm' => 65.1]);
        $this->actingAs(stepsAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/kombinationen/{$id}", ['front_config_id' => $other->id, 'rear_config_id' => $other->id])->assertOk();

        expect(DocumentWheelSize::query()->where('approval_document_id', $document->id)->count())->toBe(1)
            ->and(Fitment::query()->where('approval_document_id', $document->id)->pluck('wheel_config_id')->unique()->all())->not->toContain($wheel->id);
    });

    it('warns, value by value, where a version differs from what the paper prints, and never refuses it', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wrong = stepsWheel(['width_in' => 8.0, 'diameter_in' => 18.0, 'et_mm' => 40, 'bolt_circle_mm' => 112.0]);

        // The RC200 paper's own „Radgröße 8 1/2 J X 20 H2“, and the operator's note of 06.11.2026.
        $this->actingAs(stepsAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/felge", [
            'printed' => [['type' => 'RC200 8,5x20', 'size' => '8 1/2 J X 20 H2', 'et' => '35', 'bolts' => '120/5']],
        ])->assertOk()->assertJsonPath('entry.printed.0.type', 'RC200 8,5x20');

        $answer = stepsCombination($document, $wrong)->assertJsonPath('entry.wheelSizes.0.wheelType', 'RC200 8,5x20')->json('entry.combinations.0');

        $said = str_replace("\u{00A0}", ' ', implode(' ', $answer['warnings']));
        expect($answer['warnings'])->toHaveCount(1)
            ->and($said)->toContain('Breite: im Gutachten 8,5J, gewählt 8J')
            ->toContain('Durchmesser: im Gutachten 20 Zoll, gewählt 18 Zoll')
            ->toContain('Einpresstiefe: im Gutachten ET 35, gewählt ET 40')
            ->toContain('Lochkreis: im Gutachten 5 × 120, gewählt 5 × 112');

        $document2 = ApprovalDocument::factory()->draft()->create();
        $this->actingAs(stepsAdmin(), 'admin')->putJson("/admin/gutachten/{$document2->id}/erfassung/felge", [
            'printed' => [['type' => 'RC200 8,5x20', 'size' => '8 1/2 J X 20 H2', 'et' => '35', 'bolts' => '120/5']],
        ])->assertOk();

        stepsCombination($document2, stepsWheel())->assertOk()->assertJsonCount(0, 'entry.combinations.0.warnings');
    });

    it('refuses only what could never be a row of a paper: too long, too many', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();

        $this->actingAs(stepsAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/felge", ['printed' => [['size' => str_repeat('8', 33), 'bolts' => '', 'et' => null]]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['printed.0.size']);
    });

    it('is asked of the Gutachten rights, and a released paper is closed (R-11)', function (): void {
        $draft = ApprovalDocument::factory()->draft()->create();
        $wheel = stepsWheel();

        $this->actingAs(stepsAdmin('support-agent'), 'admin')->putJson("/admin/gutachten/{$draft->id}/erfassung/felge", ['printed' => []])->assertForbidden();
        $this->actingAs(stepsAdmin('support-agent'), 'admin')->postJson("/admin/gutachten/{$draft->id}/erfassung/kombinationen", ['front_config_id' => $wheel->id, 'rear_config_id' => $wheel->id])->assertForbidden();

        $released = ApprovalDocument::factory()->create();
        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$released->id}/erfassung/kombinationen", ['front_config_id' => $wheel->id, 'rear_config_id' => $wheel->id])->assertForbidden();

        expect(DocumentWheelSize::query()->count())->toBe(0);
    });
});

describe('step 3: single cars, found by their details', function (): void {
    /** @return list<int> what the search field finds */
    function stepsFind(string $term): array
    {
        return array_column(test()->actingAs(stepsAdmin(), 'admin')->getJson('/admin/gutachten/suche/fahrzeuge?q='.rawurlencode($term))->assertOk()->json('items'), 'id');
    }

    it('finds a car by HSN/TSN, make and model, type, field K and kW, each hit with HSN/TSN, kW and field K', function (): void {
        $amarok = Vehicle::factory()->create(['hsn' => '0603', 'tsn' => 'BNE', 'make' => 'Volkswagen', 'model' => 'Amarok', 'variant' => 'Pickup', 'type_designation' => '2H', 'eg_nummer_raw' => 'e1*2007/46*0356*04', 'eg_nummer_norm' => 'e1*2007/46*0356*04', 'power_kw' => 165]);
        $other = Vehicle::factory()->create(['hsn' => '0005', 'tsn' => 'BGU', 'make' => 'BMW', 'model' => '3er', 'variant' => 'Limousine', 'type_designation' => '3E', 'eg_nummer_raw' => 'e1*2001/116*0249*11', 'eg_nummer_norm' => 'e1*2001/116*0249*11', 'power_kw' => 110]);

        expect(stepsFind('0603 BNE'))->toBe([$amarok->id])
            ->and(stepsFind('0603/bne'))->toBe([$amarok->id])
            ->and(stepsFind('Volkswagen Amarok'))->toBe([$amarok->id])
            ->and(stepsFind('3E'))->toContain($other->id)
            ->and(stepsFind('165 kW'))->toBe([$amarok->id])
            ->and(stepsFind('165kw'))->toBe([$amarok->id])
            // The paper's „..“ takes in any extension; a number written out takes in that one.
            ->and(stepsFind('e1*2007/46*0356*..'))->toBe([$amarok->id])
            ->and(stepsFind('e1*2007/46*0356*04'))->toBe([$amarok->id])
            ->and(stepsFind('e1*2007/46*0356*05'))->toBe([])
            ->and(stepsFind('e1*2007/46*0750*..'))->toBe([]);

        $this->actingAs(stepsAdmin(), 'admin')->getJson('/admin/gutachten/suche/fahrzeuge?q=amarok')
            ->assertJsonPath('items.0.hsnTsn', 'HSN 0603 · TSN BNE')
            ->assertJsonPath('items.0.kw', 165)
            ->assertJsonPath('items.0.k', 'e1*2007/46*0356*04')
            ->assertJsonPath('total', 1);
    });

    it('never shows a car taken out of the data', function (): void {
        $gone = Vehicle::factory()->create(['make' => 'Trabant', 'model' => 'P601']);

        expect(stepsFind('Trabant'))->toBe([$gone->id]);

        $gone->delete();

        expect(stepsFind('Trabant'))->toBe([]);
    });

    it('counts every hit, past what the page draws', function (): void {
        Vehicle::factory()->count(103)->create(['make' => 'Lada', 'model' => 'Niva']);

        $answer = $this->actingAs(stepsAdmin(), 'admin')->getJson('/admin/gutachten/suche/fahrzeuge?q=lada')->assertOk();

        expect($answer->json('items'))->toHaveCount(100)
            ->and($answer->json('total'))->toBe(103);
    });

    it('ticks every hit of a search at once, and that is all it is: nothing joins by itself later', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = stepsWheel();
        $k = 'e1*2007/46*0130*16';
        $three = Vehicle::factory()->count(3)->create(['eg_nummer_raw' => $k, 'eg_nummer_norm' => $k]);
        stepsCombination($document, $wheel);

        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge", ['treffer' => 'e1*2007/46*0130*..'])
            ->assertOk()->assertJsonPath('added', 3);

        // A car of the same number, new in the data: on no paper until someone ticks it.
        $later = Vehicle::factory()->create(['eg_nummer_raw' => $k, 'eg_nummer_norm' => $k]);
        $this->actingAs(stepsAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->assertOk();

        expect(DocumentCarEntry::query()->where('approval_document_id', $document->id)->pluck('vehicle_id')->sort()->values()->all())->toBe($three->pluck('id')->sort()->values()->all())
            ->and(Fitment::query()->where('vehicle_id', $later->id)->exists())->toBeFalse()
            ->and(AuditLog::query()->where('description', 'approval.cars_added')->count())->toBe(1);
    });

    it('asks for a wheel first, and for a narrower search past 500 hits', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge", ['vehicle_ids' => [Vehicle::factory()->create()->id]])
            ->assertUnprocessable();

        stepsCombination($document, stepsWheel());
        Vehicle::factory()->count(501)->create(['make' => 'Viele']);

        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge", ['treffer' => 'Viele'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['treffer' => 'Das sind mehr als 500 Treffer. Grenz die Suche ein, etwa mit der Betriebserlaubnis.']);
    });

    it('takes a car off the paper with its lines and rows, and a car made in the step stays on it as typed', function (): void {
        $document = ApprovalDocument::factory()->draft()->create(['page_count' => 8]);
        $wheel = stepsWheel();
        $entry = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create()->id, $wheel->id);
        stepsSave($entry, [stepsLine('255/35 R20 100')]);

        $this->actingAs(stepsAdmin(), 'admin')->deleteJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}")->assertOk();

        expect(DocumentCarEntry::query()->whereKey($entry->id)->exists())->toBeFalse()
            ->and(DocumentTyreLine::query()->where('document_car_entry_id', $entry->id)->exists())->toBeFalse()
            ->and(Fitment::query()->where('approval_document_id', $document->id)->exists())->toBeFalse();

        // „Fahrzeug anlegen“ in the flow: a car from this paper, no key numbers, zur Prüfung, then ticked like any other.
        $made = $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/fahrzeuge", [
            'make' => 'Volkswagen', 'model' => 'Amarok', 'variant' => 'Pickup', 'type_designation' => '2H', 'eg_number' => 'e1*2007/46*0356*..', 'body_form' => 'Limousine', 'drive_axle' => '', 'source_page' => 2,
        ])->assertCreated()->json('id');
        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge", ['vehicle_ids' => [$made]])->assertOk()->assertJsonPath('added', 1);

        expect(Vehicle::query()->findOrFail($made)->getAttribute('source'))->toBe(VehicleSource::Gutachten->value)
            ->and(Vehicle::query()->findOrFail($made)->needs_review)->toBeTrue();
    });
});

describe('step 4: a line of vorne + hinten', function (): void {
    it('reads every spelling the brief names, keeps LI and SI apart, and never guesses one', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $entry = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create()->id, stepsWheel()->id);

        stepsSave($entry, [
            stepsLine('225/40R18 88W'),
            stepsLine('235/40 R18 91W'),
            stepsLine('245/40R18-88'),
            stepsLine('245/45R18 100'),
            stepsLine('235/50R18'),
            stepsLine('255/35 R 18 90 W'),
            stepsLine('HL 255/35R20 100'),
            stepsLine('XL 275/45R20 110'),
        ]);

        $lines = DocumentTyreLine::query()->where('document_car_entry_id', $entry->id)->orderBy('position')->get();

        expect($lines->map(fn (DocumentTyreLine $l): array => [$l->front_width_mm, $l->front_load_index, $l->front_speed_symbol, $l->front_marker])->all())->toBe([
            [225, 88, 'W', null],
            [235, 91, 'W', null],
            [245, 88, null, null],
            [245, 100, null, null],
            [235, null, null, null],
            [255, 90, 'W', null],
            [255, 100, null, 'HL'],
            [275, 110, null, 'XL'],
        ]);

        $this->actingAs(stepsAdmin(), 'admin')->getJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}")
            ->assertJsonPath('lines.0.front', '225/40 R18 88W')
            ->assertJsonPath('lines.6.front', 'HL 255/35 R20 100')
            ->assertJsonPath('lines.4.front', '235/50 R18');
    });

    // The client's round of 08.11.2026, §4 (D-442): every pairing the ETRTO knows, as the paper prints it, and back as it was typed.
    it('keeps every load index with every speed symbol, the bracket and C-tyre forms, and gives them back as printed', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $entry = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create()->id, stepsWheel()->id);

        stepsSave($entry, [
            stepsLine('225/40 ZR18 (92Y)'),
            stepsLine('235/65 R16 C 115/113R'),
            stepsLine('HL 255/35R20 100'),
            stepsLine('155/80R13 79J', '155/80R13 79K'),
            stepsLine('265/70R17 121S'),
            stepsLine('225/45R17 94W Reinforced'),
        ]);

        $lines = DocumentTyreLine::query()->where('document_car_entry_id', $entry->id)->orderBy('position')->get();

        expect($lines->map(fn (DocumentTyreLine $l): array => [$l->front_load_index, $l->front_load_index_dual, $l->front_speed_symbol, $l->front_marker, $l->rear_speed_symbol])->all())->toBe([
            [92, null, '(Y)', null, '(Y)'],
            [115, 113, 'R', 'C', 'R'],
            [100, null, null, 'HL', null],
            [79, null, 'J', null, 'K'],
            [121, null, 'S', null, 'S'],
            [94, null, 'W', 'RF', 'W'],
        ]);

        $this->actingAs(stepsAdmin(), 'admin')->getJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}")
            ->assertJsonPath('lines.0.front', '225/40 R18 92(Y)')
            ->assertJsonPath('lines.1.front', '235/65 R16 C 115/113R')
            ->assertJsonPath('lines.2.front', 'HL 255/35 R20 100')
            ->assertJsonPath('lines.3.rear', '155/80 R13 79K')
            ->assertJsonPath('lines.4.front', '265/70 R17 121S')
            ->assertJsonPath('lines.5.front', 'RF 225/45 R17 94W');
    });

    it('says it in the Protokoll once per car and quarter of an hour, however often the page saves while someone types', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = stepsWheel();
        $one = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create()->id, $wheel->id);
        $two = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create()->id, $wheel->id);
        $count = static fn (): int => AuditLog::query()->where('description', 'approval.car_entered')->count();

        stepsSave($one, [stepsLine('225/40 R18')]);
        stepsSave($one, [stepsLine('225/40 R18'), stepsLine('235/40 R18')]);
        expect($count())->toBe(1);

        stepsSave($two, [stepsLine('225/40 R18')]);
        expect($count())->toBe(2);

        $this->travel(16)->minutes();
        stepsSave($one, [stepsLine('225/40 R18')]);
        expect($count())->toBe(3);
    });

    it('writes a line of one size as a size for both axles, and two load indexes as one row per axle', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $entry = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create()->id, stepsWheel()->id);

        stepsSave($entry, [stepsLine('255/35 R20 100'), stepsLine('265/35 R20 95', '265/35 R20 99')]);

        $sizes = FitmentTyreSize::query()->whereIn('fitment_id', Fitment::query()->where('vehicle_id', $entry->vehicle_id)->select('id'))->orderBy('id')->get()->take(3);

        expect($sizes->map(fn (FitmentTyreSize $s): array => [$s->width_mm, $s->axle->value, $s->min_load_index])->all())->toBe([
            [255, 'ALL', 100],
            [265, 'FRONT', 95],
            [265, 'REAR', 99],
        ])->and(DocumentTyreCombination::query()->count())->toBe(0);
    });

    it('keeps what does not read, as typed, writes nothing from it, and the release waits for it', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $entry = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create()->id, stepsWheel(['diameter_in' => 18.0])->id);

        stepsSave($entry, [stepsLine('225/40 R18'), stepsLine('Größe unleserlich', '255/35 R18')]);

        expect(DocumentTyreLine::query()->where('document_car_entry_id', $entry->id)->orderBy('position')->pluck('front_unread')->all())->toBe([null, 'Größe unleserlich'])
            ->and(FitmentTyreSize::query()->pluck('width_mm')->unique()->values()->all())->toBe([225])
            ->and(DocumentTyreCombination::query()->count())->toBe(0)
            ->and(implode(' ', app(DocumentRelease::class)->check($document)))->toContain('eine Reifenzeile nicht lesbar: „Größe unleserlich“');
    });

    it('splits a power band by what the paper prints (§4, the Z3): each car gets the sizes of its power', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = stepsWheel(['diameter_in' => 18.0]);
        $small = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create(['power_kw' => 100])->id, $wheel->id);

        stepsSave($small, [
            stepsLine('225/40 R18 88', null, ['kw' => '85-142']),
            stepsLine('245/35 R18 88', null, ['kw' => '85-170']),
            stepsLine('255/35 R18 90', null, ['kw' => '85-170']),
            stepsLine('225/40 R18 88', null, ['kw' => '170']),
        ]);

        expect(FitmentTyreSize::query()->orderBy('id')->get()->take(4)->map(fn (FitmentTyreSize $s): array => [$s->width_mm, $s->kw_min, $s->kw_max])->all())->toBe([
            [225, 85, 142],
            [245, 85, 170],
            [255, 85, 170],
            [225, 170, 170],
        ]);
    });
});

describe('„Kopieren nach …“', function (): void {
    /** @return array{document: ApprovalDocument, source: DocumentCarEntry, one: DocumentCarEntry, two: DocumentCarEntry} */
    function stepsCopyStage(): array
    {
        $document = ApprovalDocument::factory()->draft()->create(['page_count' => 8]);
        $wheel = stepsWheel();
        $k = static fn (string $n): array => ['eg_nummer_raw' => 'e1*2007/46*'.$n.'*01', 'eg_nummer_norm' => 'e1*2007/46*'.$n.'*01'];
        $entry = static fn (string $n): DocumentCarEntry => EntryDriver::car(test(), stepsAdmin(), $document->id, Vehicle::factory()->create($k($n))->id, $wheel->id);
        $source = $entry('0001');
        $one = $entry('0002');
        $two = $entry('0003');
        stepsSave($source, [stepsLine('255/35 R20 100', null, ['codes' => ['K1']]), stepsLine('265/35 R20')], [['code' => 'A01', 'note' => null]], 3);
        stepsSave($two, [stepsLine('255/35 R20 100', null, ['codes' => ['K1']]), stepsLine('275/35 R20')], [], 7);

        return ['document' => $document, 'source' => $source, 'one' => $one, 'two' => $two];
    }

    it('says first how much it would copy, and writes nothing for that', function (): void {
        ['document' => $document, 'source' => $source, 'one' => $one, 'two' => $two] = stepsCopyStage();
        $before = FitmentTyreSize::query()->count();

        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$source->id}/kopieren", ['ziele' => [$one->id, $two->id], 'modus' => 'hinzufuegen', 'vorschau' => true])
            ->assertOk()->assertJsonPath('preview', ['cars' => 2, 'lines' => 3]);

        expect(FitmentTyreSize::query()->count())->toBe($before)
            ->and(AuditLog::query()->where('description', 'approval.lines_copied')->count())->toBe(0);
    });

    it('adds to many cars at once: what a car already has stays, each keeps its page, and each says where its lines came from', function (): void {
        ['document' => $document, 'source' => $source, 'one' => $one, 'two' => $two] = stepsCopyStage();

        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$source->id}/kopieren", ['ziele' => [$one->id, $two->id], 'modus' => 'hinzufuegen'])
            ->assertOk()->assertJsonPath('copied', ['cars' => 2, 'lines' => 3]);

        $widths = static fn (DocumentCarEntry $e): array => DocumentTyreLine::query()->where('document_car_entry_id', $e->id)->orderBy('position')->pluck('front_width_mm')->all();

        expect($widths($one))->toBe([255, 265])
            ->and($widths($two))->toBe([255, 275, 265])
            ->and($two->refresh()->source_page)->toBe(7)
            ->and($one->refresh()->copied_from_id)->toBe($source->id)
            ->and(DocumentCarEntry::query()->findOrFail($one->id)->codes()->pluck('code')->all())->toBe(['A01'])
            ->and(AuditLog::query()->where('description', 'approval.lines_copied')->sole()->properties['cars'])->toBe(2);
    });

    it('replaces where asked, and stops saying „kopiert von“ once the car is edited', function (): void {
        ['document' => $document, 'source' => $source, 'two' => $two] = stepsCopyStage();

        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$source->id}/kopieren", ['ziele' => [$two->id], 'modus' => 'ersetzen'])
            ->assertOk()
            ->assertJsonPath('entry.cars.2.copiedFrom', fn (?string $name): bool => $name !== null);

        expect(DocumentTyreLine::query()->where('document_car_entry_id', $two->id)->orderBy('position')->pluck('front_width_mm')->all())->toBe([255, 265]);

        stepsSave($two->refresh(), [stepsLine('255/35 R20 100')]);

        expect($two->refresh()->copied_from_id)->toBeNull();
    });

    it('leaves a line that does not read behind, and never touches another paper\'s car', function (): void {
        ['document' => $document, 'source' => $source, 'one' => $one] = stepsCopyStage();
        stepsSave($source, [stepsLine('255/35 R20 100'), stepsLine('unleserlich', 'unleserlich')]);
        $elsewhere = EntryDriver::car($this, stepsAdmin(), ApprovalDocument::factory()->draft()->create()->id, Vehicle::factory()->create()->id, stepsWheel()->id);

        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$source->id}/kopieren", ['ziele' => [$one->id, $elsewhere->id], 'modus' => 'ersetzen'])
            ->assertOk()->assertJsonPath('copied', ['cars' => 1, 'lines' => 1]);

        expect(DocumentTyreLine::query()->where('document_car_entry_id', $elsewhere->id)->count())->toBe(0);
    });

    it('reads an axle-load cap against the car it lands on, not the one it came from', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = stepsWheel();
        DocumentCondition::factory()->create(['approval_document_id' => $document->id, 'code' => '5KA', 'kind' => 'reifen_tragfaehigkeit', 'max_axle_load_kg' => 1600, 'text_de' => 'Die Verwendung dieser Reifengröße ist nur zulässig an Fahrzeugausführungen bis zu einer zulässigen Achslast von 1600kg.']);
        $light = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create(['axle_load_front_kg' => 1500, 'axle_load_rear_kg' => 1500])->id, $wheel->id);
        $heavy = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create(['axle_load_front_kg' => 1500, 'axle_load_rear_kg' => 1800])->id, $wheel->id);
        stepsSave($light, [stepsLine('255/35 R20 100', null, ['codes' => ['5KA']]), stepsLine('265/35 R20')]);

        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$light->id}/kopieren", ['ziele' => [$heavy->id], 'modus' => 'ersetzen'])->assertOk();

        $row = Fitment::query()->where('vehicle_id', $heavy->vehicle_id)->firstOrFail();

        expect($row->tyreSizes()->where('width_mm', 255)->sole()->axle->value)->toBe('FRONT');
    });

    it('is asked of the Gutachten rights, and a source on another paper is not found (R-11)', function (): void {
        ['document' => $document, 'source' => $source, 'one' => $one] = stepsCopyStage();
        $other = ApprovalDocument::factory()->draft()->create();

        $this->actingAs(stepsAdmin('support-agent'), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$source->id}/kopieren", ['ziele' => [$one->id], 'modus' => 'ersetzen'])->assertForbidden();
        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$other->id}/erfassung/fahrzeuge/{$source->id}/kopieren", ['ziele' => [$one->id], 'modus' => 'ersetzen'])->assertForbidden();
    });
});

describe('the door: pairs stand per field K, lines per car', function (): void {
    /** @return array{document: ApprovalDocument, a: DocumentCarEntry, b: DocumentCarEntry} */
    function stepsSameK(): array
    {
        $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create(['page_count' => 8]);
        $wheel = stepsWheel(['diameter_in' => 18.0]);
        $car = static fn (string $variant): DocumentCarEntry => EntryDriver::car(test(), stepsAdmin(), $document->id, Vehicle::factory()->create(['variant' => $variant, 'eg_nummer_raw' => STEPS_K, 'eg_nummer_norm' => STEPS_K])->id, $wheel->id);

        return ['document' => $document, 'a' => $car('Eins'), 'b' => $car('Zwei')];
    }

    it('refuses a pair the engine would give a car nobody entered it for, names both cars and the pair, and says the way out', function (): void {
        ['document' => $document, 'a' => $a, 'b' => $b] = stepsSameK();
        $front = stepsLine('225/40 R18');
        $rear = stepsLine('255/35 R18');

        stepsSave($a, [$front, $rear, stepsLine('225/40 R18', '255/35 R18')]);
        // The same two sizes on the other car, without the pair: the engine would give it the pair all the same.
        stepsSave($b, [$front, $rear]);

        $blockers = implode(' ', app(DocumentRelease::class)->check($document));

        expect($blockers)->toContain('dieselbe Betriebserlaubnis ('.STEPS_K.')')
            ->and($blockers)->toContain('Trag sie bei allen betroffenen Fahrzeugen ein oder bei keinem.');

        $this->actingAs(stepsAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
            ->assertInertia(fn (AssertableInertia $page) => $page->where('entry.conflicts.0.vehicleId', $b->vehicle_id)->where('entry.cars.1.conflict', true));

        // Entered on both: nothing left to refuse.
        stepsSave($b, [$front, $rear, stepsLine('225/40 R18', '255/35 R18')]);

        expect(implode(' ', app(DocumentRelease::class)->check($document)))->not->toContain('Betriebserlaubnis');
    });

    it('names only cars of the same field K beside the one it refuses: a third car with another K and the same pair is no part of it', function (): void {
        ['document' => $document, 'a' => $a, 'b' => $b] = stepsSameK();
        $other = 'e1*2007/46*0750*02';
        $third = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create(['variant' => 'Drei', 'eg_nummer_raw' => $other, 'eg_nummer_norm' => $other])->id, stepsWheel()->id);
        $pair = [stepsLine('225/40 R18'), stepsLine('255/35 R18'), stepsLine('225/40 R18', '255/35 R18')];

        stepsSave($a, $pair);
        stepsSave($third, $pair);
        stepsSave($b, [stepsLine('225/40 R18'), stepsLine('255/35 R18')]);

        $conflict = (new PairListCheck(new DocumentEntryWriter))->of(EntryModel::of($document))['conflicts'][0];

        expect($conflict['vehicleId'])->toBe($b->vehicle_id)
            ->and($conflict['others'])->toHaveCount(1)
            ->and($conflict['others'][0])->toContain('Eins');
    });

    it('lets two cars of one K differ where the engine would give neither a pair it was not entered for', function (): void {
        ['document' => $document, 'a' => $a, 'b' => $b] = stepsSameK();

        stepsSave($a, [stepsLine('225/40 R18'), stepsLine('255/35 R18'), stepsLine('225/40 R18', '255/35 R18')]);
        // This car does not carry the rear size: the engine cannot give it the pair.
        stepsSave($b, [stepsLine('225/40 R18')]);

        expect(implode(' ', app(DocumentRelease::class)->check($document)))->not->toContain('Betriebserlaubnis');
    });

    it('leaves a car whose field K is no EG number out of the list, says so, and the engine fails closed', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = stepsWheel(['diameter_in' => 18.0]);
        $national = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create(['eg_nummer_raw' => 'G191', 'eg_nummer_norm' => 'g191'])->id, $wheel->id);

        stepsSave($national, [stepsLine('225/40 R18'), stepsLine('255/35 R18'), stepsLine('225/40 R18', '255/35 R18')]);
        // A list from another car of this paper, so the paper has one.
        $eg = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create(['eg_nummer_raw' => STEPS_K, 'eg_nummer_norm' => STEPS_K])->id, $wheel->id);
        stepsSave($eg, [stepsLine('225/40 R18'), stepsLine('255/35 R18'), stepsLine('225/40 R18', '255/35 R18')]);

        expect(DocumentTyreCombination::query()->where('approval_document_id', $document->id)->pluck('eg_number_norm')->unique()->all())->toBe([STEPS_K]);

        $this->actingAs(stepsAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
            ->assertInertia(fn (AssertableInertia $page) => $page->where('entry.unreachable.0.vehicleId', $national->vehicle_id));
    });

    it('holds a banded pair to a car whose power is known and inside the band: unknown power, not offered', function (): void {
        ['document' => $document, 'a' => $a, 'b' => $b] = stepsSameK();
        $a->vehicle->forceFill(['power_kw' => 100])->save();
        $b->vehicle->forceFill(['power_kw' => null])->save();
        $band = ['kw' => '85-142'];

        stepsSave($a, [stepsLine('225/40 R18'), stepsLine('255/35 R18'), stepsLine('225/40 R18', '255/35 R18', $band)]);

        $pair = static fn (): int => DocumentTyreCombination::query()->where('approval_document_id', $document->id)->where('front_width_mm', 225)->where('rear_width_mm', 255)->count();

        expect($pair())->toBe(1);

        $a->vehicle->forceFill(['power_kw' => 170])->save();
        (new DocumentEntryWriter)->write($document);

        expect($pair())->toBe(0);
    });
});

describe('the RC200 paper\'s cases (D-390), its second real example', function (): void {
    function stepsCode(ApprovalDocument $document, string $code, string $kind, string $text, ?int $load = null): void
    {
        test()->actingAs(stepsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => $code, 'kind' => $kind, 'text_de' => $text, 'max_axle_load_kg' => $load])->assertSessionHasNoErrors();
    }

    it('takes one row with two type codes and two approval numbers as two cars with the same lines', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = stepsWheel();
        $type2h = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create(['type_designation' => '2H', 'eg_nummer_raw' => 'e1*2007/46*0356*04', 'eg_nummer_norm' => 'e1*2007/46*0356*04'])->id, $wheel->id);
        $type2hs2 = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create(['type_designation' => '2HS2', 'eg_nummer_raw' => 'e1*2007/46*0750*02', 'eg_nummer_norm' => 'e1*2007/46*0750*02'])->id, $wheel->id);
        stepsSave($type2h, [stepsLine('255/50 R20 109'), stepsLine('265/45 R20 108')]);

        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$type2h->id}/kopieren", ['ziele' => [$type2hs2->id], 'modus' => 'ersetzen'])->assertOk();

        expect(DocumentTyreLine::query()->where('document_car_entry_id', $type2hs2->id)->count())->toBe(2)
            ->and(DocumentTyreCombination::query()->count())->toBe(0);
    });

    it('limits a tyre with 5KA or 5MK to the axle loads they name: known above, gone from that axle; within, or unknown, kept with its code', function (): void {
        $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
        stepsCode($document, '5MK', 'reifen_tragfaehigkeit', 'Die Verwendung dieser Reifengröße ist nur zulässig an Fahrzeugausführungen bis zu einer zulässigen Achslast von 1850kg.', 1850);
        $wheel = stepsWheel();
        $tyres = [stepsLine('255/45 R20 105', null, ['codes' => ['5MK']]), stepsLine('265/45 R20 108')];
        $car = static fn (?int $front, ?int $rear): DocumentCarEntry => EntryDriver::car(test(), stepsAdmin(), $document->id, Vehicle::factory()->create(['axle_load_front_kg' => $front, 'axle_load_rear_kg' => $rear])->id, $wheel->id);
        $axle = static fn (DocumentCarEntry $e): array => Fitment::query()->where('vehicle_id', $e->vehicle_id)->firstOrFail()->tyreSizes()->where('width_mm', 255)->get()->map(fn (FitmentTyreSize $s): string => $s->axle->value)->all();

        $within = $car(1600, 1850);
        $rearAbove = $car(1600, 1900);
        $bothAbove = $car(1900, 2000);
        $unknown = $car(null, null);

        foreach ([$within, $rearAbove, $bothAbove, $unknown] as $entry) {
            stepsSave($entry, $tyres);
        }

        expect($axle($within))->toBe(['ALL'])
            ->and($axle($rearAbove))->toBe(['FRONT'])
            ->and($axle($bothAbove))->toBe([])
            ->and($axle($unknown))->toBe(['ALL'])
            ->and(DB::table('fitment_tyre_size_conditions')->where('code', '5MK')->count())->toBeGreaterThan(0);
    });

    it('changes no answer but the tyre\'s: within the cap the rim sells with the sentence, and the Komplettrad waits, as for every load code without an index', function (): void {
        $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
        stepsCode($document, '5MK', 'reifen_tragfaehigkeit', 'Die Verwendung dieser Reifengröße ist nur zulässig an Fahrzeugausführungen bis zu einer zulässigen Achslast von 1850kg.', 1850);
        $wheel = stepsWheel();
        $car = Vehicle::factory()->create(['axle_load_front_kg' => 1600, 'axle_load_rear_kg' => 1800, 'max_speed_kmh' => 180]);
        $entry = EntryDriver::car($this, stepsAdmin(), $document->id, $car->id, $wheel->id);
        stepsSave($entry, [stepsLine('255/45 R20 105', null, ['codes' => ['5MK']]), stepsLine('265/45 R20 108')]);
        $this->actingAs(stepsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();

        $verdict = app(FitmentResolver::class)->resolve($car->id, $wheel->id);

        expect($verdict->status->value)->toBe('PERMITTED')
            ->and(array_map(static fn ($condition): string => $condition->sentenceDe(), $verdict->conditions))->toContain('Die Verwendung dieser Reifengröße ist nur zulässig an Fahrzeugausführungen bis zu einer zulässigen Achslast von 1850kg.')
            ->and(app(TyreEligibility::class)->offerFor($verdict, false)->refusal?->value)->toBe('TYRE_CHOICE_RESTRICTED');
    });

    it('suggests „aus den Fahrzeugpapieren“ where the paper prints the load index and no symbol (10B), and keeps the printed index as the floor (R-06)', function (): void {
        $document = ApprovalDocument::factory()->draft()->create(['tyre_index_source' => null]);
        $entry = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create()->id, stepsWheel()->id);

        stepsSave($entry, [stepsLine('255/45 R20 105'), stepsLine('255/50 R20 109')]);

        $this->actingAs(stepsAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
            ->assertInertia(fn (AssertableInertia $page) => $page->where('entry.suggestion', TyreIndexSource::Papers->value));

        expect(FitmentTyreSize::query()->orderBy('id')->get()->take(2)->map(fn (FitmentTyreSize $s): array => [$s->min_load_index, $s->min_speed_symbol])->all())
            ->toBe([[105, null], [109, null]]);

        // Answered, the suggestion is only that: nothing was set by itself until someone answers.
        expect($document->refresh()->tyre_index_source)->toBeNull();

        $this->actingAs(stepsAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/lastindex", ['tyre_index_source' => 'papers'])->assertOk();

        expect($document->refresh()->tyre_index_source)->toBe(TyreIndexSource::Papers);
    });

    it('suggests „bei jeder Reifengröße“ where every side has both figures, and a table where the paper has one', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $entry = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create()->id, stepsWheel()->id);

        stepsSave($entry, [stepsLine('225/40 R18 88W')]);

        $this->actingAs(stepsAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
            ->assertInertia(fn (AssertableInertia $page) => $page->where('entry.suggestion', TyreIndexSource::Document->value));

        DB::table('document_speed_deratings')->insert(['approval_document_id' => $document->id, 'speed_kmh' => 240, 'symbol' => 'V', 'percent' => '91', 'created_at' => now(), 'updated_at' => now()]);

        $this->actingAs(stepsAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
            ->assertInertia(fn (AssertableInertia $page) => $page->where('entry.suggestion', TyreIndexSource::Table->value));
    });

    it('keeps „ab e1*2007/46*0130*16“ a condition staff define: never a range on the row\'s own number', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $own = 'e1*2001/116*0220*07';
        $entry = EntryDriver::car($this, stepsAdmin(), $document->id, Vehicle::factory()->create(['eg_nummer_raw' => $own, 'eg_nummer_norm' => $own])->id, stepsWheel()->id);

        // As a code it does not read: the sign and the slash are no part of one, and the page says so.
        $this->actingAs(stepsAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}", ['lines' => [], 'codes' => [['code' => 'ab e1*2007/46*0130*16', 'note' => null]], 'source_page' => 2])
            ->assertUnprocessable()->assertJsonValidationErrors('codes.0.code');

        stepsCode($document, 'ab 0130-16', 'hinweis', 'Gilt ab e1*2007/46*0130*16.');
        stepsSave($entry, [stepsLine('255/35 R20 100')], [['code' => 'ab 0130-16', 'note' => null]]);

        expect(Fitment::query()->where('vehicle_id', $entry->vehicle_id)->firstOrFail()->conditionCodes()->pluck('code')->all())->toBe(['ab 0130-16'])
            ->and(Vehicle::query()->findOrFail($entry->vehicle_id)->getAttribute('eg_nummer_norm'))->toBe($own)
            ->and(DocumentTyreCombination::query()->count())->toBe(0);
    });
});

describe('„Daten geprüft“', function (): void {
    it('says on the record who answered for a car, which the release then accepts', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $car = Vehicle::factory()->development()->create();
        $entry = EntryDriver::car($this, stepsAdmin(), $document->id, $car->id, stepsWheel()->id);

        $this->actingAs(stepsAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}/geprueft")
            ->assertOk()->assertJsonPath('entry.cars.0.unsourced', false);

        expect($car->refresh()->getAttribute('source'))->toBe(VehicleSource::ManuellGeprueft->value)
            ->and(AuditLog::query()->where('description', 'vehicle.confirmed_by_hand')->count())->toBe(1);
    });

    it('takes the right to edit cars too: the paper\'s own right is not enough (R-11)', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $car = Vehicle::factory()->development()->create();
        $entry = EntryDriver::car($this, stepsAdmin(), $document->id, $car->id, stepsWheel()->id);
        // The Gutachten role with the right to edit cars taken away.
        $editor = stepsAdmin('compliance-editor');
        $role = DB::table('roles')->where('name', 'compliance-editor')->value('id');
        DB::table('role_permissions')->where('role_id', $role)->where('module', 'vehicles')->where('action', 'edit')->update(['allowed' => false]);
        app()->forgetInstance(PermissionMatrix::class);

        $this->actingAs($editor, 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}/geprueft")->assertForbidden();

        expect($car->refresh()->getAttribute('source'))->not->toBe(VehicleSource::ManuellGeprueft->value);
    });
});

describe('a colour added later', function (): void {
    /** @return array{document: ApprovalDocument, wheel: WheelConfig, entry: DocumentCarEntry} a released paper on one size in two colours */
    function stepsReleased(): array
    {
        $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create(['page_count' => 8]);
        $wheel = stepsWheel();
        $entry = EntryDriver::car(test(), stepsAdmin(), $document->id, Vehicle::factory()->create()->id, $wheel->id);
        stepsSave($entry, [stepsLine('255/35 R20 100')]);
        test()->actingAs(stepsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();

        return ['document' => $document->refresh(), 'wheel' => $wheel, 'entry' => $entry];
    }

    it('gets the rows its sister colours have, released as they are, in a Protokoll entry of its own, and the paper is not edited', function (): void {
        ['document' => $document, 'wheel' => $wheel, 'entry' => $entry] = stepsReleased();
        $sister = Fitment::query()->where('approval_document_id', $document->id)->where('wheel_config_id', $wheel->id)->firstOrFail();
        $updated = $document->updated_at;

        $new = WheelConfig::factory()->create(['wheel_model_id' => $wheel->wheel_model_id, 'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $wheel->wheel_model_id])->id, ...$wheel->only(['diameter_in', 'width_in', 'et_mm', 'bolt_holes', 'bolt_circle_mm', 'centre_bore_mm'])]);

        expect((new DocumentEntryWriter)->colourAdded($new->id, stepsAdmin()))->toBe(1);

        $row = Fitment::query()->where('approval_document_id', $document->id)->where('wheel_config_id', $new->id)->sole();

        expect($row->status->value)->toBe('published')
            ->and($row->vehicle_id)->toBe($entry->vehicle_id)
            ->and($row->tyreSizes()->pluck('min_load_index')->all())->toBe($sister->tyreSizes()->pluck('min_load_index')->all())
            ->and(AuditLog::query()->where('description', 'approval.colour_added')->sole()->properties['rows'])->toBe(1)
            ->and($document->refresh()->updated_at?->toDateTimeString())->toBe($updated?->toDateTimeString())
            ->and((new DocumentEntryWriter)->colourAdded($new->id, stepsAdmin()))->toBe(0);
    });

    it('stays out of another size of that wheel, of another wheel of that size, and of a car kept to one colour', function (): void {
        ['document' => $document, 'wheel' => $wheel] = stepsReleased();
        $finish = WheelFinish::factory()->create(['wheel_model_id' => $wheel->wheel_model_id]);
        $otherSize = WheelConfig::factory()->create(['wheel_model_id' => $wheel->wheel_model_id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 19.0, 'width_in' => 8.0, 'et_mm' => 30]);
        $otherWheel = stepsWheel();

        expect((new DocumentEntryWriter)->colourAdded($otherSize->id, stepsAdmin()))->toBe(0)
            ->and((new DocumentEntryWriter)->colourAdded($otherWheel->id, stepsAdmin()))->toBe(0);

        DocumentCarEntry::query()->where('approval_document_id', $document->id)->update(['wheel_config_id' => $wheel->id]);
        $same = WheelConfig::factory()->create(['wheel_model_id' => $wheel->wheel_model_id, 'wheel_finish_id' => $finish->id, ...$wheel->only(['diameter_in', 'width_in', 'et_mm', 'bolt_holes', 'bolt_circle_mm', 'centre_bore_mm'])]);

        expect((new DocumentEntryWriter)->colourAdded($same->id, stepsAdmin()))->toBe(0);

        // The same colour, the car no longer kept to one: it does get its row, so the zeros above were no accident.
        DocumentCarEntry::query()->where('approval_document_id', $document->id)->update(['wheel_config_id' => null]);

        expect((new DocumentEntryWriter)->colourAdded($same->id, stepsAdmin()))->toBe(1);
    });

    it('happens by itself when a person adds the colour on the wheel\'s own page', function (): void {
        ['document' => $document, 'wheel' => $wheel] = stepsReleased();
        $model = WheelModel::query()->with(['finishes', 'configs'])->findOrFail($wheel->wheel_model_id);
        $row = static fn (WheelConfig $config): array => [
            'id' => $config->id, 'finish' => 'f'.$config->wheel_finish_id, 'diameter' => '20', 'width' => '8,5', 'et' => '35', 'bolt_holes' => 5, 'bolt_circle' => '120', 'bore' => '65,1',
            'sku' => $config->getAttribute('sku'), 'ean' => '', 'kba' => '', 'price' => '189,00', 'available' => true, 'weight_g' => null,
        ];

        $this->actingAs(stepsAdmin(), 'admin')->put("/admin/felgen/{$model->id}", [
            'brand_id' => $model->brand_id, 'name' => $model->name, 'type_designation' => $model->type_designation, 'spoke_count' => $model->spoke_count, 'description' => $model->description_de, 'seo_title' => '', 'seo_description' => '',
            'finishes' => [
                ...$model->finishes->map(fn (WheelFinish $f): array => ['key' => 'f'.$f->id, 'id' => $f->id, 'name' => $f->name_de, 'hex' => '', 'art_finish' => $f->art_finish])->all(),
                ['key' => 'n1', 'id' => null, 'name' => 'Neu Matt', 'hex' => '#222222', 'art_finish' => 'graphite'],
            ],
            'configs' => [
                ...$model->configs->map($row)->all(),
                [...$row($wheel), 'id' => null, 'finish' => 'n1', 'sku' => 'NEU-MATT-1'],
            ],
        ])->assertSessionHasNoErrors();

        $new = WheelConfig::query()->where('sku', 'NEU-MATT-1')->sole();

        expect(Fitment::query()->where('approval_document_id', $document->id)->where('wheel_config_id', $new->id)->where('status', 'published')->count())->toBe(1)
            ->and(AuditLog::query()->where('description', 'approval.colour_added')->count())->toBe(1);
    });
});

describe('a paper from before the five steps', function (): void {
    it('is carried over the first time it is opened, and its rows stay exactly as they were', function (): void {
        $document = ApprovalDocument::factory()->create();
        $config = stepsWheel();
        $row = Fitment::factory()->create(['approval_document_id' => $document->id, 'wheel_config_id' => $config->id]);
        $before = $row->fresh()?->getAttributes();

        $this->actingAs(stepsAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Gutachten/Show')->where('carryFailed', null)->has('readView', 1));

        expect($row->fresh()?->getAttributes())->toBe($before)
            ->and((new DocumentEntryProof(new DocumentEntryWriter))->differences($document))->toBe([]);
    });

    it('stays readable where its way back would change a row, says so, and nothing is built', function (): void {
        $document = ApprovalDocument::factory()->create();
        $reader = Mockery::mock(DocumentEntryReader::class);
        $reader->allows('ensure')->andThrow(new RuntimeException('Zeile 1 ginge verloren'));
        $this->app->instance(DocumentEntryReader::class, $reader);

        $this->actingAs(stepsAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Gutachten/Show')->where('carryFailed', fn (string $sentence): bool => str_contains($sentence, 'Im Shop ändert sich nichts')));

        expect($document->refresh()->status)->toBe(DocumentStatus::Published);
    });

    it('proves every paper from the command line, reading only, and writes every verdict to a file', function (): void {
        $document = ApprovalDocument::factory()->create();
        Fitment::factory()->create(['approval_document_id' => $document->id, 'wheel_config_id' => stepsWheel()->id]);
        (new DocumentEntryReader)->ensure($document);
        $file = tempnam(sys_get_temp_dir(), 'rimify-urteile');

        expect(Artisan::call('rimify:erfassung-pruefen', ['--urteile' => $file]))->toBe(0)
            ->and(Artisan::output())->toContain('Gutachten geprüft, 0 mit Abweichung.')
            ->and(json_decode((string) file_get_contents($file), true))->toHaveCount(1);

        // A row changed behind the entry's back is named, and the command fails.
        Fitment::query()->where('approval_document_id', $document->id)->update(['source_page' => 99]);

        expect(Artisan::call('rimify:erfassung-pruefen'))->toBe(1)
            ->and(Artisan::output())->toContain('1 mit Abweichung');
    });
});

describe('the documents list', function (): void {
    it('says how far a draft is, cars with tyres of cars chosen, and which released paper has a new Fassung in the works', function (): void {
        $draft = ApprovalDocument::factory()->draft()->create(['report_number' => 'ENTWURF-1']);
        $wheel = stepsWheel();
        $done = EntryDriver::car($this, stepsAdmin(), $draft->id, Vehicle::factory()->create()->id, $wheel->id);
        EntryDriver::car($this, stepsAdmin(), $draft->id, Vehicle::factory()->create()->id, $wheel->id);
        EntryDriver::car($this, stepsAdmin(), $draft->id, Vehicle::factory()->create()->id, $wheel->id);
        stepsSave($done, [stepsLine('255/35 R20 100')]);

        $released = ApprovalDocument::factory()->create(['report_number' => 'FREI-1']);
        ApprovalDocument::factory()->draft()->create(['report_number' => 'FREI-2', 'supersedes_id' => $released->id, 'revision' => 2]);
        $plain = ApprovalDocument::factory()->create(['report_number' => 'FREI-3']);

        $rows = collect($this->actingAs(stepsAdmin(), 'admin')->get('/admin/gutachten')->viewData('page')['props']['documents'])->keyBy('id');

        expect($rows[$draft->id]['progress'])->toBe(['done' => 1, 'cars' => 3])
            ->and($rows[$draft->id]['newVersion'])->toBeFalse()
            ->and($rows[$released->id]['newVersion'])->toBeTrue()
            ->and($rows[$released->id]['progress'])->toBeNull()
            ->and($rows[$plain->id]['newVersion'])->toBeFalse();
    });
});
