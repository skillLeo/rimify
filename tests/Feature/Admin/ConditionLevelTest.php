<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\ConditionLevel;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCondition;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/*
 * The client's #23 in the admin (D-104): each Auflage of a Gutachten gets a level — chosen on a released document too,
 * because it changes the words and the colour, never the verdict — and an Abnahme or work on the body cannot be made a
 * Hinweis: the form says why, the model raises it, the database refuses it.
 */

beforeEach(function (): void {
    $this->seed([AccessSeeder::class, ReferenceDataSeeder::class]);
});

function levelAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

it('gives an Auflage written without a level the operator\'s default', function (): void {
    $note = DocumentCondition::factory()->create(['code' => 'A14']);
    $abnahme = DocumentCondition::factory()->kind(ConditionKind::Abnahme, 'Abnahme durch einen Prüfer.')->create(['code' => 'A01']);

    expect($note->refresh()->level)->toBe(ConditionLevel::Hinweis)
        ->and($abnahme->refresh()->level)->toBe(ConditionLevel::Auflage);
});

it('sets how loud an Auflage is on a released Gutachten, and writes it to the Protokoll', function (): void {
    $document = ApprovalDocument::factory()->create();
    $bolts = DocumentCondition::factory()->kind(ConditionKind::Befestigung, 'Nur mit den Radschrauben des Herstellers.')->create(['approval_document_id' => $document->id, 'code' => 'S03']);

    expect($bolts->refresh()->level)->toBe(ConditionLevel::Hinweis);

    $this->actingAs(levelAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/auflagen/{$bolts->id}/stufe", ['level' => 'auflage'])
        ->assertSessionHasNoErrors()->assertSessionHas('toast');

    expect($bolts->refresh()->level)->toBe(ConditionLevel::Auflage)
        ->and(AuditLog::query()->where('description', 'approval.condition_level_set')->exists())->toBeTrue();
});

it('refuses to make an Abnahme a Hinweis, and says why in one sentence', function (): void {
    $document = ApprovalDocument::factory()->create();
    $abnahme = DocumentCondition::factory()->kind(ConditionKind::Abnahme, 'Abnahme durch einen Prüfer.')->create(['approval_document_id' => $document->id, 'code' => 'A01']);

    $this->actingAs(levelAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/auflagen/{$abnahme->id}/stufe", ['level' => 'hinweis'])
        ->assertSessionHasErrorsIn('auflagen', ['level' => ConditionLevel::FLOOR_SENTENCE]);

    expect($abnahme->refresh()->level)->toBe(ConditionLevel::Auflage);
});

it('holds the floor in the database too', function (): void {
    $arch = DocumentCondition::factory()->kind(ConditionKind::Karosseriearbeit, 'Bördeln der Radläufe erforderlich.')->create(['code' => 'K1b']);

    expect(fn () => DB::table('document_conditions')->where('id', $arch->id)->update(['level' => 'hinweis']))->toThrow(QueryException::class);
});

it('lets only who may edit Gutachten choose a level', function (): void {
    $document = ApprovalDocument::factory()->create();
    $note = DocumentCondition::factory()->create(['approval_document_id' => $document->id, 'code' => 'A18']);

    $this->actingAs(levelAdmin('order-manager'), 'admin')->put("/admin/gutachten/{$document->id}/auflagen/{$note->id}/stufe", ['level' => 'auflage'])
        ->assertForbidden();
    expect($note->refresh()->level)->toBe(ConditionLevel::Hinweis);
});

it('shows each Auflage\'s level, its floor and the one sentence on the Gutachten', function (): void {
    $document = ApprovalDocument::factory()->create();
    DocumentCondition::factory()->kind(ConditionKind::Abnahme, 'Abnahme durch einen Prüfer.')->create(['approval_document_id' => $document->id, 'code' => 'A01']);

    $this->actingAs(levelAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('can.levels', true)
            ->where('conditions.0.level', 'auflage')
            ->where('conditions.0.levelFloor', 'auflage')
            ->where('levelFloorSentence', ConditionLevel::FLOOR_SENTENCE)
            ->has('levels', 3));
});
