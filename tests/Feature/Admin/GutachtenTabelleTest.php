<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCondition;
use App\Models\DocumentSpeedDerating;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\Approvals\LoadLimitCheck;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * The operator's review of C9: a Gutachten's table of tyre load at speed is its own data, typed from its
 * PDF; and every load-index Auflage is exactly twice the capacity of its index — refused where it is typed
 * when it is not, and checked over every document there is.
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

/** ABE 55255, page 6, as the grid sends it. */
function tabellePayload(): array
{
    return [
        'source_page' => 6,
        'symbols' => ['V', 'W', 'Y'],
        'rows' => [
            ['speed_kmh' => 240, 'cells' => ['V' => '91', 'W' => '100', 'Y' => '100 %']],
            ['speed_kmh' => 250, 'cells' => ['V' => '–', 'W' => '95', 'Y' => '100']],
            ['speed_kmh' => 280, 'cells' => ['V' => '-', 'W' => '–', 'Y' => '95']],
            ['speed_kmh' => 300, 'cells' => ['V' => '', 'W' => '', 'Y' => '85']],
        ],
    ];
}

it('saves the table as typed — a share, a „–“ as not permitted, an empty cell as not said — and records it', function (): void {
    $document = tabelleDraft();

    $this->actingAs(tabelleAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/tragfaehigkeitstabelle", tabellePayload())
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Tabelle gespeichert.');

    $cells = DocumentSpeedDerating::query()->where('approval_document_id', $document->id)->get()
        ->mapWithKeys(static fn (DocumentSpeedDerating $c): array => [$c->speed_kmh.$c->symbol => $c->percent])->all();

    expect($cells)->toBe([
        '240V' => 91, '240W' => 100, '240Y' => 100,
        '250V' => null, '250W' => 95, '250Y' => 100,
        '280V' => null, '280W' => null, '280Y' => 95,
        '300Y' => 85,
    ])
        ->and(DocumentSpeedDerating::query()->where('approval_document_id', $document->id)->value('source_page'))->toBe(6)
        ->and(AuditLog::query()->where('description', 'approval.derating_saved')->exists())->toBeTrue();

    // The record page shows it back as typed.
    $this->actingAs(tabelleAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('derating.sourcePage', 6)
            ->where('derating.symbols', ['V', 'W', 'Y'])
            ->where('derating.rows.1', ['speed' => 250, 'cells' => ['V' => '–', 'W' => '95', 'Y' => '100']])
            ->where('derating.rows.3', ['speed' => 300, 'cells' => ['Y' => '85']])
        );

    // Saving nothing takes the table away.
    $this->actingAs(tabelleAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/tragfaehigkeitstabelle", ['symbols' => ['V', 'W', 'Y'], 'rows' => []])
        ->assertSessionHas('toast', 'Tabelle entfernt.');

    expect(DocumentSpeedDerating::query()->where('approval_document_id', $document->id)->count())->toBe(0);
});

it('says on the record when a table came from the demo seed, and forgets that once a person types it from the PDF', function (): void {
    $document = tabelleDraft();
    DocumentSpeedDerating::query()->create([
        'approval_document_id' => $document->id, 'speed_kmh' => 250, 'symbol' => 'W', 'percent' => 95,
        'seeded_from' => 'Demo-Seed: Tabelle der ABE 55255, Seite 6',
    ]);

    $this->actingAs(tabelleAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page->where('derating.seededFrom', 'Demo-Seed: Tabelle der ABE 55255, Seite 6'));

    $this->actingAs(tabelleAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/tragfaehigkeitstabelle", tabellePayload())
        ->assertSessionHasNoErrors();

    expect(DocumentSpeedDerating::query()->where('approval_document_id', $document->id)->whereNotNull('seeded_from')->count())->toBe(0);

    $this->actingAs(tabelleAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page->where('derating.seededFrom', null)->where('derating.sourcePage', 6));
});

it('refuses a cell that is not a share, a „–“ or empty, and a speed twice, in words', function (): void {
    $document = tabelleDraft();
    $payload = tabellePayload();
    $payload['rows'][0]['cells']['V'] = '120';
    $payload['rows'][1]['cells']['W'] = 'abc';
    $payload['rows'][3]['speed_kmh'] = 240;

    $this->actingAs(tabelleAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/tragfaehigkeitstabelle", $payload)
        ->assertSessionHasErrorsIn('tabelle', [
            'rows.0.cells.V' => 'Bitte eine Zahl von 1 bis 100, „–“ oder nichts.',
            'rows.1.cells.W' => 'Bitte eine Zahl von 1 bis 100, „–“ oder nichts.',
            'rows.3.speed_kmh' => 'Diese Geschwindigkeit steht zweimal in der Tabelle.',
        ]);

    expect(DocumentSpeedDerating::query()->count())->toBe(0);
});

it('lets no one change the table of a released document, nor a role that may only look (R-11)', function (): void {
    $document = tabelleDraft();

    $this->actingAs(tabelleAdmin('support-agent'), 'admin')->put("/admin/gutachten/{$document->id}/tragfaehigkeitstabelle", tabellePayload())->assertForbidden();

    $document->forceFill(['status' => 'published', 'pdf_key' => 'gutachten/abe-55255.pdf', 'pdf_sha256' => str_repeat('a', 64)])->save();

    $this->actingAs(tabelleAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/tragfaehigkeitstabelle", tabellePayload())->assertForbidden();

    expect(DocumentSpeedDerating::query()->count())->toBe(0);
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
