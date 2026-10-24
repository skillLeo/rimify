import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@inertiajs/vue3', async () => {
    const { defineComponent, h, reactive } = await import('vue')

    return {
        Link: defineComponent({ props: { href: { type: String, required: true } }, setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()) }),
        useForm: (initial: Record<string, unknown>) => reactive({ ...initial, errors: {}, processing: false, post: vi.fn(), clearErrors: vi.fn(), setError: vi.fn() }),
    }
})

vi.mock('../../../Layouts/AdminLayout.vue', () => ({ default: {} }))

const { default: Import } = await import('./Import.vue')

const run = (id: number) => ({ id, file: `fahrzeuge-${id}.csv`, source: 'KBA', format: 'csv', status: 'applied' as const, statusLabel: 'Importiert', summary: { create: 2 }, by: 'Anna', at: '23.10.2026, 10:00 Uhr', href: `/admin/fahrzeuge/import/${id}` })

function page(imports: ReturnType<typeof run>[], total: number) {
    return mount(Import, {
        props: { sources: [{ value: 'import_kba', label: 'KBA' }], fields: [], imports, total, can: { preview: true } },
        global: { stubs: { AdminPage: { template: '<div><slot /></div>' }, AdminState: true, FilePick: true } },
    })
}

/*
 * The runs' list shows the latest 20 and says so where there are more, as Katalog › Import says of its own (the admin
 * audit's sweep of lists that stop without a word, after F-26).
 */
describe('Fahrzeuge › Import', () => {
    it('says it shows the latest runs of more', () => {
        const runs = Array.from({ length: 20 }, (_, i) => run(i + 1))

        expect(page(runs, 23).find('.fi-more').text()).toBe('Hier stehen die letzten 20 von 23 Läufen.')
        expect(page(runs, 20).find('.fi-more').exists()).toBe(false)
    })
})
