/**
 * A wheel's name in the shop (his admin items 5, 6 and 13, D-298) — the rule of App\Support\WheelTitle, for the admin's
 * preview while typing: the brand, the model and the Radtypenbezeichnung, the last left out where it is empty or the
 * model's name already holds it. The brand always leads; a typed title is read as what follows it.
 */

function tidy(text: string): string {
    return text.replace(/\s+/gu, ' ').trim()
}

const lower = (text: string): string => text.toLocaleLowerCase('de-DE')

/** `BORBET Havanna HA 8018` */
export function composedTitle(brand: string, model: string, designation: string): string {
    const rtb = tidy(designation)
    const parts = [brand, model]

    if (rtb !== '' && !lower(model).includes(lower(rtb))) {
        parts.push(rtb)
    }

    return tidy(parts.join(' '))
}

/** A title without a leading brand name; a title that does not start with it, whole. */
export function afterBrand(brand: string, full: string): string {
    const b = tidy(brand)
    const f = tidy(full)

    return b !== '' && lower(`${f} `).startsWith(lower(`${b} `)) ? tidy(f.slice(b.length)) : f
}

/** The title the shop shows: the brand, then the typed title's rest or the composition's. */
export function shopTitle(brand: string, model: string, designation: string, typed: string): string {
    const full = tidy(typed) || composedTitle(brand, model, designation)

    return tidy(`${brand} ${afterBrand(brand, full)}`)
}

/** Whether a typed title differs from what the parts make — said, never silently replaced. */
export function titleDiverges(brand: string, model: string, designation: string, typed: string): boolean {
    return tidy(typed) !== '' && shopTitle(brand, model, designation, typed) !== composedTitle(brand, model, designation)
}
