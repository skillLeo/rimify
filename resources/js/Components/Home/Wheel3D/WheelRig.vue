<script setup lang="ts">
/**
 * Inside the canvas: the camera on the axle, the wheel (and the band's tyre) under the studio
 * HDRI, and the one thing that moves — a roll about the axle, eased in JS for the cursor, set
 * directly for the scroll. Every step invalidates exactly one on-demand render; an idle stage
 * runs no loop and no requestAnimationFrame at all.
 *
 * Emits `ready` after the first frame that contains the model, `failed` when the GLB or the HDRI
 * does not arrive within eight seconds, and `lost` when the WebGL context goes away.
 */

import { useLoop, useTres } from '@tresjs/core'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import {
    Color,
    EquirectangularReflectionMapping,
    Group,
    LatheGeometry,
    Mesh,
    MeshStandardMaterial,
    Vector2,
    Vector3,
    type BufferGeometry,
    type Material,
    type Object3D,
    type Texture,
} from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { RUBBER } from './finish'
import { framing } from './targets'
import { tyreProfile } from './tyre'
import type { FinishMaterial, Model3dManifest, TyreSection } from './types'

const props = defineProps<{
    model: Model3dManifest
    hdri: string
    finish: FinishMaterial
    tyre: TyreSection | null
    /** The target roll in degrees about the axle. */
    roll: number
    /** Ease toward the target over `--d-2` (the cursor) or jump to it (the scroll). */
    eased: boolean
}>()

const emit = defineEmits<{ ready: []; failed: []; lost: [] }>()

/** Tuned once against the poster in scripts/3d/render-frames.mjs: the softbox behind the camera. */
const ENVIRONMENT_YAW = Math.PI
const EASE_MS = 200
const LOAD_TIMEOUT_MS = 8000
const MM = 0.001

const { scene, renderer, invalidate } = useTres()
const { onRender } = useLoop()

/*
 * three reads every program's info log after linking and prints it as a warning when it is not
 * empty — on ANGLE/Direct3D (Firefox and WebKit on Windows) the HLSL compiler notes X4122
 * precision remarks inside three's own PMREM convolution shader, which is no defect of ours.
 * three documents `checkShaderErrors` as the production switch for exactly this read; it stays
 * on in development, where a broken shader must be seen.
 */
if ('debug' in renderer && typeof renderer.debug === 'object') {
    renderer.debug.checkShaderErrors = import.meta.env.DEV
}

const group = new Group()
const frame = framing(props.model, props.tyre)
/** On the axle, looking at the wheel's centre — a camera's rest orientation looks down −Z already. */
const cameraPosition = new Vector3(0, 0, frame.distanceMm * MM)

const wheelMaterial = new MeshStandardMaterial({
    color: new Color(props.finish.color),
    metalness: props.finish.metalness,
    roughness: props.finish.roughness,
})
const disposables: (BufferGeometry | Material | Texture)[] = [wheelMaterial]

let currentRoll = 0
let raf: number | null = null
let readyEmitted = false
let cancelled = false
let renderHook: { off: () => void } | null = null
let timeout: number | null = null

function setRoll(deg: number): void {
    currentRoll = deg
    group.rotation.z = (deg * Math.PI) / 180
    invalidate()
}

/** `--ease-out` (cubic-bezier(.2, 0, 0, 1)), close enough in one line. */
function easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

function stopEasing(): void {
    if (raf !== null) {
        cancelAnimationFrame(raf)
        raf = null
    }
}

function rollTo(target: number): void {
    stopEasing()

    if (!props.eased || Math.abs(target - currentRoll) < 0.05) {
        setRoll(target)

        return
    }

    const from = currentRoll
    const started = performance.now()

    const step = (now: number): void => {
        countFrame()
        const t = Math.min(1, (now - started) / EASE_MS)
        setRoll(from + (target - from) * easeOut(t))
        raf = t < 1 ? requestAnimationFrame(step) : null
    }

    raf = requestAnimationFrame(step)
}

/** The spec's idle probe: a counter of the viewer's own animation frames, development builds only. */
function countFrame(): void {
    if (import.meta.env.DEV) {
        const w = window as Window & { __rimifyViewerRaf?: number }
        w.__rimifyViewerRaf = (w.__rimifyViewerRaf ?? 0) + 1
    }
}

function applyFinish(root: Object3D): void {
    root.traverse((node) => {
        if (node instanceof Mesh) {
            const old = node.material as Material | Material[]
            for (const m of Array.isArray(old) ? old : [old]) {
                m.dispose()
            }
            node.material = wheelMaterial

            if (node.geometry instanceof Object) {
                disposables.push(node.geometry as BufferGeometry)
            }
        }
    })
}

function buildTyre(tyre: TyreSection): Mesh {
    const points = tyreProfile(props.model, tyre).map((p) => new Vector2(p.r * MM, p.z * MM))
    const geometry = new LatheGeometry(points, 160)
    // The lathe turns about Y; the axle is Z.
    geometry.rotateX(Math.PI / 2)
    geometry.computeVertexNormals()
    const material = new MeshStandardMaterial({ color: new Color(RUBBER.color), metalness: RUBBER.metalness, roughness: RUBBER.roughness })
    disposables.push(geometry, material)

    return new Mesh(geometry, material)
}

/**
 * The HDR arrives as a `DataTexture` with `flipY = true`; a data upload with a y-flip makes
 * Firefox warn ("Alpha-premult and y-flip are deprecated for non-DOM-Element uploads"). The rows
 * are turned over here instead, once, and the texture uploaded as it is — the same picture, so
 * the environment keeps its orientation.
 */
function preflipRows(texture: Texture): void {
    const image = texture.image as { data: Uint16Array | Float32Array; width: number; height: number }
    const { data, width, height } = image
    const channels = data.length / (width * height)
    const row = width * channels
    const tmp = data.slice(0, row)

    for (let y = 0; y < Math.floor(height / 2); y++) {
        const a = y * row
        const b = (height - 1 - y) * row
        tmp.set(data.subarray(a, a + row))
        data.copyWithin(a, b, b + row)
        data.set(tmp, b)
    }

    texture.flipY = false
    texture.premultiplyAlpha = false
    texture.needsUpdate = true
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        timeout = window.setTimeout(() => reject(new Error('3D load timeout')), LOAD_TIMEOUT_MS)
        promise.then(resolve, reject).finally(() => {
            if (timeout !== null) {
                window.clearTimeout(timeout)
                timeout = null
            }
        })
    })
}

function onContextLost(event: Event): void {
    event.preventDefault()
    stopEasing()
    emit('lost')
}

onMounted(async () => {
    const canvas = renderer.domElement
    canvas.addEventListener('webglcontextlost', onContextLost)

    const gltfLoader = new GLTFLoader()
    gltfLoader.setMeshoptDecoder(MeshoptDecoder)

    try {
        const [gltf, hdr] = await withTimeout(Promise.all([gltfLoader.loadAsync(props.model.url), new HDRLoader().loadAsync(props.hdri)]))

        if (cancelled) {
            hdr.dispose()

            return
        }

        preflipRows(hdr)
        hdr.mapping = EquirectangularReflectionMapping
        disposables.push(hdr)
        scene.value.environment = hdr
        scene.value.environmentRotation.set(0, ENVIRONMENT_YAW, 0)

        applyFinish(gltf.scene)
        group.add(gltf.scene)

        if (props.tyre !== null) {
            group.add(buildTyre(props.tyre))
        }

        // The first frame rendered from here on contains the wheel: that is `ready`.
        renderHook = onRender(() => {
            if (!readyEmitted) {
                readyEmitted = true
                renderHook?.off()
                emit('ready')
            }
        })

        setRoll(props.roll)
    } catch {
        if (!cancelled) {
            emit('failed')
        }
    }
})

watch(
    () => props.roll,
    (target) => {
        if (readyEmitted || !props.eased) {
            rollTo(target)
        }
    },
)

onBeforeUnmount(() => {
    cancelled = true
    stopEasing()
    renderHook?.off()

    if (timeout !== null) {
        window.clearTimeout(timeout)
    }

    renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
    scene.value.environment = null

    for (const d of disposables) {
        d.dispose()
    }
})
</script>

<template>
    <TresPerspectiveCamera :fov="model.fovDeg" :aspect="1" :near="0.05" :far="10" :position="cameraPosition" />
    <primitive :object="group" />
</template>
