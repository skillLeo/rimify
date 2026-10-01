<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\ConditionLevel;
use App\Enums\ApprovalKind;
use App\Enums\ConditionSeverity;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApprovalDocumentRequest;
use App\Http\Requests\Admin\ApprovalStepRequest;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Models\DocumentConditionRework;
use App\Models\DocumentFastener;
use App\Models\DocumentNotice;
use App\Models\Fitment;
use App\Models\FitmentCondition;
use App\Models\FitmentTyreSize;
use App\Models\FitmentTyreSizeCondition;
use App\Models\WheelModel;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Services\Admin\Approvals\DocumentPreview;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\Approvals\LoadLimitCheck;
use App\Services\Admin\AuditTrail;
use App\Services\Storage\PdfUpload;
use App\Services\Storage\UploadRejected;
use App\Support\GermanFormat;
use App\Support\VehicleName;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Gutachten-Erfassung — the screen Rimify's compliance editor lives in.
 *
 * Every row here was typed by a person reading a PDF, which is why the entry workspace matters
 * more than any other admin screen: thirty rows enterable in fifteen minutes is the difference
 * between the catalogue growing and it not.
 *
 * The chain: the PDF and the document's facts (a draft), then the Verwendungsbereich rows, the
 * preview of what the shop will say, and the Freigabe — the whole document at once (DocumentRelease).
 */
class GutachtenController extends Controller
{
    /** The public disk the PDFs customers open live on, and the folder there. */
    public const DISK = 'docs_public';

    public const DIRECTORY = 'gutachten';

    public const CREATED = 'Gutachten angelegt. Jetzt den Verwendungsbereich eintragen.';

    public const SAVED = 'Gespeichert.';

    public function index(Request $request): Response
    {
        $documents = DB::table('approval_documents as ad')
            ->leftJoin('fitments as f', 'f.approval_document_id', '=', 'ad.id')
            ->groupBy(
                'ad.id', 'ad.report_number', 'ad.kind', 'ad.issuer', 'ad.kba_number', 'ad.approval_mark',
                'ad.issued_on', 'ad.revision', 'ad.status', 'ad.page_count',
            )
            // Drafts first — the documents being worked on — then the newest; a document without its
            // date is not buried at the bottom (MySQL sorts NULL last in a descending order).
            ->orderByRaw("ad.status = 'draft' DESC")
            ->orderByRaw('ad.issued_on IS NULL DESC')
            ->orderByDesc('ad.issued_on')
            ->orderByDesc('ad.id')
            ->get([
                'ad.id', 'ad.report_number', 'ad.kind', 'ad.issuer', 'ad.kba_number', 'ad.approval_mark',
                'ad.issued_on', 'ad.revision', 'ad.status', 'ad.page_count',
                DB::raw('COUNT(f.id) as fitment_count'),
                DB::raw('SUM(f.status = \'published\') as published_count'),
            ]);

        $rows = [];

        foreach ($documents as $row) {
            $rows[] = [
                'id' => (int) $row->id,
                // The number the document is known by, whichever kind it is.
                'reportNumber' => (string) ($row->report_number ?? $row->kba_number ?? $row->approval_mark ?? '#'.$row->id),
                'kind' => (string) $row->kind,
                'issuer' => (string) ($row->issuer ?? ''),
                'kbaNumber' => $row->report_number === null ? null : $row->kba_number,
                'issuedOn' => $row->issued_on === null
                    ? null
                    : GermanFormat::date(new \DateTimeImmutable((string) $row->issued_on)),
                'revision' => (int) $row->revision,
                'status' => (string) $row->status,
                'pageCount' => $row->page_count === null ? null : (int) $row->page_count,
                'fitmentCount' => (int) $row->fitment_count,
                'publishedCount' => (int) $row->published_count,
                'href' => '/admin/gutachten/'.$row->id,
            ];
        }

        $admin = $request->user('admin');

        return Inertia::render('Admin/Gutachten/Index', [
            'documents' => $rows,
            'can' => ['create' => $admin instanceof AdminUser && $admin->may(PermissionModule::Approvals, PermissionAction::Create)],
        ]);
    }

    public function create(ApprovalStepRequest $request): Response
    {
        request()->attributes->set(AdminNavigation::RECORD, 'Neues Gutachten');

        return Inertia::render('Admin/Gutachten/Neu', [
            'kinds' => self::kinds(),
            'replaceable' => self::replaceable(null),
            'supplementable' => self::supplementable(),
            'maxMb' => (int) config('media.upload.pdf_max_mb'),
        ]);
    }

    public function store(ApprovalDocumentRequest $request, PdfUpload $uploads): RedirectResponse
    {
        $facts = $request->facts();
        $admin = $request->admin();
        $pdf = $this->confirmPdf($uploads, (string) $request->uploadKey());

        $document = DB::transaction(function () use ($facts, $admin, $pdf): ApprovalDocument {
            $revision = $facts['supersedes_id'] === null ? 1 : (int) ApprovalDocument::query()->whereKey($facts['supersedes_id'])->value('revision') + 1;

            $document = ApprovalDocument::query()->create($facts + [
                'revision' => $revision,
                'status' => DocumentStatus::Draft->value,
                'pdf_key' => $pdf['path'],
                'pdf_sha256' => $pdf['sha256'],
                'created_by' => $admin->id,
            ]);

            AuditTrail::record($admin, 'approval.created', ['document' => FitmentRows::label($document)], $document);

            return $document;
        });

        return redirect('/admin/gutachten/'.$document->id)->with('toast', self::CREATED);
    }

    public function show(ApprovalStepRequest $request, ApprovalDocument $document, DocumentRelease $release, DocumentPreview $preview): Response
    {
        $admin = $request->admin();
        // On the app's request, not the Form Request: that is a copy, and the crumb is read from the original.
        request()->attributes->set(AdminNavigation::RECORD, FitmentRows::label($document));

        $rows = Fitment::query()
            ->with(['vehicle' => static fn ($q) => $q->withTrashed(), 'wheelConfig.wheelModel.brand', 'wheelConfig.wheelFinish', 'tyreSizes.conditionCodes', 'conditionCodes', 'entryOverrideBy'])
            ->where('approval_document_id', $document->id)
            ->orderBy('vehicle_id')
            ->orderBy('wheel_config_id')
            ->limit(1000)
            ->get();

        $vehicles = $rows->pluck('vehicle')->filter()->unique('id')->values();
        $chosen = $request->vehicleId() ?? $vehicles->first()?->id;
        /** @var array<string, DocumentCondition> $defined */
        $defined = $document->conditions()->get()->keyBy('code')->all();
        $uses = DocumentConditions::usesByCode($document);

        return Inertia::render('Admin/Gutachten/Show', [
            'document' => self::documentFacts($document),
            'rows' => $rows->map(static fn (Fitment $row): array => self::row($row, $defined))->values()->all(),
            'vehicles' => $vehicles->map(static fn ($v): array => ['id' => (int) $v->id, 'label' => self::vehicleLabel($v)])->all(),
            'blockers' => $document->status === DocumentStatus::Draft ? $release->check($document) : [],
            // Lazy: the preview is computed when a vehicle is chosen, and only for it.
            'preview' => Inertia::optional(static fn (): array => $chosen === null ? [] : $preview->for($document, (int) $chosen)),
            'previewVehicle' => $chosen,
            // The document's own Auflagenverzeichnis, the form's choices, and the codes its rows carry
            // that it does not define yet (the corrections memo §1).
            'conditions' => array_values(array_map(static fn (DocumentCondition $c): array => self::conditionView($c, $uses[$c->code] ?? 0), $defined)),
            'choices' => self::conditionChoices(),
            'unresolved' => DocumentConditions::unresolvedIn($document),
            'kinds' => self::kinds(),
            'replaceable' => self::replaceable($document),
            'supplementable' => self::supplementable(),
            // What the document states beside its codes (the corrections memo §4).
            'fasteners' => $document->fasteners()->get()->map(static fn (DocumentFastener $f): array => [
                'id' => (int) $f->id,
                'number' => $f->number,
                'thread' => $f->thread,
                'seat' => $f->seat,
                'torqueNm' => $f->torque_nm,
                'shaftLengthMm' => $f->shaft_length_mm,
                'articleNumber' => $f->article_number,
                'vehicleTypes' => $f->vehicle_types,
                'page' => $f->source_page,
            ])->values()->all(),
            'notices' => $document->notices()->get()->map(static fn (DocumentNotice $n): array => ['id' => (int) $n->id, 'text' => $n->text_de, 'page' => $n->source_page])->values()->all(),
            'reworks' => DocumentConditionRework::query()->with('condition')
                ->whereIn('document_condition_id', array_map(static fn (DocumentCondition $c): int => (int) $c->id, array_values($defined)))
                ->orderBy('document_condition_id')->orderBy('vehicle_type')->get()
                ->map(static fn (DocumentConditionRework $r): array => [
                    'id' => (int) $r->id,
                    'code' => (string) $r->condition?->code,
                    'vehicleType' => $r->vehicle_type,
                    'axle' => $r->axle,
                    'measure' => $r->measureDe(),
                    'note' => $r->note_de,
                ])->values()->all(),
            // Its own table of tyre load at speed (ABE 55255, p. 6): rows of speeds, columns of symbols.
            'derating' => self::deratingView($document),
            'openConflicts' => DB::table('fitment_conflicts')->where('status', 'open')
                ->whereIn('candidate_fitment_id', $rows->pluck('id'))->count(),
            'can' => [
                'edit' => $admin->can('update', $document),
                'release' => $admin->can('publish', $document),
                // How loud each Auflage is in the shop: on a released document too (#23, D-104).
                'levels' => $admin->can('setLevels', $document),
            ],
            'levels' => array_map(static fn (ConditionLevel $l): array => ['value' => $l->value, 'label' => $l->labelDe()], ConditionLevel::cases()),
            'levelFloorSentence' => ConditionLevel::FLOOR_SENTENCE,
        ]);
    }

    /**
     * The document's table as the grid shows it: its columns in the order first entered (V, W, Y), its rows
     * by speed, each cell „97“, „–“ or empty.
     *
     * @return array{sourcePage: int|null, seededFrom: string|null, symbols: list<string>, rows: list<array{speed: int, cells: array<string, string>}>}
     */
    private static function deratingView(ApprovalDocument $document): array
    {
        $cells = $document->speedDeratings()->get();
        $symbols = [];
        $rows = [];

        foreach ($cells as $cell) {
            $symbols[$cell->symbol] = true;
            $rows[$cell->speed_kmh][$cell->symbol] = $cell->percent === null ? '–' : (string) $cell->percent;
        }

        ksort($rows);

        return [
            'sourcePage' => $cells->first()?->source_page,
            'seededFrom' => $cells->first()?->seeded_from,
            'symbols' => array_keys($symbols),
            'rows' => array_map(static fn (int $speed, array $row): array => ['speed' => $speed, 'cells' => $row], array_keys($rows), $rows),
        ];
    }

    public function update(ApprovalDocumentRequest $request, ApprovalDocument $document, PdfUpload $uploads): RedirectResponse
    {
        $facts = $request->facts();
        $admin = $request->admin();
        $key = $request->uploadKey();
        $pdf = $key === null ? null : $this->confirmPdf($uploads, $key);

        DB::transaction(function () use ($document, $facts, $admin, $pdf): void {
            $revision = $facts['supersedes_id'] === null ? 1 : (int) ApprovalDocument::query()->whereKey($facts['supersedes_id'])->value('revision') + 1;
            $document->fill($facts + ['revision' => $revision]);

            if ($pdf !== null) {
                // The draft's PDF is replaced; nobody outside the team has seen the old one.
                $document->forceFill(['pdf_key' => $pdf['path'], 'pdf_sha256' => $pdf['sha256']]);
            }

            $document->save();
            AuditTrail::record($admin, 'approval.updated', ['document' => FitmentRows::label($document), 'pdf' => $pdf !== null], $document);
        });

        return back()->with('toast', self::SAVED);
    }

    public function release(ApprovalStepRequest $request, ApprovalDocument $document, DocumentRelease $release): RedirectResponse
    {
        $result = $release->release($document, $request->admin());
        $toast = match ($result['rows']) {
            // A base without rows of its own (DocumentRelease): its facts now reach the shop through its Nachträge.
            0 => 'Freigegeben: Der Shop übernimmt die Angaben dieses Grundgutachtens jetzt für seine Nachträge.',
            1 => 'Freigegeben: Die Zeile ist jetzt im Shop.',
            default => 'Freigegeben: '.GermanFormat::integer($result['rows']).' Zeilen sind jetzt im Shop.',
        };

        if ($result['conflicts'] > 0) {
            $toast .= ' '.($result['conflicts'] === 1 ? 'Ein Widerspruch' : GermanFormat::integer($result['conflicts']).' Widersprüche')
                .' zu anderen Gutachten erkannt – bis unter Konflikte entschieden ist, sagt der Shop dort „Unbekannt“.';
        }

        return back()->with('toast', $toast);
    }

    /** @return array{path: string, sha256: string} */
    private function confirmPdf(PdfUpload $uploads, string $key): array
    {
        try {
            $stored = $uploads->confirm($key, self::DISK, self::DIRECTORY);
        } catch (UploadRejected $e) {
            throw ValidationException::withMessages(['upload_key' => $e->getMessage()]);
        }

        // Proves later that the file was never swapped: the hash of what was confirmed.
        try {
            $stream = Storage::disk(self::DISK)->readStream($stored['path']);
            $hash = hash_init('sha256');

            if (is_resource($stream)) {
                hash_update_stream($hash, $stream);
                fclose($stream);
            }

            $sha = hash_final($hash);
        } catch (Throwable) {
            throw ValidationException::withMessages(['upload_key' => UploadRejected::storageDown()->getMessage()]);
        }

        return ['path' => $stored['path'], 'sha256' => $sha];
    }

    /** @return array<string, mixed> */
    public static function documentFacts(ApprovalDocument $document): array
    {
        $url = null;
        $missing = false;

        // A link is offered only to a file that is there: a stored key without its file says so
        // instead of opening a 404. One existence check, on the one document on screen.
        if ($document->pdf_key !== null) {
            try {
                $disk = Storage::disk(self::DISK);
                $missing = ! $disk->exists($document->pdf_key);
                $url = $missing ? null : $disk->url($document->pdf_key);
            } catch (Throwable) {
                $url = null;
            }
        }

        return [
            'id' => (int) $document->id,
            'label' => FitmentRows::label($document),
            'kind' => $document->kind->value,
            'kindLabel' => $document->kind->labelDe(),
            'kbaNumber' => $document->kba_number ?? '',
            'reportNumber' => $document->report_number ?? '',
            'approvalMark' => $document->approval_mark ?? '',
            'issuer' => $document->issuer ?? '',
            'issuedOn' => $document->issued_on?->format('Y-m-d') ?? '',
            'issuedOnLabel' => GermanFormat::date($document->issued_on),
            'pageCount' => $document->page_count,
            'revision' => $document->revision,
            'supersedesId' => $document->supersedes_id,
            'supersedesLabel' => $document->supersedes_id === null ? null : ($document->supersedes === null ? null : FitmentRows::label($document->supersedes)),
            'status' => $document->status->value,
            'statusLabel' => match ($document->status) {
                DocumentStatus::Draft => 'Entwurf',
                DocumentStatus::Published => 'Freigegeben',
                DocumentStatus::Superseded => 'Ersetzt',
                DocumentStatus::Withdrawn => 'Zurückgezogen',
            },
            'validFrom' => GermanFormat::date($document->valid_from),
            'validTo' => GermanFormat::date($document->valid_to),
            'pdfUrl' => $url,
            'hasPdf' => $document->pdf_key !== null,
            'pdfMissing' => $missing,
            // Page 1's header and a Nachtrag's base (the corrections memo §4): as the forms type them …
            'shape' => [
                'supplement_to_id' => $document->supplement_to_id,
                'supplement_to_number' => (string) ($document->supplement_to_number ?? ''),
                'annex' => (string) ($document->getAttribute('annex') ?? ''),
                'test_report_number' => (string) ($document->getAttribute('test_report_number') ?? ''),
                'copy_number' => (string) ($document->getAttribute('copy_number') ?? ''),
                'designation_number' => (string) ($document->getAttribute('designation_number') ?? ''),
                'test_site' => (string) ($document->getAttribute('test_site') ?? ''),
                'test_date' => $document->test_date?->format('Y-m-d') ?? '',
                'revision_date' => $document->revision_date?->format('Y-m-d') ?? '',
                'valid_from_production' => $document->valid_from_production?->format('m.Y') ?? '',
                'papers_correction' => match ($document->papers_correction_required) {
                    false => 'not_required',
                    true => 'required',
                    null => '',
                },
                'missing_annexes' => (string) ($document->missing_annexes ?? ''),
            ],
            // … and as the record shows them: only what is filled.
            'header' => array_values(array_filter([
                ['label' => 'Anlage', 'value' => (string) ($document->getAttribute('annex') ?? '')],
                ['label' => 'Prüfbericht-Nr.', 'value' => (string) ($document->getAttribute('test_report_number') ?? '')],
                ['label' => 'Ausfertigung', 'value' => (string) ($document->getAttribute('copy_number') ?? '')],
                ['label' => 'Benennungsnummer', 'value' => (string) ($document->getAttribute('designation_number') ?? '')],
                ['label' => 'Prüfort', 'value' => (string) ($document->getAttribute('test_site') ?? '')],
                ['label' => 'Prüfdatum', 'value' => (string) GermanFormat::date($document->test_date)],
                ['label' => 'Stand', 'value' => (string) GermanFormat::date($document->revision_date)],
                ['label' => 'Gültig ab Fertigungsdatum', 'value' => $document->valid_from_production?->format('m/Y') ?? ''],
                // § 15 FZV as this document says it, or as its base does for a Nachtrag (point 10 of ABE 53841).
                ['label' => 'Berichtigung der Fahrzeugpapiere', 'value' => self::papersLabel($document)],
            ], static fn (array $entry): bool => $entry['value'] !== '')),
            'supplementTo' => $document->kind !== ApprovalKind::Nachtrag ? null : ($document->supplementTo !== null
                ? ['label' => FitmentRows::label($document->supplementTo), 'href' => '/admin/gutachten/'.$document->supplementTo->id]
                : ['label' => (string) ($document->supplement_to_number ?? '–'), 'href' => null]),
            'baseMissing' => $document->baseMissingDe(),
            // Anlagen of its Verwendungsbereich we do not hold: a car the pages we hold do not name is UNKNOWN, not refused.
            'scopeIncomplete' => $document->scopeIncompleteDe(),
        ];
    }

    /**
     * § 15 FZV as the record says it: the document's own word, its base's once released — or the base's word still
     * waiting for that release, so nobody wonders why the shop does not say it yet. Empty when nothing says anything.
     */
    private static function papersLabel(ApprovalDocument $document): string
    {
        $base = $document->kind === ApprovalKind::Nachtrag ? $document->supplementTo : null;

        return match ($document->papersCorrectionRequired()) {
            false => $document->papers_correction_required === null ? "nicht erforderlich (§\u{00A0}15 FZV, laut Grundgutachten)" : "nicht erforderlich (§\u{00A0}15 FZV)",
            true => 'erforderlich',
            null => $base !== null && $base->papers_correction_required === false
                ? "nicht erforderlich (§\u{00A0}15 FZV, laut Grundgutachten) – der Shop zeigt es, sobald das Grundgutachten freigegeben ist"
                : '',
        };
    }

    /**
     * The documents a Nachtrag may supplement: any that is not itself a Nachtrag.
     *
     * @return list<array{value: int, label: string}>
     */
    private static function supplementable(): array
    {
        return ApprovalDocument::query()
            ->where('kind', '<>', ApprovalKind::Nachtrag->value)
            ->orderByDesc('issued_on')
            ->limit(300)
            ->get()
            ->map(static fn (ApprovalDocument $d): array => ['value' => (int) $d->id, 'label' => FitmentRows::label($d)])
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    public static function conditionView(DocumentCondition $condition, int $uses): array
    {
        return [
            'id' => (int) $condition->id,
            'code' => $condition->code,
            'kind' => $condition->kind->value,
            'kindLabel' => $condition->kind->labelDe(),
            'section' => $condition->kind->sectionDe(),
            'text' => $condition->text_de,
            'page' => $condition->source_page,
            'bodyForms' => $condition->body_forms ?? [],
            'drive' => is_array($condition->drive) ? $condition->drive : null,
            'maxAxleLoadKg' => $condition->max_axle_load_kg,
            'axle' => $condition->axle,
            // How loud it is in the shop (#23, D-104), and the lowest it may be: an Abnahme or body work is never a Hinweis.
            'level' => ($condition->level ?? ConditionLevel::defaultFor($condition->code, $condition->kind, $condition->text_de))->value,
            'levelFloor' => ConditionLevel::floorFor($condition->kind)->value,
            'uses' => $uses,
            // A load-index limit that differs from twice its index's capacity: said, and confirmed with a
            // reason before release — the document is kept as it stands (the second review of C9, §3).
            'limitWarning' => app(LoadLimitCheck::class)->warningFor($condition),
            'limitConfirmed' => $condition->limit_confirmed_at === null ? null : [
                'reason' => (string) $condition->limit_confirmed_reason,
                'by' => AdminUser::query()->whereKey($condition->limit_confirmed_by)->value('name'),
                'at' => $condition->limit_confirmed_at->timezone('Europe/Berlin')->format('d.m.Y'),
            ],
        ];
    }

    /** @return array{kinds: list<array{value: string, label: string, section: string}>, bodyForms: list<string>, drives: list<string>} */
    public static function conditionChoices(): array
    {
        return [
            'kinds' => array_map(static fn (ConditionKind $k): array => ['value' => $k->value, 'label' => $k->labelDe(), 'section' => $k->sectionDe()], ConditionKind::cases()),
            'bodyForms' => DocumentConditions::BODY_FORMS,
            'drives' => DocumentConditions::DRIVES,
        ];
    }

    /**
     * @param  array<string, DocumentCondition>  $defined  the document's list, by code
     * @return array<string, mixed>
     */
    private static function row(Fitment $row, array $defined): array
    {
        $config = $row->wheelConfig;
        $codeView = static function (string $code, ?string $note) use ($defined): array {
            $definition = $defined[$code] ?? null;

            return [
                'code' => $code,
                'note' => (string) ($note ?? ''),
                'text' => $definition?->text_de,
                'kind' => $definition?->kind->value,
                'page' => $definition?->source_page,
                'defined' => $definition !== null,
            ];
        };
        // The Eintragung as the codes derive it, with the code and page it comes from (§2).
        $abnahme = static fn (array $codes): array => array_values(array_filter($codes, static fn (string $c): bool => ($defined[$c] ?? null)?->kind === ConditionKind::Abnahme));
        $rowCodes = $row->conditionCodes->pluck('code')->map(static fn (mixed $c): string => (string) $c)->all();
        $sizeCodes = $row->tyreSizes->flatMap(static fn (FitmentTyreSize $s) => $s->conditionCodes->pluck('code'))->map(static fn (mixed $c): string => (string) $c)->all();
        $source = array_values(array_unique($abnahme([...$rowCodes, ...$sizeCodes])));

        return [
            'id' => (int) $row->id,
            'vehicleId' => (int) $row->vehicle_id,
            'vehicle' => $row->vehicle === null ? '–' : self::vehicleLabel($row->vehicle),
            'configId' => (int) $row->wheel_config_id,
            'wheel' => GutachtenController::modelName($config?->wheelModel),
            'size' => $config === null ? '' : $config->label(),
            'finish' => $config?->wheelFinish?->name_de,
            'axle' => $row->axle->value,
            'axleLabel' => $row->axle->labelDe(),
            'requiresEntry' => $row->requires_entry,
            'entryDerived' => $source !== [],
            'entrySource' => array_map(static fn (string $c): string => $c.(($defined[$c] ?? null)?->source_page === null ? '' : ', Seite '.$defined[$c]->source_page), $source),
            'entryOverride' => $row->entry_override,
            'entryOverrideReason' => $row->entry_override_reason ?? '',
            'entryOverrideBy' => $row->entryOverrideBy?->name,
            'entryOverrideAt' => $row->entry_override_at === null ? null : GermanFormat::dateTime($row->entry_override_at),
            'entryNote' => $row->entry_note_de ?? '',
            'sourcePage' => $row->source_page,
            'buildFrom' => $row->build_from?->format('Y-m-d') ?? '',
            'buildTo' => $row->build_to?->format('Y-m-d') ?? '',
            'widthMin' => $row->permitted_width_min === null ? '' : GermanFormat::trimmedDecimal($row->permitted_width_min, 2),
            'widthMax' => $row->permitted_width_max === null ? '' : GermanFormat::trimmedDecimal($row->permitted_width_max, 2),
            'etMin' => $row->permitted_et_min === null ? '' : (string) $row->permitted_et_min,
            'etMax' => $row->permitted_et_max === null ? '' : (string) $row->permitted_et_max,
            'centreBore' => $row->centre_bore_mm === null ? '' : GermanFormat::trimmedDecimal($row->centre_bore_mm, 2),
            'status' => $row->status->value,
            'tyreSizes' => $row->tyreSizes->map(static fn (FitmentTyreSize $s): array => [
                'width_mm' => $s->width_mm,
                'aspect' => $s->aspect,
                'diameter' => (int) $s->diameter_in,
                'min_load_index' => $s->min_load_index,
                'min_speed_symbol' => $s->min_speed_symbol ?? '',
                'axle' => $s->axle->value,
                'kw_min' => $s->kw_min,
                'kw_max' => $s->kw_max,
                // The document's own minimum stands with the size, as the Gutachten prints it (R-06), and so
                // does its kW band (Block D).
                'label' => GermanFormat::tyreSize($s->width_mm, $s->aspect, (float) $s->diameter_in)
                    .(($s->min_load_index ?? '').($s->min_speed_symbol ?? '') === '' ? '' : ' '.($s->min_load_index ?? '').($s->min_speed_symbol ?? ''))
                    .($s->kw_min === null || $s->kw_max === null ? '' : ' · '.GermanFormat::integer($s->kw_min).GermanFormat::ENDASH.GermanFormat::integer($s->kw_max).GermanFormat::NBSP.'kW')
                    .($s->axle->value === 'ALL' ? '' : ' ('.$s->axle->labelDe().')'),
                'codes' => $s->conditionCodes->map(static fn (FitmentTyreSizeCondition $c): array => $codeView($c->code, null))->values()->all(),
                'requiresEntry' => $row->entry_override === null ? $abnahme([...$rowCodes, ...$s->conditionCodes->pluck('code')->map(static fn (mixed $c): string => (string) $c)->all()]) !== [] : $row->entry_override === 'required',
            ])->values()->all(),
            'conditions' => $row->conditionCodes->map(static fn (FitmentCondition $c): array => $codeView($c->code, $c->note_de))->values()->all(),
            'draft' => $row->status === FitmentStatus::Draft,
        ];
    }

    public static function vehicleLabel(object $vehicle): string
    {
        $keys = GermanFormat::keyNumbers((string) $vehicle->hsn, (string) $vehicle->tsn);
        $kw = $vehicle->power_kw ?? null;
        $power = is_numeric($kw) ? ' · '.$kw.' kW' : '';

        return VehicleName::from($vehicle).$power.' · '.$keys;
    }

    /** Nordfelge Fjord, or a dash for a model that is gone. */
    public static function modelName(?WheelModel $model): string
    {
        return $model === null ? '–' : trim($model->brand->name.' '.$model->name);
    }

    /** @return list<array{value: string, label: string}> */
    private static function kinds(): array
    {
        return array_map(static fn (ApprovalKind $k): array => ['value' => $k->value, 'label' => $k->labelDe()], ApprovalKind::cases());
    }

    /**
     * The released documents a new revision may replace.
     *
     * @return list<array{value: int, label: string}>
     */
    private static function replaceable(?ApprovalDocument $except): array
    {
        return ApprovalDocument::query()
            ->where('status', DocumentStatus::Published->value)
            ->when($except !== null, static fn ($q) => $q->whereKeyNot($except?->id))
            ->orderByDesc('issued_on')
            ->limit(200)
            ->get()
            ->map(static fn (ApprovalDocument $d): array => ['value' => (int) $d->id, 'label' => FitmentRows::label($d).' · Fassung '.$d->revision])
            ->values()
            ->all();
    }

    /** @return list<string> */
    public static function severities(): array
    {
        return array_map(static fn (ConditionSeverity $s): string => $s->value, ConditionSeverity::cases());
    }
}
