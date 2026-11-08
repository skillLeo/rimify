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
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\Approvals\ReleaseDeclaration;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\Support\Gutachten\EntryDriver;

/*
 * Would today's release (D-227, D-228) have stopped the client's release of 10.10.2026 19:27? His Teilegutachten
 * 1810080716 as he entered it — two rows on the rear axle, one tyre size, one code („0“, a Hinweis), no Abnahme, a wheel
 * without a tested load — against what its PDF prints for his car (6 codes, 3 tyre sizes, an Abnahme on every
 * combination, „nur für Fahrzeuge mit maximaler Achslast 1160 kg“).
 *
 * Evidence for ADMIN-GEFUNDEN 511: the check compares two numbers the releaser types himself, so an honest count stops
 * the release and a count copied off his own entry passes. The refusal's four sentences are the standard the operator
 * set (16.10.2026) — kept word for word here, whatever the admin round changes around them.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function hisEntry(): ApprovalDocument
{
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716']);
    DocumentCondition::factory()->kind(ConditionKind::Hinweis, 'Nur mit dem BBS-Zubehörsatz T.Nr. 09.31.149.')->create(['approval_document_id' => $document->id, 'code' => '0']);
    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'LeMans']);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $size = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0, 'max_load_kg' => null]);

    EntryDriver::enter(test(), $admin, $document->id, [
        'vehicle_ids' => Vehicle::factory()->count(2)->create()->pluck('id')->all(), 'config_ids' => [$size->id], 'axle' => 'REAR', 'entry_note' => '', 'source_page' => 1,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'REAR', 'codes' => []]],
        'conditions' => [['code' => '0', 'note' => null]],
    ]);

    return $document->refresh();
}

it('refuses his release on the Abnahme his entry misses — the count and the axle limit no longer asked (D-440, D-441)', function (): void {
    $document = hisEntry();
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    expect(app(DocumentRelease::class)->entered($document))->toMatchArray(['codes' => 1, 'sizes' => 1, 'withoutLoad' => 1, 'withAbnahme' => 0, 'withoutAbnahme' => 2]);

    $message = '';

    try {
        app(DocumentRelease::class)->release($document, $admin, declaration: new ReleaseDeclaration('partial', 'Anlagen außer BMW15', abnahme: ReleaseDeclaration::ABNAHME_ALL));
    } catch (ValidationException $e) {
        $message = (string) ($e->errors()['release'][0] ?? '');
    }

    // The client's round of 08.11.2026, §3: what the codes and sizes were counted against, and the declared limit, are his to leave
    // out; the Abnahme stays asked and compared.
    expect($message)->toBe('Noch nicht freigebbar: Der Verwendungsbereich verlangt bei jeder Kombination eine Abnahme, aber bei 2 Zeilen fehlt sie. Erfass den Code, der sie verlangt.')
        ->and($document->refresh()->status->value)->toBe('draft');
});

it('lets it through when he declares what he entered rather than what the PDF prints', function (): void {
    $document = hisEntry();
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    app(DocumentRelease::class)->release($document, $admin, declaration: new ReleaseDeclaration('complete', null, abnahme: ReleaseDeclaration::ABNAHME_NONE));

    expect($document->refresh()->status->value)->toBe('published');
});
