<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Infrastructure;

use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Data\ConflictDecision;
use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\RowFilter;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Enums\ConflictStatus;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Models\Fitment;
use App\Models\WheelConfig;
use DateTimeImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * The engine's approval contract, over Eloquent.
 *
 * Visibility is enforced HERE, once, rather than left to each caller: every query filters to
 * published rows of published documents inside their validity window. A superseded revision, a
 * withdrawn document or a retired row is not "filtered out later" — it never crosses this
 * boundary, so no surface can forget to exclude it.
 *
 * One exception, and only by construction: the admin's preview of a document before it is freigegeben
 * (forPreviewOf) reads that document's own draft rows as if they were published — and hides the
 * revision it replaces — so the team sees exactly what the shop will say once they release it. No
 * customer-facing surface ever builds a repository that way; the container binds the plain one.
 */
final readonly class EloquentFitmentRepository implements FitmentRepository
{
    public function __construct(private ?int $previewDocumentId = null, private ?int $previewHidesDocumentId = null) {}

    /** What the shop would read once this document is freigegeben — for the admin's preview only. */
    public static function forPreviewOf(ApprovalDocument $document): self
    {
        return new self((int) $document->id, $document->supersedes_id);
    }

    /**
     * Published rows of currently valid documents — and, in a preview, the previewed document's rows.
     *
     * @param  Builder<Fitment>  $query
     */
    private function visible(Builder $query): void
    {
        $preview = $this->previewDocumentId;
        $hidden = $this->previewHidesDocumentId;

        if ($preview === null) {
            $query->where('fitments.status', FitmentStatus::Published->value)
                ->whereHas('approvalDocument', $this->currentlyValid(...));

            return;
        }

        $query->where(function (Builder $either) use ($preview): void {
            $either->where(function (Builder $published): void {
                $published->where('fitments.status', FitmentStatus::Published->value)
                    ->whereHas('approvalDocument', $this->currentlyValid(...));
            })->orWhere(static function (Builder $draft) use ($preview): void {
                $draft->where('fitments.approval_document_id', $preview)
                    ->where('fitments.status', '<>', FitmentStatus::Retired->value);
            });
        });

        if ($hidden !== null) {
            $query->where('fitments.approval_document_id', '<>', $hidden);
        }
    }

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
            ->with(['approvalDocument.conditions', 'tyreSizes.conditionCodes', 'conditionCodes'])
            ->where('fitments.vehicle_id', $vehicleId)
            ->whereIn('fitments.wheel_config_id', $wheelConfigIds)
            ->tap($this->visible(...))
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
            ->tap($this->visible(...))
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
     * What a person decided on the Konflikte page, per configuration: the newest decision for the pair,
     * unless a conflict about it is still open — then it is undecided again, and absent here.
     *
     * @param  list<int>  $wheelConfigIds
     * @return array<int, ConflictDecision>
     */
    public function conflictDecisionsFor(int $vehicleId, array $wheelConfigIds): array
    {
        if ($wheelConfigIds === []) {
            return [];
        }

        $conflicts = DB::table('fitment_conflicts')
            ->where('vehicle_id', $vehicleId)
            ->whereIn('wheel_config_id', $wheelConfigIds)
            ->orderBy('resolved_at')
            ->orderBy('id')
            ->get(['wheel_config_id', 'status', 'prevailing_document_id']);

        $decisions = [];
        $open = [];

        foreach ($conflicts as $conflict) {
            $config = (int) $conflict->wheel_config_id;

            $decision = match ($conflict->status) {
                ConflictStatus::Open->value => null,
                ConflictStatus::ResolvedSupersede->value => $conflict->prevailing_document_id === null ? null : ConflictDecision::only((int) $conflict->prevailing_document_id),
                // Both stand, or there was nothing between them: read together, toward caution.
                default => ConflictDecision::each(),
            };

            if ($decision === null) {
                $open[$config] = true;
            } else {
                $decisions[$config] = $decision;
            }
        }

        return array_diff_key($decisions, $open);
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

    /**
     * A row as the engine reads it. Its codes are looked up in its OWN document's Auflagenverzeichnis and
     * nowhere else (the corrections memo §1): a code the document does not define is kept as unresolved —
     * the verdict is UNKNOWN — and a body-style or drive code becomes a filter, not a sentence. The
     * Eintragung is derived per tyre size from an Abnahme among its codes and the row's (§2), unless a
     * person overrode it with a reason, which the customer then reads as the Prüfer's.
     */
    private function toRow(Fitment $fitment): FitmentRow
    {
        $document = $fitment->approvalDocument;
        /** @var array<string, DocumentCondition> $defined */
        $defined = $document->conditions->keyBy('code')->all();
        $unresolved = [];
        $filters = [];

        $read = static function (string $code, ?string $note) use ($defined, &$unresolved, &$filters): ?Condition {
            $definition = $defined[$code] ?? null;

            if (! $definition instanceof DocumentCondition) {
                $unresolved[$code] = true;

                return null;
            }

            if ($definition->kind->isFilter()) {
                $filters[$code] = new RowFilter(
                    code: $code,
                    kind: $definition->kind->value,
                    bodyForms: $definition->body_forms ?? [],
                    driveMode: is_array($definition->drive) ? ($definition->drive['mode'] ?? null) : null,
                    drive: is_array($definition->drive) ? ($definition->drive['drive'] ?? null) : null,
                );

                return null;
            }

            return Condition::ofKind($code, $definition->kind, $definition->text_de, $note, $definition->source_page);
        };

        $rowConditions = [];

        foreach ($fitment->conditionCodes as $code) {
            $condition = $read($code->code, $code->note_de);

            if ($condition !== null) {
                $rowConditions[] = $condition;
            }
        }

        $override = $fitment->entry_override;
        $overridden = $override === 'required' ? true : ($override === 'not_required' ? false : null);
        // The stored flag is FitmentRows' own derivation; read as a floor only, so a stale one can make
        // the answer stricter, never looser — and a row written by an import or a seed keeps its word.
        $rowEntry = $fitment->requires_entry || array_filter($rowConditions, static fn (Condition $c): bool => $c->requiresEntry()) !== [];
        $axleOf = static fn (Condition $c): ?string => $c->kind === ConditionKind::ReifenAchse ? ($defined[$c->code]->axle ?? null) : null;
        $rowAxles = array_values(array_filter(array_map($axleOf, $rowConditions)));

        $sizes = [];

        foreach ($fitment->tyreSizes as $size) {
            $own = [];

            foreach ($size->conditionCodes as $code) {
                $condition = $read($code->code, null);

                if ($condition !== null) {
                    $own[] = $condition;
                }
            }

            $sizes[] = new TyreSize(
                widthMm: $size->width_mm,
                aspect: $size->aspect,
                diameterIn: $size->diameter_in,
                documentMinLoadIndex: $size->min_load_index,
                documentMinSpeedSymbol: $size->min_speed_symbol,
                // The axle the document scoped this size to — narrowed further by a „nur Vorderachse“
                // code on it or on the row. Dropping it here is how a rear-only 275/35 would be
                // offered as a four-wheel set.
                axle: self::axle($size->axle->value, [...$rowAxles, ...array_filter(array_map($axleOf, $own))]),
                requiresEntry: $overridden ?? ($rowEntry || array_filter($own, static fn (Condition $c): bool => $c->requiresEntry()) !== []),
                conditions: $own,
            );
        }

        $requiresEntry = $overridden ?? ($rowEntry || array_filter($sizes, static fn (TyreSize $s): bool => $s->requiresEntry) !== []);
        $note = $fitment->entry_note_de;

        if ($overridden === true) {
            $note = trim(($note ?? '').' Laut Prüfer: '.trim((string) $fitment->entry_override_reason));
        }

        if ($overridden === false) {
            // Said, not hidden: the Prüfer's word stands where the Eintragung would have.
            $rowConditions[] = Condition::ofKind('EINTRAGUNG', ConditionKind::Hinweis, 'Laut Prüfer ist keine Eintragung erforderlich: '.trim((string) $fitment->entry_override_reason));
        }

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
            requiresEntry: $requiresEntry,
            entryNoteDe: $note === null || trim($note) === '' ? null : $note,
            // The document's own bore for this vehicle, read off the row and never off the wheel:
            // `toWheelConfig()` below keeps the rim's figure, and the two are different claims.
            centreBoreMm: $fitment->centre_bore_mm,
            tyreSizes: $sizes,
            conditions: $rowConditions,
            unresolvedCodes: array_keys($unresolved),
            filters: array_values($filters),
        );
    }

    /**
     * A size's axle, narrowed by the axle codes on it and on its row: a size for all axles under a
     * „nur Hinterachse“ code is a rear size; a size the document scoped to the front under a rear-only
     * code is on no axle at all (`NONE`) — never offered anywhere.
     *
     * @param  list<string>  $limits
     */
    private static function axle(string $scoped, array $limits): string
    {
        foreach (array_unique($limits) as $limit) {
            if ($scoped === 'ALL') {
                $scoped = $limit;
            } elseif ($scoped !== $limit) {
                return 'NONE';
            }
        }

        return $scoped;
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
