<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\ErrorPreviewRequest;
use App\Services\Storefront\Chrome;
use Symfony\Component\HttpFoundation\Response;

/**
 * `/__fehlerseite/{status}` (D-243): an error page as a visitor meets it, opened on purpose — in a test environment only. The
 * status is raised like any other failure, so the page is the one the exception handler builds (ErrorPage); with
 * `?eigenstaendig=1` the 500 is the standalone page a failed boot gets, which needs neither the bundle nor the database.
 */
final class FehlerVorschauController extends Controller
{
    public function __invoke(ErrorPreviewRequest $request): Response
    {
        if ($request->standalone() && $request->status() === 500) {
            return response()->view('errors.500', ['status' => 500, 'retryAfter' => null, 'contact' => Chrome::contact()], 500);
        }

        abort($request->status());
    }
}
