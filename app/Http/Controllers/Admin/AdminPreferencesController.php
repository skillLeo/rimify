<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminPreferencesRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;

/**
 * Remembers how one person likes the panel laid out.
 *
 * The rail's toggle has already moved the rail in the browser before this answers; this only makes
 * the choice survive the next page load, on the server, so it is right in the first frame instead
 * of snapping after hydration (docs/design/sections/admin-shell.md §5.9). A failed write costs a
 * preference, never a page — which is why nothing here is worth an audit entry or a toast.
 */
class AdminPreferencesController extends Controller
{
    /**
     * The rail saves with a plain background request (JSON) and gets an empty answer: nothing on the
     * page is re-rendered by a preference, so a quick double-click cannot make the rail flip back and
     * forth as late answers arrive. A form post still gets the usual redirect.
     */
    public function update(AdminPreferencesRequest $request): RedirectResponse|Response
    {
        $admin = $request->admin();

        // Merged, not replaced: the column will hold other choices too, and setting one must never
        // quietly reset the rest.
        $preferences = is_array($admin->preferences) ? $admin->preferences : [];
        $preferences['rail'] = $request->rail();

        $admin->forceFill(['preferences' => $preferences])->save();

        return $request->expectsJson() && ! $request->header('X-Inertia') ? response()->noContent() : back();
    }
}
