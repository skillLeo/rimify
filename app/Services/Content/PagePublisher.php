<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Models\AdminUser;
use App\Models\Page;
use App\Models\PageBlock;
use App\Models\PageRevision;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Every change to a page's words: draft, publish, withdraw, restore, a new article. Each runs in
 * one transaction and leaves one Protokoll entry; the storefront only ever sees a published whole.
 *
 * Every write names the page version it was made against (`pages.content_version`, sent by the
 * editor). The row is locked and a write against an older version is refused (PageChangedMeanwhile):
 * two people on one page never silently undo each other's draft or live words.
 *
 * @phpstan-import-type Content from PageSchema
 * @phpstan-import-type Schema from PageSchema
 */
final class PagePublisher
{
    /** The note on the revision that keeps the wording the admin first replaced. */
    public const FIRST_REVISION_NOTE = 'Stand vor der ersten Änderung im Admin';

    /** The seeder's own placeholder for a legal section (ContentSeeder::seedLegalPages). */
    private const SEEDED_PLACEHOLDER = '/^\[Rechtstext folgt von der Kanzlei — Abschnitt: [^\]]+\]$/u';

    /** @param  Content  $content */
    public function saveDraft(Page $page, int $baseVersion, array $content, AdminUser $actor): void
    {
        DB::transaction(function () use ($page, $baseVersion, $content, $actor): void {
            $this->lock($page, $baseVersion);

            $page->forceFill([
                'draft' => $content,
                'draft_updated_at' => now(),
                'draft_author_email' => $actor->email,
            ]);
            $this->bump($page);

            AuditTrail::record($actor, 'page.draft_saved', ['page' => $page->title, 'slug' => $page->slug], $page);
        });
    }

    /**
     * Back to what is live. A page that was never published has nothing live to go back to: its
     * draft becomes the empty form again rather than nothing, so the article can still be written
     * and published (a draft of null would leave the editor without its lead and sections).
     *
     * @param  Schema  $schema
     */
    public function discardDraft(Page $page, int $baseVersion, array $schema, AdminUser $actor): void
    {
        DB::transaction(function () use ($page, $baseVersion, $schema, $actor): void {
            $this->lock($page, $baseVersion);

            $empty = PageContent::live($page)['blocks'] === [];

            $page->forceFill($empty
                ? ['draft' => PageSchema::skeleton($schema, $page->title), 'draft_updated_at' => now(), 'draft_author_email' => $actor->email]
                : ['draft' => null, 'draft_updated_at' => null, 'draft_author_email' => null]);
            $this->bump($page);

            AuditTrail::record($actor, 'page.draft_discarded', ['page' => $page->title, 'slug' => $page->slug], $page);
        });
    }

    /**
     * Puts the content live. The caller has run the publish check (PageSchema::errors).
     *
     * The first publish from the admin first keeps the wording it replaces as a revision, so the
     * seeded text can always be brought back — when there was one: an article born in the admin
     * had none. A legal page's „vom Anwalt geprüft" mark is a fact about one wording: changed text
     * clears it unless the publisher ticks it again.
     *
     * Publishing what the shop already shows changes nothing and writes no version. A waiting draft
     * is cleared then too, and that is logged as the discard it is. The version check makes sure
     * that draft is one the publisher had on screen.
     *
     * @param  Schema  $schema
     * @param  Content  $content
     * @return bool whether anything visitors see changed
     */
    public function publish(Page $page, int $baseVersion, array $schema, array $content, bool $lawyerReviewed, ?string $note, AdminUser $actor): bool
    {
        return DB::transaction(function () use ($page, $baseVersion, $schema, $content, $lawyerReviewed, $note, $actor): bool {
            $this->lock($page, $baseVersion);

            $live = PageContent::live($page);
            $changes = PageSchema::changes($schema, PageSchema::normalise($schema, $live, $live), $content);
            $reviewed = $page->kind === Page::KIND_LEGAL && $lawyerReviewed;

            if ($changes === [] && $page->isPublished() && $page->lawyer_reviewed === $reviewed) {
                if ($page->draft !== null) {
                    $page->forceFill(['draft' => null, 'draft_updated_at' => null, 'draft_author_email' => null]);
                    $this->bump($page);
                    AuditTrail::record($actor, 'page.draft_discarded', ['page' => $page->title, 'slug' => $page->slug], $page);
                }

                return false;
            }

            if ($live['blocks'] !== [] && ! $page->revisions()->exists()) {
                PageRevision::query()->create([
                    'page_id' => $page->id,
                    'snapshot' => $live,
                    'note' => self::FIRST_REVISION_NOTE,
                ]);
            }

            PageBlock::query()->where('page_id', $page->id)->delete();

            $blocks = self::withPlaceholders($content, $live)['blocks'];
            // The seeded marker published again makes the page a placeholder again; publishing never makes it real —
            // only switching the flag off over the Kanzlei's words does (LegalPlaceholderRequest, D-319).
            $markerLeft = array_filter($blocks, static fn (array $block): bool => ($block['data']['placeholder'] ?? false) === true) !== [];

            foreach ($blocks as $i => $block) {
                PageBlock::query()->create([
                    'page_id' => $page->id,
                    'type' => $block['type'],
                    'sort_order' => ($i + 1) * 10,
                    'data' => $block['data'],
                ]);
            }

            $wasReviewed = $page->lawyer_reviewed;
            $wasPublished = $page->isPublished();

            $page->forceFill([
                'title' => $content['title'],
                'meta_description' => $content['metaDescription'] === '' ? null : $content['metaDescription'],
                'status' => Page::STATUS_PUBLISHED,
                'published_at' => now(),
                'draft' => null,
                'draft_updated_at' => null,
                'draft_author_email' => null,
                'lawyer_reviewed' => $reviewed,
                'is_placeholder' => $page->kind === Page::KIND_LEGAL && ($page->is_placeholder || $markerLeft),
            ]);
            $this->bump($page);

            // A version is a wording visitors read. Confirming the lawyer's mark on unchanged words
            // is recorded in the Protokoll, not as a second copy of the same text.
            if ($changes !== [] || ! $wasPublished) {
                PageRevision::query()->create([
                    'page_id' => $page->id,
                    'snapshot' => PageContent::live($page->refresh()),
                    'note' => $note,
                    'author_id' => $actor->id,
                    'author_email' => $actor->email,
                ]);
            }

            AuditTrail::record($actor, 'page.published', [
                'page' => $page->title,
                'slug' => $page->slug,
                'changes' => $changes,
                'note' => $note,
                'lawyer_reviewed' => ['old' => $wasReviewed, 'new' => $page->lawyer_reviewed],
            ], $page);

            return true;
        });
    }

    /** Takes a Ratgeber article off the shop; its words stay, ready to publish again. */
    public function withdraw(Page $page, int $baseVersion, AdminUser $actor): void
    {
        DB::transaction(function () use ($page, $baseVersion, $actor): void {
            $this->lock($page, $baseVersion);

            $page->forceFill(['status' => Page::STATUS_DRAFT]);
            $this->bump($page);

            AuditTrail::record($actor, 'page.withdrawn', ['page' => $page->title, 'slug' => $page->slug], $page);
        });
    }

    /** Loads an old published state into the draft. Nothing goes live until it is published. */
    public function restore(Page $page, int $baseVersion, PageRevision $revision, AdminUser $actor): void
    {
        DB::transaction(function () use ($page, $baseVersion, $revision, $actor): void {
            $this->lock($page, $baseVersion);

            $page->forceFill([
                'draft' => $revision->snapshot,
                'draft_updated_at' => now(),
                'draft_author_email' => $actor->email,
            ]);
            $this->bump($page);

            AuditTrail::record($actor, 'page.revision_restored', [
                'page' => $page->title,
                'slug' => $page->slug,
                'revision' => $revision->id,
                'revision_at' => $revision->created_at->toIso8601String(),
            ], $page);
        });
    }

    /**
     * A new Ratgeber article, unpublished, with an empty lead and one empty section in its draft:
     * the editor opens on something to fill in, and the publish check says what is still missing.
     *
     * @param  Schema  $schema
     */
    public function createGuide(string $title, string $slug, array $schema, AdminUser $actor): Page
    {
        return DB::transaction(function () use ($title, $slug, $schema, $actor): Page {
            $page = Page::query()->create([
                'slug' => $slug,
                'locale' => 'de',
                'kind' => Page::KIND_GUIDE,
                'title' => $title,
                'status' => Page::STATUS_DRAFT,
                'draft' => PageSchema::skeleton($schema, $title),
                'draft_updated_at' => now(),
                'draft_author_email' => $actor->email,
                'team_edited_at' => now(),
            ]);

            AuditTrail::record($actor, 'page.created', ['page' => $title, 'slug' => $slug], $page);

            return $page;
        });
    }

    /** The address a new article gets from its title: „ET richtig lesen" → et-richtig-lesen. */
    public static function slugFor(string $title): string
    {
        return Str::slug($title, '-', 'de');
    }

    /**
     * Marks the legal sections that are still a placeholder: word for word a live placeholder's
     * text, or the seeder's own „[Rechtstext folgt von der Kanzlei — Abschnitt: …]" (so a restored
     * Ausgangsstand keeps its mark too). Any other text is the Kanzlei's, and plain. The preview and
     * the publish use the same rule, so they cannot disagree.
     *
     * @param  Content  $content
     * @param  Content  $live
     * @return Content
     */
    public static function withPlaceholders(array $content, array $live): array
    {
        $texts = [];

        foreach ($live['blocks'] as $block) {
            if (($block['data']['placeholder'] ?? false) === true && is_string($block['data']['text'] ?? null)) {
                $texts[] = $block['data']['text'];
            }
        }

        foreach ($content['blocks'] as $i => $block) {
            $text = $block['data']['text'] ?? null;

            if ($block['type'] === 'legal_body' && is_string($text) && (in_array($text, $texts, true) || preg_match(self::SEEDED_PLACEHOLDER, $text) === 1)) {
                $content['blocks'][$i]['data']['placeholder'] = true;
            }
        }

        return $content;
    }

    /** Locks the page's row and refuses a write made against an older version of it. */
    private function lock(Page $page, int $baseVersion): void
    {
        $current = Page::query()->whereKey($page->id)->lockForUpdate()->value('content_version');

        if ((int) $current !== $baseVersion) {
            throw new PageChangedMeanwhile;
        }

        $page->refresh();
    }

    /** Saves the page with its version moved on, as the team's from now on. */
    private function bump(Page $page): void
    {
        $page->content_version = (int) $page->content_version + 1;
        $page->markTeamEdited();
        $page->save();
    }
}
