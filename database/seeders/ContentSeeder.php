<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Navigation, FAQ and the marketing and legal pages — as data, not as markup.
 *
 * Every string below is copy the client owns and will want to change: the homepage sections, the
 * four menus, the questions. Hard-coding them into a Blade template or a Vue SFC would mean that
 * renaming a menu item or swapping a bestseller heading needs a developer, a review and a deploy.
 * Holding them in `pages` / `page_blocks` / `nav_items` means marketing edits them in the admin
 * panel and the change is live. That is the whole point of the block CMS, and the reason
 * `nav_items.behaviour` carries the conditional *Felgen suchen* rule instead of a branch inside a
 * component.
 *
 * Two things deliberately do NOT live here:
 *
 * - **Legal body text.** Impressum, Datenschutz, AGB, Widerrufsbelehrung and Versand ship with the
 *   real heading and a visibly marked placeholder (D-024). Drafting German legal text is a Kanzlei's
 *   job; a plausible-looking invented Impressum is the constitution's "confidently wrong" in its
 *   most expensive form.
 * - **Contact details.** Phone, e-mail and opening hours are read from `config('rimify.contact')`
 *   (D-023) — the sources carried two different numbers, so there is now exactly one place to fix.
 *
 * Copy is transcribed character for character from the approved German copy, including `·`, `–`,
 * `→` and the mixed quote pair in Q3. Where the two copy sources disagreed on an answer, D-022
 * applies and the Copy Pack's longer wording wins (Q2, Q3, Q6, Q7, Q8).
 *
 * Re-runnable: every row is matched on its natural key, so a second run updates and never doubles.
 */
class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedNavItems();
        $this->seedFaqEntries();
        $this->seedHomepage();
        $this->seedFaqPage();
        $this->seedContactPage();
        $this->seedLegalPages();
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
         * editorial. Icons are keys from the icon set.
         */
        $this->menu('mobile_bottom', [
            ['label' => 'Start', 'route_name' => 'startseite', 'icon' => 'home'],
            ['label' => 'Felgen', 'route_name' => 'felgen.index', 'icon' => 'wheel'],
            ['label' => 'Check', 'route_name' => 'check.index', 'icon' => 'check-circle'],
            ['label' => 'Kontakt', 'route_name' => 'kontakt', 'icon' => 'phone'],
            ['label' => 'Warenkorb', 'route_name' => 'warenkorb.index', 'icon' => 'cart'],
        ]);
    }

    // ------------------------------------------------------------------
    // FAQ
    // ------------------------------------------------------------------

    private function seedFaqEntries(): void
    {
        $sort = 0;

        foreach (self::FAQ as [$group, $question, $answer]) {
            $this->upsert('faq_entries', ['question_de' => $question], [
                'group_key' => $group,
                'answer_de' => $answer,
                'sort_order' => $sort += 10,
                'published' => true,
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
            'eyebrow' => 'RIMIFY-CHECK · FREIGABE GEPRÜFT',
            'headline' => 'Felgen, die zu deinem Auto passen.',
            // Rendered on its own line in #8FA6FF. Kept as a second field because the accent colour
            // applies to this half only; concatenating would lose that.
            'headline_accent' => 'Garantiert.',
            'sub' => 'Wähle dein Fahrzeug – wir zeigen dir nur Felgen, die dafür freigegeben sind.',
        ]);

        // `trust_strip`: ordered short promises pinned inside the hero's bottom edge.
        $this->block($page, 'trust_strip', 20, [
            'items' => [
                'Über 150 Modelle auf Lager',
                'Gutachten zu jeder Felge',
                'Versand aus Deutschland',
                'Komplettrad montiert & gewuchtet',
            ],
        ]);

        // `brand_strip`: wordmarks only, in display order.
        $this->block($page, 'brand_strip', 30, [
            'items' => ['BBS', 'YIDO', 'BORBET', 'OZ RACING', 'ALUTEC', 'rotiform'],
        ]);

        // `brand_showcase`: heading plus the two strings every brand card repeats. The brands
        // themselves come from the catalogue, so only the chrome is content.
        $this->block($page, 'brand_showcase', 40, [
            'heading' => 'Entdecke die beliebtesten Felgenmarken',
            'stock_line' => 'Über 150 Modelle auf Lager und sofort lieferbar',
            'cta_label' => 'Felgen ansehen →',
        ]);

        // `make_grid`: heading and the quiet link under the manufacturer tiles.
        $this->block($page, 'make_grid', 50, [
            'heading' => 'Auto wählen, garantiert passende Felge finden',
            'link_label' => 'Alle Marken anzeigen →',
        ]);

        // `product_rail`: heading and link for a row of product cards; the products are queried.
        $this->block($page, 'product_rail', 60, [
            'heading' => 'Bestseller aus Mai 2026',
            'link_label' => 'Alle Felgen ansehen →',
        ]);

        /*
         * `check_promo`: the RIMIFY-CHECK explainer. `example` is the illustrative verdict drawn in
         * the Figma — it is a picture of a result, never a live query, which is why it is copy.
         */
        $this->block($page, 'check_promo', 70, [
            'heading' => 'Dein Vorteil:',
            'heading_accent' => 'RIMIFY-CHECK',
            'body' => 'Mit RIMIFY CHECK prüfen wir die Kompatibilität zwischen Fahrzeug und Felge. So kannst du sicher sein, dass deine Wunschfelge zu deinem Fahrzeug passt und zugelassen ist.',
            'example' => [
                'rows' => [
                    ['micro_label' => 'FAHRZEUG', 'value' => 'BMW M4 F82'],
                    ['micro_label' => 'FELGE', 'value' => 'Wheelforce CF.3'],
                ],
                'verdict_line' => 'Freigegeben – keine Eintragung erforderlich',
            ],
            'cta_label' => 'RIMIFY-CHECK',
        ]);

        // `feature_panels`: heading plus a list of {heading, body} — three today, editable to more.
        $this->block($page, 'feature_panels', 80, [
            'heading' => 'Warum RIMIFY?',
            'items' => [
                [
                    'heading' => 'Geprüfte Freigabe, kein Risiko',
                    'body' => 'Jede Felge, die wir dir zeigen, ist für dein Fahrzeug durch ein Gutachten freigegeben. Auflagen nennen wir im Klartext – vor dem Kauf, nicht danach. Das Gutachten kannst du auf jeder Produktseite herunterladen.',
                ],
                [
                    'heading' => 'Komplettrad, fertig montiert',
                    'body' => 'Auf Wunsch ziehen wir die Reifen auf und wuchten die Räder bei uns im Haus. Du bekommst fertige Räder inklusive Ventilen, Anbauset und ABE – auspacken, anschrauben, losfahren.',
                ],
                [
                    'heading' => 'Versand aus Deutschland',
                    'body' => 'Über 150 Modelle liegen bei uns auf Lager. Bestellungen bis 14 Uhr gehen am selben Werktag raus, versichert mit DHL. Fragen beantworten wir am Telefon, nicht per Formularbrief.',
                ],
            ],
        ]);

        // `package_compare`: two option blocks of check rows; `recommended` drives the EMPFOHLEN
        // pill, the --wash fill and the blue border, so exactly one option should carry it.
        $this->block($page, 'package_compare', 90, [
            'heading' => 'Dein Felgenpaket',
            'options' => [
                [
                    'micro_label' => 'LIEFERUNG',
                    'heading' => null,
                    'recommended' => false,
                    'items' => ['Felgen', 'inkl. Anbauset & ABE'],
                ],
                [
                    'micro_label' => 'EMPFOHLEN',
                    'heading' => 'Komplettrad',
                    'recommended' => true,
                    'items' => [
                        'inkl. Montage der Reifen auf die Felgen',
                        'inkl. Wuchten',
                        'inkl. Ventile & Gewichte',
                    ],
                ],
            ],
            'cta_label' => 'Jetzt Auto wählen und passende Felgen finden',
        ]);

        // `faq_teaser`: pulls the first `limit` published entries rather than duplicating them, so
        // an answer edited in the FAQ panel changes on the homepage too.
        $this->block($page, 'faq_teaser', 100, [
            'heading' => 'Meistgestellte Fragen',
            'limit' => 5,
            'help_card' => $this->helpCard(
                'Weitere Fragen oder Unterstützung benötigt?',
                null,
                'Zum Kontaktformular',
            ) + ['closing_line' => 'Wir freuen uns von dir zu hören.'],
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

        // `help_card`: the sticky contact card that replaces the Figma's stock illustration.
        $this->block($page, 'help_card', 20, $this->helpCard(
            'Nicht gefunden, was du suchst?',
            'Schreib uns – wir antworten meist am selben Werktag.',
            'RIMIFY-CHECK öffnen',
        ) + ['promo_heading' => 'Kompatibilität sofort prüfen']);
    }

    private function seedContactPage(): void
    {
        // The spec gives the two column headings but no page title; the nav label is the only name
        // the page has.
        $page = $this->page('kontakt', 'marketing', 'Kontakt');

        // `contact_form`: labels and the post-submit state. Field *names* are the Form Request's
        // business; only what the customer reads is content.
        $this->block($page, 'contact_form', 10, [
            'heading' => 'Sende uns eine Nachricht',
            'fields' => [
                'Vollständiger Name*',
                'Firma',
                'E-Mail*',
                'Telefon',
                'Nachricht*',
            ],
            'required_note' => 'Pflichtfelder mit * markiert.',
            'security_micro_label' => 'SICHERHEITSPRÜFUNG',
            'submit_label' => 'Senden',
            'success' => [
                'heading' => 'Danke – deine Nachricht ist bei uns.',
                'sub' => 'Wir melden uns meist am selben Werktag.',
                'action_label' => 'Weitere Nachricht senden',
            ],
        ]);

        // `contact_info`: the right-hand column. The values come from config (D-023) so that this
        // page, the footer, the help cards and the order mails can never drift apart again.
        $this->block($page, 'contact_info', 20, [
            'heading' => 'Kontaktiere uns',
            'intro' => 'Fragen zur Passgenauigkeit, zu einer Bestellung oder zu einem Gutachten? Schreib uns oder ruf einfach an – wir antworten in der Regel noch am selben Werktag.',
            'email' => config('rimify.contact.email'),
            'phone' => config('rimify.contact.phone'),
            'hours' => config('rimify.contact.hours'),
            'closing_line' => 'Wir freuen uns von dir zu hören.',
            'links' => [
                ['label' => 'Impressum', 'href' => '/impressum'],
                ['label' => 'Datenschutz', 'href' => '/datenschutz'],
                ['label' => 'Versandinformationen', 'href' => '/versand'],
            ],
        ]);
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

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * The contact card shared by the homepage FAQ section and the FAQ page.
     *
     * Same shape, same source: never a literal number in a seeder, a Blade file or an SFC.
     *
     * @return array<string, mixed>
     */
    private function helpCard(string $heading, ?string $sub, string $ctaLabel): array
    {
        return [
            'heading' => $heading,
            'sub' => $sub,
            'rows' => [
                [
                    'icon' => 'phone',
                    'value' => config('rimify.contact.phone_intl'),
                    'label' => config('rimify.contact.hours'),
                ],
                [
                    'icon' => 'whatsapp',
                    'value' => config('rimify.contact.whatsapp'),
                    'label' => 'WhatsApp',
                ],
            ],
            'cta_label' => $ctaLabel,
        ];
    }

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
     */
    private function page(string $slug, string $kind, string $title): int
    {
        $this->upsert('pages', ['slug' => $slug], [
            'locale' => 'de',
            'kind' => $kind,
            'title' => $title,
            'status' => 'published',
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
     * [group, question, answer] in display order.
     *
     * Q3's quotes are `„` U+201E opening and a straight `"` U+0022 closing — that is what both
     * artifacts contain, and "fixing" it to a typographic `"` would be a change to client copy.
     */
    private const FAQ = [
        [
            'KOMPATIBILITÄT & FREIGABE',
            'Was ist RIMIFY?',
            'RIMIFY ist ein Felgenshop für den deutschen Markt. Du gibst dein Fahrzeug an, wir zeigen dir ausschließlich Felgen, die für genau dieses Fahrzeug eine gültige Freigabe haben. Reifen und fertig montierte Kompletträder bekommst du auf Wunsch dazu.',
        ],
        [
            'KOMPATIBILITÄT & FREIGABE',
            'Woher weiß ich, ob eine Felge zu meinem Auto passt?',
            'Sobald du dein Fahrzeug gewählt hast, prüfen wir jede Felge gegen das zugehörige Gutachten – Felgenbreite, Einpresstiefe, zulässige Reifengrößen und Auflagen. Was dir angezeigt wird, ist freigegeben. Einzelne Kombinationen kannst du jederzeit über RIMIFY-CHECK nachprüfen.',
        ],
        [
            'KOMPATIBILITÄT & FREIGABE',
            'Was bedeutet „Eintragung erforderlich"?',
            'Bei manchen Felgen verlangt das Gutachten, dass die Änderung von einer amtlich anerkannten Prüfstelle abgenommen und in die Fahrzeugpapiere eingetragen wird. Wir weisen darauf hin, bevor du die Felge in den Warenkorb legst – und du kannst gezielt nach Felgen ohne Eintragungspflicht filtern.',
        ],
        [
            'KOMPATIBILITÄT & FREIGABE',
            'Wo finde ich HSN und TSN in meinen Fahrzeugpapieren?',
            'In der Zulassungsbescheinigung Teil I stehen sie in den Feldern 2.1 (HSN, vierstellig) und 2.2 (TSN, dreistellig). Im älteren Fahrzeugschein stehen dieselben Nummern an anderer Stelle – beide Varianten zeigen wir dir in der Fahrzeugauswahl.',
        ],
        [
            'KOMPATIBILITÄT & FREIGABE',
            'Was ist, wenn zu meiner Schlüsselnummer mehrere Fahrzeuge angezeigt werden?',
            'Das ist normal. Eine Kombination aus HSN und TSN kann mehrere Varianten umfassen, die sich in Bauzeitraum, Leistung oder Achslast unterscheiden. Wir fragen dann kurz nach, weil genau diese Unterschiede darüber entscheiden, welche Reifen zulässig sind.',
        ],
        [
            'BESTELLUNG & VERSAND',
            'Was ist ein Komplettrad und was ist enthalten?',
            'Ein Komplettrad ist eine Felge mit bereits aufgezogenem und gewuchtetem Reifen. Enthalten sind Montage, Wuchten, Ventile, Anbauset und ABE. Du musst die Räder nur noch anschrauben.',
        ],
        [
            'BESTELLUNG & VERSAND',
            'Wie lange dauert die Lieferung?',
            'Lagerware verlässt unser Haus in der Regel innerhalb von ein bis zwei Werktagen, Kompletträder innerhalb von zwei bis vier Werktagen, da sie montiert und gewuchtet werden. Das voraussichtliche Lieferdatum siehst du im Warenkorb.',
        ],
        [
            'BESTELLUNG & VERSAND',
            'Kann ich Felgen zurückgeben?',
            'Ja. Es gilt das gesetzliche Widerrufsrecht von 14 Tagen. Montierte und gefahrene Kompletträder können wir nur zurücknehmen, wenn sie unbeschädigt und unbenutzt sind. Melde dich einfach vorher kurz bei uns.',
        ],
    ];
}
