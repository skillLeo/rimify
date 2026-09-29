import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { errors: {} }, url: '/admin/gutachten/13' }),
    router: { post: vi.fn(), put: vi.fn(), delete: vi.fn(), on: vi.fn(() => () => undefined) },
}))

const { default: Auflagenverzeichnis } = await import('./Auflagenverzeichnis.vue')

/*
 * D-05 (docs/qa/BUGS.md, Block D): the 18″ Nachtrag prints words in its Auflagen column — „Schrägheck 2-türig“,
 * „Nicht 330D“ — and they are its codes. The field takes what the server takes (32 characters), never cuts one
 * at eight.
 */
describe('Auflagenverzeichnis', () => {
    it('takes a code of several words as long as the server does', async () => {
        const wrapper = mount(Auflagenverzeichnis, {
            props: {
                documentId: 13,
                conditions: [],
                choices: { kinds: [{ value: 'karosserieform', label: 'Nur für bestimmte Karosserieformen', section: 'Fahrzeug' }], bodyForms: ['Schrägheck'], drives: ['Allrad'] },
                unresolved: [],
                editable: true,
                pageCount: 24,
            },
            attachTo: document.body,
        })

        await wrapper.findAll('button').find((b) => b.text().includes('Code hinzufügen'))?.trigger('click')
        const field = wrapper.find('#av-code')

        expect(field.attributes('maxlength')).toBe('32')
        await field.setValue('Schrägheck 2-türig')
        expect((field.element as HTMLInputElement).value).toBe('Schrägheck 2-türig')

        wrapper.unmount()
    })
})
