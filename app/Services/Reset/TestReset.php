<?php

declare(strict_types=1);

namespace App\Services\Reset;

use App\Models\AdminUser;
use App\Models\Setting;
use App\Services\Admin\AuditTrail;
use App\Services\Demo\DemoCatalogue;
use App\Services\Demo\DemoPurge;
use App\Services\Demo\DemoPurgeRefused;
use App\Services\Demo\DemoTables;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Throwable;

/**
 * Einstellungen › System › Testumgebung zurücksetzen (docs/review/ZURUECKSETZEN.md): the test environment back to an
 * empty shop, at one of three levels (ResetLevel), and back again within seven days. Never in production — the page
 * does not exist there (routes/web.php), `rimify:preflight` fails if it did, and this refuses on its own as well.
 *
 * A reset is a restore, not a run of DELETEs. First one entry in the Protokoll (who, when, which level, what goes),
 * then a safety copy of every table (SqlSnapshot), then — for „Shopdaten“ and „Alles“ — the shop's tables (and for
 * „Alles“ the content's) are made again from their own definitions and filled with the baseline's rows: none for the
 * shop, the delivered pages, FAQ and menus for the content. The kept tables are never replaced: the team, the roles,
 * the settings and the Protokoll stay as they are, and only their demo rows go. „Demodaten“ is the rail's strip
 * (DemoPurge): only rows born demo, refused as a whole while something real names the example catalogue.
 *
 * It comes back clean or unchanged, never half: the site is in maintenance for the seconds the tables are replaced;
 * if anything fails — a statement, a trigger that does not come back, a reference that points nowhere — the same
 * tables are put back from the safety copy before the page says so. If the process itself dies, a marker file says
 * what was running, and the next look (the scheduler every minute, or the next reset) puts the copy back.
 *
 * An undo puts the replaced tables back from that copy and brings the kept tables' demo rows back; what was made in
 * the shop since is lost, which the page says before it is done — and the undo takes a safety copy of its own first.
 */
class TestReset
{
    /** Where a reset is possible at all. Production never. */
    public const ENVIRONMENTS = ['local', 'testing', 'staging'];

    /** How long a reset's safety copy and files are kept, and so how long it can be undone. */
    public const KEEP_DAYS = 7;

    /** What has to be typed before a reset (AdminConfirm's confirmWord). */
    public const WORD = 'ZURÜCKSETZEN';

    /**
     * The last reset: {id, level, at, by, undone_at, previous}. A kept table, so it survives the reset it describes;
     * `previous` is the reset before it, still undoable, so undoing one after another steps back in order.
     */
    public const SETTING = 'testumgebung_reset';

    /** How many resets back an undo can step. */
    private const CHAIN = 10;

    private const MARKER = 'running.json';

    private const SNAPSHOT = 'snapshot.sql.gz';

    private const MANIFEST = 'manifest.json';

    /**
     * The demo rows of kept tables: which they are, for the reset that takes them and the undo that brings them back.
     * Child first.
     */
    private const KEPT_DEMO = ['audit_logs', 'model_has_roles', 'model_has_permissions', 'admin_users', 'jobs', 'settings'];

    /** @var resource|null */
    private $lock = null;

    public function __construct(
        private readonly ResetFiles $files,
        private readonly ResetMaintenance $maintenance,
        private readonly DemoPurge $purge,
    ) {}

    public static function available(): bool
    {
        return app()->environment(self::ENVIRONMENTS);
    }

    public static function dir(): string
    {
        $dir = (string) config('rimify.reset.dir', 'storage/app/private/resets');

        return preg_match('~^([a-zA-Z]:[\\\\/]|/)~', $dir) === 1 ? $dir : base_path($dir);
    }

    public static function baseline(): string
    {
        $path = (string) config('rimify.reset.baseline', 'database/baseline/testumgebung.sql');

        return preg_match('~^([a-zA-Z]:[\\\\/]|/)~', $path) === 1 ? $path : base_path($path);
    }

    /**
     * Whether a reset that emptied the shop is in force (not undone): the deploy then writes no demo data and no
     * example catalogue again, and the smoke test expects no wheel.
     */
    public static function shopEmptied(): bool
    {
        try {
            $last = Setting::get(self::SETTING);
        } catch (Throwable) {
            return false;
        }

        return is_array($last) && in_array($last['level'] ?? null, [ResetLevel::Shop->value, ResetLevel::All->value], true)
            && ($last['undone_at'] ?? null) === null;
    }

    /**
     * The three levels with what each would take now, counted from the database and the disks.
     *
     * @return list<array{key: string, label: string, removes: string, keeps: string, counts: list<array{label: string, count: int}>, blocked: string|null}>
     */
    public function preview(): array
    {
        $levels = [];

        foreach (ResetLevel::cases() as $level) {
            $levels[] = [
                'key' => $level->value,
                'label' => $level->label(),
                'removes' => $level->removes(),
                'keeps' => $level->keeps(),
                'counts' => $this->counts($level),
                'blocked' => $this->blocked($level),
            ];
        }

        return $levels;
    }

    /**
     * What a level would take, as the page lists it: „12 Felgen“, „61 Bilder“. Only what there is.
     *
     * @return list<array{label: string, count: int}>
     */
    public function counts(ResetLevel $level): array
    {
        $files = $this->files->count($level);

        if ($level === ResetLevel::Demo) {
            $demo = DemoTables::counts();
            $rows = [
                [$demo['orders'] ?? 0, 'Bestellung', 'Bestellungen'],
                [$demo['customers'] ?? 0, 'Kunde', 'Kunden'],
                [$demo['admin_users'] ?? 0, 'Konto des Demo-Teams', 'Konten des Demo-Teams'],
                [$demo['audit_logs'] ?? 0, 'Protokolleintrag', 'Protokolleinträge'],
                [$demo['wheel_models'] ?? 0, 'Beispielfelge', 'Beispielfelgen'],
                [$demo['tyre_variants'] ?? 0, 'Beispielreifen', 'Beispielreifen'],
                [$demo['brands'] ?? 0, 'erfundene Marke', 'erfundene Marken'],
                [$demo['approval_documents'] ?? 0, 'Beispiel-Gutachten', 'Beispiel-Gutachten'],
                [$demo['vehicles'] ?? 0, 'Entwicklungsfahrzeug', 'Entwicklungsfahrzeuge'],
                [($demo['verdict_tallies'] ?? 0) + ($demo['catalogue_gap_events'] ?? 0), 'Auswertungseintrag', 'Auswertungseinträge'],
                [$files['images'], 'Platzhalterbild', 'Platzhalterbilder'],
            ];
        } else {
            $count = static fn (string $table): int => DB::table($table)->count();
            $rows = [
                [$count('wheel_models'), 'Felge', 'Felgen'],
                [$count('tyre_variants'), 'Reifen', 'Reifen'],
                [$count('brands'), 'Marke', 'Marken'],
                [$count('approval_documents'), 'Gutachten', 'Gutachten'],
                [DB::table('vehicles')->whereNull('deleted_at')->count(), 'Fahrzeug', 'Fahrzeuge'],
                [DB::table('vehicles')->whereNotNull('deleted_at')->count(), 'ausgeblendetes Fahrzeug', 'ausgeblendete Fahrzeuge'],
                [$count('orders'), 'Bestellung', 'Bestellungen'],
                [$count('customers'), 'Kunde', 'Kunden'],
                [$count('reviews'), 'Bewertung', 'Bewertungen'],
                [$count('contact_messages'), 'Nachricht', 'Nachrichten'],
                [$count('review_feedback'), 'Rückmeldung', 'Rückmeldungen'],
                [$count('fitment_subscriptions'), 'Anfrage', 'Anfragen'],
                [DB::table('admin_users')->where('is_demo', true)->count(), 'Konto des Demo-Teams', 'Konten des Demo-Teams'],
                [$files['images'], 'Bild', 'Bilder'],
                [$files['pdfs'], 'PDF', 'PDFs'],
            ];

            if ($level->replacesContent()) {
                $rows[] = [$count('pages'), 'Seite', 'Seiten'];
                $rows[] = [$count('faq_entries'), 'FAQ-Eintrag', 'FAQ-Einträge'];
                $rows[] = [$count('nav_items'), 'Menüpunkt', 'Menüpunkte'];
            }
        }

        $out = [];

        foreach ($rows as [$n, $one, $many]) {
            if ($n > 0) {
                $out[] = ['label' => $n === 1 ? $one : $many, 'count' => $n];
            }
        }

        return $out;
    }

    /** Why a level cannot run now, or null. Only the demo level can be held up by the data itself. */
    public function blocked(ResetLevel $level): ?string
    {
        if ($level !== ResetLevel::Demo || DemoTables::total() === 0) {
            return null;
        }

        $reasons = DemoCatalogue::blockers();

        return $reasons === [] ? null : $reasons[0];
    }

    /**
     * Resets the test environment. Returns what went.
     *
     * @return array{id: string, level: ResetLevel, counts: list<array{label: string, count: int}>, files: array{images: int, pdfs: int, failed: int}}
     *
     * @throws ResetRefused nothing changed, and the message says why
     */
    public function reset(ResetLevel $level, AdminUser|string $by): array
    {
        $this->guard();
        $this->acquire();

        try {
            $this->recover();

            $baseline = null;

            if ($level->replacesShop()) {
                $baseline = $this->checkedBaseline();
            }

            if ($level === ResetLevel::Demo) {
                if (DemoTables::total() === 0) {
                    throw new ResetRefused('Es gibt keine Demodaten mehr. Es wurde nichts entfernt.');
                }

                $blocked = $this->blocked($level);

                if ($blocked !== null) {
                    throw new ResetRefused($blocked);
                }
            }

            $counts = $this->counts($level);
            [$id, $dir] = $this->folder($level->value);

            // The Protokoll first: the entry is in the safety copy, and in a kept table, so it outlives the reset.
            $this->record($by, 'system.reset', ['id' => $id, 'level' => $level->value, 'counts' => $counts, 'environment' => (string) app()->environment()]);
            $this->writeManifest($dir, ['id' => $id, 'op' => 'reset', 'level' => $level->value, 'at' => CarbonImmutable::now('UTC')->toIso8601String(), 'by' => self::name($by), 'counts' => $counts, 'status' => 'running']);

            $files = ['images' => 0, 'pdfs' => 0, 'failed' => 0];

            if ($level === ResetLevel::Demo) {
                // Copied before the purge: it removes the drawings itself, and an undo needs them.
                $files = $this->files->trash($level, $dir);
            }

            $this->maintenance->on();
            $stuck = false;

            try {
                $this->snapshot($dir, 'Sicherung vor dem Zurücksetzen ('.$level->label().')', $id);
                $this->mark(['op' => 'reset', 'id' => $id, 'level' => $level->value, 'tables' => ResetTables::replacedBy($level)]);

                if ($level === ResetLevel::Demo) {
                    $this->purgeDemo($by, $id, $level);
                } else {
                    $this->replaceShop($dir, (string) $baseline, $level, $by, $id);
                }

                $this->unmark();
            } catch (ResetStuck $e) {
                // The copy could not be put back at once: the marker stays and the site stays in maintenance until
                // recover() has put it back — never a half-reset shop open to visitors.
                $stuck = true;

                throw $e;
            } catch (ResetRefused $refused) {
                $this->unmark();
                $this->writeManifest($dir, ['status' => 'failed', 'reason' => $refused->getMessage()]);

                throw $refused;
            } finally {
                if (! $stuck) {
                    $this->maintenance->off();
                }
            }

            if ($level->replacesShop()) {
                $files = $this->files->trash($level, $dir);
            }

            $this->forgetCaches();
            $this->writeManifest($dir, ['status' => 'done', 'files' => $files]);

            return ['id' => $id, 'level' => $level, 'counts' => $counts, 'files' => $files];
        } finally {
            $this->release();
        }
    }

    /**
     * Undoes the last reset, within seven days: the tables it replaced back from its safety copy, the demo rows of the
     * kept tables back, its files back. What was made in the shop since is lost — the page says so before.
     *
     * @return array{id: string, level: ResetLevel, files: array{restored: int, failed: int}}
     *
     * @throws ResetRefused nothing changed, and the message says why
     */
    public function undo(AdminUser|string $by): array
    {
        $this->guard();
        $this->acquire();

        try {
            $this->recover();

            $last = $this->last();

            if ($last === null || ! $last['undoable']) {
                throw new ResetRefused($last['reason'] ?? 'Es gibt kein Zurücksetzen, das sich rückgängig machen ließe.');
            }

            $level = ResetLevel::from($last['level']);
            $source = self::dir().'/'.$last['id'];
            $snapshot = $source.'/'.self::SNAPSHOT;
            $this->checkSnapshot($snapshot);

            // The demo rows of the kept tables, read out of the copy before anything changes — and refused if an id
            // they had has been given to something else since (it would be overwritten, or the row lost).
            $staged = $this->stageKeptDemo($snapshot);

            [$id, $dir] = $this->folder('undo');

            $this->record($by, 'system.reset_undone', ['id' => $last['id'], 'level' => $level->value, 'reset_at' => $last['at']]);
            $this->writeManifest($dir, ['id' => $id, 'op' => 'undo', 'level' => $level->value, 'undoes' => $last['id'], 'at' => CarbonImmutable::now('UTC')->toIso8601String(), 'by' => self::name($by), 'status' => 'running']);

            $tables = $level === ResetLevel::Demo ? ResetTables::SHOP : ResetTables::replacedBy($level);

            $this->maintenance->on();
            $stuck = false;

            try {
                $floors = $this->snapshot($dir, 'Sicherung vor dem Rückgängigmachen', $id);
                $this->mark(['op' => 'undo', 'id' => $id, 'undoes' => $last['id'], 'level' => $level->value, 'tables' => $tables]);

                $before = $this->triggerCount();

                try {
                    (new SqlSnapshot(DB::connection()))->replace($tables, $snapshot, $snapshot, $floors);
                    $this->checkTriggers($before);

                    DB::transaction(function () use ($staged): void {
                        foreach ($staged as $table => $stage) {
                            $this->bringBack($table, $stage);
                        }

                        // One step back: the reset before this one is the last again (and can be undone in its turn,
                        // within its own seven days), or — with none before — this one is marked undone.
                        $current = $this->setting();
                        Setting::set(self::SETTING, is_array($current['previous'] ?? null)
                            ? $current['previous']
                            : [...$current, 'undone_at' => CarbonImmutable::now('UTC')->toIso8601String()]);

                        // The demo set is back: a deploy keeps it again as it keeps any (DemoTables::removed()).
                        if (DemoTables::total() > 0) {
                            Setting::query()->whereKey(DemoTables::REMOVED)->delete();
                        }

                        $this->checkReferences();
                    });
                } catch (Throwable $e) {
                    $this->putBack($tables, $dir.'/'.self::SNAPSHOT, $e);
                }

                $this->unmark();
            } catch (ResetStuck $e) {
                $stuck = true;

                throw $e;
            } catch (ResetRefused $refused) {
                $this->unmark();
                $this->writeManifest($dir, ['status' => 'failed', 'reason' => $refused->getMessage()]);

                throw $refused;
            } finally {
                $this->dropStaged($staged);

                if (! $stuck) {
                    $this->maintenance->off();
                }
            }

            $files = $this->files->restore($source);
            $this->forgetCaches();
            $this->writeManifest($source, ['status' => 'undone', 'undone_at' => CarbonImmutable::now('UTC')->toIso8601String()]);
            $this->writeManifest($dir, ['status' => 'done', 'files' => $files]);

            return ['id' => $last['id'], 'level' => $level, 'files' => $files];
        } finally {
            $this->release();
        }
    }

    /**
     * The last reset, as the page shows it, with whether — and if not, why not — it can be undone.
     *
     * @return array{id: string, level: string, label: string, at: string, atText: string, by: string, until: string, undone: bool, undoneText: string|null, undoable: bool, reason: string|null}|null
     */
    public function last(): ?array
    {
        $last = $this->setting();

        if (! is_string($last['id'] ?? null) || ResetLevel::tryFrom((string) ($last['level'] ?? '')) === null) {
            return null;
        }

        $level = ResetLevel::from((string) $last['level']);
        $at = CarbonImmutable::parse((string) ($last['at'] ?? 'now'));
        $until = $at->addDays(self::KEEP_DAYS);
        $undone = is_string($last['undone_at'] ?? null);
        $snapshot = self::dir().'/'.$last['id'].'/'.self::SNAPSHOT;

        $reason = match (true) {
            $undone => null,
            $until->isPast() => 'Die Sicherung ist älter als '.self::KEEP_DAYS.' Tage und lässt sich nicht mehr zurückspielen.',
            ! is_file($snapshot) => 'Die Sicherung dieses Zurücksetzens ist nicht mehr da.',
            default => null,
        };

        return [
            'id' => (string) $last['id'],
            'level' => $level->value,
            'label' => $level->label(),
            'at' => $at->toIso8601String(),
            'atText' => (string) GermanFormat::dateTime($at),
            'by' => (string) ($last['by'] ?? '–'),
            'until' => (string) GermanFormat::dateTime($until),
            'undone' => $undone,
            'undoneText' => $undone ? GermanFormat::dateTime(CarbonImmutable::parse((string) $last['undone_at'])) : null,
            'undoable' => ! $undone && $reason === null,
            'reason' => $undone ? 'Dieses Zurücksetzen ist schon rückgängig gemacht.' : $reason,
        ];
    }

    /**
     * An interrupted reset or undo — the process died with the marker still there — finished or put back. Returns
     * what was done, or null when nothing was interrupted. Called by the scheduler every minute and before every
     * reset; the lock tells a running one from a dead one.
     */
    public function recover(): ?string
    {
        $marker = $this->readMarker();

        if ($marker === null) {
            return null;
        }

        $mine = $this->lock !== null;

        if (! $mine && ! $this->acquire(throw: false)) {
            // Still running in another process.
            return null;
        }

        try {
            $id = (string) ($marker['id'] ?? '');
            $last = $this->setting();
            // A reset is done once the setting names it; an undo once the setting no longer names its reset as in force.
            $done = ($marker['op'] ?? '') === 'reset'
                ? ($last['id'] ?? null) === $id
                : ! (($last['id'] ?? null) === ($marker['undoes'] ?? null) && ($last['undone_at'] ?? null) === null);

            if (! $done) {
                $tables = array_values(array_filter((array) ($marker['tables'] ?? []), 'is_string'));
                $snapshot = self::dir().'/'.$id.'/'.self::SNAPSHOT;

                if ($tables !== [] && SqlSnapshot::summary($snapshot) !== null) {
                    (new SqlSnapshot(DB::connection()))->replace($tables, $snapshot, $snapshot);
                }

                AuditTrail::system('System', 'system.reset_recovered', ['id' => $id, 'op' => $marker['op'] ?? null, 'level' => $marker['level'] ?? null]);
                $this->writeManifest(self::dir().'/'.$id, ['status' => 'failed', 'reason' => 'unterbrochen, aus der Sicherung zurückgeholt']);
            }

            $this->unmark();
            $this->forgetCaches();

            if ($this->maintenance->active()) {
                $this->maintenance->off();
            }

            return $done ? 'abgeschlossen' : 'aus der Sicherung zurückgeholt';
        } finally {
            if (! $mine) {
                $this->release();
            }
        }
    }

    /** Removes the folders of resets older than KEEP_DAYS. Returns how many went. */
    public function prune(): int
    {
        $root = self::dir();

        if (! is_dir($root)) {
            return 0;
        }

        $running = $this->readMarker()['id'] ?? null;
        $cutoff = CarbonImmutable::now('UTC')->subDays(self::KEEP_DAYS);
        $removed = 0;

        foreach (File::directories($root) as $folder) {
            $manifest = self::readJson($folder.'/'.self::MANIFEST);
            $at = is_string($manifest['at'] ?? null) ? CarbonImmutable::parse($manifest['at']) : CarbonImmutable::createFromTimestampUTC((int) filemtime($folder));

            if (basename($folder) !== $running && $at->lessThan($cutoff) && File::deleteDirectory($folder)) {
                $removed++;
            }
        }

        return $removed;
    }

    /* ── The steps ──────────────────────────────────────────────────────────────── */

    /** @throws ResetRefused */
    private function guard(): void
    {
        if (! self::available()) {
            throw new ResetRefused('Das Zurücksetzen gibt es nur in der Testumgebung, nie im Live-Shop.');
        }

        if (DB::table('payment_events')->where('livemode', true)->exists()) {
            throw new ResetRefused('In dieser Datenbank stehen echte Zahlungen. Sie wird nicht zurückgesetzt.');
        }

        $pending = $this->pendingMigrations();

        if ($pending !== []) {
            throw new ResetRefused('Die Datenbank ist nicht auf dem Stand des Codes (ausstehende Änderungen: '.count($pending).'). Spiel zuerst das nächste Update ein und setz dann zurück.');
        }

        $unknown = ResetTables::unclassified($this->tables());

        if ($unknown !== []) {
            throw new ResetRefused('Für diese Tabellen ist nicht festgelegt, ob sie bleiben oder gehen: '.implode(', ', $unknown).'. Es wurde nichts verändert.');
        }
    }

    /**
     * The baseline, checked: written to the end, made from the same migrations as this database, and with as many
     * triggers as this database has — a database that lost a trigger is not reset on top of the loss.
     *
     * @throws ResetRefused
     */
    private function checkedBaseline(): string
    {
        $path = self::baseline();
        $summary = is_file($path) ? SqlSnapshot::summary($path) : null;

        if ($summary === null) {
            throw new ResetRefused('Die Vorlage für den leeren Shop fehlt (database/baseline/testumgebung.sql). Es wurde nichts verändert.');
        }

        $meta = SqlSnapshot::meta($path);
        $migrations = array_values(array_filter((array) ($meta['migrations'] ?? []), 'is_string'));

        if (self::sorted($migrations) !== self::sorted($this->migrationsRan())) {
            throw new ResetRefused('Die Vorlage für den leeren Shop passt nicht zum Stand der Datenbank. Sie muss neu erzeugt werden (php artisan rimify:reset-baseline). Es wurde nichts verändert.');
        }

        $expected = $summary['triggers'];
        $live = $this->triggerCount();

        if ($expected !== $live) {
            throw new ResetRefused("Die Datenbank hat {$live} Trigger, die Vorlage {$expected}. Solange das nicht übereinstimmt, wird nichts zurückgesetzt.");
        }

        return $path;
    }

    /** @throws ResetRefused */
    private function checkSnapshot(string $snapshot): void
    {
        if (SqlSnapshot::summary($snapshot) === null) {
            throw new ResetRefused('Die Sicherung dieses Zurücksetzens ist unvollständig. Es wurde nichts verändert.');
        }

        $meta = SqlSnapshot::meta($snapshot);
        $migrations = array_values(array_filter((array) ($meta['migrations'] ?? []), 'is_string'));

        if (self::sorted($migrations) !== self::sorted($this->migrationsRan())) {
            throw new ResetRefused('Seit dem Zurücksetzen wurde die Datenbank aktualisiert. Die Sicherung passt nicht mehr dazu, deshalb lässt sich das Zurücksetzen nicht mehr rückgängig machen. Es wurde nichts verändert.');
        }
    }

    /**
     * The safety copy of every table, and the AUTO_INCREMENT each stood at — the floor an undo keeps them above.
     *
     * @return array<string, int>
     */
    private function snapshot(string $dir, string $purpose, string $id): array
    {
        $summary = (new SqlSnapshot(DB::connection()))->write($dir.'/'.self::SNAPSHOT, $this->tables(), [
            'purpose' => $purpose,
            'id' => $id,
            'created_at' => CarbonImmutable::now('UTC')->toIso8601String(),
            'database' => DB::connection()->getDatabaseName(),
            'engine' => (string) DB::selectOne('SELECT VERSION() AS v')->v,
            'migrations' => $this->migrationsRan(),
        ]);

        $floors = [];

        foreach ($summary['tables'] as $table => $info) {
            if ($info['auto_increment'] !== null) {
                $floors[$table] = $info['auto_increment'];
            }
        }

        return $floors;
    }

    /** @throws ResetRefused */
    private function purgeDemo(AdminUser|string $by, string $id, ResetLevel $level): void
    {
        try {
            $this->purge->run(self::name($by), $by instanceof AdminUser ? $by : null);
        } catch (DemoPurgeRefused $refused) {
            throw new ResetRefused($refused->reasons[0] ?? 'Die Demodaten lassen sich gerade nicht entfernen.');
        }

        Setting::set(self::SETTING, $this->entry($id, $level, $by));
    }

    /**
     * The setting for a reset just done: it, and — while it can still be undone — the reset before it, so undoing
     * this one makes that one the last again. A chain of at most CHAIN, and only within the seven days.
     *
     * @return array<string, mixed>
     */
    private function entry(string $id, ResetLevel $level, AdminUser|string $by): array
    {
        $previous = $this->setting();
        $cutoff = CarbonImmutable::now('UTC')->subDays(self::KEEP_DAYS);
        $depth = 0;
        $trim = static function (mixed $entry) use (&$trim, &$depth, $cutoff): ?array {
            if (! is_array($entry) || ! is_string($entry['id'] ?? null) || ($entry['undone_at'] ?? null) !== null
                || ++$depth > self::CHAIN || CarbonImmutable::parse((string) ($entry['at'] ?? 'now'))->lessThan($cutoff)) {
                return null;
            }

            return [...$entry, 'previous' => $trim($entry['previous'] ?? null)];
        };

        return [
            'id' => $id,
            'level' => $level->value,
            'at' => CarbonImmutable::now('UTC')->toIso8601String(),
            'by' => self::name($by),
            'undone_at' => null,
            'previous' => $trim($previous === [] ? null : $previous),
        ];
    }

    /** @throws ResetRefused */
    private function replaceShop(string $dir, string $baseline, ResetLevel $level, AdminUser|string $by, string $id): void
    {
        $tables = ResetTables::replacedBy($level);
        $snapshot = $dir.'/'.self::SNAPSHOT;
        $before = $this->triggerCount();

        try {
            // The tables' own definitions from the copy just taken — so the schema is exactly this database's — and
            // the baseline's rows: none for the shop, the delivered content for „Alles“.
            (new SqlSnapshot(DB::connection()))->replace($tables, $snapshot, $baseline);
            $this->checkTriggers($before);

            DB::transaction(function () use ($by, $id, $level): void {
                $this->takeKeptDemo();
                Setting::set(self::SETTING, $this->entry($id, $level, $by));
                Setting::set(DemoTables::REMOVED, ['at' => CarbonImmutable::now('UTC')->toIso8601String(), 'by' => self::name($by)]);
                $this->checkReferences();
            });
        } catch (Throwable $e) {
            $this->putBack($tables, $snapshot, $e);
        }
    }

    /**
     * Puts the replaced tables back from the safety copy after a failure, and says so.
     *
     * @param  list<string>  $tables
     *
     * @throws ResetRefused always
     */
    private function putBack(array $tables, string $snapshot, Throwable $cause): never
    {
        report($cause);

        try {
            (new SqlSnapshot(DB::connection()))->replace($tables, $snapshot, $snapshot);
        } catch (Throwable $e) {
            report($e);

            throw new ResetStuck('Das ist fehlgeschlagen, und die Sicherung ließ sich nicht sofort zurückspielen. Der Shop bleibt in Wartung, bis sie zurückgespielt ist – das geschieht innerhalb einer Minute von selbst (rimify:reset --recover). Grund: '.$cause->getMessage());
        }

        AuditTrail::system('System', 'system.reset_failed', ['reason' => mb_substr($cause->getMessage(), 0, 300)]);

        throw new ResetRefused('Das hat nicht geklappt; die Datenbank ist wieder genau wie vorher. Grund: '.mb_substr($cause->getMessage(), 0, 300));
    }

    /** The demo rows of the kept tables — DemoPurge's rows, for the levels that replace instead of purging. */
    private function takeKeptDemo(): void
    {
        $users = DB::table('admin_users')->where('is_demo', true)->whereNotNull('demo_ref')->pluck('id')->all();
        $morph = (new AdminUser)->getMorphClass();

        DB::table('audit_logs')->where('is_demo', true)->whereNotNull('demo_ref')->delete();
        DB::table('model_has_roles')->where('model_type', $morph)->whereIn('model_id', $users)->delete();
        DB::table('model_has_permissions')->where('model_type', $morph)->whereIn('model_id', $users)->delete();
        DB::table('admin_users')->whereIn('id', $users)->delete();
        DB::table('jobs')->where('queue', DemoTables::QUEUE)->delete();
        Setting::query()->whereKey(DemoTables::SETTING)->delete();
    }

    /**
     * The kept tables' demo rows as the safety copy holds them, in temporary tables — refused if one of their ids
     * belongs to another row by now.
     *
     * @return array<string, string> table => temporary table
     *
     * @throws ResetRefused
     */
    private function stageKeptDemo(string $snapshot): array
    {
        $snapshotter = new SqlSnapshot(DB::connection());
        $staged = [];

        foreach (self::KEPT_DEMO as $table) {
            $staged[$table] = $snapshotter->stage($snapshot, $table);
        }

        foreach (['audit_logs', 'admin_users'] as $table) {
            $taken = DB::table($staged[$table].' as s')
                ->where('s.is_demo', true)
                ->whereExists(static fn ($q) => $q->selectRaw('1')->from($table.' as t')->whereColumn('t.id', 's.id')->where('t.is_demo', false))
                ->count();

            if ($taken > 0) {
                $this->dropStaged($staged);

                throw new ResetRefused('Seit dem Zurücksetzen wurden Einträge mit den Nummern der Demodaten angelegt. Beim Rückgängigmachen würden sie überschrieben. Es wurde nichts verändert.');
            }
        }

        return $staged;
    }

    /** One kept table's demo rows back from its staged copy; rows that are there already stay as they are. */
    private function bringBack(string $table, string $stage): void
    {
        $columns = array_values(array_filter(
            DB::getSchemaBuilder()->getColumns($table),
            static fn (array $c): bool => ($c['generation'] ?? null) === null,
        ));
        $list = implode(', ', array_map(static fn (array $c): string => SqlSnapshot::id((string) $c['name']), $columns));

        $where = match ($table) {
            'audit_logs', 'admin_users' => 'is_demo = 1 AND demo_ref IS NOT NULL',
            'jobs' => 'queue = '.DB::getPdo()->quote(DemoTables::QUEUE),
            'settings' => SqlSnapshot::id('key').' = '.DB::getPdo()->quote(DemoTables::SETTING),
            'model_has_roles', 'model_has_permissions' => 'model_type = '.DB::getPdo()->quote((new AdminUser)->getMorphClass())
                .' AND model_id IN (SELECT id FROM '.SqlSnapshot::id('_reset_admin_users').' WHERE is_demo = 1)',
            default => throw new RuntimeException("{$table} has no demo rows."),
        };

        DB::statement(sprintf('INSERT IGNORE INTO %s (%s) SELECT %s FROM %s WHERE %s', SqlSnapshot::id($table), $list, $list, SqlSnapshot::id($stage), $where));
    }

    /** @param  array<string, string>  $staged */
    private function dropStaged(array $staged): void
    {
        foreach ($staged as $stage) {
            try {
                DB::statement('DROP TEMPORARY TABLE IF EXISTS '.SqlSnapshot::id($stage));
            } catch (Throwable) {
                // A temporary table goes with the connection anyway.
            }
        }
    }

    /** @throws RuntimeException when a trigger did not come back */
    private function checkTriggers(int $before): void
    {
        $after = $this->triggerCount();

        if ($after !== $before) {
            throw new RuntimeException("Nach dem Einspielen hat die Datenbank {$after} Trigger statt {$before}.");
        }
    }

    /**
     * Every foreign key, checked once all tables are back: a row that points at nothing stops the reset.
     *
     * @throws RuntimeException
     */
    private function checkReferences(): void
    {
        $keys = DB::select(
            'SELECT TABLE_NAME AS t, COLUMN_NAME AS c, REFERENCED_TABLE_NAME AS rt, REFERENCED_COLUMN_NAME AS rc
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL'
        );
        $broken = [];

        foreach ($keys as $key) {
            $n = (int) DB::selectOne(sprintf(
                'SELECT COUNT(*) AS n FROM %1$s x WHERE x.%2$s IS NOT NULL AND NOT EXISTS (SELECT 1 FROM %3$s y WHERE y.%4$s = x.%2$s)',
                SqlSnapshot::id((string) $key->t),
                SqlSnapshot::id((string) $key->c),
                SqlSnapshot::id((string) $key->rt),
                SqlSnapshot::id((string) $key->rc),
            ))->n;

            if ($n > 0) {
                $broken[] = "{$key->t}.{$key->c} → {$key->rt} ({$n})";
            }
        }

        if ($broken !== []) {
            throw new RuntimeException('Verweise ins Leere: '.implode(', ', $broken));
        }
    }

    /** @return list<string> */
    private function tables(): array
    {
        $rows = DB::select("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");

        return array_map(static fn (object $r): string => (string) $r->t, $rows);
    }

    private function triggerCount(): int
    {
        return (int) DB::selectOne('SELECT COUNT(*) AS n FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()')->n;
    }

    /** @return list<string> */
    private function migrationsRan(): array
    {
        return array_map(static fn (mixed $m): string => (string) $m, DB::table('migrations')->pluck('migration')->all());
    }

    /** @return list<string> */
    private function pendingMigrations(): array
    {
        $migrator = app('migrator');
        $files = array_keys($migrator->getMigrationFiles(array_merge([database_path('migrations')], $migrator->paths())));

        return array_values(array_diff($files, $this->migrationsRan()));
    }

    /** @param  array<string, mixed>  $properties */
    private function record(AdminUser|string $by, string $event, array $properties): void
    {
        $by instanceof AdminUser ? AuditTrail::record($by, $event, $properties) : AuditTrail::system($by, $event, $properties);
    }

    private function forgetCaches(): void
    {
        try {
            Cache::flush();
        } catch (Throwable $e) {
            report($e);
        }

        DemoTables::forget();
    }

    /** @return array<string, mixed> */
    private function setting(): array
    {
        $value = Setting::get(self::SETTING);

        return is_array($value) ? $value : [];
    }

    /* ── Lock, marker, manifest ─────────────────────────────────────────────────── */

    /**
     * One reset at a time, across processes: an exclusive lock on a file, which the operating system releases when
     * the process ends — so a reset that died never holds it, and recover() can tell a dead one from a running one.
     *
     * @throws ResetRefused when another reset holds the lock and `$throw`
     */
    private function acquire(bool $throw = true): bool
    {
        File::ensureDirectoryExists(self::dir());
        $handle = fopen(self::dir().'/.lock', 'c');

        if ($handle === false || ! flock($handle, LOCK_EX | LOCK_NB)) {
            if (is_resource($handle)) {
                fclose($handle);
            }

            if ($throw) {
                throw new ResetRefused('Es läuft gerade schon ein Zurücksetzen. Versuch es in einer Minute noch einmal.');
            }

            return false;
        }

        $this->lock = $handle;

        return true;
    }

    private function release(): void
    {
        if (is_resource($this->lock)) {
            flock($this->lock, LOCK_UN);
            fclose($this->lock);
        }

        $this->lock = null;
    }

    /**
     * A folder of its own for one reset or undo, named by the moment and what it is — never one an earlier run in
     * the same second already holds.
     *
     * @return array{0: string, 1: string}
     */
    private function folder(string $what): array
    {
        $base = CarbonImmutable::now('UTC')->format('Ymd-His').'-'.$what;
        $id = $base;

        for ($n = 2; is_dir(self::dir().'/'.$id); $n++) {
            $id = $base.'-'.$n;
        }

        File::ensureDirectoryExists(self::dir().'/'.$id);

        return [$id, self::dir().'/'.$id];
    }

    /** @param  array<string, mixed>  $marker */
    private function mark(array $marker): void
    {
        file_put_contents(self::dir().'/'.self::MARKER, json_encode($marker + ['pid' => getmypid(), 'at' => CarbonImmutable::now('UTC')->toIso8601String()], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));
    }

    private function unmark(): void
    {
        @unlink(self::dir().'/'.self::MARKER);
    }

    /** @return array<string, mixed>|null */
    private function readMarker(): ?array
    {
        $marker = self::readJson(self::dir().'/'.self::MARKER);

        return $marker === [] ? null : $marker;
    }

    /** @param  array<string, mixed>  $values */
    private function writeManifest(string $dir, array $values): void
    {
        $file = $dir.'/'.self::MANIFEST;
        File::ensureDirectoryExists($dir);
        file_put_contents($file, json_encode([...self::readJson($file), ...$values], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }

    /** @return array<string, mixed> */
    private static function readJson(string $file): array
    {
        if (! is_file($file)) {
            return [];
        }

        $data = json_decode((string) file_get_contents($file), true);

        return is_array($data) ? $data : [];
    }

    private static function name(AdminUser|string $by): string
    {
        return $by instanceof AdminUser ? (string) $by->name : $by;
    }

    /**
     * @param  list<string>  $list
     * @return list<string>
     */
    private static function sorted(array $list): array
    {
        sort($list);

        return $list;
    }
}
