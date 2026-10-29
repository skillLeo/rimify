<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ShelfPicksRequest;
use App\Models\AdminUser;
use App\Models\Page;
use App\Services\Storefront\HomeShelf;
use App\Services\Storefront\ProductCards;
use App\Services\Storefront\ShelfPicks;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Inhalte › Meistgekaufte Felgen (the client's #5, „please show 8 rims“; D-353): the homepage's shelf of eight — what it
 * shows now and why each rim stands there — and the team's picks that fill the places sales leave free, in their order.
 * Saved straight to the shop, so saving takes the rights to edit and to publish (PagePolicy::pickShelf).
 */
class MeistgekaufteFelgenController extends Controller
{
    public const SAVED = 'Gespeichert. Die Startseite zeigt deine Auswahl ab sofort auf den Plätzen, die Verkäufe frei lassen.';

    public function index(Request $request, HomeShelf $shelf, ProductCards $cards): Response
    {
        $this->authorize('viewAny', Page::class);

        $admin = $request->user('admin');
        $labels = ShelfPicksRequest::cards($cards);
        $now = $shelf->catalogue();

        return Inertia::render('Admin/MeistgekaufteFelgen/Index', [
            'size' => ShelfPicks::SIZE,
            // A pick no longer on sale stays out of the form: the shelf passes over it, and saving drops it.
            'picks' => array_values(array_filter(ShelfPicks::keys(), static fn (string $key): bool => isset($labels[$key]))),
            'options' => array_map(static fn (string $key, string $label): array => ['value' => $key, 'label' => $label], array_keys($labels), $labels),
            'shelf' => array_map(static fn (array $card, string $source): array => [
                'key' => (string) $card['compareKey'],
                'label' => $labels[(string) $card['compareKey']] ?? trim($card['brandName'].' '.$card['modelName']),
                'source' => $source,
                'href' => '/felgen/'.$card['slug'].'?ausfuehrung='.$card['finishId'],
            ], $now['cards'], $now['sources']),
            'can' => ['update' => $admin instanceof AdminUser && $admin->can('pickShelf', Page::class)],
        ]);
    }

    public function update(ShelfPicksRequest $request): RedirectResponse
    {
        ShelfPicks::set($request->picks(), $request->labels(), $request->admin());

        return back()->with('toast', self::SAVED);
    }
}
