<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Verdict\MinSource;

/**
 * Every tyre a verdict permits on a wheel, cheapest first — or the one sentence saying why there
 * is none. An empty list always carries a refusal, so no surface can render an empty panel and
 * leave the customer to guess (R-09 in spirit).
 */
final readonly class KomplettradOffer
{
    /** @param list<TyreRecord> $tyres */
    public function __construct(
        public array $tyres,
        public ?KomplettradRefusal $refusal,
        /** The full sentence naming the minimum four identical tyres must meet, where one is known. */
        public ?string $minimumSentenceDe,
        /** `Document` when either half of the governing minimum came from the Gutachten (R-06). */
        public MinSource $minSource,
    ) {}

    /** No tyres and no minimum: the verdict itself does not permit a Komplettrad. */
    public static function refused(KomplettradRefusal $refusal): self
    {
        return new self([], $refusal, null, MinSource::Derived);
    }
}
