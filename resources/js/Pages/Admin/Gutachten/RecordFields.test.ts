import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import type { RecordShape } from '../../../types/admin/gutachten'
import RecordFields from './RecordFields.vue'

/*
 * How the document gives its tyres' load index and speed symbol (the operator's brief of 17.10.2026, D-277): asked with
 * the document's facts, outside the folded header — the release asks for it — with the three answers the brief names.
 */

function blank(): RecordShape {
    return {
        supplement_to_id: null,
        supplement_to_number: '',
        annex: '',
        test_report_number: '',
        copy_number: '',
        designation_number: '',
        test_site: '',
        test_date: '',
        revision_date: '',
        valid_from_production: '',
        papers_correction: '',
        missing_annexes: '',
        tyre_index_source: '',
    }
}

describe('RecordFields — the tyres\' index', () => {
    it('asks it outside the folded header, with the three answers, and keeps the one chosen', async () => {
        const shape = reactive(blank())
        const wrapper = mount(RecordFields, { props: { kind: 'ABE', errors: {}, supplementable: [], idPrefix: 'gn', shape } })
        const group = wrapper.find('fieldset.rsf-group')

        expect(group.find('legend').text()).toBe('Wie gibt das Gutachten Lastindex und Geschwindigkeitssymbol der Reifen an?')
        expect(wrapper.find('details.rsf-more fieldset.rsf-group').exists()).toBe(false)

        const radios = group.findAll('input[type="radio"]')

        expect(radios.map((radio) => (radio.element as HTMLInputElement).value)).toEqual(['document', 'papers', 'table'])
        expect(radios.every((radio) => !(radio.element as HTMLInputElement).checked)).toBe(true)

        await radios[2]!.setValue(true)

        expect(shape.tyre_index_source).toBe('table')
    })

    it('shows an answer already given, and the server’s refusal beside the question, tied to every answer', () => {
        const wrapper = mount(RecordFields, {
            props: { kind: 'NACHTRAG', errors: { tyre_index_source: 'Bitte wähl, wie das Gutachten Lastindex und Geschwindigkeitssymbol der Reifen angibt.' }, supplementable: [], idPrefix: 'fd', shape: reactive({ ...blank(), tyre_index_source: 'papers' }) },
        })

        expect((wrapper.find('fieldset.rsf-group input[value="papers"]').element as HTMLInputElement).checked).toBe(true)
        expect(wrapper.find('#fd-index-err').text()).toBe('Bitte wähl, wie das Gutachten Lastindex und Geschwindigkeitssymbol der Reifen angibt.')

        for (const radio of wrapper.findAll('fieldset.rsf-group input[type="radio"]')) {
            expect(radio.attributes('aria-describedby')).toBe('fd-index-help fd-index-err')
        }
    })
})
