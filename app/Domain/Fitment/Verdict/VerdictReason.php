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

    /**
     * The pages we hold do not name the car, and the document's Verwendungsbereich has Anlagen we do not hold: the one
     * that names it may be among them. Not a refusal — we have not read that page yet.
     */
    public const ANNEX_MISSING = 'ANNEX_MISSING';

    public const OUTSIDE_BUILD_WINDOW = 'OUTSIDE_BUILD_WINDOW';

    public const WIDTH_OR_ET_OUTSIDE_RANGE = 'WIDTH_OR_ET_OUTSIDE_RANGE';

    public const NO_TYRE_SIZE = 'NO_TYRE_SIZE';

    public const REFERENCE_DATA_MISSING = 'REFERENCE_DATA_MISSING';

    /** A code on a covering row that its own document does not define (the corrections memo §1). */
    public const CONDITION_UNRESOLVED = 'CONDITION_UNRESOLVED';

    /** The document limits the row to body styles or drives, and this vehicle's is not among them. */
    public const BODY_OR_DRIVE_EXCLUDED = 'BODY_OR_DRIVE_EXCLUDED';

    /** The document limits the row by body style or drive, and we do not know this vehicle's. */
    public const BODY_OR_DRIVE_UNKNOWN = 'BODY_OR_DRIVE_UNKNOWN';

    /** Two documents cover the combination and say different things; a person has not decided yet. */
    public const DOCUMENTS_DISAGREE = 'DOCUMENTS_DISAGREE';

    /** Half an axle's load is more than the wheel's tested load (Radlast) on an axle the wheel may go on. */
    public const WHEEL_LOAD_EXCEEDED = 'WHEEL_LOAD_EXCEEDED';

    /** The document's own table rules out every tyre the car's speed needs (a „–“ with nothing after it). */
    public const TYRE_NOT_PERMITTED = 'TYRE_NOT_PERMITTED';

    /** The document does not say what the tyres need at the car's figures: no table, no row, no index. */
    public const TYRE_UNKNOWN = 'TYRE_UNKNOWN';

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
            self::VEHICLE_NOT_FOUND => 'Zu dieser Kombination haben wir die Daten für dieses Fahrzeug noch nicht hinterlegt.',
            self::VEHICLE_INCOMPLETE => 'Dieses Fahrzeug führen wir nicht mehr in unseren Daten. Wähl dein Fahrzeug bitte neu aus – dann prüfen wir die Felge dafür.',
            self::NO_DOCUMENT => 'Für diese Kombination liegt uns kein Gutachten vor.',
            self::NOT_COVERED => 'Für dieses Fahrzeug ist zu diesem Gutachten bei uns keine Freigabe hinterlegt.',
            self::ANNEX_MISSING => 'Für dieses Fahrzeug liegt uns die entsprechende Anlage des Gutachtens noch nicht vor. Bis dahin können wir die Freigabe nicht bestätigen.',
            self::OUTSIDE_BUILD_WINDOW => 'Das Gutachten gilt nicht für den Bauzeitraum dieses Fahrzeugs.',
            self::WIDTH_OR_ET_OUTSIDE_RANGE => 'Breite oder Einpresstiefe liegen außerhalb der Freigabe.',
            self::NO_TYRE_SIZE => 'Für diese Kombination ist keine Reifengröße freigegeben.',
            self::REFERENCE_DATA_MISSING => 'Für die Prüfung der Reifen fehlen uns gerade die Tabellen der Tragfähigkeits- und Geschwindigkeitsindizes. Das liegt an uns, nicht an deinem Fahrzeug – bis sie hinterlegt sind, können wir die Freigabe nicht bestätigen.',
            self::CONDITION_UNRESOLVED => 'Eine Auflage des Gutachtens ist bei uns noch nicht vollständig erfasst. Bis dahin können wir die Freigabe nicht bestätigen.',
            self::BODY_OR_DRIVE_EXCLUDED => 'Das Gutachten gilt nicht für die Karosserieform oder den Antrieb dieses Fahrzeugs.',
            self::BODY_OR_DRIVE_UNKNOWN => 'Das Gutachten gilt nur für bestimmte Karosserieformen oder Antriebe. Welche dein Fahrzeug hat, wissen wir nicht sicher – deshalb können wir die Freigabe nicht bestätigen.',
            self::DOCUMENTS_DISAGREE => 'Zwei Gutachten sagen zu dieser Kombination Verschiedenes. Wir prüfen das und können die Freigabe bis dahin nicht bestätigen.',
            self::WHEEL_LOAD_EXCEEDED => 'Die zulässige Achslast deines Fahrzeugs ist für die geprüfte Radlast dieser Felge zu hoch.',
            self::TYRE_NOT_PERMITTED => 'Für die Höchstgeschwindigkeit deines Fahrzeugs lässt das Gutachten keinen passenden Reifen zu.',
            self::TYRE_UNKNOWN => 'Welche Reifen dein Fahrzeug mit dieser Felge braucht, ist bei uns zu diesem Gutachten nicht hinterlegt. Die Reifen können wir deshalb nicht bestätigen.',
            default => 'Für diese Kombination liegt uns kein Gutachten vor.',
        };
    }
}
