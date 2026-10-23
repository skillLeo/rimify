<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\NachfrageMarkRequest;
use App\Http\Requests\Admin\NachfrageRequest;
use App\Models\AdminUser;
use App\Models\Brand;
use App\Models\DemandMark;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Dashboard\Demand;
use App\Services\Admin\Lists\ListPaging;
use Illuminate\Http\RedirectResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Übersicht › Nachfrage — the Nachfrage-Lücken at full length (docs/admin/rest-build-plan.md,
 * „Übersicht und Shell“ step F): every car customers asked for in the Zeitraum that the shop has no
 * approved wheel for, ranked by demand, with what the team has done about each.
 *
 * Two answers to a gap are recorded, each in the Protokoll: „beobachtet“ (seen, nothing to do yet)
 * and „angefordert“ (a wheel brand was asked for the Gutachten — the page prepares that e-mail).
 */
class NachfrageController extends Controller
{
    private const TOASTS = [
        DemandMark::WATCHED => 'Als beobachtet markiert.',
        DemandMark::REQUESTED => 'Als angefordert markiert.',
    ];

    public function index(NachfrageRequest $request, Demand $demand): Response
    {
        $admin = $request->admin();
        ['period' => $period] = $request->choice();
        $state = $request->state();
        $canMark = $admin->canQuietly('mark', DemandMark::class);

        // Ranked over every gap, then shown fifty at a time: 1.116 rows on one page took seconds to draw (the admin
        // audit's F-04, F-31). The pages keep the period, the state and the search.
        $ranked = $demand->ranked($period, $state, $admin->name);
        // Each gap keeps its place in the whole ranking, on any page and in any search (F-41).
        $ranked['rows'] = array_map(static fn (array $gap, int $i): array => $gap + ['rank' => $i + 1], $ranked['rows'], array_keys($ranked['rows']));
        $search = $request->search();

        // By its car or its key numbers — what the row shows (F-31). The chips keep counting every gap of the Zeitraum.
        if ($search !== '') {
            $needle = mb_strtolower($search);
            $ranked['rows'] = array_values(array_filter($ranked['rows'], static fn (array $gap): bool => str_contains(mb_strtolower($gap['title'].' '.$gap['detail']), $needle)));
        }

        $current = ListPaging::requested($request->query('seite'));
        $page = new LengthAwarePaginator(array_slice($ranked['rows'], ($current - 1) * ListPaging::PER_PAGE, ListPaging::PER_PAGE), count($ranked['rows']), ListPaging::PER_PAGE, $current);
        $ranked['rows'] = $page->items();

        return Inertia::render('Admin/Nachfrage/Index', [
            'period' => [...$period->toArray(), 'compare' => false],
            'state' => $state,
            'search' => $search,
            'demand' => $ranked,
            'pagination' => ListPaging::props($page, '/admin/nachfrage', [
                'zeitraum' => $period->key,
                'von' => $period->key === 'eigen' ? $period->from->format('Y-m-d') : null,
                'bis' => $period->key === 'eigen' ? $period->to->format('Y-m-d') : null,
                'stand' => $state === 'offen' ? null : $state,
                'q' => $search === '' ? null : $search,
            ]),
            'searches' => $demand->searches($period),
            'weighting' => [
                'halfLife' => Demand::HALF_LIFE_DAYS,
                'waiting' => Demand::WAITING_WEIGHT,
            ],
            // The wheel brands a Gutachten could be asked of, only for who may record that it was.
            'brands' => $canMark
                ? Brand::query()->where('is_wheel_brand', true)->orderBy('name')->get(['id', 'name'])->map(static fn (Brand $b): array => ['id' => $b->id, 'name' => $b->name])->all()
                : [],
            'can' => ['mark' => $canMark],
        ]);
    }

    public function mark(NachfrageMarkRequest $request): RedirectResponse
    {
        $admin = $this->admin($request);
        $key = $request->key();
        $state = (string) $request->validated('state');
        $brandId = $request->validated('brand_id');

        $mark = DemandMark::query()->updateOrCreate(['gap_key' => $key], [
            'state' => $state,
            'brand_id' => $state === DemandMark::REQUESTED && $brandId !== null ? (int) $brandId : null,
            'admin_user_id' => $admin->id,
            'marked_at' => now(),
        ]);

        AuditTrail::record($admin, 'demand.marked', [
            'gap' => Demand::titleFor($key),
            'state' => $state,
            'brand' => $mark->brand?->name,
        ], $mark);

        return back()->with('toast', self::TOASTS[$state]);
    }

    public function unmark(NachfrageMarkRequest $request): RedirectResponse
    {
        $admin = $this->admin($request);
        $key = $request->key();

        if (DemandMark::query()->where('gap_key', $key)->delete() > 0) {
            AuditTrail::record($admin, 'demand.unmarked', ['gap' => Demand::titleFor($key)]);
        }

        return back()->with('toast', 'Markierung aufgehoben. Die Lücke ist wieder offen.');
    }

    private function admin(NachfrageMarkRequest $request): AdminUser
    {
        $user = $request->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }
}
