import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import type { AdminWuchtgewichteProps } from '../../../types/pages'

/*
 * Wuchtgewichte-Farben (komplettrad.md §9.3): the table, the inline form, the empty state and the
 * delete confirmation. The page prints the money string the server sent and posts what was typed;
 * it never multiplies cents. What a role may not do is not drawn — the server refuses regardless.
 */

const current = reactive<{ props: Record<string, unknown> }>({ props: {} })

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), on: vi.fn(() => () => undefined) },
}))

const { default: Page } = await import('./Index.vue')
const { router } = await import('@inertiajs/vue3')

/** The modal primitive is tested with its own composable; here it only has to show what it is given. */
const DialogStub = defineComponent({
    props: {
        open: { type: Boolean, default: false },
        title: { type: String, required: true },
        description: { type: String, default: '' },
    },
    emits: ['update:open'],
    setup:
        (props, { slots }) =>
        () =>
            props.open
                ? h('div', { class: 'dialog-stub', role: 'dialog' }, [
                      h('h3', props.title),
                      h('p', props.description),
                      slots.default?.(),
                      slots.actions?.(),
                  ])
                : null,
})

type Colour = AdminWuchtgewichteProps['colours'][number]

const WRITE = { create: true, update: true, delete: true }
const READ = { create: false, update: false, delete: false }

function colour(overrides: Partial<Colour> = {}): Colour {
    return {
        id: 1,
        nameDe: 'Silber',
        slug: 'silber',
        swatchHex: '#C8CCD2',
        surchargeCents: 0,
        surcharge: '0,00 €',
        isDefault: true,
        active: true,
        sortOrder: 10,
        ...overrides,
    }
}

let mounted: VueWrapper[] = []

function mountPage(props: Partial<AdminWuchtgewichteProps> = {}): VueWrapper {
    current.props = {}

    const wrapper = mount(Page, {
        props: { colours: [colour()], mounting: { cents: 1900, typed: '19,00 €' }, can: WRITE, ...props },
        attachTo: document.body,
        global: { stubs: { Dialog: DialogStub } },
    })
    mounted.push(wrapper)

    return wrapper
}

function button(wrapper: VueWrapper, text: string) {
    return wrapper.findAll('button').find((b) => b.text().startsWith(text))
}

/** The colour form, not the Montage fee above it: the page carries two, and they post different things. */
function colourForm(wrapper: VueWrapper) {
    return wrapper.find('form.wg__form:not(.wg__form--fee)')
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    vi.clearAllMocks()
})

describe('Wuchtgewichte-Farben', () => {
    it('prints every colour with the server-formatted surcharge and marks the default', () => {
        const wrapper = mountPage({
            colours: [
                colour(),
                colour({ id: 2, nameDe: 'Schwarz', slug: 'schwarz', surchargeCents: 250, surcharge: '2,50 €', isDefault: false, active: false }),
            ],
        })
        const rows = wrapper.findAll('tbody tr')

        expect(rows).toHaveLength(2)
        expect(rows[0]!.text()).toContain('Silber')
        expect(rows[0]!.text()).toContain('silber')
        expect(rows[0]!.text()).toContain('0,00 €')
        expect(rows[0]!.find('.wg__yes').exists()).toBe(true)
        expect(rows[0]!.find('.tag').text()).toBe('Aktiv')
        expect(rows[1]!.text()).toContain('2,50 €')
        expect(rows[1]!.find('.wg__yes').exists()).toBe(false)
        expect(rows[1]!.find('.tag').text()).toBe('Inaktiv')
        // The cents travel as data and are never printed or multiplied here.
        expect(wrapper.text()).not.toContain('250')
    })

    it('names the consequence when no colour exists and still offers the form to a writer', () => {
        const wrapper = mountPage({ colours: [] })

        expect(wrapper.find('table').exists()).toBe(false)
        expect(wrapper.text()).toContain(
            'Noch keine Farbe angelegt. Solange können Kundinnen und Kunden kein Komplettrad bestellen.'
        )
        expect(wrapper.find('form').exists()).toBe(true)
        expect(wrapper.text()).toContain('Neue Farbe')
    })

    it('draws neither the form nor the row actions for a role that may not write', () => {
        const wrapper = mountPage({ can: READ })

        expect(wrapper.find('form').exists()).toBe(false)
        expect(button(wrapper, 'Bearbeiten')).toBeUndefined()
        expect(button(wrapper, 'Löschen')).toBeUndefined()
        expect(wrapper.find('table').exists()).toBe(true)
    })

    it('posts a new colour as typed, without touching the money string', async () => {
        const wrapper = mountPage()

        expect(wrapper.text()).toContain('Preis in Euro, deutsch geschrieben – zum Beispiel 49,00.')

        await wrapper.find('#wg-name').setValue('Schwarz')
        await wrapper.find('#wg-hex').setValue('#1A1C20')
        await wrapper.find('#wg-surcharge').setValue('2,50')
        await wrapper.find('#wg-sort').setValue('20')
        const checks = wrapper.findAll('input[type="checkbox"]')
        await checks[0]!.setValue(false)
        await checks[1]!.setValue(true)
        await colourForm(wrapper).trigger('submit')

        expect(router.post).toHaveBeenCalledWith(
            '/admin/wuchtgewichte',
            { nameDe: 'Schwarz', swatchHex: '#1A1C20', surcharge: '2,50', isDefault: false, active: true, sortOrder: 20 },
            expect.objectContaining({ preserveScroll: true })
        )
        expect(router.patch).not.toHaveBeenCalled()
    })

    it('loads a row into the form on Bearbeiten and patches that row', async () => {
        const wrapper = mountPage()

        await button(wrapper, 'Bearbeiten')!.trigger('click')

        expect(wrapper.text()).toContain('Farbe bearbeiten: Silber')
        expect((wrapper.find('#wg-name').element as HTMLInputElement).value).toBe('Silber')
        expect((wrapper.find('#wg-surcharge').element as HTMLInputElement).value).toBe('0,00 €')
        expect(wrapper.find('tbody tr').attributes('aria-current')).toBe('true')

        await wrapper.find('#wg-surcharge').setValue('1,00')
        await colourForm(wrapper).trigger('submit')

        expect(router.patch).toHaveBeenCalledWith(
            '/admin/wuchtgewichte/1',
            expect.objectContaining({ nameDe: 'Silber', surcharge: '1,00', isDefault: true }),
            expect.objectContaining({ preserveScroll: true })
        )
        expect(router.post).not.toHaveBeenCalled()

        await button(wrapper, 'Abbrechen')!.trigger('click')

        expect(wrapper.text()).toContain('Neue Farbe')
        expect((wrapper.find('#wg-name').element as HTMLInputElement).value).toBe('')
    })

    it('asks before deleting and only then sends the request', async () => {
        const wrapper = mountPage()

        expect(wrapper.find('.dialog-stub').exists()).toBe(false)

        await button(wrapper, 'Löschen')!.trigger('click')

        expect(wrapper.find('.dialog-stub').text()).toContain(
            'Farbe wirklich löschen? Bestellungen behalten die Farbe, die sie hatten.'
        )
        expect(router.delete).not.toHaveBeenCalled()

        await wrapper.find('.wg__confirm').trigger('click')

        expect(router.delete).toHaveBeenCalledWith('/admin/wuchtgewichte/1', expect.objectContaining({ preserveScroll: true }))
    })

    it('shows the server\'s message under the field it belongs to', async () => {
        const wrapper = mountPage()

        await wrapper.find('#wg-surcharge').setValue('49.00')
        await colourForm(wrapper).trigger('submit')

        current.props = { errors: { surchargeCents: 'Bitte schreib den Aufpreis deutsch, zum Beispiel 0,00 oder 2,50.' } }
        await nextTick()

        expect(wrapper.find('#wg-surcharge-err').text()).toBe('Bitte schreib den Aufpreis deutsch, zum Beispiel 0,00 oder 2,50.')
        expect(wrapper.find('#wg-surcharge').attributes('aria-invalid')).toBe('true')
        expect(wrapper.find('#wg-name').attributes('aria-invalid')).toBeUndefined()
    })
})
