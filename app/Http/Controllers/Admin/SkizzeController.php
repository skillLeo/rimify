<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SkizzeRequest;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The admin sketches of the Gutachten rework (the operator's brief of 01.11.2026, Phase 1): Gutachten › Neues Gutachten
 * in five steps, and Katalog › Reifen with tyre models, photos and suppliers — pages to click through before anything is
 * built. They read nothing and write nothing: every value is the page's own example data. Registered only in a test
 * environment, never in the live shop (routes/web.php); who may open them is the route's (EnsureAdminMay).
 */
final class SkizzeController extends Controller
{
    public function gutachten(SkizzeRequest $request): Response
    {
        return Inertia::render('Admin/Skizze/Gutachten', [
            'schritt' => $request->step(),
            'zeile' => $request->row(),
        ]);
    }

    public function reifen(SkizzeRequest $request): Response
    {
        return Inertia::render('Admin/Skizze/Reifen', [
            'modell' => $request->model(),
        ]);
    }
}
