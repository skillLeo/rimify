import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Picture, { type ImageManifest } from './Picture.vue'

/*
 * A picture from the pipeline: the formats it offers, best first, then its own fallback. A drawn
 * placeholder (DemoPlaceholders) is one SVG and offers nothing else — a browser must never be sent
 * to an AVIF that does not exist, or it shows nothing at all.
 */

const photo: ImageManifest = {
    name: 'fixture',
    base: '/storage/demo/wheels/fixture/fixture',
    width: 1080,
    height: 1080,
    widths: [480, 1080],
    placeholder: 'data:image/png;base64,iVBORw0KGgo=',
    fallback: 'png',
}

describe('Picture', () => {
    it('offers AVIF, then WebP, then its fallback — unless the manifest says otherwise', () => {
        const wrapper = mount(Picture, { props: { image: photo, alt: 'Felge' } })
        const types = wrapper.findAll('source').map((s) => s.attributes('type'))

        expect(types).toEqual(['image/avif', 'image/webp'])
        expect(wrapper.find('source').attributes('srcset')).toBe('/storage/demo/wheels/fixture/fixture-480.avif 480w, /storage/demo/wheels/fixture/fixture-1080.avif 1080w')
        expect(wrapper.find('img').attributes('src')).toBe('/storage/demo/wheels/fixture/fixture-1080.png')
    })

    it('offers a drawing as the one SVG it is, with no other format to fail on', () => {
        const drawing: ImageManifest = { ...photo, base: '/storage/demo/placeholders/nordfelge-fjord-silber', widths: [1080], fallback: 'svg', formats: [] }
        const wrapper = mount(Picture, { props: { image: drawing, alt: 'Platzhalterbild' } })

        expect(wrapper.findAll('source')).toHaveLength(0)
        expect(wrapper.find('img').attributes('src')).toBe('/storage/demo/placeholders/nordfelge-fjord-silber-1080.svg')
        expect(wrapper.find('img').attributes('srcset')).toBe('/storage/demo/placeholders/nordfelge-fjord-silber-1080.svg 1080w')
    })
})
