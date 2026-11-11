import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

const post = vi.fn()
const put = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { errors: {} } }),
    // A request that finishes, as the real router's does: the page is not left busy.
    router: {
        post: (...args: unknown[]) => post(...args),
        put: (url: string, data: unknown, options?: { onFinish?: () => void }) => {
            put(url, data, options)
            options?.onFinish?.()
        },
    },
}))
vi.mock('../../../Components/Admin/AdminPage.vue', () => ({
    default: defineComponent({ props: { title: String, context: String }, setup: (props, { slots }) => () => h('main', [h('h1', props.title), h('p', { class: 'ctx' }, props.context), slots.default?.()]) }),
}))
vi.mock('../../../Components/Admin/AdminState.vue', () => ({
    default: defineComponent({ props: { text: String }, setup: (props) => () => h('p', { class: 'state' }, props.text) }),
}))
vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))

const { default: Page } = await import('./Versand.vue')

const STANDARD = {
    id: 1, name: 'Standardversand', description: '', price: '30,00 €', priceTyped: '30,00', freeFrom: null, freeFromTyped: '',
    minDays: 3, maxDays: 10, deliveryTime: '3–10 Werktage', countries: ['DE'], productTypes: [], active: true, demo: false,
}
const EXPRESS = {
    id: 2, name: 'Express', description: 'Beispiel: schneller zugestellt.', price: '59,90 €', priceTyped: '59,90', freeFrom: null, freeFromTyped: '',
    minDays: 1, maxDays: 2, deliveryTime: '1–2 Werktage', countries: ['DE'], productTypes: ['komplettrad'], active: false, demo: true,
}

function page(over: Record<string, unknown> = {}) {
    return mount(Page, {
        props: {
            methods: [STANDARD, EXPRESS],
            countries: { DE: 'Deutschland' },
            productTypes: { felgen: 'Felgen allein', komplettrad: 'Kompletträder' },
            productLine: 'Lieferzeit 3–10 Werktage · Versand 30,00 €',
            fromEnv: null,
            canEdit: true,
            ...over,
        },
    })
}

beforeEach(() => {
    post.mockReset()
    put.mockReset()
})

describe('Einstellungen › Versand', () => {
    it('lists the methods in their order with price, delivery time, what they ship and whether they are on', () => {
        const wrapper = page()
        const rows = wrapper.findAll('tbody tr')

        expect(wrapper.find('.ctx').text()).toBe('2 Versandarten, davon 1 aktiv')
        expect(rows.map((r) => r.find('.adm-table__key').text())).toEqual(['Standardversand', 'Express'])
        expect(rows[0]?.text()).toContain('3–10 Werktage')
        expect(rows[0]?.find('[data-label="Gilt für"]').text()).toBe('Alles')
        expect(rows[1]?.find('[data-label="Gilt für"]').text()).toBe('Kompletträder')
        expect(rows[1]?.find('[data-label="Im Shop"]').text()).toBe('Aus')
        expect(rows[1]?.text()).toContain('Demodaten')
        expect(wrapper.text()).toContain('Auf der Produktseite Lieferzeit 3–10 Werktage · Versand 30,00 €')
    })

    it('loads a method into the form and saves it as typed; a new one is posted', async () => {
        const wrapper = page()

        await wrapper.findAll('tbody tr')[1]!.findAll('button')[0]!.trigger('click')

        expect((wrapper.get('#vs-name').element as HTMLInputElement).value).toBe('Express')
        expect((wrapper.get('#vs-price').element as HTMLInputElement).value).toBe('59,90')
        expect(wrapper.get('#vs-form-title').text()).toBe('Versandart bearbeiten: Express')

        await wrapper.get('#vs-price').setValue('49,90')
        await wrapper.get('form').trigger('submit')

        expect(put).toHaveBeenCalledTimes(1)
        expect(put.mock.calls[0]?.[0]).toBe('/admin/einstellungen/versand/2')
        expect(put.mock.calls[0]?.[1]).toMatchObject({ name: 'Express', price: '49,90', min_days: 1, max_days: 2, product_types: ['komplettrad'], active: false })
    })

    it('switches a method on from the list with its values as they stand, and moves it as one ordered list', async () => {
        const wrapper = page()
        const express = wrapper.findAll('tbody tr')[1]!

        await express.findAll('button')[1]!.trigger('click')

        expect(put.mock.calls[0]?.[0]).toBe('/admin/einstellungen/versand/2')
        expect(put.mock.calls[0]?.[1]).toMatchObject({ price: '59,90', active: true })

        await express.findAll('button')[2]!.trigger('click')

        expect(put.mock.calls[1]?.[0]).toBe('/admin/einstellungen/versand/reihenfolge')
        expect(put.mock.calls[1]?.[1]).toEqual({ ids: [2, 1] })
        expect((express.findAll('button')[3]!.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('says when no method is on, and what stands while none was ever saved', () => {
        expect(page({ methods: [{ ...STANDARD, active: false }] }).text()).toContain('Keine Versandart ist aktiv. Solange nimmt der Shop keine echte Bestellung an.')
        expect(page({ methods: [], productLine: null, fromEnv: 'Lieferzeit 2–4 Werktage' }).text()).toContain('Bis dahin gelten die Werte aus der .env-Datei: Lieferzeit 2–4 Werktage.')
    })
})
