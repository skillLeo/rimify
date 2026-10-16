import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const sent: { url: string; data: Record<string, unknown> }[] = []

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')

    return {
        usePage: () => ({ props: { errors: {} } }),
        useForm: (initial: Record<string, unknown>) => {
            let shape = (data: Record<string, unknown>): Record<string, unknown> => data
            const form = reactive({
                ...initial,
                processing: false,
                defaults: () => form,
                reset: () => form,
                clearErrors: () => form,
                transform(fn: (data: Record<string, unknown>) => Record<string, unknown>) {
                    shape = fn

                    return form
                },
                post(url: string, options?: { onSuccess?: () => void }) {
                    sent.push({ url, data: shape({ ...form }) })
                    options?.onSuccess?.()
                },
            })

            return form
        },
    }
})

const { default: CountCard } = await import('./CountCard.vue')

/*
 * ADMIN-GEFUNDEN 511: the count of a Verwendungsbereich is asked before the rows, each figure with its page; once taken
 * it is shown, with when it was taken.
 */
describe('CountCard', () => {
    it('asks a new draft first, each figure with its page — and the Abnahme\'s page only where one is asked for', async () => {
        const wrapper = mount(CountCard, { props: { documentId: 7, count: null, editable: true, pageCount: 8, rows: 0 }, attachTo: document.body })

        expect(wrapper.text()).toContain('Bevor du Zeilen erfasst')
        expect(wrapper.find('#zl-abnahme-page').exists()).toBe(false)

        await wrapper.find('#zl-codes').setValue('6')
        await wrapper.find('#zl-codes-page').setValue('3')
        await wrapper.find('#zl-sizes').setValue('3')
        await wrapper.find('#zl-sizes-page').setValue('3')
        await wrapper.find('#zl-abnahme-all').setValue(true)
        await wrapper.find('#zl-abnahme-page').setValue('4')
        await wrapper.find('form').trigger('submit')

        expect(sent.at(-1)).toEqual({
            url: '/admin/gutachten/7/zaehlung',
            data: { codes: 6, codes_page: 3, sizes: 3, sizes_page: 3, axle_limit_kg: null, axle_limit_page: null, abnahme: 'all', abnahme_page: 4 },
        })

        wrapper.unmount()
    })

    it('shows a count once taken, says it was taken before the first row, and offers to change it', () => {
        const wrapper = mount(CountCard, {
            props: {
                documentId: 7,
                count: {
                    codes: 6, codesPage: 3, sizes: 3, sizesPage: 3, axleLimitKg: null, axleLimitPage: null, abnahme: 'none', abnahmePage: null,
                    lines: ['6 Auflagen-Codes (Seite 3)', '3 Reifengrößen (Seite 3)', 'keine Achslastgrenze', 'keine Abnahme'],
                    by: 'Sabine Roth', at: '16.10.2026, 21:30', beforeEntry: true,
                },
                editable: true,
                pageCount: 8,
                rows: 2,
            },
        })

        expect(wrapper.findAll('.zl-lines li').map((li) => li.text())).toEqual(['6 Auflagen-Codes (Seite 3)', '3 Reifengrößen (Seite 3)', 'keine Achslastgrenze', 'keine Abnahme'])
        expect(wrapper.text()).toContain('Gezählt von Sabine Roth am 16.10.2026, 21:30 – bevor die erste Zeile stand.')
        expect(wrapper.find('#zl-edit').text()).toContain('Zählung ändern')
        expect(wrapper.find('form').exists()).toBe(false)
    })
})
