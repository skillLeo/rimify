import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const sent: { url: string; data: Record<string, unknown> }[] = []

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')

    return {
        usePage: () => ({ props: { errors: {} } }),
        useForm: (initial: Record<string, unknown>) => {
            const form = reactive({
                ...initial,
                processing: false,
                reset: () => form,
                clearErrors: () => form,
                put(url: string, options?: { onSuccess?: () => void }) {
                    const { processing: _processing, reset: _reset, clearErrors: _clear, put: _put, ...data } = form

                    sent.push({ url, data: JSON.parse(JSON.stringify(data)) as Record<string, unknown> })
                    options?.onSuccess?.()
                },
            })

            return form
        },
    }
})

const { default: CombinationsCard } = await import('./CombinationsCard.vue')

/*
 * D-256 (his item 8, Group A): a Gutachten's own „Bereifungskombinationen“ are typed as printed — number, front size,
 * rear size — and saved whole; once entered, they are shown in the document's numbering with their page.
 */
describe('CombinationsCard', () => {
    it('takes the list as printed, numbered on from the last, and sends it whole', async () => {
        const wrapper = mount(CombinationsCard, {
            props: { documentId: 7, combinations: { sourcePage: null, entries: [] }, editable: true, pageCount: 8 },
            attachTo: document.body,
        })

        expect(wrapper.text()).toContain('Zu diesem Gutachten sind keine Bereifungskombinationen hinterlegt.')

        await wrapper.find('#kb-edit').trigger('click')
        await wrapper.find('#kb-page').setValue('4')
        await wrapper.find('#kb-front-0').setValue('225/40 R18')
        await wrapper.find('#kb-rear-0').setValue('225/40 R18')
        await wrapper.find('#kb-add-row').trigger('click')

        expect((wrapper.find('#kb-number-1').element as HTMLInputElement).value).toBe('2')

        await wrapper.find('#kb-front-1').setValue('225/40 R18')
        await wrapper.find('#kb-rear-1').setValue('245/35 R18')
        await wrapper.find('form').trigger('submit')

        expect(sent.at(-1)).toEqual({
            url: '/admin/gutachten/7/bereifungskombinationen',
            data: {
                source_page: 4,
                combinations: [
                    { number: 1, front: '225/40 R18', rear: '225/40 R18' },
                    { number: 2, front: '225/40 R18', rear: '245/35 R18' },
                ],
            },
        })

        wrapper.unmount()
    })

    it('shows an entered list in the document\'s numbering with its page — and offers no change where it may not be changed', () => {
        const combinations = {
            sourcePage: 4,
            entries: [
                { number: 1, front: '225/40 R18', rear: '225/40 R18' },
                { number: 2, front: '225/40 R18', rear: '245/35 R18' },
            ],
        }

        const wrapper = mount(CombinationsCard, { props: { documentId: 7, combinations, editable: false, pageCount: 8 } })

        expect(wrapper.findAll('tbody tr').map((row) => row.findAll('th, td').map((cell) => cell.text()))).toEqual([
            ['1', '225/40 R18', '225/40 R18'],
            ['2', '225/40 R18', '245/35 R18'],
        ])
        expect(wrapper.text()).toContain('Seite 4 im Gutachten.')
        expect(wrapper.find('#kb-edit').exists()).toBe(false)
        // On a phone each row is a card that writes its label before the value (admin.css): front and rear say which they are.
        expect(wrapper.findAll('tbody tr').map((row) => row.findAll('td').map((cell) => cell.attributes('data-label')))).toEqual([
            ['Vorderachse', 'Hinterachse'],
            ['Vorderachse', 'Hinterachse'],
        ])
    })
})
