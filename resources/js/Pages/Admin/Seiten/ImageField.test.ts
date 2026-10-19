import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ImageField from './ImageField.vue'

/*
 * An article's picture (his admin item 11, D-306): uploaded at once into our storage, its address and size handed to
 * the block; a refusal of the server said under the field, word for word.
 */

function mountImage(src = '') {
    return mount(ImageField, { props: { id: 'pg-img', label: 'Bild', pageId: 7, src, alt: 'Schnitt' }, attachTo: document.body })
}

async function choose(wrapper: ReturnType<typeof mountImage>, file: File): Promise<void> {
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flushPromises()
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('ImageField', () => {
    it('uploads the chosen picture to the article and hands its address and size to the block @admin-211', async () => {
        const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ src: '/storage/blog/et/schnitt.webp', width: 1200, height: 800 }), { status: 200 })))
        vi.stubGlobal('fetch', fetchMock)
        const wrapper = mountImage()

        await choose(wrapper, new File(['x'], 'schnitt.webp', { type: 'image/webp' }))

        expect(fetchMock).toHaveBeenCalledWith('/admin/seiten/7/bild', expect.objectContaining({ method: 'POST' }))
        expect(wrapper.emitted('uploaded')).toEqual([[{ src: '/storage/blog/et/schnitt.webp', width: 1200, height: 800 }]])
        wrapper.unmount()
    })

    it('says the server’s refusal under the field and hands nothing on @admin-211', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ errors: { image: ['Das Bild ist größer als 10 MB.'] } }), { status: 422 }))))
        const wrapper = mountImage()

        await choose(wrapper, new File(['x'], 'riesig.jpg', { type: 'image/jpeg' }))

        expect(wrapper.find('#pg-img-err').text()).toBe('Das Bild ist größer als 10 MB.')
        expect(wrapper.emitted('uploaded')).toBeUndefined()
        wrapper.unmount()
    })

    // SEI-27: a refusal that is not the field's own validation says what happened and what to do.
    it('says an expired sign-in as such, not „Versuch es noch einmal“ @admin-211', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('', { status: 419 }))))
        const wrapper = mountImage()

        await choose(wrapper, new File(['x'], 'schein.jpg', { type: 'image/jpeg' }))

        expect(wrapper.find('#pg-img-err').text()).toBe('Deine Anmeldung ist abgelaufen. Lade die Seite neu und wähl das Bild dann noch einmal.')
        wrapper.unmount()
    })

    // SEI-23: a field whose block is gone takes its upload with it — the answer lands nowhere.
    it('hands nothing on once its block is gone @admin-211', async () => {
        let answer: (response: Response) => void = () => undefined
        vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { answer = resolve })))
        const wrapper = mountImage()

        await choose(wrapper, new File(['x'], 'schein.jpg', { type: 'image/jpeg' }))
        const emitted = wrapper.emitted()
        wrapper.unmount()
        answer(new Response(JSON.stringify({ src: '/storage/blog/et/x.jpg', width: 1, height: 1 }), { status: 200 }))
        await flushPromises()

        expect(emitted.uploaded).toBeUndefined()
    })

    it('shows the kept picture with its description — never the generated name it is stored under @admin-211', () => {
        const wrapper = mountImage('/storage/blog/et/01jabc7k2m.webp')

        expect(wrapper.find('figure img').attributes('alt')).toBe('Schnitt')
        expect(wrapper.find('#pg-img-name').text()).toBe('Bild ausgewählt')
        expect(wrapper.find('label.adm-filepick__button').text()).toBe('Anderes Bild auswählen')
        wrapper.unmount()
    })
})
