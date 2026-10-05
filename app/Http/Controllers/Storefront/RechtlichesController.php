<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Services\Content\LegalTexts;
use App\Services\Content\PageContent;
use App\Support\Operator;
use App\Support\Seller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The legal pages, as a five-tab rail over one route.
 *
 * The bodies are placeholders until the client's Kanzlei supplies the text (D-024). A page that
 * says plainly that its text is outstanding is honest; a page carrying legal German drafted by a
 * developer is a liability the client would carry, not us.
 */
class RechtlichesController extends Controller
{
    /** The rail, in the order the footer lists them. */
    private const TABS = ['impressum', 'datenschutz', 'agb', 'widerrufsbelehrung', 'versand'];

    public function __construct(private readonly PageContent $content) {}

    public function __invoke(Request $request, ?string $slug = null): Response
    {
        // A mistyped address is a 404 with its three ways on, not the Impressum under an address that names another
        // page; /rechtliches alone opens the first tab.
        abort_if($slug !== null && ! in_array($slug, self::TABS, true), 404);

        $slug ??= self::TABS[0];

        $pages = DB::table('pages')
            ->whereIn('slug', self::TABS)
            ->where('kind', Page::KIND_LEGAL)
            ->get(['id', 'slug', 'title']);

        $tabs = [];
        $present = false;

        foreach (self::TABS as $tab) {
            $row = $pages->firstWhere('slug', $tab);

            if ($row === null) {
                continue;
            }

            // A previewed page carries its drafted name in the rail as well as in the heading.
            $tabs[] = ['slug' => $tab, 'title' => $this->content->titleOf($tab, (string) $row->title)];
            $present = $present || $tab === $slug;
        }

        // The words — live, or the draft in a signed preview (PageContent).
        $blocks = $present ? ($this->content->page($slug)['blocks'] ?? []) : [];

        // The Impressum's facts from the seller data (§ 5 DDG), from the one place the invoice and the order mail read
        // too — beside the Kanzlei's text, never instead of it. What is not given yet says so; values the admin marked as
        // placeholders are shown here only, under a note that says they are placeholders (Seller::stored).
        // The test environment (staging) names its own operator instead, truthfully, and says the shop is not in
        // operation (Operator, D-088); on the client's domain the seller takes its place by itself.
        $provider = null;

        if ($slug === 'impressum' && Operator::applies()) {
            $rows = Operator::current()->impressum();
            $provider = [
                'rows' => $rows,
                'complete' => ! in_array(null, array_column($rows, 'value'), true),
                'placeholder' => false,
                'notice' => Operator::NOT_IN_OPERATION,
            ];
        } elseif ($slug === 'impressum') {
            $seller = Seller::stored();
            $rows = $seller->impressum();
            $provider = [
                'rows' => $rows,
                'complete' => ! $seller->placeholder && ! in_array(null, array_column($rows, 'value'), true),
                'placeholder' => $seller->placeholder,
            ];
        }

        return Inertia::render('Rechtliches/Index', [
            'tabs' => $tabs,
            'active' => $slug,
            'blocks' => $blocks,
            'provider' => $provider,
            // Where the Kanzlei's text is outstanding, the page says who prepares it, in one sentence.
            'preparing' => LegalTexts::PREPARING,
        ]);
    }
}
