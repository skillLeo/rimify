<script setup lang="ts">
/**
 * H6 row two — *Nach Marke*, the brand wall (docs/design/sections/home-brands.md), shared by the
 * desktop document (FindFast) and the phone document (Startseite/Mobile), so they cannot drift.
 *
 * A set of hairlines, not boxes: the cells are the band's own colour, the brands in prop order with
 * the sample range last, then one closing link. The column count per tier is computed from the
 * number of cells so the closing cell always completes the last row — there is never an empty
 * cell. Logos are one-colour masks filled with the ink token, sized by constant area; a brand
 * without a usable logo is set as its name. The note under the wall states the wall's own rule and,
 * with a vehicle, that the counts are the brand's whole stock rather than what fits the car.
 */

import { Link } from '@inertiajs/vue3'
import { computed, onMounted, shallowRef, watch } from 'vue'
import Icon from '../Ui/Icon.vue'
import { felgen } from '../../format'
import type { StartseiteProps } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'
import {
    closingLabel,
    hasMark,
    isSampleRange,
    markStyle,
    noteText,
    orderedBrands,
    wallStyle,
    wordmarkSize,
    type Brand,
    type CellKind,
} from './brandWall'

const props = withDefaults(
    defineProps<{
        brands: StartseiteProps['brands']
        vehicle: VehicleProp | null
        /** The phone document: its heading already carries the gap, so the wall has no top margin. */
        flush?: boolean
    }>(),
    { flush: false }
)

/*
 * Logo URLs that failed to load in this browser. A failed mask paints nothing, so after mount each
 * logo is probed once and a failure turns that cell into the wordmark. Client-only: the server
 * render — and so the hydrated first frame — is unchanged (§6, Error).
 */
const failed = shallowRef<Set<string>>(new Set())
const probed = new Set<string>()
let mounted = false

function kindOf(brand: Brand): CellKind {
    if (isSampleRange(brand)) {
        return 'sample'
    }

    return hasMark(brand) && brand.logo !== null && !failed.value.has(brand.logo) ? 'mark' : 'name'
}

const cells = computed(() => orderedBrands(props.brands).map((brand) => ({ brand, kind: kindOf(brand) })))
const layout = computed(() => wallStyle(cells.value.length))

function probe(list: readonly Brand[]): void {
    for (const brand of list) {
        const url = brand.logo

        if (url === null || !hasMark(brand) || probed.has(url)) {
            continue
        }

        probed.add(url)
        const image = new Image()
        image.onerror = () => {
            failed.value = new Set([...failed.value, url])
        }
        image.src = url
    }
}

watch(
    () => props.brands,
    (list) => {
        if (mounted) {
            probe(list)
        }
    }
)

onMounted(() => {
    mounted = true
    probe(props.brands)
})
</script>

<template>
    <template v-if="cells.length > 0">
        <ul class="brand-wall" :class="{ 'brand-wall--flush': flush }" :style="layout" aria-label="Felgen nach Marke" :data-brands="cells.length">
            <li v-for="{ brand, kind } in cells" :key="brand.slug" class="brand-wall__item">
                <!-- Named by content, never an aria-label: the visible count is part of the name (WCAG 2.5.3). -->
                <Link :href="brand.href" class="brand-cell" :data-kind="kind" prefetch>
                    <span class="brand-cell__stage">
                        <template v-if="kind === 'mark'">
                            <span class="brand-cell__mark" aria-hidden="true" :style="markStyle(brand)" />
                            <span class="visually-hidden">{{ `${brand.name} ` }}</span>
                        </template>
                        <template v-else-if="kind === 'sample'">
                            <span class="brand-cell__sample">Beispiel&shy;sortiment</span>
                            <span class="visually-hidden">{{ ` (${brand.name}) ` }}</span>
                        </template>
                        <span v-else class="brand-cell__name" :data-len="wordmarkSize(brand.name)">{{ brand.name }}</span>
                    </span>
                    <span class="brand-cell__foot brand-cell__count small num">{{ felgen(brand.count) }}</span>
                </Link>
            </li>
            <li class="brand-wall__item brand-wall__item--all">
                <Link href="/felgen" class="brand-cell brand-cell--all" data-kind="all" prefetch>
                    <span class="brand-cell__foot brand-cell__all">{{ closingLabel(vehicle) }}<Icon name="arrow-right" :size="16" /></span>
                </Link>
            </li>
        </ul>
        <p class="small brand-wall__note">{{ noteText(vehicle) }}</p>
    </template>
</template>

<style scoped>
/* ── The wall: a local grid of hairlines — a rule above, a rule below, lines between ── */

.brand-wall {
    --wall-cols: var(--wall-cols-s);
    --wall-span: var(--wall-span-s);
    --cell-pad: var(--sp-16);
    --cell-stage: var(--sp-48);
    --cell-gap: var(--sp-8);

    display: grid;
    grid-template-columns: repeat(var(--wall-cols), minmax(0, 1fr));
    gap: 1px;
    margin-top: var(--sp-24);
    background: var(--c-line);
    border-block: 1px solid var(--c-line);
}

.brand-wall--flush {
    margin-top: 0;
}

@media (min-width: 768px) {
    .brand-wall {
        --wall-cols: var(--wall-cols-m);
        --wall-span: var(--wall-span-m);
        --cell-pad: var(--sp-20);
        --cell-stage: var(--sp-64);
        --cell-gap: var(--sp-12);
    }
}

@media (min-width: 1024px) {
    .brand-wall {
        --wall-cols: var(--wall-cols-l);
        --wall-span: var(--wall-span-l);
        --cell-pad: var(--sp-24);
    }
}

@media (min-width: 1280px) {
    .brand-wall {
        --wall-cols: var(--wall-cols-xl);
        --wall-span: var(--wall-span-xl);
        --cell-stage: var(--sp-80);
    }
}

.brand-wall__item {
    display: grid;
    min-width: 0;
    background: var(--c-band);
}

/* The closing cell always ends flush with the wall's right edge: no hole, ever. */
.brand-wall__item--all {
    grid-column: span var(--wall-span);
}

/* ── The cell: the stage (the mark, centred), then the foot (the count, on the row's baseline) ── */

.brand-cell {
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-rows: minmax(var(--cell-stage), 1fr) auto;
    row-gap: var(--cell-gap);
    padding: var(--cell-pad);
    color: var(--c-ink);
    text-decoration: none;
}

/* The only hover device: the cell lights up like a showcase. */
.brand-cell::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--c-surface);
    opacity: 0;
    transition: opacity var(--d-1) var(--ease-std);
}

.brand-cell__stage {
    position: relative;
    z-index: var(--z-base);
    display: grid;
    place-items: center;
    min-width: 0;
    text-align: center;
}

.brand-cell__foot {
    position: relative;
    z-index: var(--z-base);
    grid-row: 2;
    justify-self: start;
}

.brand-cell__count {
    color: var(--c-ink-3);
}

/* Constant area k² (k·√a × k/√a), scaled down with its proportions kept until it fits both caps;
   the tier's k and caps are tokens (§3.4). Filled with ink through the mask; never recoloured. */
.brand-cell__mark {
    display: block;
    width: min(calc(var(--logo-k) * var(--logo-sqrt)), var(--logo-w-max), calc(var(--logo-h-max) * var(--logo-aspect)), 100%);
    aspect-ratio: var(--logo-aspect);
    color: var(--c-ink);
    background-color: currentColor;
    -webkit-mask-image: var(--logo-url);
    mask-image: var(--logo-url);
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: center;
    mask-position: center;
}

/* The name is the mark: sized by its longest word so its ink comes close to a logo's (§3.3). */
.brand-cell__name {
    font-size: var(--fs-h2);
    line-height: var(--lh-h2);
    font-weight: 700;
    font-stretch: var(--wdth-heading);
    letter-spacing: -0.01em;
    color: var(--c-ink);
    text-wrap: balance;
    hyphens: manual;
    overflow-wrap: anywhere;
}

.brand-cell__name[data-len='m'] {
    font-size: var(--fs-h3);
    line-height: var(--lh-h3);
}

.brand-cell__name[data-len='l'] {
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
}

/* The sample range is labelled, never branded. */
.brand-cell__sample {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    color: var(--c-ink-2);
    hyphens: manual;
}

/* The closing cell has no stage: alone in a row it is a slim strip, beside brands it stretches. */
.brand-cell--all {
    grid-template-rows: 1fr auto;
    row-gap: 0;
}

.brand-cell__all {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    color: var(--c-blue);
}

.brand-wall__note {
    max-width: 54ch;
    margin-top: var(--sp-16);
    color: var(--c-ink-3);
}

/* ── States: colours switch instantly; only the light fades (§7) ── */

@media (hover: hover) and (pointer: fine) {
    .brand-cell:hover::before {
        opacity: 1;
    }

    .brand-cell:hover .brand-cell__count {
        color: var(--c-blue);
    }

    .brand-cell--all:hover .brand-cell__all {
        text-decoration: underline;
    }
}

/* Inset, so a neighbour never covers the ring and it never crosses a hairline. */
.brand-cell:focus-visible {
    outline-offset: -2px;
}

.brand-cell:focus-visible::before,
.brand-cell:active::before {
    opacity: 1;
}

.brand-cell:focus-visible .brand-cell__count {
    color: var(--c-blue);
}

.brand-cell:active .brand-cell__count,
.brand-cell--all:active .brand-cell__all {
    color: var(--c-blue-press);
}

/* The mask is painted in the link's system colour instead of vanishing into Canvas. */
@media (forced-colors: active) {
    .brand-cell__mark {
        forced-color-adjust: none;
        color: inherit;
    }
}
</style>
