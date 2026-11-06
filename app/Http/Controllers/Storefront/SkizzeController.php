<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\SkizzeRequest;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The shop sketches of the Gutachten rework (the operator's brief of 01.11.2026, Phase 1): a product page whose every
 * version can be chosen, and the Komplettrad chosen step by step with tyre cards — pages to click through before
 * anything is built. They read nothing and write nothing: every value is the page's own example data, and nothing can
 * be put in the basket. Registered only in a test environment, never in the live shop (routes/web.php).
 */
final class SkizzeController extends Controller
{
    public function komplettraeder(SkizzeRequest $request): Response
    {
        return Inertia::render('Skizze/Komplettraeder', [
            'schritt' => $request->step(),
            'ausfuehrung' => $request->version(),
        ]);
    }
}
