/**
 * The vehicle selector's zero (F2; the operator's brief of 05.10.2026, §2): a car with no wheel to show is a deliberate
 * state, said the same on the desktop and the phone — the count reads 0 rather than vanishing, and one sentence says
 * why: the shop is still empty, or no document names this car yet.
 */

import { felgen } from '../format'

/** `0 Felgen für dieses Fahrzeug` — the count where it would stand, never left out. */
export const ZERO_LABEL = `${felgen(0)} für dieses Fahrzeug`

export function zeroSentence(shopEmpty: boolean): string {
    return shopEmpty
        ? 'Noch ist keine Felge im Sortiment. Sobald die ersten mit Gutachten freigegeben sind, siehst du hier, welche an dein Auto dürfen.'
        : 'Für dieses Fahrzeug haben wir noch keine Felge mit Gutachten.'
}
