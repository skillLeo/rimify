<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SearchRequest;
use App\Services\Search\InstantSearch;
use Illuminate\Http\JsonResponse;

/** GET /api/v1/search?q= — the instant search behind the header field and the command palette. */
class SearchController extends Controller
{
    public function __construct(private readonly InstantSearch $search) {}

    public function __invoke(SearchRequest $request): JsonResponse
    {
        return response()->json($this->search->query($request->term()));
    }
}
