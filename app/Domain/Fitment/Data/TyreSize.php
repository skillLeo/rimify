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
 */
final readonly class TyreSize
{
    public function __construct(
        public int $widthMm,
        public int $aspect,
        public float $diameterIn,
        public ?int $documentMinLoadIndex = null,
        public ?string $documentMinSpeedSymbol = null,
    ) {}

    /** Identity for set operations: the size itself, not the minima attached to it. */
    public function key(): string
    {
        return sprintf('%d/%d/%s', $this->widthMm, $this->aspect, rtrim(rtrim(number_format($this->diameterIn, 1, '.', ''), '0'), '.'));
    }

    public function matches(self $other): bool
    {
        return $this->key() === $other->key();
    }

    /** `245/45 R18` */
    public function labelDe(): string
    {
        return GermanFormat::tyreSize($this->widthMm, $this->aspect, $this->diameterIn);
    }

    /** @return array{width: int, aspect: int, diameter: float} */
    public function toArray(): array
    {
        return [
            'width' => $this->widthMm,
            'aspect' => $this->aspect,
            'diameter' => $this->diameterIn,
        ];
    }

    /** @param array{width: int, aspect: int, diameter: float|int|string} $data */
    public static function fromArray(array $data): self
    {
        return new self($data['width'], $data['aspect'], (float) $data['diameter']);
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
