<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Data\TyreSize;

/**
 * A Gutachten's table of front/rear tyre pairings, read from the sentence of its `reifen_kombination` Auflage
 * (#20, D-105). ABE 55255 prints it as V19 on page 12:
 *
 *     … möglich: (Vorderachse – Hinterachse) Nr. 1: 215/35R19 – 245/30R19, 255/30R19; Nr. 2: … ;
 *     Nr. 27: 275/30R19 – 315/25R19. Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps
 *     zulässig, …
 *
 * Read strictly or not at all: the axle order must be printed — `(Vorderachse – Hinterachse)` — the entries
 * numbered 1, 2, 3 … without a gap, and every entry exactly one front size, a dash and one or more rear sizes.
 * Anything else reads as no table, and no pair is offered (fails closed, CLAUDE.md §2): a table read half
 * right could put a rear size on the front axle.
 *
 * A document's own list of „Bereifungskombinationen“, entered as such (`document_tyre_combinations`, D-256), is the
 * same table built from its rows instead of a sentence (recorded()): every pair as printed, the same size on both
 * axles included, each with its row (`TyrePairing::$id`) — the Komplettrad is then the combination (D-335).
 */
final readonly class TyrePairingTable
{
    private const SIZE = '(\d{3})\s*\/\s*(\d{2})\s*Z?R\s*(\d{2})';

    private const DASH = '\s*[–—‑-]\s*';

    /** @param list<TyrePairing> $pairs */
    private function __construct(
        public array $pairs,
        /** What the document says after the table — the conditions every pair carries, in its own words. */
        public ?string $rulesDe,
        /** The page the pairs stand on, where it is recorded with them — a recorded list's; a sentence's page is its Auflage's. */
        public ?int $sourcePage = null,
        /**
         * The document lists its combinations per vehicle type, and none of its entries takes in this car's EG number (his
         * admin item 19, D-358): a list with no pair — never another type's, never no list at all, which would restrict
         * nothing. The tyres are then „Noch nicht bestätigt“ (FitmentResolver) and no Komplettrad is offered.
         */
        public bool $unmatched = false,
    ) {}

    /** A document's list with no entry for this car (D-358): nothing offered, and the tyres not confirmed. */
    public static function unmatched(?int $sourcePage): self
    {
        return new self([], null, $sourcePage, true);
    }

    /**
     * A document's list of combinations as entered (D-256), in its own numbering — `Kombination 2: vorn 225/40 R18,
     * hinten 245/35 R18` — on its page.
     *
     * @param  list<TyrePairing>  $pairs
     */
    public static function recorded(array $pairs, ?int $sourcePage): self
    {
        return new self($pairs, null, $sourcePage);
    }

    public static function parse(string $text): self
    {
        $text = trim((string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', ' ', $text));

        if (preg_match('/\(\s*Vorderachse'.self::DASH.'Hinterachse\s*\)\s*(.*)$/u', $text, $after) !== 1) {
            return self::none();
        }

        // The entries, each up to the next „Nr.“; the last one up to the sentence that follows the table.
        if (preg_match_all('/Nr\.\s*(\d+)\s*:\s*(.*?)(?=;\s*Nr\.\s*\d+\s*:|\.\s+\p{Lu}|\.?\s*$)/u', $after[1], $entries, PREG_SET_ORDER | PREG_OFFSET_CAPTURE) === 0) {
            return self::none();
        }

        $pairs = [];
        $end = 0;

        foreach ($entries as $i => $entry) {
            $number = (int) $entry[1][0];

            if ($number !== $i + 1) {
                return self::none();
            }

            $read = self::entry($number, trim($entry[2][0]));

            if ($read === null) {
                return self::none();
            }

            $pairs = [...$pairs, ...$read];
            $end = $entry[2][1] + strlen($entry[2][0]);
        }

        $rest = trim(ltrim(substr($after[1], $end), '.;'));

        return new self($pairs, $rest === '' ? null : $rest);
    }

    /** The same table, on the page of the Auflage whose sentence prints it. */
    public function onPage(?int $page): self
    {
        return new self($this->pairs, $this->rulesDe, $page, $this->unmatched);
    }

    /** Whether a table was read at all. */
    public function isRead(): bool
    {
        return $this->pairs !== [];
    }

    /** Whether it pairs any two different sizes — something to say about Mischbereifung at all. */
    public function hasMixedPair(): bool
    {
        foreach ($this->pairs as $pair) {
            if (! $pair->front->matches($pair->rear)) {
                return true;
            }
        }

        return false;
    }

    /** The entry permitting this front size with this rear size, or null: the document's order only. */
    public function find(TyreSize $front, TyreSize $rear): ?TyrePairing
    {
        foreach ($this->pairs as $pair) {
            if ($pair->front->matches($front) && $pair->rear->matches($rear)) {
                return $pair;
            }
        }

        return null;
    }

    /**
     * The pairs both tables permit — where two Auflagen print a table, only what each allows is offered. The pairs keep
     * this table's numbers, and so its page.
     */
    public function intersect(self $other): self
    {
        $keys = array_map(static fn (TyrePairing $p): string => $p->key(), $other->pairs);

        return new self(
            array_values(array_filter($this->pairs, static fn (TyrePairing $p): bool => in_array($p->key(), $keys, true))),
            trim(implode(' ', array_unique(array_filter([$this->rulesDe, $other->rulesDe])))) ?: null,
            $this->sourcePage,
            // A list with no entry for the car stays one, whatever it is read with: nothing is offered either way.
            $this->unmatched || $other->unmatched,
        );
    }

    public static function none(): self
    {
        return new self([], null);
    }

    /** @return list<TyrePairing>|null `235/45R19 – 255/40R19, 265/40R19`: one front size, a dash, one or more rear sizes. */
    private static function entry(int $number, string $body): ?array
    {
        if (preg_match('/^'.self::SIZE.self::DASH.'(.+)$/u', $body, $parts) !== 1) {
            return null;
        }

        $front = new TyreSize((int) $parts[1], (int) $parts[2], (float) $parts[3]);
        $pairs = [];

        foreach (explode(',', $parts[4]) as $rearText) {
            if (preg_match('/^'.self::SIZE.'$/u', trim($rearText), $rear) !== 1) {
                return null;
            }

            $pairs[] = new TyrePairing($number, $front, new TyreSize((int) $rear[1], (int) $rear[2], (float) $rear[3]));
        }

        return $pairs;
    }
}
