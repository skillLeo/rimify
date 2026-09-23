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
    ) {
        if (trim($textDe) === '') {
            throw new InvalidArgumentException(
                "Condition [{$code}] has no German sentence. A customer must never be shown a bare "
                .'code and left to work out what it means (R-15).'
            );
        }
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
     *     affectsTyreChoice: bool, affectsPurchase: bool, requiresAcknowledgement: bool
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
        ];
    }

    /**
     * @param array{
     *     code: string, severity: string, textDe: string, textEn?: string|null,
     *     affectsTyreChoice?: bool, affectsPurchase?: bool, requiresAcknowledgement?: bool
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
     * The union of two condition sets, keyed by code.
     *
     * Union is the safe default when documents disagree: showing a condition that turns out not to
     * apply costs the customer a moment's reading, while omitting one that does apply costs them a
     * workshop visit they did not budget for.
     *
     * @param  list<self>  $a
     * @param  list<self>  $b
     * @return list<self>
     */
    public static function union(array $a, array $b): array
    {
        $merged = [];

        foreach ([...$a, ...$b] as $condition) {
            $merged[$condition->code] ??= $condition;
        }

        return self::sorted(array_values($merged));
    }
}
