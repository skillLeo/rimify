import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

// The OCR engine is the device's; here it returns what a photographed Zulassungsbescheinigung reads as.
const ocrText = vi.hoisted(() => ({ value: '' }))

vi.mock('../../composables/useOcr', () => ({
    useOcr: () => ({ read: () => Promise.resolve(ocrText.value), dispose: () => {} }),
}))

vi.mock('@inertiajs/vue3', () => ({ router: { post: vi.fn(), delete: vi.fn(), flushAll: vi.fn() } }))

import { router } from '@inertiajs/vue3'
import PapersForm from './PapersForm.vue'

type Visit = { onSuccess?: () => void; onHttpException?: (r: { status: number }) => boolean; onNetworkError?: () => boolean; onFinish?: () => void }

/** The options of the last visit the form sent, `post` or `delete`. */
function lastVisit(method: 'post' | 'delete'): Visit {
    const calls = vi.mocked(router[method]).mock.calls

    return (calls.at(-1)?.[method === 'post' ? 2 : 1] ?? {}) as Visit
}

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
    // D-286: where the answer waits for these fields the form is the way on, not an option — open, and short: the three
    // figures first; where they stand and 15.1/15.2 one press away. Which fields, the page above it says.
    it('opens by itself where the answer waits for its fields, the three figures first — never „Freiwillig“', () => {
        const all = mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw: 140, asked: ['8.1', '8.2', 'T'] } })

        expect(all.find('.pp__form').exists()).toBe(true)
        expect(all.find('[data-asked]').text()).toBe('Wir speichern die Werte zu diesem Fahrzeug als Cookie in deinem Browser.')
        expect(all.text()).not.toContain('Freiwillig: Mit')
        // Asked all the same, whatever is missing: they stand side by side in the papers, and are kept together.
        expect(all.findAll('.pp__grid input').map((i) => i.attributes('id'))).toEqual(['pp-axle_front_kg', 'pp-axle_rear_kg', 'pp-top_speed_kmh'])
        // The figures come before the photo, the drawing and 15.1/15.2; the last two are folded.
        const order = [...all.find('.pp__form').element.children].map((c) => c.className.split(' ')[0])
        expect(order.indexOf('pp__grid')).toBeLessThan(order.indexOf('pp__scan'))
        expect(all.findAll('details.pp__fold').map((d) => (d.element as HTMLDetailsElement).open)).toEqual([false, false])

        // Nothing waited for: closed behind its button, optional as before.
        expect(mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw: 140, asked: [] } }).find('.pp__form').exists()).toBe(false)
    })

    // The listing says what is missing above the form, once for every wheel (D-286): there the form starts closed.
    it('starts closed where it stands above every wheel, and says only where the figures are kept', async () => {
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw: 140, asked: ['8.1', '8.2', 'T'], startClosed: true } })

        expect(wrapper.find('.pp__form').exists()).toBe(false)
        await wrapper.find('#pp-open').trigger('click')

        expect(wrapper.find('.pp__head').text()).toContain('Wir speichern die Werte zu diesem Fahrzeug als Cookie in deinem Browser.')
        expect(wrapper.text()).not.toContain('Freiwillig: Mit')
    })

    // The interaction review of D-286: a visit that never reaches an answer is said at the form, the typed figures kept.
    it('says offline, an expired page or a fault at the form and keeps what was typed — never the error page', async () => {
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw: 140, asked: ['8.1', '8.2', 'T'] }, attachTo: document.body })

        await wrapper.find('#pp-axle_front_kg').setValue('1130')
        await wrapper.find('form').trigger('submit')

        // As Inertia does: the failure, then the visit's end.
        expect(lastVisit('post').onNetworkError?.()).toBe(false)
        lastVisit('post').onFinish?.()
        await flushPromises()
        expect(wrapper.find('.pp__failure').text()).toBe('Keine Verbindung zum Server. Deine Änderung ist nicht gespeichert – prüf die Verbindung und versuch es noch einmal.')
        expect((wrapper.find('#pp-axle_front_kg').element as HTMLInputElement).value).toBe('1130')
        // Busy, never disabled: the keyboard stays on the button it pressed (#16).
        expect(document.activeElement?.id).toBe('pp-save')

        const sent = vi.mocked(router.post).mock.calls.length
        await wrapper.find('form').trigger('submit')
        expect(vi.mocked(router.post).mock.calls.length).toBe(sent + 1)
        expect(lastVisit('post').onHttpException?.({ status: 419 })).toBe(false)
        lastVisit('post').onFinish?.()
        await flushPromises()
        expect(wrapper.find('.pp__failure').text()).toContain('Die Seite war zu lange offen')

        wrapper.unmount()
    })

    // Saved or deleted, every answer about the car changed: pages fetched ahead on a hover must not show the old one.
    it('throws away the pages fetched ahead when the figures are kept or deleted', async () => {
        vi.mocked(router.flushAll).mockClear()
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw: 140, asked: ['8.1', '8.2', 'T'] } })

        await wrapper.find('form').trigger('submit')
        lastVisit('post').onSuccess?.()
        expect(router.flushAll).toHaveBeenCalledTimes(1)

        const kept = mount(PapersForm, { props: { vehicleId: 7, papers: { axleFrontKg: 1130, axleRearKg: 1240, topSpeedKmh: 198, notes: [] }, powerKw: 140 } })
        await kept.find('#pp-change').trigger('click')
        await kept.findAll('.pp__actions button').find((b) => b.text() === 'Werte löschen')!.trigger('click')
        lastVisit('delete').onSuccess?.()
        expect(router.flushAll).toHaveBeenCalledTimes(2)
    })

    // The interaction review of D-286: where the answer comes to wait for the figures again, the form is the way on again.
    it('opens again where the answer comes to wait for its fields — another size, the figures deleted', async () => {
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw: 140, asked: [] } })

        expect(wrapper.find('.pp__form').exists()).toBe(false)
        await wrapper.setProps({ asked: ['T'] })

        expect(wrapper.find('.pp__form').exists()).toBe(true)
    })

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

        expect(wrapper.find('[role="alert"]').text()).toContain('Laut Foto hat dein Fahrzeug 140 kW (Feld P.2), gewählt ist eine Variante mit 110 kW.')
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

        expect(wrapper.find('.pp__summary').text()).toContain('8.1 1.100 kg')
        expect(document.activeElement?.id).toBe('pp-change')

        await wrapper.find('#pp-change').trigger('click')
        await flushPromises()
        expect((wrapper.find('#pp-axle_front_kg').element as HTMLInputElement).value).toBe('1100')
        wrapper.unmount()
    })

    it('sends 15.1 and 15.2 only where one was typed, and shows them with the kept figures (D-242)', async () => {
        const post = vi.mocked(router.post)
        post.mockClear()
        const wrapper = await mountOpen(140)

        await wrapper.find('#pp-axle_front_kg').setValue(1100)
        await wrapper.find('#pp-axle_rear_kg').setValue(1100)
        await wrapper.find('#pp-top_speed_kmh').setValue(250)
        await wrapper.find('form').trigger('submit')

        expect(post.mock.calls[0]?.[1]).toEqual({ axle_front_kg: 1100, axle_rear_kg: 1100, top_speed_kmh: 250 })
        // The first send ends before the next (one send at a time).
        lastVisit('post').onFinish?.()

        // One typed, both sent: the server says the other is missing, in words.
        await wrapper.find('#pp-index_front').setValue('225/40 R19 91W')
        await wrapper.find('form').trigger('submit')

        expect(post.mock.calls[1]?.[1]).toEqual({ axle_front_kg: 1100, axle_rear_kg: 1100, top_speed_kmh: 250, index_front: '225/40 R19 91W', index_rear: '' })

        const papers = { axleFrontKg: 1100, axleRearKg: 1180, topSpeedKmh: 250, notes: [], index: { front: '91W', rear: '(95Y)' } }
        const kept = mount(PapersForm, { props: { vehicleId: 7, papers, powerKw: 140 } })

        expect(kept.find('.pp__summary').text()).toContain('15.1 91W · 15.2 (95Y)')

        await kept.find('#pp-change').trigger('click')
        await flushPromises()
        expect((kept.find('#pp-index_rear').element as HTMLInputElement).value).toBe('(95Y)')
    })

    it('leaves the fields as they were and says so when nothing could be read', async () => {
        const wrapper = await mountOpen(110)
        await wrapper.find('#pp-top_speed_kmh').setValue(210)

        await photograph(wrapper, 'Zulassungsbescheinigung Teil I')

        expect(wrapper.find('[role="alert"]').text()).toBe('Wir konnten 8.1, 8.2 und T nicht lesen. Trag sie bitte von Hand ein.')
        expect((wrapper.find('#pp-top_speed_kmh').element as HTMLInputElement).value).toBe('210')
    })
})
