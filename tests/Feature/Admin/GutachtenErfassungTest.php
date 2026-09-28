<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Enums\ConflictKind;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCondition;
use App\Models\Fitment;
use App\Models\FitmentConflict;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Services\Admin\Approvals\DocumentPreview;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia;

/**
 * Gutachten-Erfassung (the review release §4.3): the PDF and the document's facts, the
 * Verwendungsbereich rows for vehicles × sizes, the preview by the shop's own resolver, and the
 * Freigabe — the whole document at once, conflicts with other documents recorded, never hidden.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    // No bucket: the PDF takes the app's own pending place, as on a development machine.
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function erfassung(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A PDF waiting where the browser's upload leaves it. */
function pendingPdf(): string
{
    $key = 'pending/'.Str::lower((string) Str::ulid()).'.pdf';
    Storage::disk('docs_private')->put($key, "%PDF-1.4\n% Beispiel\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");

    return $key;
}

function wheelSize(float $width = 8.0, int $et = 35): WheelConfig
{
    $model = WheelModel::factory()->draft()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);

    return WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0, 'width_in' => $width, 'et_mm' => $et]);
}

function rowPayload(array $vehicles, array $configs, array $override = []): array
{
    return array_replace([
        'vehicle_ids' => array_map(fn ($v): int => $v->id, $vehicles),
        'config_ids' => array_map(fn ($c): int => $c->id, $configs),
        'axle' => 'ALL',
        'entry_note' => '',
        'source_page' => 4,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL', 'codes' => []]],
        'conditions' => [],
    ], $override);
}

it('takes a PDF and the facts, and keeps the document a draft with the file’s hash', function (): void {
    $this->actingAs(erfassung(), 'admin')->post('/admin/gutachten', [
        'upload_key' => pendingPdf(),
        'kind' => 'ABE',
        'kba_number' => '53810',
        'issuer' => 'Kraftfahrt-Bundesamt',
        'issued_on' => '2026-03-02',
        'page_count' => 12,
    ])->assertRedirect()->assertSessionHas('toast', 'Gutachten angelegt. Jetzt den Verwendungsbereich eintragen.');

    $document = ApprovalDocument::query()->firstOrFail();

    expect($document->status)->toBe(DocumentStatus::Draft)
        ->and($document->kba_number)->toBe('53810')
        ->and($document->pdf_key)->toStartWith('gutachten/')
        ->and($document->pdf_sha256)->toBe(hash('sha256', (string) Storage::disk('docs_public')->get((string) $document->pdf_key)))
        ->and(AuditLog::query()->where('description', 'approval.created')->exists())->toBeTrue();
    Storage::disk('docs_private')->assertDirectoryEmpty('pending');
});

it('asks each kind for its own number, and refuses a file that is not a PDF', function (): void {
    $this->actingAs(erfassung(), 'admin')->post('/admin/gutachten', ['upload_key' => pendingPdf(), 'kind' => 'ABE'])
        ->assertSessionHasErrors(['kba_number' => 'Eine ABE braucht ihre KBA-Nummer.']);

    $key = 'pending/'.Str::lower((string) Str::ulid()).'.pdf';
    Storage::disk('docs_private')->put($key, 'kein PDF');

    $this->actingAs(erfassung(), 'admin')->post('/admin/gutachten', ['upload_key' => $key, 'kind' => 'TEILEGUTACHTEN', 'report_number' => 'TG-1'])
        ->assertSessionHasErrors(['upload_key' => 'Das ist keine PDF-Datei. Ein Gutachten wird nur im PDF-Format angenommen.']);

    expect(ApprovalDocument::query()->count())->toBe(0);
});

it('adds a row for every vehicle and size chosen, with tyre sizes and Auflagen, and leaves a row already there', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $vehicles = Vehicle::factory()->count(2)->create()->all();
    $sizes = [wheelSize(8.0), wheelSize(8.5)];
    DocumentCondition::factory()->kind(ConditionKind::Karosseriearbeit, 'Bördeln der Radläufe erforderlich.')->create(['approval_document_id' => $document->id, 'code' => 'K1']);

    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload($vehicles, $sizes, [
        'conditions' => [['code' => 'K1', 'note' => 'Nur an der Hinterachse.']],
    ]))->assertSessionHas('toast', '4 Zeilen angelegt.');

    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([$vehicles[0]], [$sizes[0]]))
        ->assertSessionHas('toast', 'Keine neue Zeile: Diese Zeile gab es schon; sie bleibt, wie sie war.');

    $row = Fitment::query()->with(['tyreSizes', 'conditionCodes'])->where('approval_document_id', $document->id)->firstOrFail();

    expect(Fitment::query()->where('approval_document_id', $document->id)->count())->toBe(4)
        ->and($row->status)->toBe(FitmentStatus::Draft)
        ->and($row->source_page)->toBe(4)
        ->and($row->tyreSizes)->toHaveCount(1)
        ->and($row->conditionCodes->first()?->code)->toBe('K1')
        ->and($row->conditionCodes->first()?->note_de)->toBe('Nur an der Hinterachse.');
});

it('refuses a row without a tyre size, and a page past the document’s end', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['page_count' => 10]);

    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([Vehicle::factory()->create()], [wheelSize()], ['tyre_sizes' => [], 'source_page' => 11]))
        ->assertSessionHasErrors([
            'tyre_sizes' => 'Eine Zeile braucht mindestens eine Reifengröße.',
            'source_page' => 'Das Gutachten hat nur 10 Seiten.',
        ]);
});

it('previews what the shop will say — by the shop’s own resolver — before anything is released', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $vehicle = Vehicle::factory()->create(['build_from' => '2019-01-01', 'build_to' => null]);
    $size = wheelSize();
    DocumentCondition::factory()->kind(ConditionKind::Karosseriearbeit, 'Bördeln der Radläufe erforderlich.')->create(['approval_document_id' => $document->id, 'code' => 'K1']);

    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([$vehicle], [$size], ['conditions' => [['code' => 'K1', 'note' => null]]]));

    $preview = app(DocumentPreview::class)->for($document, $vehicle->id);

    expect($preview)->toHaveCount(1)
        ->and($preview[0]['status'])->toBe('CONDITIONAL')
        ->and($preview[0]['conditions'])->toContain('Bördeln der Radläufe erforderlich.')
        ->and($preview[0]['sourcePage'])->toBe(4)
        // The shop itself still says nothing: the draft is not released.
        ->and(app(FitmentResolver::class)->resolve($vehicle->id, $size->id)->status->value)->not->toBe('CONDITIONAL');
});

it('releases the whole document at once, and replaces the revision it supersedes', function (): void {
    $old = ApprovalDocument::factory()->create(['report_number' => 'TG-ALT']);
    $document = ApprovalDocument::factory()->draft()->create(['supersedes_id' => $old->id, 'revision' => 2]);
    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload(Vehicle::factory()->count(2)->create()->all(), [wheelSize()]));

    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben")
        ->assertSessionHas('toast', 'Freigegeben: 2 Zeilen sind jetzt im Shop.');

    expect($document->refresh()->status)->toBe(DocumentStatus::Published)
        ->and($document->valid_from?->toDateString())->toBe(now()->toDateString())
        ->and(Fitment::query()->where('approval_document_id', $document->id)->where('status', 'published')->count())->toBe(2)
        ->and($old->refresh()->status)->toBe(DocumentStatus::Superseded)
        ->and(AuditLog::query()->where('description', 'approval.released')->exists())->toBeTrue();

    // Released is released: its rows no longer change here.
    $row = Fitment::query()->where('approval_document_id', $document->id)->firstOrFail();
    $this->actingAs(erfassung(), 'admin')->delete("/admin/gutachten/{$document->id}/zeilen/{$row->id}")->assertForbidden();
});

it('does not release a document without rows or without its PDF, and says why', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['pdf_key' => null]);

    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben")
        ->assertSessionHasErrors(['release' => 'Noch nicht freigebbar: Das PDF des Gutachtens fehlt. Es gibt noch keine Zeile im Verwendungsbereich.']);
});

it('never releases a row on a development car, in any environment — and does on a car from a Gutachten (DATA-01)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $development = Vehicle::factory()->development()->create();
    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([$development], [wheelSize()]));
    $sentence = 'Eine Zeile nennt ein Fahrzeug ohne belegte Herkunft, etwa aus den Entwicklungsdaten. Freigegeben wird nur ein Fahrzeug aus einem Fahrzeugdaten-Import, aus einem Gutachten oder manuell geprüft.';

    expect(Fitment::query()->where('approval_document_id', $document->id)->count())->toBe(1)
        ->and(app(DocumentRelease::class)->check($document))->toBe([$sentence])
        ->and(fn () => app(DocumentRelease::class)->release($document, erfassung()))->toThrow(ValidationException::class, 'Noch nicht freigebbar: '.$sentence);

    // Refused the same way in production: there is no switch.
    app()['env'] = 'production';

    try {
        expect(app(DocumentRelease::class)->check($document))->toBe([$sentence]);
    } finally {
        app()['env'] = 'testing';
    }

    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben")->assertSessionHasErrors(['release' => 'Noch nicht freigebbar: '.$sentence]);
    expect($document->refresh()->status)->toBe(DocumentStatus::Draft);

    // A car typed from a real Gutachten has no key numbers and is real vehicle data: it may be named.
    $source = ApprovalDocument::factory()->create(['report_number' => 'TG-QUELLE']);
    $fromDocument = Vehicle::factory()->create(['source' => 'gutachten', 'source_document_id' => $source->id, 'source_page' => 7]);
    $other = ApprovalDocument::factory()->draft()->create();
    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$other->id}/zeilen", rowPayload([$fromDocument], [wheelSize()]));
    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$other->id}/freigeben")->assertSessionHasNoErrors();

    expect($other->refresh()->status)->toBe(DocumentStatus::Published);
});

it('keeps a car’s source to the list, and a car from a Gutachten to its document', function (): void {
    expect(fn () => Vehicle::factory()->create(['source' => 'import:irgendwas']))->toThrow(QueryException::class)
        ->and(fn () => Vehicle::factory()->create(['source' => 'gutachten', 'source_document_id' => null]))->toThrow(QueryException::class);

    $source = ApprovalDocument::factory()->create();
    Vehicle::factory()->create(['source' => 'gutachten', 'source_document_id' => $source->id]);

    // The document a car was read from stays as long as the car.
    expect(fn () => $source->delete())->toThrow(QueryException::class);
});

it('records where two documents disagree, releases anyway, and says the stricter one governs', function (): void {
    $vehicle = Vehicle::factory()->create();
    $size = wheelSize();
    $existing = ApprovalDocument::factory()->create();
    Fitment::factory()->requiringEntry()->create(['approval_document_id' => $existing->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $size->id]);

    $document = ApprovalDocument::factory()->draft()->create();
    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([$vehicle], [$size]));

    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben")
        ->assertSessionHas('toast', fn (string $t): bool => str_contains($t, 'Widerspr') && str_contains($t, 'strengere Angabe'));

    $conflicts = FitmentConflict::query()->get();

    expect($conflicts->pluck('kind')->map(fn ($k) => $k->value)->all())->toContain(ConflictKind::EntryRequirement->value)
        ->and($conflicts->first()?->detail['existing']['requires_entry'])->toBeTrue()
        ->and($document->refresh()->status)->toBe(DocumentStatus::Published);
});

it('asks the Gutachten rights on the server (R-11)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();

    $this->actingAs(erfassung('support-agent'), 'admin')->get('/admin/gutachten/neu')->assertForbidden();
    $this->actingAs(erfassung('support-agent'), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([Vehicle::factory()->create()], [wheelSize()]))->assertForbidden();
    $this->actingAs(erfassung('support-agent'), 'admin')->post("/admin/gutachten/{$document->id}/freigeben")->assertForbidden();

    $this->actingAs(erfassung('support-agent'), 'admin')->get("/admin/gutachten/{$document->id}")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Gutachten/Show')->where('can.edit', false)->where('can.release', false));
});

it('finds vehicles by HSN/TSN or by name, and sizes by model or SKU', function (): void {
    $bmw = Vehicle::factory()->create(['hsn' => '0005', 'tsn' => 'BGU', 'make' => 'BMW', 'model' => '3er', 'variant' => 'Limousine']);
    Vehicle::factory()->create(['hsn' => '0588', 'tsn' => 'AAA', 'make' => 'Audi', 'model' => 'A4', 'variant' => 'Avant']);
    $size = wheelSize();

    $this->actingAs(erfassung(), 'admin')->getJson('/admin/gutachten/suche/fahrzeuge?q=0005%2FBGU')
        ->assertOk()->assertJsonCount(1, 'items')->assertJsonPath('items.0.id', $bmw->id);
    $this->actingAs(erfassung(), 'admin')->getJson('/admin/gutachten/suche/fahrzeuge?q=bmw%203er')
        ->assertJsonPath('items.0.id', $bmw->id);
    $this->actingAs(erfassung(), 'admin')->getJson('/admin/gutachten/suche/felgen?q='.urlencode((string) $size->getAttribute('sku')))
        ->assertOk()->assertJsonPath('groups.0.sizes.0.id', $size->id);
});

describe('each document’s own Auflagenverzeichnis (the corrections memo §1, §2)', function (): void {
    /** A code of the document's list, entered as a person does on the Gutachten. */
    function defineCode(ApprovalDocument $document, string $code, string $kind, string $text, ?int $page = null): void
    {
        test()->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => $code, 'kind' => $kind, 'text_de' => $text, 'source_page' => $page])
            ->assertSessionHasNoErrors();
    }

    it('keeps A01 of one Gutachten to that Gutachten: the other one’s A01 never speaks for it', function (): void {
        $vehicle = Vehicle::factory()->create();
        [$narrow, $wide] = [wheelSize(8.0), wheelSize(8.5)];
        $abe = ApprovalDocument::factory()->draft()->create(['page_count' => 12]);
        $tg = ApprovalDocument::factory()->draft()->create(['page_count' => 12]);

        defineCode($abe, 'A01', 'abnahme', 'Die Anbauabnahme durch einen amtlich anerkannten Prüfer ist erforderlich.', 6);
        defineCode($tg, 'A01', 'hinweis', 'Die Reifen müssen eine M+S-Kennung tragen.', 3);

        $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$abe->id}/zeilen", rowPayload([$vehicle], [$narrow], ['conditions' => [['code' => 'A01', 'note' => null]]]))->assertSessionHasNoErrors();
        $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$tg->id}/zeilen", rowPayload([$vehicle], [$wide], ['conditions' => [['code' => 'A01', 'note' => null]]]))->assertSessionHasNoErrors();
        $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$abe->id}/freigeben")->assertSessionHasNoErrors();
        $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$tg->id}/freigeben")->assertSessionHasNoErrors();

        $verdicts = app(FitmentResolver::class)->resolveMany($vehicle->id, [$narrow->id, $wide->id]);
        $sentences = fn ($v): array => array_map(fn ($c): string => $c->sentenceDe(), $v->conditions);

        expect(DocumentCondition::query()->where('code', 'A01')->count())->toBe(2)
            ->and($sentences($verdicts[$narrow->id]))->toBe(['Die Anbauabnahme durch einen amtlich anerkannten Prüfer ist erforderlich.'])
            ->and($verdicts[$narrow->id]->requiresEntry)->toBeTrue()
            ->and($verdicts[$narrow->id]->status->value)->toBe('CONDITIONAL')
            ->and($sentences($verdicts[$wide->id]))->toBe(['Die Reifen müssen eine M+S-Kennung tragen.'])
            ->and($verdicts[$wide->id]->requiresEntry)->toBeFalse()
            ->and($verdicts[$wide->id]->status->value)->toBe('PERMITTED');
    });

    it('keeps a row whose code its document does not define UNKNOWN, and never releases it', function (): void {
        $document = ApprovalDocument::factory()->draft()->create(['page_count' => 12]);
        $vehicle = Vehicle::factory()->create();
        $size = wheelSize();

        // Typed as printed before the list holds it: taken, said, and it stops the Freigabe.
        $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([$vehicle], [$size], ['conditions' => [['code' => 'K1c', 'note' => null]]]))
            ->assertSessionHasNoErrors();

        $preview = app(DocumentPreview::class)->for($document, $vehicle->id);

        expect($preview[0]['status'])->toBe('UNKNOWN')
            ->and($preview[0]['reason'])->toBe('Eine Auflage des Gutachtens ist bei uns noch nicht vollständig erfasst. Bis dahin können wir die Freigabe nicht bestätigen.')
            ->and(app(DocumentRelease::class)->check($document))->toBe(['Code K1c ist in diesem Gutachten nicht definiert (eine Zeile). Leg ihn im Auflagenverzeichnis an oder nimm ihn aus den Zeilen.']);

        $this->actingAs(erfassung(), 'admin')->get("/admin/gutachten/{$document->id}")
            ->assertInertia(fn (AssertableInertia $page) => $page->where('unresolved', [['code' => 'K1c', 'rows' => 1]])->where('rows.0.conditions.0.defined', false));

        // Compared exactly as printed: K1C is not K1c.
        defineCode($document, 'K1C', 'hinweis', 'Ein anderer Code mit großem C.');
        expect(app(DocumentRelease::class)->check($document))->not->toBe([]);

        defineCode($document, 'K1c', 'karosseriearbeit', 'Die Radhausausschnitte an der Hinterachse sind zu bördeln.', 7);

        expect(app(DocumentRelease::class)->check($document))->toBe([])
            ->and(app(DocumentPreview::class)->for($document, $vehicle->id)[0]['status'])->toBe('CONDITIONAL');
    });

    it('derives the Eintragung per tyre size from an Abnahme, and takes an override only with its reason', function (): void {
        $document = ApprovalDocument::factory()->draft()->create(['page_count' => 12]);
        $vehicle = Vehicle::factory()->create();
        $size = wheelSize();
        defineCode($document, 'A01', 'abnahme', 'Die Anbauabnahme durch einen amtlich anerkannten Prüfer ist erforderlich.', 6);

        $sizes = [
            ['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL', 'codes' => []],
            ['width_mm' => 235, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL', 'codes' => ['A01']],
        ];
        $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([$vehicle], [$size], ['tyre_sizes' => $sizes]))->assertSessionHasNoErrors();
        $row = Fitment::query()->where('approval_document_id', $document->id)->sole();

        expect($row->requires_entry)->toBeTrue();
        $this->actingAs(erfassung(), 'admin')->get("/admin/gutachten/{$document->id}")
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('rows.0.tyreSizes.0.requiresEntry', false)
                ->where('rows.0.tyreSizes.1.requiresEntry', true)
                ->where('rows.0.entrySource', ['A01, Seite 6'])
                ->where('rows.0.entryOverride', null));

        $update = array_diff_key(rowPayload([], [], ['tyre_sizes' => $sizes]), ['vehicle_ids' => true, 'config_ids' => true]);

        // Not typed: an override without its reason is refused.
        $this->actingAs(erfassung(), 'admin')->put("/admin/gutachten/{$document->id}/zeilen/{$row->id}", $update + ['entry_override' => 'not_required'])
            ->assertSessionHasErrors(['entry_override_reason' => 'Wer die abgeleitete Eintragung ändert, schreibt dazu, warum – etwa die Aussage des Prüfers.']);

        $reason = 'Der Prüfer bestätigt: Die Abnahme ist bei 235/40 R18 nur mit Schneeketten nötig.';
        $this->actingAs(erfassung(), 'admin')->put("/admin/gutachten/{$document->id}/zeilen/{$row->id}", $update + ['entry_override' => 'not_required', 'entry_override_reason' => $reason])
            ->assertSessionHasNoErrors();
        $row->refresh();
        $preview = app(DocumentPreview::class)->for($document, $vehicle->id);

        expect($row->requires_entry)->toBeFalse()
            ->and($row->entry_override)->toBe('not_required')
            ->and($row->entry_override_by)->toBe(erfassung()->id)
            ->and($row->entry_override_at)->not->toBeNull()
            ->and(AuditLog::query()->where('description', 'approval.entry_overridden')->exists())->toBeTrue()
            ->and($preview[0]['requiresEntry'])->toBeFalse()
            ->and($preview[0]['conditions'])->toContain('Laut Prüfer ist keine Eintragung erforderlich: '.$reason);
    });

    it('narrows a row by the body styles its code names, and never passes a car whose body style it cannot tell', function (): void {
        $document = ApprovalDocument::factory()->draft()->create(['page_count' => 12]);
        $coupe = Vehicle::factory()->create(['body_form' => 'Coupe']);
        $kombi = Vehicle::factory()->create(['body_form' => 'Kombi']);
        $unknown = Vehicle::factory()->create(['body_form' => null]);
        $size = wheelSize();

        $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => 'Cpe', 'kind' => 'karosserieform', 'text_de' => 'Nur für Fahrzeuge mit Coupé-Karosserie.', 'body_forms' => ['Coupe', 'Cabrio']])
            ->assertSessionHasNoErrors();
        $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([$coupe, $kombi, $unknown], [$size], ['conditions' => [['code' => 'Cpe', 'note' => null]]]))
            ->assertSessionHasNoErrors();

        $status = fn (Vehicle $v): string => app(DocumentPreview::class)->for($document, $v->id)[0]['status'];

        // A filter is not a sentence: the Coupé is simply covered.
        expect($status($coupe))->toBe('PERMITTED')
            ->and(app(DocumentPreview::class)->for($document, $coupe->id)[0]['conditions'])->toBe([])
            ->and($status($kombi))->toBe('NOT_PERMITTED')
            ->and($status($unknown))->toBe('UNKNOWN');
    });

    it('never takes a code away that a row still carries, and fixes a released document’s list', function (): void {
        $document = ApprovalDocument::factory()->draft()->create(['page_count' => 12]);
        defineCode($document, 'A12', 'verbot', 'Die Verwendung von Schneeketten ist nicht zulässig.');
        $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([Vehicle::factory()->create()], [wheelSize()], ['conditions' => [['code' => 'A12', 'note' => null]]]));
        $condition = DocumentCondition::query()->where('approval_document_id', $document->id)->sole();

        $this->actingAs(erfassung(), 'admin')->delete("/admin/gutachten/{$document->id}/auflagen/{$condition->id}")
            ->assertSessionHasErrors(['condition' => DocumentConditions::IN_USE]);

        $released = ApprovalDocument::factory()->create();
        $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$released->id}/auflagen", ['code' => 'A01', 'kind' => 'hinweis', 'text_de' => 'Ein Hinweis aus dem Gutachten.'])->assertForbidden();
        $this->actingAs(erfassung('support-agent'), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => 'A02', 'kind' => 'hinweis', 'text_de' => 'Ein Hinweis aus dem Gutachten.'])->assertForbidden();
    });

    it('shows every document’s own list, read-only, with the codes it does not define', function (): void {
        $document = ApprovalDocument::factory()->draft()->create(['page_count' => 12]);
        defineCode($document, 'A01', 'abnahme', 'Die Anbauabnahme durch einen amtlich anerkannten Prüfer ist erforderlich.', 6);
        $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([Vehicle::factory()->create()], [wheelSize()], ['conditions' => [['code' => 'T88', 'note' => null]]]));

        $this->actingAs(erfassung(), 'admin')->get('/admin/auflagen')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Auflagen/Index')
                ->where('documents.0.id', $document->id)
                ->where('documents.0.conditions.0.code', 'A01')
                ->where('documents.0.conditions.0.section', 'Abnahme')
                ->where('documents.0.unresolved', [['code' => 'T88', 'rows' => 1]]));

        $this->actingAs(erfassung('content-editor'), 'admin')->get('/admin/auflagen')->assertForbidden();
    });
});

describe('Fahrzeuge', function (): void {
    it('lists the vehicles waiting for their legal data, and lets them out when the data is complete (R-03)', function (): void {
        $waiting = Vehicle::factory()->needsReview()->create(['make' => 'Škoda', 'model' => 'Octavia', 'variant' => 'Combi']);
        Vehicle::factory()->create();

        $this->actingAs(erfassung(), 'admin')->get('/admin/fahrzeuge/pruefung')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Fahrzeuge/Index')->has('vehicles', 1)->where('vehicles.0.id', $waiting->id)->where('review', true));

        $this->actingAs(erfassung(), 'admin')->put("/admin/fahrzeuge/{$waiting->id}", ['axle_load_front_kg' => 1010, 'axle_load_rear_kg' => null, 'max_speed_kmh' => 210])
            ->assertSessionHas('toast', 'Gespeichert. Es fehlen noch Angaben – das Fahrzeug bleibt zur Prüfung.');
        expect($waiting->refresh()->needs_review)->toBeTrue();

        $this->actingAs(erfassung(), 'admin')->put("/admin/fahrzeuge/{$waiting->id}", ['axle_load_front_kg' => 1010, 'axle_load_rear_kg' => 980, 'max_speed_kmh' => 210])
            ->assertSessionHas('toast', 'Gespeichert. Das Fahrzeug ist vollständig.');
        expect($waiting->refresh()->needs_review)->toBeFalse();
    });

    it('is refused to a role without the vehicles right', function (): void {
        $vehicle = Vehicle::factory()->create();

        $this->actingAs(erfassung('content-editor'), 'admin')->get('/admin/fahrzeuge')->assertForbidden();
        $this->actingAs(erfassung('support-agent'), 'admin')->put("/admin/fahrzeuge/{$vehicle->id}", ['axle_load_front_kg' => 1000, 'axle_load_rear_kg' => 1000, 'max_speed_kmh' => 200])->assertForbidden();
    });
});
