<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Enums\CatalogueStatus;
use App\Http\Requests\Admin\WheelModelRequest;
use App\Models\AdminUser;
use App\Models\Brand;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Saves one Felge — master data, finishes, sizes — in one transaction, or nothing at all.
 *
 * A size an approval document names is compliance data (CLAUDE.md §1): its measurements decide which
 * cars it fits. So a size with fitment rows keeps its measurements and cannot be removed here; the
 * team is told why, under the row, and the whole save is refused rather than half made. Price, stock,
 * SKU and EAN stay free to change — they are not what a Gutachten approves.
 *
 * A save never publishes. A new model is a draft; a model in the shop stays there with its new values.
 *
 * @phpstan-import-type FinishInput from WheelModelRequest
 * @phpstan-import-type ConfigInput from WheelModelRequest
 */
final class WheelEditor
{
    /** The measurements an approval is about. */
    private const MEASUREMENTS = ['diameter_in', 'width_in', 'et_mm', 'bolt_holes', 'bolt_circle_mm', 'centre_bore_mm'];

    /**
     * @param  array{brand_id: int|null, brand_new: string|null, name: string, type_designation: string|null, spoke_count: int, description_de: string|null, seo_title: string|null, seo_description: string|null}  $attributes
     * @param  list<FinishInput>  $finishes
     * @param  list<ConfigInput>  $configs
     */
    public function save(?WheelModel $model, array $attributes, array $finishes, array $configs, AdminUser $admin): WheelModel
    {
        return DB::transaction(function () use ($model, $attributes, $finishes, $configs, $admin): WheelModel {
            $creating = $model === null;
            $brand = $this->brand($attributes['brand_id'], $attributes['brand_new']);
            $fields = [
                'brand_id' => $brand->id,
                'name' => $attributes['name'],
                'type_designation' => $attributes['type_designation'],
                'spoke_count' => $attributes['spoke_count'],
                'description_de' => $attributes['description_de'],
                'seo_title' => $attributes['seo_title'],
                'seo_description' => $attributes['seo_description'],
            ];

            if ($model === null) {
                $model = WheelModel::query()->create($fields + [
                    'slug' => self::slug($brand->name.' '.$attributes['name']),
                    'status' => CatalogueStatus::Draft->value,
                    'is_demo' => false,
                ]);
                $before = [];
            } else {
                $before = $model->only(array_keys($fields));
                $model->fill($fields)->save();
            }

            $finishIds = $this->finishes($model, $finishes);
            $counts = $this->configs($model, $configs, $finishIds);
            $this->dropUnusedFinishes($model, array_values($finishIds));
            $model->touch();

            AuditTrail::record($admin, $creating ? 'wheel.created' : 'wheel.updated', [
                'name' => $brand->name.' '.$model->name,
                'changed' => $creating ? [] : array_keys(array_filter($model->only(array_keys($fields)), static fn (mixed $v, string $k): bool => ($before[$k] ?? null) != $v, ARRAY_FILTER_USE_BOTH)),
                'sizes' => $counts,
            ], $model);

            return $model;
        });
    }

    private function brand(?int $id, ?string $new): Brand
    {
        if ($id !== null) {
            return Brand::query()->findOrFail($id);
        }

        $name = trim((string) $new);
        $existing = Brand::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->first();

        if ($existing instanceof Brand) {
            return $existing;
        }

        return Brand::query()->create([
            'name' => $name,
            'slug' => self::brandSlug($name),
            'is_wheel_brand' => true,
            'sort_order' => (int) Brand::query()->max('sort_order') + 10,
        ]);
    }

    /**
     * @param  list<FinishInput>  $finishes
     * @return array<string, int> the page's key for each finish => its id
     */
    private function finishes(WheelModel $model, array $finishes): array
    {
        $own = $model->finishes()->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all();
        $ids = [];

        foreach ($finishes as $sort => $finish) {
            $values = ['name_de' => $finish['name'], 'hex' => $finish['hex'], 'art_finish' => $finish['art_finish'], 'sort_order' => ($sort + 1) * 10];

            if ($finish['id'] !== null) {
                if (! in_array($finish['id'], $own, true)) {
                    throw ValidationException::withMessages(["finishes.{$sort}.name" => 'Diese Ausführung gehört zu einer anderen Felge. Lad die Seite bitte neu.']);
                }

                WheelFinish::query()->whereKey($finish['id'])->update($values);
                $ids[$finish['key']] = $finish['id'];

                continue;
            }

            // A finish removed and added again under its old name comes back, rather than colliding
            // with its own soft-deleted row on the table's unique name.
            $trashed = WheelFinish::onlyTrashed()->where('wheel_model_id', $model->id)->where('name_de', $finish['name'])->first();

            if ($trashed instanceof WheelFinish) {
                $trashed->restore();
                $trashed->fill($values)->save();
                $ids[$finish['key']] = (int) $trashed->id;

                continue;
            }

            $ids[$finish['key']] = (int) WheelFinish::query()->create($values + ['wheel_model_id' => $model->id])->id;
        }

        return $ids;
    }

    /**
     * @param  list<ConfigInput>  $configs
     * @param  array<string, int>  $finishIds
     * @return array{added: int, changed: int, removed: int}
     */
    private function configs(WheelModel $model, array $configs, array $finishIds): array
    {
        /** @var Collection<int, WheelConfig> $existing */
        $existing = $model->configs()->get()->keyBy('id');
        $withFitments = DB::table('fitments')->whereIn('wheel_config_id', $existing->keys())->distinct()->pluck('wheel_config_id')
            ->map(static fn (mixed $id): int => (int) $id)->all();
        $kept = [];
        $counts = ['added' => 0, 'changed' => 0, 'removed' => 0];
        $errors = [];

        foreach ($configs as $i => $config) {
            $values = [
                'wheel_finish_id' => $finishIds[$config['finish']],
                'diameter_in' => $config['diameter_in'],
                'width_in' => $config['width_in'],
                'et_mm' => $config['et_mm'],
                'bolt_holes' => $config['bolt_holes'],
                'bolt_circle_mm' => $config['bolt_circle_mm'],
                'centre_bore_mm' => $config['centre_bore_mm'],
                'sku' => $config['sku'],
                'ean' => $config['ean'],
                'kba_number' => $config['kba_number'],
                'price_cents' => $config['price_cents'],
                'stock_qty' => $config['stock_qty'],
                'weight_g' => $config['weight_g'],
            ];

            if ($config['id'] === null) {
                // A size removed and added again — same SKU, or same measurements in the same finish —
                // comes back, rather than colliding with its own soft-deleted row on the unique keys.
                $trashed = WheelConfig::onlyTrashed()
                    ->where('wheel_model_id', $model->id)
                    ->where(static function ($same) use ($values): void {
                        $same->where('sku', $values['sku'])->orWhere(static function ($size) use ($values): void {
                            $size->where('wheel_finish_id', $values['wheel_finish_id'])
                                ->where('diameter_in', $values['diameter_in'])
                                ->where('width_in', $values['width_in'])
                                ->where('et_mm', $values['et_mm'])
                                ->where('bolt_circle_mm', $values['bolt_circle_mm']);
                        });
                    })
                    ->first();

                if ($trashed instanceof WheelConfig) {
                    $trashed->restore();
                    $trashed->fill($values)->save();
                } else {
                    WheelConfig::query()->create($values + ['wheel_model_id' => $model->id, 'currency' => 'EUR']);
                }

                $counts['added']++;

                continue;
            }

            $row = $existing->get($config['id']);

            if (! $row instanceof WheelConfig) {
                $errors["configs.{$i}.sku"] = 'Diese Größe gehört zu einer anderen Felge. Lad die Seite bitte neu.';

                continue;
            }

            $kept[] = (int) $row->id;

            if (in_array((int) $row->id, $withFitments, true) && ($this->measurementsChanged($row, $values) || (int) $row->wheel_finish_id !== $values['wheel_finish_id'])) {
                $errors["configs.{$i}.width"] = 'Diese Größe steht in einem Gutachten. Ihre Maße und ihre Ausführung bleiben, wie sie sind – leg für andere Maße eine neue Größe an.';

                continue;
            }

            $row->fill($values);

            if ($row->isDirty()) {
                $row->save();
                $counts['changed']++;
            }
        }

        foreach ($existing as $id => $row) {
            if (in_array((int) $id, $kept, true)) {
                continue;
            }

            if (in_array((int) $id, $withFitments, true)) {
                $errors['configs'] = 'Die Größe '.$row->label().' steht in einem Gutachten und kann nicht entfernt werden. Nimm sie zuerst im Gutachten zurück.';

                continue;
            }

            $row->delete();
            $counts['removed']++;
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $counts;
    }

    /** @param  array<string, mixed>  $values */
    private function measurementsChanged(WheelConfig $row, array $values): bool
    {
        foreach (self::MEASUREMENTS as $field) {
            if ((float) $row->getAttribute($field) !== (float) $values[$field]) {
                return true;
            }
        }

        return false;
    }

    /** @param  list<int>  $keep */
    private function dropUnusedFinishes(WheelModel $model, array $keep): void
    {
        $model->finishes()->whereNotIn('id', $keep)->get()->each(static function (WheelFinish $finish): void {
            // A finish a soft-deleted size still points at is soft-deleted with it: the key stays whole.
            $finish->delete();
        });
    }

    /** A slug no other model has, now or before (a trashed model keeps its address). */
    public static function slug(string $name): string
    {
        $base = Str::slug($name, '-', 'de') ?: 'felge';
        $slug = $base;
        $n = 2;

        while (WheelModel::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n++;
        }

        return $slug;
    }

    private static function brandSlug(string $name): string
    {
        $base = Str::slug($name, '-', 'de') ?: 'marke';
        $slug = $base;
        $n = 2;

        while (Brand::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n++;
        }

        return $slug;
    }
}
