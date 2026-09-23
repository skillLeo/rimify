<script setup lang="ts">
/**
 * *Was die Zahlen auf einer Felge bedeuten* — the body of H8 (ACCURACY.md §5, D9).
 *
 * The values of the hero wheel as they are written on a wheel — `8,5J` · `19` · `ET 45` ·
 * `LK 5 × 112` · `MLB 66,6 mm` · `KBA 53810` — each a toggle button. One is chosen at a time, the
 * first from the first paint (so the server's frame is the final one and nothing waits for
 * JavaScript). Choosing a value marks it on the photograph where a front view shows it, and on the
 * cross-section where a section shows it; one sentence says what it is. With a fine pointer,
 * hovering previews a value and leaving the row returns to the chosen one; a click chooses. The
 * arrow keys move between the values; Enter and Space choose, as on any button.
 *
 * The values are the server's (`hero.product.facts`, GermanFormat); nothing here formats a number.
 * Without measured anchors there is no photograph, only the cross-section (fail closed, §4).
 *
 * Layout by `layout`: `phone` keeps one column — the values as a row that scrolls sideways inside
 * the page margins, then the photograph, the sentence, the cross-section and the teaser; `desktop`
 * puts, from 1024, the values across the top, the sentence and the teaser on the left and the
 * photograph and the cross-section beside them.
 */

import { computed, onMounted, ref } from 'vue'
import RimCodePhoto from './RimCodePhoto.vue'
import RimCodeSchematic from './RimCodeSchematic.vue'
import RimCodeTeaser from './RimCodeTeaser.vue'
import { etSide, kbaNumber, photoFrame, rimFactsOf, rimTokens, schematicKey, type RimCodeProduct, type RimKey } from './rimCode'

const props = withDefaults(
    defineProps<{
        product: RimCodeProduct | null
        layout?: 'desktop' | 'phone'
    }>(),
    { layout: 'desktop' }
)

const facts = computed(() => rimFactsOf(props.product))
const tokens = computed(() => (facts.value === null ? [] : rimTokens(facts.value)))
const frame = computed(() => photoFrame(props.product?.imageManifest))
const kba = computed(() => kbaNumber(facts.value?.kba))
const showEt = computed(() => etSide(facts.value?.et) === 'outboard')

/* ── Chosen, previewed, shown ───────────────────────────────────────────────────── */

const chosen = ref<RimKey | null>(null)
const previewed = ref<RimKey | null>(null)

const has = (key: RimKey | null): key is RimKey => key !== null && tokens.value.some((t) => t.key === key)

/** The chosen value; the first until the visitor chooses (and again if the chosen one disappears). */
const committed = computed<RimKey | null>(() => (has(chosen.value) ? chosen.value : (tokens.value[0]?.key ?? null)))
const shown = computed<RimKey | null>(() => (has(previewed.value) ? previewed.value : committed.value))
const shownToken = computed(() => tokens.value.find((t) => t.key === shown.value) ?? null)

/** The cross-section traces the value when it draws it; the ET only for a positive ET. */
const traced = computed(() => {
    const key = shown.value === null ? null : schematicKey(shown.value)

    return key === 'et' && !showEt.value ? null : key
})

/* Hover previews only with a real mouse on a device that hovers; on the server and on touch, never. */
const finePointer = ref(false)

onMounted(() => {
    finePointer.value = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false
})

function preview(key: RimKey, event: Event): void {
    if (finePointer.value && (event as PointerEvent).pointerType === 'mouse') {
        previewed.value = key
    }
}

function endPreview(): void {
    previewed.value = null
}

function choose(key: RimKey): void {
    chosen.value = key
    previewed.value = null
}

/* ── Keyboard: the arrows move along the row; Enter and Space are the button's own ─ */

const row = ref<HTMLElement | null>(null)

function move(from: number, event: KeyboardEvent): void {
    const last = tokens.value.length - 1
    const target: Record<string, number> = {
        ArrowRight: from === last ? 0 : from + 1,
        ArrowLeft: from === 0 ? last : from - 1,
        Home: 0,
        End: last,
    }
    const to = target[event.key]

    if (to === undefined) {
        return
    }

    // Focus moves; nothing is chosen until Enter or Space, so the arrows never change the sentence.
    event.preventDefault()
    row.value?.querySelectorAll<HTMLButtonElement>('[data-token]')[to]?.focus()
}

/* ── What the photograph is ─────────────────────────────────────────────────────── */

const alt = computed(() => {
    const name = [props.product?.brand, props.product?.name].filter(Boolean).join(' ')
    const finish = props.product?.finish ? ` in ${props.product.finish}` : ''

    return name === '' ? 'Felge, Ansicht von vorn' : `${name}${finish}, Ansicht von vorn`
})

const credit = computed(() => {
    const name = [props.product?.brand, props.product?.name].filter(Boolean).join(' ')
    const finish = props.product?.finish ? ` in ${props.product.finish}` : ''
    const lead = name === '' ? 'Das Foto' : `Foto: ${name}${finish}. Es`

    return `${lead} zeigt das Design; die Werte gehören zu einer Ausführung davon.`
})

const sizes = computed(() =>
    props.layout === 'phone' ? 'calc(100vw - 40px)' : '(min-width: 1280px) 440px, (min-width: 1024px) 28vw, (min-width: 768px) 40vw, 100vw'
)
</script>

<template>
    <div v-if="tokens.length && shownToken" class="rc" :class="[`rc--${layout}`, { 'rc--no-photo': !frame }]">
        <div ref="row" class="rc__tokens" role="group" aria-label="Werte der Felge" @pointerleave="endPreview">
            <button
                v-for="(token, i) in tokens"
                :key="token.key"
                class="chip rc-token"
                :class="{ 'is-shown': token.key === shown }"
                type="button"
                :aria-pressed="token.key === committed ? 'true' : 'false'"
                :data-token="token.key"
                @pointerenter="preview(token.key, $event)"
                @click="choose(token.key)"
                @keydown="move(i, $event)"
            >
                <span class="visually-hidden">{{ token.term }}: </span>
                <span class="rc-token__value num">{{ token.text }}</span>
            </button>
        </div>

        <RimCodePhoto
            v-if="frame"
            class="rc__photo"
            :frame="frame"
            :active="shownToken.key"
            :kba="kba"
            :alt="alt"
            :credit="credit"
            :sizes="sizes"
        />

        <div class="rc__def" aria-live="polite">
            <p class="label rc__term">{{ shownToken.term }}</p>
            <p class="body-l rc__sentence" data-role="definition">{{ shownToken.sentence }}</p>
        </div>

        <RimCodeSchematic class="rc__schematic" :active="traced" :show-et="showEt" />

        <RimCodeTeaser class="rc__teaser" />
    </div>
</template>

<style scoped>
/* One column in document order: the values, the photograph, the sentence, the section, the teaser. */
.rc {
    display: flex;
    flex-direction: column;
    gap: var(--sp-24);
    min-width: 0;
}

.rc__tokens {
    grid-area: tokens;
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    min-width: 0;
}

.rc__photo {
    grid-area: photo;
}

.rc__def {
    grid-area: def;
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.rc__sentence {
    max-width: 54ch;
    hyphens: auto;
}

.rc__schematic {
    grid-area: schematic;
}

.rc__teaser {
    grid-area: teaser;
}

/* A value as it is written on a wheel: a number set as a headline, 44 px tall everywhere. */
.rc-token {
    position: relative;
    flex: none;
    min-width: 44px;
    min-height: 44px;
    padding-inline: var(--sp-16);
    font-size: var(--fs-body-l);
    line-height: var(--lh-body-l);
    font-weight: 600;
    white-space: nowrap;
}

/* The previewed value shows as hovered while the chosen one keeps its pressed state. */
.rc-token.is-shown:not([aria-pressed='true']) {
    border-color: var(--c-ink-3);
}

/* ── The phone: the values scroll sideways inside the page margins, never the page ─ */

.rc--phone .rc__tokens {
    flex-wrap: nowrap;
    margin-inline: calc(-1 * var(--page-margin));
    padding-inline: var(--page-margin);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-padding-inline: var(--page-margin);
    scrollbar-width: none;
}

.rc--phone .rc__tokens::-webkit-scrollbar {
    display: none;
}

/* ── Desktop document, 768–1023: the sentence under the values, the two pictures side by side ─ */

@media (min-width: 768px) {
    .rc--desktop {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: var(--sp-24) var(--gutter);
        align-items: start;
        grid-template-areas:
            'tokens tokens'
            'def def'
            'photo schematic'
            'teaser teaser';
    }

    /* Room for the longest sentence, so a hovered value never moves the pictures below it. */
    .rc--desktop .rc__def {
        min-height: calc(var(--lh-small) + var(--sp-4) + 4 * var(--lh-body-l));
    }

    /* Without a photograph the section stands beside the sentence. */
    .rc--desktop.rc--no-photo {
        grid-template-areas:
            'tokens tokens'
            'def schematic'
            'teaser schematic';
    }
}

/* ── 1024 and up: sentence and teaser on the left, the photograph and the section beside ─ */

@media (min-width: 1024px) {
    .rc--desktop {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 360px;
        grid-template-rows: auto auto minmax(0, 1fr);
        grid-template-areas:
            'tokens tokens tokens'
            'def photo schematic'
            'teaser photo schematic';
        row-gap: var(--sp-32);
    }

    .rc--desktop .rc__def {
        min-height: 0;
    }

    .rc--desktop .rc__teaser {
        align-self: end;
    }

    .rc--desktop.rc--no-photo {
        grid-template-areas:
            'tokens tokens schematic'
            'def def schematic'
            'teaser teaser schematic';
    }
}
</style>
