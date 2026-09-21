<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use Illuminate\Contracts\Session\Session;

/**
 * The last twelve wheel models the visitor opened, most recent first, in the server session — a
 * necessary part of the shop session, so no consent question arises. Feeds the homepage row
 * "Zuletzt angesehen" and nothing else.
 */
final readonly class RecentlyViewed
{
    public const KEY = 'recently_viewed';

    public const LIMIT = 12;

    public function record(Session $session, int $modelId): void
    {
        $ids = $this->ids($session);
        $ids = array_values(array_filter($ids, static fn (int $id): bool => $id !== $modelId));
        array_unshift($ids, $modelId);

        $session->put(self::KEY, array_slice($ids, 0, self::LIMIT));
    }

    /** @return list<int> */
    public function ids(Session $session): array
    {
        $raw = $session->get(self::KEY, []);

        if (! is_array($raw)) {
            return [];
        }

        $ids = [];

        foreach ($raw as $id) {
            if (is_int($id) && $id > 0) {
                $ids[] = $id;
            }
        }

        return $ids;
    }
}
