import { describe, expect, it } from 'vitest'
import { stillReadable } from './file'

describe('stillReadable', () => {
    it('reads a file as it was chosen', async () => {
        expect(await stillReadable(new File(['%PDF-1.7'], 'gutachten.pdf', { type: 'application/pdf' }))).toBe(true)
    })

    it('says no when the browser can no longer read it — saved anew on disk since it was chosen (K2-29)', async () => {
        const changed = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
        changed.slice = () => ({ arrayBuffer: () => Promise.reject(new DOMException('changed', 'NotReadableError')) }) as unknown as Blob

        expect(await stillReadable(changed)).toBe(false)
    })
})
