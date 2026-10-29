<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Models\Page;
use App\Services\Storage\StorageSettings;
use App\Support\HeroPhotos;

/**
 * What each editable page holds, field by field — the one place the limits live.
 *
 * The editor's counters, the server's validation and the publish check all read these numbers, so
 * the panel can never accept a text the layout cannot hold (BRIEF-2 §1, "guard rails"). A field is
 * here only if the storefront prints it: `meta_title` is printed nowhere and is therefore not a
 * field, and the FAQ and Kontakt pages, whose blocks no template reads, are not editable pages.
 *
 * Content travels in one shape everywhere — the draft, a revision, the preview, the request:
 *
 *     ['title' => string, 'metaDescription' => string, 'blocks' => list<['type' => string, 'data' => array]>]
 *
 * Blocks come in schema order: every fixed block once, then the page's repeatable sections.
 *
 * A field's `kind` is text, textarea, number, icon or choice — and for an article's building blocks (D-306) `image` (the
 * picture's address in our storage, its `width` and `height` kept beside it) and `grid` (a table: `head`, the column
 * headings, and `rows`, each as many cells as there are headings).
 *
 * After the fixed blocks a page holds its repeatable ones in any order; each type keeps its own bounds, named with
 * `one` and `many` („einen Abschnitt“, „Abschnitte“).
 *
 * @phpstan-type Field array{key: string, label: string, kind: string, required: bool, max: int|null, min?: int, help?: string, options?: list<array{value: string, label: string}>, default?: string}
 * @phpstan-type ItemList array{key: string, label: string, itemLabel: string, one: string, min: int, max: int, fields: list<Field>}
 * @phpstan-type Block array{type: string, label: string, repeat: bool, min: int, max: int, fields: list<Field>, list?: ItemList, one?: string, many?: string}
 * @phpstan-type Schema array{page: list<Field>, blocks: list<Block>}
 * @phpstan-type Content array{title: string, metaDescription: string, blocks: list<array{type: string, data: array<string, mixed>}>}
 */
final class PageSchema
{
    /** A table's bounds (D-306): enough for a size chart, never a spreadsheet the article's measure cannot hold. */
    public const COLUMNS_MIN = 2;

    public const COLUMNS_MAX = 6;

    public const ROWS_MAX = 30;

    public const CELL_MAX = 200;

    /** An HTML-Abschnitt's length as typed (D-352): room for a long table, never a page pasted whole. */
    public const HTML_MAX = 20000;

    /** What the HTML-Abschnitt keeps, said under its field — ArticleHtml's list in words. */
    public const HTML_HELP = 'Erlaubt sind Zwischenüberschriften (h2 bis h4), Absätze, Zeilenumbrüche, Listen, Tabellen (table, thead, tbody, tr, th, td), '
        .'Links (http, https, mailto oder eine Seite dieses Shops), Bilder aus unserem Speicher mit Bildbeschreibung (alt), fett und kursiv. '
        .'Alles andere – Skripte, Frames, Stile, Ereignis-Attribute – entfernt das Speichern.';

    /** A picture from our own storage only (ArticleBlocks reads the same): no request to another site from an article. */
    public const OWN_IMAGE = '#^(/storage/|https://[a-z0-9.-]+\.amazonaws\.com/)#i';

    /**
     * Whether a picture's address is our storage's: the site's own disk or the bucket, and the public base the bucket
     * is read from where one is set under Einstellungen › Medien und Speicher — a CDN (SEI-26). What SeitenController::
     * image answers, this accepts.
     */
    public static function ownImage(string $src): bool
    {
        if (preg_match(self::OWN_IMAGE, $src) === 1) {
            return true;
        }

        $storage = app(StorageSettings::class)->current();

        return $storage->isBucket() && str_starts_with($src, $storage->publicBase().'/');
    }

    /**
     * The promise row's glyphs, from the storefront's own icon set (resources/js/icons), each with
     * the word a person would use for it.
     */
    public const PROMISE_ICONS = [
        'check' => 'Haken',
        'document' => 'Dokument',
        'shield' => 'Schild',
        'wrench' => 'Werkzeug',
        'truck' => 'Lieferwagen',
        'clock' => 'Uhr',
        'car' => 'Auto',
        'wheel' => 'Felge',
        'box' => 'Paket',
        'lock' => 'Schloss',
        'mail' => 'Brief',
        'info' => 'Info',
    ];

    /**
     * The schema for a page, or null when the page is not one the panel edits.
     *
     * @return Schema|null
     */
    public static function for(Page $page): ?array
    {
        if (! $page->isEditable()) {
            return null;
        }

        return match ($page->kind) {
            Page::KIND_GUIDE => self::guide(),
            Page::KIND_LEGAL => self::legal(),
            default => self::home(),
        };
    }

    /**
     * The homepage: the hero's words and the promise row. Its title is the shop's name in the tab
     * and is not edited here.
     *
     * Limits: the headline is set in the display size and wraps to three lines of about twenty
     * characters on a phone; the sub-line sits under it in two to four lines at desktop width; the
     * promise row holds four columns from 1024 px, so four promises and short lines.
     *
     * @return Schema
     */
    private static function home(): array
    {
        return [
            'page' => [],
            'blocks' => [
                [
                    'type' => 'hero',
                    'label' => 'Einstieg',
                    'repeat' => false,
                    'min' => 1,
                    'max' => 1,
                    'fields' => [
                        self::text('headline', 'Überschrift', 60, true),
                        self::textarea('sub', 'Text unter der Überschrift', 220, true),
                        // Required: the phone has room for one sentence above the vehicle selector,
                        // so it never falls back to the longer one (Startseite/Mobile.vue).
                        self::textarea('sub_mobile', 'Kürzerer Text für das Handy', 110, true, 'Steht auf dem Handy statt des Texts darüber. Dort ist Platz für einen Satz.'),
                        // The brand's photograph (PROTECTED.md P1, the operator's brief of 05.10.2026 §2): a brand
                        // asset, there with or without a catalogue — never a product row.
                        self::choice('foto', 'Foto', HeroPhotos::options(), HeroPhotos::DEFAULT, 'Steht im Einstieg, auch wenn der Katalog leer ist. Die Maße erscheinen daran, sobald die gezeigte Felge veröffentlicht ist und mindestens eine Größe hat.'),
                    ],
                ],
                [
                    'type' => 'promise_row',
                    'label' => 'Versprechen-Zeile',
                    'repeat' => false,
                    'min' => 1,
                    'max' => 1,
                    'fields' => [],
                    'list' => [
                        'key' => 'items',
                        'label' => 'Versprechen',
                        'itemLabel' => 'Versprechen',
                        'one' => 'ein Versprechen',
                        'min' => 1,
                        'max' => 4,
                        'fields' => [
                            self::icon('icon', 'Symbol'),
                            self::text('title', 'Titel', 40, true),
                            self::textarea('text', 'Text', 100, true),
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * A Ratgeber article: its title (also the card on the homepage), the search engines' line, the
     * lead, then sections of one heading and its paragraphs.
     *
     * @return Schema
     */
    private static function guide(): array
    {
        return [
            'page' => [
                self::text('title', 'Titel', 90, true),
                self::textarea('metaDescription', 'Beschreibung für Suchmaschinen', 160, false, 'Erscheint bei Google unter dem Titel. Leer lassen, dann steht dort der Vorspann.'),
            ],
            'blocks' => [
                [
                    'type' => 'guide_lead',
                    'label' => 'Vorspann',
                    'repeat' => false,
                    'min' => 1,
                    'max' => 1,
                    'fields' => [
                        self::textarea('teaser', 'Vorspann', 200, true, 'Steht unter dem Titel. Auf der Startseite erscheint er bei den ersten drei veröffentlichten Artikeln.'),
                        ['key' => 'minutes', 'label' => 'Lesezeit in Minuten', 'kind' => 'number', 'required' => true, 'max' => 60, 'min' => 1],
                    ],
                ],
                // The article's building blocks (his admin item 11, D-306), in any order: text, a picture, a table, a
                // quote — structured, never HTML (ArticleBlocks prints every value as text).
                [
                    'type' => 'prose',
                    'label' => 'Abschnitt',
                    'one' => 'einen Abschnitt',
                    'many' => 'Abschnitte',
                    'repeat' => true,
                    'min' => 1,
                    'max' => 30,
                    'fields' => [
                        self::text('heading', 'Zwischenüberschrift', 90, true),
                        self::textarea('text', 'Text', 5000, true, 'Eine Leerzeile beginnt einen neuen Absatz.'),
                    ],
                ],
                [
                    'type' => 'figure',
                    'label' => 'Bild',
                    'one' => 'ein Bild',
                    'many' => 'Bilder',
                    'repeat' => true,
                    'min' => 0,
                    'max' => 12,
                    'fields' => [
                        ['key' => 'src', 'label' => 'Bild', 'kind' => 'image', 'required' => true, 'max' => null, 'help' => 'JPG, PNG, WebP oder AVIF, höchstens 10 MB. Das Bild wird in unserem Speicher abgelegt.'],
                        self::text('alt', 'Bildbeschreibung', 200, true, 'Was das Bild zeigt, für alle, die es nicht sehen – Screenreader lesen diesen Text vor.'),
                        self::text('caption', 'Bildunterschrift', 200, false),
                    ],
                ],
                [
                    'type' => 'table',
                    'label' => 'Tabelle',
                    'one' => 'eine Tabelle',
                    'many' => 'Tabellen',
                    'repeat' => true,
                    'min' => 0,
                    'max' => 10,
                    'fields' => [
                        self::text('caption', 'Tabellenüberschrift', 120, true, 'Sagt, was die Tabelle zeigt. Screenreader lesen diese Überschrift als Erstes vor.'),
                        ['key' => 'head', 'label' => 'Inhalt', 'kind' => 'grid', 'required' => true, 'max' => self::CELL_MAX, 'help' => 'In die erste Zeile kommen die Spaltenköpfe. 2 bis '.self::COLUMNS_MAX.' Spalten, bis '.self::ROWS_MAX.' Zeilen.'],
                    ],
                ],
                [
                    'type' => 'quote',
                    'label' => 'Zitat',
                    'one' => 'ein Zitat',
                    'many' => 'Zitate',
                    'repeat' => true,
                    'min' => 0,
                    'max' => 10,
                    'fields' => [
                        self::textarea('text', 'Zitat', 600, true),
                        self::text('source', 'Quelle', 120, false, 'Wer es gesagt oder geschrieben hat.'),
                    ],
                ],
                // HTML within limits (his admin item 11, „We will go with your proposal“; D-352): what ArticleHtml keeps,
                // cleaned when saved and again when served — never free HTML.
                [
                    'type' => 'html',
                    'label' => 'HTML-Abschnitt',
                    'one' => 'einen HTML-Abschnitt',
                    'many' => 'HTML-Abschnitte',
                    'repeat' => true,
                    'min' => 0,
                    'max' => 10,
                    'fields' => [
                        ['key' => 'html', 'label' => 'HTML', 'kind' => 'html', 'required' => true, 'max' => self::HTML_MAX, 'help' => self::HTML_HELP],
                    ],
                ],
            ],
        ];
    }

    /**
     * A legal page: its name in the rail and its sections. The text itself comes from the client's
     * Kanzlei; the panel only carries it (D-024).
     *
     * @return Schema
     */
    private static function legal(): array
    {
        return [
            'page' => [
                self::text('title', 'Name der Seite', 40, true, 'So heißt die Seite in ihrer Überschrift und in der Leiste der Rechtstexte. Den Eintrag in der Fußzeile änderst du unter Navigation.'),
            ],
            'blocks' => [
                [
                    'type' => 'legal_body',
                    'label' => 'Abschnitt',
                    'one' => 'einen Abschnitt',
                    'many' => 'Abschnitte',
                    'repeat' => true,
                    'min' => 1,
                    'max' => 60,
                    'fields' => [
                        self::text('heading', 'Zwischenüberschrift', 120, false),
                        self::textarea('text', 'Text', 30000, true, 'Füg den Text ein, wie die Kanzlei ihn geliefert hat. Eine Leerzeile beginnt einen neuen Absatz.'),
                    ],
                ],
            ],
        ];
    }

    /**
     * An empty page of this schema: every fixed block once, the fewest sections it needs, every
     * field empty (a number at its lowest, a glyph at the first on offer). What a new Ratgeber
     * article starts as, and what a never-published page's draft goes back to when it is discarded.
     *
     * @param  Schema  $schema
     * @return Content
     */
    public static function skeleton(array $schema, string $title): array
    {
        $blocks = [];

        foreach ($schema['blocks'] as $block) {
            // A fixed block once; a repeatable one as often as its type needs — a new article starts with a section, not
            // with an empty picture or table.
            for ($i = 0; $i < ($block['repeat'] ? $block['min'] : max(1, $block['min'])); $i++) {
                $data = self::emptyValues($block['fields']);

                if (isset($block['list'])) {
                    $data[$block['list']['key']] = array_fill(0, max(1, $block['list']['min']), self::emptyValues($block['list']['fields']));
                }

                $blocks[] = ['type' => $block['type'], 'data' => $data];
            }
        }

        return ['title' => $title, 'metaDescription' => '', 'blocks' => $blocks];
    }

    /**
     * @param  list<Field>  $fields
     * @return array<string, mixed>
     */
    private static function emptyValues(array $fields): array
    {
        $data = [];

        foreach ($fields as $field) {
            $data[$field['key']] = match ($field['kind']) {
                'number' => $field['min'] ?? 1,
                'icon' => $field['options'][0]['value'] ?? '',
                'choice' => $field['default'] ?? ($field['options'][0]['value'] ?? ''),
                // A table starts with two columns and one row, every cell empty.
                'grid' => array_fill(0, self::COLUMNS_MIN, ''),
                default => '',
            };

            if ($field['kind'] === 'grid') {
                $data['rows'] = [array_fill(0, self::COLUMNS_MIN, '')];
            }

            if ($field['kind'] === 'image') {
                $data['width'] = null;
                $data['height'] = null;
            }
        }

        return $data;
    }

    /**
     * Keeps only what the schema knows and gives every value its type: posted content is never
     * stored free-form. Unknown blocks and keys are dropped; strings are trimmed with line endings
     * made `\n`; a number that is not one becomes null and fails validation.
     *
     * @param  Schema  $schema
     * @param  array<mixed>  $input
     * @param  Content  $current  the page's content now, for the fields the schema does not edit
     * @return Content
     */
    public static function normalise(array $schema, array $input, array $current): array
    {
        $pageKeys = array_column($schema['page'], 'key');
        $byType = [];

        foreach ($schema['blocks'] as $block) {
            $byType[$block['type']] = $block;
        }

        $blocks = [];
        $posted = $input['blocks'] ?? [];

        foreach (is_array($posted) ? $posted : [] as $raw) {
            if (! is_array($raw) || ! is_string($raw['type'] ?? null) || ! isset($byType[$raw['type']])) {
                continue;
            }

            $block = $byType[$raw['type']];
            $rawData = is_array($raw['data'] ?? null) ? $raw['data'] : [];
            $data = self::values($block['fields'], $rawData);

            if (isset($block['list'])) {
                $items = [];
                $rawItems = $rawData[$block['list']['key']] ?? [];

                foreach (is_array($rawItems) ? $rawItems : [] as $item) {
                    $items[] = self::values($block['list']['fields'], is_array($item) ? $item : []);
                }

                $data[$block['list']['key']] = $items;
            }

            $blocks[] = ['type' => $block['type'], 'data' => $data];
        }

        return [
            'title' => in_array('title', $pageKeys, true) ? self::string($input['title'] ?? null) : $current['title'],
            'metaDescription' => in_array('metaDescription', $pageKeys, true) ? self::string($input['metaDescription'] ?? null) : $current['metaDescription'],
            'blocks' => $blocks,
        ];
    }

    /**
     * The publish check: every required field filled, every text within its limit, every section
     * count within its bounds, blocks in schema order. Keys are the field's path in the content;
     * each message is said under its field, and the editor's summary names the place from the path.
     *
     * @param  Schema  $schema
     * @param  Content  $content
     * @return array<string, string>
     */
    public static function errors(array $schema, array $content): array
    {
        $errors = [];

        foreach ($schema['page'] as $field) {
            $message = self::fieldError($field, $content[$field['key']] ?? null);

            if ($message !== null) {
                $errors[$field['key']] = $message;
            }
        }

        $blocks = $content['blocks'];
        $index = 0;
        $repeatable = [];

        // The fixed blocks first, each once, in the schema's order.
        foreach ($schema['blocks'] as $block) {
            if ($block['repeat']) {
                $repeatable[$block['type']] = $block;

                continue;
            }

            if (($blocks[$index]['type'] ?? null) !== $block['type']) {
                if ($block['min'] > 0) {
                    $errors['blocks'] = 'Der Bereich „'.$block['label'].'“ fehlt.';
                }

                continue;
            }

            foreach (self::blockErrors($block, $blocks[$index]['data']) as $path => $message) {
                $errors['blocks.'.$index.'.data.'.$path] = $message;
            }

            $index++;
        }

        // Then the repeatable ones in any order the editor set them (D-306), each type within its own bounds.
        $counts = [];

        for (; $index < count($blocks); $index++) {
            $block = $repeatable[$blocks[$index]['type']] ?? null;

            if ($block === null) {
                $errors['blocks'] = 'Die Abschnitte stehen nicht in der erwarteten Reihenfolge. Bitte lade die Seite neu.';

                break;
            }

            $counts[$block['type']] = ($counts[$block['type']] ?? 0) + 1;

            foreach (self::blockErrors($block, $blocks[$index]['data']) as $path => $message) {
                $errors['blocks.'.$index.'.data.'.$path] = $message;
            }
        }

        foreach ($repeatable as $type => $block) {
            $count = $counts[$type] ?? 0;
            $one = $block['one'] ?? 'einen Abschnitt';
            $many = $block['many'] ?? 'Abschnitte';

            if ($count < $block['min']) {
                $errors['blocks'] = 'Die Seite braucht mindestens '.self::countWord($block['min'], $one, $many).'.';
            } elseif ($count > $block['max']) {
                $errors['blocks'] = 'Höchstens '.self::countWord($block['max'], $one, $many).' pro Seite.';
            }
        }

        return $errors;
    }

    /**
     * The labels of every changed place — what the Protokoll's sentence names.
     *
     * @param  Schema  $schema
     * @param  Content  $before
     * @param  Content  $after
     * @return list<string>
     */
    public static function changes(array $schema, array $before, array $after): array
    {
        return array_column(self::diff($schema, $before, $after), 'label');
    }

    /**
     * Every place in a content where two versions differ, named for a person, with its words before
     * and after: „Einstieg · Überschrift", „Abschnitt 3 · Text", „Abschnitt 7 (neu)", „Zitat 1 (entfernt)".
     * Each kind of block is compared among its own, by its place: Abschnitt 3 with Abschnitt 3, Zitat 1
     * with Zitat 1 — a section moved up reads as the two places it changed, which is what a reader
     * comparing them sees, and a quote removed between two sections is the quote's removal, not theirs
     * (SEI-25). Where the kinds stand in another order, „Reihenfolge der Bausteine" says so. The editor's
     * own diff (Seiten/content.ts) names places the same way.
     *
     * @param  Schema  $schema
     * @param  Content  $before
     * @param  Content  $after
     * @return list<array{label: string, before: string, after: string}>
     */
    public static function diff(array $schema, array $before, array $after): array
    {
        $changed = [];

        foreach ($schema['page'] as $field) {
            $old = (string) ($before[$field['key']] ?? '');
            $new = (string) ($after[$field['key']] ?? '');

            if ($old !== $new) {
                $changed[] = ['label' => $field['label'], 'before' => $old, 'after' => $new];
            }
        }

        $was = self::placed($schema, $before['blocks']);
        $is = self::placed($schema, $after['blocks']);

        foreach ($is as $key => $place) {
            $block = $place['block'];
            $where = $place['label'];
            $new = $place['data'];
            $old = $was[$key]['data'] ?? null;

            if ($old === null) {
                $changed[] = ['label' => $where.' (neu)', 'before' => '', 'after' => self::allWords($new, $block['fields'])];

                continue;
            }

            foreach ($block['fields'] as $field) {
                $a = self::comparable($field, $old);
                $b = self::comparable($field, $new);

                if ($a !== $b) {
                    $changed[] = ['label' => $where.' · '.$field['label'], 'before' => self::shown($field, $a), 'after' => self::shown($field, $b)];
                }
            }

            if (isset($block['list'])) {
                $list = $block['list'];
                $oldItems = is_array($old[$list['key']] ?? null) ? array_values($old[$list['key']]) : [];
                $newItems = is_array($new[$list['key']] ?? null) ? array_values($new[$list['key']]) : [];
                $items = max(count($oldItems), count($newItems));

                for ($j = 0; $j < $items; $j++) {
                    $itemWhere = $list['itemLabel'].' '.($j + 1);
                    $a = is_array($oldItems[$j] ?? null) ? $oldItems[$j] : null;
                    $b = is_array($newItems[$j] ?? null) ? $newItems[$j] : null;

                    if ($a === null) {
                        $changed[] = ['label' => $itemWhere.' (neu)', 'before' => '', 'after' => self::allWords($b ?? [], $list['fields'])];
                    } elseif ($b === null) {
                        $changed[] = ['label' => $itemWhere.' (entfernt)', 'before' => self::allWords($a, $list['fields']), 'after' => ''];
                    } else {
                        foreach ($list['fields'] as $field) {
                            if (($a[$field['key']] ?? null) !== ($b[$field['key']] ?? null)) {
                                $changed[] = [
                                    'label' => $itemWhere.' · '.$field['label'],
                                    'before' => self::shown($field, $a[$field['key']] ?? null),
                                    'after' => self::shown($field, $b[$field['key']] ?? null),
                                ];
                            }
                        }
                    }
                }
            }
        }

        foreach ($was as $key => $place) {
            if (! isset($is[$key])) {
                $changed[] = ['label' => $place['label'].' (entfernt)', 'before' => self::allWords($place['data'], $place['block']['fields']), 'after' => ''];
            }
        }

        // The blocks both versions have, in each version's order: a quote moved above a section changes no words.
        $kept = array_values(array_filter(array_keys($was), static fn (string $key): bool => isset($is[$key])));
        $now = array_values(array_filter(array_keys($is), static fn (string $key): bool => isset($was[$key])));

        if ($kept !== $now) {
            $changed[] = [
                'label' => 'Reihenfolge der Bausteine',
                'before' => implode(', ', array_map(static fn (string $key): string => $was[$key]['label'], $kept)),
                'after' => implode(', ', array_map(static fn (string $key): string => $is[$key]['label'], $now)),
            ];
        }

        return $changed;
    }

    /**
     * A version's blocks by their place among their own kind (`prose#3`), in reading order, each with its label —
     * „Abschnitt 3", „Einstieg" — and its data. A block of a kind the schema does not know is left out.
     *
     * @param  Schema  $schema
     * @param  array<mixed>  $blocks
     * @return array<string, array{block: Block, label: string, data: array<mixed>}>
     */
    private static function placed(array $schema, array $blocks): array
    {
        $byType = [];

        foreach ($schema['blocks'] as $block) {
            $byType[$block['type']] = $block;
        }

        $placed = [];
        $seen = [];

        foreach ($blocks as $entry) {
            $type = is_array($entry) && is_string($entry['type'] ?? null) ? $entry['type'] : '';
            $block = $byType[$type] ?? null;

            if ($block === null) {
                continue;
            }

            $seen[$type] = ($seen[$type] ?? 0) + 1;
            $placed[$type.'#'.$seen[$type]] = [
                'block' => $block,
                'label' => $block['repeat'] ? $block['label'].' '.$seen[$type] : $block['label'],
                'data' => is_array($entry['data'] ?? null) ? $entry['data'] : [],
            ];
        }

        return $placed;
    }

    /**
     * A block's or an item's words in reading order, for a place that is new or gone as a whole.
     *
     * @param  array<mixed>  $data
     * @param  list<Field>  $fields
     */
    private static function allWords(array $data, array $fields): string
    {
        $texts = [];

        foreach ($fields as $field) {
            $text = $field['kind'] === 'icon' ? '' : self::shown($field, self::comparable($field, $data));

            if ($text !== '') {
                $texts[] = $text;
            }
        }

        return implode("\n\n", $texts);
    }

    /**
     * A field's value as two versions are compared: a table's headings and rows together, anything else as stored.
     *
     * @param  Field  $field
     * @param  array<mixed>  $data
     */
    private static function comparable(array $field, array $data): mixed
    {
        if ($field['kind'] === 'grid') {
            return ['head' => $data['head'] ?? [], 'rows' => $data['rows'] ?? []];
        }

        return $data[$field['key']] ?? null;
    }

    /**
     * A value as a person reads it: a glyph by its name („Werkzeug"), anything else as written.
     *
     * @param  Field  $field
     */
    private static function shown(array $field, mixed $value): string
    {
        if ($field['kind'] === 'icon' && is_string($value)) {
            return self::PROMISE_ICONS[$value] ?? $value;
        }

        if ($field['kind'] === 'choice' && is_string($value)) {
            foreach ($field['options'] ?? [] as $option) {
                if ($option['value'] === $value) {
                    return $option['label'];
                }
            }
        }

        // A picture by its file's name, as a person would recognise it.
        if ($field['kind'] === 'image') {
            return is_string($value) && $value !== '' ? basename((string) parse_url($value, PHP_URL_PATH)) : '';
        }

        // A table as its lines read: the headings, then each row, cells apart.
        if ($field['kind'] === 'grid' && is_array($value)) {
            $lines = [];

            foreach ([$value['head'] ?? [], ...(is_array($value['rows'] ?? null) ? $value['rows'] : [])] as $row) {
                $cells = is_array($row) ? array_filter($row, 'is_string') : [];
                $lines[] = implode(' | ', $cells);
            }

            return trim(implode("\n", $lines));
        }

        return is_scalar($value) ? (string) $value : '';
    }

    /**
     * @param  Block  $block
     * @param  array<string, mixed>  $data
     * @return array<string, string>
     */
    private static function blockErrors(array $block, array $data): array
    {
        $errors = [];

        foreach ($block['fields'] as $field) {
            if ($field['kind'] === 'grid') {
                $errors += self::gridErrors($data);

                continue;
            }

            $message = self::fieldError($field, $data[$field['key']] ?? null);

            if ($message !== null) {
                $errors[$field['key']] = $message;
            }
        }

        if (isset($block['list'])) {
            $list = $block['list'];
            $items = is_array($data[$list['key']] ?? null) ? array_values($data[$list['key']]) : [];

            if (count($items) < $list['min']) {
                $errors[$list['key']] = 'Mindestens '.self::countWord($list['min'], $list['one'], $list['label']).'.';
            } elseif (count($items) > $list['max']) {
                $errors[$list['key']] = 'Höchstens '.self::countWord($list['max'], $list['one'], $list['label']).'.';
            }

            foreach ($items as $j => $item) {
                foreach ($list['fields'] as $field) {
                    $message = self::fieldError($field, is_array($item) ? ($item[$field['key']] ?? null) : null);

                    if ($message !== null) {
                        $errors[$list['key'].'.'.$j.'.'.$field['key']] = $message;
                    }
                }
            }
        }

        return $errors;
    }

    /**
     * What is wrong with one field, said under that field — its label stands right above, so the
     * message does not repeat it. The summary above the fields adds the place (Seiten/content.ts).
     *
     * @param  Field  $field
     */
    private static function fieldError(array $field, mixed $value): ?string
    {
        if ($field['kind'] === 'number') {
            $min = $field['min'] ?? 0;

            if (! is_int($value) || $value < $min || ($field['max'] !== null && $value > $field['max'])) {
                return 'Bitte eine ganze Zahl von '.$min.' bis '.$field['max'].'.';
            }

            return null;
        }

        if ($field['kind'] === 'icon') {
            return is_string($value) && isset(self::PROMISE_ICONS[$value]) ? null : 'Bitte wähl ein Symbol aus der Liste.';
        }

        if ($field['kind'] === 'choice') {
            return in_array($value, array_column($field['options'] ?? [], 'value'), true) ? null : 'Bitte wähl einen Eintrag aus der Liste.';
        }

        // A picture from our own storage, uploaded here — never an address on another site.
        if ($field['kind'] === 'image') {
            if (! is_string($value) || $value === '') {
                return 'Bitte wähl ein Bild aus.';
            }

            return self::ownImage($value) ? null : 'Dieses Bild liegt nicht in unserem Speicher. Wähl es über „Anderes Bild auswählen“ neu aus.';
        }

        $text = is_string($value) ? $value : '';

        if ($text === '') {
            return $field['required'] ? 'Bitte ausfüllen.' : null;
        }

        $length = mb_strlen($text);

        if ($field['max'] !== null && $length > $field['max']) {
            return 'Höchstens '.number_format($field['max'], 0, ',', '.').' Zeichen, jetzt sind es '.number_format($length, 0, ',', '.').'.';
        }

        return null;
    }

    /**
     * @param  list<Field>  $fields
     * @param  array<mixed>  $raw
     * @return array<string, mixed>
     */
    private static function values(array $fields, array $raw): array
    {
        $data = [];

        foreach ($fields as $field) {
            $value = $raw[$field['key']] ?? null;

            $data[$field['key']] = match ($field['kind']) {
                'number' => is_int($value) ? $value : (is_string($value) && preg_match('/^\s*\d{1,6}\s*$/', $value) === 1 ? (int) $value : null),
                'icon' => is_string($value) ? $value : '',
                // Content from before the field existed reads as the default, never as „none chosen“.
                'choice' => $value === null || $value === '' ? ($field['default'] ?? '') : (is_string($value) ? $value : ''),
                // The column headings, each as text; the rows beside them.
                'grid' => self::cells($value),
                // The HTML-Abschnitt (his admin item 11, D-352): only what ArticleHtml allows is ever stored.
                'html' => ArticleHtml::clean(self::string($value)),
                default => self::string($value),
            };

            if ($field['kind'] === 'grid') {
                $rows = $raw['rows'] ?? [];
                $data['rows'] = array_values(array_map(static fn (mixed $row): array => self::cells($row), is_array($rows) ? $rows : []));
            }

            // The picture's size as the upload measured it, so the page reserves its room before it loads.
            if ($field['kind'] === 'image') {
                $data['width'] = self::dimension($raw['width'] ?? null);
                $data['height'] = self::dimension($raw['height'] ?? null);
            }
        }

        return $data;
    }

    /**
     * What is wrong with a table: its headings (`head`) and its rows (`rows`), each said under the table — headings for
     * every column, 2 to 6 of them, rows of as many cells, every cell within its length (D-306).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, string>
     */
    private static function gridErrors(array $data): array
    {
        $head = is_array($data['head'] ?? null) ? array_values($data['head']) : [];
        $rows = is_array($data['rows'] ?? null) ? array_values($data['rows']) : [];
        $errors = [];

        if (count($head) < self::COLUMNS_MIN || count($head) > self::COLUMNS_MAX) {
            $errors['head'] = 'Eine Tabelle hat '.self::COLUMNS_MIN.' bis '.self::COLUMNS_MAX.' Spalten.';
        } elseif (in_array('', $head, true)) {
            $errors['head'] = 'Jede Spalte braucht einen Spaltenkopf.';
        }

        $tooLong = array_filter($head, static fn (mixed $cell): bool => is_string($cell) && mb_strlen($cell) > self::CELL_MAX) !== [];
        $uneven = false;
        $filled = false;

        foreach ($rows as $row) {
            $row = is_array($row) ? array_values($row) : [];
            $uneven = $uneven || count($row) !== count($head);

            foreach ($row as $cell) {
                $filled = $filled || (is_string($cell) && $cell !== '');
                $tooLong = $tooLong || (is_string($cell) && mb_strlen($cell) > self::CELL_MAX);
            }
        }

        // One message for the rows, the first that applies.
        $rowError = match (true) {
            $rows === [] || count($rows) > self::ROWS_MAX => 'Eine Tabelle hat 1 bis '.self::ROWS_MAX.' Zeilen.',
            $uneven => 'Jede Zeile hat so viele Zellen, wie die Tabelle Spalten hat.',
            $tooLong => 'Höchstens '.self::CELL_MAX.' Zeichen je Zelle. Kürz die markierte Zelle.',
            ! $filled => 'Unter den Spaltenköpfen steht noch nichts. Füll mindestens eine Zelle aus.',
            default => null,
        };

        if ($rowError !== null) {
            $errors['rows'] = $rowError;
        }

        return $errors;
    }

    /** @return list<string> a row of a table, each cell as text */
    private static function cells(mixed $value): array
    {
        return array_values(array_map(static fn (mixed $cell): string => self::string($cell), is_array($value) ? $value : []));
    }

    private static function dimension(mixed $value): ?int
    {
        return is_int($value) && $value > 0 && $value <= 20_000 ? $value : (is_string($value) && preg_match('/^\d{1,5}$/', $value) === 1 && (int) $value > 0 ? (int) $value : null);
    }

    private static function string(mixed $value): string
    {
        if (! is_scalar($value)) {
            return '';
        }

        return trim(str_replace(["\r\n", "\r"], "\n", (string) $value));
    }

    /** `$one` carries its article („einen Abschnitt", „ein Versprechen"): German declines it by gender. */
    private static function countWord(int $count, string $one, string $many): string
    {
        return $count === 1 ? $one : $count.' '.$many;
    }

    /** @return Field */
    private static function text(string $key, string $label, int $max, bool $required, ?string $help = null): array
    {
        $field = ['key' => $key, 'label' => $label, 'kind' => 'text', 'required' => $required, 'max' => $max];

        return $help === null ? $field : $field + ['help' => $help];
    }

    /** @return Field */
    private static function textarea(string $key, string $label, int $max, bool $required, ?string $help = null): array
    {
        $field = ['key' => $key, 'label' => $label, 'kind' => 'textarea', 'required' => $required, 'max' => $max];

        return $help === null ? $field : $field + ['help' => $help];
    }

    /**
     * One of a fixed set, by name — the hero's photograph. `default` is what content written before the field existed
     * reads as, so a page never goes without one.
     *
     * @param  list<array{value: string, label: string}>  $options
     * @return Field
     */
    private static function choice(string $key, string $label, array $options, string $default, ?string $help = null): array
    {
        $field = ['key' => $key, 'label' => $label, 'kind' => 'choice', 'required' => true, 'max' => null, 'options' => $options, 'default' => $default];

        return $help === null ? $field : $field + ['help' => $help];
    }

    /** @return Field */
    private static function icon(string $key, string $label): array
    {
        $options = [];

        foreach (self::PROMISE_ICONS as $value => $name) {
            $options[] = ['value' => $value, 'label' => $name];
        }

        return ['key' => $key, 'label' => $label, 'kind' => 'icon', 'required' => true, 'max' => null, 'options' => $options];
    }
}
