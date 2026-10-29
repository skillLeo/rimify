import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import type { StatedRatingProp } from '../../../types/admin/felgen'

/*
 * „Sterne von Hand“ on one Felge (#19, D-344): what the shop shows now, the three fields saved on their own, a refusal
 * beside its field, the way to take the stars off — and, for who may not change them, the reason instead of a form.
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

const SAVED: StatedRatingProp = { rating: '4,9', count: '13', origin: 'Bewertungen aus unserem eBay-Shop, Stand Oktober 2026.', label: '4,9 (13 Bewertungen)' }

let mounted: VueWrapper[] = []

function mountCard(stated: StatedRatingProp | null, editable = true): VueWrapper {
    const wrapper = mount(StatedRatingCard, { props: { modelId: 7, stated, editable }, attachTo: document.body })
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
        expect(wrapper.text()).toContain('Ohne diesen Satz zeigt er keine Sterne.')
        expect(wrapper.find('button[type=submit]').attributes('disabled')).toBeDefined()
        expect(wrapper.text()).not.toContain('Sterne entfernen')

        await wrapper.find('#fe-stars-rating').setValue('4,9')
        await wrapper.find('#fe-stars-count').setValue('13')
        await wrapper.find('#fe-stars-origin').setValue('Bewertungen aus unserem eBay-Shop.')
        await wrapper.find('form').trigger('submit')

        expect(put).toHaveBeenCalledTimes(1)
        expect(put.mock.calls[0]?.[0]).toBe('/admin/felgen/7/sterne')
    })

    it('shows what the shop shows, with the sentence beside the stars, and takes them off on request', async () => {
        const wrapper = mountCard(SAVED)

        expect(wrapper.find('.fe-stars__label').text()).toBe('Im Shop steht:')
        expect(wrapper.find('.fe-stars__line').text()).toBe('★ 4,9 (13 Bewertungen) – Bewertungen aus unserem eBay-Shop, Stand Oktober 2026.')
        expect((wrapper.find('#fe-stars-rating').element as HTMLInputElement).value).toBe('4,9')
        expect((wrapper.find('#fe-stars-count').element as HTMLInputElement).value).toBe('13')
        expect((wrapper.find('#fe-stars-origin').element as HTMLInputElement).value).toBe(SAVED.origin)

        const off = wrapper.findAll('button').find((b) => b.text() === 'Sterne entfernen')
        expect(off).toBeDefined()
        await off?.trigger('click')

        expect(remove).toHaveBeenCalledTimes(1)
        expect(remove.mock.calls[0]?.[0]).toBe('/admin/felgen/7/sterne')
    })

    it('puts a refusal beside its field, and keeps what was typed until the saved state changes', async () => {
        const wrapper = mountCard(null)
        await wrapper.find('#fe-stars-origin').setValue('Geprüfte Bewertungen.')

        const form = (wrapper.vm as unknown as { $: { setupState: { form: { errors: Record<string, string> } } } }).$.setupState.form
        form.errors = { origin: 'Der Satz darf keine Prüfung behaupten – diese Sterne hat der Shop nicht geprüft. Nenne nur, woher sie stammen.' }
        await nextTick()

        expect(wrapper.find('#fe-stars-origin').attributes('aria-invalid')).toBe('true')
        expect(wrapper.find('#fe-stars-origin-err').text()).toContain('Der Satz darf keine Prüfung behaupten')
        expect((wrapper.find('#fe-stars-origin').element as HTMLInputElement).value).toBe('Geprüfte Bewertungen.')

        // Saved elsewhere meanwhile: the card now shows the saved state.
        await wrapper.setProps({ stated: SAVED })
        expect((wrapper.find('#fe-stars-origin').element as HTMLInputElement).value).toBe(SAVED.origin)
        expect(wrapper.find('#fe-stars-origin-err').text()).toBe('')
    })

    it('shows who may not change the stars what the shop shows, and why there is no form', () => {
        const wrapper = mountCard(SAVED, false)

        expect(wrapper.find('form').exists()).toBe(false)
        expect(wrapper.find('[data-stars-now]').text()).toContain('4,9 (13 Bewertungen)')
        expect(wrapper.text()).toContain('Sterne von Hand ändern darf, wer Felgen bearbeiten und veröffentlichen darf.')
    })
})
