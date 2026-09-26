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
use Illuminate\Http\RedirectResponse;
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
        $canMark = $admin->can('mark', DemandMark::class);

        return Inertia::render('Admin/Nachfrage/Index', [
            'period' => [...$period->toArray(), 'compare' => false],
            'state' => $state,
            'demand' => $demand->ranked($period, $state, $admin->name),
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
