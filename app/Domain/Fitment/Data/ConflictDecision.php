<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

/**
 * A person's decision where two current documents say different things about the same car and wheel
 * (the corrections memo §3). The engine never makes it itself:
 *
 *   - EACH: „beide gelten jeweils für sich“ — both stand; the shop names both and reads them together,
 *     toward caution (the stricter Eintragung, every Auflage, only the tyre sizes both permit);
 *   - ONLY: „nur Dokument X gilt“ — the shop reads X alone for this pair.
 */
final readonly class ConflictDecision
{
    public const EACH = 'each';

    public const ONLY = 'only';

    public function __construct(
        public string $mode,
        public ?int $documentId = null,
    ) {}

    public static function each(): self
    {
        return new self(self::EACH);
    }

    public static function only(int $documentId): self
    {
        return new self(self::ONLY, $documentId);
    }
}
