<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Data\TyreSize;

/**
 * Mischbereifung on one wheel for one car (#20, D-105): every front/rear pair the released Gutachten permits, with
 * the tyre sets for each — or the one sentence saying why there is none.
 *
 * `hasTable` says whether the document prints a pairing table for this combination at all: without one a surface
 * says nothing about Mischbereifung, because there is nothing to offer and nothing to explain.
 */
final readonly class MixedOffer
{
    /** @param list<MixedPair> $pairs */
    public function __construct(
        public array $pairs,
        public ?KomplettradRefusal $refusal,
        public bool $hasTable,
        /** What the document says beyond the table, in its own words: one maker, one profile per axle, … */
        public ?string $rulesDe = null,
        /** The Auflage the table stands in (`V19`) and its page — so the customer can find it in the PDF. */
        public ?string $code = null,
        public ?int $sourcePage = null,
    ) {}

    public static function refused(KomplettradRefusal $refusal, bool $hasTable = false): self
    {
        return new self([], $refusal, $hasTable);
    }

    /** The pair a set of these two sizes stands on — null where the table does not list it for this car. */
    public function pairFor(TyreSize $front, TyreSize $rear): ?MixedPair
    {
        foreach ($this->pairs as $pair) {
            if ($pair->front->matches($front) && $pair->rear->matches($rear)) {
                return $pair;
            }
        }

        return null;
    }
}
