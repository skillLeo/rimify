<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SkizzeRequest;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The admin sketch of the Gutachten rework that is still to be built (the operator's brief of 01.11.2026, Phase 1): Katalog ›
 * Reifen with tyre models, photos and suppliers. It reads nothing and writes nothing: every value is the page's own example data. Registered only in a test
 * environment, never in the live shop (routes/web.php); who may open them is the route's (EnsureAdminMay).
 */
final class SkizzeController extends Controller
{
    public function reifen(SkizzeRequest $request): Response
    {
        return Inertia::render('Admin/Skizze/Reifen', [
            'modell' => $request->model(),
        ]);
    }
}
