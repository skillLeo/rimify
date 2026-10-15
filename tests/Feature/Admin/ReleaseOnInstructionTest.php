<?php

declare(strict_types=1);

use App\Enums\DocumentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\AuditDescriber;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Artisan;

/**
 * `rimify:gutachten-freigeben`: on a test environment the operator may give a release in writing and have it carried
 * out from the command line. The Protokoll then says who decided and that nobody clicked; the live shop refuses the
 * command, and the preflight refuses a database that holds such a release.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

const RELEASE_INSTRUCTION = 'Schriftliche Anweisung des Betreibers vom 01.10.2026: diese drei Gutachten auf Staging freigeben, Feldvergleich lag vor.';

function instructionAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A draft with one row the button could release. */
function releasableDraft(): ApprovalDocument
{
    $vehicle = Vehicle::factory()->create();
    $model = WheelModel::factory()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0, 'width_in' => 8.0, 'et_mm' => 35]);
    $draft = ApprovalDocument::factory()->draft()->create(['report_number' => 'TG-ANWEISUNG', 'issued_on' => '2025-05-01']);

    test()->actingAs(instructionAdmin(), 'admin')->post("/admin/gutachten/{$draft->id}/zeilen", [
        'vehicle_ids' => [$vehicle->id],
        'config_ids' => [$config->id],
        'axle' => 'ALL',
        'entry_note' => '',
        'source_page' => 3,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL', 'codes' => []]],
        'conditions' => [],
    ])->assertSessionHasNoErrors();

    return $draft->refresh();
}

/**
 * The declaration matches releasableDraft(): one size, no code, no limit, no Abnahme (D-227, D-228).
 *
 * @param  array<string, string>  $options
 */
function releaseOnInstruction(ApprovalDocument $document, array $options = []): int
{
    return Artisan::call('rimify:gutachten-freigeben', [
        'document' => $document->id,
        '--anweisung' => RELEASE_INSTRUCTION,
        '--konto' => 'super-admin@rimify.test',
        '--erfasst' => 'alle',
        '--codes' => '0',
        '--groessen' => '1',
        '--abnahme' => 'keine',
        ...$options,
    ]);
}

it('releases a draft on the written instruction and says so in the Protokoll, in words', function (): void {
    $draft = releasableDraft();

    expect(releaseOnInstruction($draft))->toBe(0)
        ->and(Artisan::output())->toContain('1 Zeile im Shop')
        ->and($draft->refresh()->status)->toBe(DocumentStatus::Published);

    $entry = AuditLog::query()->where('description', 'approval.released')->sole();
    $sentence = app(AuditDescriber::class)->describe($entry)['sentence'];

    expect($entry->properties[DocumentRelease::ON_INSTRUCTION])->toBe(RELEASE_INSTRUCTION)
        ->and($entry->properties['environment'])->toBe('testing')
        ->and($entry->actor_email)->toBe('super-admin@rimify.test')
        ->and($sentence)->toContain('Nicht im Browser geklickt: freigegeben auf schriftliche Anweisung des Betreibers für die Testumgebung (testing), über die Kommandozeile.')
        ->and($sentence)->toContain('„'.RELEASE_INSTRUCTION.'“');
});

it('refuses in the live shop, where every release is pressed in the browser', function (): void {
    $draft = releasableDraft();
    app()->detectEnvironment(fn (): string => 'production');

    expect(releaseOnInstruction($draft))->toBe(1)
        ->and(Artisan::output())->toContain('Im Live-Shop gibt jede Freigabe eine Person im Browser')
        ->and($draft->refresh()->status)->toBe(DocumentStatus::Draft);
});

it('refuses an environment it does not know, rather than treating it as a test', function (): void {
    $draft = releasableDraft();
    app()->detectEnvironment(fn (): string => 'prod');

    expect(releaseOnInstruction($draft))->toBe(1)
        ->and($draft->refresh()->status)->toBe(DocumentStatus::Draft);
});

it('releases nothing without the instruction in words, or for an account without the right', function (): void {
    $draft = releasableDraft();

    expect(releaseOnInstruction($draft, ['--anweisung' => 'ok']))->toBe(1)
        ->and(Artisan::output())->toContain('schriftliche Anweisung')
        ->and(releaseOnInstruction($draft, ['--konto' => 'content-editor@rimify.test']))->toBe(1)
        ->and(Artisan::output())->toContain('Recht')
        ->and($draft->refresh()->status)->toBe(DocumentStatus::Draft)
        ->and(AuditLog::query()->where('description', 'approval.released')->count())->toBe(0);
});

it('releases nothing without the completeness answer, or on counts the entry does not match (D-227, D-228)', function (): void {
    $draft = releasableDraft();

    expect(releaseOnInstruction($draft, ['--erfasst' => '']))->toBe(1)
        ->and(Artisan::output())->toContain('--erfasst=alle, teilweise oder unbekannt');

    // The client's Teilegutachten as it was entered against what its Verwendungsbereich prints (brief of 14.10.2026, §4).
    expect(releaseOnInstruction($draft, ['--groessen' => '3', '--codes' => '6', '--abnahme' => 'alle', '--achslast' => '1160']))->toBe(1);
    $said = Artisan::output();

    expect($said)->toContain('Auflagen-Codes für die erfassten Fahrzeuge laut Verwendungsbereich: 6, erfasst: 0.')
        ->and($said)->toContain('Reifengrößen für die erfassten Fahrzeuge laut Verwendungsbereich: 3, erfasst: 1.')
        ->and($said)->toContain('Der Verwendungsbereich begrenzt die Achslast auf '.GermanFormat::kilograms(1160).'.')
        ->and($said)->toContain('trag höchstens '.GermanFormat::kilograms(580).' je Rad ein')
        ->and($said)->toContain('Der Verwendungsbereich verlangt bei jeder Kombination eine Abnahme, aber bei einer Zeile fehlt sie.')
        ->and($draft->refresh()->status)->toBe(DocumentStatus::Draft);
});

it('stops where the button stops, with the same sentences', function (): void {
    $draft = ApprovalDocument::factory()->draft()->create(['report_number' => 'TG-LEER']);

    expect(releaseOnInstruction($draft))->toBe(1)
        ->and(Artisan::output())->toContain('Es gibt noch keine Zeile im Verwendungsbereich.')
        ->and($draft->refresh()->status)->toBe(DocumentStatus::Draft);
});

it('tells the preflight: allowed on a test environment, NO-GO in the live shop', function (): void {
    releaseOnInstruction(releasableDraft());

    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('eine Freigabe auf Anweisung über die Kommandozeile, in der Testumgebung zulässig');

    app()->detectEnvironment(fn (): string => 'production');
    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('eine Freigabe auf Anweisung über die Kommandozeile – im Live-Shop gibt jede Freigabe eine Person im Browser')
        ->assertFailed();
});

it('describes a released base without rows as what it is', function (): void {
    $entry = (new AuditLog)->forceFill(['description' => 'approval.released', 'properties' => ['document' => 'ABE 53841', 'rows' => 0, 'conflicts' => 0]]);

    expect(app(AuditDescriber::class)->describe($entry)['sentence'])->toBe('Das Dokument „ABE 53841“ wurde freigegeben: Der Shop übernimmt seine Angaben für seine Nachträge.');
});
