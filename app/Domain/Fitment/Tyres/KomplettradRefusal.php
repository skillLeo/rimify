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

    public function sentenceDe(): string
    {
        return match ($this) {
            self::NoVehicle => 'Für ein Komplettrad brauchen wir zuerst dein Fahrzeug – erst dann wissen wir, welche Reifengrößen für dich freigegeben sind.',
            self::VerdictNotPermitted => 'Diese Felge ist für dein Fahrzeug nicht freigegeben. Ein Komplettrad können wir dir dazu deshalb nicht anbieten.',
            self::VerdictUnknown => 'Zu dieser Felge liegt uns für dein Fahrzeug kein Gutachten vor. Ein Komplettrad können wir dir deshalb nicht anbieten – schreib uns, dann prüfen wir das für dich.',
            self::VerdictRestored => 'Diese Zusammenstellung können wir dir gerade nicht neu prüfen. Bitte wähl dein Fahrzeug noch einmal aus.',
            self::NoPermittedSizes => 'Für diese Kombination nennt das Gutachten keine Reifengröße. Ein Komplettrad können wir dir deshalb nicht anbieten – die Felge allein kannst du bestellen.',
            self::NoUsableMinimum => 'Für dein Fahrzeug fehlen uns Achslast oder Höchstgeschwindigkeit. Ohne diese Werte sagen wir dir nicht, welcher Reifen passt – die Felge allein kannst du bestellen.',
            self::StaggeredLayout => 'Vorne und hinten sind für dein Fahrzeug unterschiedliche Reifengrößen freigegeben. Solche Kombinationen stellen wir dir persönlich zusammen.',
            self::TyreChoiceRestricted => 'Das Gutachten schreibt für diese Kombination bestimmte Reifen vor. Welche das sind, klären wir persönlich mit dir – die Felge allein kannst du sofort bestellen.',
            self::DiameterMismatch => 'Dieser Reifen hat nicht den Durchmesser dieser Felge.',
            self::SizeNotPermitted => 'Diese Reifengröße ist für dein Fahrzeug mit dieser Felge nicht freigegeben.',
            self::BelowMinimum => 'Dieser Reifen erfüllt die Mindestwerte für dein Fahrzeug nicht.',
            self::OutOfStock => 'Diesen Reifen haben wir gerade nicht in der benötigten Menge auf Lager.',
            self::NoTyreAvailable => 'Passende Reifen für diese Größe haben wir gerade nicht vorrätig. Die Felge allein kannst du bestellen.',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
