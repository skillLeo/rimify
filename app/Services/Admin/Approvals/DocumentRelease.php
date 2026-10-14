<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Dashboard\Coverage;
use App\Services\GoLive\TyreConfirmations;
use App\Services\Storefront\FitmentCount;
use App\Services\Storefront\HomeStats;
use App\Services\Storefront\MegaMenu;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Freigeben: a Gutachten and all of its rows become what the shop reads, at once — never row by row.
 *
 * What stops a release is said in sentences (check): no PDF, no rows, a row without a tyre size (the
 * shop could not say which tyre goes on it), a row on a vehicle that was removed or has no authoritative
 * source (VehicleSource), a code the document does not define. Conflicts with other documents do not
 * stop it: they are recorded (ConflictDetector), and the shop answers UNKNOWN where the documents
 * disagree until the team decides on the Konflikte page. A revision replaces the one it supersedes on the same day; the old one stays
 * readable, so an order placed against it can still be explained.
 */
final class DocumentRelease
{
    /** The audit property that marks a release made on the operator's written instruction, not in the browser. */
    public const ON_INSTRUCTION = 'on_instruction';

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

        // A load-index limit that differs from twice its index's capacity stands as the document states it,
        // once a person has confirmed it with a reason (the second review of C9, §3).
        foreach (app(LoadLimitCheck::class)->unconfirmedIn($document) as $code) {
            $blockers[] = "Die Achslast bei {$code} passt nicht zum Tragfähigkeitsindex. Bestätige die Zahl im Auflagenverzeichnis mit einem Satz.";
        }
        $rows = Fitment::query()->where('approval_document_id', $document->id)->where('status', FitmentStatus::Draft->value);
        $count = (clone $rows)->count();

        if ($count === 0) {
            // A base whose Verwendungsbereich stands in its Nachtrag's Anlagen (ABE 53841: „Anlage/n zum Prüfbericht
            // 1–16“ of 366-0350-21-WIRD/N1) has no rows of its own and is released for its own facts — § 15 FZV among
            // them, which its Nachträge then carry. Every other document without a row is not releasable.
            $base = ApprovalDocument::query()->where('supplement_to_id', $document->id)->exists();

            if (! $base) {
                $blockers[] = 'Es gibt noch keine Zeile im Verwendungsbereich.';
            }

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

        // BUGS.md DATA-01: only a car with an authoritative source — an import, a Gutachten, a check by
        // hand — is ever named by what the shop reads. The development cars carry made-up type keys, and
        // no environment and no test lets them through: there is no exception to forget.
        $unsourced = (clone $rows)->whereHas('vehicle', static fn (Builder $q) => $q->whereNotIn('source', VehicleSource::releasable()))->count();

        if ($unsourced > 0) {
            $blockers[] = ($unsourced === 1
                ? 'Eine Zeile nennt ein Fahrzeug ohne belegte Herkunft, etwa aus den Entwicklungsdaten.'
                : "{$unsourced} Zeilen nennen Fahrzeuge ohne belegte Herkunft, etwa aus den Entwicklungsdaten.")
                .' Freigeben lässt sich nur eine Zeile, deren Fahrzeug aus einem Import der Fahrzeugdaten oder aus einem Gutachten stammt oder von Hand geprüft wurde.';
        }

        // A code its own document does not define has no sentence: never released, never borrowed from
        // another document (the corrections memo §1).
        foreach (DocumentConditions::unresolvedIn($document) as $open) {
            $blockers[] = "Code {$open['code']} ist in diesem Gutachten nicht definiert".($open['rows'] === 1 ? ' (eine Zeile).' : " ({$open['rows']} Zeilen).")
                .' Leg ihn im Auflagenverzeichnis an oder nimm ihn aus den Zeilen.';
        }

        return $blockers;
    }

    /**
     * `$instruction` is set only by ReleaseOnInstruction, outside the live shop: the operator's written word, kept on
     * the entry so the Protokoll says who decided instead of suggesting a person pressed „Freigeben“.
     *
     * @return array{rows: int, conflicts: int}
     */
    public function release(ApprovalDocument $document, AdminUser $admin, ?string $instruction = null): array
    {
        $blockers = $this->check($document);

        if ($blockers !== []) {
            throw ValidationException::withMessages(['release' => 'Noch nicht freigebbar: '.implode(' ', $blockers)]);
        }

        return DB::transaction(function () use ($document, $admin, $instruction): array {
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
                ...($instruction === null ? [] : [
                    self::ON_INSTRUCTION => $instruction,
                    'environment' => (string) app()->environment(),
                ]),
            ], $document);

            return ['rows' => $rows, 'conflicts' => count($conflicts)];
        });
    }

    /**
     * Freigabe zurücknehmen: a released document and all of its rows back to Entwurf at once, so nothing it says reaches a
     * customer until a person releases it again through check() (the operator's brief of 14.10.2026, §4: an entry that
     * leans the permissive way comes off the shop until it is complete — D-225). Orders keep what they were told: their
     * snapshots are frozen (R-12) and not touched. A revision it superseded stays superseded: the car loses the answer
     * rather than getting an older one back unasked (fails closed).
     *
     * @return int the rows taken off the shop
     */
    public function takeBack(ApprovalDocument $document, AdminUser $admin, string $reason, ?string $instruction = null): int
    {
        if ($document->status !== DocumentStatus::Published) {
            throw ValidationException::withMessages(['release' => 'Zurücknehmen lässt sich nur eine Freigabe: Dieses Gutachten ist nicht freigegeben.']);
        }

        $vehicleIds = Fitment::query()->where('approval_document_id', $document->id)->distinct()->pluck('vehicle_id')->map(static fn ($id): int => (int) $id)->all();

        $rows = DB::transaction(function () use ($document, $admin, $reason, $instruction): int {
            $rows = Fitment::query()->where('approval_document_id', $document->id)->where('status', FitmentStatus::Published->value)
                ->update(['status' => FitmentStatus::Draft->value, 'updated_at' => now()]);

            $document->forceFill(['status' => DocumentStatus::Draft->value, 'valid_from' => null])->save();

            AuditTrail::record($admin, 'approval.taken_back', [
                'document' => FitmentRows::label($document),
                'rows' => $rows,
                'reason' => $reason,
                ...($instruction === null ? [] : [
                    self::ON_INSTRUCTION => $instruction,
                    'environment' => (string) app()->environment(),
                ]),
            ], $document);

            return $rows;
        });

        // What a publish forgets (ForgetCoverage, NotifyFitmentSubscribers), forgotten the other way round — no mail.
        Coverage::forget();
        HomeStats::forget();
        MegaMenu::forget();
        TyreConfirmations::forget();

        foreach ($vehicleIds as $vehicleId) {
            FitmentCount::forget($vehicleId);
        }

        return $rows;
    }
}
