import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import type { AddedToBasket } from '../../types/rimify'

/*
 * The panel after an add (#16): the line just added, the basket's count and subtotal, „Weiter einkaufen“ and „Zum
 * Warenkorb“ — and never a modal: no overlay, no focus taken, gone on ×, Escape, the first button, another page, or by
 * itself while nobody uses it.
 */

type Listener = (event: { detail: { page: { url: string; props: Record<string, unknown> } } }) => void

const listeners: Record<string, Listener[]> = {}
const current: { url: string; props: Record<string, unknown> } = { url: '/felgen/borbet-db8gt2', props: { flash: { toast: null } } }

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
const { resetFirstLoad } = await import('./toast')

const ADDED: AddedToBasket = {
    heading: 'Komplettrad zum Warenkorb hinzugefügt.',
    lines: [{ title: 'BORBET DB8GT2', detail: 'Komplettrad · 8,5J × 19 · ET 35 · Schwarz matt · Laufwerk Allwetter A1 255/40 R19 100Y', quantity: 4, price: '2.132,00 €' }],
    count: 8,
    subtotal: '3.048,00 €',
}

/** A server response arriving, as Inertia announces it. */
function emit(name: string, url: string, added: AddedToBasket | null): void {
    for (const listener of listeners[name] ?? []) {
        listener({ detail: { page: { url, props: { flash: { toast: added?.heading ?? null, added } } } } })
    }
}

let wrapper: VueWrapper | null = null

function mountPanel(): VueWrapper {
    wrapper = mount(AddedPanel, { attachTo: document.body })

    return wrapper
}

describe('AddedPanel', () => {
    beforeEach(() => {
        current.props = { flash: { toast: null } }
        vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: 'navigate' } as unknown as PerformanceEntry])
        resetFirstLoad()
    })

    afterEach(() => {
        wrapper?.unmount()
        wrapper = null
        vi.restoreAllMocks()
        vi.useRealTimers()
        for (const key of Object.keys(listeners)) delete listeners[key]
    })

    it('shows the line added at its amount and price, the basket\'s count and subtotal, and the two ways on', async () => {
        const panel = mountPanel()
        emit('success', '/felgen/borbet-db8gt2', ADDED)
        await nextTick()

        expect(panel.find('.addp__title').text()).toBe('Komplettrad zum Warenkorb hinzugefügt.')
        expect(panel.find('.addp__name').text()).toBe('4 × BORBET DB8GT2')
        expect(panel.find('.addp__price').text()).toBe('2.132,00 €')
        expect(panel.find('.addp__detail').text()).toContain('Laufwerk Allwetter A1')
        expect(panel.find('.addp__sum').text()).toBe('Zwischensumme im Warenkorb (8 Stück)3.048,00 €')
        expect(panel.findAll('.addp__go > *').map((b) => b.text())).toEqual(['Weiter einkaufen', 'Zum Warenkorb'])
        expect(panel.find('a[href="/warenkorb"]').exists()).toBe(true)
    })

    it('is no modal: no dialog role, no overlay, and the focus stays where it was', async () => {
        const button = document.createElement('button')
        document.body.appendChild(button)
        button.focus()

        const panel = mountPanel()
        emit('success', '/felgen/borbet-db8gt2', ADDED)
        await nextTick()

        expect(panel.find('[role="dialog"]').exists()).toBe(false)
        expect(panel.find('[aria-modal]').exists()).toBe(false)
        expect(document.querySelector('.overlay')).toBeNull()
        expect(document.activeElement).toBe(button)

        button.remove()
    })

    it('announces its heading and the subtotal, and keeps its buttons out of the live region (PDP-13)', async () => {
        const panel = mountPanel()
        emit('success', '/felgen/borbet-db8gt2', ADDED)
        await nextTick()
        await nextTick()

        const status = panel.find('[role="status"]')
        expect(status.text()).toBe('Komplettrad zum Warenkorb hinzugefügt. Zwischensumme im Warenkorb: 3.048,00 €.')
        expect(status.find('button').exists()).toBe(false)
        expect(status.find('a').exists()).toBe(false)

        await panel.find('.addp__close').trigger('click')
        expect(panel.find('[role="status"]').text()).toBe('')
    })

    it('goes on „Weiter einkaufen“, on ×, and on Escape', async () => {
        const panel = mountPanel()

        for (const close of [
            () => panel.find('.addp__go button').trigger('click'),
            () => panel.find('.addp__close').trigger('click'),
            () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })),
        ]) {
            emit('success', '/felgen/borbet-db8gt2', ADDED)
            await nextTick()
            expect(panel.find('.addp').exists()).toBe(true)

            await close()
            await nextTick()
            expect(panel.find('.addp').exists()).toBe(false)
        }
    })

    it('goes when the visitor moves to another page, and stays for the same page coming back from the add', async () => {
        const panel = mountPanel()
        emit('success', '/felgen/borbet-db8gt2', ADDED)
        emit('navigate', '/felgen/borbet-db8gt2?ausfuehrung=44', null)
        await nextTick()
        expect(panel.find('.addp').exists()).toBe(true)

        emit('navigate', '/warenkorb', null)
        await nextTick()
        expect(panel.find('.addp').exists()).toBe(false)
    })

    it('goes by itself after ten seconds, but not while the pointer rests on it', async () => {
        vi.useFakeTimers()
        const panel = mountPanel()
        emit('success', '/felgen/borbet-db8gt2', ADDED)
        await nextTick()

        await panel.find('.addp').trigger('mouseenter')
        vi.advanceTimersByTime(30_000)
        await nextTick()
        expect(panel.find('.addp').exists()).toBe(true)

        await panel.find('.addp').trigger('mouseleave')
        vi.advanceTimersByTime(10_000)
        await nextTick()
        expect(panel.find('.addp').exists()).toBe(false)
    })

    it('shows nothing for a response that added nothing, and does not replay an add on back/forward', async () => {
        const panel = mountPanel()
        emit('success', '/felgen', null)
        await nextTick()
        expect(panel.find('.addp').exists()).toBe(false)

        panel.unmount()
        vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: 'back_forward' } as unknown as PerformanceEntry])
        current.props = { flash: { toast: ADDED.heading, added: ADDED } }
        const restored = mountPanel()
        await nextTick()
        expect(restored.find('.addp').exists()).toBe(false)
    })
})
