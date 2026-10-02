import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import type { AddedToBasket } from '../../types/rimify'

/*
 * PDP-04 (S2) — docs/qa/BUGS.md, review docs/qa/reviews/PDP-2026-10-02.md.
 *
 * The panel after an add (#16) comes back with the browser's Back button.
 *
 * Each layout renders its own AddedPanel (AppLayout and MobileLayout). On a phone the product page is under AppLayout
 * and the homepage under MobileLayout (DevicePage::resolve('Startseite')). So: product page → add → the panel → the
 * header's „RIMIFY“ → Back. Inertia restores the product page from history (eventHandler.handlePopstateEvent →
 * page.setQuietly), and its props still carry `flash.added`, because the page object was stored from the response to
 * the redirect after the add. AppLayout, and with it the panel, mounts again. The panel's onMounted reads the flash from
 * the page props unless the *document* was loaded by back/forward. This document was loaded by an ordinary navigation,
 * so the old add is shown again, with the basket count and subtotal of that moment.
 *
 * Expected: an add is shown once, from the response that made it. A page restored from history shows no panel.
 */

type Listener = (event: { detail: { page: { url: string; props: Record<string, unknown> } } }) => void

const listeners: Record<string, Listener[]> = {}
const current: { url: string; props: Record<string, unknown> } = { url: '/felgen', props: { flash: { toast: null, added: null } } }

vi.mock('@inertiajs/vue3', () => ({
    router: {
        on(name: string, listener: Listener) {
            ;(listeners[name] ??= []).push(listener)

            return () => {
                listeners[name] = (listeners[name] ?? []).filter((l) => l !== listener)
            }
        },
    },
    usePage: () => current,
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

const { default: AddedPanel } = await import('./AddedPanel.vue')

const PDP = '/felgen/borbet-db8gt2?ausfuehrung=44&fahrzeug=127'

const ADDED: AddedToBasket = {
    heading: 'Komplettrad zum Warenkorb hinzugefügt.',
    lines: [{ title: 'BORBET DB8GT2', detail: 'Komplettrad · 8,5J × 19 · ET 35 · Schwarz matt', quantity: 4, price: '2.132,00 €' }],
    count: 4,
    subtotal: '2.132,00 €',
}

/** A server response or a history restore, as Inertia announces it. */
function emit(name: string, url: string, added: AddedToBasket | null): void {
    for (const listener of listeners[name] ?? []) {
        listener({ detail: { page: { url, props: { flash: { toast: added?.heading ?? null, added } } } } })
    }
}

let wrappers: VueWrapper[] = []

function mountPanel(): VueWrapper {
    const wrapper = mount(AddedPanel, { attachTo: document.body })
    wrappers.push(wrapper)

    return wrapper
}

describe('AddedPanel after Back (PDP-04)', () => {
    beforeEach(() => {
        current.url = PDP
        current.props = { flash: { toast: null, added: null } }
        // The document was opened normally (typed address, link from outside): not a back/forward document load.
        vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: 'navigate' } as unknown as PerformanceEntry])
    })

    afterEach(() => {
        wrappers.forEach((w) => w.unmount())
        wrappers = []
        vi.restoreAllMocks()
        for (const key of Object.keys(listeners)) delete listeners[key]
        document.body.innerHTML = ''
    })

    it('shows no panel when Back restores the product page under a layout that mounts again', async () => {
        // The product page, then the add: the response brings the panel.
        const first = mountPanel()
        emit('success', PDP, ADDED)
        await nextTick()
        expect(first.find('.addp').exists(), 'precondition: the add shows its panel').toBe(true)

        // The header's „RIMIFY“ on a phone: the homepage, under MobileLayout. AppLayout and its panel go.
        emit('navigate', '/', null)
        first.unmount()
        wrappers = wrappers.filter((w) => w !== first)

        // Back: Inertia restores the product page from history, its flash with it, and AppLayout mounts again
        // before Inertia announces the restore.
        current.url = PDP
        current.props = { flash: { toast: ADDED.heading, added: ADDED } }
        const restored = mountPanel()
        emit('navigate', PDP, ADDED)
        await nextTick()

        expect(restored.find('.addp').exists(), 'the old add is shown again after Back').toBe(false)
    })
})
