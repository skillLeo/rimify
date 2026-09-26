<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Admin\AdminErrorPage;
use App\Services\Admin\AuditTrail;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

/**
 * The permission an admin route needs, written on the route itself:
 *
 *     Route::get('/gutachten', …)->middleware(EnsureAdminMay::class.':approvals,view');
 *
 * The rail already leaves out what a role may not open, but hiding a link is presentation, never
 * enforcement (R-11): a pasted URL, a bookmark or a role changed mid-session must meet a refusal on
 * the server. Controllers and Form Requests still check their own writes; this is the floor under
 * every page, so a list that forgot its check cannot hand customer data to the wrong role.
 *
 * A refusal is evidence and is recorded, the same entry the Gate writes for a denied policy.
 */
final class EnsureAdminMay
{
    public function handle(Request $request, Closure $next, string $module, string $action = 'view'): Response
    {
        $user = $request->user('admin');

        // Unknown names fail closed: a typo in a route definition must refuse, never allow.
        $case = PermissionModule::tryFrom($module);
        $verb = PermissionAction::tryFrom($action);

        if (! $user instanceof AdminUser || $case === null || $verb === null) {
            abort(403);
        }

        if (! $user->may($case, $verb)) {
            AuditTrail::record($user, 'permission.denied', [
                'ability' => $case->value.'.'.$verb->value,
                'route' => Route::currentRouteName(),
            ]);

            // So the refusal can name the area, the same word the Rollen & Rechte grid uses.
            $request->attributes->set(AdminErrorPage::DENIED_AREA, $case->labelDe());

            abort(403);
        }

        return $next($request);
    }
}
