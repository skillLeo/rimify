import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

/* Why there is no Komplettrad: the sentence and a way on, never a dead end (#25). The code only picks the ways; it is never read out (R-15). */

const papers = vi.hoisted(() => vi.fn())

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    usePage: () => ({ url: '/komplettraeder?groesse=11', props: {} }),
}))
vi.mock('../../lib/papersForm', () => ({ focusPapersForm: papers }))

const { default: KomplettradRefusal } = await import('./KomplettradRefusal.vue')

const SENTENCE = 'Für dieses Rad können wir gerade kein Komplettrad anbieten.'
const refusal = (code: string | null) => mount(KomplettradRefusal, { props: { sentence: SENTENCE, code } })

describe('KomplettradRefusal', () => {
    it('sends a customer without a car to the selector, and nowhere else @kunde-25', () => {
        const wrapper = refusal('NO_VEHICLE')

        expect(wrapper.text()).toContain(SENTENCE)
        expect(wrapper.find('a[href="/felgen-suchen"]').text()).toBe('Fahrzeug wählen')
        expect(wrapper.text()).not.toContain('Schreib uns')
        expect(wrapper.text()).not.toContain('Werte eintragen')
    })

    it('asks for the car’s figures where the tyres wait for them: the customer’s to give, not a message to us', async () => {
        const wrapper = refusal('TYRES_AWAIT_PAPERS')

        await wrapper.find('button').trigger('click')

        expect(wrapper.find('button').text()).toBe('Werte eintragen')
        expect(papers).toHaveBeenCalledOnce()
        expect(wrapper.text()).not.toContain('Schreib uns')
    })

    it('offers the contact form where a person has to look, with this page as the way back', () => {
        for (const code of ['NO_TYRE_AVAILABLE', 'STAGGERED_LAYOUT', null]) {
            const link = refusal(code).find('a')

            expect(link.text()).toBe('Schreib uns')
            expect(link.attributes('href')).toContain('Komplettrad')
            expect(link.attributes('href')).toContain(encodeURIComponent('/komplettraeder?groesse=11'))
        }
    })

    it('offers both where a verdict was restored: the car again, or a person', () => {
        const wrapper = refusal('VERDICT_RESTORED')

        expect(wrapper.find('a[href="/felgen-suchen"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Schreib uns')
    })

    it('never reads the code out', () => {
        for (const code of ['NO_VEHICLE', 'TYRES_AWAIT_PAPERS', 'STAGGERED_LAYOUT', 'VERDICT_RESTORED']) {
            expect(refusal(code).text()).not.toContain(code)
        }
    })
})
