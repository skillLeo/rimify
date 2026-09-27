<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DemoPurgeRequest;
use App\Services\Demo\DemoPurge;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;

/**
 * The rail's demo strip, „entfernen“: the demo set goes (DemoPurge — only rows born demo, one entry
 * in the Protokoll first, naming this person), and the page says how much went.
 */
class DemoDataController extends Controller
{
    public function destroy(DemoPurgeRequest $request, DemoPurge $purge): RedirectResponse
    {
        $admin = $request->admin();
        $removed = array_sum($purge->run($admin->name, $admin));

        return back()->with('toast', $removed === 0
            ? 'Es waren keine Demodaten mehr da.'
            : 'Demodaten entfernt: '.($removed === 1 ? 'ein Datensatz.' : GermanFormat::integer($removed).' Datensätze.'));
    }
}
