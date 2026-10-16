<?php

declare(strict_types=1);

use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Tyres\TyrePairing;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentTyreCombination;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\AuditDescriber;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * D-256 (his item 8, Group A of the admin round): BBS's Teilegutachten prints four „Bereifungskombinationen“ and had
 * nowhere to put them. A draft takes them as printed — number, front, rear, one page — saved whole; a released one
 * keeps them; and the shop's engine reads them from the released document.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function kombinationenAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function kombinationenDraft(): ApprovalDocument
{
    return ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716', 'page_count' => 8]);
}

/** BBS's four, as the card sends them: one the same size front and rear, three with a wider rear. */
function kombinationenPayload(): array
{
    return [
        'source_page' => 4,
        'combinations' => [
            ['number' => 1, 'front' => '225/40 R18', 'rear' => '225/40 R18'],
            ['number' => 2, 'front' => '225/40R18', 'rear' => '245/35 ZR18'],
            ['number' => 4, 'front' => "225/40\u{00A0}R18", 'rear' => '255/35 R18'],
            ['number' => 3, 'front' => '235/40 r18', 'rear' => '255/35-18'],
        ],
    ];
}

it('saves the list as printed, in its numbering, and records it — and saving none takes it away', function (): void {
    $document = kombinationenDraft();

    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", kombinationenPayload())
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Bereifungskombinationen gespeichert.');

    $stored = DocumentTyreCombination::query()->where('approval_document_id', $document->id)->orderBy('number')->get()
        ->map(static fn (DocumentTyreCombination $c): string => "{$c->number}: {$c->front_width_mm}/{$c->front_aspect} R{$c->front_diameter_in} – {$c->rear_width_mm}/{$c->rear_aspect} R{$c->rear_diameter_in} S.{$c->source_page}")
        ->all();

    expect($stored)->toBe([
        '1: 225/40 R18 – 225/40 R18 S.4',
        '2: 225/40 R18 – 245/35 R18 S.4',
        '3: 235/40 R18 – 255/35 R18 S.4',
        '4: 225/40 R18 – 255/35 R18 S.4',
    ]);

    $entry = AuditLog::query()->where('description', 'approval.combinations_saved')->sole();
    expect($entry->properties['combinations'])->toBe(4)
        ->and(app(AuditDescriber::class)->describe($entry)['sentence'] ?? null)->toContain('wurden die Bereifungskombinationen gespeichert (4 Kombinationen).');

    $this->actingAs(kombinationenAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('combinations.sourcePage', 4)
            ->where('combinations.entries.1', ['number' => 2, 'front' => '225/40 R18', 'rear' => '245/35 R18'])
            ->where('combinations.entries.3', ['number' => 4, 'front' => '225/40 R18', 'rear' => '255/35 R18'])
        );

    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", ['source_page' => null, 'combinations' => []])
        ->assertSessionHas('toast', 'Bereifungskombinationen entfernt.');

    expect(DocumentTyreCombination::query()->where('approval_document_id', $document->id)->count())->toBe(0)
        ->and(AuditLog::query()->where('description', 'approval.combinations_removed')->count())->toBe(1);

    // Nothing over nothing: no change, and no Protokoll line claiming one (ADMIN-GEFUNDEN 509's class).
    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", ['source_page' => null, 'combinations' => []])
        ->assertSessionHas('toast', 'Es waren keine Bereifungskombinationen eingetragen.');

    expect(AuditLog::query()->where('description', 'approval.combinations_removed')->count())->toBe(1);
});

it('takes one number beside several pairs, as a table prints one front size with two rear sizes', function (): void {
    $document = kombinationenDraft();

    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", ['source_page' => 7, 'combinations' => [
        ['number' => 8, 'front' => '235/45 R19', 'rear' => '255/40 R19'],
        ['number' => 8, 'front' => '235/45 R19', 'rear' => '265/40 R19'],
    ]])->assertSessionHasNoErrors();

    expect(DocumentTyreCombination::query()->where('approval_document_id', $document->id)->where('number', 8)->count())->toBe(2);
});

it('refuses, in words, a size it cannot read, one pair twice and a page the PDF does not have', function (): void {
    $document = kombinationenDraft();
    $payload = kombinationenPayload();
    $payload['source_page'] = 9;
    $payload['combinations'][0]['front'] = '225/40';
    // The row form takes a size with its minimum; this list does not — a combination is two sizes.
    $payload['combinations'][1]['rear'] = '245/35 R18 92Y';

    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", $payload)
        ->assertSessionHasErrorsIn('kombinationen', [
            'source_page' => 'Das Gutachten hat nur 8 Seiten.',
            'combinations.0.front' => 'Die Größe bitte in der Form 225/40 R18, ohne Lastindex und Geschwindigkeitssymbol.',
            'combinations.1.rear' => 'Die Größe bitte in der Form 225/40 R18, ohne Lastindex und Geschwindigkeitssymbol.',
        ]);

    // One pair under two numbers, with the rest readable.
    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", ['source_page' => 4, 'combinations' => [
        ['number' => 1, 'front' => '225/40 R18', 'rear' => '245/35 R18'],
        ['number' => 2, 'front' => '225/40 R18', 'rear' => '245/35 R18'],
    ]])->assertSessionHasErrorsIn('kombinationen', ['combinations.1.rear' => 'Diese Kombination steht schon als Nummer 1 in der Liste.']);

    expect(DocumentTyreCombination::query()->count())->toBe(0);
});

it('lets no one change the list of a released document, nor a role that may only look (R-11)', function (): void {
    $document = kombinationenDraft();

    $this->actingAs(kombinationenAdmin('support-agent'), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", kombinationenPayload())->assertForbidden();

    $document->forceFill(['status' => 'published', 'pdf_key' => 'gutachten/1810080716.pdf', 'pdf_sha256' => str_repeat('a', 64)])->save();

    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", kombinationenPayload())->assertForbidden();

    expect(DocumentTyreCombination::query()->count())->toBe(0);
});

it('hands the released document\'s list to the shop\'s engine, in its numbering and on its page', function (): void {
    $document = kombinationenDraft();
    $admin = kombinationenAdmin();
    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/zaehlung", ['codes' => 0, 'codes_page' => 3, 'sizes' => 2, 'sizes_page' => 3, 'axle_limit_kg' => null, 'axle_limit_page' => null, 'abnahme' => 'none', 'abnahme_page' => null])->assertSessionHasNoErrors();
    $this->actingAs($admin, 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", kombinationenPayload())->assertSessionHasNoErrors();

    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'LeMans']);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $size = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0]);
    $vehicle = Vehicle::factory()->create();
    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/zeilen", [
        'vehicle_ids' => [$vehicle->id], 'config_ids' => [$size->id], 'axle' => 'ALL', 'entry_note' => '', 'source_page' => 3,
        'tyre_sizes' => [
            ['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL', 'codes' => []],
            ['width_mm' => 245, 'aspect' => 35, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'REAR', 'codes' => []],
        ],
        'conditions' => [],
    ])->assertSessionHasNoErrors();
    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();

    $row = app(FitmentRepository::class)->publishedRowsFor($vehicle->id, [$size->id])[$size->id][0] ?? null;
    $list = $row?->document->tyreCombinations;

    expect($list)->not->toBeNull()
        ->and(array_map(static fn (TyrePairing $p): string => $p->number.' '.$p->key(), $list->pairs ?? []))->toBe([
            '1 225/40/18|225/40/18',
            '2 225/40/18|245/35/18',
            '3 235/40/18|255/35/18',
            '4 225/40/18|255/35/18',
        ])
        ->and($list?->sourcePage)->toBe(4);
});
