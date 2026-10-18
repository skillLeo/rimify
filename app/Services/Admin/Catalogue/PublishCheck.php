<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Enums\ApprovalKind;
use App\Enums\FitmentStatus;
use App\Models\WheelModel;
use App\Policies\WheelModelPolicy;
use Illuminate\Support\Facades\DB;

/**
 * The Freigabe-Check: what stands between a Felge and the shop, read from its rows.
 *
 * Two kinds of finding. A **blocker** stops publishing: a demo model, no size, a size without a
 * price — a page that could sell nothing or sell at zero. A **hint** does not: a finish without a
 * photograph shows the outline drawing, and a size without an approval is simply never shown as
 * fitting any car (the storefront fails closed). The team may publish with hints, and sees them first.
 *
 * Per size it also names the approval documents that cover it — counted from published fitment rows,
 * never from a flag — so „Freigaben noch nicht hinterlegt“ is a fact about the data.
 */
final class PublishCheck
{
    /**
     * @return array{blockers: list<string>, hints: list<string>, sizes: array<int, list<array{id: int, label: string, fitments: int}>>}
     */
    public function for(WheelModel $model): array
    {
        $configs = $model->configs()->get(['id', 'price_cents', 'available', 'wheel_finish_id']);
        $finishes = $model->finishes()->get(['id', 'name_de', 'image_manifest']);
        $blockers = [];
        $hints = [];

        // The acceptance set's models are published by `rimify:demo --abnahme` itself, off production (AcceptanceSet).
        if ($model->refusedAsDemo()) {
            $blockers[] = WheelModelPolicy::DEMO_REFUSED;
        }

        if ($configs->isEmpty()) {
            $blockers[] = 'Es gibt noch keine Größe. Leg mindestens eine an.';
        }

        $unpriced = $configs->filter(static fn ($c): bool => (int) $c->price_cents <= 0)->count();

        if ($unpriced > 0) {
            $blockers[] = $unpriced === 1 ? 'Eine Größe hat keinen Preis.' : "{$unpriced} Größen haben keinen Preis.";
        }

        $sizes = $this->documents($configs->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all());
        $uncovered = $configs->filter(static fn ($c): bool => ! isset($sizes[(int) $c->id]))->count();

        if ($configs->isNotEmpty() && $uncovered === $configs->count()) {
            $hints[] = 'Freigaben noch nicht hinterlegt: Für keine Größe ist ein Gutachten freigegeben. Im Shop wird die Felge bei keinem Fahrzeug als passend gezeigt, bis ein Gutachten für sie freigegeben ist.';
        } elseif ($uncovered > 0) {
            $hints[] = "{$uncovered} von {$configs->count()} Größen haben noch keine Freigabe. Sie werden bei keinem Fahrzeug als passend gezeigt.";
        }

        foreach ($finishes as $finish) {
            $manifest = $finish->image_manifest;

            if (! is_array($manifest) || ($manifest['kind'] ?? null) === 'placeholder') {
                $hints[] = "Die Ausführung „{$finish->name_de}“ hat noch kein Produktfoto. Der Shop zeigt dafür die Umrisszeichnung.";
            }
        }

        // Available or not, never a count (his admin item 7, D-299).
        if ($configs->isNotEmpty() && $configs->every(static fn ($c): bool => ! (bool) $c->available)) {
            $hints[] = 'Keine Größe ist verfügbar. Im Shop steht dann bei jeder „Nicht verfügbar“, und sie lässt sich nicht kaufen.';
        }

        // Saved before it was required (D-298): no stop, but said — it belongs in the Felge's name.
        if (trim((string) $model->type_designation) === '') {
            $hints[] = 'Die Radtypenbezeichnung fehlt noch. Sie gehört in den Namen der Felge.';
        }

        if ($model->description_de === null || trim($model->description_de) === '') {
            $hints[] = 'Die Felge hat noch keine Beschreibung.';
        }

        return ['blockers' => $blockers, 'hints' => $hints, 'sizes' => $sizes];
    }

    /**
     * The approval documents that name each size in a published fitment row.
     *
     * @param  list<int>  $configIds
     * @return array<int, list<array{id: int, label: string, fitments: int}>>
     */
    public function documents(array $configIds): array
    {
        if ($configIds === []) {
            return [];
        }

        $rows = DB::table('fitments as f')
            ->join('approval_documents as d', 'd.id', '=', 'f.approval_document_id')
            ->whereIn('f.wheel_config_id', $configIds)
            ->where('f.status', FitmentStatus::Published->value)
            ->groupBy('f.wheel_config_id', 'd.id', 'd.kind', 'd.kba_number', 'd.report_number', 'd.approval_mark')
            ->orderBy('d.id')
            ->get(['f.wheel_config_id', 'd.id', 'd.kind', 'd.kba_number', 'd.report_number', 'd.approval_mark', DB::raw('COUNT(*) as n')]);

        $out = [];

        foreach ($rows as $row) {
            $number = $row->kba_number ?? $row->report_number ?? $row->approval_mark;
            $kind = ApprovalKind::tryFrom((string) $row->kind)?->labelDe() ?? (string) $row->kind;
            $out[(int) $row->wheel_config_id][] = [
                'id' => (int) $row->id,
                'label' => $kind.($number === null ? '' : ' '.$number),
                'fitments' => (int) $row->n,
            ];
        }

        return $out;
    }
}
