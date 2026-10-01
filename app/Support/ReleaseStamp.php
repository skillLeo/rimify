<?php

declare(strict_types=1);

namespace App\Support;

use Carbon\CarbonImmutable;
use Throwable;

/**
 * Which build a test environment serves, in one line at the foot of every page: „Testumgebung · Stand 56fc810c vom
 * 01.10.2026, 16:25 Uhr“. Whoever reviews the copy can compare it with what we name, so „is this the new version?“
 * has an answer on the page itself.
 *
 * The Deploy workflow writes `public/build/release.json` ({"commit": "…", "built": "…"}) into every release; a checkout
 * without it (a developer's machine) shows nothing. The live shop never shows it.
 */
final class ReleaseStamp
{
    public const FILE = 'build/release.json';

    /** @var array{commit: string, built: CarbonImmutable}|false|null null: not read yet; false: there is none */
    private static array|false|null $read = null;

    public static function label(): ?string
    {
        if (! app()->environment('staging')) {
            return null;
        }

        $release = self::read();

        if ($release === null) {
            return null;
        }

        return 'Testumgebung · Stand '.$release['commit'].' vom '.GermanFormat::dateTime($release['built']);
    }

    /** @return array{commit: string, built: CarbonImmutable}|null */
    public static function read(): ?array
    {
        if (self::$read === null) {
            self::$read = self::fromFile(public_path(self::FILE)) ?? false;
        }

        return self::$read === false ? null : self::$read;
    }

    /** @return array{commit: string, built: CarbonImmutable}|null */
    public static function fromFile(string $path): ?array
    {
        try {
            $data = is_file($path) ? json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR) : null;

            if (! is_array($data) || ! is_string($data['commit'] ?? null) || ! is_string($data['built'] ?? null)) {
                return null;
            }

            $commit = strtolower(trim($data['commit']));

            // A commit hash and nothing else — the line is printed on every page.
            return preg_match('/^[0-9a-f]{7,40}$/', $commit) === 1
                ? ['commit' => substr($commit, 0, 8), 'built' => CarbonImmutable::parse($data['built'])]
                : null;
        } catch (Throwable) {
            return null;
        }
    }

    /** Tests only: forget what was read. */
    public static function forget(): void
    {
        self::$read = null;
    }
}
