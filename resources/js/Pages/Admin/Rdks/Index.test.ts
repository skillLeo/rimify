import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import type { AdminRdksProps } from '../../../types/pages'

/*
 * RDKS-Sensorpreise je Marke (komplettrad.md §9.3): the table with the make's join key beside its
 * label, the inline form with the datalist, the empty state that names the consequence, and the
 * delete confirmation. The page prints the money string the server sent and posts what was typed.
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

type Price = AdminRdksProps['prices'][number]

const WRITE = { create: true, update: true, delete: true }
const READ = { create: false, update: false, delete: false }

function price(overrides: Partial<Price> = {}): Price {
    return {
        id: 7,
        makeKey: 'volkswagen',
        makeLabelDe: 'Volkswagen',
        priceCents: 4900,
        price: '49,00 €',
        active: true,
        ...overrides,
    }
}

let mounted: VueWrapper[] = []

function mountPage(props: Partial<AdminRdksProps> = {}): VueWrapper {
    current.props = {}

    const wrapper = mount(Page, {
        props: {
            prices: [price()],
            makes: ['Audi', 'Porsche', 'VW'],
            default: { cents: 1500, typed: '15,00 €' },
            can: WRITE,
            ...props,
        },
        attachTo: document.body,
        global: { stubs: { Dialog: DialogStub } },
    })
    mounted.push(wrapper)

    return wrapper
}

function button(wrapper: VueWrapper, text: string) {
    return wrapper.findAll('button').find((b) => b.text().startsWith(text))
}

/** The per-make form, not the default price above it: the page carries two, and they post differently. */
function priceForm(wrapper: VueWrapper) {
    return wrapper.find('form.rd__form:not(.rd__form--default)')
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    vi.clearAllMocks()
})

describe('RDKS-Sensorpreise je Marke', () => {
    it('prints every make with its join key and the server-formatted price', () => {
        const wrapper = mountPage({
            prices: [price(), price({ id: 8, makeKey: 'porsche', makeLabelDe: 'Porsche', priceCents: 18900, price: '189,00 €', active: false })],
        })
        const rows = wrapper.findAll('tbody tr')

        expect(rows).toHaveLength(2)
        expect(rows[0]!.text()).toContain('Volkswagen')
        expect(rows[0]!.text()).toContain(
            'Wir merken uns die Marke als volkswagen – so finden wir sie auch bei anderer Schreibweise wieder.'
        )
        expect(rows[0]!.text()).toContain('49,00 €')
        expect(rows[0]!.find('.tag').text()).toBe('Aktiv')
        expect(rows[1]!.text()).toContain('189,00 €')
        expect(rows[1]!.find('.tag').text()).toBe('Inaktiv')
        // The cents travel as data and are never printed or multiplied here.
        expect(wrapper.text()).not.toContain('4900')
        expect(wrapper.text()).not.toContain('196,00')
    })

    it('names the consequence when no price exists and offers the makes of the vehicle table', () => {
        const wrapper = mountPage({ prices: [] })

        expect(wrapper.find('table').exists()).toBe(false)
        expect(wrapper.text()).toContain(
            'Noch kein Preis hinterlegt. Wir fragen RDKS-Sensoren an der Kasse zwar ab, können sie aber für keine Marke berechnen.'
        )
        expect(wrapper.find('#rd-make').attributes('list')).toBe('rd-makes')
        expect(wrapper.findAll('#rd-makes option').map((o) => o.attributes('value'))).toEqual(['Audi', 'Porsche', 'VW'])
    })

    it('draws neither the form nor the row actions for a role that may not write', () => {
        const wrapper = mountPage({ can: READ })

        expect(wrapper.find('form').exists()).toBe(false)
        expect(button(wrapper, 'Bearbeiten')).toBeUndefined()
        expect(button(wrapper, 'Löschen')).toBeUndefined()
        expect(wrapper.find('table').exists()).toBe(true)
    })

    it('posts a new price as typed, without touching the money string', async () => {
        const wrapper = mountPage()

        expect(wrapper.text()).toContain('Preis in Euro, deutsch geschrieben – zum Beispiel 49,00.')

        await wrapper.find('#rd-make').setValue('Porsche')
        await wrapper.find('#rd-price').setValue('189,00')
        await priceForm(wrapper).trigger('submit')

        expect(router.post).toHaveBeenCalledWith(
            '/admin/rdks-preise',
            { make: 'Porsche', price: '189,00', active: true },
            expect.objectContaining({ preserveScroll: true })
        )
        expect(router.patch).not.toHaveBeenCalled()
    })

    it('loads a row into the form on Bearbeiten and patches that row', async () => {
        const wrapper = mountPage()

        await button(wrapper, 'Bearbeiten')!.trigger('click')

        expect(wrapper.text()).toContain('Preis bearbeiten: Volkswagen')
        expect((wrapper.find('#rd-make').element as HTMLInputElement).value).toBe('Volkswagen')
        expect((wrapper.find('#rd-price').element as HTMLInputElement).value).toBe('49,00 €')
        expect(wrapper.find('tbody tr').attributes('aria-current')).toBe('true')

        await wrapper.find('#rd-price').setValue('59,00')
        await priceForm(wrapper).trigger('submit')

        expect(router.patch).toHaveBeenCalledWith(
            '/admin/rdks-preise/7',
            { make: 'Volkswagen', price: '59,00', active: true },
            expect.objectContaining({ preserveScroll: true })
        )
        expect(router.post).not.toHaveBeenCalled()

        await button(wrapper, 'Abbrechen')!.trigger('click')

        expect(wrapper.text()).toContain('Neuer Preis')
        expect((wrapper.find('#rd-make').element as HTMLInputElement).value).toBe('')
    })

    it('asks before deleting and only then sends the request', async () => {
        const wrapper = mountPage()

        expect(wrapper.find('.dialog-stub').exists()).toBe(false)

        await button(wrapper, 'Löschen')!.trigger('click')

        expect(wrapper.find('.dialog-stub').text()).toContain(
            'Preis wirklich löschen? An der Kasse können wir für diese Marke dann keine Sensoren mehr berechnen.'
        )
        expect(router.delete).not.toHaveBeenCalled()

        await wrapper.find('.rd__confirm').trigger('click')

        expect(router.delete).toHaveBeenCalledWith('/admin/rdks-preise/7', expect.objectContaining({ preserveScroll: true }))
    })

    it('shows the server\'s message under the field it belongs to', async () => {
        const wrapper = mountPage()

        await wrapper.find('#rd-make').setValue('Volkswagen')
        await wrapper.find('#rd-price').setValue('49,00')
        await priceForm(wrapper).trigger('submit')

        current.props = { errors: { makeKey: 'Für diese Marke ist schon ein Preis hinterlegt – bearbeite ihn dort.' } }
        await nextTick()

        expect(wrapper.find('#rd-make-err').text()).toBe('Für diese Marke ist schon ein Preis hinterlegt – bearbeite ihn dort.')
        expect(wrapper.find('#rd-make').attributes('aria-invalid')).toBe('true')
        expect(wrapper.find('#rd-price').attributes('aria-invalid')).toBeUndefined()
    })
})
