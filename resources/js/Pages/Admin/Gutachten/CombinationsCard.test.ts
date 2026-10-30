import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const sent: { url: string; data: Record<string, unknown> }[] = []
const posted: { url: string; data: Record<string, unknown> }[] = []

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')

    return {
        usePage: () => ({ props: { errors: {} } }),
        router: {
            post(url: string, data: Record<string, unknown>, options?: { onSuccess?: () => void; onFinish?: () => void }) {
                posted.push({ url, data: JSON.parse(JSON.stringify(data)) as Record<string, unknown> })
                options?.onSuccess?.()
                options?.onFinish?.()
            },
        },
        useForm: (initial: Record<string, unknown>) => {
            const form = reactive({
                ...initial,
                processing: false,
                reset: () => form,
                clearErrors: () => form,
                defaults: () => form,
                put(url: string, options?: { onSuccess?: () => void }) {
                    const { processing: _processing, reset: _reset, clearErrors: _clear, defaults: _defaults, put: _put, ...data } = form

                    sent.push({ url, data: JSON.parse(JSON.stringify(data)) as Record<string, unknown> })
                    options?.onSuccess?.()
                },
            })

            return form
        },
    }
})

const { default: CombinationsCard } = await import('./CombinationsCard.vue')

const A = 'e1*2007/46*0316*11'
const B = 'e1*2007/46*0317*02'

/** Two vehicle types: A with BBS's two (carried over from the document-wide list), B with one of its own. */
function view(entriesOf: { a?: boolean; b?: boolean } = { a: true, b: true }) {
    return {
        sourcePage: 4,
        unassigned: [],
        entries: [
            {
                eg: A,
                cars: ['BMW 3er (E90)'],
                carriedOver: true,
                combinations: entriesOf.a
                    ? [
                          { id: 11, number: 1, front: '225/40 R18', rear: '225/40 R18' },
                          { id: 12, number: 2, front: '225/40 R18', rear: '245/35 R18' },
                      ]
                    : [],
            },
            { eg: B, cars: ['BMW 1er (E87)'], carriedOver: false, combinations: entriesOf.b ? [{ id: 21, number: 1, front: '235/35 R19', rear: '235/35 R19' }] : [] },
        ],
    }
}

const rows = (wrapper: ReturnType<typeof mount>): string[][] =>
    wrapper.findAll('tbody tr').map((row) => row.findAll('th, td').slice(0, 3).map((cell) => cell.text()))

/*
 * D-256 (his item 8, Group A), per vehicle type since his admin item 19 (D-358): the EG number is chosen first, its list
 * typed as printed — number, front size, rear size — and saved whole; another number's list can be copied in to check,
 * and one combination put on several numbers at once.
 */
describe('CombinationsCard', () => {
    afterEach(() => {
        sent.length = 0
        posted.length = 0
        document.body.innerHTML = ''
    })

    it('shows the chosen EG number\'s list in its numbering with its page, says what was carried over, and offers no change where it may not be changed', async () => {
        const wrapper = mount(CombinationsCard, { props: { documentId: 7, combinations: view(), editable: false, pageCount: 8 } })

        expect((wrapper.find('#kb-entry').element as HTMLSelectElement).value).toBe(A)
        expect(rows(wrapper)).toEqual([
            ['1', '225/40 R18', '225/40 R18'],
            ['2', '225/40 R18', '245/35 R18'],
        ])
        expect(wrapper.text()).toContain('Übernommen, bitte prüfen')
        expect(wrapper.text()).toContain('Seite 4 im Gutachten.')
        expect(wrapper.find('#kb-edit').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('Auf mehrere EG-Nummern anwenden')
        // On a phone each row is a card that writes its label before the value (admin.css): front and rear say which they are.
        expect(wrapper.findAll('tbody tr').map((row) => row.findAll('td').map((cell) => cell.attributes('data-label')))).toEqual([
            ['Vorderachse', 'Hinterachse'],
            ['Vorderachse', 'Hinterachse'],
        ])

        await wrapper.find('#kb-entry').setValue(B)

        expect(rows(wrapper)).toEqual([['1', '235/35 R19', '235/35 R19']])
        expect(wrapper.text()).not.toContain('Übernommen, bitte prüfen')
    })

    it('takes an EG number\'s list as printed, numbered on from the last, and sends it whole with its number', async () => {
        const wrapper = mount(CombinationsCard, { props: { documentId: 7, combinations: view({ a: true, b: false }), editable: true, pageCount: 8 }, attachTo: document.body })

        await wrapper.find('#kb-entry').setValue(B)
        expect(wrapper.text()).toContain('Für diese EG-Nummer sind keine Bereifungskombinationen hinterlegt.')

        await wrapper.find('#kb-edit').trigger('click')
        await wrapper.find('#kb-page').setValue('5')
        await wrapper.find('#kb-front-0').setValue('235/35 R19')
        await wrapper.find('#kb-rear-0').setValue('235/35 R19')
        await wrapper.find('#kb-add-row').trigger('click')

        expect((wrapper.find('#kb-number-1').element as HTMLInputElement).value).toBe('2')

        await wrapper.find('#kb-front-1').setValue('235/35 R19')
        await wrapper.find('#kb-rear-1').setValue('255/30 R19')
        await wrapper.find('form').trigger('submit')

        expect(sent.at(-1)).toEqual({
            url: '/admin/gutachten/7/bereifungskombinationen',
            data: {
                entry: B,
                source_page: 5,
                combinations: [
                    { number: 1, front: '235/35 R19', rear: '235/35 R19' },
                    { number: 2, front: '235/35 R19', rear: '255/30 R19' },
                ],
            },
        })

        wrapper.unmount()
    })

    it('copies another EG number\'s list into the form to check — and sends nothing until it is saved', async () => {
        const wrapper = mount(CombinationsCard, { props: { documentId: 7, combinations: view({ a: true, b: false }), editable: true, pageCount: 8 }, attachTo: document.body })

        await wrapper.find('#kb-entry').setValue(B)
        await wrapper.find('#kb-edit').trigger('click')
        await wrapper.find('#kb-copy-from').setValue(A)
        await wrapper.findAll('.kb-copy button').at(0)!.trigger('click')

        expect(wrapper.findAll('.kb-size').map((input) => (input.element as HTMLInputElement).value)).toEqual(['225/40 R18', '225/40 R18', '225/40 R18', '245/35 R18'])
        expect(wrapper.find('.kb-copied').text()).toBe(`2 Kombinationen von ${A} übernommen – prüf sie und speichere.`)
        expect(sent).toEqual([])

        await wrapper.find('form').trigger('submit')

        expect(sent.at(-1)?.data).toMatchObject({ entry: B, combinations: [{ number: 1 }, { number: 2 }] })

        wrapper.unmount()
    })

    it('puts one combination on the EG numbers ticked, in one request', async () => {
        const wrapper = mount(CombinationsCard, { props: { documentId: 7, combinations: view(), editable: true, pageCount: 8, stamp: 's1' }, attachTo: document.body })

        const apply = wrapper.findAll('tbody button').filter((b) => b.text().startsWith('Auf mehrere EG-Nummern anwenden'))
        expect(apply).toHaveLength(2)

        await apply[1]!.trigger('click')
        await flushPromises()

        const dialog = document.body.querySelector('[role="dialog"]')!
        expect(dialog.textContent).toContain('Vorne 225/40 R18, hinten 245/35 R18')

        const boxes = [...dialog.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')]
        expect(boxes.map((b) => b.value)).toEqual([B])

        boxes[0]!.click()
        await flushPromises()
        const send = [...dialog.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes('Für eine EG-Nummer eintragen'))!
        send.click()
        await flushPromises()

        expect(posted).toEqual([{ url: '/admin/gutachten/7/bereifungskombinationen/anwenden', data: { combination: 12, targets: [B] } }])

        wrapper.unmount()
    })

    it('says where nothing can be entered yet, and what a carried-over row without a number means', () => {
        const none = mount(CombinationsCard, { props: { documentId: 7, combinations: { sourcePage: null, entries: [], unassigned: [] }, editable: true, pageCount: 8 } })

        expect(none.text()).toContain('Zu diesem Gutachten ist bei uns noch kein Fahrzeug mit EG-Typgenehmigungsnummer erfasst.')
        expect(none.find('#kb-entry').exists()).toBe(false)

        const loose = mount(CombinationsCard, {
            props: { documentId: 7, combinations: { ...view(), unassigned: [{ id: 99, number: 1, front: '225/40 R18', rear: '225/40 R18' }] }, editable: true, pageCount: 8 },
        })

        expect(loose.find('[role="status"]').text()).toContain('Eine Kombination ist ohne EG-Typgenehmigungsnummer erfasst und gilt deshalb für kein Fahrzeug.')
    })
})
