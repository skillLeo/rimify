<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Services\Admin\AuditTrail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Freigeben: a Gutachten and all of its rows become what the shop reads, at once — never row by row.
 *
 * What stops a release is said in sentences (check): no PDF, no rows, a row without a tyre size (the
 * shop could not say which tyre goes on it), a row on a vehicle that was removed or did not come from the
 * vehicle data import. Conflicts with other
 * documents do not stop it: they are recorded (ConflictDetector) and the stricter statement governs
 * until the team decides. A revision replaces the one it supersedes on the same day; the old one stays
 * readable, so an order placed against it can still be explained.
 */
final class DocumentRelease
{
    public function __construct(private readonly ConflictDetector $conflicts) {}

    /** @return list<string> what stops the release, in words; empty when nothing does */
    public function check(ApprovalDocument $document): array
    {
        $blockers = [];

        if ($document->status !== DocumentStatus::Draft) {
            return ['Nur ein Entwurf kann freigegeben werden.'];
        }

        if ($document->pdf_key === null) {
            $blockers[] = 'Das PDF des Gutachtens fehlt.';
        }

        $rows = Fitment::query()->where('approval_document_id', $document->id)->where('status', FitmentStatus::Draft->value);
        $count = (clone $rows)->count();

        if ($count === 0) {
            $blockers[] = 'Es gibt noch keine Zeile im Verwendungsbereich.';

            return $blockers;
        }

        $sizeless = (clone $rows)->whereDoesntHave('tyreSizes')->count();

        if ($sizeless > 0) {
            $blockers[] = $sizeless === 1
                ? 'Eine Zeile hat keine Reifengröße. Ohne sie kann der Shop keinen Reifen nennen.'
                : "{$sizeless} Zeilen haben keine Reifengröße. Ohne sie kann der Shop keinen Reifen nennen.";
        }

        $gone = (clone $rows)->whereHas('vehicle', static fn ($q) => $q->onlyTrashed())->count()
            + (clone $rows)->whereDoesntHave('vehicle')->count();

        if ($gone > 0) {
            $blockers[] = $gone === 1 ? 'Eine Zeile nennt ein Fahrzeug, das entfernt wurde.' : "{$gone} Zeilen nennen Fahrzeuge, die entfernt wurden.";
        }

        $unsourced = (clone $rows)->whereHas('vehicle', self::notImported(...))->count();

        if ($unsourced > 0) {
            $blockers[] = ($unsourced === 1
                ? 'Eine Zeile nennt ein Fahrzeug, das nicht aus dem Fahrzeugdaten-Import stammt.'
                : "{$unsourced} Zeilen nennen Fahrzeuge, die nicht aus dem Fahrzeugdaten-Import stammen.")
                .' Im Shop steht nur ein Fahrzeug, dessen Typdaten aus einer amtlichen oder lizenzierten Quelle kommen.';
        }

        return $blockers;
    }

    /**
     * A car no freigegebenes Gutachten may name (BUGS.md DATA-01): one that did not come from an
     * authoritative vehicle import (`source` = `import:<dataset>`). The development cars carry made-up
     * type keys; outside production they stand in for the import so the admin flows can be worked, never
     * in it — and there is no switch that changes that.
     *
     * @param  Builder<Vehicle>  $query
     */
    private static function notImported(Builder $query): void
    {
        $query->where('source', 'not like', 'import:%');

        if (! app()->isProduction()) {
            $query->where('is_demo', false);
        }
    }

    /** @return array{rows: int, conflicts: int} */
    public function release(ApprovalDocument $document, AdminUser $admin): array
    {
        $blockers = $this->check($document);

        if ($blockers !== []) {
            throw ValidationException::withMessages(['release' => 'Noch nicht freigebbar: '.implode(' ', $blockers)]);
        }

        return DB::transaction(function () use ($document, $admin): array {
            $conflicts = $this->conflicts->detect($document, $admin);
            $rows = Fitment::query()->where('approval_document_id', $document->id)->where('status', FitmentStatus::Draft->value)
                ->update(['status' => FitmentStatus::Published->value, 'updated_at' => now()]);

            if ($document->supersedes_id !== null) {
                ApprovalDocument::query()->whereKey($document->supersedes_id)
                    ->where('status', DocumentStatus::Published->value)
                    ->update(['status' => DocumentStatus::Superseded->value, 'valid_to' => now()->toDateString(), 'updated_at' => now()]);
            }

            // The one entry point for a publish: caches forgotten, subscribers told (the event).
            $document->publish();

            AuditTrail::record($admin, 'approval.released', [
                'document' => FitmentRows::label($document),
                'rows' => $rows,
                'conflicts' => count($conflicts),
            ], $document);

            return ['rows' => $rows, 'conflicts' => count($conflicts)];
        });
    }
}
