<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ConditionCodeRequest;
use App\Models\ConditionCode;
use App\Services\Admin\AuditTrail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gutachten › Auflagen-Katalog: every Auflage once, as the full German sentence a customer reads
 * (R-15), with how heavy it is. A Gutachten's rows choose from here; a changed sentence changes
 * everywhere it is used — which is the point, and why the page says how often each is used.
 */
class AuflagenController extends Controller
{
    public function index(ConditionCodeRequest $request): Response
    {
        $used = DB::table('fitment_conditions')->select('condition_code_id')->selectRaw('COUNT(*) as n')->groupBy('condition_code_id')->pluck('n', 'condition_code_id');
        $admin = $request->admin();

        return Inertia::render('Admin/Auflagen/Index', [
            'codes' => ConditionCode::query()->orderBy('sort_order')->orderBy('id')->get()->map(static fn (ConditionCode $c): array => [
                'id' => (int) $c->id,
                'code' => $c->code,
                'severity' => $c->severity->value,
                'severityLabel' => ConditionCodeRequest::SEVERITY_LABELS[$c->severity->value],
                'text' => $c->text_de,
                'affectsTyreChoice' => $c->affects_tyre_choice,
                'requiresAcknowledgement' => $c->requires_acknowledgement,
                'used' => (int) ($used[$c->id] ?? 0),
            ])->values()->all(),
            'severities' => array_map(static fn (string $value, string $label): array => ['value' => $value, 'label' => $label], array_keys(ConditionCodeRequest::SEVERITY_LABELS), ConditionCodeRequest::SEVERITY_LABELS),
            'can' => [
                'create' => $admin->can('create', ConditionCode::class),
                'edit' => $admin->can('update', new ConditionCode),
            ],
        ]);
    }

    public function store(ConditionCodeRequest $request): RedirectResponse
    {
        $attributes = $request->codeAttributes();

        DB::transaction(function () use ($attributes, $request): void {
            $code = ConditionCode::query()->create($attributes + ['sort_order' => (int) ConditionCode::query()->max('sort_order') + 10]);
            AuditTrail::record($request->admin(), 'condition.created', ['code' => $code->code, 'text' => $code->text_de], $code);
        });

        return back()->with('toast', 'Auflage angelegt.');
    }

    public function update(ConditionCodeRequest $request, ConditionCode $code): RedirectResponse
    {
        $attributes = $request->codeAttributes();

        DB::transaction(function () use ($attributes, $request, $code): void {
            $before = $code->text_de;
            $code->fill($attributes)->save();
            AuditTrail::record($request->admin(), 'condition.updated', ['code' => $code->code, 'old_text' => $before, 'text' => $code->text_de], $code);
        });

        return back()->with('toast', 'Auflage gespeichert.');
    }

    public function destroy(ConditionCodeRequest $request, ConditionCode $code): RedirectResponse
    {
        DB::transaction(function () use ($request, $code): void {
            AuditTrail::record($request->admin(), 'condition.deleted', ['code' => $code->code, 'text' => $code->text_de]);
            $code->delete();
        });

        return back()->with('toast', 'Auflage gelöscht.');
    }
}
