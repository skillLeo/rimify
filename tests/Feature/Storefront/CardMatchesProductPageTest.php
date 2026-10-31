<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleKey;
use App\Models\Vehicle;
use App\Services\Demo\AcceptanceSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\Support\MinimalPdf;

/*
 * M-6 (the operator's answer of 31.10.2026): a card and its product page never disagree. For every car and every rim of
 * the demo data — the seeded catalogue the e2e shop publishes, and the acceptance set the preview shows — the card's
 * verdict is the verdict of the size its link opens the product page on. The card may say it shorter, never otherwise;
 * a card more positive than its page is S1.
 *
 * Found by Human QA on the Audi RS4 2.7 Avant: six cards said „Noch nicht bestätigt“ over product pages that said
 * „Nicht freigegeben“ — the card summed the sizes itself, and the page picked its size in the browser.
 */

const CARD_RANK = ['NOT_PERMITTED' => 0, 'UNKNOWN' => 1, 'CONDITIONAL' => 2, 'PERMITTED' => 3];

/** Every card the listing shows for the car, over all its pages. @return list<array<string, mixed>> */
function cardsForCar(mixed $test, string $key): array
{
    $cards = [];

    for ($page = 1; $page < 50; $page++) {
        $props = $test->get('/felgen?fahrzeug='.$key.($page > 1 ? '&seite='.$page : ''))->assertOk()->viewData('page')['props'];
        array_push($cards, ...$props['cards']);

        if (count($props['cards']) === 0 || ($props['total'] ?? 0) <= count($cards)) {
            break;
        }
    }

    return $cards;
}

/** The size the product page opens on, as the card's own link opens it. @return array<string, mixed>|null */
function openingSize(TestResponse $page, ?int $linked, int $finishId): ?array
{
    $props = $page->viewData('page')['props'];
    $sizes = collect($props['configs']);
    $openOn = (array) ($props['openOn'] ?? []);
    $chosen = $linked ?? ($openOn[(string) $finishId] ?? null);

    if ($chosen !== null) {
        return $sizes->firstWhere('id', $chosen);
    }

    // Before the page named its own size, the browser picked it (useConfigurator.best): permitted and available first,
    // then the cheapest — the same rule, read here so the comparison stands either way.
    $sellable = static fn (array $s): bool => $s['verdict'] === null || ($s['verdict']['sellable'] ?? false) || ($s['verdict']['rimSellable'] ?? false);

    return $sizes->where('finishId', $finishId)
        ->sortBy(static fn (array $s): array => [$sellable($s) ? ($s['inStock'] ? 0 : 1) : 2, $s['priceCents'], $s['id']])
        ->first();
}

/** @return list<string> every disagreement, „S1“ where the card is the more positive */
function disagreements(mixed $test): array
{
    $vehicleIds = DB::table('fitments')->distinct()->pluck('vehicle_id');
    $found = [];
    $compared = 0;

    foreach (Vehicle::query()->whereIn('id', $vehicleIds)->get() as $vehicle) {
        $key = VehicleKey::of($vehicle);

        foreach (cardsForCar($test, $key) as $card) {
            $claim = $card['fitment'] ?? null;

            if (! is_array($claim)) {
                continue;
            }

            // The size the card's link opens the page on (ProductTile: `groesse`); before M-6 a card named none.
            $linked = isset($claim['openOn']) ? (int) $claim['openOn'] : null;
            $page = $test->get('/felgen/'.$card['slug'].'?ausfuehrung='.$card['finishId'].'&fahrzeug='.$key.($linked !== null ? '&groesse='.$linked : ''))->assertOk();
            $size = openingSize($page, $linked, (int) $card['finishId']);
            $compared++;

            $onCard = (string) $claim['status'];
            $onPage = (string) ($size['verdict']['status'] ?? 'NONE');
            $label = "{$vehicle->make} {$vehicle->variant} ({$key}) · {$card['brandName']} {$card['modelName']} {$card['finishName']}";

            if ($onCard !== $onPage) {
                $s1 = (CARD_RANK[$onCard] ?? -1) > (CARD_RANK[$onPage] ?? -1);
                $found[] = ($s1 ? 'S1 ' : '').$label.": card {$onCard}, page {$onPage} (".($size['verdict']['reason'] ?? '–').')';

                continue;
            }

            // The same verdict, then the same answer on the papers: never „Keine Eintragung“ over a page that needs one.
            if (($claim['requiresEntry'] ?? false) !== ($size['verdict']['requiresEntry'] ?? false)) {
                $found[] = $label.': card and page differ on the Eintragung';
            }
        }
    }

    expect($compared)->toBeGreaterThan(0);

    return $found;
}

it('never shows a card that disagrees with its product page, over the seeded demo catalogue (M-6)', function (): void {
    test()->seed(DatabaseSeeder::class);
    // As the e2e shop publishes it (E2eShopSeeder): the catalogue is the shop's.
    DB::table('wheel_models')->where('is_demo', true)->update(['is_demo' => false, 'status' => 'published']);
    DB::table('tyre_variants')->update(['is_demo' => false]);

    expect(disagreements($this))->toBe([]);
})->group('slow');

it('never shows a card that disagrees with its product page, over the acceptance set the preview shows (M-6)', function (): void {
    config(['demo.enabled' => true]);
    test()->seed(ReferenceDataSeeder::class);

    $dir = sys_get_temp_dir().'/rimify-m6-pdfs';
    $data = require database_path('seeders/content/abnahme/gutachten.php');

    foreach ($data['documents'] as $key => $document) {
        $path = $dir.'/'.$document['pdf']['source'];
        is_dir(dirname($path)) || mkdir(dirname($path), 0777, true);
        file_put_contents($path, MinimalPdf::make(["stand-in for {$key}"]));
        $data['documents'][$key]['pdf']['sha256'] = hash_file('sha256', $path);
    }

    (new AcceptanceSeeder($dir, $data))->seed();

    expect(disagreements($this))->toBe([]);
});
