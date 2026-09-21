<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Infrastructure;

use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\Severity;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\ApprovalDocument;
use App\Models\ConditionCode;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\WheelConfig;
use DateTimeImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * The engine's approval contract, over Eloquent.
 *
 * Visibility is enforced HERE, once, rather than left to each caller: every query filters to
 * published rows of published documents inside their validity window. A superseded revision, a
 * withdrawn document or a retired row is not "filtered out later" — it never crosses this
 * boundary, so no surface can forget to exclude it.
 */
final readonly class EloquentFitmentRepository implements FitmentRepository
{
    /** @return list<FitmentRow> */
    public function publishedRowsFor(int $vehicleId, int $wheelConfigId): array
    {
        $rows = Fitment::query()
            ->with(['approvalDocument', 'tyreSizes', 'conditions'])
            ->where('fitments.vehicle_id', $vehicleId)
            ->where('fitments.status', FitmentStatus::Published->value)
            ->where('fitments.wheel_config_id', $wheelConfigId)
            ->whereHas('approvalDocument', $this->currentlyValid(...))
            ->orderBy('fitments.id')
            ->get();

        return $rows->map($this->toRow(...))->values()->all();
    }

    public function hasPublishedDocumentForConfig(int $wheelConfigId): bool
    {
        return Fitment::query()
            ->where('fitments.wheel_config_id', $wheelConfigId)
            ->where('fitments.status', FitmentStatus::Published->value)
            ->whereHas('approvalDocument', $this->currentlyValid(...))
            ->exists();
    }

    public function findWheelConfig(int $wheelConfigId): ?WheelConfigRecord
    {
        $config = WheelConfig::query()
            ->with(['wheelModel.brand', 'wheelFinish'])
            ->find($wheelConfigId);

        return $config === null ? null : self::toWheelConfig($config);
    }

    /**
     * Published, and inside its validity window on both sides. A null bound is unbounded — a
     * document with no `valid_to` is the current revision, not one that expired at midnight.
     *
     * @param  Builder<ApprovalDocument>  $query
     */
    private function currentlyValid(Builder $query): void
    {
        $today = now()->toDateString();

        $query
            ->where('status', DocumentStatus::Published->value)
            ->where(fn ($q) => $q->whereNull('valid_from')->orWhere('valid_from', '<=', $today))
            ->where(fn ($q) => $q->whereNull('valid_to')->orWhere('valid_to', '>=', $today));
    }

    private function toRow(Fitment $fitment): FitmentRow
    {
        $document = $fitment->approvalDocument;

        return new FitmentRow(
            id: $fitment->id,
            document: new DocumentRecord(
                id: $document->id,
                kind: $document->kind->value,
                number: $document->number(),
                revision: $document->revision,
                issuedOn: $document->issued_on === null
                    ? null
                    : DateTimeImmutable::createFromInterface($document->issued_on),
                pdfKey: $document->pdf_key,
                pdfSha256: $document->pdf_sha256,
                sourcePage: $fitment->source_page,
                issuer: $document->issuer,
            ),
            vehicleId: $fitment->vehicle_id,
            wheelConfigId: $fitment->wheel_config_id,
            axle: $fitment->axle->value,
            buildWindow: BuildWindow::fromDates($fitment->build_from, $fitment->build_to),
            permittedWidthMin: $fitment->permitted_width_min,
            permittedWidthMax: $fitment->permitted_width_max,
            permittedEtMin: $fitment->permitted_et_min,
            permittedEtMax: $fitment->permitted_et_max,
            requiresEntry: $fitment->requires_entry,
            entryNoteDe: $fitment->entry_note_de,
            tyreSizes: $fitment->tyreSizes
                ->map(static fn (FitmentTyreSize $size): TyreSize => new TyreSize(
                    widthMm: $size->width_mm,
                    aspect: $size->aspect,
                    diameterIn: $size->diameter_in,
                    documentMinLoadIndex: $size->min_load_index,
                    documentMinSpeedSymbol: $size->min_speed_symbol,
                ))
                ->values()
                ->all(),
            conditions: $fitment->conditions
                ->map(static function (ConditionCode $code): Condition {
                    $noteDe = $code->pivot?->getAttribute('note_de');

                    return new Condition(
                        code: $code->code,
                        // The application enum and the engine's own Severity carry identical
                        // values by design; a test asserts they stay identical.
                        severity: Severity::from($code->severity->value),
                        textDe: $code->text_de,
                        textEn: $code->text_en,
                        affectsTyreChoice: $code->affects_tyre_choice,
                        affectsPurchase: $code->affects_purchase,
                        requiresAcknowledgement: $code->requires_acknowledgement,
                        noteDe: is_string($noteDe) ? $noteDe : null,
                    );
                })
                ->values()
                ->all(),
        );
    }

    public static function toWheelConfig(WheelConfig $config): WheelConfigRecord
    {
        return new WheelConfigRecord(
            id: $config->id,
            wheelModelId: $config->wheel_model_id,
            wheelFinishId: $config->wheel_finish_id,
            diameterIn: $config->diameter_in,
            widthIn: $config->width_in,
            etMm: $config->et_mm,
            boltHoles: $config->bolt_holes,
            boltCircleMm: $config->bolt_circle_mm,
            centreBoreMm: $config->centre_bore_mm,
            priceCents: $config->price_cents,
            stockQty: $config->stock_qty,
            sku: $config->sku,
            modelName: $config->relationLoaded('wheelModel') ? $config->wheelModel?->name : null,
            brandName: $config->relationLoaded('wheelModel') ? $config->wheelModel?->brand?->name : null,
            finishNameDe: $config->relationLoaded('wheelFinish') ? $config->wheelFinish?->name_de : null,
        );
    }
}
