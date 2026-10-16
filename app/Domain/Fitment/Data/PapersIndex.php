<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

/**
 * The tyre index the car's own papers name — fields 15.1 (front axle) and 15.2 (rear axle) of the Zulassungsbescheinigung
 * Teil I, `225/45 R17 91W` — as the customer typed them (the operator's decisions of 14.10.2026 §3 and 15.10.2026 §2.1,
 * D-242). A document such as the BBS Teilegutachten delegates: „Der erforderliche Geschwindigkeits-/Lastindex ist den
 * Fahrzeugpapieren zu entnehmen“.
 *
 * The engine takes the stricter of this and the index it computes from the axle loads and the top speed — never the
 * weaker. It is a floor that can only raise: it never stands in for a computation that is missing, because a tyre answer
 * is never positive without the car's permitted axle loads and top speed (R-03).
 *
 * Only what a passenger car's papers can print is held; anything else was mistyped and is refused where it is typed.
 */
final readonly class PapersIndex
{
    /**
     * The speed symbols a passenger car tyre carries, slowest first — H sits between U and V, as the derating table has
     * it; `(Y)` last, the tyre rated above 300 km/h whose papers print `(94Y)`.
     */
    public const SYMBOLS = ['L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', '(Y)'];

    public const LOAD_MIN = 60;

    public const LOAD_MAX = 130;

    private function __construct(
        public int $frontLoadIndex,
        public string $frontSpeedSymbol,
        public int $rearLoadIndex,
        public string $rearSpeedSymbol,
    ) {}

    /** Null when either axle's index or symbol is not one a passenger car's papers can print. */
    public static function tryFrom(int $frontLoadIndex, string $frontSpeedSymbol, int $rearLoadIndex, string $rearSpeedSymbol): ?self
    {
        foreach ([[$frontLoadIndex, $frontSpeedSymbol], [$rearLoadIndex, $rearSpeedSymbol]] as [$index, $symbol]) {
            if ($index < self::LOAD_MIN || $index > self::LOAD_MAX || ! in_array($symbol, self::SYMBOLS, true)) {
                return null;
            }
        }

        return new self($frontLoadIndex, $frontSpeedSymbol, $rearLoadIndex, $rearSpeedSymbol);
    }

    /**
     * The index and the symbol at the end of what field 15.1 or 15.2 prints: `225/45 R17 91W`, `91 W`, `91w` — and
     * `245/35 ZR20 (95Y)`, read as `(Y)`, never as the slower `Y`. Null where there is no such pair at the end — a size
     * without its index tells nothing — and where a bracket is only half there.
     *
     * @return array{0: int, 1: string}|null
     */
    public static function parse(string $typed): ?array
    {
        if (preg_match('/(\()?\s*(\d{2,3})\s*([a-zA-Z])\s*(\))?\s*$/u', trim($typed), $m) !== 1) {
            return null;
        }

        $open = $m[1] !== '';

        if ($open !== (($m[4] ?? '') !== '')) {
            return null;
        }

        $index = (int) $m[2];
        $letter = mb_strtoupper($m[3]);
        $symbol = $open ? '('.$letter.')' : $letter;

        return $index >= self::LOAD_MIN && $index <= self::LOAD_MAX && in_array($symbol, self::SYMBOLS, true) ? [$index, $symbol] : null;
    }

    /** @return array{loadIndex: int, speedSymbol: string, field: string} */
    public function forAxle(string $axle): array
    {
        return $axle === 'REAR'
            ? ['loadIndex' => $this->rearLoadIndex, 'speedSymbol' => $this->rearSpeedSymbol, 'field' => '15.2']
            : ['loadIndex' => $this->frontLoadIndex, 'speedSymbol' => $this->frontSpeedSymbol, 'field' => '15.1'];
    }

    /** `91W`, `(95Y)` — as the papers print it. */
    public function labelFor(string $axle): string
    {
        $index = $this->forAxle($axle);

        return str_starts_with($index['speedSymbol'], '(')
            ? '('.$index['loadIndex'].trim($index['speedSymbol'], '()').')'
            : $index['loadIndex'].$index['speedSymbol'];
    }
}
