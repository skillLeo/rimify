<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Data\TyreSize;

/**
 * Mischbereifung on one wheel for one car (#20, D-105): every front/rear pair the released Gutachten permits, with
 * the tyre sets for each — or the one sentence saying why there is none.
 *
 * `hasTable` says whether the document prints a pairing table for this combination at all: without one a surface
 * says nothing about Mischbereifung, because there is nothing to offer and nothing to explain. Where the documents list
 * their combinations (D-256) it is always true: the list is the Komplettrad then (D-335), and its pairs include the
 * same size on both axles.
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
        /**
         * The Auflage a printed table stands in (`V19`), and the page of the pairs' numbering — that Auflage's, or that of
         * the document's own list of combinations (D-256) — so the customer can find „Kombination Nr. 2“ in the PDF.
         */
        public ?string $code = null,
        public ?int $sourcePage = null,
        /** The page of the sentence `rulesDe` comes from: the Auflage's, never the list's. */
        public ?int $rulesPage = null,
        /** The pairs are the combinations of the documents' own list (D-256): the Komplettrad itself, not a choice beside it (D-335). */
        public bool $listed = false,
    ) {}

    public static function refused(KomplettradRefusal $refusal, bool $hasTable = false, bool $listed = false): self
    {
        return new self([], $refusal, $hasTable, listed: $listed);
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
