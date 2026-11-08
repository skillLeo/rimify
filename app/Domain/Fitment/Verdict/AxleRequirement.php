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
 *
 * The axle's minimum is the strictest of its sizes'; `bySize` holds each size's own, worked out from what the documents
 * print beside THAT size and the axle's own figures, never a neighbour's (D-431). A tyre is checked against its size's
 * own; the axle's strictest stays the verdict's. Where it is absent — an axle of one size, or an answer frozen before
 * D-431 — every size reads the axle's strictest, which is never the weaker.
 *
 * @phpstan-type SizeMinimum array{key: string, minLoadIndex: int|null, minSpeedSymbol: string|null, minLoadSource: string, minSpeedSource: string}
 */
final readonly class AxleRequirement
{
    public MinSource $minLoadSource;

    public MinSource $minSpeedSource;

    /**
     * `$provenance` says where the figures came from (D-242): `customer` — typed from the papers — or `dataset`, and the
     * papers' own index where given. Null where the customer typed nothing: then every figure is our vehicle data's.
     *
     * @param  list<TyreSize>  $sizes
     * @param  array{axleLoadFrom: string|null, topSpeedFrom: string|null, papersLoadIndex?: int, papersSpeedSymbol?: string}|null  $provenance
     * @param  list<SizeMinimum>  $bySize
     */
    public function __construct(
        public array $sizes,
        public ?int $minLoadIndex,
        public ?string $minSpeedSymbol,
        public MinSource $minSource,
        ?MinSource $minLoadSource = null,
        ?MinSource $minSpeedSource = null,
        public ?array $provenance = null,
        public array $bySize = [],
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
     * The minimum a tyre of this size must carry on this axle (D-431): the size's own where the axle holds one, else the
     * axle's strictest.
     *
     * @return array{loadIndex: int|null, speedSymbol: string|null}
     */
    public function minimumFor(TyreSize $size): array
    {
        $own = $this->ownMinimum($size);

        return $own === null
            ? ['loadIndex' => $this->minLoadIndex, 'speedSymbol' => $this->minSpeedSymbol]
            : ['loadIndex' => $own['minLoadIndex'], 'speedSymbol' => $own['minSpeedSymbol']];
    }

    /**
     * Which side of R-06 governed each half of this size's minimum.
     *
     * @return array{load: MinSource, speed: MinSource}
     */
    public function sourcesFor(TyreSize $size): array
    {
        $own = $this->ownMinimum($size);

        return $own === null
            ? ['load' => $this->minLoadSource, 'speed' => $this->minSpeedSource]
            : ['load' => MinSource::from($own['minLoadSource']), 'speed' => MinSource::from($own['minSpeedSource'])];
    }

    /** @return SizeMinimum|null */
    private function ownMinimum(TyreSize $size): ?array
    {
        foreach ($this->bySize as $entry) {
            if ($entry['key'] === $size->key()) {
                return $entry;
            }
        }

        return null;
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
     *     minSpeedSource: string,
     *     provenance?: array{axleLoadFrom: string|null, topSpeedFrom: string|null, papersLoadIndex?: int, papersSpeedSymbol?: string},
     *     bySize?: list<SizeMinimum>
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
            // Frozen with the answer where the customer's figures took part; absent, every figure was ours (D-242).
            ...($this->provenance === null ? [] : ['provenance' => $this->provenance]),
            // Each size's own minimum, frozen with the answer where the axle holds more than one (D-431).
            ...($this->bySize === [] ? [] : ['bySize' => $this->bySize]),
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
     *     minSpeedSource?: string,
     *     provenance?: array{axleLoadFrom: string|null, topSpeedFrom: string|null, papersLoadIndex?: int, papersSpeedSymbol?: string},
     *     bySize?: list<SizeMinimum>
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
            provenance: $data['provenance'] ?? null,
            // Frozen before D-431: none — every size reads the axle's strictest.
            bySize: $data['bySize'] ?? [],
        );
    }

    /** Nothing known, nothing permitted — the shape an UNKNOWN verdict carries. */
    public static function none(): self
    {
        return new self([], null, null, MinSource::Derived);
    }
}
