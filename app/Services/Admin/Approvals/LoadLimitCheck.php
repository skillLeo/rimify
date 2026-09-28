<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\LoadIndexCode;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Support\GermanFormat;

/**
 * The free cross-check on a load-index Auflage (the operator's reviews of C9, §3 twice): a limit a Gutachten
 * states is twice the capacity of the index its code names — T88 → 2 × 560 kg = 1.120 kg, fourteen out of
 * fourteen in ABE 55255.
 *
 * Only codes that name an index are checked; an axle-load note (ABE 55255's `140`, 1.400 kg — no index at
 * all) never is. And it WARNS, it does not refuse: the document is the truth and must be recordable as it
 * stands. A mismatch blocks the release until a person confirms the figure with a written reason, shown on
 * the record and audited.
 */
final readonly class LoadLimitCheck
{
    public function __construct(private LoadIndexDeriver $loadIndex) {}

    /** Null when the limit reads, or is not a load-index code; otherwise the warning in words. */
    public function problem(string $code, int $kg): ?string
    {
        $named = LoadIndexCode::indexNamedBy($code);
        $capacity = $named === null ? null : $this->loadIndex->capacityOf($named);

        if ($capacity === null || $kg === 2 * $capacity) {
            return null;
        }

        return sprintf(
            '%s steht für Tragfähigkeitsindex %d: das wären 2 × %s = %s, eingetragen sind %s. Stimmt die Zahl mit dem Gutachten überein, bestätige sie mit einem Satz.',
            $code,
            $named,
            GermanFormat::kilograms($capacity),
            GermanFormat::kilograms(2 * $capacity),
            GermanFormat::kilograms($kg),
        );
    }

    /** The warning for one Auflage of a document, or null. */
    public function warningFor(DocumentCondition $condition): ?string
    {
        if ($condition->kind !== ConditionKind::ReifenTragfaehigkeit || $condition->max_axle_load_kg === null) {
            return null;
        }

        return $this->problem($condition->code, (int) $condition->max_axle_load_kg);
    }

    /**
     * The document's load-index Auflagen that differ from the table and nobody has confirmed — what blocks
     * its release.
     *
     * @return list<string> the codes
     */
    public function unconfirmedIn(ApprovalDocument $document): array
    {
        $open = [];

        foreach ($document->conditions()->get() as $condition) {
            if ($condition->limit_confirmed_at === null && $this->warningFor($condition) !== null) {
                $open[] = $condition->code;
            }
        }

        return $open;
    }
}
