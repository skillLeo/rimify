import { afterEach, describe, expect, it, vi } from 'vitest'
import { finishFor, roughnessFor } from './finish'
import { decideStage, hasWebgl2, motionAllowed, type LadderEnv } from './ladder'
import { HERO_MODEL_3D as model } from './model'
import { boxToFrame, cameraDistanceMm, framing, projectTargets, SLOT_KEYS, tyreOuterRadiusMm, tyreSectionFromTitle } from './targets'
import { tyreProfile } from './tyre'

describe('the 3D manifest', () => {
    it('is the hero configuration, a parametric CC0 mesh under 1,5 MB, served same-origin', () => {
        expect(model.url).toBe('/3d/wheel-10.glb')
        expect(model.bytes).toBeLessThanOrEqual(1.5 * 1024 * 1024)
        expect(model.licence).toMatch(/CC0/)
        expect(model.spokes).toBe(10)
        expect(model).toMatchObject({ widthIn: 8.5, diameterIn: 19, etMm: 35, boltHoles: 5, boltCircleMm: 112, boreMm: 66.6 })
        // The flange radius: 19" seat plus the lip.
        expect(model.rimRadiusMm).toBeCloseTo((19 * 25.4) / 2 + 14, 1)
    })

    it('carries the poster calibration: the wheel fills the square canvas, centred', () => {
        expect(model.poster.fraction).toBeGreaterThan(0.9)
        expect(model.poster.fraction).toBeLessThanOrEqual(1)
        expect(model.poster.centreX).toBeCloseTo(0.5, 2)
        expect(model.poster.centreY).toBeCloseTo(0.5, 2)
    })
})

describe('projectTargets', () => {
    it('reproduces the manifest targets2d exactly — the build script and the viewer agree', () => {
        const projected = projectTargets(model)

        for (const key of SLOT_KEYS) {
            expect(projected[key].tx).toBeCloseTo(model.targets2d[key].tx, 1)
            expect(projected[key].ty).toBeCloseTo(model.targets2d[key].ty, 1)
        }
    })

    it('puts every target inside the box, on its clock position', () => {
        const t = projectTargets(model)

        for (const key of SLOT_KEYS) {
            expect(t[key].tx).toBeGreaterThan(0)
            expect(t[key].tx).toBeLessThan(100)
            expect(t[key].ty).toBeGreaterThan(0)
            expect(t[key].ty).toBeLessThan(100)
        }

        // The lip at 10 o'clock: upper left, near the edge.
        expect(t.widthDiameter.tx).toBeLessThan(15)
        expect(t.widthDiameter.ty).toBeLessThan(35)
        // The hub face just right of the bore, and the bore's edge lower left of centre.
        expect(t.offset.tx).toBeGreaterThan(55)
        expect(t.centreBore.tx).toBeLessThan(50)
        expect(t.centreBore.ty).toBeGreaterThan(50)
        // The bolt at 4 o'clock: lower right of centre.
        expect(t.boltCircle.tx).toBeGreaterThan(50)
        expect(t.boltCircle.ty).toBeGreaterThan(50)
    })

    it('frames the rim to the poster fraction in the hero, and rim plus tyre to 96 % in the band', () => {
        const hero = framing(model, null)
        expect(hero.fraction).toBe(model.poster.fraction)
        expect(hero.rimFraction).toBe(model.poster.fraction)
        expect(hero.distanceMm).toBeCloseTo(cameraDistanceMm(model.fovDeg, model.rimRadiusMm, model.lipZMm, model.poster.fraction), 6)

        const band = framing(model, { widthMm: 225, aspect: 45 })
        expect(band.fraction).toBe(0.96)
        expect(band.rimFraction).toBeLessThan(band.fraction)
        expect(band.rimFraction).toBeGreaterThan(0.6)
        expect(band.distanceMm).toBeGreaterThan(hero.distanceMm)
        expect(tyreOuterRadiusMm(model, { widthMm: 225, aspect: 45 })).toBeCloseTo(241.3 + 101.25, 1)
    })
})

describe('boxToFrame', () => {
    it('maps a box percentage into the frame through both rectangles', () => {
        const frame = { left: 100, top: 50, width: 800, height: 600 }
        const box = { left: 300, top: 100, width: 400, height: 400 }

        expect(boxToFrame({ tx: 50, ty: 50 }, box, frame)).toEqual({ tx: 50, ty: 41.67 })
        expect(boxToFrame({ tx: 0, ty: 0 }, box, frame)).toEqual({ tx: 25, ty: 8.33 })
    })

    it('returns the target untouched for a frame without a size', () => {
        expect(boxToFrame({ tx: 12, ty: 34 }, { left: 0, top: 0, width: 0, height: 0 }, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ tx: 12, ty: 34 })
    })
})

describe('tyreSectionFromTitle', () => {
    it('reads the section from the featured tyre title', () => {
        expect(tyreSectionFromTitle('Continental PremiumContact 7 225/45 R17 94W')).toEqual({ widthMm: 225, aspect: 45 })
        expect(tyreSectionFromTitle('Michelin Pilot Sport 4 245/35 ZR19 93Y')).toEqual({ widthMm: 245, aspect: 35 })
    })

    it('invents nothing from a title without a size', () => {
        expect(tyreSectionFromTitle('Sommerreifen')).toBeNull()
        expect(tyreSectionFromTitle(null)).toBeNull()
        expect(tyreSectionFromTitle(undefined)).toBeNull()
    })
})

describe('tyreProfile', () => {
    it('is a closed loop from the bead over the tread and back, with the grooves cut in', () => {
        const points = tyreProfile(model, { widthMm: 225, aspect: 45 })
        const seat = (19 * 25.4) / 2
        const outer = seat + 101.25

        expect(points[0]).toEqual(points[points.length - 1])
        expect(Math.max(...points.map((p) => p.r))).toBeCloseTo(outer, 6)
        expect(Math.min(...points.map((p) => p.r))).toBeCloseTo(seat + 1, 6)
        expect(Math.max(...points.map((p) => p.z))).toBeCloseTo(112.5, 6)
        expect(Math.min(...points.map((p) => p.z))).toBeCloseTo(-112.5, 6)
        expect(points.filter((p) => p.r === outer - 7)).toHaveLength(8)
    })
})

describe('finishFor', () => {
    it('grades the roughness by the spec words and defaults to glossy silver', () => {
        expect(roughnessFor('Silber matt')).toBe(0.55)
        expect(roughnessFor('Schwarz glänzend')).toBe(0.18)
        expect(roughnessFor('Silber poliert')).toBe(0.08)
        expect(finishFor('Silber')).toEqual({ color: '#c9ccd1', roughness: 0.18, metalness: 1 })
        expect(finishFor('Bronze matt')).toEqual({ color: '#8a6a45', roughness: 0.55, metalness: 1 })
        expect(finishFor('Weiß')).toMatchObject({ metalness: 0.2 })
        expect(finishFor('Irgendwas')).toEqual(finishFor('Silber'))
    })
})

describe('decideStage', () => {
    const desktop: LadderEnv = {
        isMobile: false,
        reducedMotion: false,
        finePointer: true,
        viewportWidth: 1440,
        saveData: false,
        webgl2: true,
        hasModel: true,
        hasSequence: true,
    }

    it('mounts 3D only on a desktop document with a fine pointer, motion, WebGL2 and a model', () => {
        expect(decideStage(desktop)).toBe('3d')
    })

    it('is the poster, and probes nothing, under reduced motion, on the phone document, below 1024 or on a coarse pointer', () => {
        expect(decideStage({ ...desktop, reducedMotion: true })).toBe('poster')
        expect(decideStage({ ...desktop, isMobile: true })).toBe('poster')
        expect(decideStage({ ...desktop, viewportWidth: 1023 })).toBe('poster')
        expect(decideStage({ ...desktop, finePointer: false })).toBe('poster')
        expect(motionAllowed({ ...desktop, reducedMotion: true })).toBe(false)
    })

    it('drops to the sequence without WebGL2, without a model or with data saver, and to the poster without a sequence', () => {
        expect(decideStage({ ...desktop, webgl2: false })).toBe('sequence')
        expect(decideStage({ ...desktop, hasModel: false })).toBe('sequence')
        expect(decideStage({ ...desktop, saveData: true })).toBe('sequence')
        expect(decideStage({ ...desktop, webgl2: false, hasSequence: false })).toBe('poster')
    })
})

describe('hasWebgl2', () => {
    const RENDERER = 0x1f01

    /** A probe context answering `RENDERER` with `named`, and the debug extension with `unmasked` when asked. */
    function context(named: string, unmasked: string | null): { getExtension: ReturnType<typeof vi.fn>; getParameter: ReturnType<typeof vi.fn> } {
        const getExtension = vi.fn((name: string) => (name === 'WEBGL_debug_renderer_info' && unmasked !== null ? { UNMASKED_RENDERER_WEBGL: 0x9246 } : null))
        const getParameter = vi.fn((p: number) => (p === RENDERER ? named : p === 0x9246 ? unmasked : null))
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
            value: (kind: string, options: { failIfMajorPerformanceCaveat?: boolean }) =>
                kind === 'webgl2' && options?.failIfMajorPerformanceCaveat === true ? { RENDERER, getExtension, getParameter, isContextLost: () => false } : null,
            configurable: true,
            writable: true,
        })

        return { getExtension, getParameter }
    }

    afterEach(() => {
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: () => null, configurable: true, writable: true })
    })

    it('reads RENDERER and never asks the deprecated extension when the string names a GPU', () => {
        const gl = context('ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar', 'Intel')

        expect(hasWebgl2()).toBe(true)
        expect(gl.getExtension).not.toHaveBeenCalled()
    })

    it('asks the extension only behind the generic WebKit string, and rejects a software renderer either way', () => {
        const masked = context('WebKit WebGL', 'Apple M2')
        expect(hasWebgl2()).toBe(true)
        expect(masked.getExtension).toHaveBeenCalledWith('WEBGL_debug_renderer_info')

        context('WebKit WebGL', 'Google SwiftShader')
        expect(hasWebgl2()).toBe(false)

        context('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)', null)
        expect(hasWebgl2()).toBe(false)

        context('llvmpipe (LLVM 15.0.7, 256 bits)', null)
        expect(hasWebgl2()).toBe(false)
    })

    it('is false without a context', () => {
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: () => null, configurable: true, writable: true })
        expect(hasWebgl2()).toBe(false)
    })
})
