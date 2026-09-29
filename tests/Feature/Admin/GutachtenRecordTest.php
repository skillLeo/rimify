<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCondition;
use App\Models\DocumentConditionRework;
use App\Models\DocumentFastener;
use App\Models\DocumentNotice;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Services\Admin\Dashboard\Coverage;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;

/**
 * The record's shape (the corrections memo §4): a Nachtrag and its base, page 1's header, and what a
 * document states beside its codes — Befestigungsmittel, Pflichthinweise, the millimetres of a rework.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
    Coverage::forget();
});

function recordAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function recordPdf(): string
{
    $key = 'pending/'.Str::lower((string) Str::ulid()).'.pdf';
    Storage::disk('docs_private')->put($key, "%PDF-1.4\n% Beispiel\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");

    return $key;
}

it('takes a Nachtrag only with its base, and says so where we do not hold it — on the record, in the Abdeckung, to the customer', function (): void {
    $this->actingAs(recordAdmin(), 'admin')->post('/admin/gutachten', ['upload_key' => recordPdf(), 'kind' => 'NACHTRAG', 'report_number' => '366-0350-21-WIRD/N1'])
        ->assertSessionHasErrors(['supplement_to_number' => 'Bitte nenn das Grundgutachten, zu dem der Nachtrag gehört – etwa ABE 53841 –, oder wähl es aus der Liste.']);

    $this->actingAs(recordAdmin(), 'admin')->post('/admin/gutachten', [
        'upload_key' => recordPdf(), 'kind' => 'NACHTRAG', 'report_number' => '366-0350-21-WIRD/N1', 'supplement_to_number' => 'ABE 53841',
        'valid_from_production' => '03.2021', 'test_report_number' => '366-0350-21', 'test_site' => 'Darmstadt',
    ])->assertSessionHasNoErrors();

    $nachtrag = ApprovalDocument::query()->where('report_number', '366-0350-21-WIRD/N1')->sole();
    $sentence = 'Grundgutachten ABE 53841 liegt uns nicht vor – dieser Nachtrag allein ist nicht die ganze Freigabe.';

    expect($nachtrag->kind->value)->toBe('NACHTRAG')
        ->and($nachtrag->valid_from_production?->toDateString())->toBe('2021-03-01')
        ->and($nachtrag->baseMissingDe())->toBe($sentence);

    $this->actingAs(recordAdmin(), 'admin')->get("/admin/gutachten/{$nachtrag->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('document.baseMissing', $sentence)
            ->where('document.supplementTo.label', 'ABE 53841')
            ->where('document.header', fn ($header): bool => collect($header)->contains(fn ($e): bool => $e['label'] === 'Gültig ab Fertigungsdatum' && $e['value'] === '03/2021')
                && collect($header)->contains(fn ($e): bool => $e['label'] === 'Prüfort' && $e['value'] === 'Darmstadt')));

    // Released with a row: the Abdeckung and the customer's answer say it.
    $vehicle = Vehicle::factory()->create();
    $model = WheelModel::factory()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0, 'width_in' => 8.0, 'et_mm' => 35]);
    $row = Fitment::factory()->create(['approval_document_id' => $nachtrag->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id]);
    FitmentTyreSize::factory()->create(['fitment_id' => $row->id, 'width_mm' => 225, 'aspect' => 40, 'diameter_in' => 18.0]);
    $nachtrag->publish();

    $verdict = app(FitmentResolver::class)->resolve($vehicle->id, $config->id);

    expect($verdict->document?->notesDe)->toBe([$sentence, 'Gilt für Felgen, die ab 03/2021 gefertigt wurden.'])
        ->and(app(Coverage::class)->matrix()['incomplete'])->toBe([['document' => 'Nachtrag 366-0350-21-WIRD/N1', 'href' => '/admin/gutachten/'.$nachtrag->id, 'sentence' => $sentence, 'base' => 'ABE 53841']]);
});

it('names a base we hold, never another Nachtrag, and only a Nachtrag names one at all', function (): void {
    $base = ApprovalDocument::factory()->abe()->create(['kba_number' => '53841']);
    $other = ApprovalDocument::factory()->draft()->create(['kind' => 'NACHTRAG', 'report_number' => 'N-60000', 'supplement_to_id' => $base->id]);

    $this->actingAs(recordAdmin(), 'admin')->post('/admin/gutachten', ['upload_key' => recordPdf(), 'kind' => 'NACHTRAG', 'report_number' => 'N-55255', 'supplement_to_id' => $other->id])
        ->assertSessionHasErrors(['supplement_to_id' => 'Ein Nachtrag ergänzt ein Gutachten, keinen anderen Nachtrag. Bitte wähl das Grundgutachten.']);

    $this->actingAs(recordAdmin(), 'admin')->post('/admin/gutachten', ['upload_key' => recordPdf(), 'kind' => 'NACHTRAG', 'report_number' => 'N-55255', 'supplement_to_id' => $base->id, 'supplement_to_number' => 'wird verworfen'])
        ->assertSessionHasNoErrors();

    $nachtrag = ApprovalDocument::query()->where('report_number', 'N-55255')->sole();

    expect($nachtrag->supplement_to_id)->toBe($base->id)
        ->and($nachtrag->supplement_to_number)->toBeNull()
        ->and($nachtrag->baseMissingDe())->toBeNull();

    // An ABE names no base, whatever the form still carried; and the table refuses it outright.
    $this->actingAs(recordAdmin(), 'admin')->post('/admin/gutachten', ['upload_key' => recordPdf(), 'kind' => 'ABE', 'kba_number' => '70000', 'supplement_to_number' => 'ABE 1'])->assertSessionHasNoErrors();
    expect(ApprovalDocument::query()->where('kba_number', '70000')->value('supplement_to_number'))->toBeNull()
        ->and(fn () => ApprovalDocument::factory()->create(['kind' => 'NACHTRAG', 'report_number' => 'N-1']))->toThrow(QueryException::class)
        ->and(fn () => ApprovalDocument::factory()->abe()->create(['supplement_to_number' => 'ABE 2']))->toThrow(QueryException::class);
});

it('reads the production month the German way, and refuses one it cannot read', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'ABE', 'kba_number' => '53810']);
    $facts = ['kind' => 'ABE', 'kba_number' => '53810'];

    $this->actingAs(recordAdmin(), 'admin')->put("/admin/gutachten/{$document->id}", $facts + ['valid_from_production' => 'März 21'])
        ->assertSessionHasErrors(['valid_from_production' => 'Den Monat können wir nicht lesen. Schreib ihn bitte so: 03.2021.']);

    foreach (['3.2021' => '2021-03-01', '2021-11' => '2021-11-01', '12/2020' => '2020-12-01', '042022' => '2022-04-01'] as $typed => $stored) {
        $this->actingAs(recordAdmin(), 'admin')->put("/admin/gutachten/{$document->id}", $facts + ['valid_from_production' => $typed])->assertSessionHasNoErrors();
        expect($document->refresh()->valid_from_production?->toDateString())->toBe($stored);
    }
});

it('keeps the Befestigungsmittel, the Pflichthinweise and the rework millimetres of a draft — and not of a released one', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['page_count' => 12]);
    $rework = DocumentCondition::factory()->kind(ConditionKind::Nacharbeitsprofil, 'Die Radlaufkante ist nach Maßtabelle nachzuarbeiten.')->create(['approval_document_id' => $document->id, 'code' => 'K42']);
    $other = DocumentCondition::factory()->kind(ConditionKind::Hinweis, 'Ein Hinweis aus dem Gutachten.')->create(['approval_document_id' => $document->id, 'code' => 'A14']);
    $base = "/admin/gutachten/{$document->id}";

    // Befestigungsmittel: torque in range, number once per document.
    $this->actingAs(recordAdmin(), 'admin')->post("{$base}/befestigungsmittel", ['number' => 'S01', 'thread' => 'M14x1,25', 'seat' => 'Kegelbund 60°', 'torque_nm' => 30])
        ->assertSessionHasErrors(['torque_nm' => 'Das Anzugsmoment bitte in ganzen Newtonmetern, zwischen 50 und 300.']);
    $this->actingAs(recordAdmin(), 'admin')->post("{$base}/befestigungsmittel", ['number' => 'S01', 'thread' => 'M14x1,25', 'seat' => 'Kegelbund 60°', 'torque_nm' => 140, 'shaft_length_mm' => 28, 'vehicle_types' => '3C, 4C'])
        ->assertSessionHasNoErrors()->assertSessionHas('toast', 'Befestigungsmittel gespeichert.');
    $this->actingAs(recordAdmin(), 'admin')->post("{$base}/befestigungsmittel", ['number' => 'S01', 'thread' => 'M12x1,5', 'seat' => 'Kugelbund R12'])
        ->assertSessionHasErrors(['number' => 'Diese Nummer gibt es in diesem Gutachten schon.']);

    // A Pflichthinweis as a whole sentence, on a page the document has.
    $this->actingAs(recordAdmin(), 'admin')->post("{$base}/hinweise", ['text_de' => 'Die Radschrauben sind nach 50 km mit dem vorgeschriebenen Anzugsmoment nachzuziehen.', 'source_page' => 13])
        ->assertSessionHasErrors(['source_page' => 'Das Gutachten hat nur 12 Seiten.']);
    $this->actingAs(recordAdmin(), 'admin')->post("{$base}/hinweise", ['text_de' => 'Die Radschrauben sind nach 50 km mit dem vorgeschriebenen Anzugsmoment nachzuziehen.', 'source_page' => 9])
        ->assertSessionHasNoErrors();

    // Millimetres only for a rework code, and at least one of them.
    $this->actingAs(recordAdmin(), 'admin')->post("{$base}/nacharbeit", ['document_condition_id' => $other->id, 'vehicle_type' => '3C', 'axle' => 'REAR', 'from_mm' => '15'])
        ->assertSessionHasErrors('document_condition_id');
    $this->actingAs(recordAdmin(), 'admin')->post("{$base}/nacharbeit", ['document_condition_id' => $rework->id, 'vehicle_type' => '3C', 'axle' => 'REAR'])
        ->assertSessionHasErrors(['from_mm' => 'Bitte mindestens ein Maß: von, bis oder die Aufweitung.']);
    $this->actingAs(recordAdmin(), 'admin')->post("{$base}/nacharbeit", ['document_condition_id' => $rework->id, 'vehicle_type' => '3C', 'axle' => 'REAR', 'from_mm' => '15', 'to_mm' => '32,5', 'flare_mm' => '5'])
        ->assertSessionHasNoErrors();

    $this->actingAs(recordAdmin(), 'admin')->get($base)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('fasteners.0.number', 'S01')->where('fasteners.0.torqueNm', 140)->where('fasteners.0.vehicleTypes', '3C, 4C')
            ->where('notices.0.page', 9)
            ->where('reworks.0.code', 'K42')->where('reworks.0.measure', 'von 15 bis 32,5'."\u{00A0}".'mm · aufgeweitet um 5'."\u{00A0}".'mm'));

    expect(AuditLog::query()->whereIn('description', ['approval.fastener_added', 'approval.notice_added', 'approval.rework_added'])->count())->toBe(3);

    // A rework code with its millimetres is not taken away with them in silence.
    $this->actingAs(recordAdmin(), 'admin')->delete("{$base}/auflagen/{$rework->id}")
        ->assertSessionHasErrors(['condition' => DocumentConditions::HAS_REWORKS]);

    // Taken away again; then, released, nothing changes here any more.
    $fastener = DocumentFastener::query()->sole();
    $this->actingAs(recordAdmin(), 'admin')->delete("{$base}/befestigungsmittel/{$fastener->id}")->assertSessionHasNoErrors();
    expect(DocumentFastener::query()->count())->toBe(0)
        ->and(AuditLog::query()->where('description', 'approval.fastener_removed')->exists())->toBeTrue();

    $document->forceFill(['status' => 'published', 'valid_from' => now()->toDateString()])->save();
    $notice = DocumentNotice::query()->sole();
    $this->actingAs(recordAdmin(), 'admin')->delete("{$base}/hinweise/{$notice->id}")->assertForbidden();
    $this->actingAs(recordAdmin(), 'admin')->post("{$base}/hinweise", ['text_de' => 'Ein neuer Hinweis nach der Freigabe.'])->assertForbidden();
    expect(DocumentNotice::query()->count())->toBe(1)->and(DocumentConditionRework::query()->count())->toBe(1);
});

it('asks the Gutachten rights on the server, and never touches another document’s entries (R-11)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $stranger = ApprovalDocument::factory()->draft()->create();
    $notice = DocumentNotice::query()->create(['approval_document_id' => $stranger->id, 'text_de' => 'Ein Hinweis des anderen Gutachtens.']);

    $this->actingAs(recordAdmin('support-agent'), 'admin')->post("/admin/gutachten/{$document->id}/hinweise", ['text_de' => 'Ohne das Recht, Gutachten zu ändern.'])->assertForbidden();
    $this->actingAs(recordAdmin(), 'admin')->delete("/admin/gutachten/{$document->id}/hinweise/{$notice->id}")->assertForbidden();

    expect(DocumentNotice::query()->count())->toBe(1);
});
