<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\OrderStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AuditLog;
use App\Services\Admin\Orders\OrderList;
use App\Services\Content\NavigationSchema;
use App\Services\Demo\DemoTables;
use App\Support\GermanFormat;
use App\Support\MakeName;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Turns one audit entry into what a person reads in the Protokoll: a full German sentence, the area
 * of the panel it belongs to, and the values before and after (docs/admin/team-build-plan.md).
 *
 * An entry stores an event name and its properties — codes, ids, cents. None of that is shown: the
 * sentence is written the way R-15 writes a condition, as a sentence, never as `role_permission.
 * updated`. Money goes through GermanFormat, a right through the same German words the Rollen &
 * Rechte grid uses, a switch as erlaubt/nicht erlaubt or aktiv/inaktiv.
 *
 * Two things this never does. It never prints a secret: any property whose key names a password,
 * token or secret is dropped before anything is read, even though no writer is meant to store one.
 * And it never guesses: an event it does not know gets a sentence that says so, and a value that was
 * not recorded reads "nicht erfasst", not an invented "before".
 *
 * @phpstan-type Change array{label: string, before: string, after: string}
 * @phpstan-type Description array{sentence: string, area: string, changes: list<Change>}
 */
final class AuditDescriber
{
    /** The Protokoll's areas, as the filter offers them: key in the query string => German label. */
    public const AREAS = [
        'verkauf' => 'Verkauf',
        'team' => 'Team',
        'katalog' => 'Katalog',
        'gutachten' => 'Gutachten',
        'inhalte' => 'Inhalte',
        'konto' => 'Konto',
        'zugriff' => 'Zugriff',
        'protokoll' => 'Protokoll',
        'sonstiges' => 'Sonstiges',
    ];

    /** Where every event this panel writes belongs. An event not listed here is `sonstiges`. */
    private const EVENTS = [
        'role.created' => 'team',
        'role.updated' => 'team',
        'role.duplicated' => 'team',
        'role.deleted' => 'team',
        'role_permission.updated' => 'team',
        'role_permissions.replaced' => 'team',
        'admin.invited' => 'team',
        'admin.invitation_resent' => 'team',
        'admin.invitation_revoked' => 'team',
        'admin.invitation_accepted' => 'team',
        'admin.role_changed' => 'team',
        'admin.suspended' => 'team',
        'admin.reactivated' => 'team',
        'admin.sessions_revoked' => 'team',
        'admin.password_changed' => 'konto',
        'permission.denied' => 'zugriff',
        'weight_colour.created' => 'katalog',
        'weight_colour.updated' => 'katalog',
        'weight_colour.deleted' => 'katalog',
        'mounting_fee.updated' => 'katalog',
        'tpms_price.created' => 'katalog',
        'tpms_price.updated' => 'katalog',
        'tpms_price.deleted' => 'katalog',
        'tpms_default_price.updated' => 'katalog',
        'audit_log.exported' => 'protokoll',
        'orders.exported' => 'verkauf',
        'demo.purged' => 'protokoll',
        'storage.settings_updated' => 'zugriff',
        'demand.marked' => 'gutachten',
        'demand.unmarked' => 'gutachten',
        'page.created' => 'inhalte',
        'page.draft_saved' => 'inhalte',
        'page.draft_discarded' => 'inhalte',
        'page.published' => 'inhalte',
        'page.withdrawn' => 'inhalte',
        'page.revision_restored' => 'inhalte',
        'faq.created' => 'inhalte',
        'faq.updated' => 'inhalte',
        'faq.deleted' => 'inhalte',
        'faq.reordered' => 'inhalte',
        'nav.created' => 'inhalte',
        'nav.updated' => 'inhalte',
        'nav.deleted' => 'inhalte',
        'nav.reordered' => 'inhalte',
    ];

    /**
     * The fields a before → after may name, in the order they are listed, with how each value reads.
     * A key not listed here (ids, slugs, timestamps, the currency) is never shown: it is either
     * derived from a field that is, or a code.
     */
    private const FIELDS = [
        'label' => ['Bezeichnung', 'text'],
        'name_de' => ['Bezeichnung', 'text'],
        'make_label_de' => ['Marke', 'text'],
        'description' => ['Beschreibung', 'text'],
        'swatch_hex' => ['Farbwert', 'text'],
        'surcharge_cents' => ['Aufpreis je Rad', 'money'],
        'price_cents' => ['Preis je Sensor', 'money'],
        'is_default' => ['Standardfarbe', 'yesno'],
        'active' => ['Status', 'active'],
        'sort_order' => ['Reihenfolge', 'int'],
    ];

    /** A property whose key matches this is removed before anything else happens. */
    private const SECRET = '/pass(?:word|wort)?|token|secret|hash|remember|totp|recovery|api[_-]?key/i';

    /** Where a denied request was headed, by the first two parts of its route name. */
    private const PAGES = [
        'admin.wuchtgewichte' => 'Zubehörpreise › Wuchtgewichte',
        'admin.rdks' => 'Zubehörpreise › RDKS-Sensoren',
        'admin.rollen' => 'Rollen & Rechte',
        'admin.benutzer' => 'Benutzer',
        'admin.protokoll' => 'Protokoll',
        'admin.gutachten' => 'Gutachten',
        'admin.anfragen' => 'Anfragen',
        'admin.bestellungen' => 'Bestellungen',
        'admin.system' => 'Systemzustand',
        'admin.abdeckung' => 'Abdeckung',
        'admin.nachfrage' => 'Nachfrage',
        'admin.benachrichtigungen' => 'Benachrichtigungen',
        'admin.profil' => 'Profil',
        'admin.seiten' => 'Seiten',
        'admin.faq' => 'FAQ',
        'admin.navigation' => 'Navigation',
    ];

    /** What a denied request tried to do, as the infinitive that completes „Der Versuch, …". */
    private const ABILITIES = [
        'viewAny' => 'etwas anzusehen',
        'view' => 'etwas anzusehen',
        'create' => 'etwas anzulegen',
        'update' => 'etwas zu ändern',
        'delete' => 'etwas zu löschen',
        'restore' => 'etwas wiederherzustellen',
        'forceDelete' => 'etwas endgültig zu löschen',
        'publish' => 'etwas zu veröffentlichen',
        'export' => 'etwas zu exportieren',
    ];

    private const NOTHING = '–';

    private const NOT_RECORDED = 'nicht erfasst';

    /** @var array<int, string|null> */
    private array $roleLabels = [];

    /** @var array<int, string|null> */
    private array $colourNames = [];

    /** @var array<string, string> */
    private array $makeLabels = [];

    /**
     * @return Description
     */
    public function describe(AuditLog $entry): array
    {
        $event = (string) $entry->description;
        $properties = self::withoutSecrets($entry->properties?->toArray() ?? []);

        [$sentence, $changes] = $this->explain($event, $properties, $entry);

        return [
            'sentence' => $sentence,
            'area' => self::areaLabel($event),
            'changes' => $changes,
        ];
    }

    /** The German label of the area an event belongs to. */
    public static function areaLabel(string $event): string
    {
        return self::AREAS[self::EVENTS[$event] ?? 'sonstiges'];
    }

    /**
     * The events that make up one area, for the filter. `sonstiges` has none of its own — it is
     * everything *not* in knownEvents() — so the caller asks for that with a NOT IN.
     *
     * @return list<string>
     */
    public static function eventsIn(string $area): array
    {
        return array_keys(array_filter(self::EVENTS, static fn (string $a): bool => $a === $area));
    }

    /** @return list<string> */
    public static function knownEvents(): array
    {
        return array_keys(self::EVENTS);
    }

    /**
     * @param  array<array-key, mixed>  $p
     * @return array{0: string, 1: list<Change>}
     */
    private function explain(string $event, array $p, AuditLog $entry): array
    {
        return match ($event) {
            'role.created' => [
                self::text($p, 'copied_from_label') === null
                    ? 'Die Rolle '.self::q(self::text($p, 'label') ?? 'ohne Namen').' wurde angelegt.'
                    : 'Die Rolle '.self::q(self::text($p, 'label') ?? 'ohne Namen').' wurde als Kopie von '
                        .self::q((string) self::text($p, 'copied_from_label')).' angelegt.',
                [],
            ],
            'role.updated' => $this->roleUpdated($p),
            'role.duplicated' => [
                'Die Rolle '.self::q(self::text($p, 'copied_from_label') ?? 'ohne Namen').' wurde dupliziert; die Kopie heißt '
                    .self::q(self::text($p, 'label') ?? 'ohne Namen').'.',
                [],
            ],
            'role.deleted' => ['Die Rolle '.self::q(self::text($p, 'label') ?? 'ohne Namen').' wurde gelöscht.', []],
            'role_permission.updated' => $this->permissionUpdated($p),
            'role_permissions.replaced' => $this->permissionsReplaced($p),
            'admin.invited' => [
                self::text($p, 'role_label') === null
                    ? 'Die Einladung an '.self::address($p).' wurde verschickt.'
                    : 'Die Einladung an '.self::address($p).' mit der Rolle '.self::q((string) self::text($p, 'role_label')).' wurde verschickt.',
                [],
            ],
            'admin.invitation_resent' => ['Die Einladung an '.self::address($p).' wurde noch einmal verschickt.', []],
            'admin.invitation_revoked' => ['Die Einladung an '.self::address($p).' wurde widerrufen.', []],
            'admin.invitation_accepted' => [
                self::text($p, 'role_label') === null
                    ? 'Die Einladung an '.self::address($p).' wurde angenommen.'
                    : 'Die Einladung an '.self::address($p).' wurde angenommen; das Konto hat die Rolle '
                        .self::q((string) self::text($p, 'role_label')).'.',
                [],
            ],
            'admin.role_changed' => [
                'Das Konto '.self::address($p).' hat jetzt die Rolle '.self::q(self::text($p, 'new_role_label') ?? 'ohne Namen').'.',
                [self::change('Rolle', self::text($p, 'old_role_label') ?? self::NOTHING, self::text($p, 'new_role_label') ?? self::NOTHING)],
            ],
            'admin.suspended' => ['Das Konto '.self::address($p).' wurde gesperrt.', []],
            'admin.reactivated' => ['Das Konto '.self::address($p).' wurde wieder entsperrt.', []],
            'admin.sessions_revoked' => ['Das Konto '.self::address($p).' wurde auf allen Geräten abgemeldet.', []],
            'admin.password_changed' => ['Das eigene Passwort wurde geändert.', []],
            'permission.denied' => [self::denied($p), []],
            'weight_colour.created' => [
                'Die Wuchtgewichte-Farbe '.self::q($this->colourName($p, $entry)).' wurde angelegt.',
                self::created($p),
            ],
            'weight_colour.updated' => [
                'Die Wuchtgewichte-Farbe '.self::q($this->colourName($p, $entry)).' wurde geändert.',
                self::diff(self::map($p, 'old'), self::map($p, 'attributes')),
            ],
            'weight_colour.deleted' => ['Die Wuchtgewichte-Farbe '.self::q($this->colourName($p, $entry)).' wurde gelöscht.', []],
            'mounting_fee.updated' => [
                'Der Preis für Montage und Auswuchten wurde geändert.',
                [self::change('Montage und Auswuchten je Rad', self::money($p['old_cents'] ?? null), self::money($p['cents'] ?? null))],
            ],
            'tpms_price.created' => [
                'Der RDKS-Sensorpreis für '.$this->makeLabel($p).' wurde angelegt.',
                self::created($p),
            ],
            'tpms_price.updated' => [
                'Der RDKS-Sensorpreis für '.$this->makeLabel($p).' wurde geändert.',
                self::diff(self::map($p, 'old'), self::map($p, 'attributes') + self::map($p, 'new')),
            ],
            'tpms_price.deleted' => ['Der RDKS-Sensorpreis für '.$this->makeLabel($p).' wurde gelöscht.', []],
            'tpms_default_price.updated' => [
                'Der Standardpreis für RDKS-Sensoren wurde geändert.',
                [self::change('Standardpreis je Sensor', self::money($p['old_cents'] ?? null), self::money($p['cents'] ?? null))],
            ],
            'audit_log.exported' => [self::exported($p), []],
            'demo.purged' => self::demoPurged($p),
            'storage.settings_updated' => self::storageUpdated($p),
            'orders.exported' => [self::ordersExported($p), []],
            'demand.marked' => [self::demandMarked($p), []],
            'demand.unmarked' => ['Die Markierung der Nachfrage-Lücke '.self::q(self::text($p, 'gap') ?? 'ohne Namen').' wurde aufgehoben. Sie ist wieder offen.', []],
            'page.created' => ['Der Ratgeber-Artikel '.self::page($p).' wurde angelegt. Er ist noch nicht veröffentlicht.', []],
            'page.draft_saved' => ['Für die Seite '.self::page($p).' wurde ein Entwurf gespeichert.', []],
            'page.draft_discarded' => ['Der Entwurf der Seite '.self::page($p).' wurde verworfen.', []],
            'page.published' => self::pagePublished($p),
            'page.withdrawn' => ['Der Ratgeber-Artikel '.self::page($p).' wurde zurückgezogen und ist nicht mehr im Shop zu sehen.', []],
            'page.revision_restored' => [self::revisionRestored($p), []],
            'faq.created' => [
                'Die Frage '.self::q(self::text($p, 'question') ?? 'ohne Text').' wurde angelegt'
                    .(($p['published'] ?? false) === true ? ' und ist im Shop zu sehen.' : '; sie ist noch ausgeblendet.'),
                [],
            ],
            'faq.updated' => self::faqUpdated($p),
            'faq.deleted' => ['Die Frage '.self::q(self::text($p, 'question') ?? 'ohne Text').' wurde gelöscht.', []],
            'faq.reordered' => ['Die Reihenfolge der FAQ wurde geändert.', []],
            'nav.created' => ['Im Menü '.self::menu($p).' wurde der Eintrag '.self::q(self::text($p, 'label') ?? 'ohne Namen').' angelegt.', []],
            'nav.updated' => [
                'Im Menü '.self::menu($p).' wurde der Eintrag '.self::q(self::text($p, 'label') ?? 'ohne Namen').' geändert.',
                self::navChanges($p),
            ],
            'nav.deleted' => ['Aus dem Menü '.self::menu($p).' wurde der Eintrag '.self::q(self::text($p, 'label') ?? 'ohne Namen').' gelöscht.', []],
            'nav.reordered' => ['Die Reihenfolge im Menü '.self::menu($p).' wurde geändert.', []],
            default => [
                'Hier wurde etwas geändert, das das Protokoll noch nicht in Worten beschreiben kann.',
                self::diff(self::map($p, 'old'), self::map($p, 'attributes') + self::map($p, 'new')),
            ],
        };
    }

    /**
     * „Die Demodaten wurden entfernt: 1.234 Datensätze, eingespielt bis zum 27.09.2026." — and per
     * table how many there were and that none are left (R-12: every purge says what it took).
     *
     * @param  array<array-key, mixed>  $p
     * @return array{0: string, 1: list<Change>}
     */
    private static function demoPurged(array $p): array
    {
        $total = is_numeric($p['total'] ?? null) ? (int) $p['total'] : 0;
        $anchor = self::day(self::text($p, 'anchor'));
        $sentence = 'Die Demodaten wurden entfernt: '.($total === 1 ? 'ein Datensatz' : GermanFormat::decimal($total, 0).' Datensätze')
            .($anchor === null ? '.' : ", eingespielt bis zum {$anchor}.");
        $changes = [];

        foreach (self::map($p, 'tables') as $table => $count) {
            if (is_string($table) && is_numeric($count)) {
                $changes[] = self::change(DemoTables::LABELS[$table] ?? $table, GermanFormat::decimal((int) $count, 0), '0');
            }
        }

        return [$sentence, $changes];
    }

    /**
     * „Die Speicher-Einstellungen wurden geändert: Bucket, Geheimer Schlüssel. Sie gelten ab jetzt.“ —
     * the keys only as their last four characters, before and after (never a key).
     *
     * @param  array<array-key, mixed>  $p
     * @return array{0: string, 1: list<Change>}
     */
    private static function storageUpdated(array $p): array
    {
        $fields = array_values(array_filter(is_array($p['changed'] ?? null) ? $p['changed'] : [], 'is_string'));
        $sentence = 'Die Speicher-Einstellungen wurden '.($fields === [] ? 'gespeichert' : 'geändert: '.implode(', ', $fields)).'.'
            .(($p['active'] ?? false) === true ? ' Sie gelten ab jetzt.' : ' Die Verbindung klappte damit nicht; es gelten weiter die bisherigen.');
        $changes = [];

        foreach (['key_last4' => 'Zugriffsschlüssel', 'signing_key_last4' => 'Geheimer Schlüssel'] as $key => $label) {
            $pair = self::map($p, $key);
            $old = is_string($pair['old'] ?? null) ? '…'.$pair['old'] : self::NOTHING;
            $new = is_string($pair['new'] ?? null) ? '…'.$pair['new'] : self::NOTHING;

            if ($old !== $new) {
                $changes[] = self::change($label, $old, $new);
            }
        }

        return [$sentence, $changes];
    }

    /** @param  array<array-key, mixed>  $p */
    private static function demandMarked(array $p): string
    {
        $gap = self::q(self::text($p, 'gap') ?? 'ohne Namen');
        $brand = self::text($p, 'brand');

        if (($p['state'] ?? null) === 'requested') {
            return $brand === null
                ? "Für {$gap} wurde ein Gutachten angefordert."
                : "Für {$gap} wurde das Gutachten bei {$brand} angefordert.";
        }

        return "Die Nachfrage-Lücke {$gap} wurde als beobachtet markiert.";
    }

    /** @param  array<array-key, mixed>  $p */
    private static function page(array $p): string
    {
        return self::q(self::text($p, 'page') ?? self::text($p, 'slug') ?? 'ohne Titel');
    }

    /**
     * „Die Seite „Impressum" wurde veröffentlicht. Geändert: Abschnitt 1 · Text." — the places, not
     * the words: a legal text is thousands of characters, and the version list holds it whole.
     *
     * @param  array<array-key, mixed>  $p
     * @return array{0: string, 1: list<Change>}
     */
    private static function pagePublished(array $p): array
    {
        $places = array_values(array_filter(
            is_array($p['changes'] ?? null) ? $p['changes'] : [],
            static fn (mixed $place): bool => is_string($place) && $place !== '',
        ));

        $sentence = 'Die Seite '.self::page($p).' wurde veröffentlicht.';

        if ($places === []) {
            $sentence .= ' Der Text blieb unverändert.';
        } else {
            $shown = array_slice($places, 0, 6);
            $more = count($places) - count($shown);
            $tail = match (true) {
                $more === 1 => ' und eine weitere Stelle',
                $more > 1 => ' und '.$more.' weitere Stellen',
                default => '',
            };
            $sentence .= ' Geändert: '.implode(', ', $shown).$tail.'.';
        }

        $note = self::text($p, 'note');

        if ($note !== null) {
            $sentence .= ' Notiz: '.self::q($note).'.';
        }

        $changes = [];
        $reviewed = self::map($p, 'lawyer_reviewed');

        if (isset($reviewed['old'], $reviewed['new']) && $reviewed['old'] !== $reviewed['new']) {
            $changes[] = self::change('Vom Anwalt geprüft', $reviewed['old'] === true ? 'ja' : 'nein', $reviewed['new'] === true ? 'ja' : 'nein');
        }

        return [$sentence, $changes];
    }

    /**
     * „Die Frage „…" wurde geändert: Antwort." — which parts changed, and whether it was shown or
     * hidden, without copying the answer's text into the sentence.
     *
     * @param  array<array-key, mixed>  $p
     * @return array{0: string, 1: list<Change>}
     */
    private static function faqUpdated(array $p): array
    {
        $question = self::q(self::text($p, 'old_question') ?? self::text($p, 'question') ?? 'ohne Text');
        $names = ['group_key' => 'Gruppe', 'question_de' => 'Frage', 'answer_de' => 'Antwort'];
        $parts = [];

        foreach (is_array($p['changed'] ?? null) ? $p['changed'] : [] as $key) {
            if (is_string($key) && isset($names[$key])) {
                $parts[] = $names[$key];
            }
        }

        $visibility = self::map($p, 'published');
        $changes = [];

        if (isset($visibility['old'], $visibility['new']) && $visibility['old'] !== $visibility['new']) {
            $changes[] = self::change('Im Shop', $visibility['old'] === true ? 'sichtbar' : 'ausgeblendet', $visibility['new'] === true ? 'sichtbar' : 'ausgeblendet');
        }

        $sentence = $parts === []
            ? 'Die Frage '.$question.' wurde geändert.'
            : 'Die Frage '.$question.' wurde geändert: '.implode(', ', $parts).'.';

        return [$sentence, $changes];
    }

    /** @param  array<array-key, mixed>  $p */
    private static function menu(array $p): string
    {
        $key = self::text($p, 'menu');

        return self::q($key !== null && isset(NavigationSchema::MENUS[$key]) ? NavigationSchema::MENUS[$key]['label'] : ($key ?? 'ohne Namen'));
    }

    /**
     * @param  array<array-key, mixed>  $p
     * @return list<Change>
     */
    private static function navChanges(array $p): array
    {
        $old = self::map($p, 'old');
        $new = self::map($p, 'new');
        $names = ['label' => 'Name', 'target' => 'Ziel', 'icon' => 'Symbol'];
        $changes = [];

        foreach ($names as $key => $label) {
            $a = self::text($old, $key);
            $b = self::text($new, $key);

            // A glyph by the name a person uses („Haken im Kreis"), never its key.
            if ($key === 'icon') {
                $a = $a === null ? null : (NavigationSchema::ICONS[$a] ?? $a);
                $b = $b === null ? null : (NavigationSchema::ICONS[$b] ?? $b);
            }

            if ($a !== $b) {
                $changes[] = self::change($label, $a ?? self::NOTHING, $b ?? self::NOTHING);
            }
        }

        if (isset($old['visible'], $new['visible']) && $old['visible'] !== $new['visible']) {
            $changes[] = self::change('Im Shop', $old['visible'] === true ? 'sichtbar' : 'ausgeblendet', $new['visible'] === true ? 'sichtbar' : 'ausgeblendet');
        }

        return $changes;
    }

    /** @param  array<array-key, mixed>  $p */
    private static function revisionRestored(array $p): string
    {
        $at = self::text($p, 'revision_at');

        try {
            $when = $at === null ? null : GermanFormat::dateTime(CarbonImmutable::parse($at));
        } catch (\Throwable) {
            $when = null;
        }

        return $when === null
            ? 'Für die Seite '.self::page($p).' wurde eine frühere Version als Entwurf geladen.'
            : 'Für die Seite '.self::page($p).' wurde die Version vom '.$when.' als Entwurf geladen.';
    }

    /**
     * @param  array<array-key, mixed>  $p
     * @return array{0: string, 1: list<Change>}
     */
    private function roleUpdated(array $p): array
    {
        $old = self::map($p, 'old');
        $new = self::map($p, 'new');
        $before = self::text($old, 'label') ?? 'ohne Namen';
        $after = self::text($new, 'label') ?? $before;

        $changes = self::diff($old, $new);

        if ($before !== $after) {
            return ['Die Rolle '.self::q($before).' heißt jetzt '.self::q($after).'.', $changes];
        }

        return $changes === []
            ? ['Die Rolle '.self::q($before).' wurde ohne Änderung gespeichert.', []]
            : ['Die Beschreibung der Rolle '.self::q($before).' wurde geändert.', $changes];
    }

    /**
     * @param  array<array-key, mixed>  $p
     * @return array{0: string, 1: list<Change>}
     */
    private function permissionUpdated(array $p): array
    {
        $right = self::right(self::text($p, 'module'), self::text($p, 'action'));
        $allowed = (bool) ($p['allowed'] ?? false);
        $old = $p['old'] ?? null;

        return [
            ucfirst($this->roleDative($p)).' wurde das Recht '.self::q($right).($allowed ? ' gegeben.' : ' entzogen.'),
            [self::change($right, $old === null ? 'nicht festgelegt' : self::allowed((bool) $old), self::allowed($allowed))],
        ];
    }

    /**
     * @param  array<array-key, mixed>  $p
     * @return array{0: string, 1: list<Change>}
     */
    private function permissionsReplaced(array $p): array
    {
        $added = self::list($p, 'added');
        $removed = self::list($p, 'removed');
        $role = $this->roleDative($p);

        $changes = [];

        foreach ($added as $cell) {
            $changes[] = self::change(self::rightFromCell($cell), self::allowed(false), self::allowed(true));
        }

        foreach ($removed as $cell) {
            $changes[] = self::change(self::rightFromCell($cell), self::allowed(true), self::allowed(false));
        }

        $parts = [];

        if ($added !== []) {
            $parts[] = self::count(count($added), 'Recht', 'Rechte').' gegeben';
        }

        if ($removed !== []) {
            $parts[] = self::count(count($removed), 'Recht', 'Rechte').' entzogen';
        }

        if ($parts === []) {
            // "der Rolle" reads as the genitive here: die Rechte der Rolle.
            return ['Die Rechte '.$role.' wurden ohne Änderung gespeichert.', []];
        }

        $verb = count($added) + count($removed) === 1 ? 'wurde' : 'wurden';

        return [ucfirst($role).' '.$verb.' '.implode(' und ', $parts).'.', $changes];
    }

    /** @param  array<array-key, mixed>  $p */
    private static function denied(array $p): string
    {
        $route = self::text($p, 'route') ?? '';
        $prefix = implode('.', array_slice(explode('.', $route), 0, 2));
        $page = self::PAGES[$prefix] ?? null;
        $ability = self::text($p, 'ability') ?? '';

        if ($page === null) {
            return 'Ein Zugriff wurde abgelehnt, weil die Berechtigung dafür fehlte.';
        }

        $attempt = self::pageAttempt($ability, $page)
            ?? 'auf der Seite '.self::q($page).' '.(self::ABILITIES[$ability] ?? 'etwas zu tun');

        return 'Der Versuch, '.$attempt.', wurde abgelehnt, weil die Berechtigung dafür fehlte.';
    }

    /**
     * A page's own permission, as EnsureAdminMay records it (`approvals.view`), as what completes
     * „Der Versuch, … ": opening the page, exporting from it, or using the named right there. Null
     * for a policy ability (`update`), which the ABILITIES table words instead.
     */
    private static function pageAttempt(string $ability, string $page): ?string
    {
        [$module, $action] = array_pad(explode('.', $ability, 2), 2, '');

        if (PermissionModule::tryFrom($module) === null || PermissionAction::tryFrom($action) === null) {
            return null;
        }

        return match ($action) {
            PermissionAction::View->value => 'die Seite '.self::q($page).' zu öffnen',
            PermissionAction::Export->value => 'auf der Seite '.self::q($page).' zu exportieren',
            default => 'auf der Seite '.self::q($page).' das Recht '.self::q(self::right($module, $action)).' zu nutzen',
        };
    }

    /**
     * `Bestellungen wurden als Excel-Datei exportiert (Status „Bezahlt“, Zeitraum 01.09.2026 bis
     * 26.09.2026) – 12 Bestellungen.`: which customer data left the panel, and how much of it.
     *
     * @param  array<string, mixed>  $p
     */
    private static function ordersExported(array $p): string
    {
        $filters = self::map($p, 'filters');
        $count = is_numeric($p['count'] ?? null) ? (int) $p['count'] : null;
        $format = self::text($p, 'format') === 'xlsx' ? 'als Excel-Datei' : 'als CSV';
        $parts = [];

        $status = self::text($filters, 'status');

        if ($status !== null) {
            $parts[] = 'Status '.self::q(match ($status) {
                OrderList::OPEN => 'Zu versenden',
                OrderList::PAID => 'Bezahlt, nicht erstattet',
                default => OrderStatus::tryFrom($status)?->labelDe() ?? $status,
            });
        }

        $from = self::day(self::text($filters, 'von'));
        $to = self::day(self::text($filters, 'bis'));

        if ($from !== null || $to !== null) {
            $parts[] = 'Zeitraum '.($from ?? '…').' bis '.($to ?? '…');
        }

        if (self::text($filters, 'q') !== null) {
            $parts[] = 'Suche '.self::q((string) self::text($filters, 'q'));
        }

        $scope = $parts === [] ? '' : ' ('.implode(', ', $parts).')';
        $rows = $count === null ? '' : ' – '.self::count($count, 'Bestellung', 'Bestellungen');

        return 'Bestellungen wurden '.$format.' exportiert'.$scope.$rows.'.';
    }

    /** @param  array<array-key, mixed>  $p */
    private static function exported(array $p): string
    {
        $filters = self::map($p, 'filters');
        $count = is_numeric($p['count'] ?? null) ? (int) $p['count'] : null;
        $rows = $count === null ? '' : ' – '.self::count($count, 'Eintrag', 'Einträge');

        $parts = [];

        if (self::text($filters, 'person') !== null) {
            $parts[] = 'Person '.self::q((string) self::text($filters, 'person'));
        }

        if (self::text($filters, 'bereich') !== null) {
            $parts[] = 'Bereich '.self::q((string) self::text($filters, 'bereich'));
        }

        $from = self::day(self::text($filters, 'von'));
        $to = self::day(self::text($filters, 'bis'));

        if ($from !== null && $to !== null) {
            $parts[] = 'Zeitraum '.$from.' bis '.$to;
        } elseif ($from !== null) {
            $parts[] = 'Zeitraum ab '.$from;
        } elseif ($to !== null) {
            $parts[] = 'Zeitraum bis '.$to;
        }

        if ($parts === []) {
            return 'Das ganze Protokoll wurde als CSV exportiert'.$rows.'.';
        }

        $last = array_pop($parts);
        $named = $parts === [] ? $last : implode(', ', $parts).' und '.$last;

        return 'Das Protokoll wurde als CSV exportiert'.$rows.', gefiltert nach '.$named.'.';
    }

    /**
     * A created row's values: nothing before, the value after.
     *
     * @param  array<array-key, mixed>  $p
     * @return list<Change>
     */
    private static function created(array $p): array
    {
        $changes = [];

        foreach (self::FIELDS as $key => [$label]) {
            if (array_key_exists($key, $p) && $key !== 'name_de' && $key !== 'label') {
                $changes[] = self::change($label, self::NOTHING, self::value($key, $p[$key]));
            }
        }

        return $changes;
    }

    /**
     * Before → after for every listed field that changed. A value whose "before" was not recorded
     * reads as such — except a switch, whose before can only have been the other position.
     *
     * @param  array<array-key, mixed>  $old
     * @param  array<array-key, mixed>  $new
     * @return list<Change>
     */
    private static function diff(array $old, array $new): array
    {
        $changes = [];

        foreach (self::FIELDS as $key => [$label, $kind]) {
            if (! array_key_exists($key, $new)) {
                continue;
            }

            if (array_key_exists($key, $old)) {
                $before = self::value($key, $old[$key]);
            } elseif (in_array($kind, ['yesno', 'active'], true) && $new[$key] !== null) {
                $before = self::value($key, ! (bool) $new[$key]);
            } else {
                $before = self::NOT_RECORDED;
            }

            $after = self::value($key, $new[$key]);

            if ($before !== $after) {
                $changes[] = self::change($label, $before, $after);
            }
        }

        return $changes;
    }

    private static function value(string $key, mixed $value): string
    {
        $kind = self::FIELDS[$key][1] ?? 'text';

        if ($kind === 'money') {
            return self::money($value);
        }

        if ($value === null || $value === '') {
            return self::NOTHING;
        }

        return match ($kind) {
            'yesno' => (bool) $value ? 'ja' : 'nein',
            'active' => (bool) $value ? 'aktiv' : 'inaktiv',
            'int' => is_numeric($value) ? GermanFormat::integer((int) $value) : self::NOTHING,
            default => is_scalar($value) ? trim((string) $value) : self::NOTHING,
        };
    }

    /** Cents as German money; no value is "nicht festgelegt", which is what an unset price means. */
    private static function money(mixed $cents): string
    {
        return is_int($cents) || (is_string($cents) && ctype_digit($cents))
            ? GermanFormat::money((int) $cents)
            : 'nicht festgelegt';
    }

    /** A right is given or not: "nicht erlaubt", never "verboten", which is not how German speaks of it. */
    private static function allowed(bool $allowed): string
    {
        return $allowed ? 'erlaubt' : 'nicht erlaubt';
    }

    /** `Katalog · Bearbeiten` — the grid's own words for one cell. */
    private static function right(?string $module, ?string $action): string
    {
        $m = $module === null ? null : PermissionModule::tryFrom($module);
        $a = $action === null ? null : PermissionAction::tryFrom($action);

        if ($m === null || $a === null) {
            return 'ein Recht, das es nicht mehr gibt';
        }

        return $m->labelDe().' '.GermanFormat::MIDDOT.' '.$a->labelDe();
    }

    /** `catalogue.edit` → `Katalog · Bearbeiten`. */
    private static function rightFromCell(string $cell): string
    {
        $dot = strrpos($cell, '.');

        return $dot === false ? self::right(null, null) : self::right(substr($cell, 0, $dot), substr($cell, $dot + 1));
    }

    /**
     * The role an entry is about, as the object of „Für …": its label where the entry kept one, its
     * current label otherwise, and plainly "a role that is gone" when neither exists.
     *
     * @param  array<array-key, mixed>  $p
     */
    private function role(array $p): string
    {
        $kept = self::text($p, 'label');

        if ($kept !== null) {
            return 'die Rolle '.self::q($kept);
        }

        $id = is_numeric($p['role_id'] ?? null) ? (int) $p['role_id'] : null;

        if ($id === null) {
            return 'eine Rolle ohne Angabe';
        }

        if (! array_key_exists($id, $this->roleLabels)) {
            $row = DB::table('roles')->where('id', $id)->first(['name', 'label_de']);
            $label = $row === null ? null : ($row->label_de ?? $row->name);
            $this->roleLabels[$id] = is_string($label) && $label !== '' ? $label : null;
        }

        return $this->roleLabels[$id] === null ? 'eine inzwischen gelöschte Rolle' : 'die Rolle '.self::q($this->roleLabels[$id]);
    }

    /**
     * The same role as the object of giving and taking — "der Rolle „Lager“ wurde … gegeben" — and,
     * since the feminine forms coincide, as the genitive of "die Rechte der Rolle …".
     *
     * @param  array<array-key, mixed>  $p
     */
    private function roleDative(array $p): string
    {
        return match ($role = $this->role($p)) {
            'eine inzwischen gelöschte Rolle' => 'einer inzwischen gelöschten Rolle',
            'eine Rolle ohne Angabe' => 'einer Rolle ohne Angabe',
            default => 'der '.substr($role, strlen('die ')),
        };
    }

    /**
     * The colour's name as it was at the time where the entry kept it, the current name otherwise.
     *
     * @param  array<array-key, mixed>  $p
     */
    private function colourName(array $p, AuditLog $entry): string
    {
        $kept = self::text($p, 'name_de') ?? self::text(self::map($p, 'old'), 'name_de');

        if ($kept !== null) {
            return $kept;
        }

        $id = is_numeric($p['id'] ?? null) ? (int) $p['id'] : (is_numeric($entry->subject_id) ? (int) $entry->subject_id : null);

        if ($id === null) {
            return 'ohne Namen';
        }

        if (! array_key_exists($id, $this->colourNames)) {
            $name = DB::table('balance_weight_colours')->where('id', $id)->value('name_de');
            $this->colourNames[$id] = is_string($name) ? $name : null;
        }

        return $this->colourNames[$id] ?? 'ohne Namen';
    }

    /**
     * The make as its row writes it (`Volkswagen`), from the key the entry kept (`volkswagen`).
     *
     * @param  array<array-key, mixed>  $p
     */
    private function makeLabel(array $p): string
    {
        $key = self::text($p, 'make_key');

        if ($key === null) {
            return 'eine Marke ohne Angabe';
        }

        if (! array_key_exists($key, $this->makeLabels)) {
            $label = DB::table('tpms_sensor_prices')->where('make_key', $key)->value('make_label_de');
            $this->makeLabels[$key] = is_string($label) && $label !== '' ? $label : MakeName::normalise($key);
        }

        return $this->makeLabels[$key];
    }

    /** @param  array<array-key, mixed>  $p */
    private static function address(array $p): string
    {
        return self::text($p, 'email') ?? 'eine Adresse ohne Angabe';
    }

    /** `2026-09-01` → `01.09.2026`; anything else is not a date and is left out. */
    private static function day(?string $value): ?string
    {
        if ($value === null || preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            return null;
        }

        $date = CarbonImmutable::createFromFormat('!Y-m-d', $value, GermanFormat::TIMEZONE);

        return $date instanceof CarbonImmutable ? GermanFormat::date($date) : null;
    }

    private static function count(int $n, string $one, string $many): string
    {
        return GermanFormat::integer($n).' '.($n === 1 ? $one : $many);
    }

    /** German quotation marks around a name. */
    private static function q(string $name): string
    {
        return "\u{201E}".$name."\u{201C}";
    }

    /** @return Change */
    private static function change(string $label, string $before, string $after): array
    {
        return ['label' => $label, 'before' => $before, 'after' => $after];
    }

    /** @param  array<array-key, mixed>  $p */
    private static function text(array $p, string $key): ?string
    {
        $value = $p[$key] ?? null;

        if (! is_scalar($value) || is_bool($value)) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    /**
     * @param  array<array-key, mixed>  $p
     * @return array<array-key, mixed>
     */
    private static function map(array $p, string $key): array
    {
        return is_array($p[$key] ?? null) ? $p[$key] : [];
    }

    /**
     * @param  array<array-key, mixed>  $p
     * @return list<string>
     */
    private static function list(array $p, string $key): array
    {
        $out = [];

        foreach (self::map($p, $key) as $item) {
            if (is_string($item) && $item !== '') {
                $out[] = $item;
            }
        }

        return $out;
    }

    /**
     * Every key naming a secret, removed at every depth, before any of the entry is read.
     *
     * @param  array<array-key, mixed>  $properties
     * @return array<array-key, mixed>
     */
    private static function withoutSecrets(array $properties): array
    {
        $clean = [];

        foreach ($properties as $key => $value) {
            if (is_string($key) && preg_match(self::SECRET, $key) === 1) {
                continue;
            }

            $clean[$key] = is_array($value) ? self::withoutSecrets($value) : $value;
        }

        return $clean;
    }
}
