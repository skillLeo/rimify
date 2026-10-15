<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Fitment\Data\ConflictDecision;
use App\Enums\ConflictStatus;
use App\Http\Controllers\Admin\GutachtenController;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\FitmentConflict;
use App\Models\FitmentTyreSize;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Dashboard\Coverage;
use App\Services\Storage\DocumentFiles;
use App\Support\GermanFormat;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Gutachten › Konflikte (the corrections memo §3): where two current documents say different things about
 * the same car and wheel, the shop answers UNKNOWN until a person decides here — „beide gelten jeweils für
 * sich“ or „nur Dokument X gilt“, with a reason. A decision covers every conflict of that car and wheel,
 * is audited, and is what the engine reads from then on (EloquentFitmentRepository::conflictDecisionsFor).
 *
 * The page shows a pair once, with each document's side as the document itself says it: its Eintragung,
 * its tyre sizes, its Auflagen in its own words, and the page they stand on.
 *
 * @phpstan-type Side array{documentId: int, document: string, href: string, pdfHref: string|null, page: int|null, requiresEntry: bool, sizes: list<string>, conditions: list<string>}
 * @phpstan-type Pair array{key: string, vehicleId: int, vehicle: string, configId: int, wheel: string, what: list<string>, sides: list<Side>, decision: array{mode: string, document: string|null, reason: string, by: string|null, at: string|null}|null}
 */
final class ConflictDecisions
{
    /** What differs, as the list says it. */
    private const WHAT = [
        'ENTRY_REQUIREMENT' => 'Eintragung',
        'TYRE_SIZES' => 'Reifengrößen',
        'WIDTH_ET_RANGE' => 'Breite oder ET',
        'CONDITIONS' => 'Auflagen',
    ];

    /**
     * The open pairs, oldest first — the one waiting longest on top.
     *
     * @return list<Pair>
     */
    public function open(): array
    {
        return $this->pairs(FitmentConflict::query()->open()->orderBy('created_at')->orderBy('id')->get());
    }

    /**
     * The last decisions, newest first.
     *
     * @return list<Pair>
     */
    public function decided(int $limit = 30): array
    {
        $conflicts = FitmentConflict::query()->where('status', '<>', ConflictStatus::Open->value)
            ->whereNotNull('resolved_at')->orderByDesc('resolved_at')->limit($limit * 4)->get();

        return array_slice($this->pairs($conflicts), 0, $limit);
    }

    /**
     * The documents a pair's open conflicts are between.
     *
     * @return list<int>
     */
    public static function documentsOf(int $vehicleId, int $configId): array
    {
        $fitments = FitmentConflict::query()->open()->where('vehicle_id', $vehicleId)->where('wheel_config_id', $configId)
            ->get(['candidate_fitment_id', 'existing_fitment_id'])
            ->flatMap(static fn (FitmentConflict $c): array => array_filter([$c->getAttribute('candidate_fitment_id'), $c->getAttribute('existing_fitment_id')]))
            ->unique()->values()->all();

        return Fitment::query()->whereIn('id', $fitments)->distinct()->pluck('approval_document_id')
            ->map(static fn (mixed $id): int => (int) $id)->sort()->values()->all();
    }

    /** Settles every open conflict of the pair as the person decided, and says so in the Protokoll. */
    public function decide(int $vehicleId, int $configId, string $mode, ?int $documentId, string $reason, AdminUser $admin): void
    {
        DB::transaction(function () use ($vehicleId, $configId, $mode, $documentId, $reason, $admin): void {
            $conflicts = FitmentConflict::query()->open()->where('vehicle_id', $vehicleId)->where('wheel_config_id', $configId)->lockForUpdate()->get();
            $only = $mode === ConflictDecision::ONLY;

            foreach ($conflicts as $conflict) {
                $conflict->forceFill([
                    'status' => $only ? ConflictStatus::ResolvedSupersede->value : ConflictStatus::ResolvedIntersection->value,
                    'prevailing_document_id' => $only ? $documentId : null,
                    'resolved_by' => $admin->id,
                    'resolved_at' => now(),
                    'resolution_note' => $reason,
                ])->save();
            }

            $first = $conflicts->first();
            $document = $only && $documentId !== null ? ApprovalDocument::query()->find($documentId) : null;

            AuditTrail::record($admin, 'conflict.decided', [
                'vehicle' => $first?->vehicle === null ? null : GutachtenController::vehicleLabel($first->vehicle),
                'wheel' => $first?->wheelConfig?->label(),
                'mode' => $mode,
                'document' => $document === null ? null : FitmentRows::label($document),
                'reason' => $reason,
                'conflicts' => $conflicts->count(),
            ], $first);
        });

        // What the shop may show changed: the Abdeckung is counted again.
        Coverage::forget();
    }

    /**
     * @param  Collection<int, FitmentConflict>  $conflicts
     * @return list<Pair>
     */
    private function pairs(Collection $conflicts): array
    {
        $conflicts->load(['vehicle' => static fn ($q) => $q->withTrashed(), 'wheelConfig.wheelModel.brand', 'wheelConfig.wheelFinish']);
        $fitmentIds = $conflicts->flatMap(static fn (FitmentConflict $c): array => array_filter([$c->getAttribute('candidate_fitment_id'), $c->getAttribute('existing_fitment_id')]))->unique()->values()->all();
        $fitments = Fitment::query()->with(['approvalDocument.conditions', 'tyreSizes', 'conditionCodes'])->whereIn('id', $fitmentIds)->get()->keyBy('id');
        $deciders = AdminUser::query()->whereIn('id', $conflicts->pluck('resolved_by')->filter()->unique()->all())->pluck('name', 'id');
        $pairs = [];

        foreach ($conflicts as $conflict) {
            $key = $conflict->getAttribute('vehicle_id').'-'.$conflict->getAttribute('wheel_config_id');

            if (! isset($pairs[$key])) {
                $config = $conflict->wheelConfig;
                $pairs[$key] = [
                    'key' => $key,
                    'vehicleId' => (int) $conflict->getAttribute('vehicle_id'),
                    'vehicle' => $conflict->vehicle === null ? '–' : GutachtenController::vehicleLabel($conflict->vehicle),
                    'configId' => (int) $conflict->getAttribute('wheel_config_id'),
                    'wheel' => trim(GutachtenController::modelName($config?->wheelModel).' '.($config?->label() ?? '')),
                    'what' => [],
                    'sides' => [],
                    'decision' => $conflict->status === ConflictStatus::Open ? null : self::decision($conflict, $deciders->all()),
                ];
            }

            $pairs[$key]['what'][self::WHAT[$conflict->kind->value]] = true;

            foreach ([$conflict->getAttribute('existing_fitment_id'), $conflict->getAttribute('candidate_fitment_id')] as $id) {
                $row = $id === null ? null : $fitments->get((int) $id);

                if ($row instanceof Fitment && $row->approvalDocument !== null) {
                    $pairs[$key]['sides'][(int) $row->approval_document_id] = self::side($row, $pairs[$key]['sides'][(int) $row->approval_document_id] ?? null);
                }
            }
        }

        return array_values(array_map(static function (array $pair): array {
            $pair['what'] = array_keys($pair['what']);
            $pair['sides'] = array_values($pair['sides']);

            return $pair;
        }, $pairs));
    }

    /**
     * One document's side of a pair — merged over its rows (a document may hold a front and a rear row).
     *
     * @param  Side|null  $merged
     * @return Side
     */
    private static function side(Fitment $row, ?array $merged): array
    {
        $document = $row->approvalDocument;
        $defined = $document->conditions->keyBy('code');
        $sizes = $row->tyreSizes->map(static fn (FitmentTyreSize $s): string => GermanFormat::tyreSize($s->width_mm, $s->aspect, (float) $s->diameter_in).($s->axle->value === 'ALL' ? '' : ' ('.$s->axle->labelDe().')'))->all();
        $conditions = $row->conditionCodes->map(static fn ($c): string => $c->code.' – '.($defined->get($c->code)->text_de ?? 'im Auflagenverzeichnis nicht hinterlegt'))->all();

        return [
            'documentId' => (int) $document->id,
            'document' => FitmentRows::label($document),
            'href' => '/admin/gutachten/'.$document->id,
            'pdfHref' => self::pdfAt($document, $row->source_page),
            'page' => $merged['page'] ?? $row->source_page,
            'requiresEntry' => ($merged['requiresEntry'] ?? false) || $row->requires_entry,
            'sizes' => array_values(array_unique([...($merged['sizes'] ?? []), ...$sizes])),
            'conditions' => array_values(array_unique([...($merged['conditions'] ?? []), ...$conditions])),
        ];
    }

    /** The PDF at the row's page, or null when there is no file to open. */
    private static function pdfAt(ApprovalDocument $document, ?int $page): ?string
    {
        if ($document->pdf_key === null) {
            return null;
        }

        // Where the file is (D-229), never where storage points now.
        $url = app(DocumentFiles::class)->locate($document->pdf_key)['url'];

        if ($url === null) {
            return null;
        }

        return $page === null ? $url : $url.'#page='.$page;
    }

    /**
     * @param  array<int|string, mixed>  $deciders
     * @return array{mode: string, document: string|null, reason: string, by: string|null, at: string|null}
     */
    private static function decision(FitmentConflict $conflict, array $deciders): array
    {
        $prevailing = $conflict->getAttribute('prevailing_document_id');
        $document = $prevailing === null ? null : ApprovalDocument::query()->find((int) $prevailing);
        $by = $deciders[(int) $conflict->getAttribute('resolved_by')] ?? null;

        return [
            'mode' => $conflict->status === ConflictStatus::ResolvedSupersede ? ConflictDecision::ONLY : ConflictDecision::EACH,
            'document' => $document === null ? null : FitmentRows::label($document),
            'reason' => (string) ($conflict->getAttribute('resolution_note') ?? ''),
            'by' => is_string($by) ? $by : null,
            'at' => GermanFormat::dateTime($conflict->resolved_at),
        ];
    }
}
