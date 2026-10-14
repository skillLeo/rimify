<?php

declare(strict_types=1);

use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\AuditDescriber;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Artisan;

/*
 * `rimify:gutachten-zuruecknehmen` (D-225): an entry that leans the permissive way comes off the shop until it is
 * complete. The document and every row go back to Entwurf in one step, the Protokoll says who decided and why, and the
 * live shop refuses the command — as it refuses `rimify:gutachten-freigeben`.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

const TAKE_BACK_INSTRUCTION = 'Brief vom 14.10.2026, §4: Nothing from that entry reaches a customer until it is complete. Mark it unreleased.';

const TAKE_BACK_REASON = 'Eingetragen ist eine von sechs Auflagen, keine Abnahme und nicht die Achslastgrenze von 1160 kg.';

/** A released document with one row on sale, released by the button's own path. */
function takeBackReleased(): ApprovalDocument
{
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $vehicle = Vehicle::factory()->create();
    $model = WheelModel::factory()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0, 'width_in' => 8.5, 'et_mm' => 30]);
    $draft = ApprovalDocument::factory()->draft()->create(['report_number' => 'TG-ZURUECK', 'issued_on' => '2003-04-22']);

    test()->actingAs($admin, 'admin')->post("/admin/gutachten/{$draft->id}/zeilen", [
        'vehicle_ids' => [$vehicle->id],
        'config_ids' => [$config->id],
        'axle' => 'ALL',
        'entry_note' => '',
        'source_page' => 1,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL', 'codes' => []]],
        'conditions' => [],
    ])->assertSessionHasNoErrors();

    app(DocumentRelease::class)->release($draft->refresh(), $admin);

    return $draft->refresh();
}

/** @param  array<string, string>  $options */
function takeBackOnInstruction(ApprovalDocument $document, array $options = []): int
{
    return Artisan::call('rimify:gutachten-zuruecknehmen', [
        'document' => $document->id,
        '--grund' => TAKE_BACK_REASON,
        '--anweisung' => TAKE_BACK_INSTRUCTION,
        '--konto' => 'super-admin@rimify.test',
        ...$options,
    ]);
}

it('takes the document and every row off the shop, and says who decided and why in the Protokoll', function (): void {
    $document = takeBackReleased();

    expect($document->status)->toBe(DocumentStatus::Published)
        ->and(Fitment::query()->where('approval_document_id', $document->id)->where('status', FitmentStatus::Published->value)->count())->toBe(1);

    expect(takeBackOnInstruction($document))->toBe(0)
        ->and(Artisan::output())->toContain('zurückgenommen: eine Zeile wieder Entwurf, nicht mehr im Shop.')
        ->and($document->refresh()->status)->toBe(DocumentStatus::Draft)
        ->and($document->valid_from)->toBeNull()
        ->and(Fitment::query()->where('approval_document_id', $document->id)->pluck('status')->map(static fn ($s) => $s instanceof FitmentStatus ? $s->value : $s)->all())->toBe([FitmentStatus::Draft->value])
        ->and(ApprovalDocument::query()->currentlyValid()->whereKey($document->id)->exists())->toBeFalse();

    $entry = AuditLog::query()->where('description', 'approval.taken_back')->sole();
    $sentence = app(AuditDescriber::class)->describe($entry)['sentence'];

    expect($entry->actor_email)->toBe('super-admin@rimify.test')
        ->and($entry->properties['reason'])->toBe(TAKE_BACK_REASON)
        ->and($entry->properties[DocumentRelease::ON_INSTRUCTION])->toBe(TAKE_BACK_INSTRUCTION)
        ->and($sentence)->toStartWith('Die Freigabe von „Teilegutachten TG-ZURUECK“ wurde zurückgenommen: Eine Zeile ist wieder Entwurf und nicht mehr im Shop. Grund: „'.rtrim(TAKE_BACK_REASON, '.').'“.')
        ->and($sentence)->toContain('Nicht im Browser geklickt: zurückgenommen auf schriftliche Anweisung des Betreibers für die Testumgebung (testing)');

    // Released again through the button's own checks once the entry is complete.
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    app(DocumentRelease::class)->release($document->refresh(), $admin);

    expect($document->refresh()->status)->toBe(DocumentStatus::Published);
});

it('refuses in the live shop and in an environment it does not know', function (string $environment): void {
    $document = takeBackReleased();
    app()->detectEnvironment(fn (): string => $environment);

    expect(takeBackOnInstruction($document))->toBe(1)
        ->and($document->refresh()->status)->toBe(DocumentStatus::Published)
        ->and(AuditLog::query()->where('description', 'approval.taken_back')->count())->toBe(0);
})->with(['production', 'prod']);

it('takes nothing back without a reason, without the instruction in words, or for an account without the right', function (): void {
    $document = takeBackReleased();

    expect(takeBackOnInstruction($document, ['--grund' => 'falsch']))->toBe(1)
        ->and(Artisan::output())->toContain('Grund')
        ->and(takeBackOnInstruction($document, ['--anweisung' => 'ok']))->toBe(1)
        ->and(Artisan::output())->toContain('schriftliche Anweisung')
        ->and(takeBackOnInstruction($document, ['--konto' => 'content-editor@rimify.test']))->toBe(1)
        ->and(Artisan::output())->toContain('Recht')
        ->and($document->refresh()->status)->toBe(DocumentStatus::Published);
});

it('takes back only a release', function (): void {
    $draft = ApprovalDocument::factory()->draft()->create(['report_number' => 'TG-ENTWURF']);

    expect(takeBackOnInstruction($draft))->toBe(1)
        ->and(Artisan::output())->toContain('Zurücknehmen lässt sich nur eine Freigabe');
});
