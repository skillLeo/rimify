import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import DocumentSelect from './DocumentSelect.vue'

/*
 * „Nachtrag zu“ and „Ersetzt eine frühere Fassung“ (the admin audit's F-36): every document is offered, and a long list
 * is shortened by typing a number however it is spaced; the one chosen stays in the list.
 */

const OPTIONS = Array.from({ length: 25 }, (_, i) => ({ value: i + 1, label: `ABE ${53800 + i}` }))

function picker(chosen: number | null = null, options = OPTIONS) {
    const model = ref<number | null>(chosen)
    const wrapper = mount(
        defineComponent({
            setup: () => () => h(DocumentSelect, { id: 'base', options, noneLabel: 'Einem Gutachten, das uns nicht vorliegt', modelValue: model.value, 'onUpdate:modelValue': (v: number | null) => (model.value = v) }),
        })
    )

    return { wrapper, model }
}

const labels = (wrapper: ReturnType<typeof mount>): string[] => wrapper.findAll('#base option').map((o) => o.text())

describe('DocumentSelect', () => {
    it('offers all documents, and shortens a long list to those whose number holds what is typed', async () => {
        const { wrapper } = picker()

        expect(labels(wrapper)).toHaveLength(26)
        expect(wrapper.find('#base-shorten-count').text()).toBe('25 Dokumente in der Liste')

        await wrapper.find('#base-shorten').setValue('abe-53812')

        expect(labels(wrapper)).toEqual(['Einem Gutachten, das uns nicht vorliegt', 'ABE 53812'])
        expect(wrapper.find('#base-shorten-count').text()).toBe('1 von 25 Dokumenten gefunden')
    })

    it('keeps the chosen document in the list while another is searched, and says when nothing fits', async () => {
        const { wrapper } = picker(3)

        await wrapper.find('#base-shorten').setValue('99999')

        expect(labels(wrapper)).toEqual(['Einem Gutachten, das uns nicht vorliegt', 'ABE 53802'])
        expect(wrapper.find('#base-shorten-count').text()).toBe('Kein Dokument passt zu „99999“.')
    })

    it('chooses a document found by typing', async () => {
        const { wrapper, model } = picker()

        await wrapper.find('#base-shorten').setValue('53824')
        await wrapper.find('#base').setValue('25')

        expect(model.value).toBe(25)
    })

    it('needs no field to shorten a short list', () => {
        const { wrapper } = picker(null, OPTIONS.slice(0, 5))

        expect(wrapper.find('#base-shorten').exists()).toBe(false)
        expect(labels(wrapper)).toHaveLength(6)
    })
})
