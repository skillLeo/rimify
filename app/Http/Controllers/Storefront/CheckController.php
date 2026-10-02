<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Storefront\PapersBook;
use App\Domain\Storefront\VehicleContext;
use App\Enums\CatalogueStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\IssueCheckResultRequest;
use App\Models\Brand;
use App\Models\CheckResult;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Storefront\CheckResults;
use App\Services\Storefront\VehicleTree;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * RIMIFY-CHECK — the promise the whole brand is built on, as its own page.
 *
 * The result page is addressed by a token rather than by a query string because the whole point of
 * it is that it can be sent to a workshop, printed, and still say the same thing next week: the answer
 * is frozen whole when it is issued (CheckResults), the tyre sum unfolded.
 */
class CheckController extends Controller
{
    public function __construct(private readonly VehicleTree $tree) {}

    /**
     * One question (the client's #28): „Passt diese Felge auf mein Auto?“ — the car (`fahrzeug`, D-116, or the selector's
     * `marke`/`modell`), the wheel (`hersteller`, `felge`) and its size (`groesse`, one configuration) all in the address,
     * so the page is the answer whoever opens the link. With both, the answer is the product page's own row for that
     * size and that car (FelgenController::answerFor) — one engine, one answer.
     */
    public function index(Request $request): Response
    {
        $make = $request->string('marke')->toString();
        $model = $request->string('modell')->toString();

        $wheelSlug = $request->string('felge')->toString();
        $wheel = $wheelSlug === '' ? null : WheelModel::query()
            ->with(['brand', 'configs.wheelFinish'])
            ->where('slug', $wheelSlug)
            ->where('status', CatalogueStatus::Published->value)
            ->first();

        // The wheel decides its brand; a brand alone narrows the wheels to choose from.
        $brandSlug = $request->string('hersteller')->toString();
        $brand = $wheel->brand ?? ($brandSlug === '' ? null : Brand::query()->where('slug', $brandSlug)->first());

        $configs = $wheel === null ? collect() : $wheel->configs
            ->sortBy([['diameter_in', 'asc'], ['width_in', 'asc'], ['et_mm', 'asc']])
            ->values();

        // The wheel's finishes, each chosen on its own (`ausfuehrung`), so the size select holds a size and nothing else —
        // a finish and a size in one line was cut off in a phone's select (CHECK-05). The first finish until one is named.
        $finishes = $configs->map(static fn (WheelConfig $c) => $c->wheelFinish)->unique('id')->sortBy('id')->values();
        $config = $configs->firstWhere('id', $request->integer('groesse'));
        $finishId = $request->integer('ausfuehrung') ?: null;

        // Another finish keeps the size where it has it: the same width, diameter and ET.
        if ($config !== null && $finishId !== null && (int) $config->wheel_finish_id !== $finishId) {
            $config = $configs->first(static fn (WheelConfig $c): bool => (int) $c->wheel_finish_id === $finishId
                && (float) $c->width_in === (float) $config->width_in
                && (float) $c->diameter_in === (float) $config->diameter_in
                && (int) $c->et_mm === (int) $config->et_mm);
        }

        $finishId = $finishes->firstWhere('id', $config->wheel_finish_id ?? $finishId)->id ?? $finishes->first()?->id;
        $sizes = $configs->filter(static fn (WheelConfig $c): bool => (int) $c->wheel_finish_id === $finishId)->values();
        $config ??= $sizes->count() === 1 ? $sizes->first() : null;

        // A shared link outlives a wheel or a size taken out of the shop: the page says which, never shows empty choices.
        $notFound = match (true) {
            $wheelSlug !== '' && $wheel === null => 'wheel',
            $wheel !== null && $request->filled('groesse') && $config === null && ! $request->filled('ausfuehrung') => 'size',
            default => null,
        };

        $vehicleChosen = VehicleContext::decode(is_string($raw = $request->cookie(VehicleContext::COOKIE)) ? $raw : null) !== null;

        return Inertia::render('Check/Index', [
            'makes' => $this->tree->makes(),
            'selectedMake' => $make === '' ? null : $make,
            'selectedModel' => $model === '' ? null : $model,
            'models' => $make === '' ? [] : $this->tree->models($make),
            'variants' => ($make === '' || $model === '') ? [] : $this->tree->variants($make, $model),
            'wheelBrands' => $this->wheelBrands(),
            'wheelModels' => $brand === null ? [] : WheelModel::query()
                ->where('brand_id', $brand->id)
                ->where('status', CatalogueStatus::Published->value)
                ->orderBy('name')
                ->get(['slug', 'name'])
                ->map(static fn (WheelModel $m): array => ['slug' => $m->slug, 'name' => $m->name])
                ->all(),
            'wheelFinishes' => $finishes->map(static fn ($f): array => ['id' => (int) $f->id, 'name' => (string) $f->name_de])->all(),
            'wheelSizes' => $sizes->map(static fn (WheelConfig $c): array => [
                'id' => (int) $c->id,
                'label' => GermanFormat::wheelSize((float) $c->width_in, (float) $c->diameter_in, (int) $c->et_mm),
            ])->all(),
            'chosen' => ['brand' => $brand?->slug, 'wheel' => $wheel?->slug, 'finish' => $finishId, 'size' => $config?->id],
            'notFound' => $notFound,
            // „Ändern“ on a chosen car, in the address (CHECK-01, -02): every drill step keeps the selector open, a choice
            // closes it — the car's return address carries no `aendern`.
            'changing' => $request->boolean('aendern'),
            // The answer only for a pair: a car and one size of one wheel. Without the car the page asks for it.
            'answer' => $config === null || $wheel === null || ! $vehicleChosen ? null : [
                'product' => [
                    'slug' => $wheel->slug,
                    'brandName' => $wheel->brand->name,
                    'modelName' => $wheel->name,
                    'finishId' => (int) $config->wheel_finish_id,
                    'finishName' => $config->wheelFinish->name_de,
                ],
                ...app(FelgenController::class)->answerFor($request, $config),
            ],
        ]);
    }

    /**
     * The brands that have a wheel in the shop, by name.
     *
     * @return list<array{slug: string, name: string}>
     */
    private function wheelBrands(): array
    {
        return Brand::query()
            ->whereHas('wheelModels', static fn ($q) => $q->where('status', CatalogueStatus::Published->value))
            ->orderBy('name')
            ->get(['id', 'slug', 'name'])
            ->map(static fn (Brand $b): array => ['slug' => (string) $b->slug, 'name' => (string) $b->name])
            ->values()
            ->all();
    }

    /** „RIMIFY-Check drucken“ on the product page: the answer for this car and this wheel, frozen, then shown. */
    public function store(IssueCheckResultRequest $request, CheckResults $results): RedirectResponse
    {
        $vehicleId = (int) $request->vehicleId();
        $raw = $request->cookie(PapersBook::COOKIE);
        $papers = PapersBook::decode(is_string($raw) ? $raw : null)->for($vehicleId);

        $result = $results->issue($vehicleId, $request->wheelConfigId(), $papers);

        return redirect()->route('check.ergebnis', $result->token);
    }

    /**
     * The shareable, printable result: the frozen answer, every sentence of it. A token that names nothing —
     * mistyped, or never issued — shows the page's own „not available“ state, never an error.
     */
    public function ergebnis(string $token, CheckResults $results): Response
    {
        $result = preg_match('/^[A-Za-z0-9]{32}$/', $token) === 1
            ? CheckResult::query()->where('token', $token)->first()
            : null;

        return Inertia::render('CheckErgebnis/Index', [
            'token' => $token,
            'result' => $result === null ? null : $results->present($result),
        ]);
    }
}
