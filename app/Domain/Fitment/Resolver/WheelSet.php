<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Resolver;

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\PairConditions;
use App\Domain\Fitment\Verdict\TyreCheck;
use App\Domain\Fitment\Verdict\VerdictStatus;

/**
 * Two versions of one rim that a released paper names together for one car: one on the front axle, one on the rear (the
 * client's fourth change, 07.11.2026). It decides nothing of its own. Its answers are the engine's two verdicts, each for its
 * version on its axle, as they always were; the set is the weaker of the two, as a set per axle always is (D-335).
 */
final readonly class WheelSet
{
    public function __construct(
        public int $frontConfigId,
        public int $rearConfigId,
        public FitmentVerdict $front,
        public FitmentVerdict $rear,
    ) {}

    /** `3-4`: how an address and a basket line name the set. */
    public function key(): string
    {
        return $this->frontConfigId.'-'.$this->rearConfigId;
    }

    public function status(): VerdictStatus
    {
        return VerdictStatus::weaker($this->front->status, $this->rear->status);
    }

    /**
     * The two answers read as one, for the surfaces that show one and for the tyres that go across both wheels: the front
     * axle as the front version's verdict has it, the rear axle as the rear version's, every Auflage of either, the weaker
     * status of each half. Never stored and never frozen: an order line freezes its own version's verdict.
     */
    public function combined(): FitmentVerdict
    {
        $front = $this->front;
        $rear = $this->rear;

        return new FitmentVerdict(
            status: $this->status(),
            vehicle: $front->vehicle,
            wheel: $front->wheel,
            document: $front->document ?? $rear->document,
            requiresEntry: $front->requiresEntry || $rear->requiresEntry,
            entryNoteDe: $front->entryNoteDe ?? $rear->entryNoteDe,
            conditions: self::conditions($front->conditions, $rear->conditions),
            front: $front->front,
            rear: $rear->rear,
            reason: $front->reason ?? $rear->reason,
            snapshot: $front->snapshot,
            documentCentreBoreMm: null,
            documents: self::documents($front, $rear),
            wheelStatus: $front->wheelStatus === null || $rear->wheelStatus === null ? null : VerdictStatus::weaker($front->wheelStatus, $rear->wheelStatus),
            tyre: self::tyres($front->tyre, $rear->tyre),
            missingFacts: array_values(array_unique([...$front->missingFacts, ...$rear->missingFacts])),
            combinationConditions: $front->combinationConditions === null || $rear->combinationConditions === null
                ? null
                : self::conditions($front->combinationConditions, $rear->combinationConditions),
            sellsAlone: ($front->isSellable() || $front->sellsAlone) && ($rear->isSellable() || $rear->sellsAlone),
            rearWheel: $rear->wheel,
            pairConditions: self::pairs($front->pairConditions, $rear->pairConditions),
        );
    }

    /**
     * Each combination's own Auflagen (D-451), of either half, once per combination: read together, toward caution.
     *
     * @param  list<PairConditions>  $a
     * @param  list<PairConditions>  $b
     * @return list<PairConditions>
     */
    private static function pairs(array $a, array $b): array
    {
        $byKey = [];

        foreach ([...$a, ...$b] as $pair) {
            $byKey[$pair->key()] = isset($byKey[$pair->key()]) ? $byKey[$pair->key()]->joinedWith($pair) : $pair;
        }

        return array_values($byKey);
    }

    /**
     * @param  list<Condition>  $a
     * @param  list<Condition>  $b
     * @return list<Condition>
     */
    private static function conditions(array $a, array $b): array
    {
        $seen = [];

        foreach ([...$a, ...$b] as $condition) {
            $seen[$condition->code."\u{0}".$condition->sentenceDe()] ??= $condition;
        }

        return array_values($seen);
    }

    /** @return list<DocumentRecord> */
    private static function documents(FitmentVerdict $front, FitmentVerdict $rear): array
    {
        $byId = [];

        foreach ([$front, $rear] as $verdict) {
            foreach ($verdict->documents !== [] ? $verdict->documents : array_filter([$verdict->document]) as $document) {
                $byId[$document->id] ??= $document;
            }
        }

        return array_values($byId);
    }

    /** Each axle's own sentence: a surface that shows the summary shows both, never the one half. */
    private static function both(?string $front, ?string $rear): ?string
    {
        return $front === null || $rear === null || $front === $rear ? ($front ?? $rear) : $front.' '.$rear;
    }

    private static function tyres(?TyreCheck $front, ?TyreCheck $rear): ?TyreCheck
    {
        if ($front === null || $rear === null) {
            return null;
        }

        return new TyreCheck(
            VerdictStatus::weaker($front->status, $rear->status),
            array_values(array_unique([...$front->lines, ...$rear->lines])),
            [...$front->thresholds, ...$rear->thresholds],
            $front->fromVehicleData && $rear->fromVehicleData,
            self::both($front->summary, $rear->summary),
            self::both($front->basis, $rear->basis),
            $front->stricterByPapers || $rear->stricterByPapers,
            $front->figuresPermitted && $rear->figuresPermitted,
            array_values(array_unique([...$front->papersOwed, ...$rear->papersOwed])),
        );
    }
}
