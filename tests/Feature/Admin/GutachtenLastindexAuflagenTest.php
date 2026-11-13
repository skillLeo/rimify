<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCondition;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\Approvals\LoadLimitCheck;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * The operator's review of C9: every load-index Auflage is exactly twice the capacity of its index — refused where it is
 * typed when it is not, and checked over every document there is. And since D-459 (the client's review of 11.11.2026, C) no
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

it('keeps a load-index limit as the document prints it, warns, and blocks the release until it is confirmed with a reason', function (): void {
    $document = tabelleDraft();
    $entry = ['code' => 'T88', 'kind' => ConditionKind::ReifenTragfaehigkeit->value, 'text_de' => 'Reifen mit Tragfähigkeitsindex 88 sind nur bis zu einer zulässigen Achslast von 1.125 kg zulässig.', 'source_page' => 6, 'max_axle_load_kg' => 1125];

    // The document always wins: the figure is stored as printed, never refused.
    $this->actingAs(tabelleAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", $entry)->assertSessionHasNoErrors();
    $condition = DocumentCondition::query()->where('approval_document_id', $document->id)->where('code', 'T88')->sole();

    expect($condition->max_axle_load_kg)->toBe(1125);

    // Said on the record, in words …
    $warning = "T88 steht für Tragfähigkeitsindex 88: das wären 2 × 560\u{00A0}kg = 1.120\u{00A0}kg, eingetragen sind 1.125\u{00A0}kg. Stimmt die Zahl mit dem Gutachten überein, bestätige sie mit einem Satz.";
    $this->actingAs(tabelleAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page->where('conditions.0.limitWarning', $warning)->where('conditions.0.limitConfirmed', null));

    // … and the release waits for it.
    expect(app(DocumentRelease::class)->check($document))->toContain('Die Achslast bei T88 passt nicht zum Tragfähigkeitsindex. Bestätige die Zahl im Auflagenverzeichnis mit einem Satz.');

    // A reason is needed, a sentence long; a role that may only look cannot give one.
    $url = "/admin/gutachten/{$document->id}/auflagen/{$condition->id}/grenze";
    $this->actingAs(tabelleAdmin(), 'admin')->post($url, ['reason' => 'kurz'])->assertSessionHasErrorsIn('auflagen', ['reason']);
    $this->actingAs(tabelleAdmin('support-agent'), 'admin')->post($url, ['reason' => 'So steht es auf Seite 6 des Gutachtens.'])->assertForbidden();

    $this->actingAs(tabelleAdmin(), 'admin')->post($url, ['reason' => 'So steht es auf Seite 6 des Gutachtens, geprüft am PDF.'])
        ->assertSessionHasNoErrors()->assertSessionHas('toast', 'Zahl bestätigt.');

    expect(app(DocumentRelease::class)->check($document))->not->toContain('Die Achslast bei T88 passt nicht zum Tragfähigkeitsindex. Bestätige die Zahl im Auflagenverzeichnis mit einem Satz.')
        ->and(AuditLog::query()->where('description', 'approval.limit_confirmed')->exists())->toBeTrue();

    // Sent twice (a double click, a second tab): confirmed once, one Protokoll entry, the first reason kept.
    $this->actingAs(tabelleAdmin(), 'admin')->post($url, ['reason' => 'Ein zweiter Klick mit einem anderen Satz.'])
        ->assertSessionHasNoErrors()->assertSessionHas('toast', 'Die Zahl war schon bestätigt.');

    expect(AuditLog::query()->where('description', 'approval.limit_confirmed')->count())->toBe(1)
        ->and($condition->refresh()->limit_confirmed_reason)->toBe('So steht es auf Seite 6 des Gutachtens, geprüft am PDF.');

    $this->actingAs(tabelleAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page->where('conditions.0.limitConfirmed.reason', 'So steht es auf Seite 6 des Gutachtens, geprüft am PDF.'));

    // New kilograms ask again.
    $this->actingAs(tabelleAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/auflagen/{$condition->id}", ['max_axle_load_kg' => 1126] + $entry)->assertSessionHasNoErrors();

    expect($condition->refresh()->limit_confirmed_at)->toBeNull();
});

it('checks only codes that name a load index — an axle-load note is never measured against the table', function (): void {
    $document = tabelleDraft();

    // ABE 55255's code 140: 1.400 kg — no load index at all. Stored without a warning, and no blocker.
    $this->actingAs(tabelleAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen/stapel", ['entries' => [
        ['code' => '140', 'kind' => ConditionKind::ReifenTragfaehigkeit->value, 'text_de' => 'Das Sonderrad ist in Verbindung mit dieser Reifengröße nur bis zu einer zulässigen Achslast von 1.400 kg zulässig.', 'max_axle_load_kg' => 1400],
    ]])->assertSessionHasNoErrors();

    $condition = DocumentCondition::query()->where('approval_document_id', $document->id)->where('code', '140')->sole();

    expect(app(LoadLimitCheck::class)->warningFor($condition))->toBeNull()
        ->and(app(LoadLimitCheck::class)->unconfirmedIn($document))->toBe([]);
});
it('finds every load-index Auflage of every document exactly twice the capacity of its index', function (): void {
    // The free cross-check, over whatever the database holds: it fails loudly the day a limit is mistyped.
    $check = app(LoadLimitCheck::class);
    $checked = 0;

    foreach (DocumentCondition::query()->where('kind', ConditionKind::ReifenTragfaehigkeit->value)->whereNotNull('max_axle_load_kg')->get() as $condition) {
        $kg = (int) $condition->max_axle_load_kg;

        // A load-index code whose figure differs stands only with a person's written reason.
        expect($check->problem($condition->code, $kg) === null || $condition->limit_confirmed_reason !== null)->toBeTrue("{$condition->code} = {$kg} kg");

        $checked++;
    }

    // And over the fourteen codes of ABE 55255, which every future document is measured against.
    foreach (['T84' => 1000, 'T85' => 1030, 'T87' => 1090, 'T88' => 1120, 'T89' => 1160, 'T91' => 1230, 'T92' => 1260,
        'T93' => 1300, 'T94' => 1340, 'T95' => 1380, 'T96' => 1420, 'T98' => 1500, 'T99' => 1550, 'T00' => 1600] as $code => $kg) {
        expect($check->problem($code, $kg))->toBeNull("{$code} = {$kg} kg");
        $checked++;
    }

    expect($checked)->toBeGreaterThanOrEqual(14);
});
