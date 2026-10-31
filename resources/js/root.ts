import { h, type Component, type VNode } from 'vue'
import { ConfigProvider } from 'reka-ui'

/*
 * The app's root, the same on the server and in the browser (app.ts, ssr.ts): Inertia's page inside
 * reka's ConfigProvider.
 *
 * `scrollBody`: a menu or dialog still locks the page's scroll, but adds no `padding-right` for the
 * scrollbar it expects to vanish. `base.css` keeps that gutter (`scrollbar-gutter: stable`), so the
 * padding came on top of it and the whole admin narrowed by 15 px while an overlay was open — cards
 * reflowed and charts redrew behind it (M1-05). ConfigProvider renders no element of its own, so
 * hydration sees the same tree.
 *
 * `nonce`: a reka list (Combobox, Select) brings a <style> element of its own and takes its CSP nonce
 * from here — without it the CSP refused the style and the console said so each time a list opened
 * (HQ-25).
 */
export function root(App: Component, props: object): VNode {
    return h(ConfigProvider, { scrollBody: { padding: 0, margin: 0 }, nonce: pageNonce() }, { default: () => h(App, { ...props }) })
}

/**
 * The request's CSP nonce, from the page's own scripts (app.blade.php): the browser hides the
 * attribute but keeps the property. The server renders no list open, so it needs none.
 */
export function pageNonce(): string | undefined {
    if (typeof document === 'undefined') {
        return undefined
    }

    return document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce || undefined
}
