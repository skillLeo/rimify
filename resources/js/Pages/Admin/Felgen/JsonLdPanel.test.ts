import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import JsonLdPanel from './JsonLdPanel.vue'

/*
 * „JSON-LD anzeigen“ (his admin item 14): the code folded until asked for, copied whole, the way to Google's test in two
 * steps — and a demo rim, a draft and a rim without a size each saying what they are.
 */

const CODE = '<script type="application/ld+json">\n{\n    "@type": "ProductGroup"\n}\n</script>'

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('JsonLdPanel', () => {
    it('folds the code until asked for, and copies it whole', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        vi.stubGlobal('navigator', { clipboard: { writeText } })
        const wrapper = mount(JsonLdPanel, { props: { jsonLd: { code: CODE, demo: false, published: true } } })

        const toggle = wrapper.get('button[aria-controls="fe-jsonld-code"]')
        expect(toggle.text()).toBe('JSON-LD anzeigen')
        expect(wrapper.get('#fe-jsonld-code').attributes('style')).toContain('display: none')

        await toggle.trigger('click')
        expect(toggle.text()).toBe('JSON-LD ausblenden')
        expect(toggle.attributes('aria-expanded')).toBe('true')
        expect(wrapper.get('#fe-jsonld-code').attributes('style') ?? '').not.toContain('display: none')
        expect(wrapper.get('#fe-jsonld-code').text()).toBe(CODE)

        await wrapper.findAll('button').find((b) => b.text() === 'Code kopieren')!.trigger('click')
        await Promise.resolve()
        expect(writeText).toHaveBeenCalledWith(CODE)
        expect(wrapper.get('.jl__copied').text()).toBe('Kopiert.')

        // The way to Google's test, opened apart from the admin.
        const link = wrapper.get('.jl__steps a')
        expect(link.attributes('href')).toBe('https://search.google.com/test/rich-results')
        expect(link.attributes('rel')).toBe('noopener noreferrer')
        expect(wrapper.get('.jl__steps').text()).toContain('„Code“')
    })

    it('says so when copying fails, and how to do it by hand', async () => {
        vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
        const wrapper = mount(JsonLdPanel, { props: { jsonLd: { code: CODE, demo: false, published: true } } })

        await wrapper.findAll('button').find((b) => b.text() === 'Code kopieren')!.trigger('click')
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(wrapper.get('.jl__copied').text()).toBe('Kopieren ging nicht – blende den Code ein, markier ihn und kopier ihn selbst.')
    })

    it('names a demo rim and a draft, and offers nothing while there is no size', () => {
        const demo = mount(JsonLdPanel, { props: { jsonLd: { code: CODE, demo: true, published: true } } })
        expect(demo.get('.jl__state').text()).toContain('Beispielfelge (Demodaten): Ihre Seite im Shop gibt Suchmaschinen keine strukturierten Daten.')

        const draft = mount(JsonLdPanel, { props: { jsonLd: { code: CODE, demo: false, published: false } } })
        expect(draft.get('.jl__state').text()).toBe('Die Felge ist noch nicht veröffentlicht. Sobald sie es ist, steht dieser Code im Kopf ihrer Seite.')

        const bare = mount(JsonLdPanel, { props: { jsonLd: { code: null, demo: false, published: false } } })
        expect(bare.text()).toContain('Sobald die Felge eine Größe hat, steht hier ihr JSON-LD.')
        expect(bare.find('button').exists()).toBe(false)
    })
})
