import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

/*
 * „Rückmeldung geben“ on the shop's own pages (D-142): one button bottom right for a signed-in admin, never in its own
 * screenshot, opening the admin's form in the shop's design system — the shop's chips and notes, no admin class —
 * with the role the server shipped for this person.
 */

const current: { props: Record<string, unknown> } = { props: {} }
const post = vi.fn()
const listeners: Record<string, (event: { detail: { page: { url: string } } }) => void> = {}

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: {
        post: (...a: unknown[]) => post(...a),
        on: (name: string, callback: (event: { detail: { page: { url: string } } }) => void) => {
            listeners[name] = callback

            return () => undefined
        },
    },
}))

vi.mock('reka-ui', () => ({
    DialogRoot: defineComponent({ props: { open: Boolean }, setup: (props, { slots }) => () => (props.open ? h('div', { class: 'dialog-root' }, slots.default?.()) : null) }),
    DialogPortal: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }),
    DialogOverlay: defineComponent({ setup: () => () => null }),
    DialogContent: defineComponent({ setup: (_, { slots, attrs }) => () => h('div', attrs, slots.default?.()) }),
    DialogTitle: defineComponent({ setup: (_, { slots }) => () => h('h2', slots.default?.()) }),
    DialogDescription: defineComponent({ setup: (_, { slots }) => () => h('p', slots.default?.()) }),
    DialogClose: defineComponent({ setup: (_, { slots }) => () => h('button', { type: 'button' }, slots.default?.()) }),
}))

// The browser's drawing of the page is the library's business; here it fails, and the point goes without one.
vi.mock('html-to-image', () => ({
    getFontEmbedCSS: () => Promise.resolve(''),
    toCanvas: () => Promise.reject(new Error('no canvas in jsdom')),
}))

const { default: ShopFeedback } = await import('./ShopFeedback.vue')
const { feedback } = await import('../../composables/admin/useFeedback')

afterEach(() => {
    feedback.open = false
    feedback.capturing = false
    post.mockReset()
    document.body.innerHTML = ''
})

describe('ShopFeedback', () => {
    it('is one button bottom right, named for assistive technology and left out of its own screenshot', () => {
        current.props = { reviewer: { role: 'Verkauf' } }
        const wrapper = mount(ShopFeedback, { attachTo: document.body })
        const button = wrapper.get('button.shop-fb')

        expect(button.attributes('aria-label')).toBe('Rückmeldung geben')
        expect(button.attributes('aria-keyshortcuts')).toBe('R')
        expect(button.attributes('data-feedback-skip')).toBeDefined()
        expect(button.text()).toContain('Rückmeldung geben')
        expect(button.find('svg').exists()).toBe(true)
        wrapper.unmount()
    })

    it('opens the form in the shop’s own design: its chips and notes, no admin class, and this person’s role', async () => {
        current.props = { reviewer: { role: 'Verkauf' } }
        window.history.replaceState({}, '', '/felgen/borbet-db8gt2?groesse=19')
        const wrapper = mount(ShopFeedback, { attachTo: document.body })

        await wrapper.get('button.shop-fb').trigger('click')
        await flushPromises()
        await nextTick()

        const html = wrapper.html()

        expect(feedback.open).toBe(true)
        expect(feedback.url).toBe('/felgen/borbet-db8gt2?groesse=19')
        expect(html).not.toMatch(/\badm-/)
        expect(wrapper.findAll('label.chip.fb-type')).toHaveLength(4)
        expect(wrapper.text()).toContain('Mitgeschickt werden: diese Seite (/felgen/borbet-db8gt2?groesse=19)')
        expect(wrapper.text()).toContain('deine Rolle „Verkauf“')
        expect(wrapper.text()).toContain('Ein Bildschirmfoto ließ sich hier nicht machen.')
        wrapper.unmount()
    })

    it('sends the point to the admin’s address with the shop page it was made on', async () => {
        current.props = { reviewer: { role: 'Verkauf' } }
        window.history.replaceState({}, '', '/warenkorb')
        const wrapper = mount(ShopFeedback, { attachTo: document.body })

        await wrapper.get('button.shop-fb').trigger('click')
        await flushPromises()
        await wrapper.get('#fb-sentence').setValue('Der Gesamtpreis steht zu klein da.')
        await wrapper.findAll('button').find((b) => b.text() === 'Senden')?.trigger('click')

        expect(post).toHaveBeenCalledTimes(1)
        expect(post).toHaveBeenCalledWith(
            '/admin/review/rueckmeldungen',
            expect.objectContaining({ type: 'fehler', sentence: 'Der Gesamtpreis steht zu klein da.', url: '/warenkorb' }),
            expect.anything()
        )
        wrapper.unmount()
    })

    it('says a send that did not arrive in German, in the dialog, and keeps the sentence (SHOP-FEEDBACK-01)', async () => {
        current.props = { reviewer: { role: 'Verkauf' } }
        window.history.replaceState({}, '', '/kontakt')
        const wrapper = mount(ShopFeedback, { attachTo: document.body })

        await wrapper.get('button.shop-fb').trigger('click')
        await flushPromises()
        await wrapper.get('#fb-sentence').setValue('Das Formular ist zu lang.')
        await wrapper.findAll('button').find((b) => b.text() === 'Senden')?.trigger('click')

        const options = post.mock.calls[0]?.[2] as { onHttpException: (r: { status: number }) => boolean; onNetworkError: () => boolean; onFinish: () => void }

        expect(options.onHttpException({ status: 419 })).toBe(false)
        options.onFinish()
        await nextTick()
        expect(wrapper.get('#fb-sentence-err').text()).toBe('Deine Anmeldung ist abgelaufen. Melde dich im Admin neu an und schick die Rückmeldung dann noch einmal.')
        expect(wrapper.get('#fb-sentence-err').attributes('aria-live')).toBe('polite')
        expect((wrapper.get('#fb-sentence').element as HTMLTextAreaElement).value).toBe('Das Formular ist zu lang.')

        expect(options.onNetworkError()).toBe(false)
        await nextTick()
        expect(wrapper.get('#fb-sentence-err').text()).toContain('Keine Verbindung zum Server.')
        wrapper.unmount()
    })

    it('closes when the page behind it changes, so a point is never filed under the wrong page (SHOP-FEEDBACK-04)', async () => {
        current.props = { reviewer: { role: 'Verkauf' } }
        window.history.replaceState({}, '', '/faq')
        const wrapper = mount(ShopFeedback, { attachTo: document.body })

        await wrapper.get('button.shop-fb').trigger('click')
        await flushPromises()
        expect(feedback.open).toBe(true)

        // The same page answering again (the send's own redirect) keeps it; another page closes it.
        listeners.navigate?.({ detail: { page: { url: '/faq' } } })
        expect(feedback.open).toBe(true)
        listeners.navigate?.({ detail: { page: { url: '/kontakt' } } })
        expect(feedback.open).toBe(false)
        wrapper.unmount()
    })
})
