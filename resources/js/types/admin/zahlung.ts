/** Einstellungen › Zahlung (ZahlungController::edit). Never a key: only the last four characters, masked. */
export interface AdminZahlungProps {
    form: { mode: 'test' | 'live' }
    publishableMasked: string | null
    secretMasked: string | null
    webhookMasked: string | null
    /** The keys in force and where they come from: this page, `.env`, or nowhere. */
    inForce: {
        source: 'Einstellungen' | '.env' | 'keine'
        mode: 'test' | 'live'
        publishable: string | null
        secret: string | null
        webhook: string | null
        complete: boolean
    }
    /** `rimify.payments.driver`: `stripe` takes payments with these keys; `sandbox` and `none` do not. */
    driver: string
    production: boolean
    /** The last „Verbindung testen“: the account, or Stripe's own error. */
    test: {
        ok: boolean
        name: string | null
        country: string | null
        currency: string | null
        methods: string[]
        live: boolean | null
        error: string | null
        at?: string
    } | null
    testedAt: string | null
    /** Where Stripe's webhook must point (Stripe-Dashboard › Webhooks, or `stripe listen --forward-to`). */
    webhookUrl: string
}
