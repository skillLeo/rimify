<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\VehicleTreeRequest;
use App\Services\Storefront\VehicleTree;
use Illuminate\Http\JsonResponse;

/**
 * The two lower steps of the vehicle tree, for comboboxes that fill as the customer chooses. The
 * makes ship with the page; models and variants are asked for on demand.
 */
class VehicleTreeController extends Controller
{
    public function __construct(private readonly VehicleTree $tree) {}

    public function models(VehicleTreeRequest $request): JsonResponse
    {
        return response()->json(['models' => $this->tree->models($request->make())]);
    }

    public function variants(VehicleTreeRequest $request): JsonResponse
    {
        if ($request->model() === '') {
            return response()->json(['message' => 'Das Modell fehlt.', 'errors' => ['modell' => ['Bitte wähle ein Modell.']]], 422);
        }

        return response()->json(['variants' => $this->tree->variants($request->make(), $request->model())]);
    }
}
