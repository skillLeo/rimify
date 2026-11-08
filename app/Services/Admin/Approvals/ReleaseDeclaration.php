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
 *   - whether the Verwendungsbereich asks for an Abnahme, which DocumentRelease compares with what was entered: an entry
 *     that misses the Abnahme cannot reach the shop by being released on trust.
 *
 * The count of Auflagen codes and tyre sizes (D-440) and the axle-load limit (D-441) are no longer asked: the client's round of
 * 08.11.2026, §3. A limit the paper prints reaches the shop through its codes of kind Tragfähigkeit.
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
        public ?string $abnahme = null,
    ) {}

    /** @return array{completeness: string, missing: string|null, abnahme: string|null} */
    public function toArray(): array
    {
        return [
            'completeness' => $this->completeness,
            'missing' => $this->missing,
            'abnahme' => $this->abnahme,
        ];
    }

    public function isComplete(): bool
    {
        return $this->completeness === ApprovalDocument::COMPLETE;
    }
}
