import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import type { StatedDisclosureProp, StatedRatingProp } from '../../../types/admin/felgen'

/*
 * „Sterne von Hand“ on one Felge (#19, D-344, D-345): what the shop shows now, the two figures saved on their own, a
 * refusal beside its field, the way to take the stars off, the one sentence beside every rim's stars with its default —
 * and, for who may not change them, the reason instead of a form.
 */

const put = vi.fn()
const remove = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    router: { delete: (...args: unknown[]) => remove(...args) },
    useForm: <T extends Record<string, unknown>>(data: T) => {
        let defaults: Record<string, unknown> = { ...data }
        const form = reactive({
            ...data,
            errors: {} as Record<string, string>,
            processing: false,
            get isDirty(): boolean {
                return Object.keys(defaults).some((key) => (form as Record<string, unknown>)[key] !== defaults[key])
            },
            put: (...args: unknown[]) => put(...args),
            defaults: (next: Record<string, unknown>) => {
                defaults = { ...next }
            },
            reset: () => {
                Object.assign(form, defaults)
            },
            clearErrors: () => {
                form.errors = {}
            },
        })

        return form
    },
}))

const { default: StatedRatingCard } = await import('./StatedRatingCard.vue')

const DEFAULT = 'Bewertungen aus anderen Quellen, vom Shop übernommen und nicht auf einen Kauf geprüft.'
const SAVED: StatedRatingProp = { rating: '4,9', count: '13', label: '4,9 (13 Bewertungen)' }
const NOTE: StatedDisclosureProp = { text: DEFAULT, default: DEFAULT }

let mounted: VueWrapper[] = []

function mountCard(stated: StatedRatingProp | null, editable = true, disclosure: StatedDisclosureProp = NOTE): VueWrapper {
    const wrapper = mount(StatedRatingCard, { props: { modelId: 7, stated, disclosure, editable }, attachTo: document.body })
    mounted.push(wrapper)

    return wrapper
}

beforeEach(() => {
    put.mockReset()
    remove.mockReset()
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('StatedRatingCard', () => {
    it('says the shop shows no stars while none are saved, and saves only once something is typed', async () => {
        const wrapper = mountCard(null)

        expect(wrapper.find('[data-stars-now]').text()).toBe('Im Shop stehen keine Sterne von Hand.')
        const save = wrapper.findAll('button').find((b) => b.text() === 'Sterne speichern')
        expect(save?.attributes('disabled')).toBeDefined()
        expect(wrapper.text()).not.toContain('Sterne entfernen')

        await wrapper.find('#fe-stars-rating').setValue('4,9')
        await wrapper.find('#fe-stars-count').setValue('13')
        await wrapper.find('.fe-stars__form').trigger('submit')

        expect(put).toHaveBeenCalledTimes(1)
        expect(put.mock.calls[0]?.[0]).toBe('/admin/felgen/7/sterne')
    })

    it('shows what the shop shows, the sentence beside the stars, and takes them off on request', async () => {
        const wrapper = mountCard(SAVED)

        expect(wrapper.find('.fe-stars__label').text()).toBe('Im Shop steht:')
        expect(wrapper.find('.fe-stars__line').text()).toBe(`★ 4,9 (13 Bewertungen) – ${DEFAULT}`)
        expect((wrapper.find('#fe-stars-rating').element as HTMLInputElement).value).toBe('4,9')
        expect((wrapper.find('#fe-stars-count').element as HTMLInputElement).value).toBe('13')

        const off = wrapper.findAll('button').find((b) => b.text() === 'Sterne entfernen')
        expect(off).toBeDefined()
        await off?.trigger('click')

        expect(remove).toHaveBeenCalledTimes(1)
        expect(remove.mock.calls[0]?.[0]).toBe('/admin/felgen/7/sterne')
    })

    it('keeps the one sentence beside every rim\'s stars editable, says an empty one shows no stars, and offers the agreed default back', async () => {
        const wrapper = mountCard(SAVED, true, { text: '', default: DEFAULT })

        expect(wrapper.find('[data-stars-now]').text()).toBe('Der Hinweis unten ist leer – deshalb zeigt der Shop diese Sterne nicht.')
        expect(wrapper.find('label[for="fe-stars-note"]').text()).toContain('gilt für alle Felgen')
        expect(wrapper.find('#fe-stars-note-help').text()).toContain('Lässt du das Feld leer, zeigt der Shop keine Sterne von Hand mehr.')

        const back = wrapper.findAll('button').find((b) => b.text() === 'Vorgeschlagenen Satz einsetzen')
        await back?.trigger('click')
        expect((wrapper.find('#fe-stars-note').element as HTMLInputElement).value).toBe(DEFAULT)

        await wrapper.find('.fe-stars__note-form').trigger('submit')
        expect(put.mock.calls.at(-1)?.[0]).toBe('/admin/felgen/sterne-hinweis')
    })

    it('puts a refusal beside its field, and keeps what was typed until the saved state changes', async () => {
        const wrapper = mountCard(null)
        await wrapper.find('#fe-stars-rating').setValue('5,5')

        const form = (wrapper.vm as unknown as { $: { setupState: { form: { errors: Record<string, string> } } } }).$.setupState.form
        form.errors = { rating: 'Die Sterne gehen von 1,0 bis 5,0, mit höchstens einer Stelle nach dem Komma – etwa 4,8.' }
        await nextTick()

        expect(wrapper.find('#fe-stars-rating').attributes('aria-invalid')).toBe('true')
        expect(wrapper.find('#fe-stars-rating-err').text()).toContain('von 1,0 bis 5,0')
        expect((wrapper.find('#fe-stars-rating').element as HTMLInputElement).value).toBe('5,5')

        // Saved elsewhere meanwhile: the card now shows the saved state.
        await wrapper.setProps({ stated: SAVED })
        expect((wrapper.find('#fe-stars-rating').element as HTMLInputElement).value).toBe('4,9')
        expect(wrapper.find('#fe-stars-rating-err').text()).toBe('')
    })

    it('shows who may not change the stars what the shop shows, and why there is no form', () => {
        const wrapper = mountCard(SAVED, false)

        expect(wrapper.find('form').exists()).toBe(false)
        expect(wrapper.find('[data-stars-now]').text()).toContain('4,9 (13 Bewertungen)')
        expect(wrapper.text()).toContain('Sterne von Hand ändern darf, wer Felgen bearbeiten und veröffentlichen darf.')
    })
})
