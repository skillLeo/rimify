<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

use App\Domain\Fitment\Data\TyreSize;

/**
 * What one axle requires: the permitted sizes, and the minimum a tyre on that axle must carry.
 *
 * Front and rear are separate because they routinely differ — on the Audi RS4 4.2 in the demo data
 * they differ by three load-index steps on the same car. A per-vehicle minimum would quietly
 * under-specify one axle.
 *
 * `minSource` records which side of R-06 governed, so the reasoning can be inspected rather than
 * assumed. It is one combined bit — `Document` when EITHER half came from the document — for the
 * callers that only need one; `minLoadSource` and `minSpeedSource` record each half on its own,
 * because a Gutachten that states only a speed symbol must not be reported as the source of a
 * load index that was derived from the axle load.
 *
 * A null minimum is not "no minimum": it is the engine saying it could not derive one, and the
 * verdict that carries it is UNKNOWN.
 */
final readonly class AxleRequirement
{
    public MinSource $minLoadSource;

    public MinSource $minSpeedSource;

    /** @param list<TyreSize> $sizes */
    public function __construct(
        public array $sizes,
        public ?int $minLoadIndex,
        public ?string $minSpeedSymbol,
        public MinSource $minSource,
        ?MinSource $minLoadSource = null,
        ?MinSource $minSpeedSource = null,
    ) {
        // Defaulted to the combined flag so every existing construction site, and every snapshot
        // written before the halves were recorded, keeps its meaning.
        $this->minLoadSource = $minLoadSource ?? $minSource;
        $this->minSpeedSource = $minSpeedSource ?? $minSource;
    }

    public function hasUsableMinimum(): bool
    {
        return $this->minLoadIndex !== null && $this->minSpeedSymbol !== null;
    }

    public function hasPermittedSizes(): bool
    {
        return $this->sizes !== [];
    }

    /**
     * @return array{
     *     sizes: list<array{
     *         width: int, aspect: int, diameter: float,
     *         documentMinLoadIndex: int|null, documentMinSpeedSymbol: string|null, axle: string
     *     }>,
     *     minLoadIndex: int|null,
     *     minSpeedSymbol: string|null,
     *     minSource: string,
     *     minLoadSource: string,
     *     minSpeedSource: string
     * }
     */
    public function toArray(): array
    {
        return [
            'sizes' => array_map(static fn (TyreSize $s): array => $s->toArray(), $this->sizes),
            'minLoadIndex' => $this->minLoadIndex,
            'minSpeedSymbol' => $this->minSpeedSymbol,
            'minSource' => $this->minSource->value,
            'minLoadSource' => $this->minLoadSource->value,
            'minSpeedSource' => $this->minSpeedSource->value,
        ];
    }

    /**
     * @param array{
     *     sizes: list<array{
     *         width: int, aspect: int, diameter: float|int|string,
     *         documentMinLoadIndex?: int|null, documentMinSpeedSymbol?: string|null, axle?: string
     *     }>,
     *     minLoadIndex: int|null,
     *     minSpeedSymbol: string|null,
     *     minSource: string,
     *     minLoadSource?: string,
     *     minSpeedSource?: string
     * } $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            sizes: array_map(static fn (array $s): TyreSize => TyreSize::fromArray($s), $data['sizes']),
            minLoadIndex: $data['minLoadIndex'],
            minSpeedSymbol: $data['minSpeedSymbol'],
            minSource: MinSource::from($data['minSource']),
            // A snapshot written before the halves existed reads as the combined flag on both.
            minLoadSource: MinSource::from($data['minLoadSource'] ?? $data['minSource']),
            minSpeedSource: MinSource::from($data['minSpeedSource'] ?? $data['minSource']),
        );
    }

    /** Nothing known, nothing permitted — the shape an UNKNOWN verdict carries. */
    public static function none(): self
    {
        return new self([], null, null, MinSource::Derived);
    }
}
