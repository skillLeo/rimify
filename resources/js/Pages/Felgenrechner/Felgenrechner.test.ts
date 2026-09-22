import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, type VNode } from 'vue'
import { withUnit } from '../../format'
import type { VehicleProp } from '../../types/rimify'

/*
 * /felgenrechner's two documents (ACCURACY.md §6): the wording a customer reads around the
 * numbers — the prefill line (C3), the pointer to the papers that decide, and not one verdict word
 * anywhere on the page. The numbers themselves are pinned by felgenGeometry.test.ts.
 */

const vehicle: VehicleProp = {
    id: 14,
    make: 'BMW',
    model: '3er',
    variant: '330i',
    label: 'BMW 330i Limousine',
    short: 'BMW 330i',
    hsn: '0005',
    tsn: 'CKT',
    keyNumbers: 'HSN 0005 · TSN CKT',
    buildWindow: 'ab 03/2019',
}

let shared: { vehicle: VehicleProp | null } = { vehicle: null }

/* The head renders nothing here; the link is a plain anchor. */
vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: shared }),
    Head: { render: () => null },
    Link: {
        props: { href: { type: String, required: true } },
        setup(props: { href: string }, { slots }: { slots: { default?: () => VNode[] } }) {
            return () => h('a', { href: props.href }, slots.default?.())
        },
    },
}))

const { default: Desktop } = await import('./Desktop.vue')
const { default: Mobile } = await import('./Mobile.vue')

const PREFILL = { widthIn: 8, diameterIn: 18, etMm: 40, tyreWidth: 235, aspect: 40 }

/** Words that would turn arithmetic into a verdict (ACCURACY.md D8, §6; finding #52). */
const VERDICT_WORDS = ['zulässig', 'passt', 'legal', 'eintragungsfrei', 'toleranz', 'ohne gewähr', 'freigegeben', 'serienbereifung']

let mounted: VueWrapper[] = []

function mountPage(page: 'desktop' | 'mobile', props: Record<string, unknown> = {}): VueWrapper {
    const wrapper = mount(page === 'desktop' ? Desktop : Mobile, {
        props: { prefill: null, state: null, ...props },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

beforeEach(() => {
    shared = { vehicle: null }
    window.history.replaceState(null, '', '/felgenrechner')
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    document.body.innerHTML = ''
})

describe.each(['desktop', 'mobile'] as const)('/felgenrechner (%s)', (page) => {
    it('says what the prefill is, in the words of finding C3', () => {
        shared = { vehicle }
        const wrapper = mountPage(page, { prefill: PREFILL })

        expect(wrapper.find('.rechner__prefill').text()).toBe(
            'Aktuell ist vorbelegt mit der kleinsten Größe, die ein Gutachten für deinen BMW 330i nennt – nicht unbedingt mit deiner heutigen Bereifung.'
        )
    })

    it('prints no prefill line without a prefill', () => {
        shared = { vehicle }

        expect(mountPage(page).find('.rechner__prefill').exists()).toBe(false)
    })

    it('leads with arithmetic, answers in words with the rear view under the position sentence, and ends at the papers that decide', () => {
        const wrapper = mountPage(page)
        const text = wrapper.text()

        expect(wrapper.find('.rechner__lead').text()).toBe(
            'Rechne aus, wie sich eine andere Felgen- und Reifengröße rechnerisch auf Abrollumfang, Tacho und die Lage der Felgenkanten auswirkt.'
        )
        // The answer first, in a sentence; the drawing inside the position block, under it.
        const lage = wrapper.find('[data-result="lage"]')
        expect(lage.find('.calc-result__say').text()).toContain('Die neue Felge steht rechnerisch')
        expect(lage.find('.cd[role="img"]').exists()).toBe(true)
        expect(wrapper.findAll('.cd[role="img"]')).toHaveLength(1)
        expect(text).toContain('Zeigt der Tacho')
        expect(text).toContain('häufig genannten Faustregel')
        expect(text).toContain('keine gesetzliche Grenze')
        expect(text).toContain('Der Tacho darf nie weniger anzeigen als die tatsächliche Geschwindigkeit')
        expect(text).toContain('fährst du rechnerisch')
        expect(wrapper.find('.rechner__disclaimer').text()).toContain('Zulassungsbescheinigung Teil I')
        expect(wrapper.find('.rechner__disclaimer').text()).toContain('CoC-Papier')
        expect(wrapper.find('.rechner__disclaimer').text()).toContain('Reifenfreigabe')
        expect(wrapper.find('.rechner__disclaimer').text()).toContain('Gutachten oder in der ABE der Felge')
    })

    it('never says zulässig, passt, legal, eintragungsfrei, Toleranz or ohne Gewähr — and has no verdict colour', () => {
        shared = { vehicle }
        const wrapper = mountPage(page, { prefill: PREFILL })
        const text = wrapper.text().toLowerCase()

        for (const word of VERDICT_WORDS) {
            expect(text, word).not.toContain(word)
        }

        expect(wrapper.find('.light').exists()).toBe(false)
        expect(wrapper.find('.verdict').exists()).toBe(false)
    })

    it('opens a shared comparison from the server exactly as the link carried it', () => {
        const wrapper = mountPage(page, {
            state: {
                current: { widthIn: 6, diameterIn: 17, etMm: 45, tyreWidthMm: 155, aspect: 45 },
                next: { widthIn: 5.5, diameterIn: 14, etMm: 45, tyreWidthMm: 145, aspect: 35 },
            },
        })

        expect(wrapper.find('[data-result="groesse"] .calc-result__say').text()).toContain(withUnit('−19,99', '%'))
        expect(wrapper.find('[data-result="tacho"] .calc-result__say').text()).toContain(withUnit('80,0', 'km/h'))
    })

    it('says in one sentence that a tyre and its rim do not belong together, and draws and prints nothing for it', () => {
        const wrapper = mountPage(page, {
            state: {
                current: { widthIn: 7.5, diameterIn: 17, etMm: 45, tyreWidthMm: 225, aspect: 45 },
                // 5,5J (139,7 mm) with a 305 tyre: 0,46 × its width.
                next: { widthIn: 5.5, diameterIn: 19, etMm: 35, tyreWidthMm: 305, aspect: 30 },
            },
        })

        expect(wrapper.find('[data-result="implausible"] .calc-result__say').text()).toBe(
            'Diese Reifenbreite und diese Maulweite gehören so nicht zusammen – prüf die Angaben.'
        )
        expect(wrapper.find('.cd').exists()).toBe(false)
        expect(wrapper.find('.specs').exists()).toBe(false)
        expect(wrapper.find('[data-result="lage"]').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('rechnerisch 6')
        // The customer's own figures stay in the form; the disclaimer still points at the papers.
        expect(wrapper.find('.rechner__disclaimer').text()).toContain('Zulassungsbescheinigung Teil I')
    })

    it('keeps the translator off every figure on the page: each value sits in translate="no"', () => {
        const wrapper = mountPage(page)
        const out: string[] = []

        const walk = (node: Node): void => {
            if (node.nodeType === 3) {
                const text = node.textContent ?? ''

                if (/\d/.test(text) && node.parentElement?.closest('[translate="no"]') === null) {
                    out.push(text)
                }

                return
            }

            node.childNodes.forEach(walk)
        }

        walk(wrapper.element)

        expect(out).toEqual([])
        // Every select and the ET field, whose options and values are figures.
        const controls = wrapper.findAll('select, input[type="number"]')
        expect(controls.length).toBeGreaterThanOrEqual(5)
        expect(controls.every((c) => c.attributes('translate') === 'no')).toBe(true)
    })
})
