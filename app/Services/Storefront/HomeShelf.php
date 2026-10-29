<?php

declare(strict_types=1);

namespace App\Services\Storefront;

/**
 * The homepage's shelf, eight rims (the client's #5, „please show 8 rims“; D-353): what sold in the last 90 days first,
 * most first (BestSellers); the places that leaves free filled with the team's picks in their order (ShelfPicks); the
 * rest with the newest rims in the shop. Never fewer than eight while eight are on sale. Each card says where it came
 * from, so the heading can say only what is true (StartseiteController) and the admin can see why a rim stands there.
 */
final readonly class HomeShelf
{
    public const SIZE = ShelfPicks::SIZE;

    /** Where a card came from. */
    public const SOLD = 'verkauft';

    public const PICKED = 'ausgewaehlt';

    public const NEWEST = 'neu';

    public function __construct(
        private ProductCards $cards,
        private BestSellers $bestSellers,
    ) {}

    /**
     * Without a car: the catalogue — three bounded reads, never the whole range.
     *
     * @return array{cards: list<array<string, mixed>>, sources: list<string>}
     */
    public function catalogue(): array
    {
        $sold = $this->bestSellers->counts();
        $picks = ShelfPicks::keys();
        $pickedModels = array_values(array_unique(array_map(static fn (string $key): int => (int) strstr($key, ':', true), $picks)));

        return self::compose(
            $sold === [] ? [] : $this->cards->catalogue(limit: null, options: ['modelIds' => array_keys($sold), 'order' => 'newest']),
            $pickedModels === [] ? [] : $this->cards->catalogue(limit: null, options: ['modelIds' => $pickedModels, 'order' => 'newest']),
            $this->cards->catalogue(limit: 2 * self::SIZE, options: ['order' => 'newest']),
            $sold,
            $picks,
        );
    }

    /**
     * With a car: the car's own answer, arranged — what sold, then what was picked, then the rest as given.
     *
     * @param  list<array<string, mixed>>  $cards  the listing's cards for the car, newest first
     * @return array{cards: list<array<string, mixed>>, sources: list<string>}
     */
    public function arrange(array $cards): array
    {
        return self::compose($cards, $cards, $cards, $this->bestSellers->counts(), ShelfPicks::keys());
    }

    /**
     * The shelf's eight, each card once, with where it came from.
     *
     * @param  list<array<string, mixed>>  $soldPool  cards among which the sold ones are
     * @param  list<array<string, mixed>>  $pickedPool  cards among which the picked ones are
     * @param  list<array<string, mixed>>  $fillPool  the rest, in the order they fill
     * @param  array<int, int>  $sold  model id → paid order lines in the window
     * @param  list<string>  $picks  `modelId:finishId`, in the order picked
     * @return array{cards: list<array<string, mixed>>, sources: list<string>}
     */
    public static function compose(array $soldPool, array $pickedPool, array $fillPool, array $sold, array $picks): array
    {
        $chosen = [];
        $sources = [];

        $take = static function (array $card, string $source) use (&$chosen, &$sources): void {
            $key = (string) ($card['compareKey'] ?? '');

            if ($key !== '' && count($chosen) < self::SIZE && ! isset($chosen[$key])) {
                $chosen[$key] = $card;
                $sources[$key] = $source;
            }
        };

        // What sold, most first; among equals the pool's own order (a stable sort).
        $selling = array_values(array_filter($soldPool, static fn (array $card): bool => ($sold[(int) ($card['modelId'] ?? 0)] ?? 0) > 0));
        usort($selling, static fn (array $a, array $b): int => ($sold[(int) $b['modelId']] ?? 0) <=> ($sold[(int) $a['modelId']] ?? 0));

        foreach ($selling as $card) {
            $take($card, self::SOLD);
        }

        $byKey = [];

        foreach ($pickedPool as $card) {
            $byKey[(string) ($card['compareKey'] ?? '')] ??= $card;
        }

        // A pick no longer on sale is passed over, not shown half.
        foreach ($picks as $key) {
            if (isset($byKey[$key])) {
                $take($byKey[$key], self::PICKED);
            }
        }

        foreach ($fillPool as $card) {
            $take($card, self::NEWEST);
        }

        return ['cards' => array_values($chosen), 'sources' => array_values($sources)];
    }
}
