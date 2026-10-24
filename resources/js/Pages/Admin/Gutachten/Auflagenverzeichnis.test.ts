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
                choices: { kinds: [{ value: 'karosserieform', label: 'Nur für bestimmte Karosserieformen', section: 'Fahrzeug', help: 'Gilt nur für die angekreuzten Karosserieformen.' }], bodyForms: ['Schrägheck'], drives: ['Allrad'] },
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
    it('says beside the choice what each kind does — „Verbot“ excludes no car (the admin audit’s F-07)', async () => {
        const verbot = 'Etwas ist mit dieser Felge verboten, etwa Schneeketten. Der Shop nennt es unter „Hinweise“; es schließt kein Fahrzeug aus.'
        const wrapper = mount(Auflagenverzeichnis, {
            props: {
                documentId: 13,
                conditions: [],
                choices: {
                    kinds: [
                        { value: 'verbot', label: 'Verbot', section: 'Hinweise', help: verbot },
                        { value: 'karosserieform', label: 'Nur für bestimmte Karosserieformen', section: 'Fahrzeug', help: 'Gilt nur für die angekreuzten Karosserieformen.' },
                    ],
                    bodyForms: ['Kombi'],
                    drives: ['Allrad'],
                },
                unresolved: [],
                editable: true,
                pageCount: 24,
            },
            attachTo: document.body,
        })

        await wrapper.findAll('button').find((b) => b.text().includes('Code hinzufügen'))?.trigger('click')
        expect(wrapper.find('#av-kind-help').text()).toBe('Die Art entscheidet, wo und wie auffällig der Satz im Shop steht.')

        await wrapper.find('#av-kind').setValue('verbot')
        expect(wrapper.find('#av-kind-help').text()).toContain('es schließt kein Fahrzeug aus')

        await wrapper.find('#av-kind').setValue('karosserieform')
        expect(wrapper.find('#av-kind-help').text()).toContain('Gilt nur für die angekreuzten Karosserieformen.')

        wrapper.unmount()
    })

    it('says why a code a row uses offers no „Entfernen“ (a rule of the admin audit)', () => {
        const code = (id: number, uses: number) => ({ id, code: `A0${id}`, kind: 'abnahme', kindLabel: 'Abnahme', section: 'Abnahme', text: 'Abnahme erforderlich.', page: 3, bodyForms: [], drive: null, maxAxleLoadKg: null, axle: null, uses })
        const props = (uses: number, editable = true) => ({ documentId: 13, conditions: [code(1, 0), code(2, uses)], choices: { kinds: [], bodyForms: [], drives: [] }, unresolved: [], editable, pageCount: 24 })

        expect(mount(Auflagenverzeichnis, { props: props(4) }).find('.av__in-use').text()).toBe(
            'Einen Code, den eine Zeile noch verwendet, kannst du nicht entfernen. Nimm ihn zuerst aus jeder Zeile heraus, die ihn verwendet („Zeile ändern“) – wie viele es sind, steht unter „Verwendet“.'
        )
        expect(mount(Auflagenverzeichnis, { props: props(0) }).find('.av__in-use').exists()).toBe(false)
        // A released document changes nothing: no sentence about a way that is not open.
        expect(mount(Auflagenverzeichnis, { props: props(4, false) }).find('.av__in-use').exists()).toBe(false)
    })
})
