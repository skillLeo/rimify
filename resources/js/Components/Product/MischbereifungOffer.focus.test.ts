import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import type { MischbereifungProp } from '../../types/pages'

/*
 * PDP-05 (S2) — docs/qa/BUGS.md, review docs/qa/reviews/PDP-2026-10-02.md.
 *
 * The panel after an add (#16) leaves the focus on the add button. The product page's own button follows the rule its
 * comment states („Busy, never disabled, while it sends: a disabled button drops the focus to the page (#16)“). The
 * Mischbereifung cards below it, shown with „Komplettrad“ for the BMW X3 X83 on the 19″ (ABE 55255, V19), do not: each
 * „Als Mischbereifung in den Warenkorb“ is `:disabled="form.processing || …"`. The browser takes the focus off a
 * button that becomes disabled, so after the add the focus is on <body>, not on the button the customer pressed. Every
 * other card's button is disabled for the round trip too.
 *
 * Expected: while the add is on its way the button stays enabled and keeps the focus. A second press does nothing,
 * because add() already returns while `form.processing` is set.
 */

const post = vi.fn()
let forms: Array<Record<string, unknown>> = []

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    useForm: <T extends object>(data: T) => {
        const form = reactive({
            ...data,
            errors: {} as Record<string, string>,
            processing: false,
            post: (...args: unknown[]) => post(...args),
        })
        forms.push(form)

        return form
    },
}))

const { default: MischbereifungOffer } = await import('./MischbereifungOffer.vue')

const OFFER: MischbereifungProp = {
    refusal: null,
    refusalCode: null,
    perAxle: 2,
    rules: null,
    sourcePage: 12,
    priceOpen: false,
    pairs: [
        {
            key: '235/45/19|255/40/19',
            number: 8,
            front: '235/45 R19',
            rear: '255/40 R19',
            minSentence: 'Bei Mischbereifung prüfen wir jede Achse mit ihrer eigenen Achslast.',
            sets: [
                {
                    key: '11-12',
                    frontTyreId: 11,
                    rearTyreId: 12,
                    brandName: 'Bridgestone',
                    name: 'Potenza Sport',
                    seasonLabel: 'Sommerreifen',
                    frontLabel: '235/45 R19 95Y',
                    rearLabel: '255/40 R19 99Y',
                    perWheelFront: '465,00 €',
                    perWheelRear: '495,00 €',
                    forFourCents: 192_000,
                    forFour: '1.920,00 €',
                    isDemo: false,
                },
            ],
        },
    ],
}

let wrapper: VueWrapper | null = null

beforeEach(() => {
    post.mockReset()
    forms = []
})

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
})

describe('MischbereifungOffer while the add is sent (PDP-05)', () => {
    it('keeps the pressed button enabled and focused while the add is on its way, and sends once', async () => {
        wrapper = mount(MischbereifungOffer, {
            props: { offer: OFFER, wheelConfigId: 884 },
            global: { stubs: { Icon: true } },
            attachTo: document.body,
        })

        const button = wrapper.find('.mix-card__add')
        ;(button.element as HTMLButtonElement).focus()
        await button.trigger('click')

        // Inertia's onStart: the request is on its way.
        const form = forms[0] as { processing: boolean }
        form.processing = true
        await nextTick()

        expect(button.attributes('disabled'), 'disabled while sending: the browser drops the focus to <body>').toBeUndefined()
        expect(document.activeElement).toBe(button.element)

        // A second press while the first is on its way sends nothing.
        await button.trigger('click')
        expect(post).toHaveBeenCalledTimes(1)
    })
})
