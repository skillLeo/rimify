<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use App\Services\Admin\Approvals\Entry\EntryModel;
use App\Services\Admin\Approvals\Entry\EntryView;
use App\Services\Admin\Approvals\Entry\PairListCheck;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Dashboard\Coverage;
use App\Services\GoLive\TyreConfirmations;
use App\Services\Storefront\FitmentCount;
use App\Services\Storefront\HomeStats;
use App\Services\Storefront\MegaMenu;
use App\Support\CatalogueVersion;
use App\Support\VehicleName;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Freigeben: a Gutachten and all of its rows become what the shop reads, at once — never row by row.
 *
 * What stops a release is said in sentences (check): no PDF, no rows, a row without a tyre size (the
 * shop could not say which tyre goes on it), no answer to how the document gives its tyres' index — or an
 * answer the entry does not bear out (D-277) —, a row on a vehicle that was removed or has no authoritative
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

        $rows = Fitment::query()->where('approval_document_id', $document->id)->where('status', FitmentStatus::Draft->value);
        $count = (clone $rows)->count();

        if ($count === 0) {
            // A base whose Verwendungsbereich stands in its Nachtrag's Anlagen (ABE 53841: „Anlage/n zum Prüfbericht
            // 1–16“ of 366-0350-21-WIRD/N1) has no rows of its own and is released for its own facts — § 15 FZV among
            // them, which its Nachträge then carry. Every other document without a row is not releasable.
            $base = ApprovalDocument::query()->where('supplement_to_id', $document->id)->exists();

            if (! $base) {
                $blockers[] = 'Es ist noch kein Fahrzeug eingetragen.';
            }

            return $blockers;
        }

        $sizeless = (clone $rows)->whereDoesntHave('tyreSizes')->distinct()->count('vehicle_id');

        if ($sizeless > 0) {
            $blockers[] = $sizeless === 1
                ? 'Bei einem Fahrzeug fehlen noch die Reifen. Ohne sie kann der Shop für dieses Fahrzeug keine Reifengröße nennen.'
                : "Bei {$sizeless} Fahrzeugen fehlen noch die Reifen. Ohne sie kann der Shop für diese Fahrzeuge keine Reifengröße nennen.";
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

        array_push($blockers, ...self::entryBlockers($document));

        return $blockers;
    }

    /**
     * What the five steps add to the door: a line that does not read, a side still empty, a tyre that does not fit its wheel, a car with
     * no tyres on one of several wheel combinations, and a pair the engine would give a wheel combination nobody entered it for —
     * pairs are held per car, and two of its combinations with the same diameters can answer as one (PairListCheck, D-447).
     *
     * @return list<string>
     */
    private static function entryBlockers(ApprovalDocument $document): array
    {
        $model = EntryModel::of($document);

        if (! $model->isEntered()) {
            return [];
        }

        $blockers = [];
        $several = $model->entries->pluck('document_wheel_combination_id')->unique()->count() > 1;

        // One gap, one sentence: per combination with its count, the car's name only where it is one car.
        if ($several) {
            foreach ($model->entries->filter(static fn (DocumentCarEntry $entry): bool => $entry->lines->isEmpty())->groupBy('document_wheel_combination_id') as $empty) {
                /** @var DocumentCarEntry $first */
                $first = $empty->first();
                $label = $first->combination === null ? '' : EntryView::combinationLabel($first->combination);
                /** @var Vehicle|null $only */
                $only = $first->vehicle;

                $blockers[] = $empty->count() === 1
                    ? sprintf('Bei %s fehlen für die Felgenkombination „%s“ noch die Reifen. Trag sie ein oder nimm die Kombination bei diesem Fahrzeug heraus.', $only === null ? 'einem Fahrzeug' : VehicleName::from($only), $label)
                    : sprintf('Für die Felgenkombination „%s“ fehlen bei %d Fahrzeugen noch die Reifen. Trag sie ein oder nimm die Kombination bei diesen Fahrzeugen heraus.', $label, $empty->count());
            }
        }

        foreach ($model->entries as $entry) {
            /** @var Vehicle|null $car */
            $car = $entry->vehicle;
            $name = $car === null ? 'einem Fahrzeug' : VehicleName::from($car);
            $combination = $entry->combination === null ? '' : EntryView::combinationLabel($entry->combination);

            foreach ($entry->lines as $line) {
                foreach (['front', 'rear'] as $side) {
                    $misfit = EntryModel::misfit($entry, $line, $side);

                    if ($misfit !== null) {
                        $blockers[] = sprintf('Bei %s (%s): %s', $name, $combination, $misfit);
                    }
                }

                if (EntryModel::twoSidedOpen($line) && ! $line->unread()) {
                    $blockers[] = sprintf('Bei %s (%s) steht eine Reifenzeile nur mit einer Seite; %s fehlt noch die Größe.', $name, $combination, $line->front() === null ? 'vorne' : 'hinten');
                }

                if ($line->unread()) {
                    $blockers[] = sprintf('Bei %s ist eine Reifenzeile nicht lesbar: „%s“. Korrigier sie oder nimm sie heraus.', $car === null ? 'einem Fahrzeug' : VehicleName::from($car), (string) ($line->front_unread ?? $line->rear_unread));
                }
            }
        }

        return [...$blockers, ...PairListCheck::sentences((new PairListCheck(new DocumentEntryWriter))->of($model)['conflicts'])];
    }

    /**
     * What was entered (D-228): the Auflagen codes the rows and their sizes carry, the tyre sizes, the wheel versions without a
     * tested load, and the rows that lead to an Abnahme or none. The release compares the Abnahme with what was said (D-440, D-441)
     * and keeps all of it in the Protokoll beside the answers.
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
     * What the command line's answer lacks (ReleaseOnInstruction, D-227): since D-485 the release itself asks nothing, but an
     * operator's written instruction may still say whether every vehicle is entered — then in one of the three words, and a
     * partial one with what is missing. The Abnahme is no longer asked or compared: the codes say it (D-485).
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

        return $blockers;
    }

    /**
     * `$instruction` is set only by ReleaseOnInstruction, outside the live shop: the operator's written word, kept on
     * the entry so the Protokoll says who decided instead of suggesting a person pressed „Freigeben“.
     *
     * `$declaration` is the command line's answer to whether every vehicle is entered, where the operator's instruction gives
     * one; it is recorded with the release. The browser's release asks nothing since D-485: a document nobody has switched
     * to „alle erfasst“ is read as partial — a car it does not name is „noch nicht bestätigt“, never „nicht freigegeben“.
     *
     * @return array{rows: int, conflicts: int}
     */
    public function release(ApprovalDocument $document, AdminUser $admin, ?string $instruction = null, ?ReleaseDeclaration $declaration = null): array
    {
        // What the shop will read, once more from what was entered: a car's field K or a new colour may have changed since the last save.
        if ($document->status === DocumentStatus::Draft && EntryModel::of($document)->isEntered()) {
            (new DocumentEntryWriter)->write($document, $admin);
        }

        $blockers = $this->check($document);

        if ($declaration !== null) {
            $blockers = [...$blockers, ...$this->declarationBlockers($document, $declaration)];
        }

        if ($blockers !== []) {
            throw ValidationException::withMessages(['release' => 'Noch nicht freigebbar: '.implode(' ', $blockers)]);
        }

        // What was entered, kept in the Protokoll beside the release: the codes, sizes and rows with and without an Abnahme.
        $entered = $this->entered($document);

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
            // The rows above changed status in bulk, past their models: the catalogue's new version once it commits (D-294).
            CatalogueVersion::changed();

            AuditTrail::record($admin, 'approval.released', [
                'document' => FitmentRows::label($document),
                'rows' => $rows,
                'conflicts' => count($conflicts),
                'completeness' => $document->completeness,
                'entered' => $entered,
                ...($declaration === null ? [] : ['declared' => $declaration->toArray()]),
                ...($instruction === null ? [] : [
                    self::ON_INSTRUCTION => $instruction,
                    'environment' => (string) app()->environment(),
                ]),
            ], $document);

            return ['rows' => $rows, 'conflicts' => count($conflicts)];
        });
    }

    /**
     * The switch „Alle Fahrzeuge dieses Gutachtens sind erfasst“ (D-485, in place of D-227's question at release): on, a car
     * the document does not name is „nicht freigegeben“; off, it is „noch nicht bestätigt“ — as for a document nobody has
     * switched. It never blocks a release and never changes the missing Anlagen under „Angaben“, which customers may read:
     * while some are named there, it cannot be turned on. Off is written as the partial answer where Anlagen are named,
     * else as „unknown“ — both read as partial. Recorded like an answer: who, when, against which revision, in the Protokoll.
     */
    public function switchCompleteness(ApprovalDocument $document, AdminUser $admin, bool $complete): void
    {
        $missing = trim((string) $document->missing_annexes);

        if ($complete && $missing !== '') {
            throw ValidationException::withMessages(['complete' => "Unter „Angaben“ stehen noch fehlende Anlagen ({$missing}). Solange sie fehlen, sind nicht alle Fahrzeuge erfasst – trag sie nach oder lösch die Angabe."]);
        }

        $before = $document->completeness;
        $after = match (true) {
            $complete => ApprovalDocument::COMPLETE,
            $missing !== '' => ApprovalDocument::PARTIAL,
            default => ApprovalDocument::UNKNOWN,
        };

        // Off on a document nobody has switched yet, or the state it already has: nothing to record.
        if ($after === $before || (! $complete && $before === null)) {
            return;
        }

        DB::transaction(static function () use ($document, $admin, $after, $before): void {
            $document->forceFill([
                'completeness' => $after,
                'completeness_by' => $admin->id,
                'completeness_at' => now(),
                'completeness_revision' => $document->revision,
            ])->save();

            AuditTrail::record($admin, 'approval.completeness_answered', [
                'document' => FitmentRows::label($document),
                'completeness' => $after,
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
        CatalogueVersion::changed();
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
