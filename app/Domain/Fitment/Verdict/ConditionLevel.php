<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * How loud an Auflage is, as the operator classifies it (the client's #23, D-104; decided further on 17.10.2026, D-260,
 * D-261):
 *
 *   hinweis          nothing to do, just know it
 *   auflage          something must be done, or use is restricted
 *   nicht_zulaessig  not permitted — where the document says so
 *
 * A level may change what the customer reads; it may never change what he may do. It moves one thing: the badge's
 * words, „Freigegeben“ where every Auflage of a verdict is a Hinweis, „Mit Auflagen“ where one is more — every Auflage
 * still listed beneath. Never the verdict, the tyres offered or the wheels shown (`LevelsChangeNoAnswerTest`). In the
 * shop no level has a colour or a badge of its own: a refusal reads as the shape of what is permitted — „nur
 * Vorderachse“ beside a size, the document's own sentence — and one that keeps a car out entirely is named in the
 * answer's reason. One rule cannot be configured away: an Abnahme or work on the body is always at least an Auflage
 * (`floorFor`), in the form, in the model and in the database — so nobody can make a wheel that needs a Prüfer look as
 * if it needed nothing.
 */
enum ConditionLevel: string
{
    case Hinweis = 'hinweis';
    case Auflage = 'auflage';
    case NichtZulaessig = 'nicht_zulaessig';

    /** The kinds that are never a mere Hinweis. */
    public const LOCKED_KINDS = [ConditionKind::Abnahme, ConditionKind::Karosseriearbeit];

    /** The one sentence the form says beside a locked kind. */
    public const FLOOR_SENTENCE = 'Eine Abnahme oder Arbeit an der Karosserie ist immer eine Auflage: Sonst könnte jemand kaufen, ohne zu wissen, dass ein Prüfer oder eine Werkstatt nötig ist.';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $level): string => $level->value, self::cases());
    }

    public function weight(): int
    {
        return match ($this) {
            self::Hinweis => 0,
            self::Auflage => 1,
            self::NichtZulaessig => 2,
        };
    }

    public function labelDe(): string
    {
        return match ($this) {
            self::Hinweis => 'Hinweis – nichts zu tun',
            self::Auflage => 'Auflage – etwas ist zu tun oder eingeschränkt',
            self::NichtZulaessig => 'Nicht zulässig',
        };
    }

    /**
     * What the shop does with it, said to whoever sets it — only what the shop really does: the level can turn an
     * answer's „Mit Auflagen“ into „Freigegeben“ (`FitmentVerdict::notesOnly`: every Auflage a Hinweis, no Eintragung,
     * the tyres confirmed without Auflagen), it colours no sentence, and it never makes an answer „Mit Auflagen“ that the
     * kinds of its Auflagen leave free — so „Nicht zulässig“ reads there as an Auflage does. The toast said „Der Shop zeigt die
     * Auflage jetzt als ‚Nicht zulässig‘“ until 16.10.2026, which nothing in the shop did (#23, D-247).
     */
    public function shopEffectDe(): string
    {
        return match ($this) {
            self::Hinweis => 'Sind alle Auflagen einer Antwort Hinweise, ist keine Eintragung nötig und sind auch die Reifen ohne Auflagen bestätigt, steht im Shop „Freigegeben“ statt „Mit Auflagen“.',
            self::Auflage => 'Bei einer Antwort mit diesem Code wird im Shop aus „Mit Auflagen“ nie „Freigegeben“.',
            self::NichtZulaessig => 'Im Shop wirkt das wie eine Auflage: Aus „Mit Auflagen“ wird nie „Freigegeben“, und der Satz bekommt keine eigene Farbe.',
        };
    }

    /** The lowest level an Auflage of this kind may have. */
    public static function floorFor(?ConditionKind $kind): self
    {
        return in_array($kind, self::LOCKED_KINDS, true) ? self::Auflage : self::Hinweis;
    }

    /** Whether this level may be chosen for an Auflage of this kind. */
    public function allowedFor(?ConditionKind $kind): bool
    {
        return $this->weight() >= self::floorFor($kind)->weight();
    }

    /** This level, raised to the kind's floor where it is below it. */
    public function atLeastFloorOf(?ConditionKind $kind): self
    {
        return $this->allowedFor($kind) ? $this : self::floorFor($kind);
    }

    /**
     * The level an Auflage has until a person chooses one (the operator's defaults, 02.10.2026): A14, A18, R37, R70,
     * the snow-chain notes and the fasteners are Hinweise; A01, every K-code, the drive and body restrictions, R02 and
     * R03 are Auflagen. Anything else follows its kind, and an Auflage of no kind is an Auflage — the louder answer is
     * the safe one.
     */
    public static function defaultFor(string $code, ?ConditionKind $kind, string $textDe): self
    {
        $code = strtoupper(trim($code));

        $level = match (true) {
            in_array($code, ['A14', 'A18', 'R37', 'R70'], true) => self::Hinweis,
            in_array($code, ['A01', 'R02', 'R03'], true), preg_match('/^K\d/', $code) === 1 => self::Auflage,
            str_contains(mb_strtolower($textDe), 'schneekette') => self::Hinweis,
            $kind === ConditionKind::Hinweis, $kind === ConditionKind::Befestigung, $kind === ConditionKind::ReifenKombination => self::Hinweis,
            default => self::Auflage,
        };

        return $level->atLeastFloorOf($kind);
    }
}
