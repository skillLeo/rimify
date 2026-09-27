<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SavedViewDestroyRequest;
use App\Http\Requests\Admin\SavedViewRules;
use App\Http\Requests\Admin\SavedViewStoreRequest;
use App\Http\Requests\Admin\SavedViewUpdateRequest;
use App\Models\SavedView;
use App\Services\Admin\Lists\AdminLists;
use App\Services\Admin\Lists\ListViews;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Gespeicherte Ansichten (docs/admin/rest-build-plan.md, step 2.2): save the filters on screen under
 * a name, change or share a view, delete it and take the deletion back. Every write is authorised
 * by its Form Request through SavedViewPolicy (R-11).
 *
 * A view is a note about how one looks at a list, not a record of the shop: it goes to nobody's
 * Protokoll, and deleting it keeps it restorable (soft delete) for the „Rückgängig“ on the page.
 */
class SavedViewsController extends Controller
{
    public function store(SavedViewStoreRequest $request): RedirectResponse
    {
        $view = SavedView::query()->create([
            'admin_user_id' => $request->admin()->id,
            'list' => $request->list(),
            'name' => $request->name(),
            'query' => $request->viewQuery(),
            'role_id' => $request->roleId(),
        ]);

        return redirect()->to(self::href($view))->with('toast', "Ansicht „{$view->name}“ gespeichert.");
    }

    public function update(SavedViewUpdateRequest $request, SavedView $view): RedirectResponse
    {
        $changes = [];

        if ($request->has('name')) {
            $changes['name'] = $request->name();
        }

        if ($request->has('query')) {
            $changes['query'] = $request->viewQuery();
        }

        if ($request->has('role_id')) {
            $changes['role_id'] = $request->roleId();
        }

        $view->forceFill($changes)->save();

        $toast = match (true) {
            $request->has('query') => "Änderungen in „{$view->name}“ gespeichert.",
            $request->has('role_id') && $view->role_id !== null => "Ansicht „{$view->name}“ mit der Rolle „".self::roleLabel($view).'“ geteilt.',
            $request->has('role_id') => "Ansicht „{$view->name}“ ist nicht mehr geteilt.",
            default => "Ansicht in „{$view->name}“ umbenannt.",
        };

        // Saved over with the filters on screen: the page opens the view as it now is.
        return ($request->has('query') ? redirect()->to(self::href($view)) : back())->with('toast', $toast);
    }

    /** Deleted, not destroyed: the page offers „Rückgängig“ in its toast. */
    public function destroy(SavedViewDestroyRequest $request, SavedView $view): RedirectResponse
    {
        $view->delete();

        return back();
    }

    /**
     * „Rückgängig“: the view back — under a free name if its own was taken meanwhile, and not past
     * the limit of views per list.
     */
    public function restore(SavedViewDestroyRequest $request, SavedView $view): RedirectResponse
    {
        $owner = $view->owner;

        if ($owner === null) {
            abort(404);
        }

        if (SavedView::query()->where('admin_user_id', $owner->id)->where('list', $view->list)->count() >= SavedView::MAX_PER_LIST) {
            return back()->with('toast', "„{$view->name}“ lässt sich nicht zurückholen. Du hast schon ".SavedView::MAX_PER_LIST.' Ansichten für diese Liste.');
        }

        $was = $view->name;

        for ($n = 2; SavedViewRules::nameTaken($owner, $view->list, $view->name, $view); $n++) {
            $view->name = mb_substr($was, 0, 60 - strlen(" ({$n})"))." ({$n})";
        }

        $view->restore();

        // Renamed on the way back: said, so nobody wonders why the tab reads differently.
        return back()->with('toast', $view->name === $was ? "Ansicht „{$was}“ ist wieder da." : "Ansicht „{$was}“ ist wieder da, jetzt als „{$view->name}“.");
    }

    /** The role a view is shared with, as the team reads it (its German label, else its name). */
    private static function roleLabel(SavedView $view): string
    {
        $role = DB::table('roles')->where('id', $view->role_id)->first(['name', 'label_de']);

        if ($role === null) {
            return '';
        }

        return is_string($role->label_de) && $role->label_de !== '' ? $role->label_de : (string) $role->name;
    }

    private static function href(SavedView $view): string
    {
        $spec = AdminLists::get($view->list);

        return ListViews::href($spec['path'] ?? '/admin', $view->query, $view->id);
    }
}
