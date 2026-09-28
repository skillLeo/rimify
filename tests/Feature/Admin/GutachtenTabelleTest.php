<?php

declare(strict_types=1);

use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCondition;
use App\Models\DocumentSpeedDerating;
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

it('refuses a load-index Auflage that is not twice the capacity of its index, where it is typed', function (): void {
    $document = tabelleDraft();
    $entry = ['code' => 'T88', 'kind' => ConditionKind::ReifenTragfaehigkeit->value, 'text_de' => 'Reifen mit Tragfähigkeitsindex 88 sind nur bis zu einer zulässigen Achslast von 1.125 kg zulässig.', 'source_page' => 6, 'max_axle_load_kg' => 1125];

    // The page sends its own error bag in a header; without it the errors land in the default bag.
    $this->actingAs(tabelleAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", $entry)
        ->assertSessionHasErrors(['max_axle_load_kg' => "T88 steht für Tragfähigkeitsindex 88: das sind 2 × 560\u{00A0}kg = 1.120\u{00A0}kg. Bitte prüf die Zahl im Gutachten."]);

    $this->actingAs(tabelleAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['max_axle_load_kg' => 1120] + $entry)
        ->assertSessionHasNoErrors();

    // A code in another form is read by its kilograms: half of them must be a capacity from the table.
    $this->actingAs(tabelleAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen/stapel", ['entries' => [
        ['code' => '140', 'kind' => ConditionKind::ReifenTragfaehigkeit->value, 'text_de' => 'Das Sonderrad ist in Verbindung mit dieser Reifengröße nur bis 1.401 kg Achslast zulässig.', 'max_axle_load_kg' => 1401],
    ]])->assertSessionHasErrors(['entries.0.max_axle_load_kg']);
});

it('finds every load-index Auflage of every document exactly twice the capacity of its index', function (): void {
    // The free cross-check, over whatever the database holds: it fails loudly the day a limit is mistyped.
    $check = app(LoadLimitCheck::class);
    $deriver = app(LoadIndexDeriver::class);
    $checked = 0;

    foreach (DocumentCondition::query()->where('kind', ConditionKind::ReifenTragfaehigkeit->value)->whereNotNull('max_axle_load_kg')->get() as $condition) {
        $kg = (int) $condition->max_axle_load_kg;

        expect($check->problem($condition->code, $kg))->toBeNull("{$condition->code} = {$kg} kg")
            ->and($kg % 2)->toBe(0)
            ->and($deriver->indexForCapacity(intdiv($kg, 2)))->not->toBeNull();

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
