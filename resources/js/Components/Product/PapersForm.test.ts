import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

// The OCR engine is the device's; here it returns what a photographed Zulassungsbescheinigung reads as.
const ocrText = vi.hoisted(() => ({ value: '' }))

vi.mock('../../composables/useOcr', () => ({
    useOcr: () => ({ read: () => Promise.resolve(ocrText.value), dispose: () => {} }),
}))

vi.mock('@inertiajs/vue3', () => ({ router: { post: vi.fn(), delete: vi.fn() } }))

import PapersForm from './PapersForm.vue'

/** Mounted with nothing kept, and opened: the form starts closed behind one button. */
async function mountOpen(powerKw: number): Promise<ReturnType<typeof mount>> {
    const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw } })

    await wrapper.find('#pp-open').trigger('click')
    await flushPromises()

    return wrapper
}

async function photograph(wrapper: ReturnType<typeof mount>, text: string): Promise<void> {
    ocrText.value = text
    const input = wrapper.find('#pp-photo')
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'zb1.jpg', { type: 'image/jpeg' })], configurable: true })
    await input.trigger('change')
    await flushPromises()
}

describe('PapersForm', () => {
    it('fills 8.1, 8.2 and T from a photo for the customer to check, and keeps nothing yet', async () => {
        const wrapper = await mountOpen(140)

        await photograph(wrapper, '8.1 1.120 8.2 1.180 T 250 P.2/P.4 140/5500')

        expect((wrapper.find('#pp-axle_front_kg').element as HTMLInputElement).value).toBe('1120')
        expect((wrapper.find('#pp-axle_rear_kg').element as HTMLInputElement).value).toBe('1180')
        expect((wrapper.find('#pp-top_speed_kmh').element as HTMLInputElement).value).toBe('250')
        expect(wrapper.text()).toContain('Prüf die Werte, bevor du sie übernimmst.')
        expect(wrapper.text()).not.toContain('Feld P.2')
    })

    it('says at once when P.2 on the photo is not the power of the chosen variant', async () => {
        const wrapper = await mountOpen(110)

        await photograph(wrapper, '8.1 1.120 8.2 1.180 T 250 P.2/P.4 140/5500')

        expect(wrapper.find('[role="alert"]').text()).toContain('Laut Foto hat dein Fahrzeug 140 kW (Feld P.2), gewählt ist eine Variante mit 110 kW.')
    })

    it('starts closed behind one button, and „Abbrechen“ closes it again with the keyboard back on that button', async () => {
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw: 140 }, attachTo: document.body })

        expect(wrapper.find('.pp__form').exists()).toBe(false)

        await wrapper.find('#pp-open').trigger('click')
        await flushPromises()
        expect(document.activeElement?.id).toBe('pp-axle_front_kg')

        await wrapper.findAll('button').find((b) => b.text() === 'Abbrechen')?.trigger('click')
        await flushPromises()
        expect(wrapper.find('.pp__form').exists()).toBe(false)
        expect(document.activeElement?.id).toBe('pp-open')
        wrapper.unmount()
    })

    it('opens „Ändern“ on the kept figures with the keyboard in the first field, and „Abbrechen“ keeps nothing typed', async () => {
        const papers = { axleFrontKg: 1100, axleRearKg: 1180, topSpeedKmh: 250, notes: [] }
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers, powerKw: 140 }, attachTo: document.body })

        await wrapper.find('#pp-change').trigger('click')
        await flushPromises()

        expect(document.activeElement?.id).toBe('pp-axle_front_kg')
        expect((wrapper.find('#pp-axle_front_kg').element as HTMLInputElement).value).toBe('1100')

        await wrapper.find('#pp-axle_front_kg').setValue(900)
        await wrapper.findAll('button').find((b) => b.text() === 'Abbrechen')?.trigger('click')
        await flushPromises()

        expect(wrapper.find('.pp__summary').text()).toContain('8.1 1.100 kg')
        expect(document.activeElement?.id).toBe('pp-change')

        await wrapper.find('#pp-change').trigger('click')
        await flushPromises()
        expect((wrapper.find('#pp-axle_front_kg').element as HTMLInputElement).value).toBe('1100')
        wrapper.unmount()
    })

    it('leaves the fields as they were and says so when nothing could be read', async () => {
        const wrapper = await mountOpen(110)
        await wrapper.find('#pp-top_speed_kmh').setValue(210)

        await photograph(wrapper, 'Zulassungsbescheinigung Teil I')

        expect(wrapper.find('[role="alert"]').text()).toBe('Wir konnten 8.1, 8.2 und T nicht lesen. Trag sie bitte von Hand ein.')
        expect((wrapper.find('#pp-top_speed_kmh').element as HTMLInputElement).value).toBe('210')
    })
})
