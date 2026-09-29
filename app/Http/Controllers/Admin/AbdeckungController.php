<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fitment;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\Dashboard\Coverage;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gutachten › Abdeckung — the Abdeckungs-Matrix at full size, and behind every cell the vehicle
 * variants it counts (docs/admin/rest-build-plan.md, „Übersicht und Shell“ step E).
 *
 * `?marke=BMW&zoll=19` lists every BMW variant with how many Felgen of 19 inches a customer may be
 * shown for it — the covered ones and, as importantly, the ones with none, which are the next
 * Gutachten worth having. Reading it is the Gutachten right (the route asks).
 */
class AbdeckungController extends Controller
{
    public function index(Request $request, Coverage $coverage): Response
    {
        $matrix = $coverage->matrix();
        $make = is_string($request->query('marke')) ? trim((string) $request->query('marke')) : '';
        $size = is_string($request->query('zoll')) ? str_replace(',', '.', trim((string) $request->query('zoll'))) : '';

        $selection = null;

        if ($make !== '' && is_numeric($size)) {
            $selection = $this->variants($make, (float) $size);
            $request->attributes->set(AdminNavigation::RECORD, $make.', '.GermanFormat::trimmedDecimal((float) $size, 1).' Zoll');
        }

        return Inertia::render('Admin/Abdeckung/Index', [
            'matrix' => $matrix,
            'selection' => $selection,
        ]);
    }

    /**
     * Every variant of one make, with the Felgen of one size a customer may be shown for it.
     *
     * @return array{make: string, size: string, covered: int, total: int, rows: list<array{id: int, vehicle: string, period: string, keys: string, wheels: int, documents: int}>}
     */
    private function variants(string $make, float $size): array
    {
        $approved = Fitment::query()
            ->visibleToCustomers()
            ->join('wheel_configs as wc', 'wc.id', '=', 'fitments.wheel_config_id')
            ->where('wc.diameter_in', $size)
            ->groupBy('fitments.vehicle_id')
            ->selectRaw('fitments.vehicle_id, COUNT(DISTINCT fitments.wheel_config_id) as wheels, COUNT(DISTINCT fitments.approval_document_id) as documents')
            ->toBase()
            ->get()
            ->keyBy('vehicle_id');

        $vehicles = DB::table('vehicles')
            ->whereNull('deleted_at')
            ->where('make', $make)
            ->orderBy('model')
            ->orderBy('variant')
            ->get(['id', 'make', 'model', 'variant', 'hsn', 'tsn', 'build_from', 'build_to']);

        $rows = [];

        foreach ($vehicles as $vehicle) {
            $hit = $approved->get($vehicle->id);
            $from = $vehicle->build_from === null ? null : CarbonImmutable::parse((string) $vehicle->build_from);
            $to = $vehicle->build_to === null ? null : CarbonImmutable::parse((string) $vehicle->build_to);

            $rows[] = [
                'id' => (int) $vehicle->id,
                // Some variants carry their model already („X3 M40i“): the model is not said twice.
                'vehicle' => str_starts_with((string) $vehicle->variant, (string) $vehicle->model)
                    ? (string) $vehicle->variant
                    : trim("{$vehicle->model} {$vehicle->variant}"),
                'period' => GermanFormat::buildPeriod($from, $to),
                'keys' => GermanFormat::keyNumbers((string) $vehicle->hsn, (string) $vehicle->tsn),
                'wheels' => $hit === null ? 0 : (int) $hit->wheels,
                'documents' => $hit === null ? 0 : (int) $hit->documents,
            ];
        }

        // The uncovered first: they are what this list is opened for.
        usort($rows, static fn (array $a, array $b): int => [$a['wheels'] > 0, $a['vehicle']] <=> [$b['wheels'] > 0, $b['vehicle']]);

        return [
            'make' => $make,
            'size' => GermanFormat::trimmedDecimal($size, 1),
            'covered' => count(array_filter($rows, static fn (array $r): bool => $r['wheels'] > 0)),
            'total' => count($rows),
            'rows' => $rows,
        ];
    }
}
