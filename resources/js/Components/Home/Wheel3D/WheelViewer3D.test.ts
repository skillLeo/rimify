import { renderToString } from '@vue/server-renderer'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import type { ImageManifest } from '../../Ui/Picture.vue'
import { HERO_MODEL_3D as model } from './model'
import type { SequenceManifest } from './types'

const current: { props: Record<string, unknown> } = { props: { isMobile: false } }

vi.mock('@inertiajs/vue3', () => ({ usePage: () => current }))

/* The 3D chunk, replaced: counts its imports and lets a test fire the scene's events. */
const sceneImports = vi.fn()
const scene: { ready?: () => void; failed?: () => void; lost?: () => void; roll?: () => number } = {}

vi.mock('./WheelScene.vue', () => {
    sceneImports()

    return {
        default: defineComponent({
            props: {
                model: { type: Object, default: null },
                hdri: { type: String, default: '' },
                finish: { type: Object, default: null },
                tyre: { type: Object, default: null },
                roll: { type: Number, default: 0 },
                eased: Boolean,
            },
            emits: ['ready', 'failed', 'lost'],
            setup(props, { emit }) {
                scene.ready = () => emit('ready')
                scene.failed = () => emit('failed')
                scene.lost = () => emit('lost')
                scene.roll = () => props.roll ?? 0

                return () => h('canvas', { class: 'mock-scene', 'data-roll': props.roll, 'data-eased': String(props.eased) })
            },
        }),
    }
})

const { default: WheelViewer3D } = await import('./WheelViewer3D.vue')

const poster: ImageManifest = {
    name: 'hero-wheel',
    base: '/images/hero-wheel/hero-wheel',
    width: 1136,
    height: 1136,
    widths: [480, 768, 1136],
    placeholder: '',
    fallback: 'png',
}

const sequence: SequenceManifest = {
    base: '/images/hero-wheel-seq',
    widths: [480, 768],
    width: 768,
    height: 768,
    fallback: 'png',
    yaw: { anglesDeg: [-10, -5, 0, 5, 10] },
    roll: { frames: 12, stepDeg: 3 },
}

function media(reduced: boolean, fine = true): void {
    vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
            matches: query.includes('reduced-motion') ? reduced : fine,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
        })),
    )
}

/** An observer that reports every observed element in view at once, with a 900 px viewport. */
function intersecting(): void {
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            private readonly cb: IntersectionObserverCallback

            constructor(cb: IntersectionObserverCallback) {
                this.cb = cb
            }

            observe(target: Element): void {
                this.cb(
                    [{ isIntersecting: true, intersectionRatio: 1, target, rootBounds: { height: 900 } } as unknown as IntersectionObserverEntry],
                    this as unknown as IntersectionObserver,
                )
            }

            disconnect(): void {}

            unobserve(): void {}
        },
    )
}

function webgl(present: boolean): void {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value: () => (present ? { getExtension: () => null } : null),
        configurable: true,
        writable: true,
    })
}

let mounted: VueWrapper[] = []
const nativeRect = HTMLElement.prototype.getBoundingClientRect

/** Where every box stands: half way down a 900 px viewport, 416 px tall — the observer reads it during mount. */
function boxesAt(top: number, height: number): void {
    HTMLElement.prototype.getBoundingClientRect = () => ({ top, height, left: 0, width: height, bottom: top + height, right: height, x: 0, y: top, toJSON: () => ({}) }) as DOMRect
}

function mountViewer(props: Record<string, unknown> = {}): VueWrapper {
    const wrapper = mount(WheelViewer3D, {
        props: { poster, alt: 'Symbolbild', model, ...props },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

beforeEach(() => {
    current.props = { isMobile: false }
    media(false)
    intersecting()
    vi.stubGlobal('innerWidth', 1440)
    vi.stubGlobal('requestIdleCallback', (cb: () => void) => {
        cb()

        return 1
    })
    vi.stubGlobal('cancelIdleCallback', () => {})
    webgl(true)
    Object.defineProperty(HTMLImageElement.prototype, 'complete', { get: () => false, configurable: true })
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    document.body.innerHTML = ''
    HTMLElement.prototype.getBoundingClientRect = nativeRect
    vi.unstubAllGlobals()
})

describe('WheelViewer3D on the server', () => {
    it('renders the poster and nothing else: no canvas, no chunk, the stage marked poster', async () => {
        const html = await renderToString(createSSRApp({ render: () => h(WheelViewer3D, { poster, alt: 'Symbolbild', model }) }))

        expect(html).toContain('<picture')
        expect(html).toContain('data-stage="poster"')
        expect(html).toContain('alt="Symbolbild"')
        expect(html).not.toContain('<canvas')
        expect(html).not.toContain('viewer__canvas')
        expect(html).not.toContain('viewer__frame')
        expect(sceneImports).not.toHaveBeenCalled()
    })

    it('renders the band the same way, with the poster inset for the tyre and the roll at 0', async () => {
        const html = await renderToString(
            createSSRApp({ render: () => h(WheelViewer3D, { poster, alt: 'Komplettrad', model, mode: 'band', tyre: { widthMm: 225, aspect: 45 } }) }),
        )

        expect(html).toContain('data-stage="poster"')
        expect(html).toContain('data-roll="0.0"')
        expect(html).toMatch(/inset:\s*1\d\.\d+%/)
        expect(html).not.toContain('<canvas')
        expect(sceneImports).not.toHaveBeenCalled()
    })
})

describe('WheelViewer3D under reduced motion', () => {
    it('never mounts WebGL and never imports the chunk, even with the poster loaded and the box in view', async () => {
        media(true)
        const wrapper = mountViewer()

        await wrapper.find('img').trigger('load')
        await flushPromises()
        await nextTick()

        expect(wrapper.emitted('loaded')).toHaveLength(1)
        expect(wrapper.find('.viewer').attributes('data-stage')).toBe('poster')
        expect(wrapper.find('.viewer__canvas').exists()).toBe(false)
        expect(wrapper.find('.mock-scene').exists()).toBe(false)
        expect(wrapper.emitted('stage')).toBeUndefined()
        expect(sceneImports).not.toHaveBeenCalled()
    })

    it('stays on the poster on the phone document and on a coarse pointer', async () => {
        current.props = { isMobile: true }
        const phone = mountViewer()
        await phone.find('img').trigger('load')
        await flushPromises()
        expect(phone.find('.viewer').attributes('data-stage')).toBe('poster')

        current.props = { isMobile: false }
        media(false, false)
        const coarse = mountViewer()
        await coarse.find('img').trigger('load')
        await flushPromises()
        expect(coarse.find('.viewer').attributes('data-stage')).toBe('poster')
        expect(sceneImports).not.toHaveBeenCalled()
    })
})

describe('WheelViewer3D without WebGL', () => {
    it('falls to the poster when the context cannot be created, without importing the chunk', async () => {
        webgl(false)
        const wrapper = mountViewer()

        await wrapper.find('img').trigger('load')
        await flushPromises()

        expect(wrapper.find('.viewer').attributes('data-stage')).toBe('poster')
        expect(wrapper.find('.viewer__canvas').exists()).toBe(false)
        expect(sceneImports).not.toHaveBeenCalled()
    })

    it('falls to the image sequence when one is shipped, and picks the frame from the roll', async () => {
        webgl(false)
        const wrapper = mountViewer({ sequence })
        await flushPromises()

        expect(wrapper.find('.viewer').attributes('data-stage')).toBe('sequence')
        expect(wrapper.emitted('stage')).toEqual([['sequence']])
        const frames = wrapper.findAll('.viewer__frame')
        expect(frames).toHaveLength(5)
        expect(frames[2]!.classes()).toContain('is-active')
        expect(frames[2]!.find('img').attributes('src')).toBe('/images/hero-wheel-seq/yaw-0-768.png')
        expect(frames[0]!.find('img').attributes('loading')).toBe('lazy')

        await wrapper.setProps({ roll: 8 })
        expect(wrapper.findAll('.viewer__frame.is-active')).toHaveLength(1)
        expect(wrapper.find('.viewer__frame.is-active img').attributes('src')).toBe('/images/hero-wheel-seq/yaw-10-768.png')

        await wrapper.setProps({ roll: -3 })
        expect(wrapper.find('.viewer__frame.is-active img').attributes('src')).toBe('/images/hero-wheel-seq/yaw-m5-768.png')
        expect(sceneImports).not.toHaveBeenCalled()
    })
})

describe('WheelViewer3D with WebGL', () => {
    it('mounts the chunk only after the poster has loaded, the box is in view and the browser is idle; the poster stays in the DOM', async () => {
        const wrapper = mountViewer({ roll: 4 })
        await flushPromises()

        // Not before the poster: the LCP element is never contested.
        expect(wrapper.find('.viewer__canvas').exists()).toBe(false)
        expect(sceneImports).not.toHaveBeenCalled()

        await wrapper.find('img').trigger('load')
        await flushPromises()
        await nextTick()

        expect(sceneImports).toHaveBeenCalledTimes(1)
        const canvas = wrapper.find('.viewer__canvas')
        expect(canvas.exists()).toBe(true)
        expect(canvas.classes()).not.toContain('is-ready')
        expect(canvas.attributes('aria-hidden')).toBe('true')
        expect(wrapper.find('.viewer').attributes('data-stage')).toBe('poster')
        expect(wrapper.find('.mock-scene').attributes('data-roll')).toBe('4')
        expect(wrapper.find('.mock-scene').attributes('data-eased')).toBe('true')

        scene.ready?.()
        await nextTick()

        expect(wrapper.find('.viewer').attributes('data-stage')).toBe('3d')
        expect(wrapper.find('.viewer').classes()).toContain('viewer--3d')
        expect(wrapper.find('.viewer__canvas').classes()).toContain('is-ready')
        expect(wrapper.emitted('ready')).toHaveLength(1)
        expect(wrapper.emitted('stage')).toEqual([['3d']])
        const targets = wrapper.emitted('targets')?.[0]?.[0] as Record<string, { tx: number; ty: number }>
        expect(Object.keys(targets).sort()).toEqual(['boltCircle', 'centreBore', 'offset', 'widthDiameter'])
        expect(targets.widthDiameter).toEqual(model.targets2d.widthDiameter)
        // The poster is still there beneath the canvas.
        expect(wrapper.find('.viewer__poster img').exists()).toBe(true)

        await wrapper.setProps({ roll: -8 })
        expect(wrapper.find('.mock-scene').attributes('data-roll')).toBe('-8')
    })

    it('drops to the poster silently when the scene fails to load or the context is lost', async () => {
        const wrapper = mountViewer()
        await wrapper.find('img').trigger('load')
        await flushPromises()
        await nextTick()
        expect(wrapper.find('.viewer__canvas').exists()).toBe(true)

        scene.failed?.()
        await nextTick()
        expect(wrapper.find('.viewer__canvas').exists()).toBe(false)
        expect(wrapper.find('.viewer').attributes('data-stage')).toBe('poster')
        expect(wrapper.text()).toBe('')

        const second = mountViewer()
        await second.find('img').trigger('load')
        await flushPromises()
        await nextTick()
        scene.ready?.()
        await nextTick()
        expect(second.find('.viewer').attributes('data-stage')).toBe('3d')

        scene.lost?.()
        await nextTick()
        expect(second.find('.viewer').attributes('data-stage')).toBe('poster')
        expect(second.find('.viewer__canvas').exists()).toBe(false)
        expect(second.find('.viewer__poster img').exists()).toBe(true)
    })

    it('in the band, reads the roll from the box progress through the viewport and sets it without easing', async () => {
        // Half way: the box's top is 450 px below a 900 px viewport's top, the box 416 tall → 0,342.
        boxesAt(450, 416)
        const wrapper = mountViewer({ mode: 'band', tyre: { widthMm: 225, aspect: 45 } })

        await wrapper.find('img').trigger('load')
        await flushPromises()
        await nextTick()

        // Two sentinels, one observer callback each; both report the same progress.
        expect(wrapper.findAll('.viewer__sentinel')).toHaveLength(2)
        expect(wrapper.find('.viewer').attributes('data-roll')).toBe('-41.0')
        expect(wrapper.emitted('roll')).toEqual([[-41]])
        expect(wrapper.find('.mock-scene').attributes('data-eased')).toBe('false')
        expect(wrapper.find('.mock-scene').attributes('data-roll')).toBe('-41')
        expect(wrapper.find('.viewer__poster').attributes('style')).toMatch(/inset:\s*1\d\.\d+%/)
    })

    it('in the band sequence, picks the frame within one spoke period', async () => {
        webgl(false)
        boxesAt(450, 416)
        const wrapper = mountViewer({ mode: 'band', tyre: { widthMm: 225, aspect: 45 }, sequence })
        await flushPromises()

        expect(wrapper.find('.viewer').attributes('data-stage')).toBe('sequence')
        expect(wrapper.findAll('.viewer__frame')).toHaveLength(12)
        // −41° → 41 mod 36 = 5° → frame 2 (3° steps).
        expect(wrapper.find('.viewer__frame.is-active img').attributes('src')).toBe('/images/hero-wheel-seq/roll-02-768.png')
    })
})
