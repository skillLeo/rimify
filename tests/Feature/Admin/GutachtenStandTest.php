<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Models\DocumentSpeedDerating;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Support\EditStamp;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Tests\Support\Gutachten\EntryDriver;

/*
 * The admin audit's F-25 on a draft Gutachten (ADMIN-AUDIT.md): „Angaben“, „Zählung“, the table of tyre load at speed,
 * a car's lines and a code are each saved whole. A card opened before someone else's save would
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

/** @return array<string, mixed> */
function standTable(string $y240 = '100'): array
{
    return ['source_page' => 6, 'symbols' => ['V', 'W', 'Y'], 'rows' => [['speed_kmh' => 240, 'cells' => ['V' => '91', 'W' => '100', 'Y' => $y240]]]];
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

it('refuses a table saved from a page opened before the last one, and keeps that one', function (): void {
    $document = standDraft();
    $url = "/admin/gutachten/{$document->id}";
    $stale = standStamp($document, 'derating');

    $this->actingAs(standAdmin(), 'admin')->from($url)->put("{$url}/tragfaehigkeitstabelle", standTable('95'))->assertSessionHasNoErrors();
    $this->actingAs(standAdmin(), 'admin')->from($url)->withHeader(EditStamp::HEADER, $stale)->put("{$url}/tragfaehigkeitstabelle", standTable('85'))
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect(DocumentSpeedDerating::query()->where('approval_document_id', $document->id)->where('symbol', 'Y')->value('percent'))->toBe(95);
});

/** A car's lines as step 4 sends them: one tyre, one page. */
function standLines(string $tyre, int $page): array
{
    return ['lines' => [['id' => null, 'front' => $tyre, 'rear' => $tyre, 'kw' => '', 'codes' => []]], 'codes' => [], 'source_page' => $page];
}

it('refuses a car\'s lines saved from a form opened before their last save, and keeps that save', function (): void {
    $document = standDraft();
    $model = WheelModel::factory()->draft()->create(['is_demo' => false]);
    $size = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => WheelFinish::factory()->create(['wheel_model_id' => $model->id])->id]);
    $entry = EntryDriver::car(test(), standAdmin(), $document->id, Vehicle::factory()->create()->id, $size->id);
    $url = "/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}";
    $this->actingAs(standAdmin(), 'admin')->putJson($url, standLines('225/40 R18', 2))->assertOk();
    $stale = test()->actingAs(standAdmin(), 'admin')->getJson($url)->json('stamp');
    expect($stale)->toBeString()->not->toBe('');

    $this->actingAs(standAdmin(), 'admin')->putJson($url, standLines('225/40 R18', 5))->assertOk();
    $this->actingAs(standAdmin(), 'admin')->withHeader(EditStamp::HEADER, $stale)->putJson($url, standLines('235/35 R18', 9))
        ->assertUnprocessable()->assertJsonValidationErrors(['_stamp' => EditStamp::MESSAGE]);

    $row = Fitment::query()->where('approval_document_id', $document->id)->sole();
    expect($row->source_page)->toBe(5)
        ->and($row->tyreSizes()->pluck('width_mm')->all())->toBe([225]);

    // Opened after that save, the same form saves.
    $fresh = test()->actingAs(standAdmin(), 'admin')->getJson($url)->json('stamp');
    $this->actingAs(standAdmin(), 'admin')->withHeader(EditStamp::HEADER, $fresh)->putJson($url, standLines('225/40 R18', 9))->assertOk();
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
