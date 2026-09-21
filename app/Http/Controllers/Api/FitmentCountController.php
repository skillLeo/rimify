<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\FitmentCountRequest;
use App\Services\Storefront\FitmentCount;
use Illuminate\Http\JsonResponse;

/**
 * F1 — the live count under the vehicle selector. Read-only; nothing here writes the vehicle
 * cookie, because counting is not choosing.
 */
class FitmentCountController extends Controller
{
    public function __construct(
        private readonly FitmentCount $count,
        private readonly VehicleResolver $resolver,
    ) {}

    public function __invoke(FitmentCountRequest $request): JsonResponse
    {
        $vehicleId = $request->vehicleId();

        if ($vehicleId !== null) {
            $vehicle = $this->resolver->find($vehicleId);

            if ($vehicle === null) {
                return response()->json([
                    'count' => 0, 'permitted' => 0, 'conditional' => 0, 'vehicle' => null, 'ambiguous' => [],
                ]);
            }

            return response()->json($this->count->forVehicle($vehicle));
        }

        return response()->json($this->count->byKeyNumbers($request->hsn(), $request->tsn()));
    }
}
