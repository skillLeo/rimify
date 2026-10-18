import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BuildProp } from '../../types/rimify'

const post = vi.fn()
const remove = vi.fn()

vi.mock('@inertiajs/vue3', () => ({ router: { post: (...args: unknown[]) => post(...args), delete: (...args: unknown[]) => remove(...args), flushAll: vi.fn() } }))

const { default: BuildForm } = await import('./BuildForm.vue')

/*
 * The operator's last prompt §1.1: derived first, asked second. What the answer waits for is asked by name —
 * „Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und wir prüfen sofort.“ — in plain words with
 * silhouettes, sent at once; a derived value stands as such, with „stimmt das?“ and one click to change it.
 */
const NONE: BuildProp = { bodyForm: null, bodySource: null, bodyWord: null, driveAxle: null, driveSource: null, driveWord: null }

let mounted: VueWrapper[] = []

function mountForm(build: BuildProp | null, missing: string[]): VueWrapper {
    const wrapper = mount(BuildForm, { props: { vehicleId: 82, build, missing }, attachTo: document.body })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    post.mockReset()
    remove.mockReset()
})

describe('BuildForm', () => {
    it('asks for exactly what the answer waits for, by name', () => {
        const both = mountForm(NONE, ['bodyForm', 'driveAxle'])

        expect(both.find('.bf__lead').text()).toBe('Für dieses Fahrzeug fehlen Karosserieform und Antriebsart. Trag sie ein und wir prüfen sofort.')
        expect(both.findAll('.bf__label').map((l) => l.text())).toEqual(['Karosserieform', 'Antriebsart'])
        expect(both.findAll('#bf-bodyForm .bf__option').map((o) => o.text())).toEqual(['Limousine', 'Kombi', 'Schrägheck', 'Coupé', 'Cabrio', 'Roadster', 'SUV', 'Van'])
        expect(both.findAll('#bf-driveAxle .bf__option').map((o) => o.text())).toEqual(['Frontantrieb', 'Heckantrieb', 'Allradantrieb'])
        // Every body style with its silhouette, hidden from a screen reader: the word is the name.
        expect(both.findAll('#bf-bodyForm [aria-hidden="true"] > svg')).toHaveLength(8)

        expect(mountForm(NONE, ['bodyForm']).find('.bf__lead').text()).toBe('Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und wir prüfen sofort.')
        expect(mountForm(NONE, ['driveAxle']).find('.bf__lead').text()).toBe('Für dieses Fahrzeug fehlt die Antriebsart. Trag sie ein und wir prüfen sofort.')
    })

    it('sends a choice at once, with nothing else to press', async () => {
        const wrapper = mountForm(NONE, ['bodyForm'])

        await wrapper.findAll('#bf-bodyForm .bf__option').find((o) => o.text() === 'Schrägheck')!.trigger('click')

        expect(post).toHaveBeenCalledWith('/fahrzeug/82/aufbau', { body_form: 'Schrägheck' }, expect.objectContaining({ preserveScroll: true, errorBag: 'aufbau' }))

        // Pressed at once and turning; the others step back and take no second tap until the answer is back.
        const chosen = wrapper.find('#bf-bodyForm [aria-busy="true"]')
        expect(chosen.text()).toBe('Schrägheck')
        expect(chosen.attributes('aria-pressed')).toBe('true')
        expect(chosen.attributes('disabled')).toBeUndefined()
        expect(wrapper.findAll('#bf-bodyForm .bf__option:disabled')).toHaveLength(7)
        await chosen.trigger('click')
        expect(post).toHaveBeenCalledTimes(1)
    })

    it('shows a derived value as such — stimmt das? — and changes it with one click', async () => {
        const wrapper = mountForm({ ...NONE, bodyForm: 'Kombi', bodySource: 'name', bodyWord: 'Touring' }, [])

        expect(wrapper.find('.bf__given').text()).toContain('Karosserieform: Kombi – erkannt an „Touring“ im Fahrzeugnamen. Stimmt das?')
        expect(wrapper.find('#bf-bodyForm').exists()).toBe(false)

        await wrapper.find('.bf__given button').trigger('click')

        expect(wrapper.find('#bf-bodyForm [aria-pressed="true"]').text()).toBe('Kombi')
        await wrapper.findAll('#bf-bodyForm .bf__option').find((o) => o.text() === 'Limousine')!.trigger('click')
        expect(post).toHaveBeenCalledWith('/fahrzeug/82/aufbau', { body_form: 'Limousine' }, expect.anything())
    })

    it('lets the owner forget their own answers for this car, and only theirs (G-12)', async () => {
        const own = mountForm({ ...NONE, bodyForm: 'Schrägheck', bodySource: 'customer', driveAxle: 'Allrad', driveSource: 'name', driveWord: 'xDrive20d' }, [])

        await own.find('.bf__forget').trigger('click')
        expect(remove).toHaveBeenCalledWith('/fahrzeug/82/aufbau', expect.objectContaining({ preserveScroll: true }))

        expect(mountForm({ ...NONE, bodyForm: 'Kombi', bodySource: 'name', bodyWord: 'Touring' }, []).find('.bf__forget').exists()).toBe(false)
    })

    it('says where the papers may name the body style otherwise (G-11)', () => {
        const hint = mountForm(NONE, ['bodyForm']).find('#bf-bodyForm-hint')

        expect(hint.text()).toContain('„Kombilimousine“')
        expect(hint.element.closest('[role="group"]')?.getAttribute('aria-describedby')).toBe('bf-bodyForm-hint')
    })

    it('says the owner’s own answer as theirs, and nothing at all for the vehicle data’s', () => {
        expect(mountForm({ ...NONE, driveAxle: 'Hinterachse', driveSource: 'customer' }, []).find('.bf__given').text()).toContain('Antriebsart: Heckantrieb – nach deiner Angabe.')
        expect(mountForm({ ...NONE, bodyForm: 'Kombi', bodySource: 'data' }, []).find('.bf').exists()).toBe(false)
        expect(mountForm(null, []).find('.bf').exists()).toBe(false)
    })
})
