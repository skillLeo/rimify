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
    /** The product page's line, from the cheapest active method of Einstellungen › Versand (D-449). */
    shippingLine: string | null
    /** The shop's contact address (`RIMIFY_CONTACT_EMAIL`), which answers where the seller's own is empty. */
    contactEmail: string | null
    /** What the form was opened on (EditStamp): a save against an older state is refused. */
    stamp: string
}
