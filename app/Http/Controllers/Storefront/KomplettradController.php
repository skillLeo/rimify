<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Enums\CatalogueStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\KomplettradRequest;
use App\Models\WheelConfig;
use App\Services\Admin\Catalogue\TyreModels;
use App\Services\Commerce\KomplettradPricer;
use App\Support\LinePrice;
use App\Support\Money;
use App\Support\WheelTitle;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Komplettrad, step by step (the Gutachten rework §9): 1 Felge, the version from the product page; 2 Reifen; 3 Extras; 4 Warenkorb.
 *
 * Nothing here decides whether a tyre may be fitted: the very row the product page ships (FelgenController::answerFor), so the two can
 * never disagree, with the verdict and the tyres TyreEligibility permits on it (R-13). The basket asks the engine again on the add
 * whatever was shown (R-11). What this adds are the tyres' photographs, by their models, and the mounting fee for the sum.
 */
class KomplettradController extends Controller
{
    private const SET_OF = 4;

    public function __construct(
        private readonly FelgenController $felgen,
        private readonly TyreModels $models,
        private readonly KomplettradPricer $pricer,
    ) {}

    public function show(KomplettradRequest $request): Response|RedirectResponse
    {
        $config = WheelConfig::query()
            ->with(['wheelModel.brand', 'wheelFinish'])
            ->whereKey($request->size())
            ->whereHas('wheelModel', static fn ($q) => $q->where('status', CatalogueStatus::Published->value))
            ->first();

        // No such size: back to the rims, never a dead end.
        if ($config === null) {
            return redirect('/felgen');
        }

        $answer = $this->felgen->answerFor($request, $config);
        $row = $answer['config'];
        $model = $config->wheelModel;
        $finish = $config->wheelFinish;
        $mounting = $this->pricer->mountingPerWheel();
        $currency = $row['currency'] ?? 'EUR';

        return Inertia::render('Komplettrad/Index', [
            'product' => [
                'slug' => $model->slug,
                'brandName' => $model->brand->name,
                'modelName' => WheelTitle::name($model),
                'finishId' => (int) $config->wheel_finish_id,
                'finishName' => $finish->name_de,
                // The finish's own photograph or null: the page then draws the outline, never another finish's.
                'image' => is_array($finish->image_manifest) ? $finish->image_manifest : null,
                'art' => ['finish' => $finish->art_finish, 'spokes' => (int) $model->spoke_count],
            ],
            'config' => $row,
            'options' => $answer['komplettradOptions'],
            'photos' => (object) $this->models->photosOf(self::tyreIds($row)),
            // Null while nobody has named a fee (D-032): the page says so, never a guessed figure.
            'mounting' => $mounting === null ? null : [
                'each' => Money::fromMinor($mounting, is_string($currency) ? $currency : 'EUR')->format(),
                'total' => LinePrice::total(Money::fromMinor($mounting, is_string($currency) ? $currency : 'EUR'), self::SET_OF)->format(),
            ],
            'schritt' => $request->step(),
        ]);
    }

    /**
     * Every tyre the row offers.
     *
     * @param  array<string, mixed>  $row
     * @return list<int>
     */
    private static function tyreIds(array $row): array
    {
        $ids = [];
        $offer = is_array($row['komplettrad'] ?? null) ? $row['komplettrad'] : [];
        $mixed = is_array($row['mischbereifung'] ?? null) ? $row['mischbereifung'] : [];

        foreach ($offer['tyres'] ?? [] as $tyre) {
            $ids[] = (int) $tyre['id'];
        }

        foreach ([...($offer['combinations'] ?? []), ...($mixed['pairs'] ?? [])] as $pair) {
            foreach ($pair['sets'] ?? [] as $set) {
                $ids[] = (int) $set['frontTyreId'];
                $ids[] = (int) $set['rearTyreId'];
            }
        }

        return array_values(array_unique($ids));
    }
}
