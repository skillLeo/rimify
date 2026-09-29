import { ref } from 'vue'
import { FILE_CHANGED, stillReadable } from '../../lib/file'
import { xsrfToken } from './preferences'

/**
 * A large PDF, from the browser straight into the bucket (App\Services\Storage\PdfUpload): ask the app
 * for a signed form, post the file to it with progress, and retry on its own when the connection or
 * the bucket stumbles — never when the bucket refused the file itself. What comes back is the pending
 * key the feature then confirms; its row is written only after that.
 *
 * Without a bucket the form points at the app's own signed address, so the flow is the same: that
 * one is same-origin and gets the XSRF header; the bucket gets no cookie and no header of ours.
 */

export interface PresignedForm {
    url: string
    fields: Record<string, string>
    key: string
    maxBytes: number
    expiresAt: string
}

export type UploadState = 'idle' | 'uploading' | 'retrying' | 'done' | 'failed'

/** One try: the HTTP status (0 when the connection broke), progress reported along the way. */
export type Sender = (url: string, body: FormData, headers: Record<string, string>, onProgress: (share: number) => void) => Promise<number>

const PRESIGN_URL = '/admin/uploads/pdf'
const ATTEMPTS = 3
const BACKOFF_MS = [1000, 3000]

export const UPLOAD_SENTENCES = {
    notPdf: 'Das ist keine PDF-Datei. Ein Gutachten wird nur im PDF-Format angenommen.',
    start: 'Das Hochladen lässt sich gerade nicht starten. Versuch es bitte gleich noch einmal.',
    refused: 'Der Speicher hat die Datei nicht angenommen. Prüf bitte, ob es die richtige PDF-Datei ist.',
    connection: 'Die Datei konnte nicht hochgeladen werden. Prüf bitte deine Verbindung und versuch es noch einmal.',
} as const

export function tooLarge(maxBytes: number): string {
    return `Die Datei ist größer als ${Math.round(maxBytes / (1024 * 1024))} MB.`
}

/** Worth another try: no answer, a timeout, too many requests, or the bucket's own failure. */
export function retryable(status: number): boolean {
    return status === 0 || status === 408 || status === 429 || status >= 500
}

function sameOrigin(url: string): boolean {
    if (typeof window === 'undefined') {
        return false
    }

    return new URL(url, window.location.href).origin === window.location.origin
}

const xhrSender: Sender = (url, body, headers, onProgress) =>
    new Promise((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url)
        xhr.withCredentials = sameOrigin(url)
        Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value))
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                onProgress(event.loaded / event.total)
            }
        }
        xhr.onload = () => resolve(xhr.status)
        xhr.onerror = () => resolve(0)
        xhr.ontimeout = () => resolve(0)
        xhr.send(body)
    })

async function fetchForm(): Promise<PresignedForm | null> {
    try {
        const response = await fetch(PRESIGN_URL, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': xsrfToken() },
        })

        return response.ok ? ((await response.json()) as PresignedForm) : null
    } catch {
        return null
    }
}

export function usePresignedUpload(options: { presign?: () => Promise<PresignedForm | null>; send?: Sender; wait?: (ms: number) => Promise<void> } = {}) {
    const presign = options.presign ?? fetchForm
    const send = options.send ?? xhrSender
    const wait = options.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)))

    const state = ref<UploadState>('idle')
    const progress = ref(0)
    const attempt = ref(0)
    const error = ref<string | null>(null)

    function fail(sentence: string): null {
        state.value = 'failed'
        error.value = sentence

        return null
    }

    /** The pending key once the bucket has the file; null with `error` set when it does not. */
    async function upload(file: File): Promise<string | null> {
        error.value = null
        progress.value = 0
        attempt.value = 0

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            return fail(UPLOAD_SENTENCES.notPdf)
        }

        // Saved anew since it was chosen: the browser would not send it, and three tries would end in a
        // sentence about the connection (K2-29).
        if (!(await stillReadable(file))) {
            return fail(FILE_CHANGED)
        }

        state.value = 'uploading'
        const form = await presign()

        if (form === null) {
            return fail(UPLOAD_SENTENCES.start)
        }

        if (file.size > form.maxBytes) {
            return fail(tooLarge(form.maxBytes))
        }

        const headers: Record<string, string> = sameOrigin(form.url) ? { 'X-XSRF-TOKEN': xsrfToken(), 'X-Requested-With': 'XMLHttpRequest' } : {}

        for (let n = 1; n <= ATTEMPTS; n++) {
            attempt.value = n
            const body = new FormData()
            Object.entries(form.fields).forEach(([name, value]) => body.append(name, value))
            // The bucket reads every field before the file: the file goes last.
            body.append('file', file)

            const status = await send(form.url, body, headers, (share) => {
                progress.value = share
            })

            if (status >= 200 && status < 300) {
                progress.value = 1
                state.value = 'done'

                return form.key
            }

            if (!retryable(status)) {
                return fail(UPLOAD_SENTENCES.refused)
            }

            if (n < ATTEMPTS) {
                state.value = 'retrying'
                progress.value = 0
                await wait(BACKOFF_MS[n - 1] ?? 3000)
            }
        }

        return fail(UPLOAD_SENTENCES.connection)
    }

    return { state, progress, attempt, error, upload }
}
