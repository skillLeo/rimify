<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DemoPurgeRequest;
use App\Services\Admin\AuditTrail;
use App\Services\Demo\DemoPurge;
use App\Services\Demo\DemoPurgeRefused;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;

/**
 * The rail's strip, „Demodaten entfernen“: the demo set goes (DemoPurge — only rows born demo and the example
 * catalogue, one entry in the Protokoll first, naming this person), and the page says how much went — or, when
 * something real still names the example catalogue, that nothing went and why, and the Protokoll records the attempt.
 */
class DemoDataController extends Controller
{
    public function destroy(DemoPurgeRequest $request, DemoPurge $purge): RedirectResponse
    {
        $admin = $request->admin();

        try {
            $removed = array_sum($purge->run($admin->name, $admin));
        } catch (DemoPurgeRefused $refused) {
            AuditTrail::record($admin, 'demo.purge_refused', ['reasons' => $refused->reasons]);

            return back()->with('toast', 'Nichts entfernt. '.$refused->reasons[0]);
        }

        return back()->with('toast', $removed === 0
            ? 'Es waren keine Demodaten mehr da.'
            : 'Demodaten entfernt: '.($removed === 1 ? 'ein Datensatz.' : GermanFormat::integer($removed).' Datensätze.'));
    }
}
