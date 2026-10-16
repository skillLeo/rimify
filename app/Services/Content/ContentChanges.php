<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Models\Page;
use App\Models\PageRevision;
use App\Support\HeroPhotos;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * What changed in the shop's own words since the last release — for whoever is about to invite a review (the operator's
 * brief „THE HERO SAYS „(VIELLEICHT)““ §2, after the client's „(Vielleicht)“ stood in the hero for six days unnoticed).
 *
 * Every version published since, with the account, the time and the note; every draft not yet published; and the
 * homepage's promises as visitors read them now, the headline first. What reads as a trial is marked — a note that names
 * no reason („test1“), a version replaced within a minute, a draft left lying for more than three days — so a trial is
 * not taken for a decision. Marked, never judged: the person who wrote it decides.
 *
 * @phpstan-import-type Content from PageSchema
 * @phpstan-import-type Schema from PageSchema
 *
 * @phpstan-type Change array{label: string, before: string, after: string}
 * @phpstan-type Published array{page: string, slug: string, at: CarbonImmutable, author: string|null, note: string|null, changes: list<Change>, trial: list<string>}
 * @phpstan-type Draft array{page: string, slug: string, at: CarbonImmutable|null, author: string|null, changes: list<Change>, trial: list<string>}
 */
final class ContentChanges
{
    /** A note that names no reason: „test“, „test1“, „Test 2“, „asdf“, „probe“, „xxx“ … */
    private const TRIAL_NOTE = '/^\s*(?:test|asdf|probe|versuch|xxx|tmp|temp|foo|bla)\s*\d*\s*$/iu';

    /** A version replaced this soon after it went out was a try, not a decision. */
    public const QUICK_SECONDS = 60;

    /** A draft nobody touched for this long is either forgotten or waiting for someone: said, either way. */
    public const STALE_DRAFT_DAYS = 3;

    /**
     * Every version published after `$since`, oldest first, each against the one before it.
     *
     * @return list<Published>
     */
    public function published(CarbonInterface $since): array
    {
        $out = [];
        $revisions = PageRevision::query()->with('page')->where('created_at', '>', $since)->orderBy('created_at')->orderBy('id')->get();

        foreach ($revisions as $revision) {
            $page = $revision->page;

            // The wording kept before the admin's first change: the page as it was, not a change of it.
            if (! $page instanceof Page || ($revision->author_email === null && $revision->note === PagePublisher::FIRST_REVISION_NOTE)) {
                continue;
            }

            $schema = PageSchema::for($page);
            $previous = PageRevision::query()->where('page_id', $page->id)->where('id', '<', $revision->id)->orderByDesc('id')->first();
            $next = PageRevision::query()->where('page_id', $page->id)->where('id', '>', $revision->id)->orderBy('id')->first();
            $at = CarbonImmutable::instance($revision->created_at);
            $changes = $schema === null ? [] : PageSchema::diff($schema, self::shaped($schema, $previous?->snapshot), self::shaped($schema, $revision->snapshot));
            $trial = [];

            if (self::trialNote($revision->note)) {
                $trial[] = 'Die Notiz „'.trim((string) $revision->note).'“ nennt keinen Grund.';
            }

            // Replaced, not merely followed: the next version changed again a place this one changed.
            if ($next !== null && $schema !== null) {
                $seconds = (int) abs(CarbonImmutable::instance($next->created_at)->diffInSeconds($at));
                $again = array_intersect(array_column($changes, 'label'), PageSchema::changes($schema, self::shaped($schema, $revision->snapshot), self::shaped($schema, $next->snapshot)));

                if ($seconds < self::QUICK_SECONDS && $again !== []) {
                    $trial[] = "Nach {$seconds} Sekunden wieder geändert: ".implode(', ', $again).'.';
                }
            }

            $out[] = [
                'page' => $page->title,
                'slug' => $page->slug,
                'at' => $at,
                'author' => $revision->author_email,
                'note' => $revision->note,
                'changes' => $changes,
                'trial' => $trial,
            ];
        }

        return $out;
    }

    /**
     * Every draft not yet published, against what visitors read now.
     *
     * @return list<Draft>
     */
    public function drafts(CarbonInterface $now): array
    {
        $out = [];

        foreach (Page::query()->whereNotNull('draft')->orderBy('slug')->get() as $page) {
            $schema = PageSchema::for($page);
            $at = $page->draft_updated_at === null ? null : CarbonImmutable::instance($page->draft_updated_at);
            $trial = [];

            if ($at !== null && $at->lt(CarbonImmutable::instance($now)->subDays(self::STALE_DRAFT_DAYS))) {
                $trial[] = 'Seit '.(int) $at->diffInDays($now).' Tagen nicht veröffentlicht.';
            }

            if (self::trialNote($page->title)) {
                $trial[] = 'Der Titel „'.$page->title.'“ nennt keinen Inhalt.';
            }

            $live = PageContent::live($page);

            $out[] = [
                'page' => $page->title,
                'slug' => $page->slug,
                'at' => $at,
                'author' => $page->draft_author_email,
                'changes' => $schema === null ? [] : PageSchema::diff($schema, self::shaped($schema, $live), self::shaped($schema, $page->draft)),
                'trial' => $trial,
            ];
        }

        return $out;
    }

    /**
     * The homepage as visitors read it now: the hero's words and photo, then the promise row — the strings a reviewer is
     * shown first.
     *
     * @return list<array{label: string, text: string}>
     */
    public function promises(): array
    {
        $page = Page::query()->where('slug', Page::HOME_SLUG)->first();

        if (! $page instanceof Page) {
            return [];
        }

        $lines = [];
        $photos = array_column(HeroPhotos::options(), 'label', 'value');

        foreach (PageContent::live($page)['blocks'] as $block) {
            $data = $block['data'];

            if ($block['type'] === 'hero') {
                $lines[] = ['label' => 'Überschrift', 'text' => (string) ($data['headline'] ?? '')];
                $lines[] = ['label' => 'Text unter der Überschrift', 'text' => (string) ($data['sub'] ?? '')];
                $lines[] = ['label' => 'Kürzerer Text für das Handy', 'text' => (string) ($data['sub_mobile'] ?? '')];
                $photo = (string) ($data['foto'] ?? HeroPhotos::DEFAULT);
                $lines[] = ['label' => 'Foto', 'text' => $photos[$photo] ?? $photo];
            }

            if ($block['type'] === 'promise_row') {
                foreach (array_values(is_array($data['items'] ?? null) ? $data['items'] : []) as $i => $item) {
                    $item = is_array($item) ? $item : [];
                    $icon = (string) ($item['icon'] ?? '');
                    $lines[] = [
                        'label' => 'Versprechen '.($i + 1),
                        'text' => trim((PageSchema::PROMISE_ICONS[$icon] ?? $icon).' · '.($item['title'] ?? '').' – '.($item['text'] ?? ''), ' ·–'),
                    ];
                }
            }
        }

        return $lines;
    }

    public static function trialNote(?string $text): bool
    {
        return $text !== null && preg_match(self::TRIAL_NOTE, $text) === 1;
    }

    /**
     * A stored content in the schema's shape — a revision written before a field existed reads as that field empty.
     *
     * @param  Schema  $schema
     * @param  array<mixed>|null  $content
     * @return Content
     */
    private static function shaped(array $schema, ?array $content): array
    {
        $empty = ['title' => '', 'metaDescription' => '', 'blocks' => []];

        return $content === null ? $empty : PageSchema::normalise($schema, $content, $empty);
    }
}
