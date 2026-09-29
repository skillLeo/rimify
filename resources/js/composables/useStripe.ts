/**
 * Stripe.js for the checkout (Block G), and nowhere else: it is fetched from js.stripe.com when the payment step
 * mounts — Stripe requires that origin, so it is never bundled — and no other page ever asks for it (TTDSG: no
 * third-party script before it is needed; the CSP admits the origin on the checkout only, SecurityHeaders).
 *
 * Only the few shapes the checkout uses are typed here: the deferred-intent Elements (`mode: 'payment'`), the Payment
 * Element, the Express Checkout Element and `confirmPayment`. The card data never touches this page — it lives in
 * Stripe's frames.
 */

export interface StripeError {
    type?: string
    code?: string
    message?: string
}

export interface StripeElement {
    mount(target: HTMLElement): void
    destroy(): void
    on(event: string, handler: (event: Record<string, unknown>) => void): void
}

export interface StripeElements {
    create(type: 'payment' | 'expressCheckout', options?: Record<string, unknown>): StripeElement
    submit(): Promise<{ error?: StripeError }>
    update(options: Record<string, unknown>): void
}

export interface StripeInstance {
    elements(options: Record<string, unknown>): StripeElements
    confirmPayment(options: Record<string, unknown>): Promise<{ error?: StripeError }>
}

type StripeFactory = (publishableKey: string, options?: Record<string, unknown>) => StripeInstance

declare global {
    interface Window {
        Stripe?: StripeFactory
    }
}

export const STRIPE_JS = 'https://js.stripe.com/v3/'

let loading: Promise<StripeFactory> | null = null

/** Resolves with Stripe's factory once js.stripe.com has answered; rejects when it is blocked or offline. */
export function loadStripe(): Promise<StripeFactory> {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Stripe.js runs in the browser only.'))
    }

    if (window.Stripe) {
        return Promise.resolve(window.Stripe)
    }

    loading ??= new Promise<StripeFactory>((resolve, reject) => {
        const script = document.createElement('script')

        script.src = STRIPE_JS
        script.async = true
        script.onload = () => (window.Stripe ? resolve(window.Stripe) : reject(new Error('Stripe.js did not load.')))
        script.onerror = () => {
            loading = null
            script.remove()
            reject(new Error('Stripe.js could not be reached.'))
        }
        document.head.appendChild(script)
    })

    return loading
}

/** Laravel's XSRF cookie, decoded, as the `X-XSRF-TOKEN` header the payment endpoint checks. */
export function xsrfToken(): string {
    const match = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(typeof document === 'undefined' ? '' : document.cookie)

    return match?.[1] ? decodeURIComponent(match[1]) : ''
}

/** The design tokens, as the concrete values Stripe's Appearance API needs (it cannot read CSS variables). */
export function stripeAppearance(): Record<string, unknown> {
    const css = getComputedStyle(document.documentElement)
    const token = (name: string, fallback: string): string => css.getPropertyValue(name).trim() || fallback

    return {
        theme: 'stripe',
        variables: {
            colorPrimary: token('--blue', '#1f4fd1'),
            colorText: token('--ink', '#14171c'),
            colorTextSecondary: token('--ink2', '#4a525e'),
            colorDanger: token('--danger', '#b3261e'),
            colorBackground: token('--surface', '#ffffff'),
            fontFamily: token('--sans', 'system-ui, sans-serif'),
            borderRadius: token('--radius-sm', '4px'),
            spacingUnit: '4px',
        },
    }
}
