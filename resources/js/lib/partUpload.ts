/**
 * A file sent to the server in parts (Fahrzeuge › Import, D-462): announced with its name and size, then part after
 * part in the size the server asks for, then marked complete. No request carries more than the host takes in one, so
 * the file's own size is never the host's question.
 *
 * A part the server answers with 409 did not start where the file on the server ends: the answer says where it does,
 * and the upload goes on from there. A part that gets no answer is sent again, up to five times with growing pauses;
 * after that the upload stops with UploadStalled, which names where it stopped so it can be taken up again.
 */
import { xsrfToken } from './xsrf'

/** The server refused something, said in its own words per field (a 422). */
export class UploadRefused extends Error {
    constructor(public readonly errors: Record<string, string>) {
        super(Object.values(errors)[0] ?? 'Die Datei wurde nicht angenommen.')
    }
}

/** The connection stopped answering: `held` bytes of run `id` are on the server, and the upload can go on from there. */
export class UploadStalled extends Error {
    constructor(
        public readonly id: number,
        public readonly held: number,
        public readonly part: number
    ) {
        super('Die Verbindung zum Server ist abgerissen.')
    }
}

/** Signed out, or no right to it: the page says so, as every admin page does. */
export class UploadForbidden extends Error {}

export interface Started {
    id: number
    part: number
    held: number
    href: string
}

export interface PartUploadOptions {
    file: Blob
    /** Where the file is announced, and what is announced besides its name and size. */
    start: { url: string; body: Record<string, unknown>; name: string }
    partUrl: (id: number) => string
    finishUrl: (id: number) => string
    onProgress?: (sent: number, total: number) => void
    /** For the tests: the network, and the pause between two tries. */
    fetcher?: typeof fetch
    wait?: (ms: number) => Promise<void>
}

const TRIES = 5

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

function headers(json: boolean): Record<string, string> {
    return {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': xsrfToken(),
        ...(json ? { 'Content-Type': 'application/json' } : {}),
    }
}

async function refusal(response: Response): Promise<UploadRefused> {
    const answer = (await response.json().catch(() => ({}))) as { errors?: Record<string, string[] | string> }
    const errors: Record<string, string> = {}

    for (const [field, value] of Object.entries(answer.errors ?? {})) {
        errors[field] = Array.isArray(value) ? (value[0] ?? '') : value
    }

    return new UploadRefused(Object.keys(errors).length ? errors : { file: 'Die Datei wurde nicht angenommen. Lad sie bitte noch einmal hoch.' })
}

function guard(response: Response): void {
    if (response.status === 401 || response.status === 403 || response.status === 419) {
        throw new UploadForbidden(response.status === 403 ? 'Dafür fehlt dir die Berechtigung.' : 'Du bist abgemeldet. Melde dich bitte neu an.')
    }
}

/** Announces the file and sends it whole. Resolves with the run's id and page once the server has it complete. */
export async function uploadInParts(options: PartUploadOptions): Promise<{ id: number; href: string }> {
    const send = options.fetcher ?? fetch
    const response = await send(options.start.url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: headers(true),
        body: JSON.stringify({ ...options.start.body, name: options.start.name, size: options.file.size }),
    }).catch(() => {
        throw new UploadStalled(0, 0, 0)
    })

    guard(response)

    if (response.status === 422) {
        throw await refusal(response)
    }

    if (!response.ok) {
        throw new UploadStalled(0, 0, 0)
    }

    const started = (await response.json()) as Started

    return continueUpload(options, started)
}

/** Sends the file from where the server holds it, then marks it complete. */
export async function continueUpload(options: PartUploadOptions, started: Pick<Started, 'id' | 'part' | 'held'>): Promise<{ id: number; href: string }> {
    const send = options.fetcher ?? fetch
    const wait = options.wait ?? pause
    const total = options.file.size
    const part = Math.max(1, started.part)
    let held = started.held

    options.onProgress?.(held, total)

    while (held < total) {
        const body = new FormData()
        body.append('offset', String(held))
        body.append('part', options.file.slice(held, Math.min(total, held + part)), 'teil')

        let answer: Response | null = null

        for (let attempt = 0; attempt < TRIES && answer === null; attempt++) {
            if (attempt > 0) {
                await wait(1000 * 2 ** (attempt - 1))
            }

            try {
                const response = await send(options.partUrl(started.id), { method: 'POST', credentials: 'same-origin', headers: headers(false), body })

                // A server error is a try that failed, as a lost connection is; anything else is an answer.
                answer = response.status >= 500 ? null : response
            } catch {
                answer = null
            }
        }

        if (answer === null) {
            throw new UploadStalled(started.id, held, part)
        }

        guard(answer)

        if (answer.status === 422) {
            throw await refusal(answer)
        }

        if (answer.status !== 409 && !answer.ok) {
            throw new UploadStalled(started.id, held, part)
        }

        // 200: the part is there; 409: it was out of turn, and the server says where the file stands.
        held = Number(((await answer.json()) as { held: number }).held)
        options.onProgress?.(held, total)
    }

    const finished = await send(options.finishUrl(started.id), { method: 'POST', credentials: 'same-origin', headers: headers(true), body: '{}' }).catch(() => {
        throw new UploadStalled(started.id, held, part)
    })

    guard(finished)

    if (finished.status === 422) {
        throw await refusal(finished)
    }

    if (!finished.ok) {
        throw new UploadStalled(started.id, held, part)
    }

    const done = (await finished.json()) as { href: string }

    return { id: started.id, href: done.href }
}
