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
    /** How long „Später erinnern“ keeps the banner away. */
    public const SNOOZE_HOURS = 8;

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

        if ($request->rail() !== null) {
            $preferences['rail'] = $request->rail();
        }

        // The rail's width, as the handle left it: written at most once a second while dragging and
        // once more when the pointer lets go (AdminRailHandle).
        if ($request->width() !== null) {
            $preferences['railWidth'] = $request->width();
        }

        // „Später erinnern“: the banner about this problem stays away for 8 hours — a reminder, not a
        // dismissal. The rail's line keeps showing it all the while (HandleInertiaRequests::health).
        if ($request->snooze() !== null) {
            $preferences['healthSnooze'] = ['key' => $request->snooze(), 'until' => now()->addHours(self::SNOOZE_HOURS)->toIso8601String()];
        }

        $admin->forceFill(['preferences' => $preferences])->save();

        return $request->expectsJson() && ! $request->header('X-Inertia') ? response()->noContent() : back();
    }
}
