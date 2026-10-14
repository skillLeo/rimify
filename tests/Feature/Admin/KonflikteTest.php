<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Enums\ConflictStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Fitment;
use App\Models\FitmentConflict;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Gutachten\ReleaseAnswers;

/**
 * Gutachten › Konflikte (the corrections memo §3): two current documents that disagree about a car and a
 * wheel make the shop answer UNKNOWN — never the stricter one by itself — until a person decides here, with
 * the reason, in the Protokoll.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function konfliktAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/**
 * An ABE that asks for the Eintragung, and a Teilegutachten released after it that does not — for the
 * same car and wheel.
 *
 * @return array{vehicle: Vehicle, config: WheelConfig, abe: ApprovalDocument, tg: ApprovalDocument}
 */
function disagreeing(): array
{
    $vehicle = Vehicle::factory()->create();
    $model = WheelModel::factory()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0, 'width_in' => 8.0, 'et_mm' => 35]);

    $abe = ApprovalDocument::factory()->abe()->create(['kba_number' => '53810', 'issued_on' => '2024-02-01']);
    $row = Fitment::factory()->requiringEntry()->create(['approval_document_id' => $abe->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id]);
    FitmentTyreSize::factory()->create(['fitment_id' => $row->id, 'width_mm' => 225, 'aspect' => 40, 'diameter_in' => 18.0]);

    $tg = ApprovalDocument::factory()->draft()->create(['report_number' => 'TG-KONFLIKT', 'issued_on' => '2025-05-01']);
    test()->actingAs(konfliktAdmin(), 'admin')->post("/admin/gutachten/{$tg->id}/zeilen", [
        'vehicle_ids' => [$vehicle->id],
        'config_ids' => [$config->id],
        'axle' => 'ALL',
        'entry_note' => '',
        'source_page' => 3,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL', 'codes' => []]],
        'conditions' => [],
    ])->assertSessionHasNoErrors();
    test()->actingAs(konfliktAdmin(), 'admin')->post("/admin/gutachten/{$tg->id}/freigeben", ReleaseAnswers::for($tg))->assertSessionHasNoErrors();

    return ['vehicle' => $vehicle, 'config' => $config, 'abe' => $abe, 'tg' => $tg->refresh()];
}

it('answers UNKNOWN where two documents disagree, and lists both sides until someone decides', function (): void {
    ['vehicle' => $vehicle, 'config' => $config, 'abe' => $abe, 'tg' => $tg] = disagreeing();

    $verdict = app(FitmentResolver::class)->resolve($vehicle->id, $config->id);

    expect($verdict->status->value)->toBe('UNKNOWN')
        ->and($verdict->reason?->code)->toBe(VerdictReason::DOCUMENTS_DISAGREE)
        ->and(FitmentConflict::query()->open()->count())->toBeGreaterThan(0);

    $this->actingAs(konfliktAdmin(), 'admin')->get('/admin/konflikte')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Konflikte/Index')
            ->has('open', 1)
            ->where('open.0.vehicleId', $vehicle->id)
            ->where('open.0.what', fn ($what): bool => collect($what)->contains('Eintragung'))
            ->where('open.0.sides', fn ($sides): bool => collect($sides)->pluck('documentId')->sort()->values()->all() === collect([$abe->id, $tg->id])->sort()->values()->all())
            ->where('can.decide', true));
});

it('reads the decided document alone — with the reason, in the Protokoll', function (): void {
    ['vehicle' => $vehicle, 'config' => $config, 'abe' => $abe, 'tg' => $tg] = disagreeing();
    $pair = ['vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id];

    // Never without the reason, and never a document outside the conflict.
    $this->actingAs(konfliktAdmin(), 'admin')->post('/admin/konflikte/entscheiden', $pair + ['mode' => 'only', 'document_id' => $tg->id, 'reason' => ''])
        ->assertSessionHasErrors(['reason' => 'Bitte schreib dazu, warum – zum Beispiel, was der Hersteller oder die Prüfstelle gesagt hat.']);
    $this->actingAs(konfliktAdmin(), 'admin')->post('/admin/konflikte/entscheiden', $pair + ['mode' => 'only', 'document_id' => ApprovalDocument::factory()->create()->id, 'reason' => 'Irgendein anderes Gutachten.'])
        ->assertSessionHasErrors(['document_id' => 'Dieses Gutachten gehört nicht zu dem Konflikt.']);

    $this->actingAs(konfliktAdmin(), 'admin')->post('/admin/konflikte/entscheiden', $pair + ['mode' => 'only', 'document_id' => $tg->id, 'reason' => 'Die Prüfstelle bestätigt das neuere Teilegutachten.'])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Entschieden: Für diese Kombination gilt jetzt nur das gewählte Gutachten.');

    $verdict = app(FitmentResolver::class)->resolve($vehicle->id, $config->id);

    expect(FitmentConflict::query()->open()->count())->toBe(0)
        ->and(FitmentConflict::query()->where('status', ConflictStatus::ResolvedSupersede->value)->where('prevailing_document_id', $tg->id)->exists())->toBeTrue()
        ->and($verdict->status->value)->toBe('PERMITTED')
        ->and($verdict->document?->id)->toBe($tg->id)
        ->and($verdict->requiresEntry)->toBeFalse()
        ->and(AuditLog::query()->where('description', 'conflict.decided')->exists())->toBeTrue();

    // Decided: the pair has left the open list and stands among the decisions.
    $this->actingAs(konfliktAdmin(), 'admin')->get('/admin/konflikte')
        ->assertInertia(fn (AssertableInertia $page) => $page->has('open', 0)->where('decided.0.decision.mode', 'only')->where('decided.0.decision.reason', 'Die Prüfstelle bestätigt das neuere Teilegutachten.'));

    expect($abe->refresh()->status->value)->toBe('published');
});

it('reads both documents together, the stricter way, and names both when both stand', function (): void {
    ['vehicle' => $vehicle, 'config' => $config, 'abe' => $abe, 'tg' => $tg] = disagreeing();

    $this->actingAs(konfliktAdmin(), 'admin')->post('/admin/konflikte/entscheiden', ['vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id, 'mode' => 'each', 'reason' => 'Beide Dokumente sind gültig; der Hersteller verweist auf beide.'])
        ->assertSessionHasNoErrors();

    $verdict = app(FitmentResolver::class)->resolve($vehicle->id, $config->id);

    expect($verdict->status->value)->toBe('CONDITIONAL')
        ->and($verdict->requiresEntry)->toBeTrue()
        ->and(array_map(fn ($d): int => $d->id, $verdict->documents))->toBe([$tg->id, $abe->id]);
});

it('lets read the Konflikte with the Gutachten right, and decide only with the Freigeben right (R-11)', function (): void {
    ['vehicle' => $vehicle, 'config' => $config] = disagreeing();

    $this->actingAs(konfliktAdmin('support-agent'), 'admin')->get('/admin/konflikte')
        ->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('can.decide', false));
    $this->actingAs(konfliktAdmin('support-agent'), 'admin')->post('/admin/konflikte/entscheiden', ['vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id, 'mode' => 'each', 'reason' => 'Ohne das Recht, zu entscheiden.'])
        ->assertForbidden();
    $this->actingAs(konfliktAdmin('content-editor'), 'admin')->get('/admin/konflikte')->assertForbidden();

    expect(FitmentConflict::query()->open()->count())->toBeGreaterThan(0);
});

it('takes the alert’s link to the pair on the list', function (): void {
    disagreeing();
    $conflict = FitmentConflict::query()->firstOrFail();

    $this->actingAs(konfliktAdmin(), 'admin')->get('/admin/konflikte/'.$conflict->id)
        ->assertRedirect('/admin/konflikte#konflikt-'.$conflict->getAttribute('vehicle_id').'-'.$conflict->getAttribute('wheel_config_id'));
});
