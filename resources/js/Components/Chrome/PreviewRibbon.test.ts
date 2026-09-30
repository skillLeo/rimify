import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

/* The page's shared props, as far as the ribbon reads them. */
const page = vi.hoisted(() => ({ props: { previewRibbon: true } as Record<string, unknown> }))

vi.mock('@inertiajs/vue3', () => ({ usePage: () => page }))

const { default: PreviewRibbon } = await import('./PreviewRibbon.vue')

afterEach(() => {
    page.props.previewRibbon = true
    document.cookie = 'rmf_vorschau=; Max-Age=0; Path=/'
})

describe('PreviewRibbon', () => {
    it('says in one line what the preview is', () => {
        const wrapper = mount(PreviewRibbon)

        expect(wrapper.text()).toContain('Vorschau — Testumgebung. Es werden keine echten Bestellungen ausgeführt.')
        expect(wrapper.find('[role="note"]').exists()).toBe(true)
    })

    it('goes at once on „Ausblenden" and tells the server through its cookie', async () => {
        const wrapper = mount(PreviewRibbon)

        await wrapper.get('button').trigger('click')

        expect(wrapper.find('.preview-ribbon').exists()).toBe(false)
        expect(document.cookie).toContain('rmf_vorschau=aus')
    })

    it('is not there where the server says there is no preview', () => {
        page.props.previewRibbon = false

        expect(mount(PreviewRibbon).find('.preview-ribbon').exists()).toBe(false)
    })
})
