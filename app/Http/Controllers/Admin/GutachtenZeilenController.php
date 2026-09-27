<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApprovalStepRequest;
use App\Http\Requests\Admin\FitmentRowsRequest;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Admin\Approvals\FitmentRows;
use App\Support\GermanFormat;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

/**
 * Gutachten › one document › its Verwendungsbereich: rows added for every vehicle × size chosen,
 * changed one at a time, taken out while the document is a draft — and the two searches the form
 * finds vehicles and sizes with. Parameter binding only (R-14).
 */
class GutachtenZeilenController extends Controller
{
    /** The most a search answers with: a list longer than this is a question to narrow. */
    public const SEARCH_LIMIT = 40;

    /** Sizes listed at most before anything narrows them. */
    public const SIZE_LIMIT = 200;

    public function store(FitmentRowsRequest $request, ApprovalDocument $document, FitmentRows $rows): RedirectResponse
    {
        $result = $rows->add($document, $request->vehicleIds(), $request->configIds(), $request->spec(), $request->admin());
        $created = $result['created'];
        $skipped = $result['skipped'];
        $toast = match (true) {
            $created === 0 && $skipped === 1 => 'Keine neue Zeile: Diese Zeile gab es schon; sie bleibt, wie sie war.',
            $created === 0 => 'Keine neue Zeile: Alle '.GermanFormat::integer($skipped).' gab es schon; sie bleiben, wie sie waren.',
            default => ($created === 1 ? 'Eine Zeile' : GermanFormat::integer($created).' Zeilen').' angelegt.'
                .($skipped === 0 ? '' : ' '.($skipped === 1 ? 'Eine gab es schon; sie bleibt, wie sie war.' : GermanFormat::integer($skipped).' gab es schon; sie bleiben, wie sie waren.')),
        };

        return back()->with('toast', $toast);
    }

    public function update(FitmentRowsRequest $request, ApprovalDocument $document, Fitment $fitment, FitmentRows $rows): RedirectResponse
    {
        $rows->update($fitment, $request->spec(), $request->admin());

        return back()->with('toast', 'Zeile gespeichert.');
    }

    public function destroy(ApprovalStepRequest $request, ApprovalDocument $document, Fitment $fitment, FitmentRows $rows): RedirectResponse
    {
        $rows->delete($fitment, $request->admin());

        return back()->with('toast', 'Zeile entfernt.');
    }

    /** Vehicles by make, model, variant, type designation or HSN/TSN — `0005 BGU`, `0005/BGU`, `BMW 3er`. */
    public function vehicles(ApprovalStepRequest $request): JsonResponse
    {
        $term = $request->term();
        $query = Vehicle::query()->orderBy('make')->orderBy('model')->orderBy('variant')->orderBy('id');

        if ($term !== '') {
            if (preg_match('/^(\d{4})\s*[\/\s-]?\s*([A-Za-z0-9]{3})?$/', $term, $m) === 1) {
                $query->where('hsn', $m[1]);

                if (($m[2] ?? '') !== '') {
                    $query->where('tsn', strtoupper($m[2]));
                }
            } else {
                foreach (preg_split('/\s+/', $term) ?: [] as $word) {
                    $like = '%'.addcslashes($word, '%_\\').'%';
                    $query->where(static function (Builder $any) use ($like): void {
                        $any->where('make', 'like', $like)
                            ->orWhere('model', 'like', $like)
                            ->orWhere('variant', 'like', $like)
                            ->orWhere('type_designation', 'like', $like);
                    });
                }
            }
        }

        $vehicles = $query->limit(self::SEARCH_LIMIT + 1)->get();

        return response()->json([
            'items' => $vehicles->take(self::SEARCH_LIMIT)->map(static fn (Vehicle $v): array => [
                'id' => (int) $v->id,
                'label' => GutachtenController::vehicleLabel($v),
                'window' => GermanFormat::buildPeriod($v->build_from, $v->build_to),
                'needsReview' => $v->needs_review,
            ])->values()->all(),
            'more' => $vehicles->count() > self::SEARCH_LIMIT,
        ]);
    }

    /** Sizes of the catalogue by brand, model or SKU — grouped by model, so all of a model's sizes can be taken at once. */
    public function wheels(ApprovalStepRequest $request): JsonResponse
    {
        $term = $request->term();
        $query = WheelConfig::query()
            ->with(['wheelModel.brand', 'wheelFinish'])
            ->join('wheel_models', 'wheel_models.id', '=', 'wheel_configs.wheel_model_id')
            ->join('brands', 'brands.id', '=', 'wheel_models.brand_id')
            ->whereNull('wheel_models.deleted_at')
            ->select('wheel_configs.*')
            ->orderBy('brands.name')->orderBy('wheel_models.name')
            ->orderBy('wheel_configs.diameter_in')->orderBy('wheel_configs.width_in')->orderBy('wheel_configs.et_mm');

        foreach ($term === '' ? [] : (preg_split('/\s+/', $term) ?: []) as $word) {
            $like = '%'.addcslashes($word, '%_\\').'%';
            $query->where(static function ($any) use ($like): void {
                $any->where('brands.name', 'like', $like)
                    ->orWhere('wheel_models.name', 'like', $like)
                    ->orWhere('wheel_configs.sku', 'like', $like);
            });
        }

        $found = $query->limit(self::SIZE_LIMIT + 1)->get();
        $more = $found->count() > self::SIZE_LIMIT;
        $configs = $found->take(self::SIZE_LIMIT);
        $groups = [];

        foreach ($configs as $config) {
            $model = $config->wheelModel;
            $key = (int) $config->wheel_model_id;
            $groups[$key] ??= ['model' => GutachtenController::modelName($model), 'demo' => $model !== null && $model->is_demo, 'sizes' => []];
            $groups[$key]['sizes'][] = [
                'id' => (int) $config->id,
                'label' => $config->label(),
                'finish' => $config->wheelFinish?->name_de,
                'sku' => (string) $config->getAttribute('sku'),
            ];
        }

        $groups = array_values($groups);

        // The last model may go on past the cut: „alle“ would then promise sizes nobody saw.
        if ($more && $groups !== []) {
            $groups[count($groups) - 1]['partial'] = true;
        }

        return response()->json(['groups' => $groups, 'more' => $more]);
    }
}
