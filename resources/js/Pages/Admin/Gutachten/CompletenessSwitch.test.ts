import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    router: { post: (...args: unknown[]) => post(...args) },
}))

const { default: CompletenessSwitch } = await import('./CompletenessSwitch.vue')

/*
 * D-485: „Alle Fahrzeuge dieses Gutachtens sind erfasst“ — optional, off until someone turns it on, never part of the
 * release. It says what it means for a car the paper does not name, and only who may release can change it.
 */
describe('CompletenessSwitch', () => {
    beforeEach(() => post.mockReset())

    it('is off for a paper nobody switched, and says the safe answer', () => {
        const wrapper = mount(CompletenessSwitch, { props: { documentId: 7, completeness: null, can: true, idPrefix: 'gs' } })
        const input = wrapper.find('#gs-complete')

        expect(input.attributes('role')).toBe('switch')
        expect((input.element as HTMLInputElement).checked).toBe(false)
        expect(wrapper.find('label').text()).toBe('Alle Fahrzeuge dieses Gutachtens sind erfasst')
        expect(wrapper.find('#gs-complete-effect').text()).toBe('Ein Fahrzeug, das hier nicht steht, ist im Shop „noch nicht bestätigt“.')
    })

    it('is on only for „complete“ — never for a partial or unknown answer — and names who set it', () => {
        const on = mount(CompletenessSwitch, { props: { documentId: 7, completeness: 'complete', by: 'Erika Muster', at: '18.11.2026, 10:00', can: true } })

        expect((on.find('input').element as HTMLInputElement).checked).toBe(true)
        expect(on.find('.cs__effect').text()).toBe('Ein Fahrzeug, das hier nicht steht, ist im Shop „nicht freigegeben“. · Erika Muster, 18.11.2026, 10:00')

        for (const completeness of ['partial', 'unknown']) {
            expect((mount(CompletenessSwitch, { props: { documentId: 7, completeness, can: true } }).find('input').element as HTMLInputElement).checked).toBe(false)
        }
    })

    it('sends on or off to the paper, and goes back with the server’s sentence where it refuses', async () => {
        const wrapper = mount(CompletenessSwitch, { props: { documentId: 7, completeness: null, can: true } })
        const input = wrapper.find('input')

        await input.setValue(true)

        expect(post).toHaveBeenCalledWith('/admin/gutachten/7/vollstaendigkeit', { complete: true }, expect.objectContaining({ preserveScroll: true }))

        const options = post.mock.calls[0]![2] as { onError: (errors: Record<string, string>) => void; onFinish: () => void }
        options.onError({ complete: 'Unter „Angaben“ stehen noch fehlende Anlagen (1–15).' })
        options.onFinish()
        await wrapper.vm.$nextTick()

        expect((input.element as HTMLInputElement).checked).toBe(false)
        expect(wrapper.find('.form-field__error').text()).toBe('Unter „Angaben“ stehen noch fehlende Anlagen (1–15).')
    })

    it('shows the state without the right to change it', () => {
        const wrapper = mount(CompletenessSwitch, { props: { documentId: 7, completeness: 'complete', can: false } })

        expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    })
})
