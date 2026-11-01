<script setup lang="ts">
/**
 * A product page whose every version can be chosen, as a sketch (the Gutachten rework brief §8, §11 Phase 1): Farbe, then
 * Durchmesser, then Ausführung — one chip per version the admin defines, naming width, ET and bolt pattern with its price,
 * never three selectors that could combine into a wheel that does not exist. Without a car every version shows; with one,
 * only those a released paper approves for it, and the rest counted in words that are true for each (R-17) — and
 * brought back on request, so nobody concludes the wheel is not made in that size.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import BuyModeChoice from '../../Components/Product/BuyModeChoice.vue'
import ProductPhoto from '../../Components/Product/ProductPhoto.vue'
import SketchBanner from '../../Components/Sketch/SketchBanner.vue'
import Icon from '../../Components/Ui/Icon.vue'
import VerdictBadge from '../../Components/Ui/VerdictBadge.vue'
import { ABNAHME_REQUIRED, ENTRY_REQUIRED } from '../../fitment/papers'
import { zoll } from '../../format'
import { formatMoney } from '../../lib/num'
import { CAR, VERSIONS, WHEEL, boreText, versionLine, versionShort, type Version } from './shopDemo'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<{
    mitFahrzeug: boolean
    ausfuehrung: string | null
}>()

const withCar = ref(props.mitFahrzeug)
const start = VERSIONS.find((v) => v.id === props.ausfuehrung) ?? VERSIONS[0]
const finishId = ref(start?.finish ?? 'blue')
const diameter = ref(start?.diameter ?? 18)
const versionId = ref(start?.id ?? '')
const showOthers = ref(false)
const added = ref(false)
const mode = ref<'felgen' | 'komplettrad'>('felgen')

const finish = computed(() => WHEEL.finishes.find((f) => f.id === finishId.value) ?? WHEEL.finishes[0])
const ofFinish = computed(() => VERSIONS.filter((v) => v.finish === finishId.value))
const diameters = computed(() => [...new Set(ofFinish.value.map((v) => v.diameter))])

/* With a car, a diameter none of whose versions the car may have is still shown, struck through, as the page does today. */
function diameterOpen(d: number): boolean {
    return !withCar.value || ofFinish.value.some((v) => v.diameter === d && v.forCar === 'conditional')
}

const inDiameter = computed(() => ofFinish.value.filter((v) => v.diameter === diameter.value))
const approved = computed(() => (withCar.value ? inDiameter.value.filter((v) => v.forCar === 'conditional') : inDiameter.value))
const others = computed(() => (withCar.value ? inDiameter.value.filter((v) => v.forCar !== 'conditional') : []))
const version = computed<Version | undefined>(() => approved.value.find((v) => v.id === versionId.value) ?? approved.value[0])

/* The count line in words true for each version: ruled out by a paper, or simply no approval on record (R-17). */
const othersLine = computed(() => {
    const refused = others.value.filter((v) => v.forCar === 'refused').length
    const none = others.value.length - refused
    const parts: string[] = []

    if (refused) {
        parts.push(`${refused === 1 ? '1 weitere Ausführung ist' : `${refused} weitere Ausführungen sind`} für deinen ${CAR.short} nicht freigegeben`)
    }

    if (none) {
        parts.push(`für ${none === 1 ? '1 weitere Ausführung' : `${none} weitere Ausführungen`} liegt uns für deinen ${CAR.short} keine Freigabe vor`)
    }

    const line = parts.join('; ')

    return line.charAt(0).toUpperCase() + line.slice(1) + '.'
})

function chooseFinish(id: string): void {
    finishId.value = id
}

watch([finishId, diameter, withCar], () => {
    if (!approved.value.some((v) => v.id === versionId.value)) {
        versionId.value = approved.value[0]?.id ?? inDiameter.value[0]?.id ?? ''
    }

    showOthers.value = false
})

function remember(): void {
    const url = new URL(window.location.href)

    url.searchParams.set('fahrzeug', withCar.value ? '1' : '0')
    url.searchParams.set('ausfuehrung', version.value?.id ?? '')
    window.history.replaceState(window.history.state, '', url)
}

onMounted(() => {
    if (!diameterOpen(diameter.value)) {
        diameter.value = diameters.value.find(diameterOpen) ?? diameter.value
    }

    // A link to a version the car has no approval for opens on the approved one, and the address says which.
    if (version.value !== undefined && version.value.id !== versionId.value) {
        versionId.value = version.value.id
    }

    remember()
    watch([withCar, versionId, version], remember)
})

/* „Fahrzeug wählen": the answer appears where the button was, and the focus goes to it. */
function chooseCar(): void {
    withCar.value = true
    void nextTick(() => document.querySelector<HTMLElement>('.sf-check__verdict')?.focus())
}

const komplettradHref = computed(() => `/skizze/komplettraeder?ausfuehrung=${version.value?.id ?? ''}`)
</script>

<template>
    <Head title="Skizze: Ausführungen auf der Produktseite">
        <meta head-key="robots" name="robots" content="noindex">
    </Head>

    <section class="section-dense">
        <div class="wrap sf">
            <SketchBanner note="So soll die Produktseite jede Ausführung einer Felge zeigen. Preise, Verfügbarkeit und Freigaben sind Beispiele; in den Warenkorb kommt nichts." />

            <div class="sf-state" role="group" aria-label="Zustand der Skizze">
                <span class="sf-state__label">Skizze zeigen</span>
                <button class="chip" type="button" :aria-pressed="!withCar" @click="withCar = false">Ohne Fahrzeug</button>
                <button class="chip" type="button" :aria-pressed="withCar" @click="withCar = true">Mit Fahrzeug: {{ CAR.name }}</button>
            </div>

            <nav class="sf-crumbs t-small" aria-label="Brotkrumen">
                <span>Startseite</span>
                <span aria-hidden="true">/</span>
                <span>Felgen</span>
                <span aria-hidden="true">/</span>
                <span aria-current="page" translate="no">{{ WHEEL.brand }} {{ WHEEL.model }}</span>
            </nav>

            <div class="sf-grid">
                <div class="sf-gallery">
                    <div class="well sf-well">
                        <ProductPhoto :spokes="WHEEL.spokes" :finish="finish?.art ?? 'graphite'" :size="560" />
                    </div>
                </div>

                <div class="sf-buy">
                    <h1 class="t-h1" translate="no">{{ WHEEL.brand }} {{ WHEEL.model }}</h1>

                    <div class="sf-block">
                        <span class="label">Farbe · <span translate="no">{{ finish?.name }}</span></span>
                        <div class="sf-swatches">
                            <button
                                v-for="item in WHEEL.finishes"
                                :key="item.id"
                                class="sf-swatch"
                                :class="{ 'sf-swatch--on': item.id === finishId }"
                                type="button"
                                :aria-pressed="item.id === finishId"
                                @click="chooseFinish(item.id)"
                            >
                                <span class="sf-dot" data-qa-ignore :style="{ '--swatch': item.hex }" />
                                <span translate="no">{{ item.name }}</span>
                            </button>
                        </div>
                    </div>

                    <div class="sf-block">
                        <span class="label">Durchmesser (<span translate="no">Zoll</span>)</span>
                        <div class="chip-row sf-chips">
                            <button
                                v-for="d in diameters"
                                :key="d"
                                class="chip"
                                :class="{ 'chip--on': d === diameter, 'chip--struck': !diameterOpen(d) }"
                                type="button"
                                :disabled="!diameterOpen(d)"
                                :aria-pressed="d === diameter"
                                :title="diameterOpen(d) ? undefined : `Für deinen ${CAR.short} liegt uns in ${zoll(d)} keine Freigabe vor.`"
                                @click="diameter = d"
                            >
                                {{ d }}
                            </button>
                        </div>
                    </div>

                    <div class="sf-block">
                        <span id="sf-versions-label" class="label">Ausführung</span>
                        <div class="sf-versions" role="group" aria-labelledby="sf-versions-label">
                            <button
                                v-for="item in approved"
                                :key="item.id"
                                class="sf-version"
                                :class="{ 'sf-version--on': item.id === version?.id }"
                                type="button"
                                :aria-pressed="item.id === version?.id"
                                @click="versionId = item.id"
                            >
                                <span class="sf-version__spec">{{ versionLine(item) }}</span>
                                <span class="sf-version__price">{{ formatMoney(item.priceCents) }}</span>
                                <span v-if="!item.available" class="tag tag--unknown sf-version__ask">Auf Anfrage</span>
                                <span class="sf-version__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                            </button>
                        </div>

                        <p v-if="!withCar" class="t-small sf-hint sf-hint--icon">
                            <Icon name="car" :size="20" />
                            <span>Wähle dein Fahrzeug, dann zeigen wir nur die Ausführungen, die dafür freigegeben sind.</span>
                        </p>
                        <p v-else-if="others.length" class="t-small sf-hint">
                            {{ othersLine }}
                            <button class="sf-link" type="button" :aria-expanded="showOthers" @click="showOthers = !showOthers">{{ showOthers ? 'Ausblenden' : 'Anzeigen' }}</button>
                        </p>
                        <div v-if="showOthers" class="sf-versions sf-versions--others">
                            <span v-for="item in others" :key="item.id" class="sf-version sf-version--struck">
                                <span class="sf-version__spec">{{ versionLine(item) }}</span>
                                <span class="sf-version__why">{{ item.forCar === 'refused' ? 'nicht freigegeben' : 'keine Freigabe vorliegend' }}</span>
                            </span>
                        </div>

                        <p v-if="version" class="t-small quiet sf-chosen">
                            Gewählt: {{ versionShort(version) }} · Mittenloch {{ boreText(version) }} · {{ version.available ? 'verfügbar' : 'auf Anfrage' }}
                        </p>
                    </div>

                    <div class="sf-check" :class="{ 'sf-check--warn': withCar && version }">
                        <p class="label sf-check__title">RIMIFY-Check</p>
                        <template v-if="withCar && version">
                            <h2 class="sf-check__verdict" tabindex="-1">
                                <VerdictBadge status="CONDITIONAL" size="lg" />
                                <span>für deinen {{ CAR.name }}</span>
                            </h2>
                            <ul class="sf-check__papers">
                                <li>{{ ABNAHME_REQUIRED }}</li>
                                <li>{{ ENTRY_REQUIRED }}</li>
                            </ul>
                        </template>
                        <template v-else>
                            <p class="sf-check__line">Noch kein Fahrzeug gewählt</p>
                            <button class="btn btn--secondary sf-check__cta" type="button" @click="chooseCar">
                                <Icon name="car" :size="20" />
                                Fahrzeug wählen
                            </button>
                        </template>
                    </div>

                    <div class="sf-block">
                        <BuyModeChoice v-model="mode" name="sf-mode" :rim-price="version ? formatMoney(version.priceCents) : null" />
                        <template v-if="mode === 'komplettrad'">
                            <Link v-if="withCar && version?.forCar === 'conditional'" class="btn btn--secondary sf-next" :href="komplettradHref">
                                Weiter zur Reifenwahl
                                <Icon name="arrow-right" :size="20" />
                            </Link>
                            <p v-else class="t-small sf-hint sf-next">
                                Kompletträder stellen wir für ein Fahrzeug zusammen.
                                <button class="sf-link" type="button" @click="chooseCar">Fahrzeug wählen</button>
                            </p>
                        </template>
                    </div>

                    <div v-if="version && mode === 'felgen'" class="sf-price">
                        <p class="price price--lg">{{ formatMoney(version.setCents) }}</p>
                        <p class="price-note">4 × {{ formatMoney(version.priceCents) }} · inkl. MwSt., zzgl. Versandkosten</p>
                        <button class="btn btn--primary btn--block btn--lg sf-add" type="button" @click="added = true">{{ version.available ? 'In den Warenkorb' : 'Anfrage senden' }}</button>
                        <p v-if="added" class="t-small sf-added" role="status">In der Skizze kommt nichts in den Warenkorb.</p>
                    </div>
                </div>
            </div>

            <aside class="sf-tile-note" aria-labelledby="sf-tile-h">
                <h2 id="sf-tile-h" class="label">So sieht die Kachel in der Felgenliste aus</h2>
                <div class="tile sf-tile">
                    <div class="well sf-tile__well">
                        <ProductPhoto :spokes="WHEEL.spokes" :finish="finish?.art ?? 'graphite'" :size="200" :note="false" />
                    </div>
                    <p class="tile__brand" translate="no">{{ WHEEL.brand }}</p>
                    <p class="tile__name" translate="no">{{ WHEEL.model }}</p>
                    <p class="t-small quiet">{{ ofFinish.length }} Ausführungen · 18 und 19 Zoll</p>
                    <p v-if="withCar"><VerdictBadge status="CONDITIONAL" /></p>
                    <p class="sf-tile__price">ab {{ formatMoney(Math.min(...ofFinish.map((v) => v.priceCents))) }} <span class="t-small quiet">pro Felge</span></p>
                </div>
            </aside>
        </div>
    </section>
</template>

<style scoped>
.sf {
    display: grid;
    gap: var(--sp-24);
}

.sf-state {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
}

.sf-state__label {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
}

.sf-crumbs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    color: var(--c-ink-2);
}

.sf-grid {
    display: grid;
    gap: var(--sp-32);
    align-items: start;
}

@media (min-width: 900px) {
    .sf-grid {
        grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
        gap: var(--sp-48);
    }
}

.sf-well {
    max-width: min(100%, 56vh);
    margin-inline: auto;
}

@media (min-width: 900px) {
    .sf-well {
        max-width: none;
    }
}

.sf-block {
    display: grid;
    gap: var(--sp-8);
    margin-top: var(--sp-24);
}

.sf-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.sf-swatch {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
    min-height: 44px;
    padding-inline: var(--sp-12);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    color: var(--c-ink-2);
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 700;
    cursor: pointer;
}

.sf-swatch--on {
    border-color: var(--c-ink);
    color: var(--c-ink);
}

.sf-dot {
    width: 16px;
    height: 16px;
    border: 1px solid var(--c-line);
    border-radius: var(--r-round);
    background: var(--swatch, var(--c-ink-2));
}

.sf-versions {
    display: grid;
    gap: var(--sp-8);
}

.sf-version {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--sp-4) var(--sp-12);
    min-height: 48px;
    padding: var(--sp-8) var(--sp-40) var(--sp-8) var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    color: var(--c-ink);
    font: inherit;
    font-size: var(--fs-small);
    text-align: left;
    cursor: pointer;
    transition: border-color var(--d-1) var(--ease-std), background-color var(--d-1) var(--ease-std);
}

/* One selected state for every tile on the page: 2 px blue and the check, no tint (D-132). */
.sf-version--on {
    padding: calc(var(--sp-8) - 1px) calc(var(--sp-40) - 1px) calc(var(--sp-8) - 1px) calc(var(--sp-16) - 1px);
    border: 2px solid var(--c-blue);
}

.sf-version:active {
    background: var(--c-band);
}

@media (hover: hover) and (pointer: fine) {
    .sf-version:not(.sf-version--struck):hover {
        border-color: var(--c-ink-3);
    }

    .sf-version--on:hover {
        border-color: var(--c-blue);
    }

    .sf-swatch:hover {
        border-color: var(--c-ink-3);
    }
}

.sf-version__check {
    position: absolute;
    top: 50%;
    right: var(--sp-12);
    display: none;
    color: var(--c-blue);
    transform: translateY(-50%);
}

.sf-version--on .sf-version__check {
    display: inline-flex;
}

.sf-version__why {
    color: var(--c-ink-3);
    font-size: var(--fs-micro);
}

.sf-version__spec {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.sf-version__price {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.sf-version__ask {
    grid-column: 1 / -1;
    justify-self: start;
}

.sf-version--struck {
    color: var(--c-ink-3);
    cursor: default;
}

.sf-version--struck .sf-version__spec {
    text-decoration: line-through;
}

.sf-hint {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--sp-8);
    margin: 0;
    color: var(--c-ink-2);
}

.sf-hint--icon {
    flex-wrap: nowrap;
    align-items: flex-start;
}

.sf-hint--icon :deep(svg) {
    flex: none;
}

.sf-link {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--c-blue);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
}

.sf-chosen {
    margin: 0;
}

.sf-check {
    display: grid;
    gap: var(--sp-8);
    margin-top: var(--sp-24);
    padding: var(--sp-16);
    border-radius: var(--r-tile);
    background: var(--c-band);
}

.sf-check--warn {
    background: var(--c-warn-tint);
}

.sf-check__verdict:focus {
    outline: none;
}

.sf-check__verdict {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: 0;
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
    font-weight: 600;
}

.sf-check__papers {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding-left: var(--sp-20);
    color: var(--c-ink);
    list-style: disc;
}

.sf-check__title {
    margin: 0;
}

.sf-check__line {
    margin: 0;
    font-weight: 600;
}

.sf-check__cta {
    justify-self: start;
}

.sf-price {
    display: grid;
    gap: var(--sp-4);
    margin-top: var(--sp-24);
}

.sf-price .price,
.sf-price .price-note {
    margin: 0;
}

.sf-next {
    justify-self: start;
    margin-top: var(--sp-8);
}

.sf-add {
    margin-top: var(--sp-8);
}

.sf-added {
    margin: 0;
    color: var(--c-ink-2);
}

.sf-tile-note {
    display: grid;
    gap: var(--sp-12);
    padding-top: var(--sp-24);
    border-top: 1px solid var(--c-line);
}

.sf-tile {
    display: grid;
    gap: var(--sp-4);
    width: min(100%, 260px);
}

.sf-tile__name,
.sf-tile__price {
    margin: 0;
    font-weight: 700;
}
</style>
