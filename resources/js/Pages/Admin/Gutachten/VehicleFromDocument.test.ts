import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VehicleFromDocument from './VehicleFromDocument.vue'

const NOT_EU = 'Diese Nummer hat nicht die Form einer EG-Typgenehmigungsnummer (etwa e1*2007/46*0316*..).'

function answer(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

async function filled(): Promise<ReturnType<typeof mount>> {
    const wrapper = mount(VehicleFromDocument, { props: { documentId: 7, pageCount: 13, bodyForms: ['Limousine'], drives: ['Frontantrieb'] }, attachTo: document.body })
    await wrapper.get('#vfd-open').trigger('click')
    await wrapper.get('#vfd-make').setValue('Alfa Romeo')
    await wrapper.get('#vfd-model').setValue('145/146')
    await wrapper.get('#vfd-type-designation').setValue('930')
    await wrapper.get('#vfd-eg-number').setValue('G731*')
    await wrapper.get('#vfd-source-page').setValue('4')

    return wrapper
}

/*
 * D-521: field K from a Gutachten in any form. One not in the EU form is asked about by the server; the form then offers the
 * search above (by name) or storing the car as the document names it — and nothing is sent until the person chose.
 */
describe('VehicleFromDocument', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        document.body.replaceChildren()
    })

    it('asks about a number not in the EU form, sends the choice only when ticked, and offers the search above', async () => {
        const sent: Record<string, unknown>[] = []
        const fetch = vi.fn(async (_url: string, init: RequestInit) => {
            sent.push(JSON.parse(String(init.body)) as Record<string, unknown>)

            return sent.length === 1
                ? answer(422, { errors: { ohne_eu_format: [NOT_EU] } })
                : answer(201, { id: 9, label: 'Alfa Romeo 145/146 930', window: null, needsReview: true })
        })
        vi.stubGlobal('fetch', fetch)

        const wrapper = await filled()
        await wrapper.get('form').trigger('submit')
        await flushPromises()

        expect(sent[0]?.ohne_eu_format).toBe(false)
        expect(wrapper.get('#vfd-not-eu').text()).toContain(NOT_EU)
        // Until the person chose, the form does not send the same thing again.
        expect(wrapper.get('#vfd-save').attributes('disabled')).toBeDefined()

        await wrapper.get('#vfd-not-eu button').trigger('click')
        expect(wrapper.emitted('search')).toEqual([['Alfa Romeo 145/146']])

        await wrapper.get('#vfd-ohne-eu-format').setValue(true)
        expect(wrapper.get('#vfd-save').attributes('disabled')).toBeUndefined()
        await wrapper.get('form').trigger('submit')
        await flushPromises()

        expect(fetch).toHaveBeenCalledTimes(2)
        expect(sent[1]).toMatchObject({ eg_number: 'G731*', ohne_eu_format: true })
        expect(wrapper.emitted('created')?.[0]?.[0]).toMatchObject({ id: 9 })
    })

    it('forgets the choice when the number changes', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => answer(422, { errors: { ohne_eu_format: [NOT_EU] } })))

        const wrapper = await filled()
        await wrapper.get('form').trigger('submit')
        await flushPromises()
        await wrapper.get('#vfd-ohne-eu-format').setValue(true)

        await wrapper.get('#vfd-eg-number').setValue('e3*96/27*0029*')

        expect(wrapper.find('#vfd-not-eu').exists()).toBe(false)
        expect(wrapper.get('#vfd-save').attributes('disabled')).toBeUndefined()
    })
})
