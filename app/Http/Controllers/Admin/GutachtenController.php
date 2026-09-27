<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

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
use App\Models\ConditionCode;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\WheelModel;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\Approvals\DocumentPreview;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\Approvals\FitmentRows;
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
            ->with(['vehicle' => static fn ($q) => $q->withTrashed(), 'wheelConfig.wheelModel.brand', 'wheelConfig.wheelFinish', 'tyreSizes', 'conditions'])
            ->where('approval_document_id', $document->id)
            ->orderBy('vehicle_id')
            ->orderBy('wheel_config_id')
            ->limit(1000)
            ->get();

        $vehicles = $rows->pluck('vehicle')->filter()->unique('id')->values();
        $chosen = $request->vehicleId() ?? $vehicles->first()?->id;

        return Inertia::render('Admin/Gutachten/Show', [
            'document' => self::documentFacts($document),
            'rows' => $rows->map(self::row(...))->values()->all(),
            'vehicles' => $vehicles->map(static fn ($v): array => ['id' => (int) $v->id, 'label' => self::vehicleLabel($v)])->all(),
            'blockers' => $document->status === DocumentStatus::Draft ? $release->check($document) : [],
            // Lazy: the preview is computed when a vehicle is chosen, and only for it.
            'preview' => Inertia::optional(static fn (): array => $chosen === null ? [] : $preview->for($document, (int) $chosen)),
            'previewVehicle' => $chosen,
            'conditions' => ConditionCode::query()->orderBy('sort_order')->orderBy('id')->get()
                ->map(static fn (ConditionCode $c): array => ['id' => (int) $c->id, 'code' => $c->code, 'text' => $c->text_de, 'severity' => $c->severity->value])->all(),
            'kinds' => self::kinds(),
            'replaceable' => self::replaceable($document),
            'openConflicts' => DB::table('fitment_conflicts')->where('status', 'open')
                ->whereIn('candidate_fitment_id', $rows->pluck('id'))->count(),
            'can' => [
                'edit' => $admin->can('update', $document),
                'release' => $admin->can('publish', $document),
            ],
        ]);
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
        $rows = $result['rows'] === 1 ? 'eine Zeile' : GermanFormat::integer($result['rows']).' Zeilen';
        $toast = "Freigegeben: {$rows} sind jetzt im Shop.";

        if ($result['conflicts'] > 0) {
            $toast .= ' '.($result['conflicts'] === 1 ? 'Ein Widerspruch' : GermanFormat::integer($result['conflicts']).' Widersprüche')
                .' zu anderen Gutachten erkannt – bis zur Klärung gilt die strengere Angabe.';
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

        if ($document->pdf_key !== null) {
            try {
                $url = Storage::disk(self::DISK)->url($document->pdf_key);
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
        ];
    }

    /** @return array<string, mixed> */
    private static function row(Fitment $row): array
    {
        $config = $row->wheelConfig;

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
                'label' => GermanFormat::tyreSize($s->width_mm, $s->aspect, (float) $s->diameter_in).($s->axle->value === 'ALL' ? '' : ' ('.$s->axle->labelDe().')'),
            ])->values()->all(),
            'conditions' => $row->conditions->map(static fn (ConditionCode $c): array => [
                'id' => (int) $c->id,
                'text' => $c->text_de,
                'note' => (string) ($c->pivot?->getAttribute('note_de') ?? ''),
            ])->values()->all(),
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
