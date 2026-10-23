<?php

declare(strict_types=1);

namespace App\Services\Admin\Lists;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * One page of a long admin list and the way to the others, as the shared pager shows it (ListPager.vue): which page of
 * how many, how many entries in all, and the address of the page before and after — with the list's own filters kept
 * and `seite` added, as Felgen, Reifen and Bestellungen have always written it. The lists that once stopped at 200
 * (the admin audit's F-26) and the ones that put a thousand rows on one page (F-31) page through this.
 */
final class ListPaging
{
    public const PER_PAGE = 50;

    /**
     * @param  LengthAwarePaginator<int, mixed>  $page
     * @param  array<string, scalar|null>  $query  the list's filters as the address carries them
     * @return array{current: int, last: int, total: int, prev: string|null, next: string|null}
     */
    public static function props(LengthAwarePaginator $page, string $base, array $query = []): array
    {
        $current = $page->currentPage();

        return [
            'current' => $current,
            'last' => $page->lastPage(),
            'total' => $page->total(),
            'prev' => $current > 1 ? self::url($base, $query, $current - 1) : null,
            'next' => $page->hasMorePages() ? self::url($base, $query, $current + 1) : null,
        ];
    }

    /** The page asked for, from `seite`: a number from 1, anything else the first. */
    public static function requested(mixed $value): int
    {
        return is_numeric($value) && (int) $value >= 1 ? (int) $value : 1;
    }

    /** @param  array<string, scalar|null>  $query */
    private static function url(string $base, array $query, int $page): string
    {
        $kept = array_filter($query, static fn (mixed $value): bool => $value !== null && $value !== '');

        if ($page > 1) {
            $kept['seite'] = $page;
        }

        return $kept === [] ? $base : $base.'?'.http_build_query($kept);
    }
}
