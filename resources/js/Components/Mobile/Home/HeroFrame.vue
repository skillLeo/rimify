<script setup lang="ts">
/**
 * The hero frame on a phone: the same photograph and the same anchors as the desktop stage
 * (`calloutSlots.ts`, docs/phase0/ACCURACY.md §4) — the product's shadowless `bare` cut-out on one
 * CSS contact shadow in a pool of studio light, and two leaders: the Lochkreis, a dashed circle
 * through the bolt-hole centres, and the KBA number at the stamp (only when the photographed stamp
 * is this configuration's number). Under the frame: the spec line, the caption naming the product (no price and
 * no link, the client's #4), the line saying what the picture shows, and the Demodaten line.
 *
 * The photograph is the brand's (`heroPhoto`, chosen in Inhalte; PROTECTED.md P1) and stands whatever the catalogue holds,
 * with its leaders, spec line and caption: the wheel's own values as its document states them for the stamped size
 * (`heroPhoto.facts`) — no product query, so they stand with the shop empty too (the client's #4). Only where the release
 * shipped without the photograph is the outline drawn — with no brand, no model, no price, no link and no leader.
 *
 * The frame stands just below the first screen (its top at 861 px on a 390 × 844 phone, measured on
 * 05.10.2026): the headline is the page's LCP, so neither wheel is preloaded or fetched early — both are
 * `late`, lazy and last, and take no byte from the first paint (the operator's brief of 05.10.2026, §5).
 * Once, on load, the wheel rolls in and the leaders draw after it; the resting frame is the default,
 * so without JavaScript and under reduced motion everything simply stands there.
 */

import { usePage } from '@inertiajs/vue3'
import { computed, onMounted, ref } from 'vue'
import Picture from '../../Ui/Picture.vue'
import SpecCallout from '../../Ui/SpecCallout.vue'
import WheelOutline from '../../Ui/WheelOutline.vue'
import type { HeroPhoto } from '../../../types/pages'
import { COMPANION_STAGGER_MS, companionScene, companionStyle, frameStyle, HERO_SIZES_PHONE, heroScene, PHONE_COMPANION, PHONE_LAYOUT, PHONE_PAIR_LAYOUT, rollStyle } from './calloutSlots'

const props = withDefaults(defineProps<{ heroPhoto?: HeroPhoto | null }>(), { heroPhoto: null })

const page = usePage<{ demo?: boolean }>()

const CAPTION = 'Abbildung zeigt das Design; Werte der gezeigten Ausführung.'
const SYMBOLIC = 'Symbolbild – Werte einer Beispielkonfiguration'
const DEMO = 'Demodaten – Beispielsortiment; Preise und Bestände sind Beispielwerte.'

/* The brand's photograph and the values its document states for the stamped size (#4: no product query). */
const source = computed(() => props.heroPhoto ?? null)
const facts = computed(() => props.heroPhoto?.facts ?? null)
/* Two wheels where the photograph has its second finish (PROTECTED.md P1): both boxes then stand on the left. */
const layout = computed(() => (source.value?.companion?.imageManifest ? PHONE_PAIR_LAYOUT : PHONE_LAYOUT))
const scene = computed(() => heroScene(source.value, layout.value, facts.value))

/* The photograph failed to load: the outline, and no leaders — they would point at nothing. */
const failed = ref(false)
const photo = computed(() => (failed.value ? null : scene.value.picture))
/* The second wheel, behind the first; it goes quietly if its own file fails, and never without the first. */
const pairFailed = ref(false)
const pair = computed(() => (photo.value === null || pairFailed.value ? null : companionScene(source.value, scene.value, layout.value, PHONE_COMPANION)))
const pairStyle = computed(() => (pair.value === null ? {} : companionStyle(pair.value)))
const pairAlt = computed(() => (source.value?.companion && source.value.brand ? `${source.value.brand} ${source.value.name} in ${source.value.companion.finish}, Ansicht von vorn` : ''))
const finishes = computed(() => (source.value === null ? '' : pair.value !== null && source.value.companion ? `${source.value.finish} und ${source.value.companion.finish}` : source.value.finish))
const callouts = computed(() => (photo.value === null ? [] : scene.value.callouts))
/* The callouts are drawing, hidden from assistive technology; the stamp's number is read with the spec line. */
const kba = computed(() => callouts.value.find((c) => c.key === 'kba') ?? null)
/* Named over its own photograph only; never priced, never linked (#4, D-108). */
const named = computed(() => facts.value !== null && photo.value !== null && source.value !== null && source.value.brand !== '')
const alt = computed(() => (source.value === null || !source.value.brand ? 'Felge, Ansicht von vorn' : `${source.value.brand} ${source.value.name} in ${source.value.finish}, Ansicht von vorn`))

/* The leaders draw once both wheels stand: after the roll, and after the second wheel's beat when it is there. */
const frameVars = computed(() => ({
    ...frameStyle(layout.value),
    '--callout-delay': scene.value.roll === null ? '0ms' : pair.value === null ? 'var(--d-roll)' : `calc(var(--d-roll) + ${COMPANION_STAGGER_MS}ms)`,
}))
const pictureStyle = computed(() => rollStyle(scene.value))

const root = ref<HTMLElement | null>(null)

onMounted(() => {
    // A cached photograph that is broken fired `error` before hydration; it will not fire again.
    const img = root.value?.querySelector('img') ?? null

    if (img !== null && img.complete && img.getAttribute('src') !== null && img.naturalWidth === 0) {
        failed.value = true
    }
})
</script>

<template>
    <div ref="root" class="hero-mobile" :data-hero="facts ? 'values' : 'photo'">
        <!-- No link and no price in the hero (the client's #4, D-108): the picture and its numbers. -->
        <div class="frame hero-frame" :style="frameVars">
            <span class="hero-studio" aria-hidden="true" />

            <!-- The second wheel first, so the leading one paints over it. -->
            <span v-if="pair" class="hero-frame__pair" :class="{ 'hero-frame__pair--rolling': pair.roll !== null }" :style="pairStyle" @error.capture="pairFailed = true">
                <span v-if="pair.shadow" class="hero-contact" aria-hidden="true" />
                <span class="hero-frame__spin">
                    <Picture :image="pair.picture" :alt="pairAlt" :sizes="HERO_SIZES_PHONE" late />
                </span>
            </span>

            <!-- `error` does not bubble, but it does pass this wrapper in the capture phase. -->
            <span
                v-if="photo"
                class="hero-frame__roll"
                :class="{ 'hero-frame__roll--rolling': scene.roll !== null }"
                :style="pictureStyle"
                @error.capture="failed = true"
            >
                <span v-if="scene.shadow" class="hero-contact" aria-hidden="true" />
                <span class="hero-frame__spin">
                    <Picture :image="photo" :alt="alt" :sizes="HERO_SIZES_PHONE" late />
                </span>
            </span>
            <span v-else class="hero-frame__outline" aria-hidden="true">
                <WheelOutline :bolts="5" size="82%" />
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
                :ratio="layout.ratio"
                :weight="layout.weight"
            />
        </div>

        <!-- The wheel's values and name, under its photograph. -->
        <template v-if="facts">
            <!-- Tokens and figures throughout, the stamp's number with them: never translated. -->
            <p class="small num muted hero-mobile__spec" translate="no">
                {{ facts.specLine }}<span v-if="kba" class="visually-hidden"> · {{ kba.label }} {{ kba.value }}</span>
            </p>

            <p v-if="named" class="hero-mobile__caption">
                <span class="small hero-mobile__name" translate="no">{{ source?.brand }} {{ source?.name }} · {{ finishes }}</span>
            </p>
            <p v-if="photo" class="micro quiet hero-mobile__shown">{{ CAPTION }}</p>
            <p v-else class="micro quiet hero-mobile__symbolic">{{ SYMBOLIC }}</p>
        </template>
        <!-- Seeded demonstration rows: the page says so, once (OVERHAUL.md §2). -->
        <p v-if="page.props.demo" class="micro quiet demo-note">{{ DEMO }}</p>
    </div>
</template>

<style scoped>
.hero-mobile {
    display: grid;
    gap: var(--sp-8);
}

/* The layout's ratio (7 : 6); the leaders (`--z-base`) over the picture, the boxes (`--z-raised`) over them. */
.hero-frame {
    --callout-ink: var(--c-ink);
    --callout-casing: var(--c-surface);

    position: relative;
    display: block;
    aspect-ratio: var(--frame-ratio);
    overflow: hidden;
    border-radius: var(--r-tile);
    text-decoration: none;
}

/* The studio light, as on the desktop (D-139): the band's own colour lifted, gone before the frame's clipped edges. */
.hero-studio {
    position: absolute;
    inset: 0;
    z-index: var(--z-base);
    /* stylelint-disable-next-line declaration-property-value-disallowed-list */
    background-image: radial-gradient(
        50% 38% at 50% 62%,
        var(--c-studio-light) 0%,
        color-mix(in srgb, var(--c-studio-light) 96%, transparent) 15%,
        color-mix(in srgb, var(--c-studio-light) 83%, transparent) 30%,
        color-mix(in srgb, var(--c-studio-light) 64%, transparent) 45%,
        color-mix(in srgb, var(--c-studio-light) 41%, transparent) 60%,
        color-mix(in srgb, var(--c-studio-light) 19%, transparent) 75%,
        color-mix(in srgb, var(--c-studio-light) 4%, transparent) 90%,
        transparent 100%
    );
}

/* The square picture's box, where the layout puts it; the roll moves the box, the turn its content. */
.hero-frame__roll,
.hero-frame__outline {
    position: absolute;
    top: var(--pic-top);
    left: var(--pic-left);
    z-index: var(--z-base);
    width: var(--pic-size);
    aspect-ratio: 1;
}

/* About the wheel's own axle (the `centre` anchor), never the picture's middle. */
.hero-frame__spin {
    position: absolute;
    inset: 0;
    transform-origin: var(--roll-origin, 50% 50%);
}

.hero-frame__spin :deep(.picture) {
    width: 100%;
    height: 100%;
}

.hero-frame__outline {
    display: flex;
    color: var(--c-ink-3);
}

/* The one contact shadow, under `bare` only, centred on the bottom of the rim; it travels, never turns. */
.hero-contact {
    position: absolute;
    top: var(--contact-y);
    left: var(--contact-x);
    width: var(--contact-w);
    aspect-ratio: 78 / 8;
    transform: translate(-50%, -50%);
    /* stylelint-disable-next-line declaration-property-value-disallowed-list */
    background-image: radial-gradient(50% 50% at 50% 50%, rgb(11 15 20 / 0.28) 0%, rgb(11 15 20 / 0.12) 45%, rgb(11 15 20 / 0) 72%);
}

/* The roll-in, as on the desktop: travel and turn on one curve, the turn = distance / radius. */
.hero-frame__roll--rolling {
    animation: hero-travel var(--d-roll) var(--ease-roll) both;
}

.hero-frame__roll--rolling .hero-frame__spin {
    animation: hero-turn var(--d-roll) var(--ease-roll) both;
}

/* The second wheel: its own box behind the first, the same keyframes a beat later (PROTECTED.md P1). */
.hero-frame__pair {
    position: absolute;
    top: var(--pair-top);
    left: var(--pair-left);
    z-index: var(--z-base);
    width: var(--pair-size);
    aspect-ratio: 1;
}

.hero-frame__pair--rolling {
    animation: hero-travel var(--d-roll) var(--ease-roll) var(--pair-delay) both;
}

.hero-frame__pair--rolling .hero-frame__spin {
    animation: hero-turn var(--d-roll) var(--ease-roll) var(--pair-delay) both;
}

/* In from just past the frame's right edge (the frame clips), fading in as it enters. */
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

.hero-mobile__spec,
.hero-mobile__shown,
.hero-mobile__symbolic,
.demo-note {
    padding-inline: var(--sp-4);
}

.hero-mobile__caption {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding-inline: var(--sp-4);
    color: var(--c-ink);
    text-decoration: none;
}


.hero-mobile__name {
    font-weight: 500;
}


@media (prefers-reduced-motion: reduce) {
    .hero-frame__roll--rolling,
    .hero-frame__roll--rolling .hero-frame__spin,
    .hero-frame__pair--rolling,
    .hero-frame__pair--rolling .hero-frame__spin {
        animation: none;
    }
}
</style>
