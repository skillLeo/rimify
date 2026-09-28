<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Enums\ApprovalKind;
use App\Enums\DocumentStatus;
use App\Models\CheckResult;
use App\Support\GermanFormat;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * The printable RIMIFY-Check (the operator's decision of 29.09.2026): the answer for one car and one wheel,
 * asked of the one resolver every surface uses — with the customer's own figures where they typed them —
 * and frozen whole, the tyre sum unfolded, so the page says next week what the shop said today.
 */
final readonly class CheckResults
{
    public function __construct(private FitmentResolver $resolver) {}

    public function issue(int $vehicleId, int $wheelConfigId, ?PapersFigures $papers): CheckResult
    {
        $verdict = $this->resolver->resolve($vehicleId, $wheelConfigId);

        return CheckResult::query()->create([
            // Only letters and digits, 32 of them: a link nobody guesses (chk_check_results_token).
            'token' => Str::random(32),
            'vehicle_id' => $vehicleId,
            'wheel_config_id' => $wheelConfigId,
            'approval_document_id' => $verdict->document?->id,
            'document_revision' => $verdict->document?->revision,
            'verdict_status' => $verdict->status->value,
            'verdict' => $verdict->toArray(),
            'papers' => $papers === null ? null : [
                'axleFrontKg' => $papers->axleFrontKg,
                'axleRearKg' => $papers->axleRearKg,
                'topSpeedKmh' => $papers->topSpeedKmh,
            ],
            'engine_version' => $verdict->snapshot->engineVersion,
            'computed_at' => now(),
        ]);
    }

    /**
     * The frozen answer as the printable page shows it: every sentence, nothing folded. Null when the frozen
     * verdict cannot be read — the page then says so, and invents nothing around it.
     *
     * @return array<string, mixed>|null
     */
    public function present(CheckResult $result): ?array
    {
        try {
            $verdict = FitmentVerdict::fromArray($result->verdict);
        } catch (Throwable) {
            return null;
        }

        $document = $verdict->document;
        $kind = $document === null ? null : (ApprovalKind::tryFrom($document->kind)?->labelDe() ?? $document->kind);
        $today = $result->approval_document_id === null
            ? null
            : DB::table('approval_documents')->where('id', $result->approval_document_id)->value('status');

        return [
            'status' => $verdict->status->value,
            'statusLabel' => $verdict->status->labelDe(),
            'vehicle' => $verdict->vehicleLabel,
            'wheel' => $verdict->wheelLabel,
            'wheelLabel' => $verdict->wheelStatus?->labelDe(),
            'reason' => $verdict->reason?->textDe,
            'requiresEntry' => $verdict->requiresEntry,
            'entryNote' => $verdict->entryNoteDe,
            'conditions' => array_map(static fn (Condition $c): string => $c->sentenceDe(), $verdict->conditions),
            'front' => array_map(static fn (TyreSize $s): string => $s->labelDe(), $verdict->front->sizes),
            'rear' => array_map(static fn (TyreSize $s): string => $s->labelDe(), $verdict->rear->sizes),
            'tyre' => $verdict->tyre === null ? null : [
                'statusLabel' => $verdict->tyre->status->labelDe(),
                'summary' => $verdict->tyre->summary,
                'basis' => $verdict->tyre->basis,
                'lines' => $verdict->tyre->lines,
                'stricterByPapers' => $verdict->tyre->stricterByPapers,
            ],
            'papers' => $result->papers,
            'document' => $document === null ? null : [
                'label' => trim($kind.' '.($document->number ?? '')),
                'issuer' => $document->issuer,
                'revision' => $document->revision,
                'page' => $document->sourcePage,
            ],
            // The frozen answer stands as it was; where the document has changed since, the page says so.
            'documentToday' => match ($today) {
                null, DocumentStatus::Published->value => null,
                DocumentStatus::Superseded->value => 'Das Gutachten wurde seitdem durch eine neuere Fassung ersetzt. Prüf die Felge erneut, bevor du kaufst.',
                DocumentStatus::Withdrawn->value => 'Das Gutachten wurde seitdem zurückgezogen. Prüf die Felge erneut, bevor du kaufst.',
                default => 'Das Gutachten hat sich seitdem geändert. Prüf die Felge erneut, bevor du kaufst.',
            },
            'issuedAt' => GermanFormat::dateTime($result->created_at ?? $result->computed_at),
        ];
    }
}
