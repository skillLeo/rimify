<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCondition;
use App\Services\Admin\Approvals\DocumentRelease;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * The operator's review of C9 held every load-index Auflage to twice the capacity of its index; since D-481 nothing about a
 * tyre is measured against ETRTO's table, and D-483 took that check out of the page and the release. And since D-459 (the client's review of 11.11.2026, C) no
 * Gutachten keeps a table of tyre load at speed of its own: the way to type one is gone, the page sends none, and a paper that
 * prints one is released without it — the shop reads ETRTO's.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function tabelleAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function tabelleDraft(): ApprovalDocument
{
    return ApprovalDocument::query()->create([
        'kind' => 'ABE', 'kba_number' => '55255', 'issuer' => 'Kraftfahrt-Bundesamt', 'revision' => 1,
        'page_count' => 13, 'status' => 'draft',
    ]);
}

it('has no way left to type a table of tyre load at speed, and sends none to the page (D-459)', function (): void {
    $document = tabelleDraft();

    // Gone: no route takes it — 404, or 405 where another route claims the address for other methods. Nothing is saved.
    $gone = $this->actingAs(tabelleAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/tragfaehigkeitstabelle", ['symbols' => ['V'], 'rows' => []]);
    expect($gone->status())->toBeIn([404, 405]);
    $this->actingAs(tabelleAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->missing('derating')->missing('stamps.derating')->has('stamps.document'));
});

it('releases a paper that prints a table of tyre load at speed without one typed: the door asks for none (D-459)', function (): void {
    $document = tabelleDraft();
    $document->forceFill(['tyre_index_source' => TyreIndexSource::Table->value])->save();

    expect(app(DocumentRelease::class)->check($document))->not->toContain('Laut den Angaben druckt das Gutachten eine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit, erfasst ist sie nicht. Trag sie ein oder ändere die Angabe.')
        ->and(implode(' ', app(DocumentRelease::class)->check($document)))->not->toContain('Tabelle');
});

it('keeps a load-index limit as the document prints it, and neither warns nor holds the release over its kilograms (D-483)', function (): void {
    $document = tabelleDraft();
    $entry = ['code' => 'T88', 'kind' => ConditionKind::ReifenTragfaehigkeit->value, 'text_de' => 'Reifen mit Tragfähigkeitsindex 88 sind nur bis zu einer zulässigen Achslast von 1.125 kg zulässig.', 'source_page' => 6, 'max_axle_load_kg' => 1125];

    // The document always wins: the figure is stored as printed, never refused.
    $this->actingAs(tabelleAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", $entry)->assertSessionHasNoErrors();
    $condition = DocumentCondition::query()->where('approval_document_id', $document->id)->where('code', 'T88')->sole();

    expect($condition->max_axle_load_kg)->toBe(1125);

    // 1.125 kg is not twice the capacity of index 88 (1.120 kg). Until D-483 that was a warning and a release blocker;
    // since D-481 nothing about a tyre is measured against ETRTO's table, so the page and the door say nothing of it.
    $this->actingAs(tabelleAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page->missing('conditions.0.limitWarning')->missing('conditions.0.limitConfirmed'));

    expect(implode(' ', app(DocumentRelease::class)->check($document)))->not->toContain('T88')
        ->and(implode(' ', app(DocumentRelease::class)->check($document)))->not->toContain('Tragfähigkeitsindex');

    // The way to confirm such a figure is gone with the check: no route takes it, nothing is written.
    $gone = $this->actingAs(tabelleAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen/{$condition->id}/grenze", ['reason' => 'So steht es auf Seite 6 des Gutachtens.']);

    expect($gone->status())->toBeIn([404, 405])
        ->and($condition->refresh()->limit_confirmed_at)->toBeNull()
        ->and(AuditLog::query()->where('description', 'approval.limit_confirmed')->exists())->toBeFalse();
});
