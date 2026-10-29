<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\BalanceWeightColour;
use App\Services\Admin\AuditDescriber;
use App\Services\Admin\AuditTrail;
use App\Services\Reset\ResetProbe;
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
 * Every event name the application writes with AuditTrail::record or ::system, read from its source.
 *
 * @return list<string>
 */
function protokollEventsWritten(): array
{
    $events = [];
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(app_path(), FilesystemIterator::SKIP_DOTS));

    foreach ($files as $file) {
        if ($file instanceof SplFileInfo && $file->getExtension() === 'php') {
            preg_match_all("/AuditTrail::(?:record|system)\\(\\s*[^,]+,\\s*'([a-z_]+\\.[a-z_.]+)'/", (string) file_get_contents($file->getPathname()), $found);
            $events = [...$events, ...$found[1]];
        }
    }

    $events = array_values(array_unique($events));
    sort($events);

    return $events;
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
            'admin.password_reset' => [
                ['user_id' => 9, 'email' => 'neu@rimify.test', 'reason' => 'Das alte Passwort stand im öffentlichen Repository.'],
                'Für das Konto neu@rimify.test wurde ein neues Passwort gesetzt; es wurde auf allen Geräten abgemeldet. Grund: Das alte Passwort stand im öffentlichen Repository.',
                [],
            ],
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
            'mail.settings_updated' => [
                ['changed' => ['Absenderadresse', 'Zugriffsschlüssel'], 'key_last4' => ['old' => 'TS12', 'new' => 'KS99'], 'signing_key_last4' => ['old' => 'X9Y8', 'new' => 'X9Y8'], 'active' => true, 'sending' => false],
                'Die E-Mail-Einstellungen wurden geändert: Absenderadresse, Zugriffsschlüssel. Der Zugang zu Amazon SES funktioniert.',
                ['Zugriffsschlüssel: …TS12 → …KS99'],
            ],
            'mail.sns_subscribed' => [
                ['topic' => 'arn:aws:sns:eu-north-1:123456789012:rimify-ses-meldungen'],
                'Amazon SES meldet unzustellbare Adressen und Beschwerden ab jetzt an den Shop (Thema „arn:aws:sns:eu-north-1:123456789012:rimify-ses-meldungen“).',
                [],
            ],
            'mail.suppressed' => [
                ['email' => 'kunde@example.org', 'reason' => 'bounce', 'detail' => 'Permanent/General'],
                'Amazon SES meldet „kunde@example.org“ als dauerhaft unzustellbar (Permanent/General): Der Shop schickt dieser Adresse nichts mehr.',
                [],
            ],
            'mail.suppression_released' => [
                ['email' => 'kunde@example.org'],
                'Die Sperre für „kunde@example.org“ wurde aufgehoben: Der Shop schickt dieser Adresse wieder Mails.',
                [],
            ],
            'demo.purged' => [
                ['tables' => ['orders' => 1412, 'audit_logs' => 44], 'total' => 1456, 'anchor' => '2026-09-27', 'operator' => 'Konsole (demo:purge)', 'environment' => 'staging'],
                'Die Demodaten wurden entfernt: 1.456 Datensätze, eingespielt bis zum 27.09.2026.',
                ['Bestellungen: 1.412 → 0', 'Protokolleinträge: 44 → 0'],
            ],
            'demo.purge_refused' => [
                ['reasons' => ['20 Bestellungen, die nicht als Demodaten angelegt wurden, enthalten Beispielfelgen oder Beispielreifen.']],
                'Das Entfernen der Demodaten wurde abgelehnt; es hat sich nichts geändert. Grund: 20 Bestellungen, die nicht als Demodaten angelegt wurden, enthalten Beispielfelgen oder Beispielreifen.',
                [],
            ],
            'demo.example_pdfs' => [
                ['documents' => [['document' => 'ABE 55255', 'from' => '0a9010a95341', 'to' => 'b258d215653d'], ['document' => '366-0350-21-WIRD/N1', 'from' => 'fd5dfae9aadd', 'to' => '4423c2a2d662']], 'environment' => 'staging'],
                '2 Gutachten des Abnahme-Satzes haben jetzt je eine eigene, als Beispiel gekennzeichnete Kopie ihrer PDF-Datei; die alten Kopien sind entfernt.',
                ['ABE 55255: PDF-Datei 0a9010a95341 → Beispielkopie b258d215653d', '366-0350-21-WIRD/N1: PDF-Datei fd5dfae9aadd → Beispielkopie 4423c2a2d662'],
            ],
            'system.reset' => [
                ['id' => '20261004-120000-shop', 'level' => 'shop', 'counts' => [['label' => 'Felgen', 'count' => 12], ['label' => 'Bilder', 'count' => 61]], 'environment' => 'staging'],
                "Die Testumgebung wurde zurückgesetzt („Shopdaten“). Entfernt: 12\u{00A0}Felgen, 61\u{00A0}Bilder. Benutzer, Rollen, Einstellungen und das Protokoll sind geblieben.",
                ['Felgen: 12 → 0', 'Bilder: 61 → 0'],
            ],
            'system.reset_undone' => [
                ['id' => '20261004-120000-shop', 'level' => 'shop', 'reset_at' => '2026-10-04T12:00:00+00:00'],
                'Das Zurücksetzen der Testumgebung (Shopdaten) wurde rückgängig gemacht. Der Stand davor ist wieder da; Benutzer, Rollen, Einstellungen und das Protokoll sind geblieben.',
                [],
            ],
            'system.reset_failed' => [
                ['reason' => 'Verweise ins Leere'],
                'Ein Zurücksetzen der Testumgebung ist fehlgeschlagen. Die Datenbank wurde aus der Sicherung wiederhergestellt und ist genauso wie vorher. Grund: Verweise ins Leere',
                [],
            ],
            'system.reset_recovered' => [['id' => '20261004-120000-shop', 'op' => 'reset', 'level' => 'shop'], 'Ein Zurücksetzen der Testumgebung wurde unterbrochen. Die Datenbank wurde aus der Sicherung wiederhergestellt.', []],
            'system.reset_refused' => [
                ['op' => 'reset', 'level' => 'shop', 'when' => 'vor dem Zurücksetzen', 'failures' => [['check' => 'triggers', 'text' => ResetProbe::CHECKS['triggers'], 'detail' => 'es fehlt '.ResetProbe::TRIGGERS['trg_audit_no_update']]]],
                'Ein Zurücksetzen der Testumgebung wurde abgelehnt, bevor sich etwas änderte. Prüfung vor dem Zurücksetzen: Nicht alle Trigger, die das Protokoll und die Prüfnachweise schützen, sind vorhanden – es fehlt der Änderungsschutz des Protokolls.',
                [],
            ],
            'system.reset_backup_removed' => [
                ['id' => '20261004-175904-shop', 'op' => 'reset', 'level' => 'shop', 'at' => '2026-10-04T17:59:04+00:00', 'bytes' => 6_082_560],
                'Die Sicherung des Zurücksetzens vom '.GermanFormat::dateTime(CarbonImmutable::parse('2026-10-04T17:59:04+00:00'))." („Shopdaten“, 5,8\u{00A0}MB) wurde nach 7 Tagen gelöscht. Dieses Zurücksetzen lässt sich nicht mehr rückgängig machen.",
                [],
            ],
            'orders.exported' => [
                ['format' => 'xlsx', 'filters' => ['status' => 'PAID', 'von' => '2026-09-01', 'bis' => '2026-09-26'], 'count' => 12],
                'Bestellungen wurden als Excel-Datei exportiert (Status „Bezahlt“, Zeitraum 01.09.2026 bis 26.09.2026) – 12 Bestellungen.',
                [],
            ],
            'demand.marked' => [['gap' => 'BMW X3 M40i', 'state' => 'watched', 'brand' => null], 'Die Nachfrage-Lücke „BMW X3 M40i“ wurde als beobachtet markiert.', []],
            'demand.unmarked' => [['gap' => 'HSN 0005 · TSN ABC'], 'Die Markierung der Nachfrage-Lücke „HSN 0005 · TSN ABC“ wurde aufgehoben. Sie ist wieder offen.', []],
            'page.created' => [['page' => 'ET richtig lesen', 'slug' => 'et-richtig-lesen'], 'Der Blog-Artikel „ET richtig lesen“ wurde angelegt. Er ist noch nicht veröffentlicht.', []],
            'page.draft_saved' => [['page' => 'Impressum', 'slug' => 'impressum'], 'Für die Seite „Impressum“ wurde ein Entwurf gespeichert.', []],
            'page.draft_discarded' => [['page' => 'Impressum', 'slug' => 'impressum'], 'Der Entwurf der Seite „Impressum“ wurde verworfen.', []],
            'page.published' => [
                ['page' => 'Impressum', 'slug' => 'impressum', 'changes' => ['Abschnitt 1 · Text'], 'note' => 'Text der Kanzlei', 'lawyer_reviewed' => ['old' => false, 'new' => true]],
                'Die Seite „Impressum“ wurde veröffentlicht. Geändert: Abschnitt 1 · Text. Notiz: „Text der Kanzlei“.',
                ['Vom Anwalt geprüft: nein → ja'],
            ],
            'page.withdrawn' => [['page' => 'ET richtig lesen', 'slug' => 'et-richtig-lesen'], 'Der Blog-Artikel „ET richtig lesen“ wurde zurückgezogen und ist nicht mehr im Shop zu sehen.', []],
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
            'wheel.rating_stated' => [
                ['name' => 'Nordfelge Fjord', 'label' => '4,9 (13 Bewertungen)', 'origin' => 'Bewertungen aus unserem eBay-Shop, Stand Oktober 2026.', 'before' => ['label' => '4,7 (9 Bewertungen)', 'origin' => 'Bewertungen aus unserem eBay-Shop, Stand Juli 2026.']],
                'Für die Felge „Nordfelge Fjord“ stehen jetzt Sterne von Hand im Shop: 4,9 (13 Bewertungen). Daneben steht: „Bewertungen aus unserem eBay-Shop, Stand Oktober 2026.“',
                ['Sterne: 4,7 (9 Bewertungen) → 4,9 (13 Bewertungen)', 'Satz daneben: „Bewertungen aus unserem eBay-Shop, Stand Juli 2026.“ → „Bewertungen aus unserem eBay-Shop, Stand Oktober 2026.“'],
            ],
            'wheel.rating_removed' => [['name' => 'Nordfelge Fjord', 'label' => '4,9 (13 Bewertungen)', 'origin' => 'Bewertungen aus unserem eBay-Shop.'], 'Die Sterne von Hand der Felge „Nordfelge Fjord“ – 4,9 (13 Bewertungen) – wurden entfernt. Der Shop zeigt sie nicht mehr.', []],
            'page.image_uploaded' => [['page' => 'Felgen richtig auswählen', 'file' => '01jabc.jpg'], 'Für den Blog-Artikel „Felgen richtig auswählen“ wurde ein Bild hochgeladen („01jabc.jpg“). Im Shop erscheint es erst, wenn ein Entwurf mit diesem Bild veröffentlicht wird.', []],
            'tyre.created' => [['name' => 'Continental PremiumContact 7 225/45 R18 95Y', 'offered' => false], 'Der Reifen „Continental PremiumContact 7 225/45 R18 95Y“ wurde angelegt; der Shop bietet ihn nicht an – er ist nicht verfügbar oder sein EU-Reifenlabel ist unvollständig.', []],
            'tyre.updated' => [['name' => 'Continental PremiumContact 7 225/45 R18 95Y', 'changed' => ['eprel_id', 'price_cents'], 'offered' => true], 'Der Reifen „Continental PremiumContact 7 225/45 R18 95Y“ wurde geändert (EPREL-Nummer, Preis); der Shop bietet ihn an.', []],
            'tyre.deleted' => [['name' => 'Continental PremiumContact 7 225/45 R18 95Y'], 'Der Reifen „Continental PremiumContact 7 225/45 R18 95Y“ wurde entfernt.', []],
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
            'approval.taken_back' => [
                ['document' => 'Teilegutachten 1810080716', 'rows' => 2, 'reason' => 'Eingetragen ist eine von sechs Auflagen.'],
                'Die Freigabe von „Teilegutachten 1810080716“ wurde zurückgenommen: 2 Zeilen sind wieder Entwurf und nicht mehr im Shop. Grund: „Eingetragen ist eine von sechs Auflagen“.',
                [],
            ],
            'approval.completeness_answered' => [
                ['document' => 'ABE 53841', 'completeness' => 'partial', 'missing' => 'Anlagen 1–15', 'before' => null, 'revision' => 1],
                'Zu „ABE 53841“ wurde festgehalten: teilweise erfasst – es fehlen: Anlagen 1–15.',
                [],
            ],
            'approval.counted' => [
                ['document' => 'Teilegutachten 1810080716', 'count' => ['codes' => 6, 'codesPage' => 3, 'sizes' => 3, 'sizesPage' => 3, 'axleLimitKg' => 1160, 'axleLimitPage' => 3, 'abnahme' => 'all', 'abnahmePage' => 4], 'before' => null, 'rows' => 0],
                "Zu „Teilegutachten 1810080716“ wurde der Verwendungsbereich gezählt, bevor die erste Zeile stand: 6 Auflagen-Codes (Seite 3) · 3 Reifengrößen (Seite 3) · Achslast höchstens 1.160\u{00A0}kg (Seite 3) · Abnahme bei jeder Kombination (Seite 4).",
                [],
            ],
            'approval.count_changed' => [
                [
                    'document' => 'Teilegutachten 1810080716',
                    'count' => ['codes' => 6, 'codesPage' => 3, 'sizes' => 3, 'sizesPage' => 3, 'axleLimitKg' => null, 'axleLimitPage' => null, 'abnahme' => 'all', 'abnahmePage' => 4],
                    'before' => ['codes' => 1, 'codesPage' => 3, 'sizes' => 3, 'sizesPage' => 3, 'axleLimitKg' => null, 'axleLimitPage' => null, 'abnahme' => 'none', 'abnahmePage' => null],
                    'rows' => 2,
                ],
                'Die Zählung zu „Teilegutachten 1810080716“ wurde geändert, als schon 2 Zeilen standen.',
                ['Auflagen-Codes: 1 Auflagen-Code (Seite 3) → 6 Auflagen-Codes (Seite 3)', 'Abnahme: keine Abnahme → Abnahme bei jeder Kombination (Seite 4)'],
            ],
            'approval.revision_started' => [
                ['document' => 'Teilegutachten 1810080716', 'from' => 'Teilegutachten 1810080716', 'revision' => 2, 'rows' => 2],
                'Zu „Teilegutachten 1810080716“ wurde Fassung 2 als Entwurf angelegt, mit 2 Zeilen.',
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
            'approval.condition_level_set' => [
                ['document' => 'ABE 55255', 'code' => 'S03', 'old' => 'auflage', 'level' => 'hinweis'],
                'In „ABE 55255“ hat der Code „S03“ jetzt die Stufe „Hinweis – nichts zu tun“.',
                ['Stufe: Auflage – etwas ist zu tun oder eingeschränkt → Hinweis – nichts zu tun'],
            ],
            'approval.fastener_added' => [['document' => 'ABE 55255', 'what' => 'S01 · M14x1,25 · Kegelbund 60°'], 'Zu „ABE 55255“ wurde das Befestigungsmittel „S01 · M14x1,25 · Kegelbund 60°“ eingetragen.', []],
            'approval.fastener_removed' => [['document' => 'ABE 55255', 'what' => 'S01 · M14x1,25 · Kegelbund 60°'], 'Aus „ABE 55255“ wurde das Befestigungsmittel „S01 · M14x1,25 · Kegelbund 60°“ entfernt.', []],
            'approval.notice_added' => [['document' => 'ABE 55255', 'what' => 'Radschrauben nach 50 km nachziehen.'], 'Zu „ABE 55255“ wurde der Pflichthinweis „Radschrauben nach 50 km nachziehen.“ eingetragen.', []],
            'approval.notice_removed' => [['document' => 'ABE 55255', 'what' => 'Radschrauben nach 50 km nachziehen.'], 'Aus „ABE 55255“ wurde der Pflichthinweis „Radschrauben nach 50 km nachziehen.“ entfernt.', []],
            'approval.rework_added' => [['document' => 'ABE 55255', 'what' => 'K42 · 3C · von 15 bis 30 mm'], 'Zu „ABE 55255“ wurde das Maß der Nacharbeit „K42 · 3C · von 15 bis 30 mm“ eingetragen.', []],
            'approval.rework_removed' => [['document' => 'ABE 55255', 'what' => 'K42 · 3C · von 15 bis 30 mm'], 'Aus „ABE 55255“ wurde das Maß der Nacharbeit „K42 · 3C · von 15 bis 30 mm“ entfernt.', []],
            'approval.derating_saved' => [['document' => 'ABE 55255', 'rows' => 10], 'Für „ABE 55255“ wurde die Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit gespeichert (10 Zeilen).', []],
            'approval.derating_removed' => [['document' => 'ABE 55255'], 'Aus „ABE 55255“ wurde die Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit entfernt.', []],
            'approval.combinations_saved' => [['document' => 'TG 1810080716', 'combinations' => 4, 'before' => 0], 'Für „TG 1810080716“ wurden die Bereifungskombinationen gespeichert (4 Kombinationen).', []],
            'approval.combinations_removed' => [['document' => 'TG 1810080716', 'combinations' => 0, 'before' => 4], 'Aus „TG 1810080716“ wurden die Bereifungskombinationen entfernt.', []],
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
            'vehicle.created_manually' => [
                ['vehicle' => 'Beispielmarke Muster 1.6 Limousine · HSN 0000 · TSN AAA', 'eg' => 'e1*2007/46*0001*00', 'complete' => false],
                'Das Fahrzeug „Beispielmarke Muster 1.6 Limousine · HSN 0000 · TSN AAA“ wurde von Hand aus den Fahrzeugpapieren angelegt, mit der EG-Typgenehmigungsnummer „e1*2007/46*0001*00“; es fehlen noch Angaben.',
                [],
            ],
            'vehicle.import_applied' => [
                ['file' => 'fahrzeuge.csv', 'source' => 'import_kba', 'summary' => ['create' => 2, 'update' => 0, 'unchanged' => 4, 'merge' => 1, 'kept' => 3, 'refused' => 1, 'unread' => 1]],
                'Der Fahrzeugdatensatz „fahrzeuge.csv“ wurde importiert: 2 Fahrzeuge neu, 1 ergänzt, 1 abgelehnt.',
                [],
            ],
            'order.shipped' => [['order' => 'RMF-2026-1001', 'tracking' => '00340434 1234'], 'Die Bestellung „RMF-2026-1001“ wurde als versendet markiert, Sendungsnummer „00340434 1234“.', []],
            'order.delivered' => [['order' => 'RMF-2026-1001'], 'Die Bestellung „RMF-2026-1001“ wurde als zugestellt markiert. Einige Tage danach lädt der Shop zur Bewertung ein.', []],
            // The admin audit's F-35: written for months, read as „noch nicht in Worten“.
            'order.status_changed' => [['order' => 'RMF-2026-1001', 'from' => 'PENDING_PAYMENT', 'to' => 'PAID', 'event_id' => 'evt1'], 'Der Status der Bestellung „RMF-2026-1001“ wechselte von „Wartet auf Zahlung“ zu „Bezahlt“.', []],
            'order.confirmation_sent' => [['order' => 'RMF-2026-1001', 'invoice' => 'TEST-RE-000001'], 'Die Bestellbestätigung zur Bestellung „RMF-2026-1001“ wurde verschickt, mit der Rechnung „TEST-RE-000001“.', []],
            'order.confirmation_failed' => [['order' => 'RMF-2026-1001', 'error' => 'Connection refused'], 'Die Bestellbestätigung zur Bestellung „RMF-2026-1001“ konnte nicht verschickt werden. Meldung: Connection refused', []],
            'order.shipping_mail_sent' => [['order' => 'RMF-2026-1001', 'tracking' => '00340434 1234'], 'Die Versandmail zur Bestellung „RMF-2026-1001“ wurde verschickt, mit der Sendungsnummer „00340434 1234“.', []],
            'order.shipping_mail_failed' => [['order' => 'RMF-2026-1001', 'error' => '554 Message rejected'], 'Die Versandmail zur Bestellung „RMF-2026-1001“ konnte nicht verschickt werden. Meldung: 554 Message rejected', []],
            'order.refunded' => [
                ['order' => 'RMF-2026-1001', 'amount_cents' => 39_900, 'status' => 'succeeded', 'refund' => 're1', 'reason' => 'Eine Felge zurückgeschickt'],
                "Zur Bestellung „RMF-2026-1001“ wurden 399,00\u{202F}€ erstattet. Grund: „Eine Felge zurückgeschickt“.",
                [],
            ],
            'order.refund_refused' => [
                ['order' => 'RMF-2026-1001', 'amount_cents' => 1000, 'error' => 'Charge has already been refunded.'],
                "Eine Erstattung von 10,00\u{202F}€ zur Bestellung „RMF-2026-1001“ wurde abgelehnt; erstattet wurde nichts. Meldung: Charge has already been refunded.",
                [],
            ],
            'order.refund_paper_failed' => [
                ['order' => 'RMF-2026-1001', 'error' => 'PDF nicht erzeugt'],
                'Zur Erstattung der Bestellung „RMF-2026-1001“ ließ sich die Gutschrift nicht erstellen oder die Mail nicht verschicken. Die Erstattung selbst ist gebucht. Meldung: PDF nicht erzeugt',
                [],
            ],
            'invoice.failed' => [['order' => 'RMF-2026-1001', 'error' => 'PDF nicht erzeugt'], 'Zur Bestellung „RMF-2026-1001“ konnte die Rechnung nicht ausgestellt werden; die Bestellung bleibt bezahlt. Meldung: PDF nicht erzeugt', []],
            'invoice.series_opened' => [
                ['invoice_first' => 'RE-2026-000001', 'credit_note_first' => 'GS-2026-000001', 'operator' => 'Anna Admin'],
                'Die echten Rechnungsnummern wurden eröffnet: Die erste Rechnung trägt die Nummer „RE-2026-000001“, die erste Gutschrift „GS-2026-000001“.',
                [],
            ],
            'dispute.evidence_submitted' => [
                ['dispute' => 'dp1', 'order' => 'RMF-2026-1001', 'files' => ['lieferschein.pdf', 'foto.jpg'], 'receipt' => 'RE-2026-000001'],
                'Zur Rückbuchung der Bestellung „RMF-2026-1001“ wurden Nachweise an Stripe geschickt: 2 Dateien, die Rechnung „RE-2026-000001“ als Beleg.',
                [],
            ],
            'settings.seller_shipping_updated' => [
                ['first' => false, 'changes' => [
                    'seller.city' => ['old' => 'Köln', 'new' => 'Düsseldorf'],
                    'seller.not_applicable' => ['old' => [], 'new' => ['phone']],
                    'shipping.zones' => ['old' => ['DE' => ['cost_cents' => null, 'free_from_cents' => null]], 'new' => ['DE' => ['cost_cents' => 490, 'free_from_cents' => 50_000]]],
                ]],
                'Die Angaben zu Verkäufer und Versand wurden geändert: Ort, Häkchen bei „Entfällt“, Versandkosten.',
                ['Ort: Köln → Düsseldorf', 'Häkchen bei „Entfällt“: – → Telefon', "Versandkosten: nicht festgelegt → 4,90\u{202F}€, versandkostenfrei ab 500,00\u{202F}€"],
            ],
            'payments.settings_updated' => [
                ['changed' => ['Modus', 'Geheimer Schlüssel'], 'mode' => ['old' => 'test', 'new' => 'live'], 'publishable_last4' => ['old' => 'ab12', 'new' => 'ab12'], 'signing_key_last4' => ['old' => 'cd34', 'new' => 'ef56'], 'webhook_last4' => ['old' => null, 'new' => null]],
                'Die Zahlungseinstellungen wurden geändert: Modus, Geheimer Schlüssel.',
                ['Modus: Testmodus → Livemodus', 'Geheimer Schlüssel: …cd34 → …ef56'],
            ],
            'payments.connection_tested' => [['ok' => true, 'account' => 'RIMIFY GmbH', 'error' => null], 'Die Verbindung zu Stripe wurde geprüft und steht (Konto „RIMIFY GmbH“).', []],
            'vehicle.corrected' => [
                [
                    'vehicle' => 'Prüfwerk Größe Eins 1.6 Limousine · HSN 0005 · TSN ZZ8',
                    'old' => ['make' => 'Prüfwrek', 'power_kw' => 900, 'build_from' => '2019-03-01', 'build_to' => null],
                    'new' => ['make' => 'Prüfwerk', 'power_kw' => 90, 'build_from' => '2019-03-01', 'build_to' => '2023-12-31'],
                ],
                'Die Angaben des Fahrzeugs „Prüfwerk Größe Eins 1.6 Limousine · HSN 0005 · TSN ZZ8“ wurden korrigiert: Hersteller, Leistung in kW, Gebaut bis.',
                ['Hersteller: Prüfwrek → Prüfwerk', 'Leistung in kW: 900 → 90', 'Gebaut bis: – → 12.2023'],
            ],
            'brand.manufacturer_updated' => [['brand_id' => 3, 'name' => 'Borbet', 'changed' => ['manufacturer_name'], 'complete' => false], 'Die Herstellerangaben der Marke „Borbet“ wurden gespeichert; es fehlen noch Angaben.', []],
            'order.test_stock_returned' => [
                ['order' => 'RMF-2026-1029', 'quantity' => 1],
                'Die Testbestellung „RMF-2026-1029“ war nur mit der Testzahlung bezahlt; die bestellte Ware (1 Stück) ist wieder auf Lager.',
                [],
            ],
            'reviews.invited' => [['count' => 3], '3 Einladungen zur Bewertung wurden verschickt.', []],
            'review.hidden' => [['review' => 7, 'order' => 'RMF-2026-1001', 'reason' => 'Werbung.'], 'Eine Bewertung zur Bestellung „RMF-2026-1001“ wurde ausgeblendet: „Werbung.“.', []],
            'review.shown' => [['review' => 7, 'order' => 'RMF-2026-1001'], 'Eine Bewertung zur Bestellung „RMF-2026-1001“ wurde wieder eingeblendet.', []],
            'review.replied' => [['review' => 7, 'order' => 'RMF-2026-1001'], 'Auf eine Bewertung zur Bestellung „RMF-2026-1001“ wurde geantwortet.', []],
            'review.reply_removed' => [['review' => 7, 'order' => 'RMF-2026-1001'], 'Die Antwort auf eine Bewertung zur Bestellung „RMF-2026-1001“ wurde entfernt.', []],
            'page.placeholder_switched' => [
                ['page' => 'Muster-Widerrufsformular', 'slug' => 'widerrufsbelehrung', 'part' => 'formular', 'placeholder' => ['old' => false, 'new' => true]],
                'Beim Muster-Widerrufsformular wurde der Platzhalter eingeschaltet: Besucher sehen statt des Textes nur noch den Hinweis, dass der Text der Kanzlei folgt.',
                [],
            ],
            'page.revision_restored' => [
                ['page' => 'Startseite', 'slug' => 'startseite', 'revision' => 3, 'revision_at' => '2026-09-26T12:00:00+00:00'],
                'Für die Seite „Startseite“ wurde die Version vom '.GermanFormat::dateTime(CarbonImmutable::parse('2026-09-26T12:00:00+00:00')).' als Entwurf geladen.',
                [],
            ],
        ];

        // A new event in the describer without a case here fails this test rather than going unread.
        expect(array_keys($cases))->toEqualCanonicalizing(AuditDescriber::knownEvents())
            // …and an event the code writes that the describer does not know fails it too (the admin audit's F-35):
            // thirteen were written for months and read „noch nicht in Worten“, a refund and a key change among them.
            ->and(array_values(array_diff(protokollEventsWritten(), AuditDescriber::knownEvents())))->toBe([])
            // The source was read, not skipped: a scan that finds nothing would pass the line above for nothing.
            ->and(count(protokollEventsWritten()))->toBeGreaterThan(90);

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

    it('names an undo as an undo, and says at „Demodaten“ that the demo team went and came back', function (): void {
        $admin = protokollAdmin();
        $describer = app(AuditDescriber::class);
        $sentence = static fn (string $event, array $properties): string => $describer->describe(protokollEntry($admin, $event, $properties))['sentence'];
        $failure = ['check' => 'snapshot_update', 'text' => ResetProbe::CHECKS['snapshot_update'], 'detail' => 'die Anweisung ging durch'];

        expect($sentence('system.reset_refused', ['op' => 'undo', 'level' => 'shop', 'when' => 'vor dem Rückgängigmachen', 'failures' => [$failure]]))
            ->toBe('Das Rückgängigmachen eines Zurücksetzens der Testumgebung wurde abgelehnt, bevor sich etwas änderte. Prüfung vor dem Rückgängigmachen: Eine Änderung an einem Prüfnachweis wurde nicht abgelehnt (erwartet: SQLSTATE 45000) – die Anweisung ging durch.')
            // Written before entries carried `op`: the undo's id says what it was.
            ->and($sentence('system.reset_failed', ['id' => '20261004-130000-undo', 'reason' => 'Verweise ins Leere']))
            ->toBe('Das Rückgängigmachen eines Zurücksetzens der Testumgebung ist fehlgeschlagen. Die Datenbank wurde aus der Sicherung wiederhergestellt und ist genauso wie vorher. Grund: Verweise ins Leere')
            ->and($sentence('system.reset_failed', ['id' => '20261004-120000-shop', 'op' => 'reset', 'reason' => 'x', 'failures' => [$failure], 'put_back' => 'unchecked', 'put_back_failures' => [$failure]]))
            ->toBe('Ein Zurücksetzen der Testumgebung ist fehlgeschlagen. Die Sicherung ist zurückgespielt, aber auch danach schlägt die Prüfung fehl; der Shop bleibt im Wartungsmodus. Nach dem Zurückspielen: Eine Änderung an einem Prüfnachweis wurde nicht abgelehnt (erwartet: SQLSTATE 45000) – die Anweisung ging durch. Fehlgeschlagen: Eine Änderung an einem Prüfnachweis wurde nicht abgelehnt (erwartet: SQLSTATE 45000) – die Anweisung ging durch.')
            ->and($sentence('system.reset_recovered', ['id' => '20261004-130000-undo', 'op' => 'undo', 'level' => 'shop']))
            ->toBe('Das Rückgängigmachen eines Zurücksetzens der Testumgebung wurde unterbrochen. Die Datenbank wurde aus der Sicherung wiederhergestellt.')
            ->and($sentence('system.reset', ['id' => '20261004-120000-demo', 'level' => 'demo', 'counts' => [['label' => 'Konten des Demo-Teams', 'count' => 4]]]))
            ->toBe("Die Testumgebung wurde zurückgesetzt („Demodaten“). Entfernt: 4\u{00A0}Konten des Demo-Teams. Die übrigen Benutzer und Protokolleinträge sind geblieben.")
            ->and($sentence('system.reset_undone', ['id' => '20261004-120000-demo', 'level' => 'demo']))
            ->toBe('Das Zurücksetzen der Testumgebung (Demodaten) wurde rückgängig gemacht. Die Demodaten sind wieder da, auch das Demo-Team und seine Protokolleinträge. Die übrigen Benutzer und Protokolleinträge sind geblieben.')
            ->and($sentence('system.reset_backup_removed', ['id' => '20261004-130000-undo', 'op' => 'undo', 'at' => '2026-10-04T13:00:00+00:00', 'bytes' => 629_146]))
            ->toBe('Die Sicherung vor dem Rückgängigmachen vom '.GermanFormat::dateTime(CarbonImmutable::parse('2026-10-04T13:00:00+00:00'))." (0,6\u{00A0}MB) wurde nach 7 Tagen gelöscht.");
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
