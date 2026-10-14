<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Models\ApprovalDocument;

/**
 * What the person releasing a Gutachten says about it, read off the PDF — asked at every release, never defaulted
 * (the operator's brief of 14.10.2026, §2 and §4; D-227, D-228):
 *
 *   - whether every Anlage and every vehicle is entered (`complete`, `partial` with what is missing, `unknown`) —
 *     only `complete` lets the shop refuse a car the rows do not name;
 *   - what the Verwendungsbereich prints for the vehicles entered: how many Auflagen codes, how many tyre sizes,
 *     the axle-load limit if it names one, and whether it asks for an Abnahme.
 *
 * DocumentRelease counts the same four things in what was entered and refuses on any difference: an entry that misses
 * a condition, a size, a limit or the Abnahme cannot reach the shop by being released on trust.
 */
final readonly class ReleaseDeclaration
{
    /** The Verwendungsbereich asks for an Abnahme for every combination it lists … */
    public const ABNAHME_ALL = 'all';

    /** … for some of them (one size, one car) … */
    public const ABNAHME_SOME = 'some';

    /** … or for none. */
    public const ABNAHME_NONE = 'none';

    public const ABNAHME = [self::ABNAHME_ALL, self::ABNAHME_SOME, self::ABNAHME_NONE];

    public function __construct(
        public string $completeness,
        public ?string $missing = null,
        public ?int $codes = null,
        public ?int $sizes = null,
        public ?int $axleLimitKg = null,
        public ?string $abnahme = null,
    ) {}

    /** @return array{completeness: string, missing: string|null, codes: int|null, sizes: int|null, axleLimitKg: int|null, abnahme: string|null} */
    public function toArray(): array
    {
        return [
            'completeness' => $this->completeness,
            'missing' => $this->missing,
            'codes' => $this->codes,
            'sizes' => $this->sizes,
            'axleLimitKg' => $this->axleLimitKg,
            'abnahme' => $this->abnahme,
        ];
    }

    public function isComplete(): bool
    {
        return $this->completeness === ApprovalDocument::COMPLETE;
    }
}
