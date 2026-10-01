<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

use InvalidArgumentException;

/**
 * An Auflage, as the customer reads it.
 *
 * R-15: a bare code such as `A02` must never reach a customer, so constructing a Condition without
 * a German sentence throws. The code travels alongside for filtering, reporting and the audit
 * trail — it is never what gets rendered.
 */
final readonly class Condition
{
    /**
     * The key the global catalogue gave the entry Auflage before Auflagen belonged to their document. A
     * snapshot frozen then still says so; a live Auflage says it by its kind (`abnahme`).
     */
    public const ENTRY_REQUIRED = 'ENTRY_REQUIRED';

    /** The Auflage that says no entry is needed: never shown where any source requires one. */
    public const NO_ENTRY_REQUIRED = 'NO_ENTRY_REQUIRED';

    public function __construct(
        public string $code,
        public Severity $severity,
        public string $textDe,
        public ?string $textEn = null,
        public bool $affectsTyreChoice = false,
        public bool $affectsPurchase = false,
        public bool $requiresAcknowledgement = false,
        /** A qualifier this particular document added to the standard wording. */
        public ?string $noteDe = null,
        /** What a person classified it as, in its own document. Null only in snapshots frozen before kinds. */
        public ?ConditionKind $kind = null,
        /** The page of the document the sentence stands on. */
        public ?int $sourcePage = null,
        /**
         * A `reifen_tragfaehigkeit` Auflage: the permitted axle load it allows up to, in kg (T88 → 1.120).
         * The tyre half of the verdict sets it beside the car's figures (R-03).
         */
        public ?int $maxAxleLoadKg = null,
        /**
         * How loud it is (#23, D-104): set per Auflage of its document. Null in a snapshot frozen before levels, and
         * for our own sentences — `level()` then gives the default, never below the kind's floor.
         */
        public ?ConditionLevel $level = null,
    ) {
        if (trim($textDe) === '') {
            throw new InvalidArgumentException(
                "Condition [{$code}] has no German sentence. A customer must never be shown a bare "
                .'code and left to work out what it means (R-15).'
            );
        }
    }

    /**
     * An Auflage of its document, as the customer reads it: the kind decides severity and flags, so
     * nothing about what it asks of the customer is typed twice.
     */
    public static function ofKind(string $code, ConditionKind $kind, string $textDe, ?string $noteDe = null, ?int $sourcePage = null, ?int $maxAxleLoadKg = null, ?ConditionLevel $level = null): self
    {
        return new self(
            code: $code,
            severity: $kind->severity(),
            textDe: $textDe,
            affectsTyreChoice: $kind->affectsTyreChoice(),
            affectsPurchase: $kind->severity()->affectsPurchaseByDefault(),
            requiresAcknowledgement: $kind->severity()->requiresAcknowledgement(),
            noteDe: $noteDe,
            kind: $kind,
            sourcePage: $sourcePage,
            maxAxleLoadKg: $kind === ConditionKind::ReifenTragfaehigkeit ? $maxAxleLoadKg : null,
            level: $level?->atLeastFloorOf($kind),
        );
    }

    /** How loud it is: as chosen for its document, else the default — never below its kind's floor (D-104). */
    public function level(): ConditionLevel
    {
        return ($this->level ?? ConditionLevel::defaultFor($this->code, $this->kind, $this->textDe))->atLeastFloorOf($this->kind);
    }

    /** Whether this Auflage makes the Eintragung necessary: an Abnahme, or the old catalogue's entry key. */
    public function requiresEntry(): bool
    {
        return $this->kind === ConditionKind::Abnahme || ($this->kind === null && $this->code === self::ENTRY_REQUIRED);
    }

    /** The full sentence, including any document-specific qualifier. */
    public function sentenceDe(): string
    {
        return $this->noteDe === null || trim($this->noteDe) === ''
            ? $this->textDe
            : $this->textDe.' '.trim($this->noteDe);
    }

    /**
     * Does this condition make the verdict CONDITIONAL rather than PERMITTED?
     *
     * An explicit `affectsPurchase` flag wins; otherwise anything above INFO does. Treating every
     * condition as alarming teaches customers to ignore all of them, including the one that
     * matters, so INFO deliberately does not downgrade the verdict.
     */
    public function downgradesVerdict(): bool
    {
        return $this->affectsPurchase || $this->severity->affectsPurchaseByDefault();
    }

    /**
     * The three flags travel with the sentence: a frozen verdict that rebuilt every condition
     * with `affectsTyreChoice: false` could not show, eleven months on, that the Gutachten did
     * restrict which tyres were allowed — and would answer more permissively than the live one.
     *
     * @return array{
     *     code: string, severity: string, textDe: string, textEn: string|null,
     *     affectsTyreChoice: bool, affectsPurchase: bool, requiresAcknowledgement: bool,
     *     kind: string|null, sourcePage: int|null, maxAxleLoadKg: int|null, level: string
     * }
     */
    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'severity' => $this->severity->value,
            'textDe' => $this->sentenceDe(),
            'textEn' => $this->textEn,
            'affectsTyreChoice' => $this->affectsTyreChoice,
            'affectsPurchase' => $this->affectsPurchase,
            'requiresAcknowledgement' => $this->requiresAcknowledgement,
            // Additive: a snapshot written before kinds reads them as null.
            'kind' => $this->kind?->value,
            'sourcePage' => $this->sourcePage,
            'maxAxleLoadKg' => $this->maxAxleLoadKg,
            // Additive (D-104): how loud it was when frozen; a snapshot written before levels reads the default.
            'level' => $this->level()->value,
        ];
    }

    /**
     * @param array{
     *     code: string, severity: string, textDe: string, textEn?: string|null,
     *     affectsTyreChoice?: bool, affectsPurchase?: bool, requiresAcknowledgement?: bool,
     *     kind?: string|null, sourcePage?: int|null, maxAxleLoadKg?: int|null, level?: string|null
     * } $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            code: $data['code'],
            severity: Severity::from($data['severity']),
            textDe: $data['textDe'],
            textEn: $data['textEn'] ?? null,
            // Snapshots written before the flags were carried read as the constructor defaults.
            affectsTyreChoice: (bool) ($data['affectsTyreChoice'] ?? false),
            affectsPurchase: (bool) ($data['affectsPurchase'] ?? false),
            requiresAcknowledgement: (bool) ($data['requiresAcknowledgement'] ?? false),
            kind: isset($data['kind']) ? ConditionKind::tryFrom((string) $data['kind']) : null,
            sourcePage: isset($data['sourcePage']) ? (int) $data['sourcePage'] : null,
            maxAxleLoadKg: isset($data['maxAxleLoadKg']) ? (int) $data['maxAxleLoadKg'] : null,
            level: isset($data['level']) ? ConditionLevel::tryFrom((string) $data['level']) : null,
        );
    }

    /**
     * Restriction first, info last — the expensive obligations before the ones that change nothing.
     *
     * @param  list<self>  $conditions
     * @return list<self>
     */
    public static function sorted(array $conditions): array
    {
        usort($conditions, static function (self $a, self $b): int {
            return [$b->severity->weight(), $a->code] <=> [$a->severity->weight(), $b->code];
        });

        return $conditions;
    }

    /**
     * The union of two condition sets, keyed by code and sentence.
     *
     * Union is the safe default when documents disagree: showing a condition that turns out not to
     * apply costs the customer a moment's reading, while omitting one that does apply costs them a
     * workshop visit they did not budget for. A code means what its own document says, so the same
     * code with another sentence (`A01` of two documents) is two Auflagen, never one.
     *
     * @param  list<self>  $a
     * @param  list<self>  $b
     * @return list<self>
     */
    public static function union(array $a, array $b): array
    {
        $merged = [];

        foreach ([...$a, ...$b] as $condition) {
            $merged[$condition->code."\u{0}".$condition->sentenceDe()] ??= $condition;
        }

        return self::sorted(array_values($merged));
    }
}
