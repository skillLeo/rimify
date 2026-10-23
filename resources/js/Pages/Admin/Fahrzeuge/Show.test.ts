import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const sent: string[] = []

vi.mock('@inertiajs/vue3', async () => {
    const { defineComponent, h, reactive } = await import('vue')

    return {
        Link: defineComponent({ props: { href: { type: String, required: true } }, setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()) }),
        useForm: (initial: Record<string, unknown>) => {
            const form = reactive({
                ...initial,
                errors: {},
                processing: false,
                isDirty: true,
                put(url: string) {
                    sent.push(url)
                },
            })

            return form
        },
    }
})

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: {} }))

const { default: Show } = await import('./Show.vue')

type Props = InstanceType<typeof Show>['$props']

const vehicle = {
    id: 9, name: 'BMW 1er 187', keys: '0005 · 123', vsn: null, typeDesignation: '187', window: '09/2004 – 08/2011', power: '100 kW',
    bodyForm: null, axleFront: 1100, axleRear: 1100, maxSpeed: null, needsReview: true, complete: false,
}

function page(overrides: Partial<Props> = {}) {
    return mount(Show, {
        props: { vehicle, rows: [], topSpeed: { needed: false, released: 0, documents: [] }, owed: [], can: { edit: true }, ...overrides } as Props,
        global: { stubs: { AdminPage: { template: '<div><slot /></div>' }, AdminConfirm: { props: ['open'], template: '<div v-if="open" data-confirm />' } } },
    })
}

/*
 * D-287 (the operator's answers of 18.10.2026): field T is asked only where a released Gutachten for this car needs it,
 * and the page names each with what is recorded; elsewhere it is optional, and the page says why.
 */
describe('Fahrzeuge › Show', () => {
    it('asks for T where a released Gutachten needs it, naming each and why, and says what the shop waits for', () => {
        const wrapper = page({
            topSpeed: {
                needed: true,
                released: 2,
                documents: [{ id: 4, label: 'ABE 55255', href: '/admin/gutachten/4', why: 'Laut den Angaben druckt das Gutachten eine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit.' }],
            },
            owed: ['T'],
        })

        expect(wrapper.find('label[for="fs-speed"]').text()).toBe('Höchstgeschwindigkeit in km/h (Feld T)')
        expect(wrapper.find('[data-speed-why] p').text()).toBe('Für die Reifen nötig:')
        expect(wrapper.find('[data-speed-why] li').text()).toBe('ABE 55255: Laut den Angaben druckt das Gutachten eine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit.')
        expect(wrapper.find('[data-speed-why] a').attributes('href')).toBe('/admin/gutachten/4')
        expect(wrapper.find('#fs-speed').attributes('aria-describedby')).toBe('fs-speed-why fs-speed-err')
        expect(wrapper.find('.fs-warn').text()).toBe(
            'Diesem Fahrzeug fehlt die Höchstgeschwindigkeit (Feld T). Solange sie fehlt, kann der Shop die Reifen nur für Kunden bestätigen, die ihre Werte aus der Zulassungsbescheinigung Teil I eintragen.'
        )
    })

    it('says where the list of rows is cut, and counts them all (the admin audit’s F-37)', () => {
        const rows = Array.from({ length: 3 }, (_, i) => ({ id: i + 1, documentId: 4, document: 'ABE 55255', documentHref: '/admin/gutachten/4', wheel: 'Borbet Y', size: '8J × 18 ET 35', status: 'published', requiresEntry: false, conditions: 0 }))

        expect(page({ rows, rowsTotal: 1_204 }).find('.fs-cut').text()).toBe('Hier stehen die ersten 3 von 1.204 Zeilen, nach Gutachten geordnet. Die übrigen stehen auf der Seite ihres Gutachtens.')
        expect(page({ rows, rowsTotal: 3 }).find('.fs-cut').exists()).toBe(false)
    })

    it('corrects a car typed by hand that nothing refers to, and says why another stays as it is (the admin audit’s F-17)', async () => {
        const values = { make: 'Prüfwerk', model: 'Größe Eins', variant: '1.6 Limousine', type_designation: 'PW1', hsn: '0005', tsn: 'ZZ8', eg_number: 'e1*2007/46*0999*02', power_kw: '90', build_from: '03.2019', build_to: '', body_form: '', drive_axle: '' }
        const open = page({ identity: { correctable: true, why: null, form: values, stamp: 'id-1' }, bodyForms: ['Limousine'], drives: ['Allrad'] })

        expect(open.find('.fs-rule').text()).toBe('Ein Fahrzeug wird nie gelöscht. Seine Angaben kannst du korrigieren, solange nichts darauf verweist.')
        await open.findAll('button').find((b) => b.text() === 'Angaben korrigieren')!.trigger('click')
        expect((open.find('#fk-make').element as HTMLInputElement).value).toBe('Prüfwerk')
        expect(open.find('label[for="fk-kw"]').text()).toContain('(Feld P.2)')

        sent.length = 0
        await open.find('form.fk-form').trigger('submit')
        expect(sent).toEqual(['/admin/fahrzeuge/9/angaben'])

        const kept = page({ identity: { correctable: false, why: 'Auf dieses Fahrzeug verweist schon eine Zeile eines Gutachtens. Seine Angaben lassen sich deshalb nicht mehr ändern, damit erklärbar bleibt, was darauf beruht.', form: null, stamp: null } })
        expect(kept.findAll('button').some((b) => b.text() === 'Angaben korrigieren')).toBe(false)
        expect(kept.find('.fs-rule').text()).toBe('Ein Fahrzeug wird nie gelöscht. Auf dieses Fahrzeug verweist schon eine Zeile eines Gutachtens. Seine Angaben lassen sich deshalb nicht mehr ändern, damit erklärbar bleibt, was darauf beruht.')
    })

    // D-291: each axle on its own, as the shop asks the customer.
    it('names the one axle that is missing, and both where both are', () => {
        expect(page({ owed: ['8.2'] }).find('.fs-warn').text()).toBe(
            'Diesem Fahrzeug fehlt die Achslast hinten (Feld 8.2). Solange sie fehlt, kann der Shop die Reifen nur für Kunden bestätigen, die ihre Werte aus der Zulassungsbescheinigung Teil I eintragen.'
        )
        expect(page({ owed: ['8.1', '8.2', 'T'] }).find('.fs-warn').text()).toBe(
            'Diesem Fahrzeug fehlen die Achslasten (Felder 8.1 und 8.2) und die Höchstgeschwindigkeit (Feld T). Solange sie fehlen, kann der Shop die Reifen nur für Kunden bestätigen, die ihre Werte aus der Zulassungsbescheinigung Teil I eintragen.'
        )
    })

    it('says why T is not needed where nothing needs it — no warning over a figure nothing asks for', () => {
        const wrapper = page({ topSpeed: { needed: false, released: 1, documents: [] } })

        expect(wrapper.find('label[for="fs-speed"]').text()).toBe('Höchstgeschwindigkeit in km/h (Feld T)')
        expect(wrapper.find('[data-speed-why]').text()).toContain('Für die Reifen nicht nötig')
        expect(wrapper.find('.fs-warn').exists()).toBe(false)

        const none = page()

        expect(none.find('[data-speed-why]').text()).toContain('Bei uns ist noch kein Gutachten zu diesem Fahrzeug freigegeben.')
        // Read only, without the edit right: never „fehlt“ beside a top speed nothing needs.
        expect(page({ topSpeed: { needed: false, released: 1, documents: [] }, can: { edit: false } }).text()).toContain('nicht eingetragen – für die Reifen nicht nötig')
    })

    it('asks first before taking away a value the shop’s answers rest on — and not for a top speed nothing needs', async () => {
        const complete = { ...vehicle, maxSpeed: 250, needsReview: false, complete: true }
        const optional = page({ vehicle: complete, topSpeed: { needed: false, released: 1, documents: [] } })

        await optional.find('#fs-speed').setValue('')
        await optional.find('form').trigger('submit')

        expect(optional.find('[data-confirm]').exists()).toBe(false)
        expect(sent.at(-1)).toBe('/admin/fahrzeuge/9')

        const needed = page({ vehicle: complete, topSpeed: { needed: true, released: 1, documents: [] } })
        const before = sent.length

        await needed.find('#fs-speed').setValue('')
        await needed.find('form').trigger('submit')

        expect(needed.find('[data-confirm]').exists()).toBe(true)
        expect(sent).toHaveLength(before)
    })
})
