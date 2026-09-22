<?php

declare(strict_types=1);

namespace App\Services\Search;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The instant search behind the header field and the command palette.
 *
 * Four groups — Felgen, Marken, Größen, Seiten — from one query: the FULLTEXT index on the wheel
 * models in boolean mode, re-ranked in PHP with levenshtein() so a typo still finds the wheel;
 * brand names by substring; a size or an ET spelled any of the ways a customer spells it; and the
 * handful of pages people look for by name. A query that finds nothing is counted in
 * `search_misses`, which is what the admin's "Suchen ohne Treffer" list reads — and it gets a
 * "Meintest du …?" from the nearest brand or model name where one is close.
 */
final readonly class InstantSearch
{
    private const TTL = 60;

    private const LIMIT = 5;

    /** Spellings that mean the same thing, folded before anything is matched. */
    private const SYNONYMS = [
        '″' => ' zoll',
        '"' => ' zoll',
        'einpresstiefe' => 'et',
        'lochkreis' => 'lk',
        'felgen' => '',
        'felge' => '',
    ];

    /** @var list<array{label: string, href: string, keys: string}> */
    private const PAGES = [
        ['label' => 'RIMIFY-Check', 'href' => '/rimify-check', 'keys' => 'check prüfen prüfung passt gutachten freigabe'],
        ['label' => 'Fahrzeug wählen', 'href' => '/felgen-suchen', 'keys' => 'fahrzeug auto hsn tsn schlüsselnummer marke modell'],
        ['label' => 'Alle Felgen', 'href' => '/felgen', 'keys' => 'alle sortiment katalog'],
        ['label' => 'Fragen und Antworten', 'href' => '/faq', 'keys' => 'faq fragen hilfe antworten'],
        ['label' => 'Kontakt', 'href' => '/kontakt', 'keys' => 'kontakt telefon whatsapp mail anrufen'],
        ['label' => 'Warenkorb', 'href' => '/warenkorb', 'keys' => 'warenkorb bestellung kasse'],
        ['label' => 'Versand', 'href' => '/rechtliches/versand', 'keys' => 'versand lieferung lieferzeit dhl'],
        ['label' => 'Widerrufsbelehrung', 'href' => '/rechtliches/widerrufsbelehrung', 'keys' => 'widerruf rückgabe zurückschicken'],
        ['label' => 'Impressum', 'href' => '/rechtliches/impressum', 'keys' => 'impressum anbieter'],
        ['label' => 'Datenschutz', 'href' => '/rechtliches/datenschutz', 'keys' => 'datenschutz dsgvo cookies'],
    ];

    /**
     * @return array{
     *     query: string,
     *     total: int,
     *     suggestion: string|null,
     *     groups: list<array{key: string, label: string, items: list<array{label: string, sub: string|null, href: string}>}>
     * }
     */
    public function query(string $raw): array
    {
        $q = $this->normalise($raw);

        if ($q === '') {
            return ['query' => $raw, 'total' => 0, 'suggestion' => null, 'groups' => []];
        }

        /** @var array{total: int, suggestion: string|null, groups: list<array{key: string, label: string, items: list<array{label: string, sub: string|null, href: string}>}>} $result */
        $result = Cache::remember('search.'.md5($q), self::TTL, function () use ($q): array {
            $groups = array_values(array_filter([
                ['key' => 'felgen', 'label' => 'Felgen', 'items' => $this->wheels($q)],
                ['key' => 'marken', 'label' => 'Marken', 'items' => $this->brands($q)],
                ['key' => 'groessen', 'label' => 'Größen', 'items' => $this->sizes($q)],
                ['key' => 'seiten', 'label' => 'Seiten', 'items' => $this->pages($q)],
            ], static fn (array $group): bool => $group['items'] !== []));

            $total = array_sum(array_map(static fn (array $group): int => count($group['items']), $groups));

            return [
                'total' => $total,
                'suggestion' => $total === 0 ? $this->suggestion($q) : null,
                'groups' => $groups,
            ];
        });

        if ($result['total'] === 0 && mb_strlen($q) >= 2) {
            $this->recordMiss($q);
        }

        return ['query' => $raw, ...$result];
    }

    private function normalise(string $raw): string
    {
        $q = mb_strtolower(trim($raw));
        $q = str_replace(array_keys(self::SYNONYMS), array_values(self::SYNONYMS), $q);

        return trim((string) preg_replace('/\s+/u', ' ', $q));
    }

    /** @return list<array{label: string, sub: string|null, href: string}> */
    private function wheels(string $q): array
    {
        $terms = array_values(array_filter(explode(' ', $q), static fn (string $t): bool => mb_strlen($t) >= 2));

        if ($terms === []) {
            return [];
        }

        $base = DB::table('wheel_models as wm')
            ->join('brands as br', 'br.id', '=', 'wm.brand_id')
            ->whereNull('wm.deleted_at')
            ->where('wm.status', 'published')
            ->select(['wm.name', 'wm.slug', 'wm.type_designation', 'br.name as brand']);

        // Boolean mode with a trailing wildcard on every term: "super" finds Superturismo. The
        // InnoDB index skips tokens under three characters, so short terms fall through to LIKE.
        $boolean = implode(' ', array_map(
            static fn (string $t): string => '+'.preg_replace('/[^\p{L}\p{N}]/u', '', $t).'*',
            array_filter($terms, static fn (string $t): bool => mb_strlen($t) >= 3),
        ));

        $rows = $boolean !== ''
            ? (clone $base)->whereRaw('MATCH(wm.name, wm.type_designation) AGAINST(? IN BOOLEAN MODE)', [$boolean])->limit(20)->get()
            : collect();

        if ($rows->isEmpty()) {
            $rows = (clone $base)
                ->where(function ($query) use ($terms): void {
                    foreach ($terms as $term) {
                        $query->orWhere('wm.name', 'like', '%'.$term.'%')
                            ->orWhere('br.name', 'like', '%'.$term.'%');
                    }
                })
                ->limit(20)
                ->get();
        }

        $ranked = $rows->map(fn (object $row): array => [
            'label' => (string) $row->name,
            'sub' => (string) $row->brand,
            'href' => '/felgen/'.$row->slug,
            'distance' => levenshtein($q, mb_strtolower((string) $row->name)),
        ])->sortBy('distance')->take(self::LIMIT)->values();

        return $ranked->map(static fn (array $item): array => [
            'label' => $item['label'],
            'sub' => $item['sub'],
            'href' => $item['href'],
        ])->all();
    }

    /**
     * Wheel brands only: a brand with no published wheel model is not a brand RIMIFY sells Felgen
     * of — a tyre maker listed here would lead to a listing that ignores it. Linked by name,
     * because the listing's `marke` filter matches the brand's name.
     *
     * @return list<array{label: string, sub: string|null, href: string}>
     */
    private function brands(string $q): array
    {
        $rows = $this->wheelBrands()
            ->where('br.name', 'like', '%'.$q.'%')
            ->orderBy('br.sort_order')
            ->limit(self::LIMIT)
            ->get(['br.name']);

        $out = [];

        foreach ($rows as $row) {
            $out[] = ['label' => (string) $row->name, 'sub' => null, 'href' => '/felgen?marke='.rawurlencode((string) $row->name)];
        }

        return $out;
    }

    /** @return list<array{label: string, sub: string|null, href: string}> */
    private function sizes(string $q): array
    {
        $out = [];

        if (preg_match('/^(1[5-9]|2[0-4])(?:[.,]5)?(?: ?zoll)?$/', $q, $m) === 1) {
            $inch = (string) $m[1];

            if ($this->sizeExists($inch)) {
                $out[] = ['label' => $inch.' Zoll', 'sub' => 'Felgen in dieser Größe', 'href' => '/felgen?zoll='.$inch];
            }
        }

        if (preg_match('/^et ?(\d{1,2})$/', $q, $m) === 1) {
            $out[] = ['label' => 'ET '.$m[1], 'sub' => 'Einpresstiefe', 'href' => '/felgen?et='.$m[1]];
        }

        return $out;
    }

    private function sizeExists(string $inch): bool
    {
        return DB::table('wheel_configs as wc')
            ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
            ->whereNull('wc.deleted_at')
            ->where('wm.status', 'published')
            ->where('wc.diameter_in', (float) $inch)
            ->exists();
    }

    /** @return list<array{label: string, sub: string|null, href: string}> */
    private function pages(string $q): array
    {
        $out = [];

        foreach (self::PAGES as $page) {
            $haystack = mb_strtolower($page['label'].' '.$page['keys']);

            if (str_contains($haystack, $q)) {
                $out[] = ['label' => $page['label'], 'sub' => null, 'href' => $page['href']];
            }
        }

        return array_slice($out, 0, self::LIMIT);
    }

    /** Brands with at least one published, non-deleted wheel model — the same rule the homepage uses. */
    private function wheelBrands(): Builder
    {
        return DB::table('brands as br')
            ->whereNull('br.deleted_at')
            ->whereExists(function (Builder $models): void {
                $models->select(DB::raw(1))
                    ->from('wheel_models as wm')
                    ->whereColumn('wm.brand_id', 'br.id')
                    ->whereNull('wm.deleted_at')
                    ->where('wm.status', 'published');
            });
    }

    /** The nearest wheel brand or model name, when one is within two edits — "Meintest du „BBS“?". */
    private function suggestion(string $q): ?string
    {
        $names = $this->wheelBrands()->pluck('br.name')
            ->merge(DB::table('wheel_models')->whereNull('deleted_at')->where('status', 'published')->pluck('name'));

        $best = null;
        $bestDistance = 3;

        foreach ($names as $name) {
            $distance = levenshtein($q, mb_strtolower((string) $name));

            if ($distance < $bestDistance) {
                $bestDistance = $distance;
                $best = (string) $name;
            }
        }

        return $best;
    }

    private function recordMiss(string $q): void
    {
        $now = now();

        DB::table('search_misses')->upsert(
            [['query' => mb_substr($q, 0, 120), 'misses' => 1, 'last_missed_at' => $now, 'created_at' => $now, 'updated_at' => $now]],
            ['query'],
            ['misses' => DB::raw('misses + 1'), 'last_missed_at' => $now, 'updated_at' => $now],
        );
    }
}
