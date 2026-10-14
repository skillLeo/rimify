<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Services\Content\ArticleBlocks;
use App\Services\Content\PageContent;
use App\Support\DevicePage;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Blog (the client's #10, D-230): its index at /blog, and one article at /ratgeber/{slug} — the address every
 * guide has had since H10. The articles are pages of kind `guide`: a lead block with the teaser and the reading time,
 * then sections of one heading and its paragraphs, and — reader's side only for now — figures with a required alt text
 * and tables with header cells and a caption (ArticleBlocks). Nothing in them is HTML: every word is text. The words
 * come through PageContent — live, or the draft in a signed preview.
 */
class RatgeberController extends Controller
{
    public function __construct(private readonly PageContent $content) {}

    /** /blog: every published article, newest first — the footer's „Blog“ leads here. */
    public function index(Request $request): Response
    {
        $articles = DB::table('pages')
            ->where('kind', Page::KIND_GUIDE)
            ->where('status', Page::STATUS_PUBLISHED)
            ->orderByRaw('COALESCE(published_at, updated_at) DESC')
            ->orderBy('id')
            ->get(['slug', 'title', 'meta_description', 'published_at', 'updated_at'])
            ->map(function (object $row): array {
                $page = $this->content->page((string) $row->slug);
                $lead = collect($page['blocks'] ?? [])->firstWhere('type', 'guide_lead')['data'] ?? [];

                return [
                    'slug' => (string) $row->slug,
                    'title' => (string) $row->title,
                    'teaser' => (string) ($lead['teaser'] ?? $row->meta_description ?? ''),
                    'minutes' => (int) ($lead['minutes'] ?? 3),
                    'href' => '/ratgeber/'.$row->slug,
                    'date' => GermanFormat::date(($row->published_at ?? $row->updated_at) === null ? null : CarbonImmutable::parse((string) ($row->published_at ?? $row->updated_at), 'UTC')),
                ];
            })
            ->values()
            ->all();

        return Inertia::render(DevicePage::resolve('Blog', $request), ['articles' => $articles]);
    }

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

            // Only the shapes the article page knows, each checked (ArticleBlocks): a figure without its alt text or a
            // table without a caption is left out rather than shown half.
            $checked = ArticleBlocks::check($block['type'], (array) $block['data']);

            if ($checked !== null) {
                $blocks[] = $checked;
            }
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
