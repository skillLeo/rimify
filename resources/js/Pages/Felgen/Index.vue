<script setup lang="ts">
/**
 * The listing.
 *
 * With a vehicle it is a compliance answer — only wheels with a valid Gutachten for that car, and
 * the count says so. Without one it is the open catalogue, and a notice above the grid says so
 * rather than quietly implying everything fits.
 *
 * One page for every width. The filters are a sticky sidebar from 1200px; below that they open in
 * a sheet from a sticky bar, with the live result count on the button that closes it.
 *
 * The page count is derived from the result count. It is never a literal.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import FilterBar from '../../Components/Listing/FilterBar.vue'
import BuildForm from '../../Components/Product/BuildForm.vue'
import PapersForm from '../../Components/Product/PapersForm.vue'
import Icon from '../../Components/Art/Icon.vue'
import ProductTile from '../../Components/Ui/ProductTile.vue'
import VehicleNotify from '../../Components/Vehicle/VehicleNotify.vue'
import { useListingFilters } from '../../composables/useListingFilters'
import { useShared } from '../../composables/useShared'
import { decimal } from '../../format'
import { contactHref } from '../../lib/contact'
import { formatNumber } from '../../lib/num'
import type { FelgenProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

const props = defineProps<FelgenProps>()

const PAGE_SIZE = 24

const shared = useShared()

/*
 * How many tiles stand on the first screen: two rows of four on a desktop, two rows of two on a phone. Their
 * photographs are loaded at once; every tile after them lazily (the image rule, e2e/image-loading.spec.ts). The server
 * knows which of the two it is serving, so the markup is right before any script runs.
 */
const FIRST_SCREEN = shared.value.isMobile ? 4 : 8
const vehicle = computed(() => shared.value.vehicle)
const filters = useListingFilters(() => props.filters)
const sheetOpen = ref(false)
const results = ref<HTMLElement | null>(null)

/*
 * A filter keeps the page where it is, because the customer is looking at what they changed. A list that came back shorter than the
 * way down to it would leave the page at its foot, with nothing of the list on screen: then the list comes up to the header.
 */
const RESULTS_IN_SIGHT = 160

watch(() => props.cards, async () => {
    await nextTick()

    const box = results.value?.getBoundingClientRect()

    if (box !== undefined && box.bottom < RESULTS_IN_SIGHT) {
        results.value?.scrollIntoView({ block: 'start' })
    }
})

function closeSheetOnEsc(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        sheetOpen.value = false
    }
}

const heading = computed(() =>
    vehicle.value === null ? 'Alle Felgen' : `Felgen für ${vehicle.value.short}`
)

/** A body style or drive the owner gave or the car's name did: the grid rests on it, so the page says it. */
const buildGiven = computed(() => {
    const build = vehicle.value?.build

    return build != null && [build.bodySource, build.driveSource].some((source) => source === 'name' || source === 'customer')
})

/*
 * The tyres wait for the car's papers (D-286): one sentence for the whole page, the form under it. Only what is missing
 * is asked for (D-291) — the form shows what we know beside it, with where it came from.
 */
const owedLead = computed(() => {
    const owed = props.owed ?? []
    const front = owed.includes('8.1')
    const rear = owed.includes('8.2')
    const axles = front && rear
        ? 'die zulässigen Achslasten aus den Feldern 8.1 und 8.2'
        : front ? 'die zulässige Achslast vorn aus Feld 8.1' : rear ? 'die zulässige Achslast hinten aus Feld 8.2' : null
    const parts = [axles, owed.includes('T') ? 'die Höchstgeschwindigkeit aus Feld T' : null].filter((part): part is string => part !== null)
    const then = 'Trag sie einmal ein, dann prüfen wir damit die Reifen zu jeder Felge.'

    if (parts.length === 0) {
        return ''
    }

    return parts.length === 1
        ? `Für die Reifen ${front && rear ? 'fehlen' : 'fehlt'} uns ${parts[0]} deiner Zulassungsbescheinigung Teil I. ${then}`
        : `Für die Reifen fehlen uns Werte aus deiner Zulassungsbescheinigung Teil I: ${parts.join(' und ')}. ${then}`
})

const appliedCount = computed(
    () =>
        Object.entries(props.filters).filter(
            ([key, value]) => key !== 'seite' && (Array.isArray(value) ? value.length > 0 : value)
        ).length
)

const currentPage = computed(() => props.page ?? 1)

/*
 * No wheel in the shop at all — a test environment reset to an empty shop: choosing a car leads to no wheel either, so
 * the page says so once and offers the way that works, a question to us.
 */
const catalogueEmpty = computed(() => !props.hasVehicle && appliedCount.value === 0 && props.cards.length === 0)

/* The facets come with a car and without one (#30, D-118): the filters show whenever there is something to narrow. */
const showFilters = computed(() => Object.values(props.facets ?? {}).some((options) => (options?.length ?? 0) > 0))

/* The vehicle bar under the header, where the server shows it: the sticky filter column starts below it (#24, D-120). */
const vehicleBar = computed(() => vehicle.value !== null && (shared.value.headerMode === 'WHITE_BOX' || shared.value.headerMode === 'BLUE_BAR'))

/* What the sheet's button shows: the car's total, or the cards of the catalogue. */
const shownCount = computed(() => props.total ?? props.cards.length)

/*
 * Below 1200px the choices themselves stand in the list, not only a button to them (the client's #31, D-119): the
 * sizes and the brands as a row of chips under the Filter button, with the same toggles as the sidebar and the sheet,
 * the chosen ones in the selected chips' blue. The sheet keeps every facet.
 */
interface QuickOption {
    facet: 'zoll' | 'marke'
    value: string
    label: string
    count: number
    on: boolean
}

const quick = computed<QuickOption[]>(() => {
    const chosen = (facet: string, value: string): boolean => {
        const raw = props.filters[facet]

        return Array.isArray(raw) && raw.map(String).includes(value)
    }
    const brands = (props.facets?.marke ?? []).map((o) => ({ facet: 'marke' as const, value: o.value, label: o.value, count: o.count, on: chosen('marke', o.value) }))

    return brands
})

/* The sizes as the home page's tiles, on the band: the number is the tile, a press filters as the column's own box does (#32). */
const sizeTiles = computed(() => {
    const raw = props.filters.zoll
    const on = Array.isArray(raw) ? raw.map(String) : []

    return (props.facets?.zoll ?? []).map((option) => ({
        value: option.value,
        inch: decimal(Number(option.value), Number.isInteger(Number(option.value)) ? 0 : 1),
        line: `${formatNumber(option.count)} ${option.count === 1 ? 'Felge' : 'Felgen'}`,
        count: option.count,
        on: on.includes(String(option.value)),
    }))
})

const lastPage = computed(() =>
    props.total === null ? 1 : Math.max(1, Math.ceil(props.total / PAGE_SIZE))
)

/** A window of page numbers around the current one, never a hard-coded run. */
const pages = computed(() => {
    const last = lastPage.value
    const from = Math.max(1, Math.min(currentPage.value - 2, last - 4))
    const to = Math.min(last, from + 4)

    return Array.from({ length: to - from + 1 }, (_, i) => from + i)
})

watch(sheetOpen, (open) => {
    if (typeof document !== 'undefined') {
        document.body.style.overflow = open ? 'hidden' : ''

        if (open) {
            document.addEventListener('keydown', closeSheetOnEsc)
        } else {
            document.removeEventListener('keydown', closeSheetOnEsc)
        }
    }
})

onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
        document.body.style.removeProperty('overflow')
        document.removeEventListener('keydown', closeSheetOnEsc)
    }
})
</script>

<template>
    <Head title="Felgen" />

    <!-- The home page's alternation (#32, D-115): the pale blue band under the header, the results on white, a band to close. -->
    <section class="plp__top">
        <div class="container">
            <nav class="plp__crumbs t-small" aria-label="Brotkrumen">
                <Link href="/">Startseite</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Felgen</span>
            </nav>

            <div class="plp__head">
                <!-- Where the keyboard goes when the papers' block it was in goes with the figures (PapersForm). -->
                <h1 class="t-h1" tabindex="-1" data-focus-after-papers>
                    {{ heading }}
                </h1>
                <!-- With a filter set, what it narrowed from stands beside what it left: „0 von 44 Felgen“ (EIGENE-FUNDE 128). -->
                <p class="plp__count">
                    <template v-if="total !== null">
                        <!-- The spaces stand inside the mustaches: a leading space in a <template> branch is dropped by the
                             compiler, and „2Felgen“ is what a reader then saw (Human QA, 28.10.2026). -->
                        <strong class="tabular">{{ formatNumber(total ?? 0) }}</strong>
                        <template v-if="unfiltered != null">{{ ' von ' }}<span class="tabular">{{ formatNumber(unfiltered) }}</span>{{ unfiltered === 1 ? ' Felge' : ' Felgen' }}</template>
                        <template v-else>{{ total === 1 ? ' Felge' : ' Felgen' }}</template>
                        mit gültigem Gutachten für dieses Fahrzeug
                    </template>
                    <template v-else-if="unfiltered != null">{{ formatNumber(cards.length) }} von {{ formatNumber(unfiltered) }} {{ unfiltered === 1 ? 'Felge' : 'Felgen' }}</template>
                    <template v-else>{{ formatNumber(cards.length) }} {{ cards.length === 1 ? 'Felge' : 'Felgen' }} im Sortiment</template>
                </p>
                <!-- The acceptance set is sold with the test payment (rimify:demo --abnahme): the product page's own words. -->
                <!-- Seeded demonstration rows are on this page: it says so, once (OVERHAUL.md §2), beside the header's badge. -->
                <p v-if="demo && acceptance" class="micro quiet plp__demoline">Demodaten zum Ausprobieren – Preise und Bestände sind Beispielwerte; bestellen geht hier nur mit der Testzahlung, verschickt wird nichts.</p>
                <p v-else-if="demo" class="micro quiet plp__demoline">Beispielsortiment – Preise und Bestände sind Beispielwerte, bestellen kannst du noch nicht.</p>
            </div>

            <!-- The chosen car lacks what the answers wait for: asked by name the moment it is chosen, answered
                 in place — never a list of „Keine Freigabe hinterlegt“ with no way on (EF-01, §1.1). Once answered,
                 or read from the name, what every answer below rests on stays said, one click from changing (G-01). -->
            <div v-if="hasVehicle && vehicle && (missing?.length || buildGiven)" class="plp__ask" :class="{ 'plp__ask--said': !missing?.length }">
                <!-- Keyed by the car: another car chosen meanwhile gets a fresh question, never this one's state (G-10). -->
                <BuildForm :key="`build-${vehicle.id}`" :vehicle-id="vehicle.id" :build="vehicle.build ?? null" :missing="missing ?? []" />
            </div>

            <!-- The tyres wait for the car's papers (D-286): asked once, for every wheel below, and answered in place. Once
                 given, the figures every answer rests on stay said, one click from changing — as the body style above. -->
            <div v-if="hasVehicle && vehicle && (owed?.length || vehicle.papers)" class="plp__ask plp__papers" :class="{ 'plp__papers--said': !owed?.length }" data-papers>
                <p v-if="owed?.length" class="plp__papers-lead">
                    <Icon name="info" :size="20" />
                    <span>{{ owedLead }}</span>
                </p>
                <PapersForm :key="`papers-${vehicle.id}`" :vehicle-id="vehicle.id" :papers="vehicle.papers ?? null" :known="vehicle.figures ?? null" :power-kw="vehicle.powerKw ?? null" :asked="owed ?? []" start-closed />
            </div>

            <!-- No vehicle: honest about what the page is, and one step away from the real answer. -->
            <div v-if="!hasVehicle && !catalogueEmpty" class="plp__notice">
                <Icon name="info" :size="20" />
                <p class="plp__notice-text">
                    Wähle dein Fahrzeug, um nur Felgen zu sehen, die dafür freigegeben sind.
                </p>
                <Link href="/felgen-suchen" class="btn btn--primary">Fahrzeug wählen</Link>
            </div>

            <ul v-if="showFilters && sizeTiles.length > 1" class="plp__sizes" aria-label="Felgen nach Zollgröße">
                <li v-for="size in sizeTiles" :key="size.value" class="plp__sizes-item">
                    <button class="plp__size" type="button" :aria-pressed="size.on" :disabled="size.count === 0 && !size.on" @click="filters.toggle('zoll', size.value)">
                        <span class="display num plp__size-number">{{ size.inch }}</span>
                        <span class="small muted">Zoll</span>
                        <span class="small num muted">{{ size.line }}</span>
                        <Icon v-if="size.on" name="check" :size="20" class="plp__size-check" />
                    </button>
                </li>
            </ul>
        </div>
    </section>

    <section class="plp__body">
        <div class="container">
            <!-- Below 1200px: one sticky bar that opens the filters. -->
            <div v-if="showFilters" class="plp__bar" :class="{ 'plp__bar--vbar': vehicleBar }">
                <button class="btn btn--secondary plp__bar-btn" type="button" @click="sheetOpen = true">
                    <Icon name="filter" :size="20" />
                    Filter
                    <span v-if="appliedCount > 0" class="plp__bar-n tabular">{{ appliedCount }}</span>
                </button>
                <div v-if="quick.length > 0" class="plp__quick" role="group" aria-label="Schnellauswahl: Marke">
                    <button
                        v-for="option in quick"
                        :key="`${option.facet}-${option.value}`"
                        class="chip plp__chip"
                        type="button"
                        :aria-pressed="option.on"
                        :disabled="option.count === 0 && !option.on"
                        @click="filters.toggle(option.facet, option.value)"
                    >
                        {{ option.label }} <span class="plp__chip-n tabular">{{ option.count }}</span>
                    </button>
                </div>
            </div>

            <div class="plp__layout" :class="{ 'plp__layout--filters': showFilters, 'plp__layout--vbar': vehicleBar }">
                <aside v-if="showFilters" class="plp__side" aria-label="Filter">
                    <FilterBar
                        :facets="facets"
                        :filters="filters.current.value"
                        :total="total"
                        @toggle="filters.toggle"
                        @toggle-entry="filters.toggleEntry"
                        @reset="filters.reset"
                    />
                </aside>

                <div ref="results" class="plp__results">
                    <!-- The tiles' names are third-level headings; this is the second level they stand under, on every
                         width — on a phone „Filter“ is a button, not a heading (finding 112). -->
                    <h2 class="visually-hidden">Ergebnisse</h2>
                    <!-- The same card as the homepage (home-overhaul.md §1): one CTA, one checkbox. -->
                    <div v-if="cards.length > 0" class="tile-grid plp__grid">
                        <ProductTile
                            v-for="(card, i) in cards"
                            :key="`${card.modelId}-${card.finishId}`"
                            :card="card"
                            :vehicle="vehicle"
                            :eager="i === 0"
                            :prompt="i > 0 && i < FIRST_SCREEN"
                            sizes="(min-width: 1280px) 240px, (min-width: 1024px) 22vw, (min-width: 768px) 30vw, 45vw"
                            compare
                        />
                    </div>

                    <!-- Never an empty grid: the gap is named and two ways forward are offered. -->
                    <div v-else class="state">
                        <Icon name="info" :size="24" />
                        <p class="state__title">
                            {{
                                appliedCount > 0
                                    ? 'Keine Felge passt zu diesen Filtern.'
                                    : hasVehicle
                                        ? 'Für dieses Fahrzeug haben wir noch keine freigegebenen Felgen.'
                                        : 'Im Sortiment ist gerade keine Felge.'
                            }}
                        </p>
                        <p class="t-body">
                            RIMIFY zeigt ausschließlich Felgen, für die ein gültiges Gutachten vorliegt.<template v-if="catalogueEmpty"> Sobald die ersten freigegeben sind, stehen sie hier.</template>
                        </p>
                        <!-- F2's real endpoint, never the old contact form, which sent nothing (ACCURACY D5). -->
                        <VehicleNotify
                            v-if="appliedCount === 0 && vehicle"
                            :vehicle-id="vehicle.id"
                            :vehicle-label="vehicle.short"
                        />
                        <div class="cluster">
                            <button
                                v-if="appliedCount > 0"
                                class="btn btn--primary"
                                type="button"
                                @click="filters.reset()"
                            >
                                Filter zurücksetzen
                            </button>
                            <Link v-if="catalogueEmpty" :href="contactHref({ subject: 'Ich suche eine Felge', from: '/felgen' })" class="btn btn--secondary">Schreib uns</Link>
                            <Link v-else href="/felgen-suchen" class="btn btn--secondary">{{ hasVehicle ? 'Anderes Fahrzeug wählen' : 'Fahrzeug wählen' }}</Link>
                        </div>
                    </div>

                    <nav v-if="lastPage > 1" class="pager plp__pager" aria-label="Seiten">
                        <button
                            v-for="n in pages"
                            :key="n"
                            class="pager__page"
                            :class="{ 'pager__page--on': currentPage === n }"
                            type="button"
                            :aria-current="currentPage === n ? 'page' : undefined"
                            @click="filters.goToPage(n)"
                        >
                            {{ n }}
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    </section>

    <!-- The way on from the end of the list, and the band that closes the page above the footer. Nothing to close without a list. -->
    <section v-if="cards.length > 0" class="plp__closing section--tight">
        <div class="container plp__closing-in">
            <div class="plp__closing-text">
                <h2 class="h2">{{ hasVehicle ? 'Frage zu einer dieser Felgen?' : 'Nicht sicher, ob eine Felge passt?' }}</h2>
                <p class="plp__closing-lead">{{ hasVehicle ? 'Schreib uns, wir sehen für dein Fahrzeug nach.' : 'Im RIMIFY-Check siehst du, ob sie für dein Auto freigegeben ist und unter welchen Auflagen.' }}</p>
            </div>
            <div class="cluster">
                <Link v-if="!hasVehicle" href="/rimify-check" class="btn btn--primary">Zum RIMIFY-Check</Link>
                <Link :href="contactHref({ subject: 'Frage zu einer Felge', from: '/felgen' })" class="btn" :class="hasVehicle ? 'btn--primary' : 'btn--secondary'">Schreib uns</Link>
            </div>
        </div>
    </section>

    <!-- The filter sheet: the same panel as the sidebar, with the live count on its button. -->
    <template v-if="sheetOpen">
        <div class="scrim" @click="sheetOpen = false" />
        <div class="sheet plp__sheet" role="dialog" aria-modal="true" aria-label="Filter">
            <div class="sheet__grab" />
            <FilterBar
                :facets="facets"
                :filters="filters.current.value"
                :total="total"
                @toggle="filters.toggle"
                @toggle-entry="filters.toggleEntry"
                @reset="filters.reset"
            />
            <div class="plp__apply">
                <button class="btn btn--primary btn--block" type="button" @click="sheetOpen = false">
                    {{ formatNumber(shownCount) }} {{ shownCount === 1 ? 'Felge' : 'Felgen' }} anzeigen
                </button>
            </div>
        </div>
    </template>
</template>

<style scoped>
.plp__top {
    padding-block: var(--sp-16) var(--sp-32);
    background: var(--c-band-blue);
}

.plp__top > .wrap > :last-child {
    margin-bottom: 0;
}

/* The bar below 1200 px starts just under the band; beside the column the white has room. */
.plp__body {
    padding-block: var(--sp-8) var(--sp-48);
}

.plp__closing {
    background: var(--c-band-blue);
}

/* Brought back into view by a filter: under the header, and on a phone under the sticky bar too. */
.plp__results {
    scroll-margin-top: calc(var(--plp-top, var(--header-h)) + var(--sp-16));
}

@media (max-width: 1199px) {
    .plp__results {
        scroll-margin-top: calc(var(--header-h) + 124px);
    }
}

.plp__demoline {
    display: block;
    margin-top: var(--sp-4);
}

/* As the home page's size tiles: white on the band, the number the tile. One row that scrolls sideways on a phone. */
.plp__sizes {
    display: flex;
    gap: var(--sp-8);
    margin: var(--sp-16) calc(-1 * var(--page-margin)) 0;
    padding: 0 var(--page-margin) var(--sp-4);
    overflow-x: auto;
    scrollbar-width: none;
    overscroll-behavior-x: contain;
}

.plp__sizes::-webkit-scrollbar {
    display: none;
}

.plp__sizes-item {
    flex: none;
    min-width: 0;
}

.plp__size {
    position: relative;
    display: grid;
    align-content: end;
    width: calc(11 * var(--ch-text));
    min-height: 96px;
    padding: var(--sp-12);
    border: 0;
    border-radius: var(--r-tile);
    background: var(--c-surface);
    color: var(--c-ink);
    text-align: left;
    cursor: pointer;
}

.plp__size-number {
    margin-bottom: var(--sp-4);
    white-space: nowrap;
    transition: color var(--d-1) var(--ease-std);
}

.plp__size[aria-pressed='true'] {
    outline: 2px solid var(--c-blue);
    outline-offset: -2px;
}

.plp__size-check {
    position: absolute;
    top: var(--sp-8);
    right: var(--sp-8);
    color: var(--c-blue);
}

.plp__size:disabled {
    cursor: not-allowed;
}

.plp__size:disabled .plp__size-number {
    color: var(--c-ink-3);
}

@media (hover: hover) and (pointer: fine) {
    .plp__size:not(:disabled):hover .plp__size-number {
        color: var(--c-blue);
    }

    .plp__crumbs a:hover {
        text-decoration: underline;
    }
}

@media (min-width: 768px) {
    .plp__sizes {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: var(--gutter);
        margin-inline: 0;
        padding: 0;
        overflow: visible;
    }

    .plp__size {
        width: 100%;
    }
}

@media (max-width: 639px) {
    .plp__notice .btn {
        flex: 1 0 100%;
    }
}

.plp__closing-in {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-24);
}

.plp__closing-text {
    flex: 1 1 calc(40 * var(--ch-text));
}

.plp__closing-lead {
    max-width: calc(60 * var(--ch-text));
    margin-top: var(--sp-8);
    color: var(--c-ink-2);
}

.plp__crumbs {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--ink3);
}

.plp__crumbs a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink2);
    text-decoration: none;
}

.plp__head {
    margin-bottom: var(--space-5);
}

.plp__count {
    margin-top: var(--space-2);
    color: var(--ink2);
    font-size: var(--fs-body-l);
    line-height: var(--lh-body-l);
}

/* The question about the car, above the grid it decides: on the page's band now (#32), the band its panel, the
   full width of the page, so its white options read as the buttons they are (DIRECTION §4: no bordered card). */
.plp__ask {
    margin-bottom: var(--space-5);
}

.plp__ask :deep(.bf) {
    margin-block: 0;
}

/* The band its panel: a pressed option's own tint would look like a hole among the white ones. */
.plp__ask :deep(.bf__option[aria-pressed='true']) {
    background: var(--c-surface);
}

/* Nothing asked, only said: a line under the count, not a panel. „Ändern“ opens the choice on the band. */
/* What the tyres wait for (D-286): the sentence in ink, the form's button under it. */
/* As the no-car notice says its one thing: the icon, body size, a line one can read (DIRECTION §3). */
.plp__papers-lead {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-12);
    max-width: calc(64 * var(--ch-text));
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    color: var(--c-ink);
}

.plp__papers-lead :deep(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--c-ink-2);
}

.plp__papers :deep(.pp) {
    margin-block: var(--sp-8) 0;
}

/* Given, not asked: the figures in one line, as the body style's. „Ändern“ opens the form on the band. */
.plp__papers--said:not(:has(.pp__form)) :deep(.pp) {
    margin-block: 0;
}

.plp__notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
    padding: var(--space-4);
    background: var(--c-surface);
    border-radius: var(--radius-md);
    color: var(--ink2);
}

.plp__notice-text {
    flex: 1 1 260px;
    color: var(--ink);
    font-weight: 700;
}

/* Sticky under the header, so the filters are one tap away wherever the customer has scrolled. */
.plp__bar {
    position: sticky;
    top: var(--header-h);
    z-index: var(--z-sticky);
    margin: 0 calc(var(--page-margin) * -1) var(--space-4);
    padding: var(--space-2) var(--page-margin);
    background: var(--ground);
    border-bottom: 1px solid var(--line);
}

.plp__bar-btn {
    width: 100%;
}

/* One row that scrolls sideways: the choices at hand without a sheet, never wrapping the bar taller. */
.plp__quick {
    display: flex;
    gap: var(--sp-8);
    margin: var(--sp-8) calc(var(--page-margin) * -1) 0;
    padding: 0 var(--page-margin) var(--sp-4);
    overflow-x: auto;
    scrollbar-width: none;
    overscroll-behavior-x: contain;
}

.plp__quick::-webkit-scrollbar {
    display: none;
}

.plp__chip {
    flex: none;
    white-space: nowrap;
}

.plp__chip-n {
    color: var(--c-ink-3);
}

.plp__chip[aria-pressed='true'] .plp__chip-n {
    color: inherit;
}

.plp__bar-n {
    display: inline-grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    padding-inline: var(--space-1);
    border-radius: var(--radius-round);
    background: var(--blue);
    color: var(--c-surface);
    font-size: var(--text-micro);
}

.plp__side {
    display: none;
}

.plp__pager {
    margin-top: var(--space-7);
}

.plp__sheet {
    max-height: 92vh;
    padding-bottom: 0;
}

/* Sticky inside the sheet, because the count is the reason to press it. */
.plp__apply {
    position: sticky;
    bottom: 0;
    margin: var(--space-5) calc(var(--page-margin) * -1) 0;
    padding: var(--space-3) var(--page-margin) calc(var(--space-3) + env(safe-area-inset-bottom));
    background: var(--surface);
    border-top: 1px solid var(--line);
}

@media (min-width: 640px) {
    .plp__bar-btn {
        width: auto;
    }
}

/* Under the vehicle bar too, where it shows (#24, D-120): a sticky row must not slide beneath another. The header's
   height is one token at every width (tokens.css, the client's #2): no breakpoint here repeats it. */
.plp__bar--vbar {
    top: calc(var(--header-h) + var(--vbar-h));
}

@media (min-width: 1200px) {
    .plp__bar {
        display: none;
    }

    .plp__layout--filters {
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        gap: var(--space-6);
        align-items: start;
    }

    /*
     * The client's #24 (D-120): the column starts under everything sticky above it — the header and, where it shows,
     * the vehicle bar — and is never taller than what is left of the window, so its last option and the end of its
     * scrollbar are on screen. Its ends hand the wheel to the page (D-412): held back, a column pushed up by the page's end
     * sat with its first filters out of view and nothing the wheel could do about it (the client's #24 again, 07.11.2026).
     */
    .plp__layout {
        --plp-top: calc(var(--header-h) + var(--space-4));
    }

    .plp__layout--vbar {
        --plp-top: calc(var(--header-h) + var(--vbar-h) + var(--space-4));
    }

    .plp__side {
        display: block;
        position: sticky;
        top: var(--plp-top);
        max-height: calc(100dvh - var(--plp-top) - var(--space-4));
        overflow-y: auto;
        /* The scrollbar's room is kept whether or not it shows, so nothing moves as the column fills (#24). */
        scrollbar-gutter: stable;
        padding: 0 var(--space-3) var(--space-4) 0;
        background: var(--surface);
    }

    .plp__body {
        padding-top: var(--sp-32);
    }

    /* Beside the filters there is room for three columns, not four. */
    .plp__layout--filters .plp__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}
</style>
