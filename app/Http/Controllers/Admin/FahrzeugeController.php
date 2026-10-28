<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\FitmentStatus;
use App\Enums\TyreIndexSource;
use App\Enums\VehicleSource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ManualVehicleRequest;
use App\Http\Requests\Admin\VehicleCorrectionRequest;
use App\Http\Requests\Admin\VehicleRequest;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\VehicleImport;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Vehicles\VehicleCorrection;
use App\Support\EditStamp;
use App\Support\GermanFormat;
use App\Support\SearchTerm;
use App\Support\VehicleName;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Fahrzeuge — every vehicle variant the shop knows, the ones waiting for their legal data (Zur
 * Prüfung), and one vehicle with the Gutachten rows that name it. Vehicles arrive by import, from a
 * Gutachten or typed by hand from their papers (D-296), and are never deleted here (R-04); what the
 * team completes is the legal data a verdict needs (R-03).
 */
class FahrzeugeController extends Controller
{
    public const PER_PAGE = 30;

    /** The Gutachten rows one vehicle's page draws; more are counted and named, never dropped silently (F-37). */
    public const ROWS_SHOWN = 500;

    public function index(VehicleRequest $request): Response
    {
        return $this->list($request, false);
    }

    public function review(VehicleRequest $request): Response
    {
        return $this->list($request, true);
    }

    private function list(VehicleRequest $request, bool $review): Response
    {
        $term = trim((string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', ' ', (string) ($request->validated('q') ?? '')));
        $make = trim((string) ($request->validated('marke') ?? ''));
        $order = $request->order();
        $direction = $order['richtung'] === 'ab' ? 'desc' : 'asc';
        $query = Vehicle::query()
            ->withCount(['fitments as approvals' => static fn (Builder $q) => $q->where('status', FitmentStatus::Published->value)])
            ->when($review, static fn (Builder $q) => $q->where('needs_review', true))
            ->when($make !== '', static fn (Builder $q) => $q->where('make', $make));

        // The chosen column first (F-32), then the plain list's order, so rows that tie keep one place.
        match ($order['sort']) {
            'hsn' => $query->orderBy('hsn', $direction)->orderBy('tsn', $direction),
            // A car without a build start sorts after every dated one, either way.
            'bauzeit' => $query->orderByRaw('build_from IS NULL')->orderBy('build_from', $direction),
            'freigaben' => $query->orderBy('approvals', $direction),
            default => $query->orderBy('make', $direction)->orderBy('model', $direction)->orderBy('variant', $direction),
        };
        $query->orderBy('make')->orderBy('model')->orderBy('variant')->orderBy('id');

        if ($term !== '') {
            // An HSN typed without its leading zeros — „5 Z90“ for 0005/Z90 — is the same number (Human QA 28.10.2026); four
            // digits alone stay an HSN, fewer alone a word, so a search for „3“ still finds the 3er.
            if (preg_match('/^(\d{4})\s*[\/\s-]?\s*([A-Za-z0-9]{3})?$/', $term, $m) === 1 || preg_match('/^(\d{1,3})\s*[\/\s-]\s*([A-Za-z0-9]{3})$/', $term, $m) === 1) {
                $query->where('hsn', str_pad($m[1], 4, '0', STR_PAD_LEFT))->when(($m[2] ?? '') !== '', static fn (Builder $q) => $q->where('tsn', strtoupper($m[2])));
            } else {
                foreach (preg_split('/\s+/', $term) ?: [] as $word) {
                    $likes = SearchTerm::likes($word);
                    $query->where(static function (Builder $any) use ($likes): void {
                        foreach ($likes as $like) {
                            $any->orWhere('make', 'like', $like)->orWhere('model', 'like', $like)->orWhere('variant', 'like', $like)->orWhere('type_designation', 'like', $like);
                        }
                    });
                }
            }
        }

        $page = $query->paginate(self::PER_PAGE, ['*'], 'seite', (int) ($request->validated('seite') ?? 1));
        $base = $review ? '/admin/fahrzeuge/pruefung' : '/admin/fahrzeuge';
        $keep = array_filter(['q' => $term, 'marke' => $make], static fn (string $v): bool => $v !== '');

        // The order is kept in every page link where it is not the plain list's.
        if ($order['sort'] !== 'fahrzeug' || $order['richtung'] !== 'auf') {
            $keep += $order;
        }
        $url = static fn (int $n): string => $base.(($q = http_build_query($n > 1 ? $keep + ['seite' => $n] : $keep)) === '' ? '' : '?'.$q);

        return Inertia::render('Admin/Fahrzeuge/Index', [
            'review' => $review,
            'vehicles' => collect($page->items())->map(static fn (Vehicle $v): array => [
                'id' => (int) $v->id,
                'name' => trim($v->make.' '.$v->model),
                'variant' => $v->variant,
                'keys' => GermanFormat::keyNumbers($v->hsn, $v->tsn),
                'window' => GermanFormat::buildPeriod($v->build_from, $v->build_to),
                'power' => $v->getAttribute('power_kw') === null ? null : $v->getAttribute('power_kw').' kW',
                'approvals' => (int) $v->getAttribute('approvals'),
                'needsReview' => $v->needs_review,
                'demo' => (bool) $v->is_demo,
                'href' => '/admin/fahrzeuge/'.$v->id,
            ])->values()->all(),
            'filters' => ['q' => $term, 'marke' => $make, ...$order],
            'makes' => DB::table('vehicles')->whereNull('deleted_at')->distinct()->orderBy('make')->pluck('make')->all(),
            'counts' => [
                'all' => Vehicle::query()->count(),
                'review' => Vehicle::query()->where('needs_review', true)->count(),
            ],
            'pagination' => [
                'current' => $page->currentPage(),
                'last' => $page->lastPage(),
                'total' => $page->total(),
                'prev' => $page->currentPage() > 1 ? $url($page->currentPage() - 1) : null,
                'next' => $page->hasMorePages() ? $url($page->currentPage() + 1) : null,
            ],
            'can' => [
                'create' => $request->admin()->canQuietly('create', Vehicle::class),
                'import' => $request->admin()->canQuietly('viewAny', VehicleImport::class),
            ],
        ]);
    }

    public function show(VehicleRequest $request, Vehicle $vehicle): Response
    {
        // On the app's request, not the Form Request: that is a copy, and the crumb is read from the original.
        request()->attributes->set(AdminNavigation::RECORD, VehicleName::from($vehicle));

        $rows = Fitment::query()
            ->with(['approvalDocument', 'wheelConfig.wheelModel.brand', 'wheelConfig.wheelFinish'])->withCount('conditionCodes')
            ->where('vehicle_id', $vehicle->id)
            ->orderBy('approval_document_id')
            ->orderBy('wheel_config_id')
            ->limit(self::ROWS_SHOWN)
            ->get();
        // Past ROWS_SHOWN the rest was dropped without a word (the admin audit's F-37): counted, and the page names the cut.
        $rowsTotal = $rows->count() < self::ROWS_SHOWN ? $rows->count() : Fitment::query()->where('vehicle_id', $vehicle->id)->count();

        $speed = self::topSpeed($vehicle);
        // Why the papers' details stay as they are; null where „Angaben korrigieren“ is open (F-17).
        $kept = VehicleCorrection::refusal($vehicle);

        return Inertia::render('Admin/Fahrzeuge/Show', [
            'vehicle' => [
                'id' => (int) $vehicle->id,
                'name' => VehicleName::from($vehicle),
                'keys' => GermanFormat::keyNumbers($vehicle->hsn, $vehicle->tsn),
                'vsn' => $vehicle->vsn,
                'typeDesignation' => $vehicle->getAttribute('type_designation'),
                'window' => GermanFormat::buildPeriod($vehicle->build_from, $vehicle->build_to),
                'power' => $vehicle->getAttribute('power_kw') === null ? null : $vehicle->getAttribute('power_kw').' kW',
                'bodyForm' => $vehicle->getAttribute('body_form'),
                'axleFront' => $vehicle->axle_load_front_kg,
                'axleRear' => $vehicle->axle_load_rear_kg,
                'maxSpeed' => $vehicle->max_speed_kmh,
                'needsReview' => $vehicle->needs_review,
                'complete' => $vehicle->hasCompleteLegalData(),
            ],
            // Field T is asked only where a released Gutachten naming this car needs it for the tyres, and the page says
            // which and why (D-287); what the shop waits for, as its answer names it to the customer (D-286).
            'topSpeed' => $speed,
            // Each axle on its own, as the shop asks the customer (D-291).
            'owed' => [
                ...($vehicle->axle_load_front_kg === null ? ['8.1'] : []),
                ...($vehicle->axle_load_rear_kg === null ? ['8.2'] : []),
                ...($vehicle->max_speed_kmh === null && $speed['needed'] ? ['T'] : []),
            ],
            'rows' => $rows->map(static fn (Fitment $f): array => [
                'id' => (int) $f->id,
                'documentId' => (int) $f->approval_document_id,
                'document' => $f->approvalDocument === null ? '–' : FitmentRows::label($f->approvalDocument),
                'documentHref' => '/admin/gutachten/'.$f->approval_document_id,
                'wheel' => GutachtenController::modelName($f->wheelConfig?->wheelModel),
                'size' => $f->wheelConfig?->label() ?? '',
                'status' => $f->status->value,
                'requiresEntry' => $f->requires_entry,
                'conditions' => (int) $f->getAttribute('condition_codes_count'),
            ])->values()->all(),
            'rowsTotal' => $rowsTotal,
            // The papers' own details (the admin audit's F-17): correctable on a car typed by hand that nothing refers
            // to yet, with the form's values and what it was opened on — otherwise why not. A car is never deleted (R-04).
            'identity' => [
                'correctable' => $kept === null,
                'why' => $kept,
                'form' => $kept === null ? VehicleCorrection::form($vehicle) : null,
                'stamp' => $kept === null ? EditStamp::of(VehicleCorrection::state($vehicle->id)) : null,
            ],
            'bodyForms' => DocumentConditions::BODY_FORMS,
            'drives' => array_values(array_diff(DocumentConditions::DRIVES, ['Allradlenkung'])),
            'can' => ['edit' => $request->admin()->canQuietly('update', $vehicle)],
            // The three figures the form was opened on: a save against older ones is refused (EditStamp, F-25).
            'stamp' => EditStamp::of(self::legalState($vehicle->id)),
        ]);
    }

    /**
     * The figures the page edits, as stored now.
     *
     * @return array{0: int|null, 1: int|null, 2: int|null}|null
     */
    private static function legalState(int $id, bool $lock = false): ?array
    {
        $row = Vehicle::query()->whereKey($id)->when($lock, static fn ($q) => $q->lockForUpdate())->first(['id', 'axle_load_front_kg', 'axle_load_rear_kg', 'max_speed_kmh']);

        return $row === null ? null : [$row->axle_load_front_kg, $row->axle_load_rear_kg, $row->max_speed_kmh];
    }

    /** Fahrzeuge › Neues Fahrzeug (his admin items 1 and 3, D-296): the form, with the lists a car may name. */
    public function create(VehicleRequest $request): Response
    {
        // On the app's request, not the Form Request: that is a copy, and the crumb is read from the original.
        request()->attributes->set(AdminNavigation::RECORD, 'Neues Fahrzeug');

        return Inertia::render('Admin/Fahrzeuge/Neu', [
            'bodyForms' => DocumentConditions::BODY_FORMS,
            'drives' => array_values(array_diff(DocumentConditions::DRIVES, ['Allradlenkung'])),
        ]);
    }

    /**
     * A car typed by hand from its papers: `manuell_geprueft`, never `entwicklung` — a person checked it against the
     * Zulassungsbescheinigung. Without its axle loads and top speed it waits under „Zur Prüfung“ (R-03). One Protokoll
     * entry; the catalogue's version moves with the save (CatalogueVersion), so the selector has it at once.
     */
    public function store(ManualVehicleRequest $request): RedirectResponse
    {
        $car = $request->car();
        $admin = $request->admin();
        $complete = $car['axle_load_front_kg'] !== null && $car['axle_load_rear_kg'] !== null && $car['max_speed_kmh'] !== null;

        $vehicle = DB::transaction(static function () use ($car, $admin, $complete): Vehicle {
            $vehicle = Vehicle::query()->create([
                ...$car,
                'source' => VehicleSource::ManuellGeprueft->value,
                'source_vehicle_id' => null,
                'needs_review' => ! $complete,
                // What was typed, as typed: the record of where this car came from.
                'raw' => ['manuell' => $car],
            ]);

            AuditTrail::record($admin, 'vehicle.created_manually', [
                'vehicle' => VehicleName::from($vehicle).' · '.GermanFormat::keyNumbers($vehicle->hsn, $vehicle->tsn),
                'eg' => $car['eg_nummer_raw'],
                'complete' => $complete,
            ], $vehicle);

            return $vehicle;
        });

        $toast = match (true) {
            $complete => 'Angelegt. Das Fahrzeug ist vollständig.',
            $car['axle_load_front_kg'] === null || $car['axle_load_rear_kg'] === null => 'Angelegt. Es fehlt noch mindestens eine Achslast – das Fahrzeug steht unter „Zur Prüfung“.',
            default => 'Angelegt. Die Höchstgeschwindigkeit fehlt noch – das Fahrzeug steht unter „Zur Prüfung“. Ob ein freigegebenes Gutachten sie für die Reifen braucht, zeigt dir die Seite des Fahrzeugs.',
        };

        return redirect('/admin/fahrzeuge/'.$vehicle->id)->with('toast', $toast);
    }

    /**
     * „Angaben korrigieren“ (the admin audit's F-17): the papers' own details of a car typed by hand, while nothing
     * refers to it — asked again under the lock, so an order or a Gutachten row arriving meanwhile still keeps it as it is.
     */
    public function correct(VehicleCorrectionRequest $request, Vehicle $vehicle): RedirectResponse
    {
        DB::transaction(function () use ($request, $vehicle): void {
            $locked = Vehicle::query()->lockForUpdate()->findOrFail($vehicle->id);
            $refusal = VehicleCorrection::refusal($locked);

            if ($refusal !== null) {
                throw ValidationException::withMessages(['_vehicle' => $refusal]);
            }

            EditStamp::guard($request, VehicleCorrection::state($locked->id));
            $changes = Arr::only($request->car(), VehicleCorrection::FIELDS);
            $before = array_map(static fn (mixed $value): mixed => $value instanceof \DateTimeInterface ? $value->format('Y-m-d') : $value, $locked->only(array_keys($changes)));

            $locked->forceFill($changes)->save();

            AuditTrail::record($request->admin(), 'vehicle.corrected', [
                'vehicle' => VehicleName::from($locked).' · '.GermanFormat::keyNumbers($locked->hsn, $locked->tsn),
                'old' => $before,
                'new' => $changes,
            ], $locked);
        });

        return back()->with('toast', 'Angaben korrigiert.');
    }

    public function update(VehicleRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $data = $request->legalData();
        $wasComplete = $vehicle->hasCompleteLegalData();

        DB::transaction(function () use ($vehicle, $data, $request): void {
            EditStamp::guard($request, self::legalState($vehicle->id, lock: true));
            $before = $vehicle->only(array_keys($data));
            $complete = ! in_array(null, $data, true);
            // Complete legal data ends the review; anything missing keeps it (R-03).
            $vehicle->forceFill($data + ['needs_review' => ! $complete])->save();

            AuditTrail::record($request->admin(), 'vehicle.legal_data_updated', [
                'vehicle' => VehicleName::from($vehicle),
                'old' => $before,
                'new' => $data,
                'complete' => $complete,
            ], $vehicle);
        });

        // Only the top speed missing, and no released Gutachten for this car needs it: still under review (R-03), but the
        // shop answers the tyres without it (D-284) — said, so nobody hunts for a figure nothing asks for (D-287).
        $speedOnly = $data['max_speed_kmh'] === null && $data['axle_load_front_kg'] !== null && $data['axle_load_rear_kg'] !== null;

        $toast = match (true) {
            ! in_array(null, $data, true) => 'Gespeichert. Das Fahrzeug ist vollständig.',
            $wasComplete => 'Gespeichert. Jetzt fehlt mindestens eine Angabe – das Fahrzeug steht wieder unter „Zur Prüfung“.',
            $speedOnly && ! self::topSpeed($vehicle)['needed'] => 'Gespeichert. Die Höchstgeschwindigkeit fehlt noch – das Fahrzeug bleibt unter „Zur Prüfung“. Für die Reifen braucht der Shop sie bei diesem Fahrzeug nicht.',
            default => 'Gespeichert. Es fehlen noch Angaben – das Fahrzeug bleibt unter „Zur Prüfung“.',
        };

        return back()->with('toast', $toast);
    }

    /**
     * Whether a released Gutachten naming this car needs its top speed for the tyres (D-284, D-287): every one that does
     * not give load index and symbol beside every size, an unanswered one included — and why, as recorded with each
     * (D-277), never more than that (R-17). Released as the shop reads it: a published row of a published, valid document.
     *
     * @return array{needed: bool, released: int, documents: list<array{id: int, label: string, href: string, why: string}>}
     */
    private static function topSpeed(Vehicle $vehicle): array
    {
        $released = ApprovalDocument::query()
            ->whereIn('id', Fitment::query()->visibleToCustomers()->where('vehicle_id', $vehicle->id)->select('approval_document_id'))
            ->orderBy('id')
            ->get();
        $needing = $released->reject(static fn (ApprovalDocument $d): bool => $d->tyre_index_source === TyreIndexSource::Document);

        return [
            'needed' => $needing->isNotEmpty(),
            'released' => $released->count(),
            'documents' => $needing->map(static fn (ApprovalDocument $d): array => [
                'id' => (int) $d->id,
                'label' => FitmentRows::label($d),
                'href' => '/admin/gutachten/'.$d->id,
                'why' => match ($d->tyre_index_source) {
                    TyreIndexSource::Papers => 'Laut den Angaben verweist das Gutachten für Lastindex und Geschwindigkeitssymbol auf die Fahrzeugpapiere.',
                    TyreIndexSource::Table => 'Laut den Angaben druckt das Gutachten eine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit.',
                    default => 'Wie das Gutachten Lastindex und Geschwindigkeitssymbol angibt, ist unter „Angaben“ noch nicht erfasst.',
                },
            ])->values()->all(),
        ];
    }
}
