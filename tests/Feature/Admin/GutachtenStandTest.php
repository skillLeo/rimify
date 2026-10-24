<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Models\DocumentSpeedDerating;
use App\Models\DocumentTyreCombination;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\CountFigures;
use App\Support\EditStamp;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;

/*
 * The admin audit's F-25 on a draft Gutachten (ADMIN-AUDIT.md): „Angaben“, „Zählung“, the table of tyre load at speed,
 * the Bereifungskombinationen, a row and a code are each saved whole. A card opened before someone else's save would
 * put the old values back; it is refused in a sentence instead, and the other save stands.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function standAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

function standDraft(): ApprovalDocument
{
    return ApprovalDocument::factory()->draft()->create(['kind' => 'ABE', 'kba_number' => '55255', 'page_count' => 13]);
}

/** The stamp the page gives one of its cards. */
function standStamp(ApprovalDocument $document, string $card): string
{
    $stamp = test()->actingAs(standAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->viewData('page')['props']['stamps'][$card] ?? null;
    expect($stamp)->toBeString()->not->toBe('');

    return (string) $stamp;
}

/** @return array<string, int|string|null> */
function standCount(array $overrides = []): array
{
    return $overrides + ['codes' => 6, 'codes_page' => 3, 'sizes' => 3, 'sizes_page' => 3, 'axle_limit_kg' => null, 'axle_limit_page' => null, 'abnahme' => 'none', 'abnahme_page' => null];
}

/** @return array<string, mixed> */
function standTable(string $y240 = '100'): array
{
    return ['source_page' => 6, 'symbols' => ['V', 'W', 'Y'], 'rows' => [['speed_kmh' => 240, 'cells' => ['V' => '91', 'W' => '100', 'Y' => $y240]]]];
}

/** @return array<string, mixed> */
function standCombinations(string $rear = '245/35 R18'): array
{
    return ['source_page' => 4, 'combinations' => [['number' => 1, 'front' => '225/40 R18', 'rear' => $rear]]];
}

it('refuses „Angaben“ saved from a page opened before the last save, and keeps that save', function (): void {
    $document = standDraft();
    $url = "/admin/gutachten/{$document->id}";
    $stale = standStamp($document, 'document');

    $this->actingAs(standAdmin(), 'admin')->from($url)->put($url, ['kind' => 'ABE', 'kba_number' => '55256', 'tyre_index_source' => ''])->assertSessionHasNoErrors();
    $this->actingAs(standAdmin(), 'admin')->from($url)->withHeader(EditStamp::HEADER, $stale)
        ->put($url, ['kind' => 'ABE', 'kba_number' => '55299', 'tyre_index_source' => ''])
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect($document->refresh()->kba_number)->toBe('55256');
});

it('refuses a „Zählung“ saved from a page opened before the last one, and keeps that one', function (): void {
    $document = standDraft();
    $url = "/admin/gutachten/{$document->id}";
    $this->actingAs(standAdmin(), 'admin')->post("{$url}/zaehlung", standCount())->assertSessionHasNoErrors();
    $stale = standStamp($document, 'document');

    $this->actingAs(standAdmin(), 'admin')->from($url)->post("{$url}/zaehlung", standCount(['codes' => 5]))->assertSessionHasNoErrors();
    $this->actingAs(standAdmin(), 'admin')->from($url)->withHeader(EditStamp::HEADER, $stale)->post("{$url}/zaehlung", standCount(['codes' => 7]))
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect(CountFigures::of($document->refresh())?->codes)->toBe(5);
});

it('refuses a table saved from a page opened before the last one, and keeps that one', function (): void {
    $document = standDraft();
    $url = "/admin/gutachten/{$document->id}";
    $stale = standStamp($document, 'derating');

    $this->actingAs(standAdmin(), 'admin')->from($url)->put("{$url}/tragfaehigkeitstabelle", standTable('95'))->assertSessionHasNoErrors();
    $this->actingAs(standAdmin(), 'admin')->from($url)->withHeader(EditStamp::HEADER, $stale)->put("{$url}/tragfaehigkeitstabelle", standTable('85'))
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect(DocumentSpeedDerating::query()->where('approval_document_id', $document->id)->where('symbol', 'Y')->value('percent'))->toBe(95);
});

/** A draft's row as the form sends it: one tyre size, one page — the rest as given. */
function standRow(array $override = []): array
{
    return array_replace([
        'axle' => 'ALL',
        'entry_note' => '',
        'source_page' => 2,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL']],
        'conditions' => [],
    ], $override);
}

it('refuses „Zeile ändern“ saved from a page opened before the last save of that row, and keeps that save', function (): void {
    $document = standDraft();
    $url = "/admin/gutachten/{$document->id}";
    $model = WheelModel::factory()->draft()->create(['is_demo' => false]);
    $size = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id]);
    $this->actingAs(standAdmin(), 'admin')->post("{$url}/zeilen", standRow(['vehicle_ids' => [Vehicle::factory()->create()->id], 'config_ids' => [$size->id]]))->assertSessionHasNoErrors();
    $row = Fitment::query()->where('approval_document_id', $document->id)->sole();
    $stale = collect(test()->actingAs(standAdmin(), 'admin')->get($url)->viewData('page')['props']['rows'])->firstWhere('id', $row->id)['stamp'] ?? null;
    expect($stale)->toBeString()->not->toBe('');

    $this->actingAs(standAdmin(), 'admin')->from($url)->put("{$url}/zeilen/{$row->id}", standRow(['source_page' => 5]))->assertSessionHasNoErrors();
    $this->actingAs(standAdmin(), 'admin')->from($url)->withHeader(EditStamp::HEADER, $stale)
        ->put("{$url}/zeilen/{$row->id}", standRow(['source_page' => 9, 'tyre_sizes' => [['width_mm' => 235, 'aspect' => 35, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL']]]))
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    $row->refresh();
    expect($row->source_page)->toBe(5)
        ->and($row->tyreSizes()->pluck('width_mm')->all())->toBe([225]);

    // Opened after that save, the same form saves.
    $fresh = collect(test()->actingAs(standAdmin(), 'admin')->get($url)->viewData('page')['props']['rows'])->firstWhere('id', $row->id)['stamp'];
    $this->actingAs(standAdmin(), 'admin')->from($url)->withHeader(EditStamp::HEADER, $fresh)->put("{$url}/zeilen/{$row->id}", standRow(['source_page' => 9]))->assertSessionHasNoErrors();
    expect($row->refresh()->source_page)->toBe(9);
});

it('refuses a code saved from a page opened before the last save of that code, and keeps that save', function (): void {
    $document = standDraft();
    $url = "/admin/gutachten/{$document->id}";
    $this->actingAs(standAdmin(), 'admin')->post("{$url}/auflagen", ['code' => 'A01', 'kind' => 'hinweis', 'text_de' => 'Radschrauben nach 50 km nachziehen.', 'source_page' => 3])->assertSessionHasNoErrors();
    $condition = DocumentCondition::query()->where('approval_document_id', $document->id)->sole();
    $stale = collect(test()->actingAs(standAdmin(), 'admin')->get($url)->viewData('page')['props']['conditions'])->firstWhere('id', $condition->id)['stamp'] ?? null;
    expect($stale)->toBeString()->not->toBe('');

    $this->actingAs(standAdmin(), 'admin')->from($url)->put("{$url}/auflagen/{$condition->id}", ['code' => 'A01', 'kind' => 'hinweis', 'text_de' => 'Radschrauben nach 50 km mit dem Drehmoment des Herstellers nachziehen.', 'source_page' => 3])->assertSessionHasNoErrors();
    $this->actingAs(standAdmin(), 'admin')->from($url)->withHeader(EditStamp::HEADER, $stale)
        ->put("{$url}/auflagen/{$condition->id}", ['code' => 'A01', 'kind' => 'hinweis', 'text_de' => 'Radschrauben nachziehen.', 'source_page' => 4])
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect($condition->refresh()->text_de)->toBe('Radschrauben nach 50 km mit dem Drehmoment des Herstellers nachziehen.')
        ->and($condition->source_page)->toBe(3);
});

it('refuses Bereifungskombinationen saved from a page opened before the last save, and keeps that save', function (): void {
    $document = standDraft();
    $url = "/admin/gutachten/{$document->id}";
    $stale = standStamp($document, 'combinations');

    $this->actingAs(standAdmin(), 'admin')->from($url)->put("{$url}/bereifungskombinationen", standCombinations('255/35 R18'))->assertSessionHasNoErrors();
    $this->actingAs(standAdmin(), 'admin')->from($url)->withHeader(EditStamp::HEADER, $stale)->put("{$url}/bereifungskombinationen", standCombinations('265/35 R18'))
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect(DocumentTyreCombination::query()->where('approval_document_id', $document->id)->value('rear_width_mm'))->toBe(255);
});
