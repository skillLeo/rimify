<?php

declare(strict_types=1);

use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Tyres\TyrePairing;
use App\Http\Requests\Admin\DocumentCombinationsApplyRequest;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentTyreCombination;
use App\Models\Fitment;
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
 * nowhere to put them. Since his admin item 19 (D-358) they belong to an entry of the Verwendungsbereich, by its EG
 * type-approval number: a draft takes each entry's list as printed — number, front, rear, one page — saved whole; one
 * combination can be put on several entries at once; a released document keeps them; and the shop's engine reads, for a
 * car, the list of the entry its field K falls under.
 */

/** Two vehicle types of BBS's Verwendungsbereich, as their papers print field K. */
const KOMBI_A = 'e1*2007/46*0316*11';

const KOMBI_B = 'e1*2007/46*0317*02';

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

/** A draft whose Verwendungsbereich names a car of each type: its entries are KOMBI_A and KOMBI_B. */
function kombinationenDraft(): ApprovalDocument
{
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716', 'page_count' => 8]);

    foreach ([KOMBI_A, KOMBI_B] as $k) {
        Fitment::factory()->draft()->create([
            'approval_document_id' => $document->id,
            'vehicle_id' => Vehicle::factory()->create(['eg_nummer_raw' => $k, 'eg_nummer_norm' => $k])->id,
        ]);
    }

    return $document;
}

/** BBS's four, as the card sends them for one entry: one the same size front and rear, three with a wider rear. */
function kombinationenPayload(string $entry = KOMBI_A): array
{
    return [
        'entry' => $entry,
        'source_page' => 4,
        'combinations' => [
            ['number' => 1, 'front' => '225/40 R18', 'rear' => '225/40 R18'],
            ['number' => 2, 'front' => '225/40R18', 'rear' => '245/35 ZR18'],
            ['number' => 4, 'front' => "225/40\u{00A0}R18", 'rear' => '255/35 R18'],
            ['number' => 3, 'front' => '235/40 r18', 'rear' => '255/35-18'],
        ],
    ];
}

/** @return list<string> one entry's list as stored, in its numbering */
function kombinationenOf(ApprovalDocument $document, string $entry): array
{
    return DocumentTyreCombination::query()->where('approval_document_id', $document->id)->where('eg_number_norm', $entry)->orderBy('number')->orderBy('id')->get()
        ->map(static fn (DocumentTyreCombination $c): string => "{$c->number}: {$c->front_width_mm}/{$c->front_aspect} R{$c->front_diameter_in} – {$c->rear_width_mm}/{$c->rear_aspect} R{$c->rear_diameter_in} S.{$c->source_page}")
        ->all();
}

it('saves one entry\'s list as printed, in its numbering, leaves the other entry\'s alone and records it — and saving none takes it away @admin-219', function (): void {
    $document = kombinationenDraft();
    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", ['entry' => KOMBI_B, 'source_page' => 5, 'combinations' => [
        ['number' => 1, 'front' => '235/35 R19', 'rear' => '235/35 R19'],
    ]])->assertSessionHasNoErrors();

    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", kombinationenPayload())
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Bereifungskombinationen gespeichert.');

    expect(kombinationenOf($document, KOMBI_A))->toBe([
        '1: 225/40 R18 – 225/40 R18 S.4',
        '2: 225/40 R18 – 245/35 R18 S.4',
        '3: 235/40 R18 – 255/35 R18 S.4',
        '4: 225/40 R18 – 255/35 R18 S.4',
    ])
        ->and(kombinationenOf($document, KOMBI_B))->toBe(['1: 235/35 R19 – 235/35 R19 S.5'])
        // Typed by a person: nothing of it „übernommen, bitte prüfen“.
        ->and(DocumentTyreCombination::query()->where('carried_over', true)->count())->toBe(0);

    $entry = AuditLog::query()->where('description', 'approval.combinations_saved')->latest('id')->firstOrFail();
    expect($entry->properties['combinations'])->toBe(4)
        ->and($entry->properties['eg_number'])->toBe(KOMBI_A)
        ->and(app(AuditDescriber::class)->describe($entry)['sentence'] ?? null)
        ->toContain('wurden die Bereifungskombinationen der EG-Typgenehmigungsnummer „'.KOMBI_A.'“ gespeichert (4 Kombinationen).');

    $this->actingAs(kombinationenAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('combinations.entries.0.eg', KOMBI_A)
            ->where('combinations.entries.0.carriedOver', false)
            ->where('combinations.entries.0.combinations.1.number', 2)
            ->where('combinations.entries.0.combinations.1.rear', '245/35 R18')
            ->where('combinations.entries.1.eg', KOMBI_B)
            ->has('combinations.entries.1.combinations', 1)
            ->where('combinations.unassigned', [])
        );

    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", ['entry' => KOMBI_A, 'source_page' => null, 'combinations' => []])
        ->assertSessionHas('toast', 'Bereifungskombinationen für diese EG-Nummer entfernt.');

    expect(kombinationenOf($document, KOMBI_A))->toBe([])
        ->and(kombinationenOf($document, KOMBI_B))->toHaveCount(1)
        ->and(AuditLog::query()->where('description', 'approval.combinations_removed')->count())->toBe(1);

    // Nothing over nothing: no change, and no Protokoll line claiming one (ADMIN-GEFUNDEN 509's class).
    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", ['entry' => KOMBI_A, 'source_page' => null, 'combinations' => []])
        ->assertSessionHas('toast', 'Nichts geändert – für diese EG-Nummer sind keine Bereifungskombinationen eingetragen.');

    expect(AuditLog::query()->where('description', 'approval.combinations_removed')->count())->toBe(1);
});

it('takes the entry as the papers print it, and refuses one the Verwendungsbereich does not hold @admin-219', function (): void {
    $document = kombinationenDraft();

    // Spaces and capitals as on the papers: the same entry.
    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", kombinationenPayload('E1 * 2007/46 * 0316 * 11'))
        ->assertSessionHasNoErrors();

    expect(kombinationenOf($document, KOMBI_A))->toHaveCount(4);

    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", kombinationenPayload('e1*2007/46*0999*01'))
        ->assertSessionHasErrorsIn('kombinationen', ['entry' => 'Zu dieser EG-Typgenehmigungsnummer ist bei uns kein Fahrzeug dieses Gutachtens erfasst.']);

    expect(DocumentTyreCombination::query()->where('eg_number_norm', 'e1*2007/46*0999*01')->count())->toBe(0);
});

it('takes one number beside several pairs, as a table prints one front size with two rear sizes', function (): void {
    $document = kombinationenDraft();

    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", ['entry' => KOMBI_A, 'source_page' => 7, 'combinations' => [
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
    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", ['entry' => KOMBI_A, 'source_page' => 4, 'combinations' => [
        ['number' => 1, 'front' => '225/40 R18', 'rear' => '245/35 R18'],
        ['number' => 2, 'front' => '225/40 R18', 'rear' => '245/35 R18'],
    ]])->assertSessionHasErrorsIn('kombinationen', ['combinations.1.rear' => 'Diese Kombination steht schon als Nummer 1 in der Liste.']);

    expect(DocumentTyreCombination::query()->count())->toBe(0);
});

it('puts one combination on several entries at once, leaves an entry that has it, and records it @admin-219', function (): void {
    $document = kombinationenDraft();
    $c = 'e1*2007/46*0318*..';
    Fitment::factory()->draft()->create(['approval_document_id' => $document->id, 'vehicle_id' => Vehicle::factory()->create(['eg_nummer_raw' => $c, 'eg_nummer_norm' => $c])->id]);
    $admin = kombinationenAdmin();

    $this->actingAs($admin, 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", kombinationenPayload())->assertSessionHasNoErrors();
    // Entry B already lists the pair of Nr. 2, under its own number.
    $this->actingAs($admin, 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", ['entry' => KOMBI_B, 'source_page' => 5, 'combinations' => [
        ['number' => 7, 'front' => '225/40 R18', 'rear' => '245/35 R18'],
    ]])->assertSessionHasNoErrors();

    $nr2 = DocumentTyreCombination::query()->where('eg_number_norm', KOMBI_A)->where('number', 2)->sole();

    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/bereifungskombinationen/anwenden", ['combination' => $nr2->id, 'targets' => [KOMBI_B, $c]])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Kombination für eine weitere EG-Nummer eingetragen.');

    expect(kombinationenOf($document, $c))->toBe(['2: 225/40 R18 – 245/35 R18 S.4'])
        ->and(kombinationenOf($document, KOMBI_B))->toBe(['7: 225/40 R18 – 245/35 R18 S.5'])
        ->and(kombinationenOf($document, KOMBI_A))->toHaveCount(4);

    $entry = AuditLog::query()->where('description', 'approval.combination_applied')->sole();
    expect(app(AuditDescriber::class)->describe($entry)['sentence'] ?? null)
        ->toContain('die Kombination Nr. 2 der EG-Typgenehmigungsnummer „'.KOMBI_A.'“ für weitere EG-Nummern übernommen: 1 neu eingetragen, 1 hatte sie schon.');

    // Never onto its own entry, never onto one the document does not hold, never a combination of another document.
    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/bereifungskombinationen/anwenden", ['combination' => $nr2->id, 'targets' => [KOMBI_A, 'e1*2007/46*0999*01']])
        ->assertSessionHasErrorsIn('kombinationen', ['targets.0', 'targets.1']);
    $foreign = kombinationenDraft();
    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$foreign->id}/bereifungskombinationen/anwenden", ['combination' => $nr2->id, 'targets' => [KOMBI_B]])
        ->assertSessionHasErrorsIn('kombinationen', ['combination' => DocumentCombinationsApplyRequest::GONE]);

    expect(DocumentTyreCombination::query()->where('approval_document_id', $foreign->id)->count())->toBe(0)
        ->and(AuditLog::query()->where('description', 'approval.combination_applied')->count())->toBe(1);
});

it('lets no one change the lists of a released document, nor a role that may only look (R-11)', function (): void {
    $document = kombinationenDraft();

    $this->actingAs(kombinationenAdmin('support-agent'), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", kombinationenPayload())->assertForbidden();

    $document->forceFill(['status' => 'published', 'pdf_key' => 'gutachten/1810080716.pdf', 'pdf_sha256' => str_repeat('a', 64)])->save();

    $this->actingAs(kombinationenAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", kombinationenPayload())->assertForbidden();
    $this->actingAs(kombinationenAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/bereifungskombinationen/anwenden", ['combination' => 1, 'targets' => [KOMBI_B]])->assertForbidden();

    expect(DocumentTyreCombination::query()->count())->toBe(0);
});

it('hands the shop\'s engine, for a car, the list of the entry its field K falls under — in its numbering and on its page @admin-219', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716', 'page_count' => 8]);
    $admin = kombinationenAdmin();
    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/zaehlung", ['codes' => 0, 'codes_page' => 3, 'sizes' => 2, 'sizes_page' => 3, 'axle_limit_kg' => null, 'axle_limit_page' => null, 'abnahme' => 'none', 'abnahme_page' => null])->assertSessionHasNoErrors();

    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'LeMans']);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $size = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0]);
    $vehicles = [
        KOMBI_A => Vehicle::factory()->create(['eg_nummer_raw' => KOMBI_A, 'eg_nummer_norm' => KOMBI_A]),
        KOMBI_B => Vehicle::factory()->create(['eg_nummer_raw' => KOMBI_B, 'eg_nummer_norm' => KOMBI_B]),
    ];
    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/zeilen", [
        'vehicle_ids' => array_map(static fn (Vehicle $v): int => $v->id, array_values($vehicles)), 'config_ids' => [$size->id], 'axle' => 'ALL', 'entry_note' => '', 'source_page' => 3,
        'tyre_sizes' => [
            ['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL', 'codes' => []],
            ['width_mm' => 245, 'aspect' => 35, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'REAR', 'codes' => []],
        ],
        'conditions' => [],
    ])->assertSessionHasNoErrors();
    $this->actingAs($admin, 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", kombinationenPayload())->assertSessionHasNoErrors();
    $this->actingAs($admin, 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", ['entry' => KOMBI_B, 'source_page' => 6, 'combinations' => [
        ['number' => 1, 'front' => '225/40 R18', 'rear' => '225/40 R18'],
    ]])->assertSessionHasNoErrors();
    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();

    $listFor = static fn (Vehicle $v) => (app(FitmentRepository::class)->publishedRowsFor($v->id, [$size->id])[$size->id][0] ?? null)?->document->tyreCombinations;
    $a = $listFor($vehicles[KOMBI_A]);
    $b = $listFor($vehicles[KOMBI_B]);

    expect($a)->not->toBeNull()
        ->and(array_map(static fn (TyrePairing $p): string => $p->number.' '.$p->key(), $a->pairs ?? []))->toBe([
            '1 225/40/18|225/40/18',
            '2 225/40/18|245/35/18',
            '3 235/40/18|255/35/18',
            '4 225/40/18|255/35/18',
        ])
        ->and($a?->sourcePage)->toBe(4)
        ->and($a?->unmatched)->toBeFalse()
        ->and(array_map(static fn (TyrePairing $p): string => $p->number.' '.$p->key(), $b->pairs ?? []))->toBe(['1 225/40/18|225/40/18'])
        ->and($b?->sourcePage)->toBe(6);
});
