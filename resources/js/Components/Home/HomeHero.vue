<script setup lang="ts">
/**
 * H2 — the hero of the desktop homepage: the question, the selector, and one real wheel.
 *
 * Left, the `h1`, the subline and the selector panel. Right, the stage: the product's own
 * photograph — the shadowless `bare` frame, standing on one CSS contact shadow in a pool of studio
 * light — with leaders only to what a front view shows (docs/phase0/ACCURACY.md D10, §4): the
 * Lochkreis, as a dashed circle drawn through the bolt-hole centres; the Mittenlochbohrung, which
 * sits behind the cap and says so; and the KBA number, at the stamp — only when the photographed
 * stamp is this configuration's number. Width, diameter and ET are in the spec line under the
 * picture, with the line saying the picture shows the design and the values are the configuration
 * shown. Every value is formatted on the server (`facts`); every position comes from the
 * photograph's measured anchors (`calloutSlots.ts`); nothing is typed here, nothing is measured.
 *
 * With no photograph of the product the stage draws the outline, prints the spec line, names no
 * product and points at nothing. The bundled stand-in photograph is retired.
 *
 * Motion (DIRECTION.md §5): once, on load, the wheel rolls in — 1,6 picture widths, from past the
 * right edge, turning counter-clockwise by exactly the distance over its radius, about its own
 * axle — and then the callouts and their leaders appear. The final frame is the default: without JavaScript, and under reduced
 * motion, the wheel stands, the leaders are drawn and the text is there from the first paint. No
 * cursor roll, and nothing turns while a leader shows.
 *
 * The stage never grows past the copy column: it is a size container whose height is the row's,
 * and the frame takes what the caption and the notes leave (the #h3 overlap at ≥ 1966 px is gone).
 */

import { usePage } from '@inertiajs/vue3'
import { computed, onMounted, ref } from 'vue'
import Picture from '../Ui/Picture.vue'
import SpecCallout from '../Ui/SpecCallout.vue'
import ValueText from '../Ui/ValueText.vue'
import WheelOutline from '../Ui/WheelOutline.vue'
import HeroSelector from './HeroSelector.vue'
import { DESKTOP_LAYOUT, frameStyle, HERO_SIZES_DESKTOP, heroScene, rollStyle } from '../Mobile/Home/calloutSlots'
import { euro } from '../../format'
import type { MakeOption, StartseiteProps } from '../../types/pages'
import type { SharedProps } from '../../types/rimify'

const props = defineProps<{
    hero: StartseiteProps['hero']
    selector: { makes: MakeOption[] }
}>()

const SUBLINE =
    'Wir zeigen dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt – mit den zulässigen Reifengrößen und allen Auflagen. Du gibst dein Auto an, wir prüfen den Rest.'

/* The three lines under the picture, in both documents. */
const CAPTION = 'Abbildung zeigt das Design; Werte der gezeigten Ausführung.'
const SYMBOLIC = 'Symbolbild – Werte einer Beispielkonfiguration'
const DEMO = 'Demodaten – Beispielsortiment; Preise und Bestände sind Beispielwerte.'

const page = usePage<SharedProps & { demo?: boolean }>()
const vehicle = computed(() => page.props.vehicle)
const product = computed(() => props.hero.product)
const scene = computed(() => heroScene(product.value, DESKTOP_LAYOUT))

/* The photograph failed to load: the outline, and no leaders — they would point at nothing. */
const failed = ref(false)
const photo = computed(() => (failed.value ? null : scene.value.picture))
const callouts = computed(() => (photo.value === null ? [] : scene.value.callouts))
/* The callouts are drawing, hidden from assistive technology; the stamp's number is read with the spec line. */
const kba = computed(() => callouts.value.find((c) => c.key === 'kba') ?? null)
/*
 * One link, to the product, whenever the product is named — and it is named only over its own
 * photograph: never under the outline, whether the product is symbolic or its photograph failed.
 */
const linked = computed(() => product.value !== null && !product.value.symbolic && photo.value !== null)

const title = computed(() =>
    vehicle.value === null ? props.hero.title : `Felgen, die an deinen ${vehicle.value.short} dürfen.`
)
const subline = computed(() => (props.hero.subline.trim() === '' ? SUBLINE : props.hero.subline))
const alt = computed(() => (product.value === null ? '' : `${product.value.brand} ${product.value.name} in ${product.value.finish}, Ansicht von vorn`))
const perWheel = computed(() => (product.value === null ? '' : euro(Math.round(product.value.fromPriceCents / 4))))

/* The layout's geometry for the stylesheet, and the leaders' start after the roll (none without one). */
const stageStyle = computed(() => ({ ...frameStyle(DESKTOP_LAYOUT), '--callout-delay': scene.value.roll === null ? '0ms' : 'var(--d-roll)' }))
const pictureStyle = computed(() => rollStyle(scene.value))

const frame = ref<HTMLElement | null>(null)

onMounted(() => {
    // A cached photograph that is broken fired `error` before hydration; it will not fire again.
    const img = frame.value?.querySelector('img') ?? null

    if (img !== null && img.complete && img.getAttribute('src') !== null && img.naturalWidth === 0) {
        failed.value = true
    }
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

            <div class="hero__stage" :style="stageStyle">
                <!-- One link, one tab stop — the picture and the caption — named by its content (the
                     picture's alt and the caption): no aria-label, so the visible text is in the name. -->
                <component :is="linked ? 'a' : 'div'" class="hero__link" :href="linked && product ? `/felgen/${product.slug}` : undefined">
                    <div class="hero__frame-box">
                        <div ref="frame" class="frame hero__frame">
                            <div class="hero-studio" aria-hidden="true" />

                            <!-- `error` does not bubble, but it does pass this wrapper in the capture phase. -->
                            <span
                                v-if="photo"
                                class="hero__roll"
                                :class="{ 'hero__roll--rolling': scene.roll !== null }"
                                :style="pictureStyle"
                                @error.capture="failed = true"
                            >
                                <span v-if="scene.shadow" class="hero-contact" aria-hidden="true" />
                                <span class="hero__spin">
                                    <Picture :image="photo" :alt="alt" :sizes="HERO_SIZES_DESKTOP" eager />
                                </span>
                            </span>
                            <span v-else class="hero__outline" aria-hidden="true">
                                <WheelOutline :bolts="product?.config.boltHoles ?? 5" size="82%" />
                            </span>

                            <SpecCallout
                                v-for="c in callouts"
                                :key="c.key"
                                :data-callout="c.key"
                                :label="c.label"
                                :value="c.value"
                                :note="c.note"
                                :side="c.side"
                                :x="c.x"
                                :y="c.y"
                                :tx="c.tx"
                                :ty="c.ty"
                                :elbow="c.elbow"
                                :ring="c.ring"
                                :ratio="DESKTOP_LAYOUT.ratio"
                                :weight="DESKTOP_LAYOUT.weight"
                            />
                        </div>
                    </div>

                    <span v-if="linked && product" class="hero__caption">
                        <!-- Brand, model and finish are names, the price is a figure: neither is
                             translated. *ab* and *pro Felge* are German and stay translatable. -->
                        <span class="small hero__caption-name" translate="no">{{ product.brand }} {{ product.name }} · {{ product.finish }}</span>
                        <span class="small num muted">ab <ValueText :text="perWheel" whole /> · pro Felge</span>
                    </span>
                </component>

                <div v-if="product" class="hero__notes">
                    <!-- The spec line is nothing but tokens and figures — `8,5J × 19 · ET 45 ·
                         LK 5 × 112 · MLB 66,6 mm · Traglast 620 kg` — so the whole line, the
                         stamp's number with it, is kept from the translator. -->
                    <p class="small num hero__spec" translate="no">
                        {{ product.facts.specLine }}<span v-if="kba" class="visually-hidden"> · {{ kba.label }} {{ kba.value }}</span>
                    </p>
                    <span v-if="photo" class="micro quiet hero__shown">{{ CAPTION }}</span>
                    <span v-else class="micro quiet hero__symbolic">{{ SYMBOLIC }}</span>
                    <!-- Seeded demonstration rows: the page says so, once (OVERHAUL.md §2). -->
                    <span v-if="page.props.demo" class="micro quiet demo-note">{{ DEMO }}</span>
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

/* ── The stage: the picture, the caption under it, the notes under that ─────────── */

.hero__stage {
    display: flex;
    flex-direction: column;
    gap: var(--sp-12);
    min-width: 0;
}

.hero__link {
    display: flex;
    flex-direction: column;
    gap: var(--sp-8);
    min-height: 0;
    color: inherit;
    text-decoration: none;
}

.hero__link:focus-visible {
    outline: none;
}

.hero__link:focus-visible .hero__frame {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.hero__frame-box {
    min-height: 0;
}

/*
 * The frame: the layout's ratio (3 : 2), the square picture its full height and centred, the
 * callouts over it. Below 1024 it stands under the panel, at most 560 px wide. It is no stacking
 * context of its own, so the leaders (`--z-base`) paint over the picture and the boxes
 * (`--z-raised`) over every leader.
 */
.hero__frame {
    --callout-ink: var(--c-ink);

    position: relative;
    width: 100%;
    max-width: 560px;
    aspect-ratio: var(--frame-ratio);
}

.hero-studio {
    position: absolute;
    inset: 0;
    z-index: var(--z-base);
    pointer-events: none;
    /* stylelint-disable-next-line declaration-property-value-disallowed-list */
    background-image: radial-gradient(60% 50% at 50% 62%, var(--c-surface) 0%, rgb(255 255 255 / 0) 100%);
}

/* The square picture's box, where the layout puts it; the roll moves the box, the turn its content. */
.hero__roll,
.hero__outline {
    position: absolute;
    top: var(--pic-top);
    left: var(--pic-left);
    z-index: var(--z-base);
    width: var(--pic-size);
    aspect-ratio: 1;
}

/* About the wheel's own axle (the `centre` anchor), never the picture's middle. */
.hero__spin {
    position: absolute;
    inset: 0;
    transform-origin: var(--roll-origin, 50% 50%);
}

.hero__spin :deep(.picture) {
    width: 100%;
    height: 100%;
}

/* The drawing fills the picture as the photographed wheel does (82 %). */
.hero__outline {
    display: flex;
    color: var(--c-ink-3);
}

/*
 * The one contact shadow: under the `bare` picture only (the square frame has its own baked in),
 * centred on the bottom of the rim (`wheel` anchor), 78 % of its diameter wide. It travels with
 * the wheel and never turns; the picture, later in the box, covers its upper half.
 */
.hero-contact {
    position: absolute;
    top: var(--contact-y);
    left: var(--contact-x);
    width: var(--contact-w);
    aspect-ratio: 78 / 8;
    transform: translate(-50%, -50%);
    pointer-events: none;
    /* stylelint-disable-next-line declaration-property-value-disallowed-list */
    background-image: radial-gradient(50% 50% at 50% 50%, rgb(11 15 20 / 0.28) 0%, rgb(11 15 20 / 0.12) 45%, rgb(11 15 20 / 0) 72%);
}

/*
 * The roll-in: the box travels `--roll-distance` (a share of its own width) from the right while
 * the picture turns by `--roll-angle` = distance / radius — one duration, one curve, so at every
 * instant the turn matches the travel and the wheel rolls without slipping. Moving left, it turns
 * counter-clockwise. The resting state is the element's own; the keyframes only lead into it.
 */
.hero__roll--rolling {
    animation: hero-travel var(--d-roll) var(--ease-roll) both;
}

.hero__roll--rolling .hero__spin {
    animation: hero-turn var(--d-roll) var(--ease-roll) both;
}

/* It fades in over the first part of the roll, so on a very wide screen it never pops into view mid-stage. */
@keyframes hero-travel {
    from {
        transform: translateX(var(--roll-distance));
        opacity: 0;
    }

    15% {
        opacity: 1;
    }
}

@keyframes hero-turn {
    from {
        transform: rotate(var(--roll-angle));
    }
}

.hero__caption {
    display: grid;
    gap: var(--sp-4);
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

.hero__notes {
    display: grid;
    gap: var(--sp-4);
}

.hero__spec {
    color: var(--c-ink-2);
}

/*
 * ── ≥ 1024: split 6 / 6, the stage bleeding to the viewport's edge ───────────────
 *
 * The stage is a size container: its height is the row's — the copy column's — and never its
 * content's. The frame's box is two thirds of the stage's width tall (the frame's ratio) and gives
 * way first when the caption and the notes need the room; the frame is then as wide as that
 * height allows. So at no width does anything in the stage reach past the copy column, and at no
 * width does it reach into #h3.
 */
@media (min-width: 1024px) {
    .hero__grid {
        grid-template-columns: repeat(12, minmax(0, 1fr));
    }

    .hero__copy {
        grid-column: span 6;
    }

    .hero__stage {
        grid-column: span 6;
        align-self: stretch;
        margin-right: calc(-1 * var(--page-margin));
        container-type: size;
    }

    .hero__link,
    .hero__frame-box {
        flex: 0 1 auto;
    }

    .hero__caption,
    .hero__notes {
        flex: none;
    }

    .hero__frame-box {
        height: calc(100cqw / var(--frame-ratio));
        container-type: size;
    }

    .hero__frame {
        width: min(100cqw, 100cqh * var(--frame-ratio));
        max-width: none;
    }
}

/* ── ≥ 1280: split 5 / 7, the bleed reaching past the centred content ─────────── */
@media (min-width: 1280px) {
    .hero__copy {
        grid-column: span 5;
    }

    .hero__stage {
        grid-column: span 7;
        margin-right: min(calc(-1 * var(--page-margin)), calc((100vw - var(--content-max)) / -2));
    }
}

/* ── Reduced motion: nothing moves; the wheel stands and the leaders are drawn from the first paint ── */
@media (prefers-reduced-motion: reduce) {
    .hero__roll--rolling,
    .hero__roll--rolling .hero__spin {
        animation: none;
    }
}
</style>
