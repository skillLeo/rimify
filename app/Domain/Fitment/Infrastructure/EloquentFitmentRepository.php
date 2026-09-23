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
    /**
     * @param  list<int>  $wheelConfigIds
     * @return array<int, list<FitmentRow>>
     */
    public function publishedRowsFor(int $vehicleId, array $wheelConfigIds): array
    {
        $byConfig = array_fill_keys($wheelConfigIds, []);

        if ($wheelConfigIds === []) {
            return $byConfig;
        }

        $rows = Fitment::query()
            ->with(['approvalDocument', 'tyreSizes', 'conditions'])
            ->where('fitments.vehicle_id', $vehicleId)
            ->where('fitments.status', FitmentStatus::Published->value)
            ->whereIn('fitments.wheel_config_id', $wheelConfigIds)
            ->whereHas('approvalDocument', $this->currentlyValid(...))
            ->orderBy('fitments.id')
            ->get();

        foreach ($rows as $row) {
            $byConfig[$row->wheel_config_id][] = $this->toRow($row);
        }

        return $byConfig;
    }

    /**
     * @param  list<int>  $wheelConfigIds
     * @return list<int>
     */
    public function configsWithPublishedDocument(array $wheelConfigIds): array
    {
        if ($wheelConfigIds === []) {
            return [];
        }

        return Fitment::query()
            ->whereIn('fitments.wheel_config_id', $wheelConfigIds)
            ->where('fitments.status', FitmentStatus::Published->value)
            ->whereHas('approvalDocument', $this->currentlyValid(...))
            ->distinct()
            ->pluck('fitments.wheel_config_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param  list<int>  $wheelConfigIds
     * @return array<int, WheelConfigRecord>
     */
    public function findWheelConfigs(array $wheelConfigIds): array
    {
        if ($wheelConfigIds === []) {
            return [];
        }

        $records = [];

        $configs = WheelConfig::query()
            ->with(['wheelModel.brand', 'wheelFinish'])
            ->whereIn('id', $wheelConfigIds)
            ->get();

        foreach ($configs as $config) {
            $records[$config->id] = self::toWheelConfig($config);
        }

        return $records;
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
            // The document's own bore for this vehicle, read off the row and never off the wheel:
            // `toWheelConfig()` below keeps the rim's figure, and the two are different claims.
            centreBoreMm: $fitment->centre_bore_mm,
            tyreSizes: $fitment->tyreSizes
                ->map(static fn (FitmentTyreSize $size): TyreSize => new TyreSize(
                    widthMm: $size->width_mm,
                    aspect: $size->aspect,
                    diameterIn: $size->diameter_in,
                    documentMinLoadIndex: $size->min_load_index,
                    documentMinSpeedSymbol: $size->min_speed_symbol,
                    // The axle the document scoped this size to. Dropping it here is how a
                    // rear-only 275/35 would be offered as a four-wheel set.
                    axle: $size->axle->value,
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
