<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Data\TyreRecord;

/**
 * What a document's own Auflage says about the makers and profile types a set's tyres may come in — read from the
 * sentence that follows its pairing table (TyrePairingTable::$rulesDe), never assumed (R-17, D-336).
 *
 * ABE 55255 prints it as V19 on page 12: „Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps
 * zulässig“ — one maker on every tyre, one profile type on each axle. Another document says „vorn und hinten nur Reifen
 * eines Herstellers und Typs“ — one maker and one type on every tyre. The two differ, so the rule is each document's own:
 * where the sentence says nothing of makers or profiles, nothing is asked; a set of two tyre lines, or of two makers, is
 * refused only where the recorded sentence asks for one.
 *
 * Read strictly or not at all, as the table is: a sentence that speaks of makers or profile types in words not read here
 * is not read (`$read` false), and the offer fails closed on it (rule 2, TyreChoiceRestricted) — a rule read half right
 * could sell a set the document does not allow.
 *
 * A set carries two of one tyre on each axle (D-335), so a rule for each axle is kept by every set; only a rule for every
 * tyre can part front and rear.
 */
final readonly class TyreLineRule
{
    /** The rule holds for every tyre of the set. */
    public const SET = 'SET';

    /** The rule holds for the two tyres of each axle. */
    public const AXLE = 'AXLE';

    /** What a front and a rear tyre break: one maker asked on every tyre. */
    public const MAKER = 'MAKER';

    /** What they break: one profile type asked on every tyre. */
    public const PROFILE = 'PROFILE';

    /**
     * The clauses read, most specific first: the pattern, then the scope of the maker and of the profile type it sets.
     *
     * @var list<array{0: string, 1: string, 2: string|null}>
     */
    private const CLAUSES = [
        // ABE 55255, V19: one maker on every tyre, one profile type on each axle.
        ['/(?:Es sind\s+)?(?:vorne?\s+und\s+hinten\s+)?nur\s+Reifen\s+eines\s+Herstellers\s+und\s+achsweise\s+eines\s+Profiltyps(?:\s+zulässig)?/iu', self::SET, self::AXLE],
        // One maker and one profile type on each axle — before the clauses for every tyre, which it contains.
        ['/(?:Es sind\s+)?achsweise\s+(?:nur\s+)?Reifen\s+eines\s+Herstellers\s+und\s+(?:eines\s+)?(?:Profiltyps|Typs)(?:\s+zulässig)?/iu', self::AXLE, self::AXLE],
        // One maker and one type on every tyre: „Es sind vorn und hinten nur Reifen eines Herstellers und Typs zulässig.“
        ['/(?:Es sind\s+)?(?:vorne?\s+und\s+hinten\s+)?nur\s+Reifen\s+eines\s+Herstellers\s+und\s+(?:eines\s+)?(?:Profiltyps|Typs)(?:\s+zulässig)?/iu', self::SET, self::SET],
        // One maker on every tyre, nothing about the profile.
        ['/(?:Es sind\s+)?(?:vorne?\s+und\s+hinten\s+)?nur\s+Reifen\s+eines\s+Herstellers(?!\s+und\s+(?:achsweise|eines|Typs|Profil))(?:\s+zulässig)?/iu', self::SET, null],
    ];

    /** A word that speaks of makers or profile types on its own — „Fahrzeughersteller“ is not one of them. */
    private const SPEAKS = '/(?<![\p{L}-])(?:Herstellers?|Profiltyps?|Profils?|Profilausführung\w*|Typs)(?![\p{L}])/iu';

    /**
     * Beside a clause read: a word of makers or profiles, or of the axle a rule holds for, left over means the sentence
     * says more than the clause — „Es sind achsweise …“ read as a rule for every tyre would be a rule half read.
     */
    private const LEFT_OVER = '/(?<![\p{L}-])(?:Herstellers?|Profiltyps?|Profils?|Profilausführung\w*|Typs|achsweise|Achse)(?![\p{L}])/iu';

    private function __construct(
        /** One maker on every tyre (SET), on each axle (AXLE), or nothing said. */
        public ?string $maker,
        /** One profile type on every tyre (SET), on each axle (AXLE), or nothing said. */
        public ?string $profile,
        /** False where the sentence speaks of makers or profile types in words not read here. */
        public bool $read,
        /** The clause as the document words it, to be quoted — never rephrased as a rule of ours (R-17). */
        public ?string $clauseDe,
        /** Whether the document's sentence carries on after the clause, so a quote of it ends in „…“. */
        public bool $clauseContinues = false,
    ) {}

    /** Nothing said about makers or profiles. */
    public static function none(): self
    {
        return new self(null, null, true, null);
    }

    public static function parse(?string $text): self
    {
        $text = trim((string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', ' ', (string) $text));

        if ($text === '' || preg_match(self::SPEAKS, $text) !== 1) {
            return self::none();
        }

        foreach (self::CLAUSES as [$pattern, $maker, $profile]) {
            if (preg_match($pattern, $text, $match, PREG_OFFSET_CAPTURE) !== 1) {
                continue;
            }

            [$clause, $offset] = $match[0];
            $rest = substr($text, 0, $offset).' '.substr($text, $offset + strlen($clause));

            // A second word about makers, profiles or the axle beside the clause read: not read at all, never half.
            if (preg_match(self::LEFT_OVER, $rest) === 1) {
                return new self(null, null, false, null);
            }

            return new self($maker, $profile, true, trim($clause), preg_match('/^\s*,/u', substr($text, $offset + strlen($clause))) === 1);
        }

        return new self(null, null, false, null);
    }

    /**
     * What a set breaks — `MAKER` where the document asks for one maker on every tyre and front and rear are two, `PROFILE`
     * where it asks for one profile type on every tyre and they are two —, or null where it keeps the rule. A name we do
     * not hold is not „the same“: a rule for every tyre is kept only by names on record.
     */
    public function broken(TyreRecord $front, TyreRecord $rear): ?string
    {
        $sameMaker = self::same($front->brandName, $rear->brandName);

        if ($this->maker === self::SET && ! $sameMaker) {
            return self::MAKER;
        }

        if ($this->profile === self::SET && ! ($sameMaker && self::same($front->name, $rear->name))) {
            return self::PROFILE;
        }

        return null;
    }

    /**
     * The clause as a quote — „Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig […]“, the cut
     * marked where the document's sentence carries on; its own full stop inside where it ends there. Null where none was read.
     */
    public function quoteDe(): ?string
    {
        if ($this->clauseDe === null) {
            return null;
        }

        return "\u{201E}".$this->clauseDe.($this->clauseContinues ? ' […]' : '.')."\u{201C}";
    }

    private static function same(?string $a, ?string $b): bool
    {
        return $a !== null && $b !== null && trim($a) !== '' && mb_strtolower(trim($a)) === mb_strtolower(trim($b));
    }
}
