<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
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

    public function __invoke(Request $request, ?string $slug = null): Response
    {
        $slug = in_array($slug, self::TABS, true) ? $slug : self::TABS[0];

        $pages = DB::table('pages')
            ->whereIn('slug', self::TABS)
            ->where('kind', 'legal')
            ->get(['id', 'slug', 'title']);

        $tabs = [];
        $pageId = null;

        foreach (self::TABS as $tab) {
            $row = $pages->firstWhere('slug', $tab);

            if ($row === null) {
                continue;
            }

            $tabs[] = ['slug' => $tab, 'title' => (string) $row->title];

            if ($tab === $slug) {
                $pageId = (int) $row->id;
            }
        }

        $blocks = $pageId === null ? [] : $this->blocks($pageId);

        return Inertia::render('Rechtliches/Index', [
            'tabs' => $tabs,
            'active' => $slug,
            'blocks' => $blocks,
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function blocks(int $pageId): array
    {
        $rows = DB::table('page_blocks')
            ->where('page_id', $pageId)
            ->orderBy('sort_order')
            ->get(['id', 'type', 'data']);

        $blocks = [];

        foreach ($rows as $row) {
            $data = json_decode((string) $row->data, true);

            $blocks[] = [
                'id' => (int) $row->id,
                'type' => (string) $row->type,
                'data' => is_array($data) ? $data : [],
            ];
        }

        return $blocks;
    }
}
