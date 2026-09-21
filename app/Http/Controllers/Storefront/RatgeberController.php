<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Support\DevicePage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * One guide article. The three guides are pages of kind `guide`: a lead block with the teaser and
 * the reading time, then prose blocks of one heading and its paragraphs.
 */
class RatgeberController extends Controller
{
    public function __invoke(Request $request, string $slug): Response
    {
        $page = DB::table('pages')
            ->where('slug', $slug)
            ->where('kind', 'guide')
            ->where('status', 'published')
            ->first(['id', 'slug', 'title', 'meta_description', 'published_at']);

        abort_if($page === null, 404);

        $rows = DB::table('page_blocks')
            ->where('page_id', $page->id)
            ->orderBy('sort_order')
            ->get(['type', 'data']);

        $lead = [];
        $blocks = [];

        foreach ($rows as $row) {
            $data = json_decode((string) $row->data, true);
            $data = is_array($data) ? $data : [];

            if ($row->type === 'guide_lead') {
                $lead = $data;

                continue;
            }

            $blocks[] = ['type' => (string) $row->type, 'data' => $data];
        }

        $others = DB::table('pages')
            ->where('kind', 'guide')
            ->where('status', 'published')
            ->where('slug', '!=', $slug)
            ->orderBy('id')
            ->get(['slug', 'title']);

        return Inertia::render(DevicePage::resolve('Ratgeber', $request), [
            'guide' => [
                'slug' => (string) $page->slug,
                'title' => (string) $page->title,
                'teaser' => (string) ($lead['teaser'] ?? ''),
                'minutes' => (int) ($lead['minutes'] ?? 3),
                'metaDescription' => (string) ($page->meta_description ?? ''),
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
