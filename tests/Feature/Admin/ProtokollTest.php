<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\BalanceWeightColour;
use App\Services\Admin\AuditDescriber;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Database\Seeders\AccessSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protokoll — reading the audit trail, and taking a copy of it away.
 *
 * What matters: only a role holding `audit_log` × `view` reads it and only `export` takes a file; the
 * filters select exactly what they say (days are Berlin days, the table is UTC); the file holds the
 * same set as the page and says so in German; taking it is itself on the record; and no entry is
 * ever shown as a code or with a secret in it.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->travelTo(CarbonImmutable::parse('2026-09-26 10:00:00', 'UTC'));
});

function protokollAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/**
 * One entry, written the one way the panel writes them, at a given UTC instant.
 *
 * @param  array<string, mixed>  $properties
 */
function protokollEntry(AdminUser $actor, string $event, array $properties = [], ?string $atUtc = null, ?Model $subject = null): AuditLog
{
    $now = CarbonImmutable::now();

    if ($atUtc !== null) {
        test()->travelTo(CarbonImmutable::parse($atUtc, 'UTC'));
    }

    AuditTrail::record($actor, $event, $properties, $subject);

    test()->travelTo($now);

    return AuditLog::query()->latest('id')->firstOrFail();
}

/**
 * @param  TestResponse<Response>  $response
 * @return array<string, mixed>
 */
function protokollProps(TestResponse $response): array
{
    $props = [];

    $response->assertInertia(function (AssertableInertia $page) use (&$props): void {
        $props = $page->toArray()['props'];
    });

    return $props;
}

/** @return list<list<string>> */
function protokollCsv(string $body): array
{
    $lines = explode("\r\n", rtrim(substr($body, 3), "\r\n"));

    return array_map(static fn (string $line): array => str_getcsv($line, ';', '"', ''), $lines);
}

describe('who may read it', function (): void {
    it('opens for a role with the right, newest first, every entry in words', function (): void {
        $admin = protokollAdmin();

        protokollEntry($admin, 'role.deleted', ['role_id' => 99, 'label' => 'Lager'], '2026-09-26 08:00:00');
        protokollEntry($admin, 'mounting_fee.updated', ['old_cents' => null, 'cents' => 1990], '2026-09-26 09:00:00');

        $props = protokollProps(
            $this->actingAs($admin, 'admin')->get('/admin/protokoll')
                ->assertOk()
                ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Protokoll/Index'))
        );

        expect($props['entries'])->toHaveCount(2)
            ->and($props['entries'][0]['sentence'])->toBe('Der Preis für Montage und Auswuchten wurde geändert.')
            ->and($props['entries'][0]['area'])->toBe('Katalog')
            ->and($props['entries'][0]['person'])->toBe('Sabine Roth')
            ->and($props['entries'][0]['ip'])->toBe('127.0.0.1')
            ->and($props['entries'][0]['changes'])->toBe([
                ['label' => 'Montage und Auswuchten je Rad', 'before' => 'nicht festgelegt', 'after' => GermanFormat::money(1990)],
            ])
            ->and($props['entries'][1]['sentence'])->toBe('Die Rolle „Lager“ wurde gelöscht.')
            ->and($props['entries'][1]['area'])->toBe('Team')
            ->and($props['can']['export'])->toBeTrue()
            ->and($props['exportUrl'])->toBe('/admin/protokoll/export')
            ->and($props['filtered'])->toBeFalse();
    });

    it('refuses a role without audit_log view', function (): void {
        $this->actingAs(protokollAdmin('accountant'), 'admin')->get('/admin/protokoll')->assertForbidden();
    });

    it('lets a reader read but offers no export, and the server refuses the export too', function (): void {
        $reader = protokollAdmin('compliance-editor');

        $this->actingAs($reader, 'admin')->get('/admin/protokoll')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('can.export', false)->where('exportUrl', null));

        $this->actingAs($reader, 'admin')->get('/admin/protokoll/export')->assertForbidden();

        expect(AuditLog::query()->where('description', 'audit_log.exported')->exists())->toBeFalse();
    });

    it('refuses the export to a role that may not even read the log', function (): void {
        $this->actingAs(protokollAdmin('accountant'), 'admin')->get('/admin/protokoll/export')->assertForbidden();
    });

    it('sends somebody who is not signed in to the sign-in screen', function (): void {
        $this->get('/admin/protokoll')->assertRedirect('/admin/anmelden');
    });
});

describe('the filters', function (): void {
    it('narrows to one person by account', function (): void {
        $owner = protokollAdmin();
        $editor = protokollAdmin('compliance-editor');

        protokollEntry($owner, 'admin.password_changed');
        protokollEntry($editor, 'admin.password_changed');
        protokollEntry($editor, 'admin.password_changed');

        $props = protokollProps($this->actingAs($owner, 'admin')->get('/admin/protokoll?person='.$editor->id));

        expect($props['entries'])->toHaveCount(2)
            ->and(array_unique(array_column($props['entries'], 'person')))->toBe(['Dr. Mirjam Halbach'])
            ->and($props['filters']['person'])->toBe((string) $editor->id)
            ->and($props['filtered'])->toBeTrue()
            ->and($props['totalAll'])->toBe(3)
            ->and(array_column($props['options']['people'], 'label'))->toBe(['Dr. Mirjam Halbach', 'Sabine Roth']);
    });

    it('narrows to an address kept on entries that name no account', function (): void {
        AuditLog::query()->create([
            'log_name' => 'admin',
            'description' => 'admin.password_changed',
            'actor_email' => 'ehemalig@rimify.test',
            'ip_address' => '203.0.113.9',
        ]);
        protokollEntry(protokollAdmin(), 'admin.password_changed');

        $props = protokollProps($this->actingAs(protokollAdmin(), 'admin')->get('/admin/protokoll?person=ehemalig@rimify.test'));

        expect($props['entries'])->toHaveCount(1)
            ->and($props['entries'][0]['person'])->toBe('ehemalig@rimify.test')
            ->and(array_column($props['options']['people'], 'value'))->toContain('ehemalig@rimify.test');
    });

    it('narrows to one area, and "Sonstiges" is everything the Protokoll has no words for', function (): void {
        $admin = protokollAdmin();

        protokollEntry($admin, 'role.deleted', ['role_id' => 1, 'label' => 'Lager']);
        protokollEntry($admin, 'tpms_price.deleted', ['make_key' => 'porsche']);
        protokollEntry($admin, 'something.new', []);

        $team = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll?bereich=team'));
        $catalogue = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll?bereich=katalog'));
        $other = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll?bereich=sonstiges'));

        expect(array_column($team['entries'], 'area'))->toBe(['Team'])
            ->and(array_column($catalogue['entries'], 'sentence'))->toBe(['Der RDKS-Sensorpreis für Porsche wurde gelöscht.'])
            ->and(array_column($other['entries'], 'area'))->toBe(['Sonstiges']);
    });

    it('reads days as Berlin days, although the table is UTC', function (): void {
        $admin = protokollAdmin();

        // 22:30 UTC on the 24th is 00:30 on the 25th in Berlin (summer time).
        protokollEntry($admin, 'role.deleted', ['label' => 'Nachts'], '2026-09-24 22:30:00');
        protokollEntry($admin, 'role.deleted', ['label' => 'Vortag'], '2026-09-24 21:30:00');

        $from = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll?von=2026-09-25'));
        $until = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll?bis=2026-09-24'));
        $one = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll?von=2026-09-25&bis=2026-09-25'));

        expect(array_column($from['entries'], 'sentence'))->toBe(['Die Rolle „Nachts“ wurde gelöscht.'])
            ->and(array_column($until['entries'], 'sentence'))->toBe(['Die Rolle „Vortag“ wurde gelöscht.'])
            ->and($one['entries'])->toHaveCount(1)
            ->and($one['entries'][0]['day'])->toBe('25.09.2026');
    });

    it('refuses a filter it cannot read and opens the page unfiltered, saying why', function (): void {
        $admin = protokollAdmin();

        $this->actingAs($admin, 'admin')->get('/admin/protokoll?von=26.09.2026')
            ->assertRedirect('/admin/protokoll')
            ->assertSessionHasErrors(['von' => 'Das Anfangsdatum ist kein gültiger Tag.']);

        $this->actingAs($admin, 'admin')->get('/admin/protokoll?bereich=erfunden')
            ->assertRedirect('/admin/protokoll')
            ->assertSessionHasErrors('bereich');

        $this->actingAs($admin, 'admin')->get('/admin/protokoll?person=DROP%20TABLE')
            ->assertRedirect('/admin/protokoll')
            ->assertSessionHasErrors('person');

        $this->actingAs($admin, 'admin')->get('/admin/protokoll?von=2026-09-20&bis=2026-09-10')
            ->assertRedirect('/admin/protokoll')
            ->assertSessionHasErrors(['bis' => 'Das Enddatum liegt vor dem Anfangsdatum.']);
    });
});

describe('the pages of the list', function (): void {
    it('shows fifty per page, newest first, with links that keep the filters', function (): void {
        $admin = protokollAdmin();

        for ($i = 1; $i <= 51; $i++) {
            protokollEntry($admin, 'role.deleted', ['label' => 'Rolle '.$i]);
        }

        $first = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll?bereich=team'));

        expect($first['entries'])->toHaveCount(50)
            ->and($first['entries'][0]['sentence'])->toBe('Die Rolle „Rolle 51“ wurde gelöscht.')
            ->and($first['pagination'])->toBe([
                'current' => 1,
                'last' => 2,
                'total' => 51,
                'prev' => null,
                'next' => '/admin/protokoll?bereich=team&seite=2',
            ]);

        $second = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll?bereich=team&seite=2'));

        expect($second['entries'])->toHaveCount(1)
            ->and($second['entries'][0]['sentence'])->toBe('Die Rolle „Rolle 1“ wurde gelöscht.')
            ->and($second['pagination']['prev'])->toBe('/admin/protokoll?bereich=team')
            ->and($second['pagination']['next'])->toBeNull();
    });

    it('opens the last real page for a page number past the end', function (): void {
        protokollEntry(protokollAdmin(), 'admin.password_changed');

        $this->actingAs(protokollAdmin(), 'admin')->get('/admin/protokoll?seite=9')->assertRedirect('/admin/protokoll');
    });

    it('heads each day as heute, gestern or its date, in Berlin', function (): void {
        $admin = protokollAdmin();

        protokollEntry($admin, 'admin.password_changed', [], '2026-09-23 12:00:00');
        protokollEntry($admin, 'admin.password_changed', [], '2026-09-25 12:00:00');
        // 23:30 UTC on the 25th is already the 26th in Berlin.
        protokollEntry($admin, 'admin.password_changed', [], '2026-09-25 23:30:00');

        $props = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll'));

        expect(array_column($props['entries'], 'dayLabel'))->toBe(['Heute', 'Gestern', '23.09.2026'])
            ->and($props['entries'][0]['time'])->toStartWith('01:30')
            ->and($props['entries'][0]['time'])->toEndWith('Uhr');
    });

    it('tells an empty log from a filter that excludes everything', function (): void {
        $admin = protokollAdmin();

        $empty = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll'));

        expect($empty['entries'])->toBe([])
            ->and($empty['filtered'])->toBeFalse()
            ->and($empty['totalAll'])->toBe(0);

        protokollEntry($admin, 'admin.password_changed');

        $none = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll?bereich=katalog'));

        expect($none['entries'])->toBe([])
            ->and($none['filtered'])->toBeTrue()
            ->and($none['totalAll'])->toBe(1);
    });
});

describe('the CSV export', function (): void {
    it('is UTF-8 with a BOM, semicolons, a German header, and the same set the page shows', function (): void {
        $admin = protokollAdmin();

        protokollEntry($admin, 'role.deleted', ['label' => 'Lager']);
        protokollEntry($admin, 'mounting_fee.updated', ['old_cents' => 1500, 'cents' => 1990]);
        protokollEntry($admin, 'tpms_price.deleted', ['make_key' => 'porsche']);

        $response = $this->actingAs($admin, 'admin')->get('/admin/protokoll/export?bereich=katalog');

        $response->assertOk();
        expect(strtolower((string) $response->headers->get('content-type')))->toStartWith('text/csv')
            ->and(strtolower((string) $response->headers->get('content-type')))->toContain('utf-8')
            ->and((string) $response->headers->get('content-disposition'))->toContain('attachment')
            ->and((string) $response->headers->get('content-disposition'))->toContain('protokoll-2026-09-26.csv');

        $body = $response->streamedContent();

        expect(substr($body, 0, 3))->toBe("\xEF\xBB\xBF");

        $rows = protokollCsv($body);
        $page = protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll?bereich=katalog'));

        expect($rows[0])->toBe(['Zeitpunkt', 'Person', 'Bereich', 'Änderung', 'Vorher → Nachher', 'IP-Adresse'])
            ->and(count($rows) - 1)->toBe($page['pagination']['total'])
            ->and($rows[1])->toBe([
                // 10:00 UTC is 12:00 in Berlin; the helper writes it, so the file and the page agree.
                (string) GermanFormat::dateTime(CarbonImmutable::parse('2026-09-26 12:00:00', 'Europe/Berlin')),
                'Sabine Roth',
                'Katalog',
                'Der RDKS-Sensorpreis für Porsche wurde gelöscht.',
                '',
                '127.0.0.1',
            ])
            ->and($rows[2][3])->toBe('Der Preis für Montage und Auswuchten wurde geändert.')
            ->and($rows[2][4])->toBe('Montage und Auswuchten je Rad: '.GermanFormat::money(1500).' → '.GermanFormat::money(1990));
    });

    it('records the export itself, with its filters, and leaves that entry out of the file', function (): void {
        $admin = protokollAdmin();

        protokollEntry($admin, 'role.deleted', ['label' => 'Lager']);

        $body = $this->actingAs($admin, 'admin')->get('/admin/protokoll/export?bereich=team&von=2026-09-01')->streamedContent();

        expect(protokollCsv($body))->toHaveCount(2);

        $entry = AuditLog::query()->where('description', 'audit_log.exported')->latest('id')->firstOrFail();

        // toEqual, not toBe: MySQL's JSON type keeps object keys in its own order.
        expect($entry->actor_email)->toBe($admin->email)
            ->and($entry->getProperty('filters'))->toEqual(['bereich' => 'Team', 'von' => '2026-09-01'])
            ->and($entry->getProperty('count'))->toBe(1)
            ->and(app(AuditDescriber::class)->describe($entry)['sentence'])
            ->toBe('Das Protokoll wurde als CSV exportiert – 1 Eintrag, gefiltert nach Bereich „Team“ und Zeitraum ab 01.09.2026.');
    });

    it('defuses a cell a spreadsheet would run as a formula', function (): void {
        // An entry that kept only an address, and the address is typed to look like a formula.
        AuditLog::query()->create(['log_name' => 'admin', 'description' => 'admin.password_changed', 'actor_email' => '=HYPERLINK("x")@evil']);

        $rows = protokollCsv($this->actingAs(protokollAdmin(), 'admin')->get('/admin/protokoll/export')->streamedContent());

        expect($rows[1][1])->toBe('\'=HYPERLINK("x")@evil');
    });
});

describe('putting every entry into words', function (): void {
    it('writes a German sentence for every event the panel records, never a code', function (): void {
        $admin = protokollAdmin();
        $accountant = (int) DB::table('roles')->where('name', 'accountant')->value('id');
        // The role's current label, whatever the seeder calls it: the entry did not keep one.
        $accountantLabel = (string) DB::table('roles')->where('id', $accountant)->value('label_de');
        $colour = BalanceWeightColour::factory()->create(['name_de' => 'Schwarz']);
        $euro = static fn (int $cents): string => GermanFormat::money($cents);

        // event => [properties, sentence, changes as "label: before → after"]
        $cases = [
            'role.created' => [['role_id' => 50, 'label' => 'Lager', 'copied_from_label' => 'Katalog-Manager'], 'Die Rolle „Lager“ wurde als Kopie von „Katalog-Manager“ angelegt.', []],
            'role.updated' => [
                ['role_id' => 50, 'old' => ['label' => 'Lager', 'description' => null], 'new' => ['label' => 'Lager & Versand', 'description' => 'Versand']],
                'Die Rolle „Lager“ heißt jetzt „Lager & Versand“.',
                ['Bezeichnung: Lager → Lager & Versand', 'Beschreibung: – → Versand'],
            ],
            'role.duplicated' => [['role_id' => 51, 'label' => 'Buchhaltung (Kopie)', 'copied_from_label' => 'Buchhaltung'], 'Die Rolle „Buchhaltung“ wurde dupliziert; die Kopie heißt „Buchhaltung (Kopie)“.', []],
            'role.deleted' => [['role_id' => 50, 'label' => 'Lager'], 'Die Rolle „Lager“ wurde gelöscht.', []],
            'role_permission.updated' => [
                ['role_id' => $accountant, 'module' => 'catalogue', 'action' => 'edit', 'old' => false, 'allowed' => true],
                'Der Rolle „'.$accountantLabel.'“ wurde das Recht „Katalog · Bearbeiten“ gegeben.',
                ['Katalog · Bearbeiten: nicht erlaubt → erlaubt'],
            ],
            'role_permissions.replaced' => [
                ['role_id' => $accountant, 'label' => 'Buchhaltung', 'added' => ['catalogue.edit', 'audit_log.view'], 'removed' => ['reports.export']],
                'Der Rolle „Buchhaltung“ wurden 2 Rechte gegeben und 1 Recht entzogen.',
                ['Katalog · Bearbeiten: nicht erlaubt → erlaubt', 'Protokoll · Ansehen: nicht erlaubt → erlaubt', 'Auswertungen · Exportieren: erlaubt → nicht erlaubt'],
            ],
            'admin.invited' => [['email' => 'neu@rimify.test', 'role_label' => 'Support Agent'], 'Die Einladung an neu@rimify.test mit der Rolle „Support Agent“ wurde verschickt.', []],
            'admin.invitation_resent' => [['email' => 'neu@rimify.test'], 'Die Einladung an neu@rimify.test wurde noch einmal verschickt.', []],
            'admin.invitation_revoked' => [['email' => 'neu@rimify.test'], 'Die Einladung an neu@rimify.test wurde widerrufen.', []],
            'admin.invitation_accepted' => [['email' => 'neu@rimify.test', 'role_label' => 'Support Agent'], 'Die Einladung an neu@rimify.test wurde angenommen; das Konto hat die Rolle „Support Agent“.', []],
            'admin.role_changed' => [
                ['user_id' => 9, 'email' => 'neu@rimify.test', 'old_role_label' => 'Support Agent', 'new_role_label' => 'Buchhaltung'],
                'Das Konto neu@rimify.test hat jetzt die Rolle „Buchhaltung“.',
                ['Rolle: Support Agent → Buchhaltung'],
            ],
            'admin.suspended' => [['user_id' => 9, 'email' => 'neu@rimify.test'], 'Das Konto neu@rimify.test wurde gesperrt.', []],
            'admin.reactivated' => [['user_id' => 9, 'email' => 'neu@rimify.test'], 'Das Konto neu@rimify.test wurde wieder entsperrt.', []],
            'admin.sessions_revoked' => [['user_id' => 9, 'email' => 'neu@rimify.test'], 'Das Konto neu@rimify.test wurde auf allen Geräten abgemeldet.', []],
            'admin.password_changed' => [[], 'Das eigene Passwort wurde geändert.', []],
            'permission.denied' => [
                ['ability' => 'delete', 'route' => 'admin.wuchtgewichte.destroy'],
                'Der Versuch, auf der Seite „Zubehörpreise › Wuchtgewichte“ etwas zu löschen, wurde abgelehnt, weil die Berechtigung dafür fehlte.',
                [],
            ],
            'weight_colour.created' => [['id' => $colour->id, 'name_de' => 'Schwarz', 'surcharge_cents' => 250], 'Die Wuchtgewichte-Farbe „Schwarz“ wurde angelegt.', ['Aufpreis je Rad: – → '.$euro(250)]],
            'weight_colour.updated' => [
                ['id' => $colour->id, 'old' => ['surcharge_cents' => 250, 'active' => true, 'updated_at' => '2026-09-25T10:00:00Z'], 'attributes' => ['surcharge_cents' => 300, 'active' => false, 'updated_at' => '2026-09-26T10:00:00Z']],
                'Die Wuchtgewichte-Farbe „Schwarz“ wurde geändert.',
                ['Aufpreis je Rad: '.$euro(250).' → '.$euro(300), 'Status: aktiv → inaktiv'],
            ],
            'weight_colour.deleted' => [['id' => $colour->id, 'name_de' => 'Schwarz'], 'Die Wuchtgewichte-Farbe „Schwarz“ wurde gelöscht.', []],
            'mounting_fee.updated' => [['old_cents' => null, 'cents' => 1990], 'Der Preis für Montage und Auswuchten wurde geändert.', ['Montage und Auswuchten je Rad: nicht festgelegt → '.$euro(1990)]],
            'tpms_price.created' => [['make_key' => 'volkswagen', 'price_cents' => 1500], 'Der RDKS-Sensorpreis für Volkswagen wurde angelegt.', ['Preis je Sensor: – → '.$euro(1500)]],
            'tpms_price.updated' => [
                ['make_key' => 'porsche', 'old' => ['price_cents' => 4500], 'new' => ['price_cents' => 5000], 'attributes' => ['price_cents' => 5000, 'updated_at' => '2026-09-26T10:00:00Z']],
                'Der RDKS-Sensorpreis für Porsche wurde geändert.',
                ['Preis je Sensor: '.$euro(4500).' → '.$euro(5000)],
            ],
            'tpms_price.deleted' => [['make_key' => 'porsche'], 'Der RDKS-Sensorpreis für Porsche wurde gelöscht.', []],
            'tpms_default_price.updated' => [['old_cents' => 1500, 'cents' => null], 'Der Standardpreis für RDKS-Sensoren wurde geändert.', ['Standardpreis je Sensor: '.$euro(1500).' → nicht festgelegt']],
            'audit_log.exported' => [['filters' => [], 'count' => 3], 'Das ganze Protokoll wurde als CSV exportiert – 3 Einträge.', []],
            'storage.settings_updated' => [
                ['changed' => ['Bucket', 'Geheimer Schlüssel'], 'key_last4' => ['old' => 'AB12', 'new' => 'AB12'], 'signing_key_last4' => ['old' => 'X9Y8', 'new' => 'Q7R6'], 'active' => true],
                'Die Speicher-Einstellungen wurden geändert: Bucket, Geheimer Schlüssel. Sie gelten ab jetzt.',
                ['Geheimer Schlüssel: …X9Y8 → …Q7R6'],
            ],
            'demo.purged' => [
                ['tables' => ['orders' => 1412, 'audit_logs' => 44], 'total' => 1456, 'anchor' => '2026-09-27', 'operator' => 'Konsole (demo:purge)', 'environment' => 'staging'],
                'Die Demodaten wurden entfernt: 1.456 Datensätze, eingespielt bis zum 27.09.2026.',
                ['Bestellungen: 1.412 → 0', 'Protokolleinträge: 44 → 0'],
            ],
            'orders.exported' => [
                ['format' => 'xlsx', 'filters' => ['status' => 'PAID', 'von' => '2026-09-01', 'bis' => '2026-09-26'], 'count' => 12],
                'Bestellungen wurden als Excel-Datei exportiert (Status „Bezahlt“, Zeitraum 01.09.2026 bis 26.09.2026) – 12 Bestellungen.',
                [],
            ],
            'demand.marked' => [['gap' => 'BMW X3 M40i', 'state' => 'watched', 'brand' => null], 'Die Nachfrage-Lücke „BMW X3 M40i“ wurde als beobachtet markiert.', []],
            'demand.unmarked' => [['gap' => 'HSN 0005 · TSN ABC'], 'Die Markierung der Nachfrage-Lücke „HSN 0005 · TSN ABC“ wurde aufgehoben. Sie ist wieder offen.', []],
            'page.created' => [['page' => 'ET richtig lesen', 'slug' => 'et-richtig-lesen'], 'Der Ratgeber-Artikel „ET richtig lesen“ wurde angelegt. Er ist noch nicht veröffentlicht.', []],
            'page.draft_saved' => [['page' => 'Impressum', 'slug' => 'impressum'], 'Für die Seite „Impressum“ wurde ein Entwurf gespeichert.', []],
            'page.draft_discarded' => [['page' => 'Impressum', 'slug' => 'impressum'], 'Der Entwurf der Seite „Impressum“ wurde verworfen.', []],
            'page.published' => [
                ['page' => 'Impressum', 'slug' => 'impressum', 'changes' => ['Abschnitt 1 · Text'], 'note' => 'Text der Kanzlei', 'lawyer_reviewed' => ['old' => false, 'new' => true]],
                'Die Seite „Impressum“ wurde veröffentlicht. Geändert: Abschnitt 1 · Text. Notiz: „Text der Kanzlei“.',
                ['Vom Anwalt geprüft: nein → ja'],
            ],
            'page.withdrawn' => [['page' => 'ET richtig lesen', 'slug' => 'et-richtig-lesen'], 'Der Ratgeber-Artikel „ET richtig lesen“ wurde zurückgezogen und ist nicht mehr im Shop zu sehen.', []],
            'faq.created' => [['question' => 'Wie lange dauert die Lieferung?', 'published' => false], 'Die Frage „Wie lange dauert die Lieferung?“ wurde angelegt; sie ist noch ausgeblendet.', []],
            'faq.updated' => [
                ['question' => 'Wie lange dauert der Versand?', 'old_question' => 'Wie lange dauert die Lieferung?', 'changed' => ['question_de', 'answer_de', 'published'], 'published' => ['old' => false, 'new' => true]],
                'Die Frage „Wie lange dauert die Lieferung?“ wurde geändert: Frage, Antwort.',
                ['Im Shop: ausgeblendet → sichtbar'],
            ],
            'faq.deleted' => [['question' => 'Kann ich Felgen zurückgeben?', 'published' => true], 'Die Frage „Kann ich Felgen zurückgeben?“ wurde gelöscht.', []],
            'faq.reordered' => [['count' => 8], 'Die Reihenfolge der FAQ wurde geändert.', []],
            'nav.created' => [['menu' => 'header', 'label' => 'Ratgeber'], 'Im Menü „Kopfzeile“ wurde der Eintrag „Ratgeber“ angelegt.', []],
            'nav.updated' => [
                ['menu' => 'mobile_bottom', 'label' => 'Check', 'old' => ['label' => 'Check', 'target' => 'RIMIFY-Check', 'icon' => 'check-circle', 'visible' => true], 'new' => ['label' => 'Prüfen', 'target' => 'RIMIFY-Check', 'icon' => 'check-circle', 'visible' => false]],
                'Im Menü „Handy-Leiste unten“ wurde der Eintrag „Check“ geändert.',
                ['Name: Check → Prüfen', 'Im Shop: sichtbar → ausgeblendet'],
            ],
            'nav.deleted' => [['menu' => 'footer_shop', 'label' => 'RIMIFY-Check', 'target' => 'RIMIFY-Check'], 'Aus dem Menü „Fußzeile · Shop“ wurde der Eintrag „RIMIFY-Check“ gelöscht.', []],
            'nav.reordered' => [['menu' => 'footer_service', 'count' => 3], 'Die Reihenfolge im Menü „Fußzeile · Service“ wurde geändert.', []],
            'wheel.created' => [['name' => 'Nordfelge Fjord'], 'Die Felge „Nordfelge Fjord“ wurde als Entwurf angelegt.', []],
            'wheel.updated' => [['name' => 'Nordfelge Fjord', 'changed' => ['name']], 'Die Felge „Nordfelge Fjord“ wurde geändert.', []],
            'wheel.published' => [['name' => 'Nordfelge Fjord'], 'Die Felge „Nordfelge Fjord“ wurde veröffentlicht und ist im Shop.', []],
            'wheel.unpublished' => [['name' => 'Nordfelge Fjord'], 'Die Felge „Nordfelge Fjord“ wurde zurückgezogen und ist nicht mehr im Shop.', []],
            'wheel.archived' => [['name' => 'Nordfelge Fjord'], 'Die Felge „Nordfelge Fjord“ wurde archiviert.', []],
            'wheel.restored' => [['name' => 'Nordfelge Fjord'], 'Die Felge „Nordfelge Fjord“ wurde aus dem Archiv geholt; sie ist wieder ein Entwurf.', []],
            'wheel.image_uploaded' => [['name' => 'Nordfelge Fjord', 'finish' => 'Graphit matt'], 'Für die Felge „Nordfelge Fjord“ in „Graphit matt“ wurde ein Foto hochgeladen.', []],
            'wheel.image_removed' => [['name' => 'Nordfelge Fjord', 'finish' => 'Graphit matt'], 'Das Foto der Felge „Nordfelge Fjord“ in „Graphit matt“ wurde entfernt.', []],
            'wheel.images_reordered' => [['name' => 'Nordfelge Fjord', 'finish' => 'Graphit matt'], 'Die Fotos der Felge „Nordfelge Fjord“ in „Graphit matt“ wurden neu geordnet.', []],
            'wheel.image_relabelled' => [['name' => 'Nordfelge Fjord', 'finish' => 'Graphit matt'], 'Der Alternativtext eines Fotos der Felge „Nordfelge Fjord“ in „Graphit matt“ wurde geändert.', []],
            'brand.created' => [['name' => 'Borbet'], 'Die Marke „Borbet“ wurde angelegt.', []],
            'brand.restored' => [['name' => 'Borbet', 'with_logo' => true], 'Die entfernte Marke „Borbet“ wurde wieder angelegt, mit ihrem früheren Logo.', []],
            'brand.updated' => [
                ['old' => ['name' => 'Borbet', 'is_wheel_brand' => false, 'sort_order' => 3], 'new' => ['name' => 'BORBET', 'is_wheel_brand' => true, 'sort_order' => 3]],
                'Die Marke „BORBET“ wurde geändert.',
                ['Name: Borbet → BORBET', 'Auf der Markenwand: nein → ja'],
            ],
            'brand.logo_changed' => [['name' => 'Borbet'], 'Das Logo der Marke „Borbet“ wurde gespeichert.', []],
            'brand.logo_removed' => [['name' => 'Borbet'], 'Das Logo der Marke „Borbet“ wurde entfernt.', []],
            'brand.deleted' => [['name' => 'Borbet'], 'Die Marke „Borbet“ wurde entfernt.', []],
            'catalogue.imported' => [
                ['file' => 'lieferant.csv', 'summary' => ['create' => 12, 'update' => 1, 'refused' => 2]],
                'Die Datei „lieferant.csv“ wurde in den Katalog importiert: 12 neue Größen, 1 geänderte Größe, 2 abgelehnt.',
                [],
            ],
            'catalogue.import_rolled_back' => [['file' => 'lieferant.csv'], 'Der Import der Datei „lieferant.csv“ wurde zurückgenommen.', []],
            'approval.created' => [['document' => 'ABE 53810'], 'Das Dokument „ABE 53810“ wurde als Entwurf angelegt.', []],
            'approval.updated' => [['document' => 'ABE 53810', 'pdf' => true], 'Die Angaben zum Dokument „ABE 53810“ wurden geändert; das PDF wurde ersetzt.', []],
            'approval.rows_added' => [['document' => 'ABE 53810', 'rows' => 12], 'Im Verwendungsbereich von „ABE 53810“ wurden 12 Zeilen angelegt.', []],
            'approval.row_updated' => [['document' => 'ABE 53810', 'row' => 4], 'Eine Zeile im Verwendungsbereich von „ABE 53810“ wurde geändert.', []],
            'approval.row_deleted' => [['document' => 'ABE 53810', 'row' => 4], 'Eine Zeile wurde aus dem Verwendungsbereich von „ABE 53810“ entfernt.', []],
            'approval.released' => [
                ['document' => 'ABE 53810', 'rows' => 30, 'conflicts' => 2],
                'Das Dokument „ABE 53810“ wurde freigegeben: 30 Zeilen sind jetzt im Shop. 2 Widersprüche zu anderen Gutachten wurden erkannt.',
                [],
            ],
            'approval.entry_overridden' => [
                ['document' => 'ABE 53810', 'row' => 4, 'override' => 'not_required', 'reason' => 'Der Prüfer verlangt keine Abnahme.'],
                'In einer Zeile von „ABE 53810“ wurde die Eintragung abweichend von den Codes auf „nicht erforderlich“ gesetzt: „Der Prüfer verlangt keine Abnahme.“.',
                [],
            ],
            'approval.condition_added' => [['document' => 'ABE 53810', 'code' => 'A01', 'kind' => 'abnahme'], 'Im Auflagenverzeichnis von „ABE 53810“ wurde der Code „A01“ angelegt.', []],
            'approval.condition_changed' => [['document' => 'ABE 53810', 'code' => 'A01', 'kind' => 'abnahme'], 'Im Auflagenverzeichnis von „ABE 53810“ wurde der Code „A01“ geändert.', []],
            'approval.condition_removed' => [['document' => 'ABE 53810', 'code' => 'A01'], 'Aus dem Auflagenverzeichnis von „ABE 53810“ wurde der Code „A01“ entfernt.', []],
            'approval.fastener_added' => [['document' => 'ABE 55255', 'what' => 'S01 · M14x1,25 · Kegelbund 60°'], 'Zu „ABE 55255“ wurde das Befestigungsmittel „S01 · M14x1,25 · Kegelbund 60°“ eingetragen.', []],
            'approval.fastener_removed' => [['document' => 'ABE 55255', 'what' => 'S01 · M14x1,25 · Kegelbund 60°'], 'Aus „ABE 55255“ wurde das Befestigungsmittel „S01 · M14x1,25 · Kegelbund 60°“ entfernt.', []],
            'approval.notice_added' => [['document' => 'ABE 55255', 'what' => 'Radschrauben nach 50 km nachziehen.'], 'Zu „ABE 55255“ wurde der Pflichthinweis „Radschrauben nach 50 km nachziehen.“ eingetragen.', []],
            'approval.notice_removed' => [['document' => 'ABE 55255', 'what' => 'Radschrauben nach 50 km nachziehen.'], 'Aus „ABE 55255“ wurde der Pflichthinweis „Radschrauben nach 50 km nachziehen.“ entfernt.', []],
            'approval.rework_added' => [['document' => 'ABE 55255', 'what' => 'K42 · 3C · von 15 bis 30 mm'], 'Zu „ABE 55255“ wurde das Maß der Nacharbeit „K42 · 3C · von 15 bis 30 mm“ eingetragen.', []],
            'approval.rework_removed' => [['document' => 'ABE 55255', 'what' => 'K42 · 3C · von 15 bis 30 mm'], 'Aus „ABE 55255“ wurde das Maß der Nacharbeit „K42 · 3C · von 15 bis 30 mm“ entfernt.', []],
            'approval.derating_saved' => [['document' => 'ABE 55255', 'rows' => 10], 'Für „ABE 55255“ wurde die Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit gespeichert (10 Zeilen).', []],
            'approval.derating_removed' => [['document' => 'ABE 55255'], 'Aus „ABE 55255“ wurde die Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit entfernt.', []],
            'approval.limit_confirmed' => [
                ['document' => 'ABE 55255', 'code' => 'T88', 'reason' => 'Seite 7 druckt 1.125 kg.'],
                'In „ABE 55255“ wurde die Achslast bei „T88“ so bestätigt, wie das Gutachten sie druckt: „Seite 7 druckt 1.125 kg.“.',
                [],
            ],
            'vehicle.created_from_document' => [
                ['vehicle' => 'BMW 4er Coupé 3C', 'document' => 'ABE 55255', 'page' => 4, 'eg' => 'e1*2007/46*0563*..'],
                'Das Fahrzeug „BMW 4er Coupé 3C“ wurde aus „ABE 55255“, Seite 4 angelegt, mit der EG-Typgenehmigungsnummer „e1*2007/46*0563*..“; ohne HSN und TSN.',
                [],
            ],
            'vehicle.merged_from_dataset' => [
                ['vehicle' => 'BMW 4er Coupé 3C · HSN 0005 · TSN CDA', 'source' => 'import_kba', 'fields' => ['hsn', 'tsn'], 'kept' => []],
                'Das Fahrzeug „BMW 4er Coupé 3C · HSN 0005 · TSN CDA“ wurde aus dem Fahrzeugdatensatz ergänzt; nur leere Felder wurden gefüllt.',
                [],
            ],
            'vehicle.merge_applied' => [['changed' => 3, 'matched' => 4, 'ambiguous' => 2, 'new' => 10], 'Ein Fahrzeugdatensatz wurde zusammengeführt: 3 Fahrzeuge ergänzt, 2 unklar, 10 neu.', []],
            'conflict.decided' => [
                ['vehicle' => 'BMW 4er', 'wheel' => '8J × 18 ET 35', 'mode' => 'only', 'document' => 'ABE 55255', 'reason' => 'Der Hersteller bestätigt die neuere ABE.'],
                'Der Konflikt zu „BMW 4er · 8J × 18 ET 35“ wurde entschieden: Nur „ABE 55255“ gilt. Grund: „Der Hersteller bestätigt die neuere ABE.“.',
                [],
            ],
            'condition.created' => [['code' => 'RADLAUF', 'text' => 'Bördeln der Radläufe erforderlich.'], 'Die Auflage „Bördeln der Radläufe erforderlich.“ wurde angelegt.', []],
            'condition.updated' => [
                ['code' => 'RADLAUF', 'old_text' => 'Radlauf bördeln.', 'text' => 'Bördeln der Radläufe erforderlich.'],
                'Die Auflage „RADLAUF“ wurde geändert.',
                ['Wortlaut: Radlauf bördeln. → Bördeln der Radläufe erforderlich.'],
            ],
            'condition.deleted' => [['code' => 'RADLAUF', 'text' => 'Bördeln der Radläufe erforderlich.'], 'Die Auflage „Bördeln der Radläufe erforderlich.“ wurde gelöscht.', []],
            'vehicle.legal_data_updated' => [
                ['vehicle' => 'BMW 3er Limousine', 'complete' => true],
                'Die Achslasten und die Höchstgeschwindigkeit von „BMW 3er Limousine“ wurden eingetragen; das Fahrzeug ist vollständig.',
                [],
            ],
            'order.shipped' => [['order' => 'RMF-2026-1001', 'tracking' => '00340434 1234'], 'Die Bestellung „RMF-2026-1001“ wurde als versendet markiert, Sendungsnummer „00340434 1234“.', []],
            'order.delivered' => [['order' => 'RMF-2026-1001'], 'Die Bestellung „RMF-2026-1001“ wurde als zugestellt markiert. Einige Tage danach lädt der Shop zur Bewertung ein.', []],
            'reviews.invited' => [['count' => 3], '3 Einladungen zur Bewertung wurden verschickt.', []],
            'review.hidden' => [['review' => 7, 'order' => 'RMF-2026-1001', 'reason' => 'Werbung.'], 'Eine Bewertung zur Bestellung „RMF-2026-1001“ wurde ausgeblendet: „Werbung.“.', []],
            'review.shown' => [['review' => 7, 'order' => 'RMF-2026-1001'], 'Eine Bewertung zur Bestellung „RMF-2026-1001“ wurde wieder eingeblendet.', []],
            'review.replied' => [['review' => 7, 'order' => 'RMF-2026-1001'], 'Auf eine Bewertung zur Bestellung „RMF-2026-1001“ wurde geantwortet.', []],
            'review.reply_removed' => [['review' => 7, 'order' => 'RMF-2026-1001'], 'Die Antwort auf eine Bewertung zur Bestellung „RMF-2026-1001“ wurde entfernt.', []],
            'page.revision_restored' => [
                ['page' => 'Startseite', 'slug' => 'startseite', 'revision' => 3, 'revision_at' => '2026-09-26T12:00:00+00:00'],
                'Für die Seite „Startseite“ wurde die Version vom '.GermanFormat::dateTime(CarbonImmutable::parse('2026-09-26T12:00:00+00:00')).' als Entwurf geladen.',
                [],
            ],
        ];

        // A new event in the describer without a case here fails this test rather than going unread.
        expect(array_keys($cases))->toEqualCanonicalizing(AuditDescriber::knownEvents());

        $describer = app(AuditDescriber::class);

        foreach ($cases as $event => [$properties, $sentence, $changes]) {
            $described = $describer->describe(protokollEntry($admin, $event, $properties));

            expect($described['sentence'])->toBe($sentence, $event)
                ->and($described['area'])->not->toBe('Sonstiges', $event)
                ->and($described['sentence'])->not->toContain($event)
                ->and($described['sentence'])->not->toContain('_')
                ->and(array_map(
                    static fn (array $c): string => $c['label'].': '.$c['before'].' → '.$c['after'],
                    $described['changes'],
                ))->toBe($changes, $event);
        }
    });

    it('says a role is gone rather than naming it wrongly', function (): void {
        $described = app(AuditDescriber::class)->describe(protokollEntry(protokollAdmin(), 'role_permission.updated', [
            'role_id' => 99999, 'module' => 'orders', 'action' => 'export', 'old' => null, 'allowed' => false,
        ]));

        expect($described['sentence'])->toBe('Einer inzwischen gelöschten Rolle wurde das Recht „Bestellungen · Exportieren“ entzogen.')
            ->and($described['changes'][0]['before'])->toBe('nicht festgelegt');
    });

    it('has a German sentence for an event it does not know, and files it under Sonstiges', function (): void {
        $described = app(AuditDescriber::class)->describe(protokollEntry(protokollAdmin(), 'gutachten.published', ['document' => 'ABE 12345']));

        expect($described['sentence'])->toBe('Hier wurde etwas geändert, das das Protokoll noch nicht in Worten beschreiben kann.')
            ->and($described['area'])->toBe('Sonstiges')
            ->and($described['changes'])->toBe([]);
    });

    it('never prints a password, token or secret, even when a property carried one', function (): void {
        $admin = protokollAdmin();

        protokollEntry($admin, 'admin.invited', ['email' => 'neu@rimify.test', 'token' => 'geheimes-token-123', 'password' => 'hunter2-lang']);
        protokollEntry($admin, 'weight_colour.updated', [
            'old' => ['name_de' => 'Alt', 'password' => 'hunter2-lang'],
            'attributes' => ['name_de' => 'Neu', 'remember_token' => 'geheimes-token-123', 'totp_secret' => 'JBSWY3DPEHPK3PXP'],
        ]);
        protokollEntry($admin, 'unbekannt.event', ['old' => ['api_key' => 'k-1'], 'new' => ['name_de' => 'x', 'secret' => 'JBSWY3DPEHPK3PXP']]);

        $page = json_encode(protokollProps($this->actingAs($admin, 'admin')->get('/admin/protokoll'))['entries'], JSON_UNESCAPED_UNICODE);
        $csv = $this->actingAs($admin, 'admin')->get('/admin/protokoll/export')->streamedContent();

        foreach ([$page, $csv] as $text) {
            expect($text)->not->toContain('hunter2-lang')
                ->and($text)->not->toContain('geheimes-token-123')
                ->and($text)->not->toContain('JBSWY3DPEHPK3PXP')
                ->and($text)->not->toContain('k-1');
        }
    });
});

describe('append-only', function (): void {
    it('refuses an update or a delete through the query builder, at the database', function (): void {
        $entry = protokollEntry(protokollAdmin(), 'role.deleted', ['label' => 'Lager']);

        expect(fn () => DB::table('audit_logs')->where('id', $entry->id)->update(['description' => 'nichts passiert']))
            ->toThrow(QueryException::class, 'append-only');

        expect(fn () => DB::table('audit_logs')->where('id', $entry->id)->delete())
            ->toThrow(QueryException::class, 'append-only');

        expect(DB::table('audit_logs')->where('id', $entry->id)->value('description'))->toBe('role.deleted');
    });
});
