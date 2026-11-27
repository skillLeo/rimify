<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\VehicleSource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\VehicleFromDocumentRequest;
use App\Models\ApprovalDocument;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use App\Support\VehicleName;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * „Fahrzeug aus diesem Gutachten anlegen“ (Block C, item 7): a car stored exactly as the document names it,
 * with `source = gutachten`, the document and the page. No HSN, no TSN and no axle loads or top speed —
 * none of them is in a Gutachten — so the car comes „zur Prüfung“ (R-03): its wheel answer rests on the
 * document, its tyre answer waits for the customer's papers or a vehicle dataset. One Protokoll entry.
 */
class GutachtenFahrzeugController extends Controller
{
    public function store(VehicleFromDocumentRequest $request, ApprovalDocument $document): JsonResponse
    {
        $car = $request->car();
        $admin = $request->admin();
        // A number in another form joins nothing by itself (D-521): the record says the person chose to store it so.
        $euForm = $request->euForm();

        $vehicle = DB::transaction(static function () use ($car, $document, $admin, $euForm): Vehicle {
            $vehicle = Vehicle::query()->create([
                ...$car,
                'source' => VehicleSource::Gutachten->value,
                'source_document_id' => $document->id,
                'source_vehicle_id' => null,
                'hsn' => null,
                'tsn' => null,
                'axle_load_front_kg' => null,
                'axle_load_rear_kg' => null,
                'max_speed_kmh' => null,
                'needs_review' => true,
                // What was typed, as typed: the record of where this car came from.
                'raw' => ['gutachten' => ['document' => FitmentRows::label($document), 'page' => $car['source_page'], 'typed' => $car, 'eu_form' => $euForm]],
            ]);

            AuditTrail::record($admin, 'vehicle.created_from_document', [
                'vehicle' => VehicleName::from($vehicle),
                'document' => FitmentRows::label($document),
                'page' => $car['source_page'],
                'eg' => $car['eg_nummer_raw'],
                'eu_form' => $euForm,
            ], $vehicle);

            return $vehicle;
        });

        return response()->json([
            'id' => (int) $vehicle->id,
            'label' => GutachtenController::vehicleLabel($vehicle),
            'window' => $vehicle->periodLabel(),
            'needsReview' => true,
        ], 201);
    }
}
