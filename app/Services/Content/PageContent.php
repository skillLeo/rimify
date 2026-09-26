<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Models\Page;
use App\Models\PageBlock;

/**
 * The words a storefront page prints — the one read path for the homepage, the Ratgeber and the
 * legal pages.
 *
 * Normally that is the live content in `page_blocks`. During a signed preview
 * (VorschauController) one page's draft stands in for it, for that request only: the service is
 * scoped, so nothing a preview sets can reach another visitor. Everything else on the page — the
 * wheels, the counts, the navigation — is the live shop, which is what makes the preview honest.
 *
 * @phpstan-import-type Content from PageSchema
 *
 * @phpstan-type Printed array{id: int, slug: string, kind: string, title: string, metaDescription: string, published: bool, blocks: list<array{id: int, type: string, data: array<string, mixed>}>}
 */
final class PageContent
{
    /** @var array<string, Content> slug → the draft being previewed */
    private array $previews = [];

    /** @param  Content  $content */
    public function preview(Page $page, array $content): void
    {
        $this->previews[$page->slug] = $content;
    }

    public function isPreview(string $slug): bool
    {
        return isset($this->previews[$slug]);
    }

    /** The live words again, for everything after the preview's own response. */
    public function endPreview(): void
    {
        $this->previews = [];
    }

    /**
     * The page as this request prints it, or null when there is no such page. A previewed draft
     * counts as published for its own preview: seeing an unpublished article is the point.
     *
     * @return Printed|null
     */
    public function page(string $slug): ?array
    {
        $page = Page::query()->where('slug', $slug)->first();

        if ($page === null) {
            return null;
        }

        $preview = $this->previews[$slug] ?? null;

        if ($preview !== null) {
            $blocks = [];

            foreach ($preview['blocks'] as $i => $block) {
                // No row id exists for a drafted block; its position is a stable key for the page.
                $blocks[] = ['id' => $i + 1, 'type' => $block['type'], 'data' => $block['data']];
            }

            return [
                'id' => (int) $page->id,
                'slug' => $page->slug,
                'kind' => $page->kind,
                'title' => $preview['title'],
                'metaDescription' => $preview['metaDescription'],
                'published' => true,
                'blocks' => $blocks,
            ];
        }

        $blocks = [];

        foreach ($page->blocks()->get() as $block) {
            $blocks[] = ['id' => (int) $block->id, 'type' => $block->type, 'data' => $block->data];
        }

        return [
            'id' => (int) $page->id,
            'slug' => $page->slug,
            'kind' => $page->kind,
            'title' => $page->title,
            'metaDescription' => (string) ($page->meta_description ?? ''),
            'published' => $page->isPublished(),
            'blocks' => $blocks,
        ];
    }

    /**
     * A page's title as this request prints it — the legal rail names all five pages, and the one
     * being previewed carries its drafted name.
     */
    public function titleOf(string $slug, string $live): string
    {
        return isset($this->previews[$slug]) ? $this->previews[$slug]['title'] : $live;
    }

    /**
     * What visitors read now, in the content shape, block data exactly as stored (a legal block's
     * `placeholder` mark included). This is what a revision records.
     *
     * @return Content
     */
    public static function live(Page $page): array
    {
        $blocks = [];

        foreach ($page->blocks()->get() as $block) {
            /** @var PageBlock $block */
            $blocks[] = ['type' => $block->type, 'data' => $block->data];
        }

        return [
            'title' => $page->title,
            'metaDescription' => (string) ($page->meta_description ?? ''),
            'blocks' => $blocks,
        ];
    }
}
