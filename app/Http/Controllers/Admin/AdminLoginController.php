<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Anmelden.
 *
 * The four states — error, lockout, loading, 2FA — are designed rather than defaulted, because a
 * login screen is the first thing the client's own team sees every morning, and a browser-default
 * validation bubble is the cheapest possible way to look unfinished.
 *
 * Authentication itself lands in V3; this phase gets the screen rendering.
 */
class AdminLoginController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Anmelden/Index', [
            // Which state to show. Driven by the session in V3; here it is the resting state.
            'stage' => 'credentials',
        ]);
    }
}
