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
use App\Http\Requests\Admin\ApprovalCompletenessRequest;
use App\Http\Requests\Admin\ApprovalDocumentRequest;
use App\Http\Requests\Admin\ApprovalReleaseRequest;
use App\Http\Requests\Admin\ApprovalStepRequest;
use App\Http\Requests\Admin\DocumentCountRequest;
use App\Http\Requests\Admin\DocumentRevisionRequest;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Models\DocumentConditionRework;
use App\Models\DocumentFastener;
use App\Models\DocumentNotice;
use App\Models\DocumentTyreCombination;
use App\Models\Fitment;
use App\Models\FitmentCondition;
use App\Models\FitmentTyreSize;
use App\Models\FitmentTyreSizeCondition;
use App\Models\WheelModel;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\Approvals\CountFigures;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Services\Admin\Approvals\DocumentPreview;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\Approvals\DocumentRevision;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\Approvals\LoadLimitCheck;
use App\Services\Admin\Approvals\SamePdf;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Lists\ListPaging;
use App\Services\Storage\DocumentFiles;
use App\Services\Storage\PdfUpload;
use App\Services\Storage\UploadRejected;
use App\Support\EditStamp;
use App\Support\GermanFormat;
use App\Support\SearchTerm;
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

    /** The rows one page draws; more are counted and named, never dropped silently (F-37). */
    public const ROWS_SHOWN = 1000;

    public function index(Request $request): Response
    {
        // Each document's rows counted first, then joined: grouping every joined row by the document's eleven columns took
        // 55–80 ms for 13 documents and 4 000 rows, and grew with every row entered; counted first, 20 ms (D-271).
        $counts = DB::table('fitments')
            ->select('approval_document_id')
            ->selectRaw('COUNT(*) as fitment_count')
            ->selectRaw("SUM(status = 'published') as published_count")
            ->groupBy('approval_document_id');

        $query = DB::table('approval_documents as ad')
            ->leftJoinSub($counts, 'f', 'f.approval_document_id', '=', 'ad.id')
            // Drafts first — the documents being worked on — then the newest; a document without its
            // date is not buried at the bottom (MySQL sorts NULL last in a descending order).
            ->orderByRaw("ad.status = 'draft' DESC")
            ->orderByRaw('ad.issued_on IS NULL DESC')
            ->orderByDesc('ad.issued_on')
            ->orderByDesc('ad.id');

        // By any number a document is known by, or its issuer (the admin audit's F-31: a thousand on one page, no search).
        $search = is_string($request->query('q')) ? mb_substr(trim((string) $request->query('q')), 0, 100) : '';

        // A Nachtrag is found by the ABE it supplements too, and „TUEV“ finds „TÜV“ (Human QA 28.10.2026).
        if ($search !== '') {
            $query->where(static function ($where) use ($search): void {
                foreach (SearchTerm::likes($search) as $like) {
                    $where->orWhere('ad.report_number', 'like', $like)->orWhere('ad.kba_number', 'like', $like)
                        ->orWhere('ad.supplement_to_number', 'like', $like)
                        ->orWhere('ad.approval_mark', 'like', $like)->orWhere('ad.issuer', 'like', $like);
                }
            });
        }

        // Status and kind narrow the list on the server now that it comes in pages: each chip with how many it holds.
        $statusCounts = DB::table('approval_documents')->select('status')->selectRaw('COUNT(*) as n')->groupBy('status')->pluck('n', 'status');
        $kindCounts = DB::table('approval_documents')->select('kind')->selectRaw('COUNT(*) as n')->groupBy('kind')->pluck('n', 'kind');
        $status = is_string($request->query('status')) && $statusCounts->has($request->query('status')) ? (string) $request->query('status') : '';
        $kind = is_string($request->query('art')) && $kindCounts->has($request->query('art')) ? (string) $request->query('art') : '';

        if ($status !== '') {
            $query->where('ad.status', $status);
        }

        if ($kind !== '') {
            $query->where('ad.kind', $kind);
        }

        $page = $query->paginate(ListPaging::PER_PAGE, [
            'ad.id', 'ad.report_number', 'ad.kind', 'ad.issuer', 'ad.kba_number', 'ad.approval_mark',
            'ad.issued_on', 'ad.revision', 'ad.status', 'ad.page_count', 'ad.is_demo',
            DB::raw('COALESCE(f.fitment_count, 0) as fitment_count'),
            DB::raw('COALESCE(f.published_count, 0) as published_count'),
        ], 'seite', ListPaging::requested($request->query('seite')));

        $rows = [];

        foreach ($page->items() as $row) {
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
                // Seeded as an example (the acceptance set, the demo catalogue): said in the list, not only in the row.
                'demo' => (bool) $row->is_demo,
                'href' => '/admin/gutachten/'.$row->id,
            ];
        }

        $admin = $request->user('admin');

        return Inertia::render('Admin/Gutachten/Index', [
            'documents' => $rows,
            'found' => $page->total(),
            'total' => (int) $statusCounts->sum(),
            'released' => (int) ($statusCounts['published'] ?? 0),
            'search' => $search,
            'status' => $status,
            'kind' => $kind,
            'statusOptions' => $statusCounts->map(static fn (mixed $n, string $value): array => ['value' => $value, 'count' => (int) $n])->values()->all(),
            'kindOptions' => $kindCounts->map(static fn (mixed $n, string $value): array => ['value' => $value, 'count' => (int) $n])->values()->all(),
            'pagination' => ListPaging::props($page, '/admin/gutachten', ['q' => $search, 'status' => $status, 'art' => $kind]),
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
        $this->refuseKnownFile($pdf, null, is_int($facts['supersedes_id']) ? $facts['supersedes_id'] : null);

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
            ->limit(self::ROWS_SHOWN)
            ->get();
        // Every row, counted: past ROWS_SHOWN the page said „alle 1.000 Zeilen gelten“ of a document that releases more
        // (the admin audit's F-37). The page names the cut, and every sentence about the release counts them all.
        $rowsTotal = $rows->count() < self::ROWS_SHOWN ? $rows->count() : Fitment::query()->where('approval_document_id', $document->id)->count();

        $vehicles = $rows->pluck('vehicle')->filter()->unique('id')->values();
        $chosen = $request->vehicleId() ?? $vehicles->first()?->id;
        /** @var array<string, DocumentCondition> $defined */
        $defined = $document->conditions()->get()->keyBy('code')->all();
        $uses = DocumentConditions::usesByCode($document);
        $started = $document->status === DocumentStatus::Published ? DocumentRevision::startedFor($document) : null;

        return Inertia::render('Admin/Gutachten/Show', [
            'document' => self::documentFacts($document),
            'rows' => $rows->map(static fn (Fitment $row): array => self::row($row, $defined))->values()->all(),
            'rowsTotal' => $rowsTotal,
            'vehicles' => $vehicles->map(static fn ($v): array => ['id' => (int) $v->id, 'label' => self::vehicleLabel($v)])->all(),
            // What the release will refuse, said before „Freigeben“ is pressed: the entry's own checks and its comparison with
            // the Zählung — the page once said „Kann freigegeben werden“ and the release then refused on the count (F-18).
            'blockers' => $document->status === DocumentStatus::Draft ? [...$release->check($document), ...self::countBlockers($document, $release)] : [],
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
            // Its own „Bereifungskombinationen“ (D-256): once there are any, the only tyres the shop offers on it.
            'combinations' => self::combinationsView($document),
            // What each card was opened on: a save against an older state is refused (EditStamp, the admin audit's F-25).
            'stamps' => [
                'document' => EditStamp::of(self::documentState($document->id)),
                'derating' => EditStamp::of(self::deratingState($document)),
                'combinations' => EditStamp::of(self::combinationsState($document)),
            ],
            'openConflicts' => DB::table('fitment_conflicts')->where('status', 'open')
                ->whereIn('candidate_fitment_id', $rows->pluck('id'))->count(),
            // Which buttons to draw: asked, not attempted — a released document's „no“ is no refusal (ADMIN-GEFUNDEN 509).
            'can' => [
                'edit' => $admin->canQuietly('update', $document),
                'release' => $admin->canQuietly('publish', $document),
                // How loud each Auflage is in the shop: on a released document too (#23, D-104).
                'levels' => $admin->canQuietly('setLevels', $document),
                // The way back into a released document (ADMIN-GEFUNDEN 510).
                'revise' => $admin->canQuietly('revise', $document),
                // „Ist alles erfasst?“ for a released document (D-227, ADMIN-GEFUNDEN 513).
                'answer' => $admin->canQuietly('answerCompleteness', $document),
            ],
            // A revision of it already started: „Neue Fassung öffnen“ instead of a second copy.
            'revisionDraft' => $started === null ? null : ['id' => (int) $started->id, 'label' => FitmentRows::label($started), 'revision' => (int) $started->revision],
            'levels' => array_map(static fn (ConditionLevel $l): array => ['value' => $l->value, 'label' => $l->labelDe()], ConditionLevel::cases()),
            'levelFloorSentence' => ConditionLevel::FLOOR_SENTENCE,
        ]);
    }

    /**
     * Where the entry and its Zählung differ, in the release's own sentences (DocumentRelease::declarationBlockers) — the
     * completeness question is the dialog's to ask, so it is taken as answered here. Nothing before a count exists: the
     * page asks for the count first.
     *
     * @return list<string>
     */
    private static function countBlockers(ApprovalDocument $document, DocumentRelease $release): array
    {
        $count = CountFigures::of($document);

        return $count === null ? [] : $release->declarationBlockers($document, $count->declaration(ApprovalDocument::COMPLETE, null));
    }

    /**
     * The document's own row as stored now — what „Angaben“ and „Zählung“ rewrite (EditStamp, F-25).
     *
     * @return array<string, mixed>|null
     */
    public static function documentState(int $id, bool $lock = false): ?array
    {
        return ApprovalDocument::query()->whereKey($id)->when($lock, static fn ($q) => $q->lockForUpdate())->first()?->getAttributes();
    }

    /**
     * The table of tyre load at speed as stored now (EditStamp, F-25).
     *
     * @return list<array<string, mixed>>
     */
    public static function deratingState(ApprovalDocument $document): array
    {
        return $document->speedDeratings()->reorder()->orderBy('id')->get()->map(static fn ($cell): array => $cell->getAttributes())->all();
    }

    /**
     * The list of tyre combinations as stored now (EditStamp, F-25).
     *
     * @return list<array<string, mixed>>
     */
    public static function combinationsState(ApprovalDocument $document): array
    {
        return $document->tyreCombinations()->reorder()->orderBy('id')->get()->map(static fn ($c): array => $c->getAttributes())->all();
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

    /**
     * The document's own list of tyre combinations as the card shows it: in its numbering, each size as printed.
     *
     * @return array{sourcePage: int|null, entries: list<array{number: int, front: string, rear: string}>}
     */
    private static function combinationsView(ApprovalDocument $document): array
    {
        $combinations = $document->tyreCombinations()->get();

        return [
            'sourcePage' => $combinations->first()?->source_page,
            'entries' => $combinations->map(static fn (DocumentTyreCombination $c): array => [
                'number' => $c->number,
                'front' => GermanFormat::tyreSize($c->front_width_mm, $c->front_aspect, $c->front_diameter_in),
                'rear' => GermanFormat::tyreSize($c->rear_width_mm, $c->rear_aspect, $c->rear_diameter_in),
            ])->values()->all(),
        ];
    }

    public function update(ApprovalDocumentRequest $request, ApprovalDocument $document, PdfUpload $uploads): RedirectResponse
    {
        $facts = $request->facts();
        $admin = $request->admin();
        $key = $request->uploadKey();
        $pdf = $key === null ? null : $this->confirmPdf($uploads, $key);

        if ($pdf !== null) {
            $this->refuseKnownFile($pdf, $document, is_int($facts['supersedes_id']) ? $facts['supersedes_id'] : null);
        }

        DB::transaction(function () use ($request, $document, $facts, $admin, $pdf): void {
            EditStamp::guard($request, self::documentState($document->id, lock: true));
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

    /** „Neue Fassung anlegen“: a draft revision holding all the released one holds — or the one already started (510). */
    public function revise(DocumentRevisionRequest $request, ApprovalDocument $document, DocumentRevision $revisions): RedirectResponse
    {
        $started = DocumentRevision::startedFor($document) !== null;
        $draft = $revisions->draftFrom($document, $request->admin());

        return redirect('/admin/gutachten/'.$draft->id)->with('toast', $started
            ? 'Für dieses Gutachten gibt es schon eine neue Fassung im Entwurf – hier ist sie.'
            : 'Neue Fassung angelegt, mit allen Zeilen und Codes. Im Shop gilt die bisherige, bis diese freigegeben ist.');
    }

    /** The count of the Verwendungsbereich, before the rows are entered, each figure with its page (ADMIN-GEFUNDEN 511). */
    public function count(DocumentCountRequest $request, ApprovalDocument $document, DocumentRelease $release): RedirectResponse
    {
        $counted = $document->isCounted();
        DB::transaction(static function () use ($request, $document, $release): void {
            EditStamp::guard($request, self::documentState($document->id, lock: true));
            $release->recordCount($document, $request->admin(), $request->figures());
        });

        return back()->with('toast', $counted ? 'Zählung geändert. Das Protokoll hält fest, was vorher stand.' : 'Zählung gespeichert. Die Freigabe vergleicht die Zeilen mit dieser Zählung.');
    }

    public function release(ApprovalReleaseRequest $request, ApprovalDocument $document, DocumentRelease $release): RedirectResponse
    {
        // A draft from before the count was asked first: its count comes with the release, recorded as taken after the entry.
        $figures = $request->figures();

        if ($figures !== null) {
            $release->recordCount($document, $request->admin(), $figures);
        }

        $result = $release->release($document, $request->admin(), null, $request->declaration());
        $toast = match ($result['rows']) {
            // A base without rows of its own (DocumentRelease): its facts now reach the shop through its Nachträge.
            0 => 'Freigegeben: Der Shop übernimmt die Angaben dieses Grundgutachtens jetzt für seine Nachträge.',
            1 => 'Freigegeben: Die Zeile ist jetzt im Shop.',
            default => 'Freigegeben: '.GermanFormat::integer($result['rows']).' Zeilen sind jetzt im Shop.',
        };

        if ($result['conflicts'] > 0) {
            $toast .= ' '.($result['conflicts'] === 1 ? 'Ein Widerspruch' : GermanFormat::integer($result['conflicts']).' Widersprüche')
                .' zu anderen Gutachten erkannt – bis unter Konflikte entschieden ist, sagt der Shop dort „Noch nicht bestätigt“.';
        }

        return back()->with('toast', $toast);
    }

    /** The completeness question answered for a released document (D-227): recorded, in the Protokoll, read by the shop. */
    public function completeness(ApprovalCompletenessRequest $request, ApprovalDocument $document, DocumentRelease $release): RedirectResponse
    {
        $release->answerCompleteness($document, $request->admin(), (string) $request->validated('completeness'), $request->validated('missing') === null ? null : (string) $request->validated('missing'));

        return back()->with('toast', 'Gespeichert: '.$document->refresh()->completenessDe().'.');
    }

    /**
     * The count as the page shows it — its figures for the form, its lines, who counted and when, and whether it was
     * taken before any row stood (ADMIN-GEFUNDEN 511) — or null where nobody has counted.
     *
     * @return array{codes: int, codesPage: int, sizes: int, sizesPage: int, axleLimitKg: int|null, axleLimitPage: int|null, abnahme: string, abnahmePage: int|null, lines: list<string>, by: string|null, at: string, beforeEntry: bool}|null
     */
    private static function countFacts(ApprovalDocument $document): ?array
    {
        $count = CountFigures::of($document);

        if ($count === null) {
            return null;
        }

        return $count->toArray() + [
            'lines' => $count->linesDe(),
            'by' => $document->counted_by === null ? null : AdminUser::query()->whereKey($document->counted_by)->value('name'),
            'at' => GermanFormat::dateTime($document->counted_at),
            'beforeEntry' => $document->counted_before_entry,
        ];
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

    /**
     * A file a real document already carries is not entered a second time under another name (ADMIN-GEFUNDEN 503): the
     * copy just confirmed is removed again, and the sentence names the document that has it. An example document's
     * file never stands in the way of a real one — the page of each says that they share it (`samePdf`).
     *
     * @param  array{path: string, sha256: string}  $pdf
     */
    private function refuseKnownFile(array $pdf, ?ApprovalDocument $document, ?int $supersedesId): void
    {
        $twin = SamePdf::twins($pdf['sha256'], $document, $supersedesId)
            ->first(static fn (ApprovalDocument $d): bool => ! (bool) $d->getAttribute('is_demo'));

        if ($twin === null) {
            return;
        }

        try {
            Storage::disk(self::DISK)->delete($pdf['path']);
        } catch (Throwable) {
            // Left unreferenced: no row points at this copy.
        }

        throw ValidationException::withMessages(['upload_key' => self::knownFile($twin)]);
    }

    public static function knownFile(ApprovalDocument $twin): string
    {
        return 'Diese PDF-Datei liegt schon bei „'.FitmentRows::label($twin).'“ ('.self::statusLabel($twin->status)
            .'). Ein Gutachten wird nur einmal angelegt – öffne es dort, oder lad die richtige Datei hoch.';
    }

    private static function statusLabel(DocumentStatus $status): string
    {
        return match ($status) {
            DocumentStatus::Draft => 'Entwurf',
            DocumentStatus::Published => 'Freigegeben',
            DocumentStatus::Superseded => 'Ersetzt',
            DocumentStatus::Withdrawn => 'Zurückgezogen',
        };
    }

    /** @return array<string, mixed> */
    public static function documentFacts(ApprovalDocument $document): array
    {
        $url = null;
        $missing = false;

        // A link is offered only to a file that is there — on the disk in force, or on the server's disk it
        // stayed on after a switch to the bucket (D-229): a stored key without its file says so instead of
        // opening a 403.
        if ($document->pdf_key !== null) {
            $found = app(DocumentFiles::class)->locate($document->pdf_key);
            $missing = $found['state'] === DocumentFiles::MISSING;
            $url = $found['url'];
        }

        return [
            'id' => (int) $document->id,
            'label' => FitmentRows::label($document),
            'kind' => $document->kind->value,
            'kindLabel' => $document->kind->labelDe(),
            // An example document carries its mark wherever it is shown (decision 6, D-239).
            'demo' => (bool) $document->getAttribute('is_demo'),
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
            // What its Verwendungsbereich prints, counted from the PDF before the rows (ADMIN-GEFUNDEN 511), or null.
            'count' => self::countFacts($document),
            'status' => $document->status->value,
            'statusLabel' => self::statusLabel($document->status),
            'validFrom' => GermanFormat::date($document->valid_from),
            'validTo' => GermanFormat::date($document->valid_to),
            // „Sind alle Anlagen und alle Fahrzeuge erfasst?“ (D-227): the answer, who gave it and when — or that nobody has.
            'completeness' => $document->completeness,
            'completenessLabel' => $document->completenessDe(),
            'completenessBy' => $document->completeness_by === null ? null : AdminUser::query()->whereKey($document->completeness_by)->value('name'),
            'completenessAt' => $document->completeness_at === null ? null : GermanFormat::dateTime($document->completeness_at),
            'missingAnnexes' => (string) ($document->missing_annexes ?? ''),
            'pdfUrl' => $url,
            'hasPdf' => $document->pdf_key !== null,
            'pdfMissing' => $missing,
            // The same file under another name (ADMIN-GEFUNDEN 503): said, so a file typed under the wrong number shows it.
            'samePdf' => SamePdf::twins($document->pdf_sha256, $document)->map(static fn (ApprovalDocument $d): array => [
                'label' => FitmentRows::label($d),
                'href' => '/admin/gutachten/'.$d->id,
                'status' => self::statusLabel($d->status),
                'demo' => (bool) $d->getAttribute('is_demo'),
            ])->values()->all(),
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
                'tyre_index_source' => $document->tyre_index_source->value ?? '',
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
                // Where the tyres' index comes from, as read off the document (D-277).
                ['label' => 'Lastindex und Geschwindigkeitssymbol', 'value' => $document->tyre_index_source?->labelDe() ?? ''],
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
     * The documents a Nachtrag may supplement: any that is not itself a Nachtrag — every one, newest first. The
     * newest 300 only left an older Gutachten unchoosable and „uns nicht vorliegend“ the way on (the admin audit's
     * F-36); the page shortens the list by typing (DocumentSelect).
     *
     * @return list<array{value: int, label: string}>
     */
    private static function supplementable(): array
    {
        return ApprovalDocument::query()
            ->where('kind', '<>', ApprovalKind::Nachtrag->value)
            ->orderByDesc('issued_on')
            ->orderByDesc('id')
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
            // The code as this page shows it: „Bearbeiten“ sends it back, and a save against an older state is refused (F-25).
            'stamp' => EditStamp::of(DocumentConditions::state($condition)),
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
            // With what each kind does, said beside the choice (the admin audit's F-07).
            'kinds' => array_map(static fn (ConditionKind $k): array => ['value' => $k->value, 'label' => $k->labelDe(), 'section' => $k->sectionDe(), 'help' => $k->helpDe()], ConditionKind::cases()),
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
            // The row as this page shows it: „Zeile ändern“ sends it back, and a save against an older state is refused (F-25).
            'stamp' => EditStamp::of(FitmentRows::state($row)),
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
     * The released documents a new revision may replace — every one, newest first, as the Nachtrag's (F-36).
     *
     * @return list<array{value: int, label: string}>
     */
    private static function replaceable(?ApprovalDocument $except): array
    {
        return ApprovalDocument::query()
            ->where('status', DocumentStatus::Published->value)
            ->when($except !== null, static fn ($q) => $q->whereKeyNot($except?->id))
            ->orderByDesc('issued_on')
            ->orderByDesc('id')
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
