<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\Design\PrototypePage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Serve the design's own link targets.
 *
 * The prototype is a folder of files, so every link it draws points at one: `felgen.html`,
 * `produkt.html?sku=…`, `rechtliches.html?t=agb`. Those hrefs are inside the runtime's template
 * strings — `shared/app.js` builds the header and footer from them — and the whole point of this
 * rebuild is that we ship that runtime unmodified.
 *
 * Rewriting the hrefs to Laravel paths would mean editing the design's files, which is the one
 * thing that is not allowed here, and it would also break the visual gate: `href` is part of the
 * markup being compared.
 *
 * So the hrefs stay exactly as the design wrote them and this maps each one onto the real route.
 * A redirect rather than rendering in place, so the address bar ends up showing the
 * German URL a customer should see and bookmark, not a file name from a prototype.
 *
 * The query string is carried across untouched: `?marke=`, `?sku=` and `?t=` all still select
 * what they selected in the design.
 */
class DesignLinkController extends Controller
{
    public function __invoke(Request $request, string $path): RedirectResponse
    {
        /*
         * Only the last segment names the screen. The route matches at any depth because the
         * design's hrefs are relative — `produkt.html` clicked from `/felgen` arrives here as
         * `felgen/produkt` — and where the visitor happened to be standing when they clicked says
         * nothing about where they were going.
         */
        $page = basename(str_replace('\\', '/', $path));

        // Route name for the design's screen name, from the same table that puts `data-page` on
        // <body>. One mapping, used in both directions, so a renamed route cannot leave a dead
        // link behind in the footer.
        $routeName = array_search($page, PrototypePage::all(), strict: true);

        if ($routeName === false) {
            throw new NotFoundHttpException("No route for the design's '{$page}.html'.");
        }

        // `produkt.html?sku=…` names its wheel in the query string, so it can be resolved.
        if ($routeName === 'felgen.show') {
            return $this->toProduct($request);
        }

        /*
         * `felgen-suchen.html?marke=…` carries two different vocabularies through one parameter.
         *
         * The marque tiles send a VEHICLE make — Audi, BMW — and the selector reads `?marke=` to
         * preselect it, which works. The brand cards send a WHEEL brand — BORBET, OZ RACING —
         * which matches no vehicle make, so the selector silently ignores it and all four cards
         * land on the same empty selector.
         *
         * Spec §5.4 and §5.5: a brand chip goes to the listing (Rim search) filtered to
         * that brand; a vehicle make goes to the selector. Same link, told apart by which
         * vocabulary the value belongs to.
         */
        if ($routeName === 'felgen.suchen' && $this->isWheelBrand($request->query('marke'))) {
            return redirect()->route('felgen.index', $request->query())->setStatusCode(302);
        }

        /*
         * The remaining bound routes genuinely cannot be built from a file name: `bestellung.html`
         * carries no order reference and `check-ergebnis.html` no token. They fall back to the
         * page the visitor can get to that reference from, rather than to a guessed record.
         */
        $fallbacks = [
            'check.ergebnis' => 'check.index',
            'bestellung.show' => 'warenkorb.index',
        ];

        return redirect()
            ->route($fallbacks[$routeName] ?? $routeName, $request->query())
            ->setStatusCode(302);
    }

    /**
     * Is this value the name of a wheel brand we stock, rather than a vehicle make?
     *
     * Asked of the catalogue rather than of a hard-coded list, so a brand added in the admin panel
     * routes correctly without a deployment. Compared case-insensitively because the design writes
     * its brand names in capitals on the cards.
     */
    private function isWheelBrand(mixed $value): bool
    {
        if (! is_string($value) || $value === '') {
            return false;
        }

        return DB::table('brands')
            ->whereNull('deleted_at')
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($value)])
            ->exists();
    }

    /**
     * Resolve `produkt.html?sku=BOR-HAV-GRM` onto our own product route.
     *
     * The design's runtime navigates by its own SKUs, which are not ours: it ships twelve wheels
     * in `shared/data.js` and our catalogue has its own twelve, with different SKUs and different
     * slugs. None of the design's SKUs exists in `wheel_configs`.
     *
     * So the SKU is matched on what the two catalogues genuinely share — the brand and model it
     * names. Five of the design's six models are also ours. The sixth, YIDO Grip, is not: our
     * YIDO models are Performance 1 and 2. That one keeps the listing rather than being sent to a
     * different wheel, because quietly substituting one wheel for another on a site about legal
     * approvals is the worst possible failure (CONTRIBUTING.md §2).
     *
     * The `sku` is passed through either way, since the design's runtime reads it to decide which
     * wheel to draw.
     *
     * This is a bridge, not the destination: it exists only while the pages are drawn from the
     * design's demo data. Once the runtime is fed from the catalogue, its SKUs are our SKUs and
     * this resolves to nothing.
     */
    private function toProduct(Request $request): RedirectResponse
    {
        /** @var array<string, string> Design SKU prefix → our model slug. */
        $models = [
            'BOR-HAV' => 'borbet-havanna',
            'OZ-STG' => 'oz-racing-superturismo-gt',
            'ALU-MON' => 'alutec-monstr',
            'BBS-CIR' => 'bbs-ci-r',
            'ROT-KPS' => 'rotiform-kps',
            // 'YID-GRP' is deliberately absent — see above.
        ];

        $sku = $request->query('sku');
        $slug = null;

        if (is_string($sku) && $sku !== '') {
            /*
             * The live catalogue puts OUR model slug in `sku`, precisely so this resolves with a
             * lookup instead of a translation table. The prefix map below is only reached on the
             * visual-fixture pages, which still run the design's demonstration data.
             */
            $known = DB::table('wheel_models')
                ->whereNull('deleted_at')
                ->where('slug', $sku)
                ->exists();

            if ($known) {
                $slug = $sku;
            }

            foreach ($models as $prefix => $candidate) {
                if ($slug === null && str_starts_with($sku, $prefix)) {
                    $slug = $candidate;
                    break;
                }
            }
        }

        if ($slug === null) {
            return redirect()->route('felgen.index', $request->query())->setStatusCode(302);
        }

        return redirect()
            ->route('felgen.show', ['model' => $slug, ...$request->query()])
            ->setStatusCode(302);
    }
}
