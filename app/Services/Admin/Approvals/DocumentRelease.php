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
use App\Support\GermanFormat;
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
            $blockers[] = "Code {$open['code']} ist im Auflagenverzeichnis dieses Gutachtens nicht hinterlegt".($open['rows'] === 1 ? ' (eine Zeile).' : " ({$open['rows']} Zeilen).")
                .' Leg ihn dort an oder nimm ihn aus den Zeilen.';
        }

        return $blockers;
    }

    /**
     * What was entered, counted the way the person releasing counts the PDF (D-228): the Auflagen codes the rows and
     * their sizes carry, the tyre sizes, the wheel versions without a tested load, and the rows that lead to no
     * Abnahme.
     *
     * @return array{codes: int, sizes: int, withoutLoad: int, maxLoadKg: int|null, withoutAbnahme: int, withAbnahme: int}
     */
    public function entered(ApprovalDocument $document): array
    {
        $rows = Fitment::query()->where('approval_document_id', $document->id)->whereNot('status', FitmentStatus::Retired->value);
        $ids = (clone $rows)->pluck('id')->all();
        $sizeIds = DB::table('fitment_tyre_sizes')->whereIn('fitment_id', $ids)->pluck('id')->all();

        $codes = DB::table('fitment_conditions')->whereIn('fitment_id', $ids)->pluck('code')
            ->merge(DB::table('fitment_tyre_size_conditions')->whereIn('fitment_tyre_size_id', $sizeIds)->pluck('code'))
            ->map(static fn (mixed $code): string => (string) $code)->unique();

        $sizes = DB::table('fitment_tyre_sizes')->whereIn('fitment_id', $ids)->get(['width_mm', 'aspect', 'diameter_in'])
            ->map(static fn (object $s): string => $s->width_mm.'/'.$s->aspect.'/'.((float) $s->diameter_in))->unique();

        $loads = DB::table('wheel_configs')->whereIn('id', (clone $rows)->distinct()->pluck('wheel_config_id'))->pluck('max_load_kg');

        return [
            'codes' => $codes->count(),
            'sizes' => $sizes->count(),
            'withoutLoad' => $loads->filter(static fn (mixed $load): bool => $load === null || (int) $load <= 0)->count(),
            'maxLoadKg' => $loads->filter(static fn (mixed $load): bool => $load !== null && (int) $load > 0)->map(static fn (mixed $load): int => (int) $load)->max(),
            'withoutAbnahme' => (clone $rows)->where('requires_entry', false)->count(),
            'withAbnahme' => (clone $rows)->where('requires_entry', true)->count(),
        ];
    }

    /**
     * Where the declaration and the entry differ, in sentences — a refusal, never a warning (the operator's brief of
     * 14.10.2026, §4: an entry that misses a condition, a size, the axle-load limit or the Abnahme errs the permissive way).
     *
     * @return list<string>
     */
    public function declarationBlockers(ApprovalDocument $document, ReleaseDeclaration $declaration): array
    {
        $blockers = [];

        if (! in_array($declaration->completeness, ApprovalDocument::COMPLETENESS, true)) {
            $blockers[] = 'Sag, ob alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst sind.';
        }

        if ($declaration->completeness === ApprovalDocument::PARTIAL && trim((string) $declaration->missing) === '') {
            $blockers[] = 'Nenn die Anlagen oder Bereiche, die noch fehlen.';
        }

        // A base without rows of its own: its Verwendungsbereich is its Nachträge'; there is nothing to count here.
        if (! Fitment::query()->where('approval_document_id', $document->id)->whereNot('status', FitmentStatus::Retired->value)->exists()) {
            return $blockers;
        }

        if ($declaration->codes === null || $declaration->sizes === null || ! in_array($declaration->abnahme, ReleaseDeclaration::ABNAHME, true)) {
            $blockers[] = 'Zähl im Verwendungsbereich die Auflagen-Codes und die Reifengrößen für die erfassten Fahrzeuge, und sag, ob er eine Abnahme verlangt.';

            return $blockers;
        }

        $entered = $this->entered($document);

        if ($declaration->codes !== $entered['codes']) {
            $blockers[] = sprintf('Auflagen-Codes für die erfassten Fahrzeuge laut Verwendungsbereich: %d, erfasst: %d. Trag die fehlenden nach oder zähl noch einmal.', $declaration->codes, $entered['codes']);
        }

        if ($declaration->sizes !== $entered['sizes']) {
            $blockers[] = sprintf('Reifengrößen für die erfassten Fahrzeuge laut Verwendungsbereich: %d, erfasst: %d. Trag die fehlenden nach oder zähl noch einmal.', $declaration->sizes, $entered['sizes']);
        }

        // The limit („nur für Fahrzeuge mit maximaler Achslast 1160 kg“) reaches the shop through the wheel's tested load:
        // half the axle per wheel. Without it the shop does not check the limit at all.
        if ($declaration->axleLimitKg !== null) {
            $perWheel = intdiv($declaration->axleLimitKg, 2);

            if ($entered['withoutLoad'] > 0) {
                $blockers[] = sprintf('Der Verwendungsbereich begrenzt die Achslast auf %s. %s der Felge fehlt die geprüfte Radlast – trag höchstens %s je Rad ein, sonst prüft der Shop die Grenze nicht.',
                    GermanFormat::kilograms($declaration->axleLimitKg), $entered['withoutLoad'] === 1 ? 'Bei einer Ausführung' : "Bei {$entered['withoutLoad']} Ausführungen", GermanFormat::kilograms($perWheel));
            } elseif ($entered['maxLoadKg'] !== null && $entered['maxLoadKg'] > $perWheel) {
                $blockers[] = sprintf('Der Verwendungsbereich begrenzt die Achslast auf %s, erfasst ist eine Radlast von %s je Rad – das erlaubt mehr. Trag höchstens %s je Rad ein.',
                    GermanFormat::kilograms($declaration->axleLimitKg), GermanFormat::kilograms($entered['maxLoadKg']), GermanFormat::kilograms($perWheel));
            }
        }

        $rowsSaid = static fn (int $n): string => $n === 1 ? 'einer Zeile' : $n.' Zeilen';

        if ($declaration->abnahme === ReleaseDeclaration::ABNAHME_ALL && $entered['withoutAbnahme'] > 0) {
            $blockers[] = sprintf('Der Verwendungsbereich verlangt bei jeder Kombination eine Abnahme, aber bei %s fehlt sie. Erfass den Code, der sie verlangt.', $rowsSaid($entered['withoutAbnahme']));
        } elseif ($declaration->abnahme === ReleaseDeclaration::ABNAHME_SOME && $entered['withAbnahme'] === 0) {
            $blockers[] = 'Der Verwendungsbereich verlangt bei einigen Kombinationen eine Abnahme, erfasst ist sie bei keiner Zeile. Erfass den Code, der sie verlangt.';
        } elseif ($declaration->abnahme === ReleaseDeclaration::ABNAHME_NONE && $entered['withAbnahme'] > 0) {
            $blockers[] = sprintf('Der Verwendungsbereich verlangt keine Abnahme, aber bei %s ist eine erfasst. Prüf die Codes.', $rowsSaid($entered['withAbnahme']));
        }

        return $blockers;
    }

    /**
     * `$instruction` is set only by ReleaseOnInstruction, outside the live shop: the operator's written word, kept on
     * the entry so the Protokoll says who decided instead of suggesting a person pressed „Freigeben“.
     *
     * `$declaration` is what the person read off the PDF (D-227, D-228), asked at every release in the browser and on the
     * command line; it is checked against the entry and recorded with the release. Without one — the seeders, which
     * enter whole documents of their own — the document must already carry an answer to the completeness question.
     *
     * @return array{rows: int, conflicts: int}
     */
    public function release(ApprovalDocument $document, AdminUser $admin, ?string $instruction = null, ?ReleaseDeclaration $declaration = null): array
    {
        $blockers = $this->check($document);

        if ($declaration !== null) {
            $blockers = [...$blockers, ...$this->declarationBlockers($document, $declaration)];
        } elseif ($document->completeness === null) {
            $blockers[] = 'Sag vor der Freigabe, ob alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst sind.';
        }

        if ($blockers !== []) {
            throw ValidationException::withMessages(['release' => 'Noch nicht freigebbar: '.implode(' ', $blockers)]);
        }

        $entered = $declaration === null ? null : $this->entered($document);

        return DB::transaction(function () use ($document, $admin, $instruction, $declaration, $entered): array {
            $conflicts = $this->conflicts->detect($document, $admin);
            $rows = Fitment::query()->where('approval_document_id', $document->id)->where('status', FitmentStatus::Draft->value)
                ->update(['status' => FitmentStatus::Published->value, 'updated_at' => now()]);

            if ($document->supersedes_id !== null) {
                ApprovalDocument::query()->whereKey($document->supersedes_id)
                    ->where('status', DocumentStatus::Published->value)
                    ->update(['status' => DocumentStatus::Superseded->value, 'valid_to' => now()->toDateString(), 'updated_at' => now()]);
            }

            if ($declaration !== null) {
                self::recordCompleteness($document, $admin, $declaration->completeness, $declaration->missing);
            }

            // The one entry point for a publish: caches forgotten, subscribers told (the event).
            $document->publish();

            AuditTrail::record($admin, 'approval.released', [
                'document' => FitmentRows::label($document),
                'rows' => $rows,
                'conflicts' => count($conflicts),
                'completeness' => $document->completeness,
                ...($declaration === null ? [] : ['declared' => $declaration->toArray(), 'entered' => $entered]),
                ...($instruction === null ? [] : [
                    self::ON_INSTRUCTION => $instruction,
                    'environment' => (string) app()->environment(),
                ]),
            ], $document);

            return ['rows' => $rows, 'conflicts' => count($conflicts)];
        });
    }

    /**
     * The count of the Verwendungsbereich, read off the PDF before the rows are entered, each figure with its page
     * (ADMIN-GEFUNDEN 511). Taken while the document has no row, it is a count nobody could copy off the entry
     * (`counted_before_entry`); taken or changed later, the page and the Protokoll say so. Every change keeps the figures
     * before it in the Protokoll — the release compares the entry with the count that stands at release.
     */
    public function recordCount(ApprovalDocument $document, AdminUser $admin, CountFigures $figures): void
    {
        $before = CountFigures::of($document);
        $rows = Fitment::query()->where('approval_document_id', $document->id)->whereNot('status', FitmentStatus::Retired->value)->count();

        DB::transaction(static function () use ($document, $admin, $figures, $before, $rows): void {
            $document->forceFill($figures->columns() + [
                'counted_before_entry' => $rows === 0,
                'counted_by' => $admin->id,
                'counted_at' => now(),
            ])->save();

            AuditTrail::record($admin, $before === null ? 'approval.counted' : 'approval.count_changed', [
                'document' => FitmentRows::label($document),
                'count' => $figures->toArray(),
                'before' => $before?->toArray(),
                // How many rows stood when it was counted: none means nobody could have counted the entry.
                'rows' => $rows,
            ], $document);
        });
    }

    /**
     * The completeness question answered for a document already released (D-227): every document released before the
     * question existed must be answered, and until it is the shop reads it as partial and the go-live check holds live
     * mode. Recorded like the release's own answer — who, when, against which revision — and in the Protokoll.
     */
    public function answerCompleteness(ApprovalDocument $document, AdminUser $admin, string $completeness, ?string $missing): void
    {
        if (! in_array($completeness, ApprovalDocument::COMPLETENESS, true)) {
            throw ValidationException::withMessages(['completeness' => 'Sag, ob alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst sind.']);
        }

        if ($completeness === ApprovalDocument::PARTIAL && trim((string) $missing) === '') {
            throw ValidationException::withMessages(['missing' => 'Nenn die Anlagen oder Bereiche, die noch fehlen.']);
        }

        $before = $document->completeness;

        DB::transaction(static function () use ($document, $admin, $completeness, $missing, $before): void {
            self::recordCompleteness($document, $admin, $completeness, $missing);
            $document->save();

            AuditTrail::record($admin, 'approval.completeness_answered', [
                'document' => FitmentRows::label($document),
                'completeness' => $completeness,
                'missing' => $document->missing_annexes,
                'before' => $before,
                'revision' => $document->revision,
            ], $document);
        });

        Coverage::forget();
        TyreConfirmations::forget();
    }

    private static function recordCompleteness(ApprovalDocument $document, AdminUser $admin, string $completeness, ?string $missing): void
    {
        $missing = trim((string) $missing);

        $document->forceFill([
            'completeness' => $completeness,
            // What is missing belongs to a partial answer only: a complete one has nothing missing, an unknown one cannot say.
            'missing_annexes' => $completeness === ApprovalDocument::PARTIAL && $missing !== '' ? mb_substr($missing, 0, 255) : null,
            'completeness_by' => $admin->id,
            'completeness_at' => now(),
            'completeness_revision' => $document->revision,
        ]);
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
