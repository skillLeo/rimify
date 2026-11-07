<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Resolver;

/**
 * What a car's released papers say about versions front and rear: the sets they name, and the versions that may only go on the
 * car inside a set, which are never sold as four.
 */
final readonly class WheelSetOffer
{
    /**
     * @param  list<WheelSet>  $sets
     * @param  array<int, true>  $onlyInSets  configuration id => true
     */
    public function __construct(
        public array $sets = [],
        public array $onlyInSets = [],
    ) {}

    public function onlyInSet(int $configId): bool
    {
        return isset($this->onlyInSets[$configId]);
    }

    /** The first set this version stands in. */
    public function setOf(int $configId): ?WheelSet
    {
        foreach ($this->sets as $set) {
            if ($set->frontConfigId === $configId || $set->rearConfigId === $configId) {
                return $set;
            }
        }

        return null;
    }
}
