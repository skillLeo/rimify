<?php

declare(strict_types=1);

use App\Services\Storefront\HomeShelf;

/*
 * The client's #5, „please show 8 rims“ (29.10.2026, D-353): eight on the shelf — what sold first, most first; then the
 * team's picks in their order; then the newest. Never fewer than eight while eight are on sale.
 */

/**
 * Cards `m:f` for the models given, two colours each, newest model first as the catalogue gives them.
 *
 * @param  list<int>  $models
 * @return list<array{modelId: int, finishId: int, compareKey: string}>
 */
function shelfCards(array $models): array
{
    $cards = [];

    foreach ($models as $model) {
        foreach ([1, 2] as $finish) {
            $cards[] = ['modelId' => $model, 'finishId' => $finish, 'compareKey' => $model.':'.$finish];
        }
    }

    return $cards;
}

/** @param  array{cards: list<array<string, mixed>>, sources: list<string>}  $shelf */
function shelfKeys(array $shelf): array
{
    return array_map(static fn (array $card): string => (string) $card['compareKey'], $shelf['cards']);
}

it('shows eight with no sale: the picks in their order, then the newest — each rim once', function (): void {
    $newest = shelfCards(range(30, 21, -1));
    // The picked pool holds every picked model, as HomeShelf::catalogue() reads it.
    $shelf = HomeShelf::compose([], shelfCards([12, 14, 30]), $newest, [], ['14:2', '12:1', '30:1']);

    expect(shelfKeys($shelf))->toBe(['14:2', '12:1', '30:1', '30:2', '29:1', '29:2', '28:1', '28:2'])
        ->and($shelf['sources'])->toBe(['ausgewaehlt', 'ausgewaehlt', 'ausgewaehlt', 'neu', 'neu', 'neu', 'neu', 'neu']);

    // No picks either: the eight newest.
    expect(shelfKeys(HomeShelf::compose([], [], $newest, [], [])))->toBe(['30:1', '30:2', '29:1', '29:2', '28:1', '28:2', '27:1', '27:2']);
});

it('puts three sales first, most sold first, then the picks, then the newest — eight in all', function (): void {
    // Three paid lines: model 5 twice, model 7 once.
    $sold = [5 => 2, 7 => 1];
    $shelf = HomeShelf::compose(shelfCards([7, 5]), shelfCards([12]), shelfCards(range(30, 25, -1)), $sold, ['12:2', '5:1']);

    expect(shelfKeys($shelf))->toBe(['5:1', '5:2', '7:1', '7:2', '12:2', '30:1', '30:2', '29:1'])
        ->and($shelf['sources'])->toBe(['verkauft', 'verkauft', 'verkauft', 'verkauft', 'ausgewaehlt', 'neu', 'neu', 'neu']);
});

it('fills all eight from twelve sales, by how often each sold, and leaves the picks out', function (): void {
    // Twelve paid lines over five models: 4, 3, 2, 2, 1.
    $sold = [3 => 2, 1 => 4, 4 => 2, 2 => 3, 6 => 1];
    $shelf = HomeShelf::compose(shelfCards([6, 4, 3, 2, 1]), shelfCards([12]), shelfCards(range(30, 25, -1)), $sold, ['12:1']);

    expect(array_sum($sold))->toBe(12)
        // Equal counts keep the pool's order (4 before 3, as the catalogue gave them).
        ->and(shelfKeys($shelf))->toBe(['1:1', '1:2', '2:1', '2:2', '4:1', '4:2', '3:1', '3:2'])
        ->and(array_unique($shelf['sources']))->toBe(['verkauft']);
});

it('passes over a pick no longer on sale and never shows a rim twice', function (): void {
    $shelf = HomeShelf::compose(shelfCards([5]), shelfCards([5, 12]), shelfCards([5, 12, 30, 29]), [5 => 1], ['99:1', '5:2', '12:1']);

    expect(shelfKeys($shelf))->toBe(['5:1', '5:2', '12:1', '12:2', '30:1', '30:2', '29:1', '29:2'])
        ->and($shelf['sources'])->toBe(['verkauft', 'verkauft', 'ausgewaehlt', 'neu', 'neu', 'neu', 'neu', 'neu']);
});

it('shows what there is when fewer than eight are on sale, and no more', function (): void {
    expect(shelfKeys(HomeShelf::compose([], [], shelfCards([2, 1]), [], [])))->toBe(['2:1', '2:2', '1:1', '1:2']);
});
