/**
 * The fallback ladder — 3D → sequence → poster — decided once per mount from what the browser
 * reports. `decideStage` is pure so the decision is unit-tested; `probe()` and `whenIdleInView()`
 * are the only functions that read the browser, and only from `onMounted`.
 *
 * The rules (home-overhaul.md §4.1): the 3D chunk loads only on the desktop document, at ≥ 1024
 * px, with a fine hovering pointer, motion allowed, no data-saver, WebGL2 present, and only after
 * the poster has loaded, the browser is idle and the frame is at least half in view. Reduced
 * motion always means the poster — nothing else is even probed.
 */

import type { Stage } from './types'

export interface LadderEnv {
    /** The server's device decision (`usePage().props.isMobile`) — the phone document never mounts WebGL. */
    isMobile: boolean
    reducedMotion: boolean
    finePointer: boolean
    viewportWidth: number
    saveData: boolean
    webgl2: boolean
    hasModel: boolean
    hasSequence: boolean
}

export const MIN_VIEWPORT = 1024

/** Whether anything beyond the poster may be attempted at all. */
export function motionAllowed(env: Pick<LadderEnv, 'isMobile' | 'reducedMotion' | 'finePointer' | 'viewportWidth'>): boolean {
    return !env.isMobile && !env.reducedMotion && env.finePointer && env.viewportWidth >= MIN_VIEWPORT
}

export function decideStage(env: LadderEnv): Stage {
    if (!motionAllowed(env)) {
        return 'poster'
    }

    if (env.webgl2 && env.hasModel && !env.saveData) {
        return '3d'
    }

    return env.hasSequence ? 'sequence' : 'poster'
}

/** Read the browser once. Called from `onMounted` only. */
export function probe(isMobile: boolean, hasModel: boolean, hasSequence: boolean): LadderEnv {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const viewportWidth = window.innerWidth
    const base = { isMobile, reducedMotion, finePointer, viewportWidth, saveData: false, webgl2: false, hasModel, hasSequence }

    // Nothing else is probed unless motion is allowed — no WebGL context is created for a poster.
    if (!motionAllowed(base)) {
        return base
    }

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection

    return { ...base, saveData: connection?.saveData === true, webgl2: hasWebgl2() }
}

/** Renderers that are WebGL in name only: the page would spend the CPU the poster does not need. */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|mesa offscreen|basic render/i

/**
 * WebGL2 on a real GPU. The probe context is left to the garbage collector on purpose: losing
 * it by hand makes Firefox print "WebGL context was lost" to the console, which the console
 * gate rightly treats as a warning.
 */
export function hasWebgl2(): boolean {
    try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) as
            | (Partial<WebGL2RenderingContext> & { isContextLost?: () => boolean })
            | null

        if (gl === null || gl.isContextLost?.() === true) {
            return false
        }

        const debug = gl.getExtension?.('WEBGL_debug_renderer_info') as { UNMASKED_RENDERER_WEBGL: number } | null | undefined
        const renderer = debug && gl.getParameter ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : ''

        return !SOFTWARE_RENDERER.test(renderer)
    } catch {
        return false
    }
}

/**
 * Resolve once the element is at least `ratio` in view and the browser has had an idle moment
 * (`requestIdleCallback`, 2 s timeout; a `setTimeout` where the API is missing). The returned
 * function cancels both, for an unmount before the moment comes.
 */
export function whenIdleInView(el: Element, ratio: number, onReady: () => void): () => void {
    let observer: IntersectionObserver | null = null
    let idle: number | null = null
    let done = false

    const finish = (): void => {
        if (done) {
            return
        }

        done = true
        observer?.disconnect()
        onReady()
    }

    const idleThen = (): void => {
        if (typeof window.requestIdleCallback === 'function') {
            idle = window.requestIdleCallback(finish, { timeout: 2000 })
        } else {
            idle = window.setTimeout(finish, 200)
        }
    }

    if (typeof IntersectionObserver === 'undefined') {
        idleThen()
    } else {
        observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= ratio)) {
                    observer?.disconnect()
                    observer = null
                    idleThen()
                }
            },
            { threshold: [ratio] },
        )
        observer.observe(el)
    }

    return () => {
        done = true
        observer?.disconnect()

        if (idle !== null) {
            if (typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idle)
            }

            window.clearTimeout(idle)
        }
    }
}

/**
 * The band's progress through the viewport without a scroll listener: two sentinels — one hanging
 * a viewport's height below the element's top, one standing a viewport's height above its bottom
 * — cross the viewport's edges throughout the whole `view()` range, so an observer with fine
 * thresholds fires continuously while the element travels from the bottom edge to the top edge.
 * Each callback reads the element's own rectangle and reports progress 0 → 1, the same range the
 * poster's CSS `view()` timeline covers. Returns the disconnect.
 */
export function observeViewProgress(el: HTMLElement, sentinels: readonly Element[], onProgress: (progress: number) => void): () => void {
    if (typeof IntersectionObserver === 'undefined') {
        return () => {}
    }

    const steps = 250
    const thresholds = Array.from({ length: steps + 1 }, (_, i) => i / steps)
    const observer = new IntersectionObserver(
        (entries) => {
            const viewport = entries[0]?.rootBounds?.height ?? window.innerHeight
            const rect = el.getBoundingClientRect()
            const progress = (viewport - rect.top) / (viewport + rect.height)

            onProgress(Math.min(1, Math.max(0, progress)))
        },
        { threshold: thresholds },
    )

    for (const s of sentinels) {
        observer.observe(s)
    }

    return () => observer.disconnect()
}
