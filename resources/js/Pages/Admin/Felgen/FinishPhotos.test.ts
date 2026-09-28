import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import type { FinishPhoto } from '../../../types/admin/felgen'

/*
 * A colour's photographs (COMPLIANCE row 23): the first is named the cover, the arrows send the whole new
 * order in one request, the last place has no way further down, and a full colour offers no upload.
 */

const current = reactive<{ props: Record<string, unknown> }>({ props: { errors: {}, admin: { environment: 'Entwicklung' } } })
const put = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { post: vi.fn(), put: (...args: unknown[]) => put(...args), delete: vi.fn(), on: vi.fn(() => () => undefined) },
}))

const { default: FinishPhotos } = await import('./FinishPhotos.vue')

function photo(id: number, alt: string): FinishPhoto {
    return {
        id,
        alt,
        manifest: { name: `felge-${id}`, base: `/media/felge-${id}`, width: 800, height: 800, widths: [800], placeholder: 'data:image/svg+xml,', fallback: 'jpg', formats: [] },
    }
}

let mounted: VueWrapper[] = []

function mountPhotos(photos: FinishPhoto[], max = 12): VueWrapper {
    const wrapper = mount(FinishPhotos, {
        props: { modelId: 7, finishId: 3, finishName: 'Mistral Anthracite', image: null, photos, max, editable: true, title: 'Borbet DB8GT2' },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

beforeEach(() => {
    put.mockReset()
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('FinishPhotos', () => {
    it('names the first photo the cover and says how to reorder', () => {
        const wrapper = mountPhotos([photo(1, 'Borbet DB8GT2 in Mistral Anthracite, Ansicht von vorn'), photo(2, 'Borbet DB8GT2 in Mistral Anthracite, seitlich')])
        const items = wrapper.findAll('.fe-photos__item')

        expect(items).toHaveLength(2)
        expect(items[0]?.text()).toContain('Titelbild')
        expect(items[1]?.text()).not.toContain('Titelbild')
        expect(wrapper.text()).toContain('Das erste Foto ist das Titelbild im Shop.')
        expect(wrapper.text()).toContain('2 Fotos von höchstens 12')
    })

    it('sends the whole new order when a photo moves down, and offers no step past the last place', async () => {
        const wrapper = mountPhotos([photo(1, 'Vorn, erstes Foto'), photo(2, 'Seite, zweites Foto'), photo(3, 'Detail, drittes Foto')])

        expect(wrapper.find('button[aria-label="Foto 1 nach oben"]').attributes('disabled')).toBeDefined()
        expect(wrapper.find('button[aria-label="Foto 3 nach unten"]').attributes('disabled')).toBeDefined()

        await wrapper.find('button[aria-label="Foto 1 nach unten"]').trigger('click')

        expect(put).toHaveBeenCalledTimes(1)
        expect(put.mock.calls[0]?.[0]).toBe('/admin/felgen/7/ausfuehrungen/3/fotos/reihenfolge')
        expect(put.mock.calls[0]?.[1]).toEqual({ ids: [2, 1, 3] })
    })

    it('offers no upload once the colour is full, and says why', () => {
        const wrapper = mountPhotos([photo(1, 'Vorn, erstes Foto'), photo(2, 'Seite, zweites Foto')], 2)

        expect(wrapper.get('#fe-photo-3-start').attributes('disabled')).toBeDefined()
        expect(wrapper.text()).toContain('entferne eines, um ein weiteres hinzuzufügen')
    })

    it('says the shop draws the outline while there is no photo', () => {
        const wrapper = mountPhotos([])

        expect(wrapper.find('.fe-photos__list').exists()).toBe(false)
        expect(wrapper.text()).toContain('Kein Foto. Der Shop zeigt die Umrisszeichnung, bis eines hochgeladen ist.')
    })
})
