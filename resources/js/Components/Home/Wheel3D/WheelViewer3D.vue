<script setup lang="ts">
/**
 * The wheel stage: a photographic poster that is the content from the first byte, and — on a
 * desktop document with a fine pointer, motion allowed, WebGL2 present, after the poster has
 * loaded, the browser is idle and the box is half in view — a 3D wheel that fades in over it.
 *
 * The server renders the poster and nothing else; the first client render is the same frame.
 * The 3D chunk is imported only once the ladder (`ladder.ts`) has decided on it. A failed load,
 * a lost context or a missing model drops to the image sequence when there is one, else the
 * poster stays: the customer never sees a spinner, a black box or a message about a 3D model.
 *
 * Hero: the parent's cursor roll (±8°) arrives as `roll`; the poster turns by CSS, the model by
 * an eased `rotation.z`. Band: the box's own progress through the viewport (no scroll listener —
 * `observeViewProgress`) turns the model 0 → −120°, the same range as the poster's CSS `view()`
 * timeline. The box never changes size: CLS 0.
 */

import { usePage } from '@inertiajs/vue3'
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Picture, { type ImageManifest } from '../../Ui/Picture.vue'
import { finishFor } from './finish'
import { decideStage, observeViewProgress, probe, whenIdleInView } from './ladder'
import { framing, projectTargets } from './targets'
import type { BoxTargets, Model3dManifest, SequenceManifest, Stage, TyreSection, ViewerMode } from './types'
import type { SharedProps } from '../../../types/rimify'

const props = withDefaults(
    defineProps<{
        poster: ImageManifest
        alt: string
        sizes?: string
        eager?: boolean
        model?: Model3dManifest | null
        sequence?: SequenceManifest | null
        mode?: ViewerMode
        /** The band's tyre section; null renders the rim alone. */
        tyre?: TyreSection | null
        /** The catalogue finish name, e.g. *Silber matt*. */
        finish?: string
        hdri?: string
        /** The hero's cursor roll target in degrees; ignored by the band. */
        roll?: number
    }>(),
    {
        sizes: '100vw',
        eager: false,
        model: null,
        sequence: null,
        mode: 'hero',
        tyre: null,
        finish: 'Silber',
        hdri: '/3d/studio_small_09_1k.hdr',
        roll: 0,
    },
)

const emit = defineEmits<{
    loaded: []
    error: []
    ready: []
    stage: [stage: Stage]
    /** The four callout targets as percentages of this box, whenever the 3D projection is in force. */
    targets: [targets: BoxTargets]
    /** The band's current roll in degrees. */
    roll: [deg: number]
}>()

/* The 3D chunk — three, TresJS, the loaders — split by Vite and requested only from `armThreeD`. */
const WheelScene = defineAsyncComponent(() => import('./WheelScene.vue').then((m) => m.default))

const BAND_ROLL_DEG = -120
const HERO_ROLL_MAX = 8

const page = usePage<SharedProps>()

const root = ref<HTMLElement | null>(null)
const sentinelTop = ref<HTMLElement | null>(null)
const sentinelBottom = ref<HTMLElement | null>(null)

const stage = ref<Stage>('poster')
const mount3d = ref(false)
const ready = ref(false)
const bandRoll = ref(0)
const posterLoaded = ref(false)

const material = computed(() => finishFor(props.finish))
const isBand = computed(() => props.mode === 'band')

/*
 * The band's poster is the rim alone until the client's complete-wheel cut-out arrives; the 3D
 * scene adds the tyre around it. So the poster stands where the model's rim stands — inset so the
 * rim keeps its size at the swap and the box is the complete wheel's. Pure in the props: identical
 * on the server and the client.
 */
const posterInset = computed(() => {
    if (!isBand.value || props.model === null || props.tyre === null) {
        return null
    }

    const { rimFraction, fraction } = framing(props.model, props.tyre)

    return `${(((1 - rimFraction / fraction) / 2) * 100).toFixed(2)}%`
})

const modelRoll = computed(() => (isBand.value ? bandRoll.value : props.roll))

/* ── The image sequence fallback ────────────────────────────────────────────── */

const frames = computed(() => {
    const seq = props.sequence

    if (seq === null) {
        return []
    }

    const names = isBand.value
        ? Array.from({ length: seq.roll.frames }, (_, i) => `roll-${String(i).padStart(2, '0')}`)
        : seq.yaw.anglesDeg.map((a) => `yaw-${a < 0 ? 'm' : ''}${Math.abs(a)}`)

    return names.map(
        (name): ImageManifest => ({
            name,
            base: `${seq.base}/${name}`,
            width: seq.width,
            height: seq.height,
            widths: seq.widths,
            placeholder: '',
            fallback: seq.fallback,
        }),
    )
})

const activeFrame = computed(() => {
    const seq = props.sequence

    if (seq === null || frames.value.length === 0) {
        return 0
    }

    if (isBand.value) {
        // Twelve frames cover one spoke period; the roll wraps within it, so the loop is seamless.
        const period = seq.roll.frames * seq.roll.stepDeg
        const within = ((-bandRoll.value % period) + period) % period

        return Math.round(within / seq.roll.stepDeg) % seq.roll.frames
    }

    const angles = seq.yaw.anglesDeg
    const span = Math.max(...angles.map(Math.abs))
    const wanted = (props.roll / HERO_ROLL_MAX) * span
    let best = 0

    angles.forEach((a, i) => {
        if (Math.abs(a - wanted) < Math.abs((angles[best] ?? 0) - wanted)) {
            best = i
        }
    })

    return best
})

/* ── The ladder ─────────────────────────────────────────────────────────────── */

let cancelIdle: (() => void) | null = null
let stopProgress: (() => void) | null = null

function setStage(next: Stage): void {
    if (stage.value !== next) {
        stage.value = next
        emit('stage', next)
    }
}

function fallBack(): void {
    mount3d.value = false
    ready.value = false
    setStage(props.sequence !== null ? 'sequence' : 'poster')
}

function onLoaded(): void {
    posterLoaded.value = true
    emit('loaded')
}

function onError(): void {
    emit('error')
}

function onSceneReady(): void {
    ready.value = true
    setStage('3d')
    emit('ready')

    if (props.model !== null) {
        emit('targets', projectTargets(props.model, props.tyre))
    }
}

function onSceneLost(): void {
    // A lost context leaves no black box: the poster is simply visible again.
    mount3d.value = false
    ready.value = false
    setStage('poster')
}

function armThreeD(): void {
    if (root.value === null) {
        return
    }

    cancelIdle = whenIdleInView(root.value, 0.5, () => {
        cancelIdle = null
        mount3d.value = true
    })
}

function watchProgress(): void {
    if (root.value === null || sentinelTop.value === null || sentinelBottom.value === null) {
        return
    }

    stopProgress = observeViewProgress(root.value, [sentinelTop.value, sentinelBottom.value], (progress) => {
        const deg = Number((BAND_ROLL_DEG * progress).toFixed(1))

        if (deg !== bandRoll.value) {
            bandRoll.value = deg
            emit('roll', deg)
        }
    })
}

onMounted(() => {
    const env = probe(page.props.isMobile === true, props.model !== null, props.sequence !== null)
    const decided = decideStage(env)

    if (decided === 'poster') {
        return
    }

    if (isBand.value) {
        watchProgress()
    }

    if (decided === 'sequence') {
        setStage('sequence')

        return
    }

    // A cached poster has loaded before hydration and `load` will not fire again.
    const img = root.value?.querySelector('img') ?? null

    if (img !== null && img.complete && img.naturalWidth > 0) {
        posterLoaded.value = true
    }

    if (posterLoaded.value) {
        armThreeD()
    } else {
        const stop = watch(posterLoaded, (loaded) => {
            if (loaded) {
                stop()
                armThreeD()
            }
        })
    }
})

onBeforeUnmount(() => {
    cancelIdle?.()
    stopProgress?.()
})
</script>

<template>
    <div
        ref="root"
        class="viewer"
        :class="[`viewer--${mode}`, { 'viewer--3d': stage === '3d', 'viewer--seq': stage === 'sequence' }]"
        :data-stage="stage"
        :data-roll="isBand ? bandRoll.toFixed(1) : undefined"
    >
        <Picture
            :image="poster"
            :alt="alt"
            :sizes="sizes"
            :eager="eager"
            class="viewer__poster"
            :style="posterInset === null ? undefined : { inset: posterInset }"
            @loaded="onLoaded"
            @error.capture="onError"
        />

        <template v-if="stage === 'sequence'">
            <Picture
                v-for="(frame, i) in frames"
                :key="frame.name"
                :image="frame"
                alt=""
                :sizes="sizes"
                class="viewer__frame"
                :class="{ 'is-active': i === activeFrame }"
                aria-hidden="true"
            />
        </template>

        <div v-if="mount3d && model" class="viewer__canvas" :class="{ 'is-ready': ready }" aria-hidden="true">
            <WheelScene
                :model="model"
                :hdri="hdri"
                :finish="material"
                :tyre="tyre"
                :roll="modelRoll"
                :eased="!isBand"
                @ready="onSceneReady"
                @failed="fallBack"
                @lost="onSceneLost"
            />
        </div>

        <template v-if="isBand">
            <span ref="sentinelTop" class="viewer__sentinel viewer__sentinel--top" aria-hidden="true" />
            <span ref="sentinelBottom" class="viewer__sentinel viewer__sentinel--bottom" aria-hidden="true" />
        </template>
    </div>
</template>

<style scoped>
.viewer {
    position: absolute;
    inset: 0;
}

/* The poster is the content. The hero's cursor roll turns it by CSS; the 3D stage turns the model instead. */
.viewer__poster {
    position: absolute;
    inset: 0;
    width: auto;
    height: auto;
    transform: rotate(var(--roll, 0deg));
    transition:
        transform var(--d-2) var(--ease-out),
        opacity var(--d-1) var(--ease-out);
}

.viewer__poster :deep(img) {
    object-fit: contain;
}

/*
 * Once the model is on screen the poster steps out beneath it, after the canvas has faded in:
 * a parametric wheel does not cover a photograph of a different wheel. A lost context removes
 * `viewer--3d` and the poster is back at once.
 */
.viewer--3d .viewer__poster {
    opacity: 0;
    transform: none;
    transition-delay: 0s, var(--d-2);
}

.viewer__canvas {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--d-2) var(--ease-out);
}

.viewer__canvas.is-ready {
    opacity: 1;
}

.viewer__canvas :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
}

/* The sequence: every frame stacked, the matching one visible, swapped without a transition. */
.viewer__frame {
    position: absolute;
    inset: 0;
    width: auto;
    height: auto;
    opacity: 0;
    pointer-events: none;
}

.viewer__frame :deep(img) {
    object-fit: contain;
}

.viewer__frame.is-active {
    opacity: 1;
}

.viewer--seq .viewer__poster {
    opacity: 0;
    transform: none;
}

/*
 * The band's progress probes: one hanging a viewport below the top edge, one standing a viewport
 * above the bottom edge. Boxes only — never painted, never in the way.
 */
.viewer__sentinel {
    position: absolute;
    left: 0;
    width: 1px;
    height: 100vh;
    visibility: hidden;
    pointer-events: none;
}

.viewer__sentinel--top {
    top: 0;
}

.viewer__sentinel--bottom {
    bottom: 0;
}

/* ── The band: the poster turns with the scroll where the browser has a view() timeline ── */

@supports (animation-timeline: view()) {
    .viewer--band:not(.viewer--3d, .viewer--seq) .viewer__poster {
        animation: turn linear both;
        animation-timeline: view();
        animation-range: entry 0% exit 100%;
    }
}

@keyframes turn {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(-120deg);
    }
}

/* ── Reduced motion: the poster, at rest, and nothing else ever mounts ─────── */

@media (prefers-reduced-motion: reduce) {
    .viewer__poster {
        animation: none;
        transform: none;
        transition: none;
    }

    .viewer__canvas {
        transition: none;
    }
}
</style>
