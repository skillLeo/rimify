import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

// The OCR engine is the device's; here it returns what a photographed Zulassungsbescheinigung reads as.
const ocrText = vi.hoisted(() => ({ value: '' }))

vi.mock('../../composables/useOcr', () => ({
    useOcr: () => ({ read: () => Promise.resolve(ocrText.value), dispose: () => {} }),
}))

vi.mock('@inertiajs/vue3', () => ({ router: { post: vi.fn(), delete: vi.fn() } }))

import PapersForm from './PapersForm.vue'

async function photograph(wrapper: ReturnType<typeof mount>, text: string): Promise<void> {
    ocrText.value = text
    const input = wrapper.find('#pp-photo')
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'zb1.jpg', { type: 'image/jpeg' })], configurable: true })
    await input.trigger('change')
    await flushPromises()
}

describe('PapersForm', () => {
    it('fills 8.1, 8.2 and T from a photo for the customer to check, and keeps nothing yet', async () => {
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw: 140 } })

        await photograph(wrapper, '8.1 1.120 8.2 1.180 T 250 P.2/P.4 140/5500')

        expect((wrapper.find('#pp-axle_front_kg').element as HTMLInputElement).value).toBe('1120')
        expect((wrapper.find('#pp-axle_rear_kg').element as HTMLInputElement).value).toBe('1180')
        expect((wrapper.find('#pp-top_speed_kmh').element as HTMLInputElement).value).toBe('250')
        expect(wrapper.text()).toContain('Prüf die Werte, bevor du sie übernimmst.')
        expect(wrapper.text()).not.toContain('Feld P.2')
    })

    it('says at once when P.2 on the photo is not the power of the chosen variant', async () => {
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw: 110 } })

        await photograph(wrapper, '8.1 1.120 8.2 1.180 T 250 P.2/P.4 140/5500')

        expect(wrapper.find('[role="alert"]').text()).toContain('Laut Foto hat dein Fahrzeug 140 kW (Feld P.2), gewählt ist eine Variante mit 110 kW.')
    })

    it('leaves the fields as they were and says so when nothing could be read', async () => {
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw: 110 } })
        await wrapper.find('#pp-top_speed_kmh').setValue(210)

        await photograph(wrapper, 'Zulassungsbescheinigung Teil I')

        expect(wrapper.find('[role="alert"]').text()).toBe('Wir konnten 8.1, 8.2 und T nicht lesen. Trag sie bitte von Hand ein.')
        expect((wrapper.find('#pp-top_speed_kmh').element as HTMLInputElement).value).toBe('210')
    })
})
