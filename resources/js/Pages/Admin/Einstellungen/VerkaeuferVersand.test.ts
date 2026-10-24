import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { AdminVerkaeuferVersandProps } from '../../../types/admin/verkaeuferVersand'

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

vi.mock('../../../Components/Admin/AdminPage.vue', () => ({
    default: defineComponent({ props: { title: String, context: String }, setup: (props, { slots }) => () => h('main', [h('h1', props.title), h('p', { class: 'ctx' }, props.context), slots.default?.()]) }),
}))
vi.mock('../../../Components/Admin/AdminSaveBar.vue', () => ({ default: defineComponent({ setup: () => () => null }) }))
vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => slots.default?.() }) }))

const errors: Record<string, string> = reactive({})

vi.mock('../../../composables/admin/useDirtyForm', () => ({
    useDirtyForm: (initial: object) => ({ form: reactive({ ...structuredClone(initial), errors }), save: vi.fn() }),
}))

const { default: Page } = await import('./VerkaeuferVersand.vue')

function props(over: Partial<AdminVerkaeuferVersandProps> = {}): AdminVerkaeuferVersandProps {
    return {
        stamp: 'stand-1',
        seller: {
            name: 'Beispiel Räder GmbH',
            legal_form: '',
            street: '',
            zip: '',
            city: '',
            managing_director: '',
            register_court: '',
            register_number: '',
            vat_id: '',
            tax_number: '',
            email: '',
            phone: '',
            placeholder: false,
            not_applicable: { managing_director: false, register: false, vat_id: false, phone: false },
        },
        sellerSource: 'Einstellungen',
        legacyRegister: null,
        sellerMissing: [],
        impressumMissing: [],
        shipping: { cost: '4,90 €', free_from: '', min_days: '3', max_days: '5', placeholder: false },
        shippingSource: 'Einstellungen',
        legacyTime: null,
        shippingMissing: [],
        shippingPreview: 'Lieferzeit 3–5 Werktage · Versand 4,90 €',
        countries: { DE: 'Deutschland' },
        contactEmail: null,
        ...over,
    }
}

describe('Einstellungen › Verkäufer & Versand', () => {
    it('says where the values in force come from, and what a real invoice and a real order still need', () => {
        const wrapper = mount(Page, {
            props: props({ sellerSource: '.env', sellerMissing: ['PLZ', 'USt-IdNr. oder Steuernummer'], shippingMissing: ['Lieferzeit'], legacyTime: '2–4 Werktage' }),
        })

        expect(wrapper.find('.ctx').text()).toBe('In Kraft: die Werte aus der .env-Datei – hier ist noch nichts gespeichert')
        expect(wrapper.findAll('.vv-open').map((p) => p.text())).toEqual([
            'Für echte Rechnungen fehlt noch: PLZ, USt-IdNr. oder Steuernummer. Bis dahin ist jede Rechnung eine Testrechnung.',
            'Für echte Bestellungen fehlt noch: Lieferzeit. Bis dahin nimmt der Shop nur Testbestellungen an.',
        ])
        expect(wrapper.text()).toContain('Aus der .env-Datei: „2–4 Werktage“.')
    })

    it('shows the product page’s line, and marks a section as placeholder the moment it is ticked', async () => {
        const wrapper = mount(Page, { props: props() })

        expect(wrapper.find('.vv-preview').text()).toBe('Auf der Produktseite Lieferzeit 3–5 Werktage · Versand 4,90 €')
        expect(wrapper.find('.vv-tag').exists()).toBe(false)

        await wrapper.get('input[aria-describedby="vv-seller-placeholder-help"]').setValue(true)

        expect(wrapper.find('#vv-seller .vv-tag').text()).toBe('Platzhalter')
    })

    // D-319: the Impressum renders from these fields; what does not apply is declared, and the page says what the
    // Impressum still shows as a marker — and what that keeps shut.
    it('offers „Entfällt“ beside the four fields that may not apply, and names the Impressum’s markers', async () => {
        const wrapper = mount(Page, { props: props({ impressumMissing: ['Rechtsform', 'Telefon'] }) })

        expect(wrapper.get('.vv-impressum').text()).toBe(
            'Im Impressum fehlt noch: Rechtsform, Telefon. Bis dahin sperrt der Shop Suchmaschinen aus und nimmt keine echten Zahlungen an.'
        )
        expect(wrapper.findAll('.vv-na input').map((input) => input.attributes('id'))).toEqual([
            'vv-na-managing_director',
            'vv-na-register',
            'vv-na-vat_id',
            'vv-na-phone',
        ])
        expect(wrapper.find('#vv-legal_form').exists()).toBe(true)

        await wrapper.get('#vv-na-phone').setValue(true)

        expect((wrapper.get('#vv-na-phone').element as HTMLInputElement).checked).toBe(true)
        expect(mount(Page, { props: props() }).find('.vv-impressum').exists()).toBe(false)
    })

    it('puts each error under its own field', async () => {
        errors['seller.zip'] = 'Die PLZ hat fünf Ziffern.'
        const wrapper = mount(Page, { props: props() })

        expect(wrapper.find('#vv-zip-error').text()).toBe('Die PLZ hat fünf Ziffern.')
        expect(wrapper.find('#vv-zip').attributes('aria-invalid')).toBe('true')
        expect(wrapper.find('#vv-city-error').text()).toBe('')

        delete errors['seller.zip']
    })
})
