<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DemoPurgeRequest;
use App\Services\Demo\DemoPurge;
use App\Services\Demo\DemoPurgeRefused;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;

/**
 * The rail's demo strip, „entfernen“: the demo set goes (DemoPurge — only rows born demo and the example
 * catalogue, one entry in the Protokoll first, naming this person), and the page says how much went — or,
 * when something real still names the example catalogue, that nothing went and why.
 */
class DemoDataController extends Controller
{
    public function destroy(DemoPurgeRequest $request, DemoPurge $purge): RedirectResponse
    {
        $admin = $request->admin();

        try {
            $removed = array_sum($purge->run($admin->name, $admin));
        } catch (DemoPurgeRefused $refused) {
            return back()->with('toast', 'Nichts entfernt. '.$refused->reasons[0]);
        }

        return back()->with('toast', $removed === 0
            ? 'Es waren keine Demodaten mehr da.'
            : 'Demodaten entfernt: '.($removed === 1 ? 'ein Datensatz.' : GermanFormat::integer($removed).' Datensätze.'));
    }
}
