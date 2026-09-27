<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Enums\ConflictKind;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\ConditionCode;
use App\Models\Fitment;
use App\Models\FitmentConflict;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentPreview;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
        'requires_entry' => false,
        'entry_note' => '',
        'source_page' => 4,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL']],
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
    $condition = ConditionCode::query()->where('code', 'ARCH_ROLLING')->firstOrFail();

    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload($vehicles, $sizes, [
        'conditions' => [['id' => $condition->id, 'note' => 'Nur an der Hinterachse.']],
    ]))->assertSessionHas('toast', '4 Zeilen angelegt.');

    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([$vehicles[0]], [$sizes[0]]))
        ->assertSessionHas('toast', 'Keine neue Zeile: Diese Zeile gab es schon; sie bleibt, wie sie war.');

    $row = Fitment::query()->with(['tyreSizes', 'conditions'])->where('approval_document_id', $document->id)->firstOrFail();

    expect(Fitment::query()->where('approval_document_id', $document->id)->count())->toBe(4)
        ->and($row->status)->toBe(FitmentStatus::Draft)
        ->and($row->source_page)->toBe(4)
        ->and($row->tyreSizes)->toHaveCount(1)
        ->and($row->conditions->first()?->pivot?->getAttribute('note_de'))->toBe('Nur an der Hinterachse.');
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
    $condition = ConditionCode::query()->where('code', 'ARCH_ROLLING')->firstOrFail();

    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([$vehicle], [$size], ['conditions' => [['id' => $condition->id, 'note' => null]]]));

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

it('records where two documents disagree, releases anyway, and says the stricter one governs', function (): void {
    $vehicle = Vehicle::factory()->create();
    $size = wheelSize();
    $existing = ApprovalDocument::factory()->create();
    Fitment::factory()->requiringEntry()->create(['approval_document_id' => $existing->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $size->id]);

    $document = ApprovalDocument::factory()->draft()->create();
    $this->actingAs(erfassung(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", rowPayload([$vehicle], [$size], ['requires_entry' => false]));

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

describe('the Auflagen-Katalog', function (): void {
    it('takes an Auflage only as a whole sentence, and keeps its purchase weight from its severity', function (): void {
        $this->actingAs(erfassung(), 'admin')->post('/admin/auflagen', ['code' => 'kotfluegel', 'severity' => 'WORKSHOP', 'text' => 'kotflügel anpassen', 'affects_tyre_choice' => false, 'requires_acknowledgement' => false])
            ->assertSessionHasErrors(['text' => 'Bitte als ganzen Satz: mit einem Großbuchstaben am Anfang und einem Punkt am Ende.']);

        $this->actingAs(erfassung(), 'admin')->post('/admin/auflagen', ['code' => 'kotfluegel', 'severity' => 'WORKSHOP', 'text' => 'Die Kotflügelkante muss angepasst werden.', 'affects_tyre_choice' => false, 'requires_acknowledgement' => false])
            ->assertSessionHasNoErrors();

        $code = ConditionCode::query()->where('code', 'KOTFLUEGEL')->firstOrFail();

        expect($code->affects_purchase)->toBeTrue()->and($code->requires_acknowledgement)->toBeTrue();
    });

    it('will not delete an Auflage a row carries', function (): void {
        $code = ConditionCode::factory()->create();
        $row = Fitment::factory()->create();
        $row->conditions()->attach($code->id);

        $this->actingAs(erfassung(), 'admin')->delete("/admin/auflagen/{$code->id}")->assertForbidden();
        expect(ConditionCode::query()->whereKey($code->id)->exists())->toBeTrue();
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
