<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApprovalStepRequest;
use App\Models\DocumentWheelSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Admin\Approvals\Entry\VehicleSearch;
use App\Support\GermanFormat;
use App\Support\VehicleName;
use Illuminate\Http\JsonResponse;

/**
 * What steps 2 and 3 of a Gutachten's entry search: wheels by brand, model, type or SKU, their sizes by dimension with the colours
 * beneath; and single cars by whatever staff know of them (VehicleSearch).
 */
class GutachtenSucheController extends Controller
{
    /** The cars one search shows; more are counted, and „Alle Treffer auswählen“ reaches them too. */
    public const CARS_SHOWN = 100;

    /** The sizes one search lists. */
    public const SIZES_SHOWN = 200;

    public function vehicles(ApprovalStepRequest $request, VehicleSearch $search): JsonResponse
    {
        $term = $request->term();

        if ($term === '') {
            return response()->json(['items' => [], 'total' => 0]);
        }

        ['cars' => $found, 'total' => $total] = $search->found($term, self::CARS_SHOWN);

        return response()->json([
            'items' => array_map(static fn (Vehicle $v): array => [
                'id' => (int) $v->id,
                'label' => VehicleName::from($v),
                'hsnTsn' => $v->hsn === null ? null : GermanFormat::keyNumbers($v->hsn, $v->tsn),
                'kw' => $v->getAttribute('power_kw'),
                'k' => $v->getAttribute('eg_nummer_raw'),
                'window' => GermanFormat::buildPeriod($v->build_from, $v->build_to),
                'needsReview' => $v->needs_review,
            ], $found),
            'total' => $total,
        ]);
    }

    public function wheels(ApprovalStepRequest $request): JsonResponse
    {
        $term = $request->term();
        $model = $request->query('modell');
        $query = WheelConfig::query()
            ->when(is_numeric($model), static fn ($q) => $q->where('wheel_configs.wheel_model_id', (int) $model))
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
                    ->orWhere('wheel_models.type_designation', 'like', $like)
                    ->orWhere('wheel_configs.sku', 'like', $like);
            });
        }

        $found = $query->limit(self::SIZES_SHOWN + 1)->get();
        $groups = [];

        foreach ($found->take(self::SIZES_SHOWN) as $config) {
            $model = $config->wheelModel;
            $key = (int) $config->wheel_model_id;
            $groups[$key] ??= ['modelId' => $key, 'model' => GutachtenController::modelName($model), 'wheelType' => $model?->getAttribute('type_designation'), 'demo' => $model !== null && $model->is_demo, 'sizes' => []];
            $dimension = implode('|', array_map(static fn (string $column): string => (string) $config->getAttribute($column), DocumentWheelSize::DIMENSION));
            $groups[$key]['sizes'][$dimension] ??= [
                'key' => DocumentWheelSize::keyOf($config->getAttributes()),
                'configId' => (int) $config->id,
                'diameter' => (float) $config->diameter_in,
                'short' => GermanFormat::trimmedDecimal($config->width_in).' × '.GermanFormat::trimmedDecimal($config->diameter_in, 1).' '.GermanFormat::offset($config->et_mm),
                'detail' => GermanFormat::boltPattern($config->bolt_holes, $config->bolt_circle_mm).' · Mittenlochbohrung '.GermanFormat::trimmedDecimal($config->centre_bore_mm, 2).' mm',
                'label' => GermanFormat::wheelLabel($config->width_in, $config->diameter_in, $config->et_mm, $config->bolt_holes, $config->bolt_circle_mm, $config->centre_bore_mm),
                'colours' => [],
            ];
            $groups[$key]['sizes'][$dimension]['colours'][] = ['name' => $config->wheelFinish?->name_de, 'hex' => $config->wheelFinish?->hex];
        }

        return response()->json([
            'groups' => array_values(array_map(static fn (array $group): array => [...$group, 'sizes' => array_values($group['sizes'])], $groups)),
            'more' => $found->count() > self::SIZES_SHOWN,
        ]);
    }
}
