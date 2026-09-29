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
 */
export function root(App: Component, props: object): VNode {
    return h(ConfigProvider, { scrollBody: { padding: 0, margin: 0 } }, { default: () => h(App, { ...props }) })
}
