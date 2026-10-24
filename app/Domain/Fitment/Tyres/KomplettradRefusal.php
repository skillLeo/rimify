<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

/**
 * Why a tyre may not be sold as a Komplettrad on a verdict — one case per reason, each a full
 * German sentence (R-15) and none of them naming a contact detail, which is rendered from
 * `config('rimify.contact')` at the edge.
 *
 * `VerdictUnknown` and `VerdictNotPermitted` are two cases on purpose (R-07): neither sells, but
 * only one of them means "we checked and your car may not have this", and any sentence that is
 * true of one is a false statement about a legal fact when shown for the other.
 */
enum KomplettradRefusal: string
{
    case NoVehicle = 'NO_VEHICLE';
    case VerdictNotPermitted = 'VERDICT_NOT_PERMITTED';
    case VerdictUnknown = 'VERDICT_UNKNOWN';
    /** The wheel is approved, the tyres are not settled (R-03 split): never „kein Gutachten“ about a car the document names. */
    case TyresUnknown = 'TYRES_UNKNOWN';
    /** The wheel is approved, the tyres wait for fields of the car's papers (D-286): the way on is the customer's own. */
    case TyresAwaitPapers = 'TYRES_AWAIT_PAPERS';
    /** The wheel is approved, no tyre the document names may go on the car. */
    case TyresNotPermitted = 'TYRES_NOT_PERMITTED';
    case VerdictRestored = 'VERDICT_RESTORED';
    case NoPermittedSizes = 'NO_PERMITTED_SIZES';
    case NoUsableMinimum = 'NO_USABLE_MINIMUM';
    case StaggeredLayout = 'STAGGERED_LAYOUT';
    case TyreChoiceRestricted = 'TYRE_CHOICE_RESTRICTED';
    case DiameterMismatch = 'DIAMETER_MISMATCH';
    case SizeNotPermitted = 'SIZE_NOT_PERMITTED';
    case BelowMinimum = 'BELOW_MINIMUM';
    case OutOfStock = 'OUT_OF_STOCK';
    case NoTyreAvailable = 'NO_TYRE_AVAILABLE';
    /** A load-index limit of the size's own (T95 …) stops below the car's axle load (D-105). */
    case AxleLoadAboveLimit = 'AXLE_LOAD_ABOVE_LIMIT';
    /** Mischbereifung (#20): the document prints no pairing table for this car on this wheel, or none of its pairs fits. */
    case NoMixedPairing = 'NO_MIXED_PAIRING';
    /** Mischbereifung: this front size with this rear size is not in the document's table for this car. */
    case MixedPairNotListed = 'MIXED_PAIR_NOT_LISTED';
    /** Mischbereifung: front and rear are not one maker's one tyre line, as the table's own sentence asks. */
    case MixedNotOneMaker = 'MIXED_NOT_ONE_MAKER';
    /**
     * Four of a kind where the documents list their combinations (D-256): the Komplettrad is the combination, two wheels on
     * each axle, never four of one size (the operator's decision of 24.10.2026 on the client's item 8, D-335).
     */
    case AsCombination = 'AS_COMBINATION';
    /** A listed combination: none of them is carried by the car's row, each size on its own axle. */
    case NoCombination = 'NO_COMBINATION';
    /** A listed combination with no rules printed beside it: front and rear one maker's one line is our own rule, not the document's. */
    case CombinationNotOneMaker = 'COMBINATION_NOT_ONE_MAKER';

    public function sentenceDe(): string
    {
        return match ($this) {
            self::NoVehicle => 'Für ein Komplettrad brauchen wir zuerst dein Fahrzeug – erst dann wissen wir, welche Reifengrößen für dich freigegeben sind.',
            self::VerdictNotPermitted => 'Diese Felge ist für dein Fahrzeug nicht freigegeben. Ein Komplettrad können wir dir dazu deshalb nicht anbieten.',
            self::VerdictUnknown => 'Zu dieser Felge liegt uns für dein Fahrzeug kein Gutachten vor. Ein Komplettrad können wir dir deshalb nicht anbieten – schreib uns, dann prüfen wir das für dich.',
            self::TyresUnknown => 'Die Felge ist für dein Fahrzeug freigegeben, die Reifen dazu können wir aber nicht bestätigen. Ein Komplettrad können wir dir deshalb nicht anbieten – schreib uns, dann prüfen wir das für dich.',
            self::TyresAwaitPapers => 'Die Felge ist für dein Fahrzeug freigegeben. Für die Reifen fehlen uns noch Werte aus deiner Zulassungsbescheinigung Teil I – sobald du sie eingetragen hast, zeigen wir dir die Reifen, die du fahren darfst.',
            self::TyresNotPermitted => 'Die Felge ist für dein Fahrzeug freigegeben, die Reifen, die das Gutachten dazu nennt, aber nicht. Ein Komplettrad können wir dir deshalb nicht anbieten.',
            self::VerdictRestored => 'Diese Zusammenstellung können wir dir gerade nicht neu prüfen. Bitte wähle dein Fahrzeug noch einmal aus.',
            self::NoPermittedSizes => 'Für diese Kombination ist bei uns keine Reifengröße hinterlegt. Ein Komplettrad können wir dir deshalb nicht anbieten – die Felge allein kannst du bestellen.',
            self::NoUsableMinimum => 'Für dein Fahrzeug fehlen uns Achslast oder Höchstgeschwindigkeit. Trag die zulässigen Achslasten und die Höchstgeschwindigkeit aus deiner Zulassungsbescheinigung Teil I ein, dann zeigen wir dir die zulässigen Reifen. Die Felge allein kannst du sofort bestellen.',
            // Never „stellen wir persönlich zusammen“ beside a Mischbereifung the page offers itself (D-105).
            self::StaggeredLayout => 'Vorne und hinten sind für dein Fahrzeug unterschiedliche Reifengrößen freigegeben – vier gleiche Reifen gibt es dafür nicht. Die Felge allein kannst du sofort bestellen.',
            self::TyreChoiceRestricted => 'Das Gutachten schreibt für diese Kombination bestimmte Reifen vor. Welche das sind, klären wir persönlich mit dir – die Felge allein kannst du sofort bestellen.',
            self::DiameterMismatch => 'Dieser Reifen hat nicht den Durchmesser dieser Felge.',
            self::SizeNotPermitted => 'Diese Reifengröße ist für dein Fahrzeug mit dieser Felge nicht freigegeben.',
            self::BelowMinimum => 'Dieser Reifen erfüllt die Mindestwerte für dein Fahrzeug nicht.',
            // Available or not, never a count (D-301) — and a tyre without its EU label is not offered (D-303).
            self::OutOfStock => 'Dieser Reifen ist zurzeit nicht verfügbar.',
            self::NoTyreAvailable => 'Passende Reifen für diese Größe können wir dir gerade nicht anbieten. Die Felge allein kannst du bestellen.',
            self::AxleLoadAboveLimit => 'Für die zulässige Achslast deines Fahrzeugs ist in dieser Reifengröße kein Tragfähigkeitsindex hinterlegt.',
            self::NoMixedPairing => 'Unterschiedliche Reifengrößen vorne und hinten sind für dein Fahrzeug mit dieser Felge nicht hinterlegt.',
            self::MixedPairNotListed => 'Diese Reifengrößen für vorne und hinten sind für dein Fahrzeug nicht als Kombination hinterlegt.',
            self::MixedNotOneMaker => 'Vorne und hinten müssen Reifen desselben Herstellers und derselben Profilreihe sein – so verlangt es das Gutachten.',
            self::AsCombination => 'Als Komplettrad gibt es diese Felge für dein Fahrzeug nur in den Reifenkombinationen, die das Gutachten nennt – je zwei Räder für die Vorder- und die Hinterachse. Wähl auf der Seite der Felge eine dieser Kombinationen.',
            self::NoCombination => 'Für dein Fahrzeug ist bei uns keine der Reifenkombinationen aus dem Gutachten dieser Felge hinterlegt. Ein Komplettrad können wir dir deshalb nicht anbieten – die Felge allein kannst du bestellen.',
            self::CombinationNotOneMaker => 'Vorne und hinten bieten wir dir in einer Kombination nur Reifen desselben Herstellers und derselben Profilreihe an.',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
