import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RowFields from './RowFields.vue'
import { emptyRow } from './rows'
import type { DocumentConditionView } from '../../../types/admin/gutachten'

const A01: DocumentConditionView = {
    id: 1,
    code: 'A01',
    kind: 'abnahme',
    kindLabel: 'Abnahme',
    section: 'Abnahme',
    text: 'Der vorschriftsmäßige Zustand des Fahrzeuges ist … bescheinigen zu lassen.',
    page: 10,
    bodyForms: [],
    drive: null,
    maxAxleLoadKg: null,
    axle: null,
    uses: 0,
}

/*
 * D-06 (docs/qa/BUGS.md, Block D): „Zusatz“ goes away with the field it opens, so the keyboard must land in that
 * field — never on <body>.
 */
describe('RowFields', () => {
    it('moves the keyboard into the Zusatz field it opens', async () => {
        const wrapper = mount(RowFields, {
            props: { conditions: [A01], errors: {}, idPrefix: 'rf', pageCount: 24, form: { ...emptyRow(), codes: 'A01' } },
            attachTo: document.body,
        })

        await wrapper.find('button[aria-label="Zusatz zu A01"]').trigger('click')
        await flushPromises()

        expect(document.activeElement?.id).toBe('rf-note-A01')

        wrapper.unmount()
    })
})
