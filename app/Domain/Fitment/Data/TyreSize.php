<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

use App\Domain\Fitment\Verdict\Condition;
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
    /** @param list<Condition> $conditions the Auflagen the document hangs off this size itself */
    public function __construct(
        public int $widthMm,
        public int $aspect,
        public float $diameterIn,
        public ?int $documentMinLoadIndex = null,
        public ?string $documentMinSpeedSymbol = null,
        public string $axle = 'ALL',
        /**
         * Whether this size needs the Eintragung: derived from an Abnahme among its own Auflagen and
         * the row's, or set by a person with a reason (the corrections memo §2). Never typed.
         */
        public bool $requiresEntry = false,
        public array $conditions = [],
        /**
         * The kW band the document states for this size (Block D; the Borbet brief §2.6) — ABE 55255 gives
         * BMW 1er 187 its 215/35R19 at 85–125 kW, its 225/35R19 at 85–195 kW. Null: no band stated.
         */
        public ?int $kwMin = null,
        public ?int $kwMax = null,
    ) {}

    public function hasPowerBand(): bool
    {
        return $this->kwMin !== null && $this->kwMax !== null;
    }

    /**
     * Whether a car of this power may carry the size: yes where no band is stated, and yes — for now — where
     * the car's power is not known; the verdict then says which band to compare with field P.2 and is never
     * PERMITTED (the resolver). A known power outside the band: no.
     */
    public function allowsPower(?int $powerKw): bool
    {
        return ! $this->hasPowerBand() || $powerKw === null || ($powerKw >= $this->kwMin && $powerKw <= $this->kwMax);
    }

    /** `85–195 kW` */
    public function powerBandDe(): ?string
    {
        return $this->hasPowerBand() ? GermanFormat::integer((int) $this->kwMin).GermanFormat::ENDASH.GermanFormat::integer((int) $this->kwMax).GermanFormat::NBSP.'kW' : null;
    }

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
     *     documentMinLoadIndex: int|null, documentMinSpeedSymbol: string|null, axle: string,
     *     requiresEntry: bool, conditions: list<array<string, mixed>>, kwMin: int|null, kwMax: int|null
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
            'requiresEntry' => $this->requiresEntry,
            'conditions' => array_map(static fn (Condition $c): array => $c->toArray(), $this->conditions),
            'kwMin' => $this->kwMin,
            'kwMax' => $this->kwMax,
        ];
    }

    /**
     * @param array{
     *     width: int, aspect: int, diameter: float|int|string,
     *     documentMinLoadIndex?: int|null, documentMinSpeedSymbol?: string|null, axle?: string,
     *     requiresEntry?: bool, conditions?: list<array{code: string, severity: string, textDe: string}>,
     *     kwMin?: int|null, kwMax?: int|null
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
            requiresEntry: (bool) ($data['requiresEntry'] ?? false),
            conditions: array_map(static fn (array $c): Condition => Condition::fromArray($c), $data['conditions'] ?? []),
            // Additive: a snapshot frozen before the band reads without one.
            kwMin: isset($data['kwMin']) ? (int) $data['kwMin'] : null,
            kwMax: isset($data['kwMax']) ? (int) $data['kwMax'] : null,
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
