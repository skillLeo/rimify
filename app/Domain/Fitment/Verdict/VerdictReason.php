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

    /**
     * The rows do not name the car, and nobody has asserted that every Anlage and every vehicle of the document is entered
     * (EIGENE-FUNDE 119, D-227): a document is incomplete until someone says it is complete. Not a refusal.
     */
    public const COVERAGE_UNCONFIRMED = 'COVERAGE_UNCONFIRMED';

    public const OUTSIDE_BUILD_WINDOW = 'OUTSIDE_BUILD_WINDOW';

    public const WIDTH_OR_ET_OUTSIDE_RANGE = 'WIDTH_OR_ET_OUTSIDE_RANGE';

    public const NO_TYRE_SIZE = 'NO_TYRE_SIZE';

    /**
     * A row names the car and holds no tyre size at all: our record of the document is short, the document has not
     * ruled the car out — the release door refuses such a row, only data written past it holds one. Not a refusal
     * (M-6, the operator's answer of 31.10.2026).
     */
    public const TYRE_SIZES_NOT_RECORDED = 'TYRE_SIZES_NOT_RECORDED';

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
     * BODY_OR_DRIVE_EXCLUDED with the Auflagen that keep the car out, in their own words: a total refusal names its
     * condition in the verdict's reason (the operator's brief of 17.10.2026 §1, 512a) — the cause, never a decoration.
     * Without a recorded sentence, the plain one.
     *
     * @param  list<string|null>  $sentences
     */
    public static function excludedBy(array $sentences): self
    {
        $plain = self::sentenceFor(self::BODY_OR_DRIVE_EXCLUDED);
        $named = array_values(array_unique(array_filter(array_map(static fn (?string $s): string => trim((string) $s), $sentences), static fn (string $s): bool => $s !== '')));

        if ($named === []) {
            return new self(self::BODY_OR_DRIVE_EXCLUDED, $plain);
        }

        $quoted = array_map(static fn (string $s): string => '„'.$s.'“', $named);
        $last = array_pop($quoted);
        $list = $quoted === [] ? $last : implode(', ', $quoted).' und '.$last;
        // A sentence quoted as printed keeps its own stop; one recorded without it gets the reason's own, after the quote.
        $stop = preg_match('/[.!?]$/u', (string) end($named)) === 1 ? '' : '.';

        return new self(self::BODY_OR_DRIVE_EXCLUDED, $plain.' '.(count($named) === 1 ? 'Das liegt an der Auflage: ' : 'Das liegt an den Auflagen: ').$list.$stop);
    }

    /**
     * Deliberately plain, and deliberately never apologetic. "We do not know" is a legitimate
     * answer here and is stated as one — it is not framed as a refusal or as a fault.
     */
    public static function sentenceFor(string $code): string
    {
        return match ($code) {
            self::VEHICLE_NOT_FOUND => 'Zu dieser Kombination haben wir die Daten für dieses Fahrzeug noch nicht hinterlegt.',
            self::VEHICLE_INCOMPLETE => 'Dieses Fahrzeug führen wir nicht mehr in unseren Daten. Wähle dein Fahrzeug bitte neu aus – dann prüfen wir die Felge dafür.',
            self::NO_DOCUMENT => 'Für diese Kombination liegt uns kein Gutachten vor.',
            self::NOT_COVERED => 'Für dieses Fahrzeug ist zu diesem Gutachten bei uns keine Freigabe hinterlegt.',
            // The operator's words (brief of 14.10.2026, §2): keeps the customer, and gives us a reason to chase the document.
            self::ANNEX_MISSING => 'Für dieses Fahrzeug liegt uns die passende Anlage des Gutachtens noch nicht vor – sag uns dein Auto, und wir holen sie.',
            self::COVERAGE_UNCONFIRMED => 'Dein Fahrzeug ist zu diesem Gutachten bei uns noch nicht erfasst. Sag uns dein Auto, und wir prüfen, ob das Gutachten es nennt.',
            self::OUTSIDE_BUILD_WINDOW => 'Das Gutachten gilt nicht für den Bauzeitraum dieses Fahrzeugs.',
            self::WIDTH_OR_ET_OUTSIDE_RANGE => 'Breite oder Einpresstiefe liegen außerhalb der Freigabe.',
            self::NO_TYRE_SIZE => 'Für diese Kombination ist keine Reifengröße freigegeben.',
            self::TYRE_SIZES_NOT_RECORDED => 'Zu diesem Gutachten haben wir die Reifengrößen für dein Fahrzeug noch nicht erfasst. Bis dahin können wir die Freigabe nicht bestätigen.',
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
