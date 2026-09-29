<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Services\Content\PageContent;
use App\Support\DevicePage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * One guide article. The guides are pages of kind `guide`: a lead block with the teaser and the
 * reading time, then prose blocks of one heading and its paragraphs. The words come through
 * PageContent — live, or the draft in a signed preview.
 */
class RatgeberController extends Controller
{
    public function __construct(private readonly PageContent $content) {}

    public function __invoke(Request $request, string $slug): Response
    {
        $page = $this->content->page($slug);

        abort_if($page === null || $page['kind'] !== Page::KIND_GUIDE || ! $page['published'], 404);

        $lead = [];
        $blocks = [];

        foreach ($page['blocks'] as $block) {
            if ($block['type'] === 'guide_lead') {
                $lead = $block['data'];

                continue;
            }

            $blocks[] = ['type' => $block['type'], 'data' => $block['data']];
        }

        $others = DB::table('pages')
            ->where('kind', Page::KIND_GUIDE)
            ->where('status', Page::STATUS_PUBLISHED)
            ->where('slug', '!=', $slug)
            ->orderBy('id')
            ->get(['slug', 'title']);

        return Inertia::render(DevicePage::resolve('Ratgeber', $request), [
            'guide' => [
                'slug' => $page['slug'],
                'title' => $page['title'],
                'teaser' => (string) ($lead['teaser'] ?? ''),
                'minutes' => (int) ($lead['minutes'] ?? 3),
                'metaDescription' => $page['metaDescription'],
                'blocks' => $blocks,
            ],
            'others' => $others->map(static fn (object $row): array => [
                'slug' => (string) $row->slug,
                'title' => (string) $row->title,
                'href' => '/ratgeber/'.$row->slug,
            ])->values()->all(),
        ]);
    }
}
