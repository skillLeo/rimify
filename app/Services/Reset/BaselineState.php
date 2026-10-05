<?php

declare(strict_types=1);

namespace App\Services\Reset;

use Illuminate\Database\Connection;
use Throwable;

/**
 * Whether the baseline a reset restores from fits the code and the database it is restored into (the operator's brief
 * of 05.10.2026, §2.1). A restore brings back the schema that was dumped: run a migration, restore an older baseline,
 * and the database quietly goes back in time while the code moves on — the failure arrives later, as something else.
 *
 * So the baseline records its state when it is written (rimify:reset-baseline): every migration it was made from, the
 * last one's name and batch, the schema's fingerprint (SchemaFingerprint) and the app it was built by. Before any
 * restore the three are compared — the baseline's migrations with the code's migration files and with the database's,
 * its fingerprint with the database's — and any difference refuses the reset, naming both sides in German. The deploy
 * builds a new baseline whenever a migration is not in it yet, and rimify:smoke asserts that it fits.
 */
final class BaselineState
{
    /**
     * What the baseline says about itself.
     *
     * @return array{migrations: list<string>, last: string|null, schema: string|null}
     */
    public static function recorded(string $path): array
    {
        $meta = SqlSnapshot::meta($path);
        $migrations = self::sorted(array_values(array_filter((array) ($meta['migrations'] ?? []), 'is_string')));
        $last = $meta['last_migration']['name'] ?? null;

        return [
            'migrations' => $migrations,
            'last' => is_string($last) ? $last : (end($migrations) ?: null),
            'schema' => is_string($meta['schema'] ?? null) ? $meta['schema'] : null,
        ];
    }

    /**
     * The migrations the code ships: database/migrations and every path the migrator knows.
     *
     * @return list<string>
     */
    public static function code(): array
    {
        $migrator = app('migrator');

        return self::sorted(array_map('strval', array_keys($migrator->getMigrationFiles(array_merge([database_path('migrations')], $migrator->paths())))));
    }

    /**
     * The migrations this database has run.
     *
     * @return list<string>
     */
    public static function ran(Connection $db): array
    {
        return self::sorted(array_map(static fn (mixed $m): string => (string) $m, $db->table('migrations')->pluck('migration')->all()));
    }

    /**
     * Why the baseline at `$path` may not be restored into `$db`, in one German sentence — or null when it fits.
     */
    public static function mismatch(string $path, Connection $db): ?string
    {
        if (! is_file($path) || SqlSnapshot::summary($path) === null) {
            return 'Die Vorlage für den leeren Shop fehlt oder ist unvollständig ('.basename($path).'). Es wurde nichts verändert.';
        }

        try {
            $baseline = self::recorded($path);
        } catch (Throwable $e) {
            return 'Die Vorlage für den leeren Shop lässt sich nicht lesen: '.$e->getMessage().' Es wurde nichts verändert.';
        }

        $rebuild = ' Bau die Vorlage neu (php artisan rimify:reset-baseline) – ein Release baut sie, sobald eine Migration dazukommt. Es wurde nichts verändert.';
        $code = self::code();

        if ($baseline['migrations'] !== $code) {
            return 'Die Vorlage für den leeren Shop passt nicht zum Code: '.self::sides('die Vorlage', $baseline['migrations'], 'der Code', $code).'.'.$rebuild;
        }

        $ran = self::ran($db);

        if ($baseline['migrations'] !== $ran) {
            return 'Die Vorlage für den leeren Shop passt nicht zum Stand der Datenbank: '.self::sides('die Vorlage', $baseline['migrations'], 'die Datenbank', $ran).'.'.$rebuild;
        }

        if ($baseline['schema'] === null) {
            return 'Die Vorlage für den leeren Shop ist älter als die Prüfung ihres Aufbaus und nennt keinen Fingerabdruck.'.$rebuild;
        }

        $live = SchemaFingerprint::of($db);

        if (! hash_equals($baseline['schema'], $live)) {
            return sprintf(
                'Der Aufbau der Datenbank weicht von der Vorlage ab, obwohl beide bei der Migration „%s“ stehen (Vorlage %s, Datenbank %s): Die Datenbank wurde außerhalb einer Migration geändert. Erst das klären, dann zurücksetzen. Es wurde nichts verändert.',
                (string) $baseline['last'],
                substr($baseline['schema'], 0, 12),
                substr($live, 0, 12),
            );
        }

        return null;
    }

    /**
     * „die Vorlage endet mit „…“, der Code mit „…“ (2 fehlen der Vorlage, 1 kennt nur die Vorlage)“.
     *
     * @param  list<string>  $mine
     * @param  list<string>  $other
     */
    private static function sides(string $me, array $mine, string $them, array $other): string
    {
        $missing = count(array_diff($other, $mine));
        $extra = count(array_diff($mine, $other));
        $counts = array_filter([
            $missing > 0 ? $missing.' '.($missing === 1 ? 'Migration fehlt' : 'Migrationen fehlen').' '.self::dative($me) : null,
            $extra > 0 ? $extra.' '.($extra === 1 ? 'kennt' : 'kennen').' nur '.$me : null,
        ]);

        return sprintf('%s endet mit „%s“, %s mit „%s“%s', ucfirst($me), end($mine) ?: '–', $them, end($other) ?: '–', $counts === [] ? '' : ' ('.implode(', ', $counts).')');
    }

    private static function dative(string $side): string
    {
        return match ($side) {
            'die Vorlage' => 'der Vorlage',
            'die Datenbank' => 'der Datenbank',
            default => 'dem Code',
        };
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
