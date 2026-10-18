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
        // All three missing, all three asked.
        expect(all.findAll('.pp__grid input').map((i) => i.attributes('id'))).toEqual(['pp-axle_front_kg', 'pp-axle_rear_kg', 'pp-top_speed_kmh'])
        // Text fields that take digits (D-290): a mouse wheel over them never changes a figure.
        expect(all.findAll('.pp__grid input').every((i) => i.attributes('type') === 'text' && i.attributes('inputmode') === 'numeric')).toBe(true)
        expect(all.findAll('.pp__grid input').every((i) => i.attributes('aria-required') === 'true')).toBe(true)
        // The figures come before the photo, the drawing and 15.1/15.2; the last two are folded.
        const order = [...all.find('.pp__form').element.children].map((c) => c.className.split(' ')[0])
        expect(order.indexOf('pp__grid')).toBeLessThan(order.indexOf('pp__scan'))
        expect(all.findAll('details.pp__fold').map((d) => (d.element as HTMLDetailsElement).open)).toEqual([false, false])

        // Nothing waited for: closed behind its button, optional as before.
        expect(mount(PapersForm, { props: { vehicleId: 7, papers: null, powerKw: 140, asked: [] } }).find('.pp__form').exists()).toBe(false)
    })

    // D-291: ask for what is missing, never for all three — the known ones stand beside it, with where they came from.
    it('asks for T alone where only T is missing, and shows 8.1 and 8.2 with where they came from', async () => {
        const post = vi.mocked(router.post)
        post.mockClear()
        const known = { axleFrontKg: 1160, axleRearKg: 1210, topSpeedKmh: null }
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, known, powerKw: 140, asked: ['T'] } })

        expect(wrapper.findAll('.pp__grid input').map((i) => i.attributes('id'))).toEqual(['pp-top_speed_kmh'])
        const shown = wrapper.findAll('.pp__known').map((row) => [row.find('.form-field__label').text(), row.find('.pp__value').text(), row.find('.pp__source').text()])
        expect(shown).toEqual([
            ['8.1 · zulässige Achslast vorn', '1.160 kg', 'aus unseren Fahrzeugdaten'],
            ['8.2 · zulässige Achslast hinten', '1.210 kg', 'aus unseren Fahrzeugdaten'],
        ])

        // Only what it asks is sent: a figure we know is never sent as the customer's.
        await wrapper.find('#pp-top_speed_kmh').setValue('250')
        await wrapper.find('form').trigger('submit')
        expect(post.mock.calls[0]?.[1]).toEqual({ asked: ['T'], top_speed_kmh: '250', index_front: '', index_rear: '' })
        lastVisit('post').onFinish?.()
    })

    it('opens by itself where more is asked of a car the customer gave figures for, and shows those as theirs', () => {
        const papers = { axleFrontKg: 1100, axleRearKg: 1180, topSpeedKmh: null, notes: [] }
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers, known: { axleFrontKg: null, axleRearKg: null, topSpeedKmh: null }, powerKw: 140, asked: ['T'] } })

        expect(wrapper.find('.pp__form').exists()).toBe(true)
        expect(wrapper.findAll('.pp__grid input').map((i) => i.attributes('id'))).toEqual(['pp-top_speed_kmh'])
        expect(wrapper.findAll('.pp__known .pp__source').map((s) => s.text())).toEqual(['von dir eingetragen', 'von dir eingetragen'])
    })

    it('says only what the customer gave, and where our data holds all three asks nothing but 15.1 and 15.2', async () => {
        const given = mount(PapersForm, { props: { vehicleId: 7, papers: { axleFrontKg: null, axleRearKg: null, topSpeedKmh: 250, notes: [] }, powerKw: 140 } })
        expect(given.find('.pp__summary').text()).toContain('Nach deinen Angaben: T 250 km/h')
        expect(given.find('.pp__summary').text()).not.toContain('8.1')

        const known = { axleFrontKg: 1160, axleRearKg: 1210, topSpeedKmh: 250 }
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, known, powerKw: 140 } })
        await wrapper.find('#pp-open').trigger('click')

        expect(wrapper.findAll('.pp__grid input')).toHaveLength(0)
        expect(wrapper.findAll('.pp__known')).toHaveLength(3)
        expect(wrapper.find('.pp__head').text()).toContain('Die Achslasten und die Höchstgeschwindigkeit stehen schon in unseren Fahrzeugdaten.')
        expect((wrapper.find('details.pp__fold:last-of-type').element as HTMLDetailsElement).open).toBe(true)
        // Nothing for a photo to fill.
        expect(wrapper.find('#pp-photo').exists()).toBe(false)
    })

    it('names the one field it asks when the photo could not be read', async () => {
        const known = { axleFrontKg: 1160, axleRearKg: 1210, topSpeedKmh: null }
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, known, powerKw: 140, asked: ['T'] } })

        await photograph(wrapper, 'Zulassungsbescheinigung Teil I')

        expect(wrapper.find('[role="alert"]').text()).toBe('Wir konnten T nicht lesen. Trag den Wert bitte von Hand ein.')
    })

    it('fills from a photo only the fields it asks, never a figure we know', async () => {
        const known = { axleFrontKg: 1160, axleRearKg: 1210, topSpeedKmh: null }
        const wrapper = mount(PapersForm, { props: { vehicleId: 7, papers: null, known, powerKw: 140, asked: ['T'] } })

        await photograph(wrapper, '8.1 1.120 8.2 1.180 T 250 P.2/P.4 140/5500')

        expect((wrapper.find('#pp-top_speed_kmh').element as HTMLInputElement).value).toBe('250')
        expect(wrapper.findAll('.pp__known .pp__value').map((v) => v.text())).toEqual(['1.160 kg', '1.210 kg'])
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

    it('sends every field it shows, 15.1 and 15.2 with them, and shows them with the kept figures (D-242, D-291)', async () => {
        const post = vi.mocked(router.post)
        post.mockClear()
        const wrapper = await mountOpen(140)

        await wrapper.find('#pp-axle_front_kg').setValue('1.100')
        await wrapper.find('#pp-axle_rear_kg').setValue('1100')
        await wrapper.find('#pp-top_speed_kmh').setValue('250')
        await wrapper.find('form').trigger('submit')

        // As typed: the server reads „1.100“ as the thousands it is. Emptied 15.1 and 15.2 go with them — then they go.
        expect(post.mock.calls[0]?.[1]).toEqual({ asked: [], axle_front_kg: '1.100', axle_rear_kg: '1100', top_speed_kmh: '250', index_front: '', index_rear: '' })
        // The first send ends before the next (one send at a time).
        lastVisit('post').onFinish?.()

        // One typed, both sent: the server says the other is missing, in words.
        await wrapper.find('#pp-index_front').setValue('225/40 R19 91W')
        await wrapper.find('form').trigger('submit')

        expect(post.mock.calls[1]?.[1]).toEqual({ asked: [], axle_front_kg: '1.100', axle_rear_kg: '1100', top_speed_kmh: '250', index_front: '225/40 R19 91W', index_rear: '' })

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
