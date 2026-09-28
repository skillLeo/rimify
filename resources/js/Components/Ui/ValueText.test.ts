import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import ValueText from './ValueText.vue'

/** The component inside a paragraph, as a sentence sits in the page. */
function inParagraph(text: string, whole = false): HTMLElement {
    return mount({ render: () => h('p', [h(ValueText, { text, whole })]) }).element as HTMLElement
}

describe('ValueText', () => {
    it('keeps the spaces around a value inside its untranslated span, so a translator cannot glue the words to it', () => {
        // Chrome's translation trims the text it translates: "hier 8,5J" once came back as "here8,5J".
        const p = inParagraph('Die Maulweite – hier 8,5J; das „J“ bezeichnet die Form.')
        const value = p.querySelector('[translate="no"]')

        expect(value?.textContent).toBe(' 8,5J')
        // The translatable words end at "hier", with no space left outside for a translator to drop.
        expect(p.innerHTML).toMatch(/hier(?:<!--.*?-->)*<span[^>]*> 8,5J<\/span>/)
    })

    it('reads exactly as the sentence it was given', () => {
        const text = 'Der Felgendurchmesser – hier 18 Zoll – wird am Wulstsitz gemessen.'

        expect(inParagraph(text).textContent).toBe(text)
    })

    it('wraps a whole value in one span, untouched', () => {
        const value = inParagraph('72,5 mm', true).querySelectorAll('[translate="no"]')

        expect(value).toHaveLength(1)
        expect(value[0]?.textContent).toBe('72,5 mm')
    })
})
