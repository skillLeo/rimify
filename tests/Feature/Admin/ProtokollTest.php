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
                'Für die Rolle „'.$accountantLabel.'“ wurde „Katalog · Bearbeiten“ erlaubt.',
                ['Katalog · Bearbeiten: verboten → erlaubt'],
            ],
            'role_permissions.replaced' => [
                ['role_id' => $accountant, 'label' => 'Buchhaltung', 'added' => ['catalogue.edit', 'audit_log.view'], 'removed' => ['reports.export']],
                'Für die Rolle „Buchhaltung“ wurden 2 Rechte erlaubt und 1 Recht entzogen.',
                ['Katalog · Bearbeiten: verboten → erlaubt', 'Protokoll · Ansehen: verboten → erlaubt', 'Auswertungen · Exportieren: erlaubt → verboten'],
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
                'Der Versuch, auf der Seite „Wuchtgewichte-Farben“ etwas zu löschen, wurde abgelehnt, weil die Berechtigung dafür fehlte.',
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

        expect($described['sentence'])->toBe('Für eine inzwischen gelöschte Rolle wurde „Bestellungen · Exportieren“ verboten.')
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
