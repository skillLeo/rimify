<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\PlzRequest;
use App\Services\Storefront\PostalCodes;
use Illuminate\Http\JsonResponse;

/**
 * The places under a PLZ, for the checkout's Ort field (PostalCodes). Read-only and cacheable: the table changes
 * with a release, not with a request.
 */
class PlzController extends Controller
{
    public function __invoke(PlzRequest $request, PostalCodes $codes): JsonResponse
    {
        return response()
            ->json(['places' => $codes->places($request->plz())])
            ->setPublic()
            ->setMaxAge(86400);
    }
}
