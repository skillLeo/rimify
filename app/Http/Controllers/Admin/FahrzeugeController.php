<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\FitmentStatus;
use App\Enums\TyreIndexSource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\VehicleRequest;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use App\Support\VehicleName;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Fahrzeuge — every vehicle variant the shop knows, the ones waiting for their legal data (Zur
 * Prüfung), and one vehicle with the Gutachten rows that name it. Vehicles arrive by import and are
 * never deleted here (R-04); what the team completes is the legal data a verdict needs (R-03).
 */
class FahrzeugeController extends Controller
{
    public const PER_PAGE = 30;

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
        $query = Vehicle::query()
            ->withCount(['fitments as approvals' => static fn (Builder $q) => $q->where('status', FitmentStatus::Published->value)])
            ->when($review, static fn (Builder $q) => $q->where('needs_review', true))
            ->when($make !== '', static fn (Builder $q) => $q->where('make', $make))
            ->orderBy('make')->orderBy('model')->orderBy('variant')->orderBy('id');

        if ($term !== '') {
            if (preg_match('/^(\d{4})\s*[\/\s-]?\s*([A-Za-z0-9]{3})?$/', $term, $m) === 1) {
                $query->where('hsn', $m[1])->when(($m[2] ?? '') !== '', static fn (Builder $q) => $q->where('tsn', strtoupper($m[2])));
            } else {
                foreach (preg_split('/\s+/', $term) ?: [] as $word) {
                    $like = '%'.addcslashes($word, '%_\\').'%';
                    $query->where(static fn (Builder $any) => $any->where('make', 'like', $like)->orWhere('model', 'like', $like)->orWhere('variant', 'like', $like)->orWhere('type_designation', 'like', $like));
                }
            }
        }

        $page = $query->paginate(self::PER_PAGE, ['*'], 'seite', (int) ($request->validated('seite') ?? 1));
        $base = $review ? '/admin/fahrzeuge/pruefung' : '/admin/fahrzeuge';
        $keep = array_filter(['q' => $term, 'marke' => $make], static fn (string $v): bool => $v !== '');
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
            'filters' => ['q' => $term, 'marke' => $make],
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
            ->limit(500)
            ->get();

        $speed = self::topSpeed($vehicle);

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
            'can' => ['edit' => $request->admin()->canQuietly('update', $vehicle)],
        ]);
    }

    public function update(VehicleRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $data = $request->legalData();
        $wasComplete = $vehicle->hasCompleteLegalData();

        DB::transaction(function () use ($vehicle, $data, $request): void {
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
