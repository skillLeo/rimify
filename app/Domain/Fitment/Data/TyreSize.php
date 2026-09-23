<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

use App\Support\GermanFormat;

/**
 * A tyre size a document permits: `245/45 R18`.
 *
 * `documentMinLoadIndex` and `documentMinSpeedSymbol` are what THIS document stated for THIS size,
 * where it stated anything. They are the document half of R-06; null means the document was
 * silent and the derivation governs alone.
 *
 * `axle` is the axle the document scoped this size to. The normal shape of a staggered
 * Teilegutachten line is one fitment row for all axles carrying a `FRONT` size and a `REAR` size;
 * a size scoped to one axle is never offered as a four-wheel set (spec §3.3 rule 3b).
 */
final readonly class TyreSize
{
    public function __construct(
        public int $widthMm,
        public int $aspect,
        public float $diameterIn,
        public ?int $documentMinLoadIndex = null,
        public ?string $documentMinSpeedSymbol = null,
        public string $axle = 'ALL',
    ) {}

    /** Identity for set operations: the size itself, not the minima or the axle attached to it. */
    public function key(): string
    {
        return sprintf('%d/%d/%s', $this->widthMm, $this->aspect, rtrim(rtrim(number_format($this->diameterIn, 1, '.', ''), '0'), '.'));
    }

    public function matches(self $other): bool
    {
        return $this->key() === $other->key();
    }

    /** Does the document permit this size on the named axle (`FRONT` or `REAR`)? */
    public function coversAxle(string $axle): bool
    {
        return $this->axle === 'ALL' || $this->axle === $axle;
    }

    /** `245/45 R18` */
    public function labelDe(): string
    {
        return GermanFormat::tyreSize($this->widthMm, $this->aspect, $this->diameterIn);
    }

    /**
     * Additive over the original three keys: a snapshot written before the minima and the axle
     * were carried still reads, and one written now can reproduce the decision it evidences.
     *
     * @return array{
     *     width: int, aspect: int, diameter: float,
     *     documentMinLoadIndex: int|null, documentMinSpeedSymbol: string|null, axle: string
     * }
     */
    public function toArray(): array
    {
        return [
            'width' => $this->widthMm,
            'aspect' => $this->aspect,
            'diameter' => $this->diameterIn,
            'documentMinLoadIndex' => $this->documentMinLoadIndex,
            'documentMinSpeedSymbol' => $this->documentMinSpeedSymbol,
            'axle' => $this->axle,
        ];
    }

    /**
     * @param array{
     *     width: int, aspect: int, diameter: float|int|string,
     *     documentMinLoadIndex?: int|null, documentMinSpeedSymbol?: string|null, axle?: string
     * } $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            widthMm: $data['width'],
            aspect: $data['aspect'],
            diameterIn: (float) $data['diameter'],
            documentMinLoadIndex: $data['documentMinLoadIndex'] ?? null,
            documentMinSpeedSymbol: $data['documentMinSpeedSymbol'] ?? null,
            axle: $data['axle'] ?? 'ALL',
        );
    }

    /**
     * The intersection of two size sets, by size identity.
     *
     * Intersection is the safe default when two documents disagree about sizes: offering a size
     * only one of them permits is the permissive answer, and this system does not fail that way.
     *
     * @param  list<self>  $a
     * @param  list<self>  $b
     * @return list<self>
     */
    public static function intersect(array $a, array $b): array
    {
        $bKeys = array_map(static fn (self $s): string => $s->key(), $b);

        return array_values(array_filter(
            $a,
            static fn (self $size): bool => in_array($size->key(), $bKeys, true),
        ));
    }
}
