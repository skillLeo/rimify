<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * Why a verdict is not positive, in a code the system can act on and a sentence the customer can
 * read.
 *
 * The codes are what the catalogue-gap report ranks; the sentences are what a customer sees. The
 * two never swap places (R-15).
 */
final readonly class VerdictReason
{
    public const VEHICLE_NOT_FOUND = 'VEHICLE_NOT_FOUND';

    public const VEHICLE_INCOMPLETE = 'VEHICLE_INCOMPLETE';

    public const NO_DOCUMENT = 'NO_DOCUMENT';

    public const NOT_COVERED = 'NOT_COVERED';

    public const OUTSIDE_BUILD_WINDOW = 'OUTSIDE_BUILD_WINDOW';

    public const WIDTH_OR_ET_OUTSIDE_RANGE = 'WIDTH_OR_ET_OUTSIDE_RANGE';

    public const NO_TYRE_SIZE = 'NO_TYRE_SIZE';

    public const REFERENCE_DATA_MISSING = 'REFERENCE_DATA_MISSING';

    public function __construct(
        public string $code,
        public string $textDe,
    ) {}

    /** @return array{code: string, textDe: string} */
    public function toArray(): array
    {
        return ['code' => $this->code, 'textDe' => $this->textDe];
    }

    /** @param array{code: string, textDe: string} $data */
    public static function fromArray(array $data): self
    {
        return new self($data['code'], $data['textDe']);
    }

    public static function of(string $code): self
    {
        return new self($code, self::sentenceFor($code));
    }

    /**
     * Deliberately plain, and deliberately never apologetic. "We do not know" is a legitimate
     * answer here and is stated as one — it is not framed as a refusal or as a fault.
     */
    public static function sentenceFor(string $code): string
    {
        return match ($code) {
            self::VEHICLE_NOT_FOUND => 'Zu dieser Kombination haben wir kein Fahrzeug gefunden.',
            self::VEHICLE_INCOMPLETE => 'Für dieses Fahrzeug können wir die Freigabe nicht bestätigen.',
            self::NO_DOCUMENT => 'Für diese Kombination liegt uns kein Gutachten vor.',
            self::NOT_COVERED => 'Das Gutachten führt dieses Fahrzeug nicht auf.',
            self::OUTSIDE_BUILD_WINDOW => 'Das Gutachten gilt nicht für den Bauzeitraum dieses Fahrzeugs.',
            self::WIDTH_OR_ET_OUTSIDE_RANGE => 'Breite oder Einpresstiefe liegen außerhalb der Freigabe.',
            self::NO_TYRE_SIZE => 'Für diese Kombination ist keine Reifengröße freigegeben.',
            self::REFERENCE_DATA_MISSING => 'Für dieses Fahrzeug können wir die Freigabe nicht bestätigen.',
            default => 'Für diese Kombination liegt uns kein Gutachten vor.',
        };
    }
}
