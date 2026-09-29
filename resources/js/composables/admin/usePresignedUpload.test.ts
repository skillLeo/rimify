import { describe, expect, it, vi } from 'vitest'
import { UPLOAD_SENTENCES, retryable, tooLarge, usePresignedUpload, type PresignedForm, type Sender } from './usePresignedUpload'

/*
 * The browser half of a large PDF upload: straight to the signed form, retried when the connection or
 * the bucket stumbles, never when the bucket refused the file — and every failure a German sentence.
 */

const FORM: PresignedForm = {
    url: 'https://rimify-media-test.s3.eu-north-1.amazonaws.com',
    fields: { key: 'invoices/pending/01jabcdefghjkmnpqrstvwxyz0.pdf', 'Content-Type': 'application/pdf', Policy: 'e30=', 'X-Amz-Signature': 'abc' },
    key: 'pending/01jabcdefghjkmnpqrstvwxyz0.pdf',
    maxBytes: 200 * 1024 * 1024,
    expiresAt: '2026-09-27T12:10:00+00:00',
}

const pdf = (bytes = 10): File => new File([new Uint8Array(bytes)], 'Gutachten 12345.pdf', { type: 'application/pdf' })

function answering(...statuses: number[]): { send: Sender; calls: FormData[] } {
    const calls: FormData[] = []
    const send: Sender = (_url, body, _headers, onProgress) => {
        calls.push(body)
        onProgress(0.5)

        return Promise.resolve(statuses[calls.length - 1] ?? 500)
    }

    return { send, calls }
}

const noWait = () => Promise.resolve()

describe('usePresignedUpload', () => {
    it('posts the signed fields first and the file last, and hands back the pending key', async () => {
        const { send, calls } = answering(204)
        const upload = usePresignedUpload({ presign: () => Promise.resolve(FORM), send, wait: noWait })

        expect(await upload.upload(pdf())).toBe(FORM.key)
        expect([...(calls[0]?.keys() ?? [])]).toEqual(['key', 'Content-Type', 'Policy', 'X-Amz-Signature', 'file'])
        expect(upload.state.value).toBe('done')
        expect(upload.progress.value).toBe(1)
    })

    it('tries again after a broken connection or a failing bucket, up to three times', async () => {
        const { send, calls } = answering(0, 503, 204)
        const wait = vi.fn(noWait)
        const upload = usePresignedUpload({ presign: () => Promise.resolve(FORM), send, wait })

        expect(await upload.upload(pdf())).toBe(FORM.key)
        expect(calls).toHaveLength(3)
        expect(wait.mock.calls).toEqual([[1000], [3000]])
    })

    it('gives up after three tries with a sentence about the connection', async () => {
        const { send, calls } = answering(0, 0, 0)
        const upload = usePresignedUpload({ presign: () => Promise.resolve(FORM), send, wait: noWait })

        expect(await upload.upload(pdf())).toBeNull()
        expect(calls).toHaveLength(3)
        expect(upload.error.value).toBe(UPLOAD_SENTENCES.connection)
    })

    it('does not retry what the bucket refused', async () => {
        const { send, calls } = answering(403)
        const upload = usePresignedUpload({ presign: () => Promise.resolve(FORM), send, wait: noWait })

        expect(await upload.upload(pdf())).toBeNull()
        expect(calls).toHaveLength(1)
        expect(upload.error.value).toBe(UPLOAD_SENTENCES.refused)
    })

    it('stops before sending what is not a PDF, or is larger than the form allows', async () => {
        const { send, calls } = answering(204)
        const upload = usePresignedUpload({ presign: () => Promise.resolve({ ...FORM, maxBytes: 5 }), send, wait: noWait })

        expect(await upload.upload(new File(['x'], 'bild.png', { type: 'image/png' }))).toBeNull()
        expect(upload.error.value).toBe(UPLOAD_SENTENCES.notPdf)
        expect(await upload.upload(pdf(10))).toBeNull()
        expect(upload.error.value).toBe('Die Datei ist größer als 0 MB.')
        expect(calls).toHaveLength(0)
    })

    it('says so when no form could be had', async () => {
        const upload = usePresignedUpload({ presign: () => Promise.resolve(null), send: answering(204).send, wait: noWait })

        expect(await upload.upload(pdf())).toBeNull()
        expect(upload.error.value).toBe(UPLOAD_SENTENCES.start)
    })

    it('knows which answers are worth another try', () => {
        expect([0, 408, 429, 500, 503].every(retryable)).toBe(true)
        expect([400, 403, 413].some(retryable)).toBe(false)
        expect(tooLarge(200 * 1024 * 1024)).toBe('Die Datei ist größer als 200 MB.')
    })
})
