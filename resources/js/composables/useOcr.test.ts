import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OCR_PARAMETERS, useOcr } from './useOcr'

/*
 * EIGENE-FUNDE 136: every photograph read on the device logged „Estimating resolution as 588“ as a console error —
 * Tesseract's own diagnostics on stderr. The worker is set to print them to /dev/null; proven on the shop's engine and
 * language data (16.10.2026): the same text is read, and nothing reaches stderr.
 */

const tesseract = vi.hoisted(() => {
    const setParameters = vi.fn(async (params: Record<string, unknown>) => params)
    const recognize = vi.fn(async () => ({ data: { text: '8.1 1120\n8.2 1180\nT 250' } }))

    return { setParameters, recognize, createWorker: vi.fn(async () => ({ setParameters, recognize, terminate: vi.fn() })) }
})

vi.mock('tesseract.js', () => ({ createWorker: tesseract.createWorker, PSM: { AUTO: '3' } }))

function reader(): ReturnType<typeof useOcr> {
    let ocr: ReturnType<typeof useOcr> | null = null
    mount(defineComponent({ setup: () => ((ocr = useOcr()), () => h('div')) }))

    return ocr as unknown as ReturnType<typeof useOcr>
}

describe('useOcr', () => {
    beforeEach(() => {
        vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 4, height: 2, close: vi.fn() })))
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            drawImage: vi.fn(),
            getImageData: () => ({ data: new Uint8ClampedArray(4 * 4 * 2) }),
            putImageData: vi.fn(),
        } as unknown as CanvasRenderingContext2D)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
        tesseract.createWorker.mockClear()
        tesseract.setParameters.mockClear()
    })

    it('sends the engine\'s own diagnostics to /dev/null, so a photograph writes no error to the console', async () => {
        const text = await reader().read(new File(['x'], 'zb.png', { type: 'image/png' }))

        expect(text).toContain('1120')
        expect(OCR_PARAMETERS).toEqual({ debug_file: '/dev/null' })
        expect(tesseract.setParameters).toHaveBeenCalledWith(expect.objectContaining({ tessedit_pageseg_mode: '3', debug_file: '/dev/null' }))
    })

    it('loads the engine from our own origin, never from a blob or a CDN (CSP)', async () => {
        await reader().read(new File(['x'], 'zb.png', { type: 'image/png' }))

        expect(tesseract.createWorker).toHaveBeenCalledWith('deu', 1, expect.objectContaining({ workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr', workerBlobURL: false }))
    })
})
