import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { DocumentFacts } from '../../../types/admin/gutachten'

const post = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    useForm: () => ({ post, processing: false, errors: {} }),
}))

vi.mock('../../../Components/Ui/Dialog.vue', () => ({
    default: defineComponent({ setup: (_, { slots }) => () => h('div', [slots.default?.(), slots.actions?.()]) }),
}))

const { default: ReleaseDialog } = await import('./ReleaseDialog.vue')

const paper = (completeness: DocumentFacts['completeness']): DocumentFacts => ({ id: 4, label: 'ABE 55255', completeness }) as DocumentFacts

/*
 * D-485, the client's round of 18.11.2026, item 2: „Gutachten freigeben“ shows what goes live and one button. Neither
 * question is asked; what the switch on the paper's page means for a car it does not name is said, never asked.
 */
describe('ReleaseDialog', () => {
    it('asks nothing: no question, no field, one „Freigeben“', () => {
        const wrapper = mount(ReleaseDialog, { props: { open: true, document: paper(null), rows: 3, note: 'Alle 3 Zeilen gelten danach sofort im Shop.' } })

        expect(wrapper.findAll('input, select, textarea, fieldset')).toHaveLength(0)
        expect(wrapper.text()).toContain('Alle 3 Zeilen gelten danach sofort im Shop.')
        expect(wrapper.find('#rd-go').text()).toBe('Freigeben')
        expect(wrapper.text()).not.toContain('Abnahme')
    })

    it('says what an unnamed car gets, by the switch: „noch nicht bestätigt“ off, „nicht freigegeben“ on, nothing for a base without rows', () => {
        expect(mount(ReleaseDialog, { props: { open: true, document: paper(null), rows: 1 } }).find('.rd-unnamed').text()).toContain('„noch nicht bestätigt“')
        expect(mount(ReleaseDialog, { props: { open: true, document: paper('partial'), rows: 1 } }).find('.rd-unnamed').text()).toContain('„noch nicht bestätigt“')
        expect(mount(ReleaseDialog, { props: { open: true, document: paper('complete'), rows: 1 } }).find('.rd-unnamed').text()).toContain('„nicht freigegeben“')
        expect(mount(ReleaseDialog, { props: { open: true, document: paper(null), rows: 0 } }).find('.rd-unnamed').exists()).toBe(false)
    })

    it('posts nothing but the release', async () => {
        const wrapper = mount(ReleaseDialog, { props: { open: true, document: paper(null), rows: 1 } })

        await wrapper.find('form').trigger('submit')

        expect(post).toHaveBeenCalledWith('/admin/gutachten/4/freigeben', expect.objectContaining({ preserveScroll: true }))
    })
})
