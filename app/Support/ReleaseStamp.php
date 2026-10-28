<?php

declare(strict_types=1);

namespace App\Support;

use Carbon\CarbonImmutable;
use Throwable;

/**
 * Which build a test environment serves, in one line at the foot of every page — the shop's and the admin's:
 * „Testumgebung · Release 21 vom 28.10.2026, 14:05 Uhr · Stand 56fc810c“. Whoever reviews the copy can compare it with
 * what we name, so „is this the new version?“ has an answer on the page itself (the operator's brief of 28.10.2026,
 * §10.3: the release number and its date, so it is always known which build the client tested).
 *
 * The release build writes `public/build/release.json` ({"release": 21, "commit": "…", "built": "…"}; the number since
 * release 21) into every release; a checkout without it (a developer's machine) shows nothing. The live shop never
 * shows it.
 */
final class ReleaseStamp
{
    public const FILE = 'build/release.json';

    /** @var array{release: int|null, commit: string, built: CarbonImmutable}|false|null null: not read yet; false: there is none */
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

        $built = GermanFormat::dateTime($release['built']);

        return $release['release'] === null
            ? 'Testumgebung · Stand '.$release['commit'].' vom '.$built
            : 'Testumgebung · Release '.$release['release'].' vom '.$built.' · Stand '.$release['commit'];
    }

    /** @return array{release: int|null, commit: string, built: CarbonImmutable}|null */
    public static function read(): ?array
    {
        if (self::$read === null) {
            self::$read = self::fromFile(public_path(self::FILE)) ?? false;
        }

        return self::$read === false ? null : self::$read;
    }

    /** @return array{release: int|null, commit: string, built: CarbonImmutable}|null */
    public static function fromFile(string $path): ?array
    {
        try {
            $data = is_file($path) ? json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR) : null;

            if (! is_array($data) || ! is_string($data['commit'] ?? null) || ! is_string($data['built'] ?? null)) {
                return null;
            }

            $commit = strtolower(trim($data['commit']));
            // A whole number of a release, or none: the line is printed on every page.
            $number = $data['release'] ?? null;
            $release = is_int($number) && $number > 0 && $number < 100_000 ? $number : null;

            // A commit hash and nothing else.
            return preg_match('/^[0-9a-f]{7,40}$/', $commit) === 1
                ? ['release' => $release, 'commit' => substr($commit, 0, 8), 'built' => CarbonImmutable::parse($data['built'])]
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
