<?php

declare(strict_types=1);

namespace App\Domain\Storefront;

use JsonException;

/**
 * What the `rmf_garage` cookie carries: the last vehicles the visitor chose, most recent first,
 * at most five. Ids only — no name, no address — so it stays a necessary cookie like the vehicle
 * context, and Laravel encrypts it. A signed-in customer's garage lives in a table and is merged
 * from this cookie on login.
 */
final readonly class Garage
{
    public const COOKIE = 'rmf_garage';

    public const LIMIT = 5;

    /** 90 days, rolling — the same horizon as the vehicle context. */
    public const LIFETIME_MINUTES = 60 * 24 * 90;

    /** @param list<int> $vehicleIds */
    public function __construct(public array $vehicleIds = []) {}

    /** Anything malformed decodes to an empty garage, never an error. */
    public static function decode(?string $payload): self
    {
        if ($payload === null || $payload === '') {
            return new self;
        }

        try {
            $data = json_decode($payload, true, 3, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return new self;
        }

        // A list of ids and nothing else: an object here is another cookie's shape, not ours.
        if (! is_array($data) || ! array_is_list($data)) {
            return new self;
        }

        $ids = [];

        foreach ($data as $id) {
            if (is_int($id) && $id > 0 && ! in_array($id, $ids, true)) {
                $ids[] = $id;
            }
        }

        return new self(array_slice($ids, 0, self::LIMIT));
    }

    public function encode(): string
    {
        return json_encode($this->vehicleIds, JSON_THROW_ON_ERROR);
    }

    /** The chosen vehicle moves to the front; the sixth-oldest drops off. */
    public function with(int $vehicleId): self
    {
        $ids = array_values(array_filter($this->vehicleIds, static fn (int $id): bool => $id !== $vehicleId));
        array_unshift($ids, $vehicleId);

        return new self(array_slice($ids, 0, self::LIMIT));
    }

    public function without(int $vehicleId): self
    {
        return new self(array_values(array_filter($this->vehicleIds, static fn (int $id): bool => $id !== $vehicleId)));
    }

    public function isEmpty(): bool
    {
        return $this->vehicleIds === [];
    }
}
