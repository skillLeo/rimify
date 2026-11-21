import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import type { RecordShape } from '../../../types/admin/gutachten'
import RecordFields from './RecordFields.vue'

/*
 * How the document gives its tyres' load index and speed symbol was asked here (D-277). Since D-481 the tyres rest on what
 * the document prints beside each size, so the answer decides nothing and the question is gone (D-483).
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
    it('no longer asks how the document gives load index and speed symbol (D-483)', () => {
        const wrapper = mount(RecordFields, { props: { kind: 'ABE', errors: {}, supplementable: [], idPrefix: 'gn', shape: reactive(blank()) } })

        expect(wrapper.text()).not.toContain('Lastindex')
        expect(wrapper.find('input[name="gn-index"]').exists()).toBe(false)
        // The rest of the facts are still asked.
        expect(wrapper.find('details.rsf-more').exists()).toBe(true)
    })
})
