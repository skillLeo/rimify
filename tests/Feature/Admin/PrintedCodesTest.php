<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/*
 * The client's item 8 (ADMIN-GEFUNDEN 514): BBS's Teilegutachten prints its codes with a closing bracket — `0)`, `R)`,
 * `13)`, `16a)` — and the form told him to type codes as the document prints them, while the rule refused exactly those.
 * Typed as printed, a code is now the code without the bracket, in the Auflagenverzeichnis, in the pasted legend and on
 * a row, so the row finds its sentence.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function printedAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

it('drops the printed bracket and nothing else', function (): void {
    expect(DocumentConditions::normaliseCode('16a)'))->toBe('16a')
        ->and(DocumentConditions::normaliseCode(" R\u{00A0}) "))->toBe('R')
        ->and(DocumentConditions::normaliseCode('Nicht  330D'))->toBe('Nicht 330D')
        ->and(DocumentConditions::normaliseCode('A01'))->toBe('A01')
        ->and(DocumentConditions::normaliseCode(null))->toBeNull();
});

it('takes his codes as printed — in the Auflagenverzeichnis, from a pasted legend and on a row — and the row finds its sentence @admin-208', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716', 'page_count' => 8]);

    $this->actingAs(printedAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", [
        'code' => '0)', 'kind' => ConditionKind::Hinweis->value, 'text_de' => 'Radanbau nur zulässig in Verbindung mit BBS-Zubehörsatz T.Nr. 09.31.149.', 'source_page' => 3,
    ])->assertSessionHasNoErrors();

    $this->actingAs(printedAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen/stapel", ['entries' => [
        ['code' => 'R)', 'kind' => ConditionKind::Hinweis->value, 'text_de' => 'Es sind vorn und hinten nur Reifen eines Herstellers und Typs zulässig.', 'source_page' => 3],
        ['code' => '16a)', 'kind' => ConditionKind::Hinweis->value, 'text_de' => 'Die Radabdeckung ist zu prüfen.', 'source_page' => 3],
    ]])->assertSessionHasNoErrors();

    expect(DocumentCondition::query()->where('approval_document_id', $document->id)->orderBy('code')->pluck('code')->all())->toBe(['0', '16a', 'R']);

    $model = WheelModel::factory()->draft()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $size = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id]);

    $this->actingAs(printedAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", [
        'vehicle_ids' => [Vehicle::factory()->create()->id], 'config_ids' => [$size->id], 'axle' => 'FRONT', 'entry_note' => '', 'source_page' => 2,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'FRONT', 'codes' => ['16a)']]],
        'conditions' => [['code' => '0)', 'note' => null], ['code' => 'R)', 'note' => null]],
    ])->assertSessionHasNoErrors();

    $row = DB::table('fitments')->where('approval_document_id', $document->id)->value('id');
    expect(DB::table('fitment_conditions')->where('fitment_id', $row)->orderBy('code')->pluck('code')->all())->toBe(['0', 'R'])
        ->and(DocumentConditions::unresolvedIn($document))->toBe([]);
});
