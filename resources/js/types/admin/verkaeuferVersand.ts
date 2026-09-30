/** Einstellungen › Verkäufer & Versand (VerkaeuferVersandController::edit). */
export interface SellerForm {
    name: string
    street: string
    zip: string
    city: string
    managing_director: string
    register_court: string
    register_number: string
    vat_id: string
    tax_number: string
    email: string
    phone: string
    placeholder: boolean
}

export interface ShippingForm {
    /** Typed the German way: `4,90 €`. */
    cost: string
    free_from: string
    min_days: string
    max_days: string
    placeholder: boolean
}

export interface AdminVerkaeuferVersandProps {
    seller: SellerForm
    /** Where the values in force come from: this page, or `.env` while it was never saved. */
    sellerSource: 'Einstellungen' | '.env'
    /** The `.env` register line, written as one, while this page was never saved. */
    legacyRegister: string | null
    /** What a real invoice still needs, in the preflight's words. */
    sellerMissing: string[]
    shipping: ShippingForm
    shippingSource: 'Einstellungen' | '.env'
    /** The `.env` delivery time, as a sentence, while no range is saved. */
    legacyTime: string | null
    /** What a real order still needs. */
    shippingMissing: string[]
    /** The product page's line with these values: `Lieferzeit 3–5 Werktage · Versand 4,90 €`. */
    shippingPreview: string | null
    countries: Record<string, string>
    /** The shop's contact address (`RIMIFY_CONTACT_EMAIL`), which answers where the seller's own is empty. */
    contactEmail: string | null
}
