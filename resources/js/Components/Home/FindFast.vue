<script setup lang="ts">
/**
 * H6 · Schnell finden — Nach Zollgröße · Nach Marke.
 *
 * Two shortcuts into the catalogue for people who already know what they want. The size tiles are
 * typography, not icons: the number is the tile. A diameter with nothing in stock is shown struck
 * and is not a link — shown, never hidden, so the range reads as a range. Brands sit in a hairline
 * grid as monochrome marks; until the admin has uploaded a logo, the name is the mark.
 */

import { Link } from '@inertiajs/vue3'
import { decimal } from '../../format'
import type { StartseiteProps } from '../../types/pages'

defineProps<{
    sizes: StartseiteProps['sizes']
    brands: StartseiteProps['brands']
}>()

/* German counts its nouns: one Felge, otherwise Felgen. */
function countLine(count: number): string {
    return count === 1 ? '1 Felge' : `${decimal(count, 0)} Felgen`
}
</script>

<template>
    <section id="h6" class="find" data-section="H6" aria-labelledby="h6-heading">
        <div class="container">
            <div v-if="sizes.length > 0" class="find__row">
                <h2 id="h6-heading" class="h2">Nach Zollgröße</h2>
                <ul class="sizes" aria-label="Felgen nach Zollgröße">
                    <li v-for="size in sizes" :key="size.inch" class="sizes__item">
                        <Link v-if="size.count > 0" :href="size.href" class="size-tile" prefetch>
                            <span class="display num size-tile__number">{{ size.inch }}</span>
                            <span class="small muted">Zoll</span>
                            <span class="small num muted">{{ countLine(size.count) }}</span>
                        </Link>
                        <span v-else class="size-tile size-tile--struck" aria-disabled="true">
                            <span class="display num size-tile__number">{{ size.inch }}</span>
                            <span class="small muted">Zoll</span>
                            <span class="small muted">keine Felgen</span>
                        </span>
                    </li>
                </ul>
            </div>

            <div v-if="brands.length > 0" class="find__row">
                <h2 :id="sizes.length > 0 ? 'h6-brands' : 'h6-heading'" class="h2">Nach Marke</h2>
                <ul class="brands" aria-label="Felgen nach Marke">
                    <li v-for="brand in brands" :key="brand.slug" class="brands__item">
                        <Link :href="brand.href" class="brand-cell" :aria-label="brand.logo ? brand.name : undefined" prefetch>
                            <span v-if="brand.logo" class="brand-mark" :style="{ maskImage: `url(${brand.logo})`, WebkitMaskImage: `url(${brand.logo})` }" />
                            <span v-else class="h4 brand-cell__name">{{ brand.name }}</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    </section>
</template>

<style scoped>
.find__row + .find__row {
    margin-top: var(--sp-64);
}

/* ── Sizes ─────────────────────────────────────────────────────────────────── */

.sizes {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--gutter);
    margin-top: var(--sp-24);
}

.sizes__item {
    min-width: 0;
}

.size-tile {
    display: grid;
    align-content: end;
    gap: 0;
    min-height: 96px;
    padding: var(--sp-12);
    border-radius: var(--r-tile);
    background: var(--c-surface);
    color: var(--c-ink);
    text-decoration: none;
}

.size-tile__number {
    white-space: nowrap;
    margin-bottom: var(--sp-4);
    transition: color var(--d-1) var(--ease-std);
}

.size-tile--struck .size-tile__number {
    color: var(--c-ink-3);
    text-decoration: line-through;
}

.size-tile--struck {
    cursor: not-allowed;
}

@media (hover: hover) and (pointer: fine) {
    a.size-tile:hover .size-tile__number {
        color: var(--c-blue);
    }
}

a.size-tile:active .size-tile__number {
    color: var(--c-blue-press);
}

@media (min-width: 768px) {
    .sizes {
        grid-template-columns: repeat(7, minmax(0, 1fr));
    }
}

@media (min-width: 1024px) {
    .size-tile {
        min-height: 128px;
        padding: var(--sp-20) var(--sp-16);
    }
}

/* ── Brands: a hairline grid, the cells the band's own colour ──────────────── */

.brands {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: var(--sp-24);
    border-top: 1px solid var(--c-line);
    border-left: 1px solid var(--c-line);
}

.brands__item {
    min-width: 0;
}

.brand-cell {
    display: grid;
    place-items: center;
    min-height: 96px;
    padding: var(--sp-12);
    border-right: 1px solid var(--c-line);
    border-bottom: 1px solid var(--c-line);
    background: var(--c-band);
    color: var(--c-ink-2);
    text-decoration: none;
    text-align: center;
}

.brand-cell__name {
    overflow-wrap: anywhere;
    transition: color var(--d-1) var(--ease-std);
}

.brand-mark {
    width: 120px;
    max-width: 100%;
    height: 32px;
    background-color: var(--c-ink-2);
    mask-position: center;
    mask-size: contain;
    mask-repeat: no-repeat;
    transition: background-color var(--d-1) var(--ease-std);
}

@media (hover: hover) and (pointer: fine) {
    .brand-cell:hover .brand-cell__name {
        color: var(--c-ink);
    }

    .brand-cell:hover .brand-mark {
        background-color: var(--c-ink);
    }
}

@media (min-width: 768px) {
    .brands {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

@media (min-width: 1024px) {
    .brands {
        grid-template-columns: repeat(6, minmax(0, 1fr));
    }
}
</style>
