/** The Impressum's fields that may honestly not apply (Seller::MAY_NOT_APPLY), each declared „entfällt“ or not. */
export type NotApplicableField = 'managing_director' | 'register' | 'vat_id' | 'phone'

/** Einstellungen › Verkäufer & Versand (VerkaeuferVersandController::edit). */
export interface SellerForm {
    name: string
    legal_form: string
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
    not_applicable: Record<NotApplicableField, boolean>
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
    /** Whether the shop issues its own invoices (D-348); absent in older fixtures: on. */
    ownInvoices?: boolean
    /** The Impressum's rows still shown as a marker, by their label — each keeps the shop out of search and live payments. */
    impressumMissing: string[]
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
    /** What the form was opened on (EditStamp): a save against an older state is refused. */
    stamp: string
}
