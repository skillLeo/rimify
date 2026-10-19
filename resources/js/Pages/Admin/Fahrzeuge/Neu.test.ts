import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const posted: string[] = []

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')

    return {
        useForm: (initial: Record<string, unknown>) =>
            reactive({
                ...initial,
                errors: {},
                processing: false,
                post(url: string) {
                    posted.push(url)
                },
            }),
    }
})

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: {} }))
vi.mock('../../../composables/admin/focusRefused', () => ({ focusRefused: vi.fn(), afterDialogsClose: (then: () => void) => then() }))

const { default: Neu } = await import('./Neu.vue')

function page() {
    posted.length = 0

    return mount(Neu, {
        props: { bodyForms: ['Limousine', 'Kombi'], drives: ['Allrad', 'Vorderachse', 'Hinterachse'] },
        global: {
            stubs: {
                AdminPage: { template: '<div><slot /></div>' },
                Dialog: {
                    props: ['open', 'title', 'description'],
                    emits: ['update:open'],
                    template: '<div v-if="open" data-dialog><p data-title>{{ title }}</p><p>{{ description }}</p><slot name="actions" /></div>',
                },
            },
        },
    })
}

/*
 * His admin items 1 and 3 (D-296): a car typed from its Zulassungsbescheinigung, each field with its number in the
 * papers; without an axle load the form says first what that costs, naming only what is missing.
 */
describe('Fahrzeuge › Neues Fahrzeug', () => {
    it('names each field by its number in the Zulassungsbescheinigung @admin-203', () => {
        const wrapper = page()
        const label = (id: string): string => wrapper.find(`label[for="${id}"]`).text()

        expect(label('fn-make')).toContain('(Feld D.1)')
        expect(label('fn-model')).toContain('(Feld D.3)')
        expect(label('fn-hsn')).toContain('(Feld 2.1)')
        expect(label('fn-tsn')).toContain('(Feld 2.2)')
        expect(label('fn-eg')).toContain('(Feld K)')
        expect(label('fn-kw')).toContain('(Feld P.2)')
        expect(label('fn-front')).toContain('(Feld 8.1)')
        expect(label('fn-rear')).toContain('(Feld 8.2)')
        expect(label('fn-speed')).toContain('(Feld T, optional)')
    })

    it('says what missing axle loads cost before it saves, and saves only on yes @admin-201', async () => {
        const wrapper = page()

        await wrapper.find('form').trigger('submit')

        const dialog = wrapper.find('[data-dialog]')
        expect(dialog.find('[data-title]').text()).toBe('Ohne Achslasten anlegen?')
        expect(dialog.text()).toContain('Ohne die Achslasten aus den Feldern 8.1 und 8.2 bestätigt der Shop für dieses Fahrzeug keine Reifen')
        expect(posted).toEqual([])

        const save = dialog.findAll('button').find((b) => b.text() === 'Ohne Achslasten anlegen')
        await save?.trigger('click')

        expect(posted).toEqual(['/admin/fahrzeuge'])
    })

    it('names only the axle load that is missing, and offers to enter it rather than save @admin-201', async () => {
        const wrapper = page()

        await wrapper.find('#fn-front').setValue('1.160')
        await wrapper.find('form').trigger('submit')

        const dialog = wrapper.find('[data-dialog]')
        expect(dialog.find('[data-title]').text()).toBe('Ohne Achslast hinten anlegen?')
        expect(dialog.text()).toContain('Ohne die Achslast hinten aus Feld 8.2 bestätigt der Shop')

        await dialog.find('#fn-warn-enter').trigger('click')

        expect(wrapper.find('[data-dialog]').exists()).toBe(false)
        expect(posted).toEqual([])
    })

    it('saves at once with both axle loads — the top speed is not asked for before a Gutachten needs it (D-287) @admin-201', async () => {
        const wrapper = page()

        await wrapper.find('#fn-front').setValue('1.160')
        await wrapper.find('#fn-rear').setValue('1.240')
        await wrapper.find('form').trigger('submit')

        expect(wrapper.find('[data-dialog]').exists()).toBe(false)
        expect(posted).toEqual(['/admin/fahrzeuge'])
    })
})
