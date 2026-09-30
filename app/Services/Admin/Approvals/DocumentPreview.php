<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Fitment\Contracts\Clock;
use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Infrastructure\EloquentFitmentRepository;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\PapersWording;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Http\Controllers\Admin\GutachtenController;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\WheelConfig;

/**
 * What the shop will say about one car once this Gutachten is freigegeben — computed by the same
 * resolver every customer surface uses (R-13), reading this document's draft rows as if released and
 * without the revision it replaces (EloquentFitmentRepository::forPreviewOf). Nothing is published by
 * looking; the verdicts are exactly the ones the shop will give.
 */
final class DocumentPreview
{
    public function __construct(
        private readonly VehicleRepository $vehicles,
        private readonly LoadIndexDeriver $loadIndex,
        private readonly SpeedSymbolDeriver $speedSymbol,
        private readonly Clock $clock,
    ) {}

    /**
     * @return list<array{config: int, wheel: string, status: string, statusLabel: string, reason: string|null, requiresEntry: bool, entryNote: string|null, conditions: list<string>, front: list<string>, rear: list<string>, sourcePage: int|null}>
     */
    public function for(ApprovalDocument $document, int $vehicleId): array
    {
        $configIds = Fitment::query()->where('approval_document_id', $document->id)->where('vehicle_id', $vehicleId)
            ->distinct()->orderBy('wheel_config_id')->pluck('wheel_config_id')
            ->map(static fn (mixed $id): int => (int) $id)->values()->all();

        if ($configIds === []) {
            return [];
        }

        $resolver = new FitmentResolver($this->vehicles, EloquentFitmentRepository::forPreviewOf($document), $this->loadIndex, $this->speedSymbol, $this->clock);
        $pages = Fitment::query()->where('approval_document_id', $document->id)->where('vehicle_id', $vehicleId)->pluck('source_page', 'wheel_config_id');
        // Named by the catalogue, whatever the verdict: a refusal carries no wheel label of its own.
        $names = WheelConfig::query()->with('wheelModel.brand')->whereIn('id', $configIds)->get()
            ->mapWithKeys(static fn (WheelConfig $c): array => [(int) $c->id => GutachtenController::modelName($c->wheelModel).' · '.$c->label()]);
        $out = [];

        foreach ($resolver->resolveMany($vehicleId, $configIds) as $configId => $verdict) {
            $out[] = [
                'config' => (int) $configId,
                'wheel' => $names[$configId] ?? $verdict->wheelLabel ?? '#'.$configId,
                'status' => $verdict->status->value,
                'statusLabel' => $verdict->status->labelDe(),
                'reason' => $verdict->status === VerdictStatus::Permitted || $verdict->status === VerdictStatus::Conditional ? null : $verdict->reason?->textDe,
                'requiresEntry' => $verdict->requiresEntry,
                // What the shop will say about the papers, word for word (PapersWording).
                'entryLine' => PapersWording::entryLine($verdict->requiresEntry, $verdict->papersExempt()),
                'papersLine' => PapersWording::papersLine($verdict->papersExempt()),
                'entryNote' => $verdict->entryNoteDe,
                'conditions' => array_map(static fn (Condition $c): string => $c->sentenceDe(), $verdict->conditions),
                'front' => array_map(static fn ($s): string => $s->labelDe(), $verdict->front->sizes),
                'rear' => array_map(static fn ($s): string => $s->labelDe(), $verdict->rear->sizes),
                'sourcePage' => isset($pages[$configId]) ? (int) $pages[$configId] : null,
            ];
        }

        return $out;
    }
}
