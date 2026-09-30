/**
 * How every price on the site is qualified, in one place — so the seller's Kleinunternehmer flag (§ 19 UStG, shared
 * as `smallBusiness`) changes them all together, with the invoice and the order summaries (App\Support\Seller).
 *
 * Standard: the prices contain 19 % VAT, and the summaries name the VAT in them. A Kleinunternehmer charges none:
 * the prices are final, no summary has a VAT line, and the notes say why.
 *
 * A component mounted without an Inertia page (a unit test, a story) reads the standard terms.
 */

import { usePage } from '@inertiajs/vue3'
import { computed, type ComputedRef } from 'vue'

export interface PriceTerms {
    smallBusiness: boolean
    /** Beside a price: „inkl. MwSt., zzgl. Versand“. */
    note: string
    /** The footer's one line about every price. */
    footer: string
}

export const STANDARD_TERMS: PriceTerms = {
    smallBusiness: false,
    note: 'inkl. MwSt., zzgl. Versand',
    footer: 'Alle Preise inkl. gesetzl. MwSt., zzgl. Versandkosten.',
}

/* `§ 19`: a no-break space, so the § never ends a line in a narrow tile. */
export const SMALL_BUSINESS_TERMS: PriceTerms = {
    smallBusiness: true,
    note: 'zzgl. Versand, keine MwSt. nach § 19 UStG',
    footer: 'Alle Preise zzgl. Versandkosten. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
}

export function priceTerms(smallBusiness: boolean): PriceTerms {
    return smallBusiness ? SMALL_BUSINESS_TERMS : STANDARD_TERMS
}

/**
 * The line under a total: the VAT it contains and the shipping — or, for a Kleinunternehmer, no VAT at all.
 * `shippingOpen` while the client has not named the shipping price.
 */
export function totalNote(smallBusiness: boolean, tax: string, shippingOpen: boolean): string {
    if (smallBusiness) {
        return shippingOpen ? 'Versandkosten werden noch festgelegt · keine MwSt. nach § 19 UStG' : 'inkl. Versand, keine MwSt. nach § 19 UStG'
    }

    return shippingOpen ? `inkl. ${tax} MwSt. · Versandkosten werden noch festgelegt` : `inkl. ${tax} MwSt. und Versand`
}

export function usePriceTerms(): ComputedRef<PriceTerms> {
    let page: { props?: Record<string, unknown> } | null = null

    try {
        page = usePage()
    } catch {
        page = null
    }

    return computed(() => priceTerms(page?.props?.smallBusiness === true))
}
