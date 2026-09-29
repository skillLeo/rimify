<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Vehicle;

/**
 * An EG type-approval number as a Gutachten prints it (Block D): `e1*2001/116*0287*00-09` — the country, the
 * directive, the approval number, and the extensions it covers. The documents write that last part four
 * ways, and all four mean something different:
 *
 * - `..` or nothing: every extension of the approval;
 * - `11`: that one extension;
 * - `00-09`: from 00 to 09;
 * - `04-..`: from 04 on.
 *
 * A vehicle dataset names one exact extension (`…*0287*07`); `covers()` says whether a document's range takes
 * it in. Two ranges of the same approval that `overlap()` name the same car — it is never created twice.
 */
final readonly class EgNumber
{
    private function __construct(
        /** `e1*2001/116*0287` */
        public string $base,
        /** The first extension covered; null: from the first. */
        public ?int $from,
        /** The last extension covered; null: to the last. */
        public ?int $to,
    ) {}

    /** The pattern the admin accepts: country, directive, number, and optionally the extensions. */
    public const PATTERN = '/^e\d{1,2}\*[^*\s]+\*\d{3,5}(\*(\.\.|\d{1,4}(-(\d{1,4}|\.\.))?))?\*?$/i';

    public static function parse(?string $raw): ?self
    {
        $normalised = Vehicle::normaliseEcNumber($raw);

        if ($normalised === null || preg_match(self::PATTERN, $normalised) !== 1) {
            return null;
        }

        $parts = explode('*', $normalised);
        $base = implode('*', array_slice($parts, 0, 3));
        $extension = $parts[3] ?? '..';

        if ($extension === '..' || $extension === '') {
            return new self($base, null, null);
        }

        if (preg_match('/^(\d{1,4})-(\d{1,4}|\.\.)$/', $extension, $m) === 1) {
            return new self($base, (int) $m[1], $m[2] === '..' ? null : (int) $m[2]);
        }

        return new self($base, (int) $extension, (int) $extension);
    }

    /** Whether this number takes in another's extensions — all of them. */
    public function covers(self $other): bool
    {
        return $this->base === $other->base
            && ($this->from === null || ($other->from !== null && $other->from >= $this->from))
            && ($this->to === null || ($other->to !== null && $other->to <= $this->to));
    }

    /** Whether the two share any extension: then they name the same car. */
    public function overlaps(self $other): bool
    {
        return $this->base === $other->base
            && ($this->to === null || $other->from === null || $other->from <= $this->to)
            && ($other->to === null || $this->from === null || $this->from <= $other->to);
    }
}
