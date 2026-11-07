<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Enums\DocumentStatus;
use App\Enums\TyreIndexSource;
use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCarEntry;
use App\Models\DocumentTyreCombination;
use App\Models\DocumentWheelCombination;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\Approvals\DocumentRevision;
use App\Services\Admin\Approvals\Entry\DocumentEntryProof;
use App\Services\Admin\Approvals\Entry\DocumentEntryReader;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use App\Services\Admin\Approvals\Entry\EntryView;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * The client's fourth change (the operator's brief of 07.11.2026, §1–§4): „it is possible that a approval document allows the use
 * of different rim dimensions on front and rear axles of the same rim product“. One wheel model per paper; a wheel combination is a
 * front version and a rear version of it, the same one by default. Colours are inherited and never chosen. Tyre lines are entered
 * per car × wheel combination, and the writer puts them on the unchanged engine tables.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

const COMBO_K = 'e1*2007/46*0356*04';

function comboAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/**
 * The mockup's wheel: 8,5 × 18 ET 35 in black and bronze, 8,5 × 19 ET 35 in black and bronze, 8 × 18 ET 40 5 × 112 in black alone.
 *
 * @return array{model: WheelModel, a: WheelConfig, b: WheelConfig, c: WheelConfig, aBronze: WheelConfig, bBronze: WheelConfig}
 */
function comboWheel(): array
{
    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'DB8GT2', 'type_designation' => 'DB8']);
    $black = WheelFinish::factory()->create(['wheel_model_id' => $model->id, 'name_de' => 'Schwarz matt']);
    $bronze = WheelFinish::factory()->create(['wheel_model_id' => $model->id, 'name_de' => 'Bronze matt']);
    $version = static fn (WheelFinish $finish, float $d, float $w, int $et, float $circle, float $bore): WheelConfig => WheelConfig::factory()->create([
        'wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => $d, 'width_in' => $w, 'et_mm' => $et, 'bolt_holes' => 5, 'bolt_circle_mm' => $circle, 'centre_bore_mm' => $bore,
    ]);

    return [
        'model' => $model,
        'a' => $version($black, 18.0, 8.5, 35, 120.0, 72.5),
        'aBronze' => $version($bronze, 18.0, 8.5, 35, 120.0, 72.5),
        'b' => $version($black, 19.0, 8.5, 35, 120.0, 72.6),
        'bBronze' => $version($bronze, 19.0, 8.5, 35, 120.0, 72.6),
        'c' => $version($black, 18.0, 8.0, 40, 112.0, 66.6),
    ];
}

function comboUrl(ApprovalDocument $document, string $path = ''): string
{
    return "/admin/gutachten/{$document->id}/erfassung{$path}";
}

/** @return array<string, mixed> */
function comboAdd(ApprovalDocument $document, WheelConfig $front, ?WheelConfig $rear = null): array
{
    return test()->actingAs(comboAdmin(), 'admin')->postJson(comboUrl($document, '/kombinationen'), ['front_config_id' => $front->id, 'rear_config_id' => ($rear ?? $front)->id])->assertOk()->json();
}

function comboCar(ApprovalDocument $document, ?Vehicle $car = null): Vehicle
{
    $car ??= Vehicle::factory()->create(['eg_nummer_raw' => COMBO_K, 'eg_nummer_norm' => COMBO_K, 'source' => VehicleSource::ManuellGeprueft->value]);
    test()->actingAs(comboAdmin(), 'admin')->postJson(comboUrl($document, '/fahrzeuge'), ['vehicle_ids' => [$car->id]])->assertOk();

    return $car;
}

function comboCell(ApprovalDocument $document, Vehicle $car, WheelConfig $front, ?WheelConfig $rear = null): DocumentCarEntry
{
    $rear ??= $front;

    /** @var DocumentCarEntry */
    return DocumentCarEntry::query()->where('approval_document_id', $document->id)->where('vehicle_id', $car->id)
        ->whereHas('combination', static fn ($q) => $q->whereHas('front', static fn ($f) => $f->where('diameter_in', $front->diameter_in)->where('width_in', $front->width_in)->where('et_mm', $front->et_mm))
            ->whereHas('rear', static fn ($r) => $r->where('diameter_in', $rear->diameter_in)->where('width_in', $rear->width_in)->where('et_mm', $rear->et_mm)))
        ->firstOrFail();
}

/** @param list<array{0: string, 1?: string|null}> $lines */
function comboLines(DocumentCarEntry $cell, array $lines): mixed
{
    return test()->actingAs(comboAdmin(), 'admin')->putJson(
        "/admin/gutachten/{$cell->approval_document_id}/erfassung/fahrzeuge/{$cell->id}",
        ['lines' => array_map(static fn (array $line): array => ['id' => null, 'front' => $line[0], 'rear' => $line[1] ?? $line[0], 'kw' => '', 'codes' => []], $lines), 'codes' => [], 'source_page' => 2],
    )->assertOk()->json();
}

function comboRelease(ApprovalDocument $document): void
{
    test()->actingAs(comboAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();
}

/** @return array<string, array{axle: string, sizes: list<string>}> keyed by colour id */
function comboRows(ApprovalDocument $document, Vehicle $car): array
{
    $out = [];

    foreach (Fitment::query()->with('tyreSizes')->where('approval_document_id', $document->id)->where('vehicle_id', $car->id)->get() as $row) {
        $out[(int) $row->wheel_config_id] = [
            'axle' => $row->axle->value,
            'sizes' => $row->tyreSizes->map(static fn ($s): string => "{$s->width_mm}/{$s->aspect}/".(int) $s->diameter_in.':'.$s->axle->value)->sort()->values()->all(),
        ];
    }

    return $out;
}

/** @return list<string> front colour id : rear colour id */
function comboSets(ApprovalDocument $document, Vehicle $car): array
{
    return DB::table('fitment_wheel_sets as s')
        ->join('fitments as f', 'f.id', '=', 's.front_fitment_id')
        ->join('fitments as r', 'r.id', '=', 's.rear_fitment_id')
        ->where('f.approval_document_id', $document->id)->where('f.vehicle_id', $car->id)
        ->get(['f.wheel_config_id as front', 'r.wheel_config_id as rear'])
        ->map(static fn (object $row): string => "{$row->front}:{$row->rear}")->sort()->values()->all();
}

describe('step 2: a paper\'s wheel combinations', function (): void {
    it('holds one model, a front and a rear version of it, the same by default, several per paper, none twice', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();

        $first = comboAdd($document, $wheel['a']);
        $second = comboAdd($document, $wheel['a'], $wheel['b']);

        $plain = static fn (string $text): string => str_replace("\u{00A0}", ' ', $text);

        expect($first['entry']['combinations'])->toHaveCount(1)
            ->and($first['entry']['combinations'][0]['same'])->toBeTrue()
            ->and($first['entry']['combinations'][0]['badge'])->toBe('gleich vorne und hinten')
            ->and($second['entry']['combinations'])->toHaveCount(2)
            ->and($second['entry']['combinations'][1]['same'])->toBeFalse()
            ->and($second['entry']['combinations'][1]['badge'])->toBe('vorne und hinten verschieden')
            ->and($plain($second['entry']['combinations'][1]['label']))->toBe('Vorne 8,5 × 18 ET 35 · Hinten 8,5 × 19 ET 35')
            ->and(AuditLog::query()->where('description', 'approval.combination_added')->count())->toBe(2);

        // The same combination again, in any colour of those versions: refused with a sentence.
        $this->actingAs(comboAdmin(), 'admin')->postJson(comboUrl($document, '/kombinationen'), ['front_config_id' => $wheel['aBronze']->id, 'rear_config_id' => $wheel['bBronze']->id])
            ->assertUnprocessable()->assertJsonValidationErrors(['front_config_id' => 'Diese Kombination steht schon im Gutachten.']);

        // „One Gutachten is always for one specific wheel“: another model, on this paper or within one combination, is refused.
        $other = WheelConfig::factory()->create(['wheel_model_id' => WheelModel::factory()->draft()->create(['is_demo' => false])->id]);
        $this->actingAs(comboAdmin(), 'admin')->postJson(comboUrl($document, '/kombinationen'), ['front_config_id' => $other->id, 'rear_config_id' => $other->id])
            ->assertUnprocessable()->assertJsonValidationErrors('front_config_id');
    });

    it('edits a combination with its cars\' lines, and removes one with them; the last stays while cars are on the paper', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        $id = comboAdd($document, $wheel['a'])['entry']['combinations'][0]['id'];
        $car = comboCar($document);
        comboLines(comboCell($document, $car, $wheel['a']), [['225/40R18 92Y']]);

        // Moved to other versions: the lines move with it.
        $this->actingAs(comboAdmin(), 'admin')->putJson(comboUrl($document, "/kombinationen/{$id}"), ['front_config_id' => $wheel['c']->id, 'rear_config_id' => $wheel['c']->id])->assertOk();
        expect(comboCell($document, $car, $wheel['c'])->lines()->count())->toBe(1)
            ->and(array_keys(comboRows($document, $car)))->toBe([$wheel['c']->id]);

        $this->actingAs(comboAdmin(), 'admin')->deleteJson(comboUrl($document, "/kombinationen/{$id}"))
            ->assertUnprocessable()->assertJsonValidationErrors('combination');

        $second = comboAdd($document, $wheel['a'])['entry']['combinations'][1]['id'];
        expect(DocumentCarEntry::query()->where('approval_document_id', $document->id)->count())->toBe(2);

        $this->actingAs(comboAdmin(), 'admin')->deleteJson(comboUrl($document, "/kombinationen/{$second}"))->assertOk();
        expect(DocumentCarEntry::query()->where('approval_document_id', $document->id)->count())->toBe(1)
            ->and(DocumentWheelCombination::query()->where('approval_document_id', $document->id)->count())->toBe(1)
            ->and(AuditLog::query()->where('description', 'approval.combination_removed')->count())->toBe(1);
    });

    it('warns where a version is not what the paper prints, and where front and rear have different bolt patterns; it never refuses', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();

        // The operator's note: 8 × 18 ET 40 5 × 112 picked while the paper says 8½ × 18 ET 35 120/5.
        $this->actingAs(comboAdmin(), 'admin')->putJson(comboUrl($document, '/felge'), ['printed' => [['type' => 'DB8', 'size' => '8 1/2 J X 18 H2', 'et' => 35, 'bolts' => '120/5']]])->assertOk();

        $plain = static fn (array $lines): string => str_replace("\u{00A0}", ' ', implode(' ', $lines));
        $state = comboAdd($document, $wheel['a'], $wheel['c'])['entry']['combinations'][0];

        expect($plain($state['warnings']))->toContain('Vorne und hinten haben verschiedene Lochkreise: 5 × 120 und 5 × 112.')
            ->toContain('Hinten passt nicht')->toContain('Einpresstiefe: im Gutachten ET 35, gewählt ET 40')->toContain('Lochkreis: im Gutachten 5 × 120, gewählt 5 × 112')
            ->not->toContain('Vorne passt nicht');

        // A second row the paper prints: a version matching any of them raises nothing.
        $this->actingAs(comboAdmin(), 'admin')->putJson(comboUrl($document, '/felge'), ['printed' => [
            ['type' => 'DB8', 'size' => '8 1/2 J X 18 H2', 'et' => 35, 'bolts' => '120/5'],
            ['type' => 'DB8', 'size' => '8 × 18', 'et' => 40, 'bolts' => '112/5'],
        ]])->assertOk();

        $state = app(EntryView::class)->of($document->fresh())['combinations'][0];
        expect($plain($state['warnings']))->toBe('Vorne und hinten haben verschiedene Lochkreise: 5 × 120 und 5 × 112.');
    });

    it('takes the paper\'s printed rows only where they read, and never refuses the wheel for them', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();

        $this->actingAs(comboAdmin(), 'admin')->putJson(comboUrl($document, '/felge'), ['printed' => [['type' => '', 'size' => 'irgendwas', 'et' => null, 'bolts' => '']]])
            ->assertUnprocessable()->assertJsonValidationErrors('printed.0.size');
    });
});

describe('step 3: cars × wheel combinations', function (): void {
    it('gives a ticked car a cell per combination, and a new combination a cell per car', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a']);
        $car = comboCar($document);

        expect(DocumentCarEntry::query()->where('vehicle_id', $car->id)->count())->toBe(1);

        comboAdd($document, $wheel['a'], $wheel['b']);
        expect(DocumentCarEntry::query()->where('vehicle_id', $car->id)->count())->toBe(2);

        $other = comboCar($document);
        expect(DocumentCarEntry::query()->where('vehicle_id', $other->id)->count())->toBe(2);
    });

    it('takes a car off the paper whole, and one cell of it on its own, which can come back', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a']);
        $combination = comboAdd($document, $wheel['a'], $wheel['b'])['entry']['combinations'][1]['id'];
        $car = comboCar($document);
        $cell = comboCell($document, $car, $wheel['a'], $wheel['b']);

        $this->actingAs(comboAdmin(), 'admin')->deleteJson(comboUrl($document, "/fahrzeuge/{$cell->id}/zelle"))->assertOk();
        expect(DocumentCarEntry::query()->where('vehicle_id', $car->id)->count())->toBe(1)
            ->and(AuditLog::query()->where('description', 'approval.cell_removed')->count())->toBe(1);

        $this->actingAs(comboAdmin(), 'admin')->postJson(comboUrl($document, '/zellen'), ['vehicle_id' => $car->id, 'combination_id' => $combination])->assertOk();
        expect(DocumentCarEntry::query()->where('vehicle_id', $car->id)->count())->toBe(2)
            ->and(AuditLog::query()->where('description', 'approval.cell_added')->count())->toBe(1);

        $this->actingAs(comboAdmin(), 'admin')->deleteJson(comboUrl($document, '/fahrzeuge/'.comboCell($document, $car, $wheel['a'])->id))->assertOk();
        expect(DocumentCarEntry::query()->where('vehicle_id', $car->id)->count())->toBe(0);
    });

    it('asks the right to edit the paper on every one of them (R-11)', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        $combination = comboAdd($document, $wheel['a'])['entry']['combinations'][0]['id'];
        $car = comboCar($document);
        $cell = comboCell($document, $car, $wheel['a']);
        $reader = comboAdmin('support-agent');

        $this->actingAs($reader, 'admin')->postJson(comboUrl($document, '/kombinationen'), ['front_config_id' => $wheel['a']->id, 'rear_config_id' => $wheel['b']->id])->assertForbidden();
        $this->actingAs($reader, 'admin')->putJson(comboUrl($document, "/kombinationen/{$combination}"), ['front_config_id' => $wheel['b']->id, 'rear_config_id' => $wheel['b']->id])->assertForbidden();
        $this->actingAs($reader, 'admin')->deleteJson(comboUrl($document, "/kombinationen/{$combination}"))->assertForbidden();
        $this->actingAs($reader, 'admin')->deleteJson(comboUrl($document, "/fahrzeuge/{$cell->id}/zelle"))->assertForbidden();
        $this->actingAs($reader, 'admin')->postJson(comboUrl($document, '/zellen'), ['vehicle_id' => $car->id, 'combination_id' => $combination])->assertForbidden();
    });
});

describe('step 4: the writer on the unchanged engine tables', function (): void {
    it('puts identical tyres on an identical wheel on both axles, one row per colour, with no list and no set', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a']);
        $car = comboCar($document);
        comboLines(comboCell($document, $car, $wheel['a']), [['225/40R18 92Y']]);

        $rows = comboRows($document, $car);

        expect($rows[$wheel['a']->id])->toBe(['axle' => 'ALL', 'sizes' => ['225/40/18:ALL']])
            ->and($rows[$wheel['aBronze']->id])->toBe(['axle' => 'ALL', 'sizes' => ['225/40/18:ALL']])
            ->and(DocumentTyreCombination::query()->where('approval_document_id', $document->id)->count())->toBe(0)
            ->and(comboSets($document, $car))->toBe([]);
    });

    it('puts a different wheel front and rear on axle rows of each version, the pair on the list, and a set per shared colour', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a'], $wheel['b']);
        $car = comboCar($document);
        comboLines(comboCell($document, $car, $wheel['a'], $wheel['b']), [['225/40R18 92Y', '255/35R19 96Y']]);

        $rows = comboRows($document, $car);

        expect($rows)->toHaveCount(4)
            ->and($rows[$wheel['a']->id])->toBe(['axle' => 'FRONT', 'sizes' => ['225/40/18:FRONT']])
            ->and($rows[$wheel['aBronze']->id])->toBe(['axle' => 'FRONT', 'sizes' => ['225/40/18:FRONT']])
            ->and($rows[$wheel['b']->id])->toBe(['axle' => 'REAR', 'sizes' => ['255/35/19:REAR']])
            ->and($rows[$wheel['bBronze']->id])->toBe(['axle' => 'REAR', 'sizes' => ['255/35/19:REAR']]);

        $list = DocumentTyreCombination::query()->where('approval_document_id', $document->id)->get();
        expect($list)->toHaveCount(1)
            ->and($list[0]->eg_number_norm)->toBe(COMBO_K)
            ->and((int) $list[0]->front_diameter_in)->toBe(18)
            ->and((int) $list[0]->rear_diameter_in)->toBe(19);

        // Colours are inherited: black with black, bronze with bronze; never across.
        expect(comboSets($document, $car))->toBe(collect(["{$wheel['a']->id}:{$wheel['b']->id}", "{$wheel['aBronze']->id}:{$wheel['bBronze']->id}"])->sort()->values()->all());
    });

    it('sets only the colours both versions have', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a'], $wheel['c']);
        $car = comboCar($document);
        comboLines(comboCell($document, $car, $wheel['a'], $wheel['c']), [['225/40R18 92Y', '235/40R18 95Y']]);

        expect(comboSets($document, $car))->toBe(["{$wheel['a']->id}:{$wheel['c']->id}"]);
    });

    it('holds one row per car and colour where a version stands in several combinations, and gives each its own say', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a']);
        comboAdd($document, $wheel['a'], $wheel['b']);
        $car = comboCar($document);
        comboLines(comboCell($document, $car, $wheel['a']), [['225/40R18 92Y']]);
        comboLines(comboCell($document, $car, $wheel['a'], $wheel['b']), [['225/40R18 92Y', '255/35R19 96Y'], ['235/40R18 95Y', '255/35R19 96Y']]);

        $rows = comboRows($document, $car);

        // 18 inch stands on both axles through its own combination; 235/40 only ever in front, through the other.
        expect($rows[$wheel['a']->id]['axle'])->toBe('ALL')
            ->and($rows[$wheel['a']->id]['sizes'])->toBe(['225/40/18:ALL', '235/40/18:FRONT'])
            ->and($rows[$wheel['b']->id])->toBe(['axle' => 'REAR', 'sizes' => ['255/35/19:REAR']])
            ->and(Fitment::query()->where('approval_document_id', $document->id)->where('vehicle_id', $car->id)->where('wheel_config_id', $wheel['a']->id)->count())->toBe(1);

        // The list is closed once it exists: its own same-size combination stands in it too.
        expect(DocumentTyreCombination::query()->where('approval_document_id', $document->id)->count())->toBe(3);

        // Both combinations named, so the shop can say which versions go together and that the 18 inch has a set of its own.
        expect(comboSets($document, $car))->toContain("{$wheel['a']->id}:{$wheel['a']->id}")->toContain("{$wheel['a']->id}:{$wheel['b']->id}");
    });

    it('writes a same-tyre pair on two different versions to the axles and the list', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a'], $wheel['c']);
        $car = comboCar($document);
        comboLines(comboCell($document, $car, $wheel['a'], $wheel['c']), [['225/40R18 92Y']]);

        $rows = comboRows($document, $car);

        expect($rows[$wheel['a']->id])->toBe(['axle' => 'FRONT', 'sizes' => ['225/40/18:FRONT']])
            ->and($rows[$wheel['c']->id])->toBe(['axle' => 'REAR', 'sizes' => ['225/40/18:REAR']])
            ->and(DocumentTyreCombination::query()->where('approval_document_id', $document->id)->count())->toBe(1);
    });

    it('refuses in place a tyre whose rim is not its axle\'s wheel: kept, said, written nowhere, and the release waits', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a'], $wheel['b']);
        $car = comboCar($document);
        $cell = comboCell($document, $car, $wheel['a'], $wheel['b']);

        $answer = comboLines($cell, [['225/40R18 92Y', '225/40R18 92Y']]);

        expect($answer['car']['lines'][0]['rearWhy'])->toBe('Dieser Reifen passt nicht: Die Felge hinten hat 19 Zoll, der Reifen R18.')
            ->and($answer['car']['lines'][0]['frontWhy'])->toBeNull()
            ->and($answer['car']['lines'][0]['rear'])->toBe('225/40 R18 92Y');

        expect(comboRows($document, $car)[$wheel['a']->id]['sizes'])->toBe([])
            ->and(comboRows($document, $car)[$wheel['b']->id]['sizes'])->toBe([])
            ->and(DocumentTyreCombination::query()->where('approval_document_id', $document->id)->count())->toBe(0);

        expect(implode(' ', app(DocumentRelease::class)->check($document->fresh())))->toContain('Dieser Reifen passt nicht');
    });

    it('asks for the other side where a line names one and the wheels\' diameters differ', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a'], $wheel['b']);
        $car = comboCar($document);
        $cell = comboCell($document, $car, $wheel['a'], $wheel['b']);

        $this->actingAs(comboAdmin(), 'admin')->putJson(comboUrl($document, "/fahrzeuge/{$cell->id}"), ['lines' => [['id' => null, 'front' => '225/40R18 92Y', 'rear' => '', 'kw' => '', 'codes' => []]], 'codes' => [], 'source_page' => 2])->assertOk();

        expect(comboRows($document, $car)[$wheel['a']->id]['sizes'])->toBe([])
            ->and(implode(' ', app(DocumentRelease::class)->check($document->fresh())))->toContain('hinten fehlt noch die Größe');
    });

    it('copies only to other cars of the same wheel combination', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a']);
        comboAdd($document, $wheel['a'], $wheel['b']);
        $one = comboCar($document);
        $two = comboCar($document);
        $source = comboCell($document, $one, $wheel['a']);
        comboLines($source, [['225/40R18 92Y']]);
        $same = comboCell($document, $two, $wheel['a']);
        $other = comboCell($document, $two, $wheel['a'], $wheel['b']);

        $this->actingAs(comboAdmin(), 'admin')->postJson(comboUrl($document, "/fahrzeuge/{$source->id}/kopieren"), ['ziele' => [$same->id, $other->id], 'modus' => 'ersetzen'])->assertOk();

        expect($same->lines()->count())->toBe(1)
            ->and($other->lines()->count())->toBe(0);
    });
});

describe('the door, and what follows it', function (): void {
    it('names an empty cell and lets the cell go; a car without that combination is no gap', function (): void {
        $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a']);
        comboAdd($document, $wheel['a'], $wheel['b']);
        $car = comboCar($document);
        comboLines(comboCell($document, $car, $wheel['a']), [['225/40R18 92Y']]);

        expect(implode(' ', app(DocumentRelease::class)->check($document->fresh())))->toContain('Felgenkombination')->toContain('noch die Reifen');

        $this->actingAs(comboAdmin(), 'admin')->deleteJson(comboUrl($document, '/fahrzeuge/'.comboCell($document, $car, $wheel['a'], $wheel['b'])->id.'/zelle'))->assertOk();

        expect(implode(' ', app(DocumentRelease::class)->check($document->fresh())))->not->toContain('Felgenkombination');
    });

    it('stops a pair a car would get on a combination nobody entered it for, naming car and combination', function (): void {
        $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a']);
        comboAdd($document, $wheel['a'], $wheel['c']);
        $car = comboCar($document);

        // Both sizes stand on the 8,5 × 18 by its own lines; the pair was entered only for the two versions.
        comboLines(comboCell($document, $car, $wheel['a']), [['225/40R18 92Y'], ['235/40R18 95Y']]);
        comboLines(comboCell($document, $car, $wheel['a'], $wheel['c']), [['225/40R18 92Y', '235/40R18 95Y']]);

        $said = implode(' ', app(DocumentRelease::class)->check($document->fresh()));

        expect(str_replace("\u{00A0}", ' ', $said))->toContain('225/40 R18 vorne mit 235/40 R18 hinten')->toContain('Vorne und hinten 8,5 × 18 ET 35');
    });

    it('releases a paper with two versions, and the rows go live with their sets', function (): void {
        $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a'], $wheel['b']);
        $car = comboCar($document);
        comboLines(comboCell($document, $car, $wheel['a'], $wheel['b']), [['225/40R18 92Y', '255/35R19 96Y']]);

        expect(app(DocumentRelease::class)->check($document->fresh()))->toBe([]);

        comboRelease($document);

        expect($document->fresh()->status)->toBe(DocumentStatus::Published)
            ->and(comboSets($document, $car))->toHaveCount(2);
    });

    it('keeps a revision\'s combinations, cells and sets, and writes it back to the same rows', function (): void {
        $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a'], $wheel['b']);
        $car = comboCar($document);
        comboLines(comboCell($document, $car, $wheel['a'], $wheel['b']), [['225/40R18 92Y', '255/35R19 96Y']]);
        comboRelease($document);

        $draft = app(DocumentRevision::class)->draftFrom($document->fresh(), comboAdmin());

        expect(DocumentWheelCombination::query()->where('approval_document_id', $draft->id)->count())->toBe(1)
            ->and(comboSets($draft, $car))->toHaveCount(2)
            ->and((new DocumentEntryProof(new DocumentEntryWriter))->differences($draft))->toBe([]);
    });

    it('gives a new colour of a version its rows and its sets on a released paper', function (): void {
        $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a'], $wheel['b']);
        $car = comboCar($document);
        comboLines(comboCell($document, $car, $wheel['a'], $wheel['b']), [['225/40R18 92Y', '255/35R19 96Y']]);
        comboRelease($document);

        $graphit = WheelFinish::factory()->create(['wheel_model_id' => $wheel['model']->id, 'name_de' => 'Graphit']);
        $front = WheelConfig::factory()->create(['wheel_model_id' => $wheel['model']->id, 'wheel_finish_id' => $graphit->id, ...$wheel['a']->only(['diameter_in', 'width_in', 'et_mm', 'bolt_holes', 'bolt_circle_mm', 'centre_bore_mm'])]);
        $rear = WheelConfig::factory()->create(['wheel_model_id' => $wheel['model']->id, 'wheel_finish_id' => $graphit->id, ...$wheel['b']->only(['diameter_in', 'width_in', 'et_mm', 'bolt_holes', 'bolt_circle_mm', 'centre_bore_mm'])]);

        (new DocumentEntryWriter)->colourAdded($front->id, comboAdmin());
        (new DocumentEntryWriter)->colourAdded($rear->id, comboAdmin());

        expect(comboRows($document, $car)[$front->id]['axle'])->toBe('FRONT')
            ->and(comboRows($document, $car)[$rear->id]['axle'])->toBe('REAR')
            ->and(comboSets($document, $car))->toContain("{$front->id}:{$rear->id}");
    });

    it('carries a paper from before this flow as it stood, a pair on a wheel its tyres do not fit included: the rule is for what is typed from now on', function (): void {
        $document = ApprovalDocument::factory()->draft()->create();
        $wheel = comboWheel();
        $car = Vehicle::factory()->create(['eg_nummer_raw' => COMBO_K, 'eg_nummer_norm' => COMBO_K, 'source' => VehicleSource::ManuellGeprueft->value]);
        $row = Fitment::factory()->create(['approval_document_id' => $document->id, 'vehicle_id' => $car->id, 'wheel_config_id' => $wheel['b']->id, 'axle' => 'ALL', 'status' => 'draft']);
        Fitment::factory()->create(['approval_document_id' => $document->id, 'vehicle_id' => $car->id, 'wheel_config_id' => $wheel['bBronze']->id, 'axle' => 'ALL', 'status' => 'draft']);

        foreach (Fitment::query()->where('approval_document_id', $document->id)->get() as $fitment) {
            foreach ([[225, 40], [255, 35]] as [$width, $aspect]) {
                $fitment->tyreSizes()->create(['width_mm' => $width, 'aspect' => $aspect, 'diameter_in' => 18.0, 'axle' => 'ALL']);
            }
        }

        DocumentTyreCombination::query()->create([
            'approval_document_id' => $document->id, 'eg_number' => COMBO_K, 'eg_number_norm' => COMBO_K, 'number' => 1,
            'front_width_mm' => 225, 'front_aspect' => 40, 'front_diameter_in' => 18.0, 'rear_width_mm' => 255, 'rear_aspect' => 35, 'rear_diameter_in' => 18.0,
        ]);

        (new DocumentEntryReader)->ensure($document);

        expect((new DocumentEntryProof(new DocumentEntryWriter))->differences($document))->toBe([])
            ->and($row->fresh())->not->toBeNull();

        // Someone edits a line of it: from then on it is typed here, and the rule holds.
        $cell = DocumentCarEntry::query()->where('approval_document_id', $document->id)->firstOrFail();
        $answer = comboLines($cell, [['225/40R18 92Y']]);

        expect($answer['car']['lines'][0]['frontWhy'])->toContain('Dieser Reifen passt nicht');
    });

    it('leaves the engine\'s answer on one wheel as it was: each on its own axle, a Komplettrad of it refused, closed', function (): void {
        $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
        $wheel = comboWheel();
        comboAdd($document, $wheel['a'], $wheel['b']);
        $car = comboCar($document);
        comboLines(comboCell($document, $car, $wheel['a'], $wheel['b']), [['225/40R18 92Y', '255/35R19 96Y']]);
        comboRelease($document);

        $verdict = app(FitmentResolver::class)->resolve($car->id, $wheel['a']->id);

        expect($verdict->front->hasPermittedSizes())->toBeTrue()
            ->and($verdict->rear->hasPermittedSizes())->toBeFalse()
            ->and(app(TyreEligibility::class)->offerFor($verdict)->refusal)->toBe(KomplettradRefusal::AsCombination)
            ->and(app(TyreEligibility::class)->mixedOfferFor($verdict)->pairs)->toBe([]);
    });
});
