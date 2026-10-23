<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\Lists\ListPaging;
use App\Support\GermanFormat;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Verkauf › Anfragen — the „Sag mir Bescheid“ subscriptions: who is waiting for a document that names their vehicle (F2), and which
 * vehicles are asked for most. The ranking is the point: it orders the Gutachten worth buying by
 * real demand.
 *
 * "Waiting" means one thing everywhere — confirmed, still subscribed, not yet told — so the ranking,
 * the page's own figure and the count on the rail can never disagree.
 */
class AnfragenController extends Controller
{
    /** The most asked-for vehicles the ranking shows; every request stands in the list below it. */
    public const DEMAND_SHOWN = 20;

    public function index(Request $request): Response
    {
        $query = DB::table('fitment_subscriptions as s')
            ->join('vehicles as v', 'v.id', '=', 's.vehicle_id')
            ->orderByDesc('s.created_at')
            ->orderByDesc('s.id');

        // By the address, the car, or its key numbers as the papers print them (`0005/ZZ8`, `0005 ZZ8`).
        $search = is_string($request->query('q')) ? mb_substr(trim((string) $request->query('q')), 0, 100) : '';

        if ($search !== '') {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $keys = preg_match('/^(\d{4})\s*[\/\s-]?\s*([A-Za-z0-9]{3})?$/', $search, $m) === 1 ? $m : null;
            $query->where(static function ($where) use ($like, $keys): void {
                $where->where('s.email', 'like', $like)->orWhere('v.make', 'like', $like)->orWhere('v.model', 'like', $like)->orWhere('v.variant', 'like', $like);

                if ($keys !== null) {
                    $where->orWhere(static fn ($q) => $q->where('v.hsn', $keys[1])->when(($keys[2] ?? '') !== '', static fn ($q) => $q->where('v.tsn', strtoupper($keys[2]))));
                }
            });
        }

        // Every subscription reachable, page by page — the list once stopped at the newest 200 (the admin audit's F-26).
        $page = $query->paginate(ListPaging::PER_PAGE, [
            's.id', 's.email', 's.confirmed_at', 's.unsubscribed_at', 's.notified_at', 's.created_at',
            'v.make', 'v.model', 'v.variant', 'v.hsn', 'v.tsn',
        ], 'seite', ListPaging::requested($request->query('seite')));

        $subscriptions = [];

        foreach ($page->items() as $row) {
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
            ->limit(self::DEMAND_SHOWN)
            ->get(['v.make', 'v.model', 'v.variant', 'v.hsn', 'v.tsn', DB::raw('COUNT(*) as waiting')]);

        return Inertia::render('Admin/Anfragen/Index', [
            'summary' => [
                'waiting' => $this->waiting()->count(),
                // The ranking shows the DEMAND_SHOWN most asked-for; the page says of how many (the sweep after F-26).
                'vehicles' => $this->waiting()->distinct()->count('s.vehicle_id'),
                'total' => DB::table('fitment_subscriptions')->count(),
                'found' => $page->total(),
            ],
            'search' => $search,
            'pagination' => ListPaging::props($page, '/admin/anfragen', ['q' => $search]),
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
