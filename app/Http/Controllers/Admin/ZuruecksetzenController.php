<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TestResetRequest;
use App\Http\Requests\Admin\TestResetUndoRequest;
use App\Http\Requests\Admin\TestResetViewRequest;
use App\Services\Reset\ResetRefused;
use App\Services\Reset\TestReset;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Einstellungen › System › Testumgebung zurücksetzen (TestReset): the three levels with what each would take, counted
 * now; the reset after the word is typed; and the last reset, with „rückgängig machen“ for seven days. Only in a test
 * environment — in production the routes are not even registered (routes/web.php, rimify:preflight).
 */
class ZuruecksetzenController extends Controller
{
    public function show(TestResetViewRequest $request, TestReset $reset): Response
    {
        return Inertia::render('Admin/System/Zuruecksetzen', [
            'levels' => $reset->preview(),
            'last' => $reset->last(),
            'word' => TestReset::WORD,
            'keepDays' => TestReset::KEEP_DAYS,
        ]);
    }

    public function store(TestResetRequest $request, TestReset $reset): RedirectResponse
    {
        try {
            $result = $reset->reset($request->level(), $request->admin());
        } catch (ResetRefused $refused) {
            return back()->with('toast', $refused->getMessage());
        }

        // Figure and noun on one line (R-10).
        $what = array_map(static fn (array $c): string => GermanFormat::integer($c['count'])."\u{00A0}".$c['label'], $result['counts']);

        return redirect()->route('admin.zuruecksetzen.show')->with('toast', 'Testumgebung zurückgesetzt („'.$result['level']->label().'“). '
            .($what === [] ? 'Es war nichts zu entfernen.' : 'Entfernt: '.implode(', ', $what).'.'));
    }

    public function undo(TestResetUndoRequest $request, TestReset $reset): RedirectResponse
    {
        try {
            $result = $reset->undo($request->admin());
        } catch (ResetRefused $refused) {
            return back()->with('toast', $refused->getMessage());
        }

        return redirect()->route('admin.zuruecksetzen.show')->with('toast', 'Rückgängig gemacht: Der Stand vor dem Zurücksetzen („'.$result['level']->label().'“) ist wieder da.');
    }
}
