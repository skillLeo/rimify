<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\WasFehltRequest;
use App\Services\GoLive\GoLiveCheck;
use App\Services\GoLive\GoLiveChecks;
use App\Services\GoLive\WasFehlt;
use App\Support\GermanFormat;
use Inertia\Inertia;
use Inertia\Response;

/**
 * System › Was fehlt — rimify:go-live-check in the admin (the operator's brief of 05.10.2026, §7): every check with who
 * closes it, its state, its sentence and the admin page or setting where it is closed; the client's own items first.
 * Read only. The check that asks the shop's own address over HTTP is left to the command: a page request does not wait
 * on a request to its own server.
 */
class WasFehltController extends Controller
{
    public function show(WasFehltRequest $request, GoLiveChecks $checks): Response
    {
        $all = $checks->all(network: false);

        return Inertia::render('Admin/System/WasFehlt', [
            'summary' => GoLiveChecks::countLine($all),
            'groups' => GoLiveChecks::GROUPS,
            'owners' => WasFehlt::OWNERS,
            'owner' => $request->owner(),
            'checks' => array_map(static fn (GoLiveCheck $c): array => $c->toArray(), $all),
            'checkedAt' => GermanFormat::dateTime(now()),
        ]);
    }
}
