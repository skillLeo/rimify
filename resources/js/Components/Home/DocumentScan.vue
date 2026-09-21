<script setup lang="ts">
/**
 * F5 — the Fahrzeugschein scan: one photo, read on the customer's own device.
 *
 * The photo never leaves the browser. It is drawn onto a canvas (greyscale, more contrast, the
 * longest side about 1600 px — what the OCR engine reads best), handed to a Tesseract worker that
 * is loaded only after the tap, from our own origin, and the two key numbers are read from the
 * text by `lib/fahrzeugschein`. What was read is shown for confirmation and can be edited before
 * it is used; nothing is used unread.
 *
 * This component only emits: `confirm` with the two numbers, `failed` when nothing could be read.
 * The selector puts them into its own HSN and TSN fields.
 */

import type { Worker as OcrWorker } from 'tesseract.js'
import { nextTick, onBeforeUnmount, ref, useId } from 'vue'
import Icon from '../Ui/Icon.vue'
import { cleanHsn, cleanTsn, isHsn, isTsn, parseKeyNumbers } from '../../lib/fahrzeugschein'

const emit = defineEmits<{
    confirm: [value: { hsn: string; tsn: string }]
    failed: []
}>()

type Phase = 'idle' | 'busy' | 'confirm' | 'failed'

/* Self-hosted: the worker, the core builds and the language data live under public/ocr (CSP). */
const OCR_BASE = '/ocr'
const LONGEST_SIDE_PX = 1600
const CONTRAST = 1.5
const TIMEOUT_MS = 45_000

const id = useId()
const phase = ref<Phase>('idle')
const hsn = ref('')
const tsn = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const hsnField = ref<HTMLInputElement | null>(null)

let worker: OcrWorker | null = null

function pick(): void {
    fileInput.value?.click()
}

async function onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    // Cleared at once, so the same photo can be taken again after a failure.
    input.value = ''

    if (file === undefined) {
        return
    }

    phase.value = 'busy'

    try {
        const text = await withTimeout(recognise(file), TIMEOUT_MS)
        const found = parseKeyNumbers(text)

        if (found.hsn === null && found.tsn === null) {
            fail()

            return
        }

        hsn.value = found.hsn ?? ''
        tsn.value = found.tsn ?? ''
        phase.value = 'confirm'
        await nextTick()
        hsnField.value?.focus()
    } catch {
        fail()
    }
}

function fail(): void {
    phase.value = 'failed'
    void worker?.terminate()
    worker = null
    emit('failed')
}

function reset(): void {
    phase.value = 'idle'
}

function confirm(): void {
    if (!isHsn(hsn.value) || !isTsn(tsn.value)) {
        return
    }

    emit('confirm', { hsn: hsn.value, tsn: tsn.value })
    phase.value = 'idle'
}

function onHsn(event: Event): void {
    hsn.value = cleanHsn((event.target as HTMLInputElement).value)
}

function onTsn(event: Event): void {
    tsn.value = cleanTsn((event.target as HTMLInputElement).value)
}

/* ── The picture, made readable ──────────────────────────────────────────────── */

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

/* ── The engine, loaded on demand from our own origin ────────────────────────── */

async function recognise(file: File): Promise<string> {
    const canvas = await preprocess(file)
    const { createWorker, PSM } = await import('tesseract.js')

    if (worker === null) {
        worker = await createWorker('deu', 1, {
            workerPath: `${OCR_BASE}/worker.min.js`,
            corePath: OCR_BASE,
            langPath: OCR_BASE,
            // A blob: URL is not 'self'; the worker is loaded straight from its path.
            workerBlobURL: false,
            gzip: true,
            errorHandler: () => {},
        })
        await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO })
    }

    const { data } = await worker.recognize(canvas)

    return data.text
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

onBeforeUnmount(() => {
    void worker?.terminate()
    worker = null
})
</script>

<template>
    <div class="scan">
        <label :for="`${id}-file`" class="visually-hidden">Foto der Zulassungsbescheinigung Teil I</label>
        <input
            :id="`${id}-file`"
            ref="fileInput"
            class="visually-hidden"
            type="file"
            accept="image/*"
            capture="environment"
            tabindex="-1"
            @change="onFile"
        />

        <template v-if="phase !== 'confirm'">
            <button
                class="btn btn--secondary btn--block"
                type="button"
                :aria-busy="phase === 'busy' ? 'true' : undefined"
                :disabled="phase === 'busy'"
                @click="pick"
            >
                <Icon name="camera" :size="20" />
                Fahrzeugschein fotografieren
            </button>

            <p class="small quiet scan__privacy">
                Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen.
            </p>

            <p v-if="phase === 'busy'" class="small muted scan__status" role="status">Erkennung läuft …</p>

            <p v-if="phase === 'failed'" class="notice scan__failed" role="alert">
                Wir konnten HSN und TSN nicht lesen. Trag sie bitte von Hand ein.
            </p>
        </template>

        <div v-else class="scan__confirm">
            <p class="label">Stimmt das?</p>

            <div class="scan__keys">
                <div class="form-field">
                    <label class="form-field__label" :for="`${id}-hsn`">HSN (Feld 2.1)</label>
                    <input
                        :id="`${id}-hsn`"
                        ref="hsnField"
                        class="input input--code"
                        :value="hsn"
                        inputmode="numeric"
                        maxlength="4"
                        autocomplete="off"
                        enterkeyhint="next"
                        :aria-invalid="hsn !== '' && !isHsn(hsn) ? 'true' : undefined"
                        @input="onHsn"
                    />
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="`${id}-tsn`">TSN (Feld 2.2)</label>
                    <input
                        :id="`${id}-tsn`"
                        class="input input--code"
                        :value="tsn"
                        maxlength="3"
                        autocapitalize="characters"
                        autocomplete="off"
                        enterkeyhint="done"
                        :aria-invalid="tsn !== '' && !isTsn(tsn) ? 'true' : undefined"
                        @input="onTsn"
                    />
                </div>
            </div>

            <div class="scan__actions">
                <button
                    class="btn btn--secondary"
                    type="button"
                    :disabled="!isHsn(hsn) || !isTsn(tsn)"
                    @click="confirm"
                >
                    Übernehmen
                </button>
                <button class="link small" type="button" @click="reset">Noch einmal fotografieren</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.scan {
    display: grid;
    gap: var(--sp-12);
}

.scan__privacy {
    margin: 0;
}

.scan__status {
    margin: 0;
}

.scan__failed {
    margin: 0;
}

.scan__confirm {
    display: grid;
    gap: var(--sp-12);
}

.scan__keys {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--gutter);
}

.scan__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-16);
}
</style>
