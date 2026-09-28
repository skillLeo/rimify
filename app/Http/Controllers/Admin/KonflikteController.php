<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domain\Fitment\Data\ConflictDecision;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\KonfliktDecisionRequest;
use App\Models\AdminUser;
use App\Models\FitmentConflict;
use App\Services\Admin\Approvals\ConflictDecisions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gutachten › Konflikte (the corrections memo §3): every car and wheel two current documents disagree
 * about, both sides as the documents say them, and the decision a person takes — the shop answers
 * „Unbekannt“ there until then. Reading asks the Gutachten view right (the route); deciding asks
 * FitmentConflictPolicy::decide through its Form Request (R-11).
 */
class KonflikteController extends Controller
{
    public function __construct(private readonly ConflictDecisions $conflicts) {}

    public function index(Request $request): Response
    {
        $admin = $request->user('admin');

        return Inertia::render('Admin/Konflikte/Index', [
            'open' => $this->conflicts->open(),
            'decided' => $this->conflicts->decided(),
            'can' => ['decide' => $admin instanceof AdminUser && $admin->can('decide', FitmentConflict::class)],
        ]);
    }

    /** The alert's link: the list, at the conflict's car and wheel. */
    public function show(FitmentConflict $conflict): RedirectResponse
    {
        return redirect('/admin/konflikte#konflikt-'.$conflict->getAttribute('vehicle_id').'-'.$conflict->getAttribute('wheel_config_id'));
    }

    public function decide(KonfliktDecisionRequest $request): RedirectResponse
    {
        $mode = (string) $request->validated('mode');

        $this->conflicts->decide(
            (int) $request->validated('vehicle_id'),
            (int) $request->validated('wheel_config_id'),
            $mode,
            $mode === ConflictDecision::ONLY ? (int) $request->validated('document_id') : null,
            trim((string) $request->validated('reason')),
            $request->admin(),
        );

        return back()->with('toast', $mode === ConflictDecision::ONLY
            ? 'Entschieden: Für diese Kombination gilt jetzt nur das gewählte Gutachten.'
            : 'Entschieden: Beide Gutachten gelten; der Shop nennt beide.');
    }
}
