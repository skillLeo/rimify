<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\GermanFormat;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Benachrichtigungswünsche — who is waiting for a document that names their vehicle (F2), and which
 * vehicles are asked for most. The ranking is the point: it orders the Gutachten worth buying by
 * real demand.
 *
 * "Waiting" means one thing everywhere — confirmed, still subscribed, not yet told — so the ranking,
 * the page's own figure and the count on the rail can never disagree.
 */
class BenachrichtigungenController extends Controller
{
    /** The newest this many; the page says so when there are more. */
    public const LIST_LIMIT = 200;

    public function index(Request $request): Response
    {
        $rows = DB::table('fitment_subscriptions as s')
            ->join('vehicles as v', 'v.id', '=', 's.vehicle_id')
            ->orderByDesc('s.created_at')
            ->limit(self::LIST_LIMIT)
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

        $demand = $this->waiting()
            ->join('vehicles as v', 'v.id', '=', 's.vehicle_id')
            ->groupBy('v.id', 'v.make', 'v.model', 'v.variant', 'v.hsn', 'v.tsn')
            ->orderByDesc(DB::raw('COUNT(*)'))
            ->limit(20)
            ->get(['v.make', 'v.model', 'v.variant', 'v.hsn', 'v.tsn', DB::raw('COUNT(*) as waiting')]);

        return Inertia::render('Admin/Benachrichtigungen/Index', [
            'summary' => [
                'waiting' => $this->waiting()->count(),
                'total' => DB::table('fitment_subscriptions')->count(),
                'limit' => self::LIST_LIMIT,
            ],
            'subscriptions' => $subscriptions,
            'demand' => $demand->map(static fn (object $row): array => [
                'vehicle' => trim($row->make.' '.$row->variant),
                'keyNumbers' => GermanFormat::keyNumbers((string) $row->hsn, (string) $row->tsn),
                'waiting' => (int) $row->waiting,
            ])->values()->all(),
        ]);
    }

    /** Confirmed, still subscribed, not yet told — the same rule as the rail's count. */
    private function waiting(): Builder
    {
        return DB::table('fitment_subscriptions as s')
            ->whereNotNull('s.confirmed_at')
            ->whereNull('s.unsubscribed_at')
            ->whereNull('s.notified_at');
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
