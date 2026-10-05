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
 * empty shop, at one of three levels (ResetLevel), and back again within seven days. Only where the four conditions of
 * CLAUDE.md R-04.1 hold at once (TestEnvironment) — and only for the two that can name themselves as its origin
 * (ResetOrigin): `rimify:reset` and the screen. Nothing else in the code uses this class (ResetReachTest).
 *
 * A reset is a restore, not a run of DELETEs (R-12.3). First the checks — the four conditions, the schema, and that the
 * Protokoll and the Prüfnachweise still refuse every change (ResetProbe) — and that there is room for the safety copy
 * (ResetDisk). Then the safety copy of every table, read back and checked before it counts. Then, for „Shopdaten“ and
 * „Alles“, the shop's tables (and for „Alles“ the content's) are made again from their own definitions and filled with
 * the baseline's rows: none for the shop, the delivered pages, FAQ and menus for the content. No row of
 * `order_line_fitments` or `audit_logs` is updated or deleted on the way — the first is made again, the second is never
 * touched — and the kept tables keep every row, their demo rows too: those go only with „Demodaten“, the strip's
 * DemoPurge, through R-12's own exemption for rows born demo. Then the check again, and only then the Protokoll entry,
 * in the database as it now is.
 *
 * It comes back clean or unchanged, never half: the site is in maintenance for the seconds the tables are replaced;
 * if anything fails — a statement, a trigger that does not come back or no longer refuses, a reference that points
 * nowhere — the same tables are put back from the safety copy and the Protokoll says which check failed. If the
 * process itself dies, a marker file says what was running, and the next look (the scheduler every minute, or the next
 * reset) puts the copy back.
 *
 * An undo puts the replaced tables back from that copy and brings the kept tables' demo rows back where a reset took
 * them (the strip's level, and resets made before 05.10.2026); what was made in the shop since is lost, which the page
 * says before it is done — and the undo takes, and checks, a safety copy of its own first.
 */
class TestReset
{
    /** How many resets back an undo can step. */
    private const CHAIN = 10;

    private const MARKER = 'running.json';

    private const SNAPSHOT = 'snapshot.sql.gz';

    private const MANIFEST = 'manifest.json';

    /**
     * The demo rows of kept tables an undo can bring back: the strip's level takes them, and so did „Shopdaten“ and
     * „Alles“ until R-12.3 (05.10.2026) — a reset made before then is still undone whole. Child first.
     */
    private const KEPT_DEMO = ['audit_logs', 'model_has_roles', 'model_has_permissions', 'admin_users', 'jobs', 'settings'];

    /** @var resource|null */
    private $lock = null;

    public function __construct(
        private readonly ResetFiles $files,
        private readonly ResetMaintenance $maintenance,
        private readonly DemoPurge $purge,
        private readonly ResetProbe $probe,
        private readonly ResetDisk $disk,
    ) {}

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
    public function reset(ResetLevel $level, AdminUser|string $by, ResetOrigin $origin): array
    {
        $this->guard($origin);
        $this->acquire();

        try {
            $this->recoverMarked();
            $this->checkProbe('reset', 'vor dem Zurücksetzen', $by, $level);

            $baseline = $level->replacesShop() ? $this->checkedBaseline() : null;

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
            $this->checkRoom($level);
            [$id, $dir] = $this->folder($level->value);

            $this->writeManifest($dir, ['id' => $id, 'op' => 'reset', 'level' => $level->value, 'at' => CarbonImmutable::now('UTC')->toIso8601String(), 'by' => self::name($by), 'via' => $origin->via, 'counts' => $counts, 'status' => 'running']);

            $files = ['images' => 0, 'pdfs' => 0, 'failed' => 0];

            if ($level === ResetLevel::Demo) {
                // Copied before the purge: it removes the drawings itself, and an undo needs them.
                $files = $this->files->trash($level, $dir);
            }

            $this->maintenance->on();
            $stuck = false;

            try {
                $this->safetyCopy($dir, 'Sicherung vor dem Zurücksetzen ('.$level->label().')', $id);
                $this->mark(['op' => 'reset', 'id' => $id, 'level' => $level->value, 'tables' => ResetTables::replacedBy($level)]);

                if ($level === ResetLevel::Demo) {
                    $this->purgeDemo($by, $id, $level);
                } else {
                    $this->replaceShop($dir, (string) $baseline, $level, $by, $id);
                }

                $this->unmark();
            } catch (ResetStuck $e) {
                // The copy could not be put back, or came back without its guard: the marker stays and the site stays
                // in maintenance until recover() has put it back — never a half-reset shop open to visitors.
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

            // R-04.1: the Protokoll entry once the database is what it now is — in a kept table, so it stays.
            $this->record($by, 'system.reset', ['id' => $id, 'level' => $level->value, 'counts' => $counts, 'via' => $origin->via, 'environment' => (string) app()->environment()]);
            $this->forgetCaches();
            $this->writeManifest($dir, ['status' => 'done', 'files' => $files]);

            return ['id' => $id, 'level' => $level, 'counts' => $counts, 'files' => $files];
        } finally {
            $this->release();
        }
    }

    /**
     * Undoes the last reset, within seven days: the tables it replaced back from its safety copy, the demo rows of the
     * kept tables back where it took them, its files back. What was made in the shop since is lost — the page says so.
     *
     * @return array{id: string, level: ResetLevel, files: array{restored: int, failed: int}}
     *
     * @throws ResetRefused nothing changed, and the message says why
     */
    public function undo(AdminUser|string $by, ResetOrigin $origin): array
    {
        $this->guard($origin);
        $this->acquire();

        try {
            $this->recoverMarked();

            $last = $this->last();

            if ($last === null || ! $last['undoable']) {
                throw new ResetRefused($last['reason'] ?? 'Es gibt kein Zurücksetzen, das sich rückgängig machen ließe.');
            }

            $level = ResetLevel::from($last['level']);
            $source = TestEnvironment::dir().'/'.$last['id'];
            $snapshot = $source.'/'.self::SNAPSHOT;
            $this->checkSnapshot($snapshot);
            $this->checkProbe('undo', 'vor dem Rückgängigmachen', $by, $level);
            $this->checkRoom(ResetLevel::Demo);

            // The demo rows of the kept tables, read out of the copy before anything changes — and refused if an id
            // they had has been given to something else since (it would be overwritten, or the row lost).
            $staged = $this->stageKeptDemo($snapshot);

            [$id, $dir] = $this->folder('undo');

            $this->writeManifest($dir, ['id' => $id, 'op' => 'undo', 'level' => $level->value, 'undoes' => $last['id'], 'at' => CarbonImmutable::now('UTC')->toIso8601String(), 'by' => self::name($by), 'via' => $origin->via, 'status' => 'running']);

            $tables = $level === ResetLevel::Demo ? ResetTables::SHOP : ResetTables::replacedBy($level);

            $this->maintenance->on();
            $stuck = false;

            try {
                $floors = $this->safetyCopy($dir, 'Sicherung vor dem Rückgängigmachen', $id);
                $this->mark(['op' => 'undo', 'id' => $id, 'undoes' => $last['id'], 'level' => $level->value, 'tables' => $tables]);

                $before = $this->triggerCount();

                try {
                    $this->replaceTables($tables, $snapshot, $snapshot, $floors);
                    $this->checkTriggers($before);
                    $this->assertProbe('nach dem Rückgängigmachen');

                    DB::transaction(function () use ($staged): void {
                        foreach ($staged as $table => $stage) {
                            $this->bringBack($table, $stage);
                        }

                        // One step back: the reset before this one is the last again (and can be undone in its turn,
                        // within its own seven days), or — with none before — this one is marked undone.
                        $current = $this->setting();
                        Setting::set(TestEnvironment::SETTING, is_array($current['previous'] ?? null)
                            ? $current['previous']
                            : [...$current, 'undone_at' => CarbonImmutable::now('UTC')->toIso8601String()]);

                        // The demo set is back: a deploy keeps it again as it keeps any (DemoTables::removed()).
                        if (DemoTables::total() > 0) {
                            Setting::query()->whereKey(DemoTables::REMOVED)->delete();
                        }

                        $this->checkReferences();
                    });
                } catch (Throwable $e) {
                    $this->putBack($tables, $dir.'/'.self::SNAPSHOT, $e, $id, 'undo');
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

            // R-04.1: the Protokoll entry once the database is what it now is.
            $this->record($by, 'system.reset_undone', ['id' => $last['id'], 'level' => $level->value, 'reset_at' => $last['at'], 'via' => $origin->via]);
            $this->forgetCaches();
            $this->writeManifest($source, ['status' => 'undone', 'undone_at' => CarbonImmutable::now('UTC')->toIso8601String()]);
            $this->writeManifest($dir, ['status' => 'done', 'files' => $files]);

            return ['id' => $last['id'], 'level' => $level, 'files' => $files];
        } finally {
            $this->release();
        }
    }

    /**
     * The last reset, as the page shows it: when, by whom, how long it can still be undone — and, once it cannot, the
     * one sentence that says why.
     *
     * @return array{id: string, level: string, label: string, at: string, atText: string, by: string, until: string, remaining: string|null, undone: bool, undoneText: string|null, undoable: bool, reason: string|null}|null
     */
    public function last(): ?array
    {
        $last = $this->setting();

        if (! is_string($last['id'] ?? null) || ResetLevel::tryFrom((string) ($last['level'] ?? '')) === null) {
            return null;
        }

        $level = ResetLevel::from((string) $last['level']);
        $at = CarbonImmutable::parse((string) ($last['at'] ?? 'now'));
        $until = $at->addDays(TestEnvironment::KEEP_DAYS);
        $undone = is_string($last['undone_at'] ?? null);
        $snapshot = TestEnvironment::dir().'/'.$last['id'].'/'.self::SNAPSHOT;

        $reason = match (true) {
            $undone => 'Dieses Zurücksetzen ist schon rückgängig gemacht.',
            $until->isPast() => 'Die '.TestEnvironment::KEEP_DAYS.' Tage sind vorbei: Dieses Zurücksetzen lässt sich nicht mehr rückgängig machen.',
            ! is_file($snapshot) => 'Die Sicherung dieses Zurücksetzens ist nicht mehr vorhanden. Deshalb lässt es sich nicht mehr rückgängig machen.',
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
            'remaining' => $reason === null ? GermanFormat::remaining($until) : null,
            'undone' => $undone,
            'undoneText' => $undone ? GermanFormat::dateTime(CarbonImmutable::parse((string) $last['undone_at'])) : null,
            'undoable' => $reason === null,
            'reason' => $reason,
        ];
    }

    /** Whether a reset or undo was cut off with its marker still there — read from the disk alone. */
    public function interrupted(): bool
    {
        return $this->readMarker() !== null;
    }

    /**
     * An interrupted reset or undo — the process died with the marker still there — finished or put back. Returns
     * what was done, or null when nothing was interrupted. Called by the scheduler every minute (`rimify:reset
     * --recover`), which finds nothing to do almost always and then touches nothing at all.
     *
     * @throws ResetRefused where the four conditions do not hold
     */
    public function recover(ResetOrigin $origin): ?string
    {
        if (! $this->interrupted()) {
            return null;
        }

        $refusal = TestEnvironment::refusal($origin);

        if ($refusal !== null) {
            throw new ResetRefused($refusal);
        }

        return $this->recoverMarked();
    }

    /**
     * Removes the folders of resets older than KEEP_DAYS, and says so in the Protokoll — one entry per safety copy, so
     * the end of the undo window is never silent. Returns how many went.
     */
    public function prune(): int
    {
        $root = TestEnvironment::dir();

        if (! is_dir($root)) {
            return 0;
        }

        $running = $this->readMarker()['id'] ?? null;
        $cutoff = CarbonImmutable::now('UTC')->subDays(TestEnvironment::KEEP_DAYS);
        $removed = 0;

        foreach (File::directories($root) as $folder) {
            $manifest = self::readJson($folder.'/'.self::MANIFEST);
            $at = is_string($manifest['at'] ?? null) ? CarbonImmutable::parse($manifest['at']) : CarbonImmutable::createFromTimestampUTC((int) filemtime($folder));

            if (basename($folder) === $running || ! $at->lessThan($cutoff)) {
                continue;
            }

            $bytes = self::folderBytes($folder);

            if (File::deleteDirectory($folder)) {
                $removed++;
                AuditTrail::system('System', 'system.reset_backup_removed', [
                    'id' => basename($folder),
                    'op' => is_string($manifest['op'] ?? null) ? $manifest['op'] : null,
                    'level' => is_string($manifest['level'] ?? null) ? $manifest['level'] : null,
                    'at' => $at->toIso8601String(),
                    'bytes' => $bytes,
                ]);
            }
        }

        return $removed;
    }

    /* ── The steps ──────────────────────────────────────────────────────────────── */

    /**
     * The four conditions (R-04.1), and that the schema is one this code can reset. Writes nothing.
     *
     * @throws ResetRefused
     */
    private function guard(ResetOrigin $origin): void
    {
        $refusal = TestEnvironment::refusal($origin);

        if ($refusal !== null) {
            throw new ResetRefused($refusal);
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
     * The append-only guard, asked before anything changes: a database that has lost it is not reset on top of the
     * loss. The refusal is recorded — it is a fault in the database, not a wrong click.
     *
     * @throws ResetRefused
     */
    private function checkProbe(string $op, string $when, AdminUser|string $by, ResetLevel $level): void
    {
        $failures = $this->probe->failures();

        if ($failures === []) {
            return;
        }

        $this->record($by, 'system.reset_refused', ['op' => $op, 'level' => $level->value, 'when' => $when, 'failures' => $failures]);

        throw new ResetRefused('Die Prüfung '.$when.' ist fehlgeschlagen: '.$failures[0]['text'].'. Es wurde nichts verändert.');
    }

    /** @throws ResetCheckFailed */
    private function assertProbe(string $when): void
    {
        $failures = $this->probe->failures();

        if ($failures !== []) {
            throw new ResetCheckFailed($failures, $when);
        }
    }

    /**
     * Room for the safety copy and the files a level moves, before a byte of either is written.
     *
     * @throws ResetRefused
     */
    private function checkRoom(ResetLevel $level): void
    {
        $needed = $this->disk->needed($this->files->bytes($level));
        $free = $this->disk->free(TestEnvironment::dir());

        if ($free === null) {
            throw new ResetRefused('Der Server meldet nicht, wie viel Speicherplatz frei ist. Ohne diese Angabe legt der Shop keine Sicherung an. Es wurde nichts verändert.');
        }

        if ($free < $needed) {
            throw new ResetRefused(sprintf(
                'Für die Sicherung ist nicht genug Speicherplatz frei: Gebraucht werden bis zu %s, frei sind %s. Es wurde nichts verändert.',
                self::megabytes($needed),
                self::megabytes((int) $free),
            ));
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
        $path = TestEnvironment::baseline();
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
     * The safety copy of every table, written and then read back (R-04.1: written and verified before anything goes):
     * to its last line, with every table, every table's rows as the database counts them now, and every trigger.
     * Returns the AUTO_INCREMENT each table stood at — the floor an undo keeps them above.
     *
     * @return array<string, int>
     *
     * @throws ResetRefused nothing changed: the copy is not there, and nothing else was touched
     */
    private function safetyCopy(string $dir, string $purpose, string $id): array
    {
        $path = $dir.'/'.self::SNAPSHOT;
        $tables = $this->tables();

        try {
            $written = (new SqlSnapshot(DB::connection()))->write($path, $tables, [
                'purpose' => $purpose,
                'id' => $id,
                'created_at' => CarbonImmutable::now('UTC')->toIso8601String(),
                'database' => DB::connection()->getDatabaseName(),
                'engine' => (string) DB::selectOne('SELECT VERSION() AS v')->v,
                'migrations' => $this->migrationsRan(),
            ]);

            $this->checkCopy($path, $tables);
        } catch (Throwable $e) {
            report($e);
            @unlink($path);

            throw new ResetRefused('Die Sicherung ließ sich nicht vollständig schreiben und prüfen. Es wurde nichts verändert. Grund: '.mb_substr($e->getMessage(), 0, 200));
        }

        $floors = [];

        foreach ($written['tables'] as $table => $info) {
            if ($info['auto_increment'] !== null) {
                $floors[$table] = $info['auto_increment'];
            }
        }

        return $floors;
    }

    /**
     * The copy as it lies on the disk, against the database it was taken from — the site is in maintenance, so the two
     * must agree row for row.
     *
     * @param  list<string>  $tables
     *
     * @throws RuntimeException naming what does not agree
     */
    private function checkCopy(string $path, array $tables): void
    {
        $summary = SqlSnapshot::summary($path);

        if ($summary === null) {
            throw new RuntimeException('die Sicherung endet vor ihrer letzten Zeile');
        }

        $missing = array_diff($tables, array_keys($summary['tables']));

        if ($missing !== []) {
            throw new RuntimeException('in der Sicherung fehlen Tabellen: '.implode(', ', $missing));
        }

        foreach ($tables as $table) {
            $live = DB::table($table)->count();

            if ($summary['tables'][$table]['rows'] !== $live) {
                throw new RuntimeException("{$table}: {$summary['tables'][$table]['rows']} Zeilen gesichert, {$live} in der Datenbank");
            }
        }

        if ($summary['triggers'] !== $this->triggerCount()) {
            throw new RuntimeException("{$summary['triggers']} Trigger gesichert, {$this->triggerCount()} in der Datenbank");
        }
    }

    /** @throws ResetRefused */
    private function purgeDemo(AdminUser|string $by, string $id, ResetLevel $level): void
    {
        try {
            $this->purge->run(self::name($by), $by instanceof AdminUser ? $by : null);
        } catch (DemoPurgeRefused $refused) {
            throw new ResetRefused($refused->reasons[0] ?? 'Die Demodaten lassen sich gerade nicht entfernen.');
        }

        Setting::set(TestEnvironment::SETTING, $this->entry($id, $level, $by));

        // „Nach jedem Zurücksetzen“ (R-12.3) — this level too. It replaced no table, so the guard can only be gone if it
        // went by some other way; the demo set comes back with „rückgängig machen“ either way.
        $failures = $this->probe->failures();

        if ($failures !== []) {
            AuditTrail::system('System', 'system.reset_failed', ['id' => $id, 'op' => 'reset', 'level' => $level->value, 'reason' => 'Prüfung nach dem Entfernen der Demodaten', 'failures' => $failures]);

            throw new ResetRefused('Die Demodaten sind entfernt, aber die Prüfung danach ist fehlgeschlagen: '.$failures[0]['text'].'. Zurückholen lassen sie sich mit „Letztes Zurücksetzen rückgängig machen“ – innerhalb von '.TestEnvironment::KEEP_DAYS.' Tagen und erst, wenn die Prüfung keinen Fehler mehr findet.');
        }
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
        $cutoff = CarbonImmutable::now('UTC')->subDays(TestEnvironment::KEEP_DAYS);
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

    /**
     * The shop's tables (and at „Alles“ the content's) made again from the copy's own definitions and the baseline's
     * rows. Nothing else changes: the kept tables keep every row (R-12.3).
     *
     * @throws ResetRefused
     */
    private function replaceShop(string $dir, string $baseline, ResetLevel $level, AdminUser|string $by, string $id): void
    {
        $tables = ResetTables::replacedBy($level);
        $snapshot = $dir.'/'.self::SNAPSHOT;
        $before = $this->triggerCount();

        try {
            // The tables' own definitions from the copy just taken — so the schema is exactly this database's — and
            // the baseline's rows: none for the shop, the delivered content for „Alles“.
            $this->replaceTables($tables, $snapshot, $baseline);
            $this->checkTriggers($before);
            $this->assertProbe('nach dem Einspielen');

            DB::transaction(function () use ($by, $id, $level): void {
                Setting::set(TestEnvironment::SETTING, $this->entry($id, $level, $by));
                Setting::set(DemoTables::REMOVED, ['at' => CarbonImmutable::now('UTC')->toIso8601String(), 'by' => self::name($by)]);
                $this->checkReferences();
            });
        } catch (Throwable $e) {
            $this->putBack($tables, $snapshot, $e, $id, 'reset');
        }
    }

    /**
     * Makes `$tables` again from `$structure`, filled from `$rows` — the restore of a reset and of an undo. Its own
     * method so a test can stand in for a restore that brings a table back without its guard, which the check after it
     * must catch (ResetGuardsTest); putting a copy back after a failure never goes through it.
     *
     * @param  list<string>  $tables
     * @param  array<string, int>  $floors
     */
    protected function replaceTables(array $tables, string $structure, ?string $rows, array $floors = []): void
    {
        (new SqlSnapshot(DB::connection()))->replace($tables, $structure, $rows, $floors);
    }

    /**
     * Puts the replaced tables back from the safety copy after a failure, checks the guard again, and says so in the
     * Protokoll — with each check that did not hold, by name.
     *
     * @param  list<string>  $tables
     *
     * @throws ResetRefused always — ResetStuck when the copy could not be put back, or came back without its guard
     */
    private function putBack(array $tables, string $snapshot, Throwable $cause, string $id, string $op): never
    {
        report($cause);

        $failures = $cause instanceof ResetCheckFailed ? $cause->failures : [];
        $reason = mb_substr($cause->getMessage(), 0, 300);

        try {
            (new SqlSnapshot(DB::connection()))->replace($tables, $snapshot, $snapshot);
        } catch (Throwable $e) {
            report($e);
            AuditTrail::system('System', 'system.reset_failed', ['id' => $id, 'op' => $op, 'reason' => $reason, 'failures' => $failures, 'put_back' => 'failed']);

            throw new ResetStuck('Das ist fehlgeschlagen, und die Sicherung ließ sich nicht sofort zurückspielen. Der Shop bleibt im Wartungsmodus, bis sie zurückgespielt ist und die Prüfung keinen Fehler mehr findet – das versucht der Shop jede Minute von selbst (rimify:reset --recover). Grund: '.$reason);
        }

        $after = $this->probe->failures();

        if ($after !== []) {
            AuditTrail::system('System', 'system.reset_failed', ['id' => $id, 'op' => $op, 'reason' => $reason, 'failures' => $failures, 'put_back' => 'unchecked', 'put_back_failures' => $after]);

            throw new ResetStuck('Das ist fehlgeschlagen. Die Sicherung ist zurückgespielt, aber auch danach schlägt die Prüfung fehl: '.$after[0]['text'].'. Der Shop bleibt im Wartungsmodus.');
        }

        AuditTrail::system('System', 'system.reset_failed', ['id' => $id, 'op' => $op, 'reason' => $reason, 'failures' => $failures]);

        throw new ResetRefused('Das hat nicht geklappt; die Datenbank ist wieder genau wie vorher. Grund: '.$reason);
    }

    /**
     * The interrupted reset or undo, with the lock held or taken: finished (the setting already names it) or put back
     * from its copy — and then checked, as every reset is. A put-back whose check fails stays marked, so the site stays
     * in maintenance, and says so once.
     */
    private function recoverMarked(): ?string
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
                $snapshot = TestEnvironment::dir().'/'.$id.'/'.self::SNAPSHOT;

                if ($tables !== [] && SqlSnapshot::summary($snapshot) !== null) {
                    (new SqlSnapshot(DB::connection()))->replace($tables, $snapshot, $snapshot);
                }

                $failures = $this->probe->failures();

                if ($failures !== []) {
                    if (($marker['reported'] ?? false) !== true) {
                        AuditTrail::system('System', 'system.reset_failed', ['id' => $id, 'op' => $marker['op'] ?? null, 'reason' => 'Unterbrochen; nach dem Zurückspielen schlägt die Prüfung fehl', 'failures' => $failures, 'put_back' => 'unchecked']);
                        $this->mark([...$marker, 'reported' => true]);
                    }

                    return null;
                }

                AuditTrail::system('System', 'system.reset_recovered', ['id' => $id, 'op' => $marker['op'] ?? null, 'level' => $marker['level'] ?? null]);
                $this->writeManifest(TestEnvironment::dir().'/'.$id, ['status' => 'failed', 'reason' => 'unterbrochen, aus der Sicherung zurückgeholt']);
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

    /**
     * One kept table's demo rows back from its staged copy; rows that are there already stay as they are. An INSERT —
     * the one write the append-only tables take.
     */
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
        $value = Setting::get(TestEnvironment::SETTING);

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
        File::ensureDirectoryExists(TestEnvironment::dir());
        $handle = fopen(TestEnvironment::dir().'/.lock', 'c');

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

        for ($n = 2; is_dir(TestEnvironment::dir().'/'.$id); $n++) {
            $id = $base.'-'.$n;
        }

        File::ensureDirectoryExists(TestEnvironment::dir().'/'.$id);

        return [$id, TestEnvironment::dir().'/'.$id];
    }

    /** @param  array<string, mixed>  $marker */
    private function mark(array $marker): void
    {
        file_put_contents(TestEnvironment::dir().'/'.self::MARKER, json_encode($marker + ['pid' => getmypid(), 'at' => CarbonImmutable::now('UTC')->toIso8601String()], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));
    }

    private function unmark(): void
    {
        @unlink(TestEnvironment::dir().'/'.self::MARKER);
    }

    /** @return array<string, mixed>|null */
    private function readMarker(): ?array
    {
        $marker = self::readJson(TestEnvironment::dir().'/'.self::MARKER);

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

    private static function folderBytes(string $folder): int
    {
        $bytes = 0;

        foreach (File::allFiles($folder, true) as $file) {
            $bytes += (int) $file->getSize();
        }

        return $bytes;
    }

    private static function megabytes(int $bytes): string
    {
        return GermanFormat::decimal($bytes / 1_048_576, 1).GermanFormat::NBSP.'MB';
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
