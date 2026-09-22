<script setup lang="ts">
/**
 * H2 — the hero of the desktop homepage: the question, the selector, and one real wheel.
 *
 * Left, the `h1`, the subline and the selector panel. Right, the stage: a front-facing cut-out
 * standing on a contact shadow in a pool of studio light, with four measured values pointed at the
 * real thing by thin leader lines. Every value on the stage is the chosen product's own, formatted
 * on the server; nothing here is typed.
 *
 * While the photograph is a stand-in (`product.symbolic`), the stage shows the values and one line
 * saying so — and prints no brand, no model and no price, and links nowhere: a German buyer who
 * knows a mesh wheel when he sees one is not told it is something else. With the product's own
 * cut-out the caption names it and the whole stage is one link to it.
 *
 * Signature moment 1, "Studio light": when the photograph has painted, one light pass crosses the
 * wheel (900 ms, once); when that ends, the leader lines draw in. A fine pointer rolls the wheel
 * ±8° as it moves across the frame. Under reduced motion nothing moves and the lines are there
 * from the first paint. The blended, masked pass is composited inside the wheel's own box only
 * (`isolation` on the wheel, never on the frame): an isolated frame rendered empty in Chromium for
 * the whole sweep on a cold visit.
 *
 * The wheel itself is `WheelViewer3D`: the poster from the first byte, and — on a desktop document
 * with a fine pointer, after the poster has painted and the browser is idle — the 3D wheel over it
 * (§4.1). While the model is on screen the callout line ends follow its projected features and
 * the boxes stay put; before and without it, the photograph's targets apply. Those are calibrated
 * once against the cut-out and live in the manifest (`resources/js/images/hero-wheel.json` →
 * `targets`), so a later cut-out swap edits data, not code.
 */

import { usePage } from '@inertiajs/vue3'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ImageManifest } from '../Ui/Picture.vue'
import SpecCallout from '../Ui/SpecCallout.vue'
import WheelOutline from '../Ui/WheelOutline.vue'
import HeroSelector from './HeroSelector.vue'
import WheelViewer3D from './Wheel3D/WheelViewer3D.vue'
import { HERO_MODEL_3D } from './Wheel3D/model'
import { HERO_SEQUENCE } from './Wheel3D/sequence'
import { boxToFrame } from './Wheel3D/targets'
import type { BoxTargets, Stage } from './Wheel3D/types'
import { euro } from '../../format'
import heroWheel from '../../images/hero-wheel.json'
import type { MakeOption, StartseiteProps } from '../../types/pages'
import type { SharedProps } from '../../types/rimify'

const props = defineProps<{
    hero: StartseiteProps['hero']
    selector: { makes: MakeOption[] }
}>()

type TargetKey = 'widthDiameter' | 'offset' | 'boltCircle' | 'centreBore'

type Targets = Record<TargetKey, { tx: number; ty: number }>

interface CutoutManifest extends ImageManifest {
    /** Calibrated once against the cut-out; a regenerated manifest without them falls back below. */
    targets?: Targets
}

/* The cut-out manifests the page knows; `hero.product.image` names one of them. */
const MANIFESTS: Readonly<Record<string, CutoutManifest>> = { 'hero-wheel': heroWheel as CutoutManifest }

/*
 * The 3D wheel over the poster: the parametric mesh built by scripts/3d/build-wheel.mjs from the
 * hero configuration (§4.1). The server's `hero.product.model3d` will replace this import once
 * the catalogue carries licensed models; until then the one bundled manifest is the model.
 */
const MODEL_3D = HERO_MODEL_3D

/* The calibrated targets for the current cut-out (frame %, §H2), used when a manifest carries none. */
const DEFAULT_TARGETS: Targets = {
    widthDiameter: { tx: 35, ty: 11 },
    offset: { tx: 59, ty: 41 },
    boltCircle: { tx: 59, ty: 50 },
    centreBore: { tx: 50, ty: 44 },
}

/* Where each callout box sits (frame %, §H2); the line's target comes from the manifest. */
const SLOTS: readonly { key: TargetKey; x: number; y: number; label: RegExp }[] = [
    { key: 'widthDiameter', x: 4, y: 10, label: /größe|breite|durchmesser/i },
    { key: 'offset', x: 70, y: 8, label: /einpress|\bET\b/i },
    { key: 'boltCircle', x: 72, y: 68, label: /lochkreis|\bLK\b/i },
    { key: 'centreBore', x: 6, y: 72, label: /mittenloch|\bMLB\b/i },
]

const SUBLINE =
    'Wir zeigen dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt – mit den zulässigen Reifengrößen und allen Auflagen. Du gibst dein Auto an, wir prüfen den Rest.'

/* The one sentence for a stand-in photograph, in both documents. */
const SYMBOLIC = 'Symbolbild – Werte einer Beispielkonfiguration'
const SYMBOLIC_ALT = 'Symbolbild einer Leichtmetallfelge, Ansicht von vorn'

const page = usePage<SharedProps>()
const vehicle = computed(() => page.props.vehicle)
const product = computed(() => props.hero.product)
const symbolic = computed(() => product.value?.symbolic === true)
/* The finish's own cut-out when the catalogue has one; otherwise the bundled stand-in it names. */
const manifest = computed<CutoutManifest>(
    () => (product.value?.imageManifest as CutoutManifest | null | undefined) ?? MANIFESTS[product.value?.image ?? ''] ?? (heroWheel as CutoutManifest),
)

const title = computed(() =>
    vehicle.value === null ? props.hero.title : `Felgen, die an deinen ${vehicle.value.short} dürfen.`
)
const subline = computed(() => (props.hero.subline.trim() === '' ? SUBLINE : props.hero.subline))

const alt = computed(() => {
    if (product.value === null) {
        return ''
    }

    return symbolic.value ? SYMBOLIC_ALT : `${product.value.brand} ${product.value.name} in ${product.value.finish}, Ansicht von vorn`
})
const perWheel = computed(() => (product.value === null ? '' : euro(Math.round(product.value.fromPriceCents / 4))))

/** Each server value on its slot: matched by what the label says, else by the order shipped. */
const callouts = computed(() => {
    if (product.value === null) {
        return []
    }

    const free = [...SLOTS]
    const out: { key: TargetKey; label: string; value: string; x: number; y: number; tx: number; ty: number }[] = []

    for (const entry of product.value.spec) {
        const at = free.findIndex((slot) => slot.label.test(entry.label))
        const slot = at >= 0 ? free.splice(at, 1)[0] : free.shift()

        if (slot === undefined) {
            break
        }

        const target = (frameTargets.value ?? manifest.value.targets ?? DEFAULT_TARGETS)[slot.key]
        out.push({ key: slot.key, label: entry.label, value: entry.value, x: slot.x, y: slot.y, tx: target.tx, ty: target.ty })
    }

    return out
})

/* ── The 3D stage: the line ends follow the model, the boxes stay put ────────── */

const wheel = ref<HTMLElement | null>(null)
const stage = ref<Stage>('poster')
/** The model's targets as the viewer projects them (percent of the wheel's box), while 3D is on. */
const boxTargets = ref<BoxTargets | null>(null)
/** The same, in the frame's percentages — what the callouts draw to. */
const frameTargets = ref<Targets | null>(null)

let resizer: ResizeObserver | null = null

/** Map the box targets into the frame with both rectangles as they are laid out right now. */
function remapTargets(): void {
    if (boxTargets.value === null || frame.value === null || wheel.value === null) {
        frameTargets.value = null

        return
    }

    const frameBox = frame.value.getBoundingClientRect()
    const wheelBox = wheel.value.getBoundingClientRect()
    const out = {} as Targets

    for (const key of Object.keys(boxTargets.value) as TargetKey[]) {
        out[key] = boxToFrame(boxTargets.value[key], wheelBox, frameBox)
    }

    frameTargets.value = out
}

function onTargets(targets: BoxTargets): void {
    boxTargets.value = targets
    remapTargets()
}

function onStage(next: Stage): void {
    stage.value = next

    if (next !== '3d') {
        boxTargets.value = null
        remapTargets()
    }
}

/* ── Signature moment 1 ──────────────────────────────────────────────────────── */

const frame = ref<HTMLElement | null>(null)
const sweep = ref<HTMLElement | null>(null)
const lit = ref(false)
const ready = ref(false)
const failed = ref(false)
const roll = ref(0)

let reduced = false
let rolling = false

function onLoaded(): void {
    if (lit.value) {
        return
    }

    lit.value = true

    if (reduced) {
        ready.value = true

        return
    }

    // If the sweep cannot run, the lines still draw: the moment never blocks the content.
    void nextTick(() => {
        const el = sweep.value

        if (el === null || typeof el.getAnimations !== 'function' || el.getAnimations().length === 0) {
            ready.value = true
        }
    })
}

function onSweepEnd(): void {
    ready.value = true
}

function onError(): void {
    failed.value = true
    ready.value = true
}

function onMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || frame.value === null) {
        return
    }

    const rect = frame.value.getBoundingClientRect()
    const half = rect.width / 2

    if (half <= 0) {
        return
    }

    roll.value = Math.max(-8, Math.min(8, ((event.clientX - rect.left - half) / half) * 8))
}

function onLeave(): void {
    roll.value = 0
}

onMounted(() => {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // A cached photograph may have loaded before hydration, and `load` will not fire again.
    const img = frame.value?.querySelector('img') ?? null

    if (img !== null && img.complete && img.getAttribute('src') !== null) {
        if (img.naturalWidth > 0) {
            onLoaded()
        } else {
            onError()
        }
    }

    // The roll belongs to a fine pointer only, and never under reduced motion: the listener is
    // not attached at all otherwise.
    if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches && frame.value !== null) {
        frame.value.addEventListener('pointermove', onMove)
        frame.value.addEventListener('pointerleave', onLeave)
        rolling = true
    }

    // The frame's geometry changes with the viewport; the model's targets are re-mapped, never re-projected.
    if (typeof ResizeObserver !== 'undefined' && frame.value !== null) {
        resizer = new ResizeObserver(() => remapTargets())
        resizer.observe(frame.value)
    }
})

onBeforeUnmount(() => {
    if (rolling && frame.value !== null) {
        frame.value.removeEventListener('pointermove', onMove)
        frame.value.removeEventListener('pointerleave', onLeave)
    }

    resizer?.disconnect()
})
</script>

<template>
    <section id="h2" class="hero band" data-section="H2" aria-labelledby="h2-title">
        <div class="container hero__grid">
            <div class="hero__copy">
                <h1 id="h2-title" class="h1 hero__title">{{ title }}</h1>
                <p class="body-l hero__subline">{{ subline }}</p>
                <HeroSelector :selector="selector" class="hero__panel" />
            </div>

            <div class="hero__stage">
                <div
                    ref="frame"
                    class="frame hero__frame"
                    :class="{ 'is-lit': lit, 'is-ready': ready }"
                    :data-stage="stage"
                    :style="{ '--sweep-mask': `url(${manifest.base}-480.png)` }"
                >
                    <div class="hero-studio" aria-hidden="true" />
                    <div class="hero-contact" aria-hidden="true" />

                    <!-- One link, one tab stop — the wheel and the caption — when the photograph is the product's own. -->
                    <component
                        :is="symbolic ? 'div' : 'a'"
                        v-if="product"
                        class="hero__link"
                        :href="symbolic ? undefined : `/felgen/${product.slug}`"
                        :aria-label="symbolic ? undefined : `Zur Felge ${product.brand} ${product.name}`"
                    >
                        <span ref="wheel" class="hero__wheel" :class="{ 'hero__wheel--fallback': failed }" :style="{ '--roll': `${roll}deg` }">
                            <WheelViewer3D
                                v-if="!failed"
                                :poster="manifest"
                                :alt="alt"
                                sizes="(min-width: 1280px) 540px, (min-width: 1024px) 40vw, (min-width: 768px) 336px, 70vw"
                                eager
                                :model="MODEL_3D"
                                :sequence="HERO_SEQUENCE"
                                :finish="product.finish"
                                :roll="roll"
                                mode="hero"
                                @loaded="onLoaded"
                                @error="onError"
                                @targets="onTargets"
                                @stage="onStage"
                            />
                            <WheelOutline v-else :bolts="product.config.boltHoles" />
                            <span v-if="!failed" class="hero__sweep-mask" aria-hidden="true">
                                <span ref="sweep" class="hero-sweep" @animationend="onSweepEnd" />
                            </span>
                        </span>
                        <span v-if="!symbolic" class="hero__caption">
                            <span class="small hero__caption-name">{{ product.brand }} {{ product.name }} · {{ product.finish }}</span>
                            <span class="small num muted">ab {{ perWheel }} · pro Felge</span>
                            <!-- Seeded demonstration rows: the page says so, once (OVERHAUL.md §2). -->
                            <span v-if="page.props.demo" class="micro quiet demo-note">Demodaten – Beispielsortiment mit Fotos unter freier Lizenz.</span>
                        </span>
                    </component>
                    <span v-else class="hero__wheel hero__wheel--fallback" aria-hidden="true">
                        <WheelOutline />
                    </span>

                    <SpecCallout
                        v-for="c in callouts"
                        :key="c.key"
                        :label="c.label"
                        :value="c.value"
                        :x="c.x"
                        :y="c.y"
                        :tx="c.tx"
                        :ty="c.ty"
                    />

                    <p v-if="symbolic" class="micro quiet hero__symbolic">{{ SYMBOLIC }}</p>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.hero {
    padding-block: var(--sp-48) var(--sp-64);
    overflow-x: clip;
}

.hero__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-40) var(--gutter);
    align-items: start;
}

.hero__copy {
    min-width: 0;
}

.hero__title {
    max-width: 14ch;
    color: var(--c-ink);
}

.hero__subline {
    max-width: 54ch;
    margin-top: var(--sp-16);
    color: var(--c-ink-2);
}

.hero__panel {
    margin-top: var(--sp-32);
}

/* ── The stage ───────────────────────────────────────────────────────────────── */

.hero__stage {
    align-self: stretch;
    min-width: 0;
}

/*
 * 768–1023: the frame stands below the panel, 4 / 3, the wheel at 60 %. The frame is deliberately
 * no stacking context of its own (no `isolation`, no transform): the blended sweep is confined to
 * the wheel's box below, so the studio, the shadow and the callouts never join its compositing group.
 */
.hero__frame {
    --wheel-w: 60%;
    --wheel-bottom: 16%;

    position: relative;
    width: 100%;
    max-width: 560px;
    aspect-ratio: 4 / 3;
}

.hero-studio {
    position: absolute;
    inset: 0;
    z-index: var(--z-base);
    pointer-events: none;
    /* stylelint-disable-next-line declaration-property-value-disallowed-list */
    background-image: radial-gradient(60% 50% at 50% 62%, var(--c-surface) 0%, rgb(255 255 255 / 0) 100%);
}

/* The ellipse the wheel stands on: 78 % of the wheel wide, 8 % of it tall, its centre 1 % above the wheel's bottom edge. */
.hero-contact {
    position: absolute;
    left: 50%;
    bottom: calc(var(--wheel-bottom) + 1%);
    z-index: var(--z-base);
    width: calc(var(--wheel-w) * 0.78);
    aspect-ratio: 78 / 8;
    transform: translate(-50%, 50%);
    pointer-events: none;
    /* stylelint-disable-next-line declaration-property-value-disallowed-list */
    background-image: radial-gradient(50% 50% at 50% 50%, rgb(11 15 20 / 0.28) 0%, rgb(11 15 20 / 0.12) 45%, rgb(11 15 20 / 0) 72%);
}

/* One link, one tab stop: the wheel and the caption are both inside it; it has no box of its own. */
.hero__link {
    display: block;
    color: inherit;
    text-decoration: none;
}

.hero__link:focus-visible {
    outline: none;
}

.hero__link:focus-visible .hero__wheel {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
    border-radius: var(--r-round);
}

/*
 * The wheel's box is the one isolated group: the sweep blends with the photograph and nothing else.
 * The box itself never turns: `--roll` is read by the viewer, which turns the poster by CSS or the
 * model in 3D, so the canvas's frame stays where the callouts expect it.
 */
.hero__wheel {
    position: absolute;
    left: calc((100% - var(--wheel-w)) / 2);
    bottom: var(--wheel-bottom);
    z-index: var(--z-raised);
    width: var(--wheel-w);
    aspect-ratio: 1;
    isolation: isolate;
}

.hero__wheel--fallback {
    display: flex;
    color: var(--c-ink-3);
}

.hero__wheel--fallback :deep(.outline) {
    width: 60%;
    height: 60%;
}

/*
 * The light pass. The wheel's own alpha masks the wrapper — a mask on the moving element would
 * travel with it — and the wrapper blends the pass into the photograph; the pass itself carries
 * the gradient and the motion.
 */
.hero__sweep-mask {
    position: absolute;
    inset: 0;
    z-index: var(--z-raised);
    overflow: hidden;
    pointer-events: none;
    /* The current cut-out's own alpha, set by the frame; the bundled stand-in when none is set. */
    mask-image: var(--sweep-mask, url('/images/hero-wheel/hero-wheel-480.png'));
    mask-size: 100% 100%;
    mask-repeat: no-repeat;
    mix-blend-mode: soft-light;
}

.hero-sweep {
    position: absolute;
    inset: 0;
    opacity: 0;
    transform: translateX(-100%);
    /* stylelint-disable-next-line declaration-property-value-disallowed-list */
    background-image: linear-gradient(115deg, rgb(255 255 255 / 0) 35%, rgb(255 255 255 / 0.55) 50%, rgb(255 255 255 / 0) 65%);
}

.is-lit .hero-sweep {
    animation: sweep calc(1.5 * var(--d-4)) var(--ease-std) forwards;
}

/* Its own layer for exactly the animation's duration; released once the lines start drawing. */
.is-lit:not(.is-ready) .hero-sweep {
    will-change: transform;
}

@keyframes sweep {
    from {
        transform: translateX(-100%);
        opacity: 1;
    }

    to {
        transform: translateX(100%);
        opacity: 1;
    }
}

.hero__frame :deep(.callout-anchor) {
    z-index: var(--z-raised);
}

.hero__caption {
    position: absolute;
    left: 4%;
    bottom: 4%;
    z-index: var(--z-raised);
    display: grid;
    gap: var(--sp-4);
    max-width: 60%;
}

.hero__caption-name {
    font-weight: 500;
    color: var(--c-ink);
}

@media (hover: hover) and (pointer: fine) {
    .hero__link:hover .hero__caption-name {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

/* The stand-in note sits inside the frame, bottom right, where the caption is not. */
.hero__symbolic {
    position: absolute;
    right: 4%;
    bottom: 4%;
    z-index: var(--z-raised);
    display: block;
    max-width: 50%;
    text-align: right;
}

/*
 * Up to 1279 the frame is short (420 px at 768, 400 px at 1024–1279) and the Mittenlochbohrung box
 * (y 72 % + 56 px) would meet a caption at the bottom edge; the caption sits under the box instead.
 */
@media (max-width: 1279px) {
    .hero__caption {
        top: calc(72% + 56px + var(--sp-8));
        bottom: auto;
    }
}

/* ── 1024–1279: split 6 / 6, the stage bleeding to the viewport edge, the frame 500 × 400 ── */

@media (min-width: 1024px) {
    .hero__grid {
        grid-template-columns: repeat(12, minmax(0, 1fr));
    }

    .hero__copy {
        grid-column: span 6;
    }

    .hero__stage {
        grid-column: span 6;
        max-width: none;
        margin-right: calc(-1 * var(--page-margin));
    }

    .hero__frame {
        --wheel-w: 66%;

        max-width: none;
        max-height: 100%;
        aspect-ratio: 5 / 4;
    }
}

/*
 * ── ≥ 1280: split 5 / 7, the bleed reaching past the centred content ─────────
 *
 * The stage is the box. The frame takes the copy column's height (608 px at 1440 — h1, subline,
 * panel) instead of setting the row's height itself, so the fold arithmetic of §H2 holds: H2 ends
 * at 720, H3 begins at 816. Its width follows the height at 4 / 3 (811 px at 608), capped at the
 * stage, so the callout geometry — percentages of the frame — is the same at 1440 and at 1920.
 * The wheel is sized from the height (82,5 %, its bottom at 84 %) for the same reason: the frame
 * is as wide as the stage allows, but never taller than the copy.
 */
@media (min-width: 1280px) {
    .hero__copy {
        grid-column: span 5;
    }

    .hero__stage {
        position: relative;
        grid-column: span 7;
        margin-right: calc((100vw - var(--content-max)) / -2);
    }

    .hero__frame {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: auto;
        /* Never a collapsed frame in an engine that ignores the ratio on a positioned box. */
        min-width: 75%;
        max-width: 100%;
        max-height: none;
        aspect-ratio: 4 / 3;
    }

    .hero__wheel {
        left: 50%;
        width: auto;
        height: 82.5%;
        transform: translateX(-50%);
    }

    .hero-contact {
        width: auto;
        height: 6.6%;
    }
}

/* ── Reduced motion: nothing moves, the lines are there from the first paint ── */

@media (prefers-reduced-motion: reduce) {
    .hero-sweep {
        display: none;
    }
}
</style>
