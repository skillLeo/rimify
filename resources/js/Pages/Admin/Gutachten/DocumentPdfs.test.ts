import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

type Visit = { onSuccess?: () => void; onFinish?: () => void }
const posts: { url: string; data: Record<string, unknown>; options: Visit }[] = []

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { errors: {} }, url: '/admin/gutachten/43' }),
    router: {
        post: vi.fn((url: string, data: Record<string, unknown>, options: Visit) => posts.push({ url, data, options })),
        put: vi.fn(),
        on: vi.fn(() => () => undefined),
    },
}))

vi.mock('../../../composables/admin/usePresignedUpload', async () => {
    const { ref } = await import('vue')

    return { usePresignedUpload: () => ({ upload: vi.fn(async (file: File) => `pending/${file.name}`), error: ref(null) }) }
})

const { default: DocumentPdfs } = await import('./DocumentPdfs.vue')

const pdf = (name: string): File => new File(['%PDF-1.4\n'], name, { type: 'application/pdf' })

function choose(input: HTMLInputElement, file: File): void {
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change'))
}

/*
 * D-497, found by the click-through of release 47: after one PDF was added, the field still showed its name while the form
 * held none, so the next „PDF hinzufügen“ said „Bitte wähl das PDF aus.“ — and a file chosen while the first went up was
 * cleared by the first one's success.
 */
describe('DocumentPdfs', () => {
    const main = { id: null, label: 'Gutachten', datedOn: '2025-07-02', dateLabel: '02.07.2025', main: true, hidden: false, url: '/x.pdf' }

    it('empties the file field with the file it sent, and keeps one chosen while that one went up', async () => {
        posts.length = 0
        const wrapper = mount(DocumentPdfs, { props: { documentId: 43, pdfs: [main], can: true, maxMb: 50 }, attachTo: document.body })
        const input = wrapper.find('#dp-file').element as HTMLInputElement
        const valueSetter = vi.fn()
        Object.defineProperty(input, 'value', { set: valueSetter, get: () => '', configurable: true })

        choose(input, pdf('nachtrag.pdf'))
        await wrapper.find('form.dp__add').trigger('submit')
        await flushPromises()

        expect(posts).toHaveLength(1)
        expect(posts[0]!.data).toMatchObject({ upload_key: 'pending/nachtrag.pdf', label: 'Nachtrag' })

        // The second file is chosen before the first one's answer comes back: it stays chosen.
        choose(input, pdf('anlage.pdf'))
        posts[0]!.options.onSuccess?.()
        posts[0]!.options.onFinish?.()
        await flushPromises()
        expect(valueSetter).not.toHaveBeenCalled()

        await wrapper.find('#dp-new-label').setValue('Anlage')
        await wrapper.find('form.dp__add').trigger('submit')
        await flushPromises()

        expect(wrapper.find('#dp-err').text()).toBe('')
        expect(posts[1]!.data).toMatchObject({ upload_key: 'pending/anlage.pdf', label: 'Anlage' })

        // Its own success empties the field: no name stands over a form that holds no file.
        posts[1]!.options.onSuccess?.()
        await flushPromises()
        expect(valueSetter).toHaveBeenCalledWith('')

        await wrapper.find('form.dp__add').trigger('submit')
        await flushPromises()
        expect(wrapper.find('#dp-err').text()).toBe('Bitte wähl das PDF aus.')

        wrapper.unmount()
    })
})
