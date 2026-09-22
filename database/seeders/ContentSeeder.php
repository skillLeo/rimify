<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\WheelModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Navigation, FAQ and the marketing and legal pages — as data, not as markup.
 *
 * Every string below is copy the client owns and will want to change: the homepage sections, the
 * four menus, the questions. Hard-coding them into a Blade template or a Vue SFC would mean that
 * renaming a menu item or swapping a heading needs a developer, a review and a deploy. Holding them
 * in `pages` / `page_blocks` / `nav_items` means the change is data. That is the whole point of the
 * block CMS, and the reason `nav_items.behaviour` carries the conditional *Felgen suchen* rule
 * instead of a branch inside a component.
 *
 * Three things deliberately do NOT live here:
 *
 * - **Legal body text.** Impressum, Datenschutz, AGB, Widerrufsbelehrung and Versand ship with the
 *   real heading and a visibly marked placeholder (D-024). Drafting German legal text is a Kanzlei's
 *   job; a plausible-looking invented Impressum is the constitution's "confidently wrong" in its
 *   most expensive form. The FAQ therefore points to the Widerrufsbelehrung and states no law.
 * - **Contact details.** E-mail and service hours are read from `config('rimify.contact')`
 *   (D-023) when a page renders, never copied into a content row, where they would go stale.
 * - **Unconfirmed promises.** No delivery time, no carrier, no "als PDF", no in-house mounting and
 *   no stock figure until the client confirms it (docs/phase0/ACCURACY.md D7). The blocks that
 *   carried such lines and that no page rendered are retired, not kept "for later".
 *
 * Re-runnable: every row is matched on its natural key, so a second run updates and never doubles,
 * and the retired blocks are removed by page and type, so a database seeded before loses them too.
 */
class ContentSeeder extends Seeder
{
    /** The hero wheel: the one model whose photographs are the client's own (ACCURACY D10). */
    public const HERO_SLUG = 'motec-mcr4-ultimate';

    public function run(): void
    {
        $this->seedNavItems();
        $this->seedFaqEntries();
        $this->seedHomepage();
        $this->seedFaqPage();
        $this->seedContactPage();
        $this->seedLegalPages();
        $this->seedGuides();
        $this->retireBlocks();
        $this->seedSettings();
    }

    /**
     * The hero product is the MOTEC MCR4 Ultimate, the only wheel photographed as itself.
     *
     * The setting is written when it is unset, when it names no model any more, or when it names a
     * demonstration model — a demo pick is ours, never the client's. A real product the client has
     * chosen stays chosen. Nothing happens before the catalogue has been seeded.
     */
    private function seedSettings(): void
    {
        $hero = WheelModel::query()->where('slug', self::HERO_SLUG)->value('id');

        if ($hero === null) {
            return;
        }

        $chosen = Setting::get('hero_product_id');

        if (is_int($chosen) || (is_string($chosen) && ctype_digit($chosen))) {
            $current = WheelModel::query()->find((int) $chosen);

            if ($current !== null && ! $current->is_demo) {
                return;
            }
        }

        Setting::set('hero_product_id', (int) $hero);
    }

    /**
     * The guides the homepage links to (H10). The articles live in
     * database/seeders/content/ratgeber.php as data, each with its own status: a guide that the
     * legal review has not cleared is seeded as a draft, which the Ratgeber route answers with a
     * 404 and the homepage leaves out. A lead block carries the teaser and the reading time, and
     * each section is one `prose` block of a heading and its paragraphs.
     */
    private function seedGuides(): void
    {
        $file = __DIR__.'/content/ratgeber.php';

        if (! is_file($file)) {
            return;
        }

        /** @var list<array{slug: string, status: 'published'|'draft', title: string, teaser: string, minutes: int, meta_description?: string, blocks: list<array{heading: string, text: string}>}> $guides */
        $guides = require $file;

        foreach ($guides as $guide) {
            $page = $this->page($guide['slug'], 'guide', $guide['title'], $guide['status']);

            if (isset($guide['meta_description'])) {
                DB::table('pages')->where('id', $page)->update(['meta_description' => $guide['meta_description']]);
            }

            $this->block($page, 'guide_lead', 0, [
                'teaser' => $guide['teaser'],
                'minutes' => $guide['minutes'],
            ]);

            // Prose blocks are keyed by their position: `block()` upserts by type, and an article
            // has several of the same type.
            DB::table('page_blocks')->where('page_id', $page)->where('type', 'prose')->delete();

            foreach ($guide['blocks'] as $index => $block) {
                DB::table('page_blocks')->insert([
                    'page_id' => $page,
                    'type' => 'prose',
                    'sort_order' => 10 + $index * 10,
                    'data' => json_encode(['heading' => $block['heading'], 'text' => $block['text']], JSON_THROW_ON_ERROR),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ------------------------------------------------------------------
    // Navigation
    // ------------------------------------------------------------------

    private function seedNavItems(): void
    {
        /*
         * `Felgen suchen` is the one item whose destination depends on session state — the selector
         * page with no vehicle, the listing with one. `route_name` therefore holds the no-vehicle
         * fallback and `behaviour` tells the resolver it may swap to the listing; neither the header
         * component nor a second nav row knows anything about it.
         */
        $this->menu('header', [
            ['label' => 'Felgen', 'route_name' => 'felgen.index'],
            ['label' => 'RIMIFY-Check', 'route_name' => 'check.index'],
            ['label' => 'FAQ', 'route_name' => 'faq'],
            ['label' => 'Kontakt', 'route_name' => 'kontakt'],
        ]);

        // The footer's first two columns: the shop, and the help around it.
        $this->menu('footer_shop', [
            ['label' => 'Alle Felgen', 'route_name' => 'felgen.index'],
            ['label' => 'Fahrzeug wählen', 'route_name' => 'felgen.suchen'],
            ['label' => 'RIMIFY-Check', 'route_name' => 'check.index'],
        ]);

        $this->menu('footer_service', [
            ['label' => 'Fragen und Antworten', 'route_name' => 'faq'],
            ['label' => 'Kontakt', 'route_name' => 'kontakt'],
            ['label' => 'Versand', 'href' => '/rechtliches/versand'],
        ]);

        /*
         * Footer column 3, beneath `RECHTLICHES`. These address a page by slug rather than by route,
         * so they carry an `href` — `nav_items` has no column for route parameters and inventing one
         * would buy nothing. The prefix matters: the legal pages live under /rechtliches/{slug}, and
         * a bare /impressum is a 404 — the one link a German shop may not break (§5 DDG).
         */
        $this->menu('footer_legal', [
            ['label' => 'Impressum', 'href' => '/rechtliches/impressum'],
            ['label' => 'Datenschutz', 'href' => '/rechtliches/datenschutz'],
            ['label' => 'AGB', 'href' => '/rechtliches/agb'],
            ['label' => 'Widerrufsbelehrung', 'href' => '/rechtliches/widerrufsbelehrung'],
        ]);

        /*
         * The phone's bottom bar is exactly five items, so the order is load-bearing rather than
         * editorial. Icons are keys from the icon set. Kontakt carries the envelope: e-mail is the
         * shop's one channel, and a handset would promise a phone line it does not have (D5).
         */
        $this->menu('mobile_bottom', [
            ['label' => 'Start', 'route_name' => 'startseite', 'icon' => 'home'],
            ['label' => 'Felgen', 'route_name' => 'felgen.index', 'icon' => 'wheel'],
            ['label' => 'Check', 'route_name' => 'check.index', 'icon' => 'check-circle'],
            ['label' => 'Kontakt', 'route_name' => 'kontakt', 'icon' => 'mail'],
            ['label' => 'Warenkorb', 'route_name' => 'warenkorb.index', 'icon' => 'cart'],
        ]);
    }

    // ------------------------------------------------------------------
    // FAQ
    // ------------------------------------------------------------------

    /**
     * Each entry carries its own `published` flag, written on every run: an answer that must not be
     * shown yet stays unpublished even after a re-seed, instead of being switched back on by it.
     */
    private function seedFaqEntries(): void
    {
        $sort = 0;

        foreach (self::FAQ as $entry) {
            $this->upsert('faq_entries', ['question_de' => $entry['question']], [
                'group_key' => $entry['group'],
                'answer_de' => $entry['answer'],
                'sort_order' => $sort += 10,
                'published' => $entry['published'],
            ]);
        }
    }

    // ------------------------------------------------------------------
    // Pages
    // ------------------------------------------------------------------

    private function seedHomepage(): void
    {
        // The spec names the route but never a page title, so the title is the route's own German
        // name — a label for the admin list, not a string any customer reads.
        $page = $this->page('startseite', 'marketing', 'Startseite');

        // `hero`: eyebrow, two-part headline, sub. The selector card inside the hero is a component,
        // not content — its labels are shared with felgen-suchen and are not marketing's to edit.
        $this->block($page, 'hero', 10, [
            'headline' => 'Felgen, die an dein Auto dürfen.',
            'sub' => 'Wir zeigen dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt – mit den zulässigen Reifengrößen und allen Auflagen. Du gibst dein Auto an, wir prüfen den Rest.',
            // The phone document has room for one sentence.
            'sub_mobile' => 'Nur Felgen, deren Gutachten dein Fahrzeug nennt – mit Reifengrößen und Auflagen.',
        ]);

        /*
         * `promise_row`: the client's four titles with one line each. The lines are ours, so they
         * add nothing the title does not already say: no PDF, no dispatch time, no in-house
         * workshop (docs/client-questions.md items 7–9, ACCURACY D7). A line changes when the
         * client confirms more, not before.
         */
        $this->block($page, 'promise_row', 15, [
            'items' => [
                ['icon' => 'check', 'title' => 'Garantierte Passgenauigkeit', 'text' => 'Jede Felge, die wir dir zeigen, steht mit deinem Fahrzeug im Gutachten.'],
                ['icon' => 'document', 'title' => 'Gutachten zu jeder Felge', 'text' => 'Bei jeder Felge siehst du, welches Gutachten sie für dein Fahrzeug freigibt.'],
                ['icon' => 'wrench', 'title' => 'Montiert und gewuchtet', 'text' => 'Kompletträder kommen fertig montiert und gewuchtet bei dir an.'],
                ['icon' => 'truck', 'title' => 'Express-Versand aus Deutschland', 'text' => 'Wir versenden direkt aus Deutschland.'],
            ],
        ]);
    }

    private function seedFaqPage(): void
    {
        $page = $this->page('faq', 'faq', 'Meistgestellte Fragen');

        // `faq_list`: the chrome around the accordions. `groups` fixes the order of the two
        // micro-labels; the rows themselves are `faq_entries`, keyed by `group_key`.
        $this->block($page, 'faq_list', 10, [
            'heading' => 'Meistgestellte Fragen',
            'search_placeholder' => 'Suchen',
            'groups' => ['KOMPATIBILITÄT & FREIGABE', 'BESTELLUNG & VERSAND'],
        ]);
    }

    /**
     * The Kontakt page is a page row and nothing more: its e-mail block renders from config (D-023)
     * and there is no form to describe (ACCURACY D5).
     */
    private function seedContactPage(): void
    {
        // The spec gives the two column headings but no page title; the nav label is the only name
        // the page has.
        $this->page('kontakt', 'marketing', 'Kontakt');
    }

    /**
     * The five legal pages: real title, placeholder body, nothing drafted (D-024).
     *
     * They are published rather than left in draft because the footer links to all five and a 404
     * on the Impressum is worse than a page that says plainly which text is still outstanding. The
     * marker is what makes publishing honest — remove it and the page starts lying.
     *
     * The sources supply no sub-headings for these pages, so each carries exactly one section, named
     * after the page. When the Kanzlei delivers a structure, each heading becomes its own block.
     */
    private function seedLegalPages(): void
    {
        foreach (self::LEGAL_PAGES as $slug => $title) {
            $page = $this->page($slug, 'legal', $title);

            // `legal_body`: one heading plus its body text, rendered at a 68-character measure.
            $this->block($page, 'legal_body', 10, [
                'heading' => $title,
                'text' => '[Rechtstext folgt von der Kanzlei — Abschnitt: '.$title.']',
                'placeholder' => true,
            ]);
        }
    }

    /**
     * Remove the blocks this seeder no longer writes (ACCURACY #25).
     *
     * No page rendered them, and they held what must not come back by accident: the old phone and
     * WhatsApp numbers and 18:00 hours, a reply-time promise, the "Danke – deine Nachricht ist bei
     * uns" of a form that sent nothing, a dispatch time and a carrier, "Anbauset und ABE", a
     * download that does not exist, a stock figure, a dated bestseller claim and real brand
     * wordmarks. Only these page/type pairs are removed; any other block an editor adds stays.
     */
    private function retireBlocks(): void
    {
        foreach (self::RETIRED_BLOCKS as $slug => $types) {
            $page = DB::table('pages')->where('slug', $slug)->value('id');

            if ($page === null) {
                continue;
            }

            DB::table('page_blocks')->where('page_id', $page)->whereIn('type', $types)->delete();
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * @param  list<array{label: string, href?: string, route_name?: string, behaviour?: string, icon?: string}>  $items
     */
    private function menu(string $menu, array $items): void
    {
        foreach ($items as $index => $item) {
            $this->upsert('nav_items', ['menu' => $menu, 'label' => $item['label']], [
                'href' => $item['href'] ?? null,
                'route_name' => $item['route_name'] ?? null,
                'behaviour' => $item['behaviour'] ?? null,
                'icon' => $item['icon'] ?? null,
                // Gaps of ten so an item can be dropped between two without a renumbering migration.
                'sort_order' => ($index + 1) * 10,
                'visible' => true,
            ]);
        }

        // The list above is the whole menu. Rows are keyed on their label, so a renamed item would
        // otherwise survive under its old name and appear twice; anything no longer listed goes.
        DB::table('nav_items')
            ->where('menu', $menu)
            ->whereNotIn('label', array_column($items, 'label'))
            ->delete();
    }

    /**
     * Upsert a page on its slug and return its id.
     *
     * @param  'published'|'draft'  $status
     */
    private function page(string $slug, string $kind, string $title, string $status = 'published'): int
    {
        $this->upsert('pages', ['slug' => $slug], [
            'locale' => 'de',
            'kind' => $kind,
            'title' => $title,
            'status' => $status,
            // `meta_title` and `meta_description` are deliberately absent: the spec carries no SEO
            // copy, an invented one would become the search-result snippet, and writing NULL here
            // would erase whatever an editor has since put there.
        ]);

        // Stamped once. A re-seed must not move a publication date that an editor may be reading.
        DB::table('pages')
            ->where('slug', $slug)
            ->whereNull('published_at')
            ->update(['published_at' => now()]);

        return (int) DB::table('pages')->where('slug', $slug)->value('id');
    }

    /**
     * A block is identified by its page and its type — no page here repeats a type, and keying on
     * position instead would rewrite a block's meaning whenever the order changed.
     *
     * @param  array<string, mixed>  $data
     */
    private function block(int $pageId, string $type, int $sortOrder, array $data): void
    {
        $this->upsert('page_blocks', ['page_id' => $pageId, 'type' => $type], [
            'sort_order' => $sortOrder,
            // Unescaped unicode so the German stays readable in a `SELECT data` during support work.
            'data' => json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    }

    /**
     * Insert or update on a natural key, preserving `created_at` on re-runs.
     *
     * @param  array<string, string|int>  $key
     * @param  array<string, mixed>  $values
     */
    private function upsert(string $table, array $key, array $values): void
    {
        $now = now();

        if (DB::table($table)->where($key)->exists()) {
            DB::table($table)->where($key)->update($values + ['updated_at' => $now]);

            return;
        }

        DB::table($table)->insert($key + $values + ['created_at' => $now, 'updated_at' => $now]);
    }

    /**
     * Slug => title. Slugs are the German titles; the spec names the tabs but no URLs.
     */
    private const LEGAL_PAGES = [
        'impressum' => 'Impressum',
        'datenschutz' => 'Datenschutz',
        'agb' => 'AGB',
        'widerrufsbelehrung' => 'Widerrufsbelehrung',
        'versand' => 'Versand',
    ];

    /**
     * Page slug => the block types this seeder once wrote there and has retired (see retireBlocks).
     *
     * @var array<string, list<string>>
     */
    public const RETIRED_BLOCKS = [
        'startseite' => [
            'trust_strip', 'brand_strip', 'brand_showcase', 'make_grid', 'product_rail',
            'check_promo', 'feature_panels', 'package_compare', 'faq_teaser',
        ],
        'faq' => ['help_card'],
        'kontakt' => ['contact_form', 'contact_info'],
    ];

    /**
     * The questions in display order, each with its own `published` flag.
     *
     * Q3's quotes are `„` U+201E opening and a straight `"` U+0022 closing — that is what both
     * artifacts contain, and "fixing" it to a typographic `"` would be a change to client copy.
     *
     * What changed in the accuracy pass (docs/reviews/client-answers-audit.json):
     * - the range is the client's two categories, Felgen without tyres or Kompletträder (#16/#65);
     * - several variants under one key number differ in top speed, not in power (research H10);
     * - the Komplettrad answer promises no Ventile, Anbauset or ABE (#20);
     * - the delivery answer is unpublished until the client confirms lead times (#31/#69), and its
     *   text promises no time and no delivery date in the Warenkorb;
     * - the return answer states no law and only points to the Widerrufsbelehrung (#26/#63).
     *
     * @var list<array{group: string, question: string, answer: string, published: bool}>
     */
    public const FAQ = [
        [
            'group' => 'KOMPATIBILITÄT & FREIGABE',
            'question' => 'Was ist RIMIFY?',
            'answer' => 'RIMIFY ist ein Felgenshop für den deutschen Markt. Du gibst dein Fahrzeug an, wir zeigen dir ausschließlich Felgen, die für genau dieses Fahrzeug eine gültige Freigabe haben. Du bekommst sie ohne Reifen oder als Komplettrad – mit Reifen, fertig montiert und gewuchtet.',
            'published' => true,
        ],
        [
            'group' => 'KOMPATIBILITÄT & FREIGABE',
            'question' => 'Woher weiß ich, ob eine Felge zu meinem Auto passt?',
            'answer' => 'Sobald du dein Fahrzeug gewählt hast, prüfen wir jede Felge gegen das zugehörige Gutachten – Felgenbreite, Einpresstiefe, zulässige Reifengrößen und Auflagen. Was dir angezeigt wird, ist freigegeben. Einzelne Kombinationen kannst du jederzeit über RIMIFY-CHECK nachprüfen.',
            'published' => true,
        ],
        [
            'group' => 'KOMPATIBILITÄT & FREIGABE',
            'question' => 'Was bedeutet „Eintragung erforderlich"?',
            'answer' => 'Bei manchen Felgen verlangt das Gutachten, dass die Änderung von einer amtlich anerkannten Prüfstelle abgenommen und in die Fahrzeugpapiere eingetragen wird. Wir weisen darauf hin, bevor du die Felge in den Warenkorb legst – und du kannst gezielt nach Felgen ohne Eintragungspflicht filtern.',
            'published' => true,
        ],
        [
            'group' => 'KOMPATIBILITÄT & FREIGABE',
            'question' => 'Wo finde ich HSN und TSN in meinen Fahrzeugpapieren?',
            'answer' => 'In der Zulassungsbescheinigung Teil I stehen sie in den Feldern 2.1 (HSN, vierstellig) und 2.2 (TSN, dreistellig). Im älteren Fahrzeugschein stehen dieselben Nummern an anderer Stelle – beide Varianten zeigen wir dir in der Fahrzeugauswahl.',
            'published' => true,
        ],
        [
            'group' => 'KOMPATIBILITÄT & FREIGABE',
            'question' => 'Was ist, wenn zu meiner Schlüsselnummer mehrere Fahrzeuge angezeigt werden?',
            'answer' => 'Das ist normal. Eine Kombination aus HSN und TSN kann mehrere Varianten umfassen, die sich in Bauzeitraum, Höchstgeschwindigkeit oder Achslast unterscheiden. Wir fragen dann kurz nach, weil genau diese Unterschiede darüber entscheiden, welche Reifen zulässig sind.',
            'published' => true,
        ],
        [
            'group' => 'BESTELLUNG & VERSAND',
            'question' => 'Was ist ein Komplettrad und was ist enthalten?',
            'answer' => 'Ein Komplettrad ist eine Felge mit aufgezogenem und gewuchtetem Reifen. Welches Gutachten dazugehört und ob eine Eintragung nötig ist, steht bei jeder Felge.',
            'published' => true,
        ],
        [
            'group' => 'BESTELLUNG & VERSAND',
            'question' => 'Wie lange dauert die Lieferung?',
            'answer' => 'Die Lieferzeit hängt von Felge und Ausführung ab. Frag uns gern vorher per E-Mail.',
            // Unpublished until the client confirms the lead times (docs/client-questions.md item 9).
            'published' => false,
        ],
        [
            'group' => 'BESTELLUNG & VERSAND',
            'question' => 'Kann ich Felgen zurückgeben?',
            'answer' => 'Was bei Widerruf und Rückgabe gilt, steht in unserer Widerrufsbelehrung – der Link steht unten auf jeder Seite.',
            'published' => true,
        ],
    ];
}
