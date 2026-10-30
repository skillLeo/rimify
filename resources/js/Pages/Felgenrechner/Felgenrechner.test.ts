import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, type VNode } from 'vue'
import type { VehicleProp } from '../../types/rimify'

/*
 * /felgenrechner's two documents, rebuilt close to the client's example (his #11; the operator's brief of 29.10.2026,
 * Batch 2): the two blocks with their steppers, the two answers in words, the drawing, the address — and, as before,
 * the wording around the numbers: the prefill sentence (C3), the pointer to the papers that decide, and not one verdict
 * word (ACCURACY.md §6). The arithmetic itself is pinned by lib/etRechner.test.ts.
 */

const NN = ' '

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

/* Inertia's `navigate` listeners, fired by hand: its first page is set after the page mounts (useEtRechner). */
const navigate: Array<() => void> = []

/* The head renders nothing here; the link is a plain anchor. */
vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: shared }),
    router: {
        on: (event: string, listener: () => void) => {
            if (event === 'navigate') navigate.push(listener)

            return () => navigate.splice(navigate.indexOf(listener) >>> 0, 1)
        },
    },
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

const answers = (w: VueWrapper): string[] => w.findAll('.rechner__answer').map((p) => p.text())
const block = (w: VueWrapper, side: 'current' | 'next') => w.find(`.etc__block--${side}`)
const field = (w: VueWrapper, side: 'current' | 'next', index: number) => block(w, side).findAll('.etc__field')[index]!
const values = (w: VueWrapper, side: 'current' | 'next'): string[] => block(w, side).findAll('input').map((i) => (i.element as HTMLInputElement).value)

beforeEach(() => {
    shared = { vehicle: null }
    window.history.replaceState(null, '', '/felgenrechner')
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    document.body.innerHTML = ''
    vi.useRealTimers()
})

describe.each(['desktop', 'mobile'] as const)('/felgenrechner (%s)', (page) => {
    it('opens on his example: two blocks, 8J ET45 against 8J ET40, five millimetres each way, one drawing', () => {
        const wrapper = mountPage(page)

        expect(wrapper.findAll('.etc__title').map((t) => t.text())).toEqual(['Aktuelle Felge', 'Neue Felge'])
        expect(block(wrapper, 'current').findAll('.etc__label').map((l) => l.text())).toEqual(['Breite', 'Einpresstiefe (ET)', 'Distanzscheibe je Rad'])
        expect(values(wrapper, 'current')).toEqual(['8', '45', '0'])
        expect(values(wrapper, 'next')).toEqual(['8', '40', '0'])
        expect(answers(wrapper)).toEqual([`Innen: 5,0${NN}mm weiter vom Fahrwerk entfernt`, `Außen: 5,0${NN}mm weiter heraus`])
        expect(wrapper.findAll('.calc-drawing svg[role="img"]')).toHaveLength(1)
        expect(wrapper.find('#odraw-caption').text()).toBe('Schnitt durch das Rad, schematisch, von vorn gesehen.')
        // The key says which wheel is which, each with its sample: no coloured words that read as links.
        expect(wrapper.findAll('.odraw__key-line').map((l) => l.text())).toEqual([`Aktuell: 8J · ET${NN}45`, `Neu: 8J · ET${NN}40`])
        expect(wrapper.findAll('.odraw__sample')).toHaveLength(2)
    })

    it('moves with every step: half an inch wider on the new rim, and both answers follow', async () => {
        const wrapper = mountPage(page)

        await field(wrapper, 'next', 0).find('button[aria-label="Breite erhöhen"]').trigger('click')

        expect(values(wrapper, 'next')).toEqual(['8,5', '40', '0'])
        // 6,35 − 5 = 1,35 inside, 6,35 + 5 = 11,35 outside — rounded once, half up.
        expect(answers(wrapper)).toEqual([`Innen: 1,4${NN}mm näher am Fahrwerk`, `Außen: 11,4${NN}mm weiter heraus`])
    })

    it('takes a typed figure as people type it, and keeps a wrong one with a sentence, the answers on the last right one', async () => {
        const wrapper = mountPage(page)
        const width = field(wrapper, 'next', 0).find('input')

        // 8J ET45 against 9,5J ET40: 19,05 − 5 inside, 19,05 + 5 outside.
        await width.setValue('9,5')
        expect(answers(wrapper)).toEqual([`Innen: 14,1${NN}mm näher am Fahrwerk`, `Außen: 24,1${NN}mm weiter heraus`])

        await width.setValue('8,25')
        await width.trigger('blur')

        expect((width.element as HTMLInputElement).value).toBe('8,25')
        expect(width.attributes('aria-invalid')).toBe('true')
        expect(field(wrapper, 'next', 0).find('.etc__error').text()).toBe(`Die Breite liegt zwischen 4 und 13${NN}Zoll, in halben Zoll – zum Beispiel 8,5.`)
        expect(answers(wrapper)).toEqual([`Innen: 14,1${NN}mm näher am Fahrwerk`, `Außen: 24,1${NN}mm weiter heraus`])
    })

    it('counts a spacer outwards and a higher ET inwards: his third case, 8,5J ET40 against 9,5J ET45 with 10 mm', () => {
        const wrapper = mountPage(page, { state: { current: { widthIn: 8.5, etMm: 40, spacerMm: 0 }, next: { widthIn: 9.5, etMm: 45, spacerMm: 10 } } })

        expect(values(wrapper, 'next')).toEqual(['9,5', '45', '10'])
        expect(answers(wrapper)).toEqual([`Innen: 7,7${NN}mm näher am Fahrwerk`, `Außen: 17,7${NN}mm weiter heraus`])
        expect(wrapper.findAll('.odraw__key-line').map((l) => l.text())).toEqual([`Aktuell: 8,5J · ET${NN}40`, `Neu: 9,5J · ET${NN}45 · Distanzscheibe 10${NN}mm`])
        // The figures in the drawing carry no sign: the chevron says the way, as in his example.
        expect(wrapper.findAll('.odraw__figure').map((f) => f.text())).toEqual([`17,7${NN}mm`, `7,7${NN}mm`])
    })

    it('writes the comparison to the address, from the first paint and after a change', async () => {
        vi.useFakeTimers()
        const wrapper = mountPage(page)

        expect(new URLSearchParams(window.location.search).get('rechner')).toBe('8x45x0_8x40x0')

        await field(wrapper, 'next', 2).find('button[aria-label="Distanzscheibe je Rad erhöhen"]').trigger('click')
        vi.advanceTimersByTime(500)
        await nextTick()

        expect(new URLSearchParams(window.location.search).get('rechner')).toBe('8x45x0_8x40x1')
    })

    // A link from before the rebuild: Inertia writes the address of its first page once that page is set — after this
    // one mounted — and the old figures came back into the address bar (felgenrechner.spec, 30.10.2026).
    it('sets an old link straight, and again once Inertia has written its first page', () => {
        window.history.replaceState(null, '', '/felgenrechner?rechner=7.5x17-45-225-45_8.5x19-35-225-35')
        mountPage(page)

        expect(new URLSearchParams(window.location.search).get('rechner')).toBe('8x45x0_8x40x0')

        // Inertia's own first write, then its navigate event.
        window.history.replaceState(null, '', '/felgenrechner?rechner=7.5x17-45-225-45_8.5x19-35-225-35')
        navigate.slice().forEach((listener) => listener())

        expect(new URLSearchParams(window.location.search).get('rechner')).toBe('8x45x0_8x40x0')
    })

    it('says what the prefill is, in the words of finding C3, and fills the current rim with it', () => {
        shared = { vehicle }
        const wrapper = mountPage(page, { prefill: PREFILL })

        expect(wrapper.find('.rechner__prefill').text()).toBe(
            '„Aktuelle Felge“ ist mit der kleinsten Größe aus den bei uns hinterlegten Gutachten für BMW 330i vorbelegt. Das ist nicht unbedingt die Felge, die du heute fährst.'
        )
        expect(values(wrapper, 'current')).toEqual(['8', '40', '0'])
        expect(values(wrapper, 'next')).toEqual(['8,5', '40', '0'])
    })

    it('prints no prefill line without a prefill', () => {
        shared = { vehicle }

        expect(mountPage(page).find('.rechner__prefill').exists()).toBe(false)
    })

    it('ends at the papers that decide, and never says zulässig, passt, legal or anything like it', () => {
        shared = { vehicle }
        const wrapper = mountPage(page, { prefill: PREFILL })
        const text = wrapper.text().toLowerCase()

        for (const word of VERDICT_WORDS) {
            expect(text, word).not.toContain(word)
        }

        const papers = wrapper.find('.rechner__disclaimer').text()
        expect(papers).toContain('Zulassungsbescheinigung Teil I')
        expect(papers).toContain('Gutachten oder in der ABE der Felge')
        expect(wrapper.find('.verdict').exists()).toBe(false)
    })

    it('keeps the translator off every figure on the page: each sits in translate="no"', async () => {
        const wrapper = mountPage(page)
        // An error sentence carries figures too.
        const width = field(wrapper, 'current', 0).find('input')
        await width.setValue('x')
        await width.trigger('blur')
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
        // The six fields, whose values are figures.
        const fields = wrapper.findAll('.etc input')
        expect(fields).toHaveLength(6)
        expect(fields.every((i) => i.element.closest('[translate="no"]') !== null)).toBe(true)
    })
})
