<?php

declare(strict_types=1);

namespace App\Domain\Storefront;

use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\PapersIndex;
use App\Domain\Fitment\Data\VehicleBuild;

/**
 * What the `rmf_papiere` cookie carries: the figures a customer typed from their papers, keyed by the car
 * they belong to, so two saved cars never overwrite each other (the second review of C9, §5) — and, since
 * the operator's last prompt §1.1, the body style and drive they told us for a car whose data has none.
 *
 * One cookie, a compact map — `1843.1100.1100.250_977.980.1010.210`, vehicle id then 8.1, 8.2 and T (and P.2
 * where given, and 15.1 and 15.2 as `.p91W.p94Y` where given, `(95Y)` as `.p95Yx` — D-242); `977-k21`, vehicle id then the body style
 * and the drive as one digit each (0: not given) —
 * most recent first, at most five cars of each and never more than 500 bytes; the oldest drop off. Only
 * digits, letters, dots, hyphens and underscores, so the value is never percent-encoded into something
 * longer. It is not encrypted: it holds nothing but the car's own figures and build, the server re-checks
 * every one of them when it reads the cookie, and a figure can only ever make an answer stricter
 * (PapersFigures::applyTo()). It moves into the customer's account once accounts exist.
 */
final readonly class PapersBook
{
    public const COOKIE = 'rmf_papiere';

    public const LIMIT = 5;

    public const MAX_BYTES = 500;

    /** One year. */
    public const LIFETIME_MINUTES = 60 * 24 * 365;

    /** Stable digits for the cookie — never the position in RowFilter's lists, which may grow. */
    private const BODY_DIGITS = ['Limousine' => 1, 'Kombi' => 2, 'Coupe' => 3, 'Cabrio' => 4, 'Schrägheck' => 5, 'SUV' => 6, 'Roadster' => 7, 'Van' => 8];

    private const DRIVE_DIGITS = ['Allrad' => 1, 'Vorderachse' => 2, 'Hinterachse' => 3];

    /**
     * @param  array<int, PapersFigures>  $entries  vehicle id → figures, most recent first
     * @param  array<int, VehicleBuild>  $builds  vehicle id → body style and drive, most recent first
     */
    public function __construct(public array $entries = [], public array $builds = []) {}

    /** Anything malformed is dropped entry by entry, never an error and never a guess. */
    public static function decode(?string $payload): self
    {
        if ($payload === null || $payload === '' || strlen($payload) > self::MAX_BYTES) {
            return new self;
        }

        $entries = [];
        $builds = [];

        foreach (explode('_', $payload) as $entry) {
            // id.8.1.8.2.T, and P.2 where the customer gave it (Block D), and 15.1 and 15.2 where he gave them (D-242).
            if (preg_match('/^([1-9]\d{0,9})\.(\d{3,4})\.(\d{3,4})\.(\d{2,3})(?:\.(\d{2,4}))?(?:\.p(\d{2,3})([A-Z]x?)\.p(\d{2,3})([A-Z]x?))?$/', $entry, $m) === 1) {
                $id = (int) $m[1];
                $typedIndex = isset($m[6]) && $m[6] !== '';
                $index = $typedIndex ? PapersIndex::tryFrom((int) $m[6], self::symbolOf($m[7]), (int) $m[8], self::symbolOf($m[9])) : null;
                // An index that cannot be read drops the whole entry: kept without it, the answer would be the weaker one.
                $figures = $typedIndex && $index === null
                    ? null
                    : PapersFigures::tryFrom((int) $m[2], (int) $m[3], (int) $m[4], isset($m[5]) && $m[5] !== '' ? (int) $m[5] : null, $index);

                if ($figures !== null && ! isset($entries[$id]) && count($entries) < self::LIMIT) {
                    $entries[$id] = $figures;
                }

                continue;
            }

            // id-k, the body style's digit and the drive's (§1.1).
            if (preg_match('/^([1-9]\d{0,9})-k([0-8])([0-3])$/', $entry, $m) === 1) {
                $id = (int) $m[1];
                $build = VehicleBuild::tryFrom(
                    array_search((int) $m[2], self::BODY_DIGITS, true) ?: null,
                    array_search((int) $m[3], self::DRIVE_DIGITS, true) ?: null,
                );

                if ($build !== null && ! isset($builds[$id]) && count($builds) < self::LIMIT) {
                    $builds[$id] = $build;
                }
            }
        }

        return new self($entries, $builds);
    }

    public function encode(): string
    {
        $parts = [];

        foreach ($this->entries as $id => $f) {
            $parts[] = $id.'.'.$f->axleFrontKg.'.'.$f->axleRearKg.'.'.$f->topSpeedKmh.($f->powerKw === null ? '' : '.'.$f->powerKw)
                .($f->index === null ? '' : '.p'.self::token($f->index, 'FRONT').'.p'.self::token($f->index, 'REAR'));
        }

        foreach ($this->builds as $id => $b) {
            $parts[] = $id.'-k'.($b->bodyForm === null ? 0 : self::BODY_DIGITS[$b->bodyForm]).($b->driveAxle === null ? 0 : self::DRIVE_DIGITS[$b->driveAxle]);
        }

        return implode('_', $parts);
    }

    /** `91W`, and `95Yx` for `(95Y)`: no bracket in a cookie, so nothing is ever percent-encoded. */
    private static function token(PapersIndex $index, string $axle): string
    {
        $axleIndex = $index->forAxle($axle);
        $symbol = $axleIndex['speedSymbol'];

        return $axleIndex['loadIndex'].(str_starts_with($symbol, '(') ? trim($symbol, '()').'x' : $symbol);
    }

    private static function symbolOf(string $token): string
    {
        return str_ends_with($token, 'x') ? '('.substr($token, 0, -1).')' : $token;
    }

    /** This car moves to the front; the oldest drop off past five cars or 500 bytes. */
    public function with(int $vehicleId, PapersFigures $figures): self
    {
        $entries = [$vehicleId => $figures] + array_diff_key($this->entries, [$vehicleId => true]);
        $book = new self(array_slice($entries, 0, self::LIMIT, true), $this->builds);

        while (strlen($book->encode()) > self::MAX_BYTES && count($book->entries) > 1) {
            $book = new self(array_slice($book->entries, 0, -1, true), $book->builds);
        }

        return $book;
    }

    /** The body style and drive the owner gave for this car, which moves to the front of its list. */
    public function withBuild(int $vehicleId, VehicleBuild $build): self
    {
        $builds = [$vehicleId => $build] + array_diff_key($this->builds, [$vehicleId => true]);
        $book = new self($this->entries, array_slice($builds, 0, self::LIMIT, true));

        while (strlen($book->encode()) > self::MAX_BYTES && count($book->builds) > 1) {
            $book = new self($book->entries, array_slice($book->builds, 0, -1, true));
        }

        return $book;
    }

    /** The figures of this car are forgotten; its body style and drive stand. */
    public function without(int $vehicleId): self
    {
        return new self(array_diff_key($this->entries, [$vehicleId => true]), $this->builds);
    }

    public function withoutBuild(int $vehicleId): self
    {
        return new self($this->entries, array_diff_key($this->builds, [$vehicleId => true]));
    }

    public function for(int $vehicleId): ?PapersFigures
    {
        return $this->entries[$vehicleId] ?? null;
    }

    public function buildFor(int $vehicleId): ?VehicleBuild
    {
        return $this->builds[$vehicleId] ?? null;
    }

    public function isEmpty(): bool
    {
        return $this->entries === [] && $this->builds === [];
    }
}
