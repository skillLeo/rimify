<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Models\Page;
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
 * @phpstan-type Field array{key: string, label: string, kind: string, required: bool, max: int|null, min?: int, help?: string, options?: list<array{value: string, label: string}>, default?: string}
 * @phpstan-type ItemList array{key: string, label: string, itemLabel: string, one: string, min: int, max: int, fields: list<Field>}
 * @phpstan-type Block array{type: string, label: string, repeat: bool, min: int, max: int, fields: list<Field>, list?: ItemList}
 * @phpstan-type Schema array{page: list<Field>, blocks: list<Block>}
 * @phpstan-type Content array{title: string, metaDescription: string, blocks: list<array{type: string, data: array<string, mixed>}>}
 */
final class PageSchema
{
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
                        self::choice('foto', 'Foto', HeroPhotos::options(), HeroPhotos::DEFAULT, 'Steht im Einstieg, auch wenn der Katalog leer ist. Die Maße erscheinen daran, sobald die gezeigte Felge mit mindestens einer Größe im Katalog steht und nicht archiviert ist.'),
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
                [
                    'type' => 'prose',
                    'label' => 'Abschnitt',
                    'repeat' => true,
                    'min' => 1,
                    'max' => 30,
                    'fields' => [
                        self::text('heading', 'Zwischenüberschrift', 90, true),
                        self::textarea('text', 'Text', 5000, true, 'Eine Leerzeile beginnt einen neuen Absatz.'),
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
            for ($i = 0; $i < max(1, $block['min']); $i++) {
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
                default => '',
            };
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

        foreach ($schema['blocks'] as $block) {
            $count = 0;

            while (isset($blocks[$index]) && $blocks[$index]['type'] === $block['type'] && ($block['repeat'] || $count === 0)) {
                foreach (self::blockErrors($block, $blocks[$index]['data']) as $path => $message) {
                    $errors['blocks.'.$index.'.data.'.$path] = $message;
                }

                $index++;
                $count++;
            }

            if ($count < $block['min']) {
                $errors['blocks'] = $block['repeat']
                    ? 'Die Seite braucht mindestens '.self::countWord($block['min'], 'einen Abschnitt', 'Abschnitte').'.'
                    : 'Der Bereich „'.$block['label'].'“ fehlt.';
            } elseif ($count > $block['max']) {
                $errors['blocks'] = 'Höchstens '.self::countWord($block['max'], 'einen Abschnitt', 'Abschnitte').' pro Seite.';
            }
        }

        if ($index < count($blocks)) {
            $errors['blocks'] = 'Die Abschnitte stehen nicht in der erwarteten Reihenfolge. Bitte lade die Seite neu.';
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
     * and after: „Einstieg · Überschrift", „Abschnitt 3 · Text", „Abschnitt 7 (neu)". Positional: a
     * section moved up reads as the two places it changed, which is what a reader comparing them
     * sees. The editor's own diff (Seiten/content.ts) names places the same way.
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

        $byType = [];

        foreach ($schema['blocks'] as $block) {
            $byType[$block['type']] = $block;
        }

        $seen = [];
        $total = max(count($before['blocks']), count($after['blocks']));

        for ($i = 0; $i < $total; $i++) {
            $old = $before['blocks'][$i] ?? null;
            $new = $after['blocks'][$i] ?? null;
            $type = ($new ?? $old)['type'] ?? '';
            $block = $byType[$type] ?? null;

            if ($block === null) {
                continue;
            }

            $seen[$type] = ($seen[$type] ?? 0) + 1;
            $where = $block['repeat'] ? $block['label'].' '.$seen[$type] : $block['label'];

            if ($old === null || $old['type'] !== $type) {
                $changed[] = ['label' => $where.' (neu)', 'before' => '', 'after' => self::allWords($new['data'] ?? [], $block['fields'])];

                continue;
            }

            if ($new === null) {
                $changed[] = ['label' => $where.' (entfernt)', 'before' => self::allWords($old['data'], $block['fields']), 'after' => ''];

                continue;
            }

            foreach ($block['fields'] as $field) {
                $a = $old['data'][$field['key']] ?? null;
                $b = $new['data'][$field['key']] ?? null;

                if ($a !== $b) {
                    $changed[] = ['label' => $where.' · '.$field['label'], 'before' => self::shown($field, $a), 'after' => self::shown($field, $b)];
                }
            }

            if (isset($block['list'])) {
                $list = $block['list'];
                $oldItems = is_array($old['data'][$list['key']] ?? null) ? array_values($old['data'][$list['key']]) : [];
                $newItems = is_array($new['data'][$list['key']] ?? null) ? array_values($new['data'][$list['key']]) : [];
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

        return $changed;
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
            $text = $field['kind'] === 'icon' ? '' : self::shown($field, $data[$field['key']] ?? null);

            if ($text !== '') {
                $texts[] = $text;
            }
        }

        return implode("\n\n", $texts);
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

        return is_scalar($value) ? (string) $value : '';
    }

    /**
     * @param  Block  $block
     * @param  array<string, mixed>  $data
     * @return array<string, string>
     */
    /**
     * @param  Block  $block
     * @param  array<string, mixed>  $data
     * @return array<string, string>
     */
    private static function blockErrors(array $block, array $data): array
    {
        $errors = [];

        foreach ($block['fields'] as $field) {
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
                default => self::string($value),
            };
        }

        return $data;
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
