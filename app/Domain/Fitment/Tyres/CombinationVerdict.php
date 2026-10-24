<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Verdict\VerdictStatus;

/**
 * A Komplettrad as one of the tyre combinations the Gutachten names (the operator's decision of 24.10.2026 on the client's
 * item 8, D-335): two wheels on the front axle in the size the combination names for it, two on the rear in its size —
 * each axle answered on its own (AxleVerdict), the whole the weaker of the two. One axle refused is the set refused: a
 * front that passes never lifts a rear that fails to „mit Auflagen“.
 */
final readonly class CombinationVerdict
{
    public function __construct(
        public TyrePairing $pairing,
        public AxleVerdict $front,
        public AxleVerdict $rear,
        /** The page the combination stands on — the document's list's (D-256), or the Auflage's whose sentence prints it. */
        public ?int $sourcePage = null,
    ) {}

    /** The weaker axle: NOT_PERMITTED, then UNKNOWN, then CONDITIONAL, then PERMITTED (R-03, R-07). */
    public function status(): VerdictStatus
    {
        return VerdictStatus::weaker($this->front->status, $this->rear->status);
    }

    public function isSellable(): bool
    {
        return $this->status()->isSellable();
    }

    /** Why not, from the axle that decides it — the weaker one; the front where both are as weak. */
    public function refusal(): ?KomplettradRefusal
    {
        $deciding = VerdictStatus::weaker($this->front->status, $this->rear->status) === $this->front->status ? $this->front : $this->rear;

        return $deciding->refusal ?? $this->front->refusal ?? $this->rear->refusal;
    }

    /**
     * What the order line freezes (R-12): the combination as the document numbers it — its row where it was entered as a
     * list (D-256) —, its page, the answer, and both axles, so each line of the set shows what was sold where.
     *
     * @return array{id: int|null, number: int, sourcePage: int|null, status: string, front: array<string, mixed>, rear: array<string, mixed>}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->pairing->id,
            'number' => $this->pairing->number,
            'sourcePage' => $this->sourcePage,
            'status' => $this->status()->value,
            'front' => $this->front->toArray(),
            'rear' => $this->rear->toArray(),
        ];
    }
}
