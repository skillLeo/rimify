<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\AdminUser;
use App\Services\Admin\Auth\TwoFactor;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The Super-Admin's second factor is required (D-514): signed in by password alone — an account set up before the
 * requirement, or one whose secret can no longer be read — the panel opens nothing but its setup, the password asked
 * again on the way there (EnsureSudo) and the way out.
 * Every other admin passes; for them it is offered in Profil.
 */
final class EnsureTwoFactorSetUp
{
    public const MESSAGE = 'Richte zuerst die Bestätigung in zwei Schritten ein.';

    public function __construct(private readonly TwoFactor $twoFactor) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('admin');

        if (! $user instanceof AdminUser || $request->routeIs('admin.zwei-faktor.*', 'admin.abmelden', 'admin.bestaetigen', 'admin.bestaetigen.store') || ! $this->twoFactor->mustSetUp($user)) {
            return $next($request);
        }

        // A fetch of the page's own (the bell's count, a list's rows) gets a plain answer; a page or a form, the setup.
        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['message' => self::MESSAGE], 409);
        }

        return redirect()->route('admin.zwei-faktor.einrichten', [], $request->isMethod('GET') ? 302 : 303);
    }
}
