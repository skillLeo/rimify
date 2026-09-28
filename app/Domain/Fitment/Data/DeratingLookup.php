<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

/**
 * One reading of a derating table: a share to apply, a „–“ (not permitted), or nothing said (absent).
 */
final readonly class DeratingLookup
{
    private function __construct(
        public ?int $percent,
        public bool $dash,
        /** The table row that was read, km/h; null when the speed is above the table or there is none. */
        public ?int $rowKmh,
        /** For a „–“: the first symbol the same row permits (`erforderlich ist Y`). */
        public ?string $required = null,
    ) {}

    public static function percent(int $percent, ?int $rowKmh = null): self
    {
        return new self($percent, false, $rowKmh);
    }

    public static function notPermitted(int $rowKmh, ?string $required): self
    {
        return new self(null, true, $rowKmh, $required);
    }

    public static function absent(?int $rowKmh): self
    {
        return new self(null, false, $rowKmh);
    }

    public function isNotPermitted(): bool
    {
        return $this->dash;
    }

    public function isAbsent(): bool
    {
        return ! $this->dash && $this->percent === null;
    }
}
