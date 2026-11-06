<?php

declare(strict_types=1);

use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Tyres\TyrePairing;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCarEntry;
use App\Models\DocumentTyreCombination;
use App\Models\DocumentTyreLine;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Gutachten\EntryDriver;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * D-256 (his item 8, Group A of the admin round), D-358 (his admin item 19) and the client's change of 05.11.2026: BBS's
 * Teilegutachten prints its „Bereifungskombinationen“ per entry of the Verwendungsbereich, and staff enter them as what they are,
 * vorne + hinten beside each car. A different pair stands in the list of the car's field K, as the engine reads it; the same size
 * on both axles stands in that list too once the paper has one, because the list is closed then; a released document keeps them.
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

function kombinationenSize(): WheelConfig
{
    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'LeMans']);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);

    return WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0]);
}

/** @return array{document: ApprovalDocument, a: DocumentCarEntry, b: DocumentCarEntry} a draft with a car of each type, its wheel chosen */
function kombinationenDraft(): array
{
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716', 'page_count' => 8]);
    $size = kombinationenSize();
    $a = Vehicle::factory()->create(['eg_nummer_raw' => KOMBI_A, 'eg_nummer_norm' => KOMBI_A]);
    $b = Vehicle::factory()->create(['eg_nummer_raw' => KOMBI_B, 'eg_nummer_norm' => KOMBI_B]);

    return [
        'document' => $document,
        'a' => EntryDriver::car(test(), kombinationenAdmin(), $document->id, $a->id, $size->id),
        'b' => EntryDriver::car(test(), kombinationenAdmin(), $document->id, $b->id, $size->id),
    ];
}

/**
 * One car's lines as staff type them.
 *
 * @param  list<array<string, mixed>>  $lines
 */
function kombinationenLines(DocumentCarEntry $entry, array $lines, ?int $page = 4): void
{
    test()->actingAs(kombinationenAdmin(), 'admin')->putJson("/admin/gutachten/{$entry->approval_document_id}/erfassung/fahrzeuge/{$entry->id}", [
        'lines' => array_map(static fn (array $line): array => $line + ['id' => null, 'kw' => '', 'codes' => [], 'front_on_rim' => false, 'rear_on_rim' => false], $lines),
        'codes' => [],
        'source_page' => $page,
    ])->assertOk();
}

/** @return list<string> one entry's list as stored, in its numbering */
function kombinationenOf(ApprovalDocument $document, string $entry): array
{
    return DocumentTyreCombination::query()->where('approval_document_id', $document->id)->where('eg_number_norm', $entry)->orderBy('number')->orderBy('id')->get()
        ->map(static fn (DocumentTyreCombination $c): string => "{$c->number}: {$c->front_width_mm}/{$c->front_aspect} R{$c->front_diameter_in} – {$c->rear_width_mm}/{$c->rear_aspect} R{$c->rear_diameter_in} S.{$c->source_page}")
        ->all();
}

it('puts a different pair in the list of the car\'s field K, numbered as typed, with the same size beside it, and leaves another K\'s alone @admin-219', function (): void {
    ['document' => $document, 'a' => $a, 'b' => $b] = kombinationenDraft();

    kombinationenLines($b, [['front' => '235/35 R19', 'rear' => '235/35 R19']], 5);
    kombinationenLines($a, [
        ['front' => '225/40 R18', 'rear' => '225/40 R18'],
        ['front' => '225/40R18', 'rear' => '245/35 ZR18', 'rear_on_rim' => true],
        ['front' => "225/40\u{00A0}R18", 'rear' => '255/35 R18', 'rear_on_rim' => true],
        ['front' => '235/40 r18', 'rear' => '255/35 R18', 'front_on_rim' => true],
    ]);

    // A paper with a list has only that list: the same size on both axles stands in it too, under each K.
    expect(kombinationenOf($document, KOMBI_A))->toBe([
        '1: 225/40 R18 – 225/40 R18 S.4',
        '2: 225/40 R18 – 245/35 R18 S.4',
        '3: 225/40 R18 – 255/35 R18 S.4',
        '4: 235/40 R18 – 255/35 R18 S.4',
    ])
        ->and(kombinationenOf($document, KOMBI_B))->toBe(['1: 235/35 R19 – 235/35 R19 S.5'])
        // Typed by a person: nothing of it „übernommen, bitte prüfen“.
        ->and(DocumentTyreCombination::query()->where('carried_over', true)->count())->toBe(0)
        ->and(AuditLog::query()->where('description', 'approval.car_entered')->count())->toBe(2);
});

it('has no list at all where every line names one size for both axles, so four of a kind stays open', function (): void {
    ['document' => $document, 'a' => $a] = kombinationenDraft();

    kombinationenLines($a, [['front' => '225/40 R18', 'rear' => '225/40 R18'], ['front' => '235/35 R19', 'rear' => '']]);

    expect(DocumentTyreCombination::query()->where('approval_document_id', $document->id)->count())->toBe(0)
        ->and(DocumentTyreLine::query()->where('document_car_entry_id', $a->id)->orderBy('position')->get()->map(fn (DocumentTyreLine $line): int => (int) $line->rear_width_mm)->all())->toBe([225, 235]);
});

it('takes one front size with several rear sizes, as a table prints them, and one pair typed twice as one row', function (): void {
    ['document' => $document, 'a' => $a] = kombinationenDraft();

    kombinationenLines($a, [
        ['front' => '235/45 R19', 'rear' => '255/40 R19', 'front_on_rim' => true, 'rear_on_rim' => true],
        ['front' => '235/45 R19', 'rear' => '265/40 R19', 'front_on_rim' => true, 'rear_on_rim' => true],
        ['front' => '235/45 R19', 'rear' => '265/40 R19', 'front_on_rim' => true, 'rear_on_rim' => true],
    ], 7);

    expect(kombinationenOf($document, KOMBI_A))->toBe(['1: 235/45 R19 – 255/40 R19 S.7', '2: 235/45 R19 – 265/40 R19 S.7']);
});

it('does not put a size on an axle where the paper does not list it on this wheel: the pair stands, and the shop does not offer it', function (): void {
    ['document' => $document, 'a' => $a] = kombinationenDraft();

    // 68B's rule: a size the paper does not list here is only permitted on another wheel size.
    kombinationenLines($a, [['front' => '225/40 R18', 'rear' => '255/35 R18']]);

    $row = DB::table('fitments')->where('approval_document_id', $document->id)->where('vehicle_id', $a->vehicle_id)->first();

    expect(DB::table('fitment_tyre_sizes')->where('fitment_id', $row?->id)->count())->toBe(0)
        ->and(kombinationenOf($document, KOMBI_A))->toBe(['1: 225/40 R18 – 255/35 R18 S.4']);
});

it('lets no one change the lines of a released document, nor a role that may only look (R-11)', function (): void {
    ['document' => $document, 'a' => $a] = kombinationenDraft();
    $body = ['lines' => [['id' => null, 'front' => '225/40 R18', 'rear' => '255/35 R18', 'kw' => '', 'codes' => []]], 'codes' => [], 'source_page' => 4];

    $this->actingAs(kombinationenAdmin('support-agent'), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$a->id}", $body)->assertForbidden();

    $document->forceFill(['status' => 'published', 'pdf_key' => 'gutachten/1810080716.pdf', 'pdf_sha256' => str_repeat('a', 64)])->save();

    $this->actingAs(kombinationenAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$a->id}", $body)->assertForbidden();

    expect(DocumentTyreCombination::query()->count())->toBe(0);
});

it('hands the shop\'s engine, for a car, the list of the entry its field K falls under — in its numbering and on its page @admin-219', function (): void {
    ['document' => $document, 'a' => $a, 'b' => $b] = kombinationenDraft();
    $admin = kombinationenAdmin();
    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/zaehlung", ['codes' => 0, 'codes_page' => 3, 'sizes' => 4, 'sizes_page' => 3, 'axle_limit_kg' => null, 'axle_limit_page' => null, 'abnahme' => 'none', 'abnahme_page' => null])->assertSessionHasNoErrors();

    kombinationenLines($a, [
        ['front' => '225/40 R18', 'rear' => '225/40 R18'],
        ['front' => '225/40 R18', 'rear' => '245/35 R18', 'rear_on_rim' => true],
        ['front' => '235/40 R18', 'rear' => '255/35 R18', 'front_on_rim' => true, 'rear_on_rim' => true],
    ]);
    kombinationenLines($b, [['front' => '225/40 R18', 'rear' => '225/40 R18']], 6);

    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();

    $configId = (int) DB::table('fitments')->where('approval_document_id', $document->id)->value('wheel_config_id');
    $listFor = static fn (DocumentCarEntry $entry) => (app(FitmentRepository::class)->publishedRowsFor($entry->vehicle_id, [$configId])[$configId][0] ?? null)?->document->tyreCombinations;
    $forA = $listFor($a);
    $forB = $listFor($b);

    expect($forA)->not->toBeNull()
        ->and(array_map(static fn (TyrePairing $p): string => $p->number.' '.$p->key(), $forA->pairs ?? []))->toBe([
            '1 225/40/18|225/40/18',
            '2 225/40/18|245/35/18',
            '3 235/40/18|255/35/18',
        ])
        ->and($forA?->sourcePage)->toBe(4)
        ->and($forA?->unmatched)->toBeFalse()
        ->and(array_map(static fn (TyrePairing $p): string => $p->number.' '.$p->key(), $forB->pairs ?? []))->toBe(['1 225/40/18|225/40/18'])
        ->and($forB?->sourcePage)->toBe(6);
});
