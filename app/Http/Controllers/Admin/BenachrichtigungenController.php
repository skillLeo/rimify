<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\GermanFormat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Benachrichtigungen — who is waiting for a document that names their vehicle (F2), and which
 * vehicles are asked for most. The second list is the point: it ranks the Gutachten worth buying
 * by real demand.
 */
class BenachrichtigungenController extends Controller
{
    public function index(Request $request): Response
    {
        $rows = DB::table('fitment_subscriptions as s')
            ->join('vehicles as v', 'v.id', '=', 's.vehicle_id')
            ->orderByDesc('s.created_at')
            ->limit(200)
            ->get([
                's.id', 's.email', 's.confirmed_at', 's.unsubscribed_at', 's.notified_at', 's.created_at',
                'v.make', 'v.model', 'v.variant', 'v.hsn', 'v.tsn',
            ]);

        $subscriptions = [];

        foreach ($rows as $row) {
            $subscriptions[] = [
                'id' => (int) $row->id,
                'email' => (string) $row->email,
                'vehicle' => trim($row->make.' '.$row->variant),
                'keyNumbers' => GermanFormat::keyNumbers((string) $row->hsn, (string) $row->tsn),
                'status' => $this->status($row),
                'requestedAt' => GermanFormat::date(new \DateTimeImmutable((string) $row->created_at)),
                'notifiedAt' => $row->notified_at === null ? null : GermanFormat::date(new \DateTimeImmutable((string) $row->notified_at)),
            ];
        }

        $demand = DB::table('fitment_subscriptions as s')
            ->join('vehicles as v', 'v.id', '=', 's.vehicle_id')
            ->whereNotNull('s.confirmed_at')
            ->whereNull('s.unsubscribed_at')
            ->groupBy('v.id', 'v.make', 'v.model', 'v.variant', 'v.hsn', 'v.tsn')
            ->orderByDesc(DB::raw('COUNT(*)'))
            ->limit(20)
            ->get(['v.make', 'v.model', 'v.variant', 'v.hsn', 'v.tsn', DB::raw('COUNT(*) as waiting')]);

        return Inertia::render('Admin/Benachrichtigungen/Index', [
            'subscriptions' => $subscriptions,
            'demand' => $demand->map(static fn (object $row): array => [
                'vehicle' => trim($row->make.' '.$row->variant),
                'keyNumbers' => GermanFormat::keyNumbers((string) $row->hsn, (string) $row->tsn),
                'waiting' => (int) $row->waiting,
            ])->values()->all(),
        ]);
    }

    private function status(object $row): string
    {
        if ($row->unsubscribed_at !== null) {
            return 'Abgemeldet';
        }

        if ($row->confirmed_at === null) {
            return 'Unbestätigt';
        }

        return $row->notified_at === null ? 'Wartet' : 'Benachrichtigt';
    }
}
