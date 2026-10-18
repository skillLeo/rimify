/**
 * Reading a photographed Zulassungsbescheinigung on the customer's own device (F5; Block C, item 10).
 *
 * The photo never leaves the browser. It is drawn onto a canvas (greyscale, more contrast, the longest
 * side about 1600 px — what the OCR engine reads best) and handed to a Tesseract worker that is loaded
 * only after the tap, from our own origin (CSP). What the text means is decided by `lib/fahrzeugschein`;
 * this only turns a photo into text, and gives up after 45 seconds rather than spin.
 */

import type { Worker as OcrWorker } from 'tesseract.js'
import { onBeforeUnmount } from 'vue'

/* Self-hosted: the worker, the core builds and the language data live under public/ocr (CSP). */
const OCR_BASE = '/ocr'
const LONGEST_SIDE_PX = 1600
const CONTRAST = 1.5
const TIMEOUT_MS = 45_000

/*
 * Tesseract prints its diagnostics to stderr, and in the browser stderr is the console's error channel: every photograph
 * — a canvas carries no resolution — logged „Estimating resolution as 588“ as an error (EIGENE-FUNDE 136). They go to
 * /dev/null in the engine's own file system instead; recognition never reads `debug_file`, so the reading is unchanged.
 */
export const OCR_PARAMETERS = { debug_file: '/dev/null' } as const

interface Drawable {
    source: CanvasImageSource
    width: number
    height: number
    release(): void
}

async function load(file: File): Promise<Drawable> {
    if (typeof createImageBitmap === 'function') {
        const bitmap = await createImageBitmap(file)

        return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
    }

    const url = URL.createObjectURL(file)
    const image = new Image()

    await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Bild konnte nicht gelesen werden.'))
        image.src = url
    })

    return {
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        release: () => URL.revokeObjectURL(url),
    }
}

async function preprocess(file: File): Promise<HTMLCanvasElement> {
    const drawable = await load(file)

    try {
        const scale = Math.min(1, LONGEST_SIDE_PX / Math.max(drawable.width, drawable.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(drawable.width * scale))
        canvas.height = Math.max(1, Math.round(drawable.height * scale))

        const context = canvas.getContext('2d', { willReadFrequently: true })

        if (context === null) {
            throw new Error('Kein Canvas.')
        }

        context.drawImage(drawable.source, 0, 0, canvas.width, canvas.height)

        const image = context.getImageData(0, 0, canvas.width, canvas.height)
        const data = image.data

        for (let i = 0; i < data.length; i += 4) {
            const luminance = 0.299 * (data[i] ?? 0) + 0.587 * (data[i + 1] ?? 0) + 0.114 * (data[i + 2] ?? 0)
            const value = Math.max(0, Math.min(255, (luminance - 128) * CONTRAST + 128))
            data[i] = value
            data[i + 1] = value
            data[i + 2] = value
        }

        context.putImageData(image, 0, 0)

        return canvas
    } finally {
        drawable.release()
    }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Zeitüberschreitung.')), ms)
        promise.then(
            (value) => {
                clearTimeout(timer)
                resolve(value)
            },
            (error: unknown) => {
                clearTimeout(timer)
                reject(error instanceof Error ? error : new Error(String(error)))
            }
        )
    })
}

export function useOcr(): { read: (file: File) => Promise<string>; dispose: () => void } {
    let worker: OcrWorker | null = null
    /* Counted up by every dispose: a worker that finishes loading after it is nobody's, and is ended at once. */
    let generation = 0

    async function recognise(file: File): Promise<string> {
        const mine = generation
        const canvas = await preprocess(file)
        const { createWorker, PSM } = await import('tesseract.js')

        if (worker === null) {
            const created = await createWorker('deu', 1, {
                workerPath: `${OCR_BASE}/worker.min.js`,
                corePath: OCR_BASE,
                langPath: OCR_BASE,
                // A blob: URL is not 'self'; the worker is loaded straight from its path.
                workerBlobURL: false,
                gzip: true,
                errorHandler: () => {},
            })

            // Disposed while it loaded — the page left, the scan given up: never kept running (the interaction review).
            if (mine !== generation) {
                void created.terminate()

                throw new Error('Abgebrochen.')
            }

            worker = created
            await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO, ...OCR_PARAMETERS })
        }

        const { data } = await worker.recognize(canvas)

        return data.text
    }

    function dispose(): void {
        generation++
        void worker?.terminate()
        worker = null
    }

    onBeforeUnmount(dispose)

    return { read: (file: File) => withTimeout(recognise(file), TIMEOUT_MS), dispose }
}
