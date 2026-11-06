<script setup lang="ts">
/**
 * The Komplettrad chosen step by step, as a sketch (the Gutachten rework brief §9): 1 Felge — the version from the product
 * page — 2 Reifen, as tiles with pictures, filters and more on request, 3 Extras, never a paid one preselected, 4 Warenkorb.
 * The steps wear the admin's step bar, so the shop and the admin read as one product. Only tyres the paper allows for the
 * car and the version are listed; the real list will read them from the verdict as it is, unchanged. Every choice is
 * shown as the shop shows one: a 2 px blue border and the check, no tint (D-132).
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import ProductPhoto from '../../Components/Product/ProductPhoto.vue'
import SketchBanner from '../../Components/Sketch/SketchBanner.vue'
import SketchSteps from '../../Components/Ui/StepBar.vue'
import Icon from '../../Components/Ui/Icon.vue'
import VerdictBadge from '../../Components/Ui/VerdictBadge.vue'
import { ABNAHME_REQUIRED, ENTRY_REQUIRED } from '../../fitment/papers'
import { formatMoney } from '../../lib/num'
import { PRICE_BANDS, basketLines, filterTyres, fitFor, initialExtras, setPrice, sizesOf, total, type Mode, type Rdks, type TyreFilter } from './komplettradSketch'
import TyreCard from './parts/TyreCard.vue'
import TyreDetails from './parts/TyreDetails.vue'
import { CAR, MOUNTING_EACH_CENTS, MOUNTING_SET_CENTS, RDKS, SEASONS, TYRES, TYRE_BRANDS, VERSIONS, WEIGHTS, WHEEL, versionShort, type Version } from './shopDemo'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<{
    schritt: number | null
    ausfuehrung: string | null
}>()

const STEPS = ['Felge', 'Reifen', 'Extras', 'Warenkorb']
const FIRST = 6

/*
 * The version from the product page. One the car has no approval for is never swapped in silence: the nearest approved
 * one is shown — the same colour and diameter where there is one — and the page says what happened.
 */
const asked = VERSIONS.find((v) => v.id === props.ausfuehrung) ?? null
const approved = VERSIONS.filter((v) => v.forCar === 'conditional')
const version: Version =
    (asked?.forCar === 'conditional' ? asked : null) ??
    approved.find((v) => v.finish === asked?.finish && v.diameter === asked?.diameter) ??
    approved.find((v) => v.finish === asked?.finish) ??
    approved[0] ??
    VERSIONS[0]!
const swapped = asked !== null && asked.id !== version.id
    ? `${asked.forCar === 'refused' ? `Die Ausführung ${versionShort(asked)} ist für deinen ${CAR.short} nicht freigegeben` : `Für die Ausführung ${versionShort(asked)} liegt uns für deinen ${CAR.short} keine Freigabe vor`}. Gezeigt wird deshalb ${versionShort(version)}.`
    : null
const finish = WHEEL.finishes.find((f) => f.id === version.finish) ?? WHEEL.finishes[0]
const sizes = sizesOf(version.diameter)
const fitted = TYRES.map((tyre) => fitFor(tyre, version.diameter))
const STORAGE = 'rimify-skizze-komplettrad'

const step = ref((props.schritt ?? 2) - 1)
const reached = ref(Math.max(step.value, 1))
const filter = reactive<TyreFilter>({ mode: 'same', seasons: [], brands: [], price: 'alle', sort: 'preis-auf' })
const all = ref(false)
const chosenId = ref<string | null>(null)
const detailsId = ref<string | null>(null)
const detailsOpen = ref(false)
const start = initialExtras()
const weights = ref(start.weights)
const rdks = ref<Rdks>(start.rdks)
const added = ref(false)

const list = computed(() => filterTyres(fitted, filter))
const shown = computed(() => (all.value ? list.value : list.value.slice(0, FIRST)))
const chosen = computed(() => fitted.find((t) => t.id === chosenId.value) ?? null)
const details = computed(() => fitted.find((t) => t.id === detailsId.value) ?? null)
const lines = computed(() => (chosen.value ? basketLines(version, chosen.value, filter.mode, weights.value, rdks.value) : []))

/* The address of a step: Back goes one step back, a link opens the step it names. */
function address(to: number): URL {
    const url = new URL(window.location.href)

    url.searchParams.set('schritt', String(to + 1))
    url.searchParams.set('ausfuehrung', version.id)

    return url
}

/* A step needs the ones before it: without a tyre chosen there are no extras and no basket. */
function allowed(to: number): number {
    return to >= 2 && chosen.value === null ? 1 : to
}

function go(to: number, push = true, focus = true): void {
    step.value = allowed(to)
    reached.value = Math.max(reached.value, step.value)

    if (typeof window === 'undefined') {
        return
    }

    if (push) {
        window.history.pushState({ ...window.history.state, skizzeSchritt: step.value }, '', address(step.value))
    }

    if (focus) {
        window.scrollTo({ top: 0 })
        void nextTick(() => document.querySelector<HTMLElement>('.kr-step__title')?.focus({ preventScroll: true }))
    }
}

function more(): void {
    all.value = true
    void nextTick(() => document.querySelectorAll<HTMLInputElement>('.kr-card__pick input')[FIRST]?.focus())
}

function back(): void {
    const at = Number(new URL(window.location.href).searchParams.get('schritt'))

    go(Number.isInteger(at) && at >= 1 && at <= 4 ? at - 1 : 1, false)
}

/* The choices survive a reload in this browser's session, for this version only; nothing reaches the server. */
onMounted(() => {
    try {
        const saved = JSON.parse(sessionStorage.getItem(STORAGE) ?? 'null') as { version: string; tyre: string | null; mode: Mode; weights: string; rdks: Rdks } | null

        if (saved !== null && saved.version === version.id) {
            filter.mode = saved.mode
            chosenId.value = saved.tyre
            weights.value = saved.weights
            rdks.value = saved.rdks
        }
    } catch {
        // A session that cannot be read starts the choice afresh.
    }

    // The step the address names, if what it needs is there; the address said so too.
    go(step.value, false, false)
    window.history.replaceState({ ...window.history.state, skizzeSchritt: step.value }, '', address(step.value))
    window.addEventListener('popstate', back)

    watch([chosenId, () => filter.mode, weights, rdks], () => {
        try {
            sessionStorage.setItem(STORAGE, JSON.stringify({ version: version.id, tyre: chosenId.value, mode: filter.mode, weights: weights.value, rdks: rdks.value }))
        } catch {
            // Private windows may refuse storage; the sketch still works, it just forgets.
        }
    })
})

onBeforeUnmount(() => window.removeEventListener('popstate', back))

function toggle<T>(listOf: T[], value: T): T[] {
    return listOf.includes(value) ? listOf.filter((v) => v !== value) : [...listOf, value]
}

function chooseDetails(): void {
    if (details.value) {
        chosenId.value = details.value.id
    }
}

function openDetails(id: string): void {
    detailsId.value = id
    detailsOpen.value = true
}

function mode(value: Mode): void {
    filter.mode = value

    if (chosen.value && value === 'mixed' && chosen.value.rear === null) {
        chosenId.value = null
    }
}

watch(() => [filter.mode, filter.price, filter.sort, filter.seasons.length, filter.brands.length], () => {
    all.value = false
})
</script>

<template>
    <Head title="Skizze: Kompletträder">
        <meta head-key="robots" name="robots" content="noindex">
    </Head>

    <section class="section-dense">
        <div class="wrap kr">
            <SketchBanner note="So soll die Reifenwahl für ein Komplettrad aussehen. Reifen, Bilder, Preise und Label-Werte sind Beispiele; in den Warenkorb kommt nichts." />

            <p v-if="swapped" class="kr-swapped" role="status">{{ swapped }}</p>

            <header class="kr-head">
                <h1 class="t-h1">Kompletträder für deinen {{ CAR.name }}</h1>
                <SketchSteps :steps="STEPS" :current="step" :reached="reached" label="Schritte zum Komplettrad" @go="go" />
            </header>

            <!-- 1 Felge -->
            <section v-if="step === 0" class="kr-step" aria-labelledby="kr-wheel-h">
                <h2 id="kr-wheel-h" class="kr-step__title" tabindex="-1">Deine Felge</h2>
                <div class="kr-wheel">
                    <div class="well kr-wheel__well">
                        <ProductPhoto :spokes="WHEEL.spokes" :finish="finish?.art ?? 'graphite'" :size="220" :note="false" />
                    </div>
                    <div class="kr-wheel__facts">
                        <p class="kr-wheel__name" translate="no">{{ WHEEL.brand }} {{ WHEEL.model }} · {{ finish?.name }}</p>
                        <p class="kr-wheel__spec">{{ versionShort(version) }} · {{ formatMoney(version.setCents) }} für 4</p>
                        <p class="kr-wheel__verdict"><VerdictBadge status="CONDITIONAL" /> für deinen {{ CAR.name }}</p>
                        <Link class="kr-link" href="/felgen">Andere Ausführung wählen</Link>
                    </div>
                </div>
                <div class="kr-actions">
                    <button class="btn btn--primary" type="button" @click="go(1)">Weiter: Reifen <Icon name="arrow-right" :size="20" /></button>
                </div>
            </section>

            <!-- 2 Reifen -->
            <section v-else-if="step === 1" class="kr-step" aria-labelledby="kr-tyres-h">
                <div class="kr-step__head">
                    <h2 id="kr-tyres-h" class="kr-step__title" tabindex="-1">Reifen wählen</h2>
                    <p class="t-small quiet kr-measure">Nur Reifen, die das Gutachten für deinen {{ CAR.short }} auf {{ versionShort(version) }} erlaubt. Nötig sind mindestens Lastindex {{ sizes.li }} und Geschwindigkeitssymbol V; jeder Reifen hier erfüllt beides.</p>
                </div>

                <fieldset class="kr-mode">
                    <legend class="label kr-mode__legend">Bereifung</legend>
                    <label class="kr-opt" :class="{ 'kr-opt--on': filter.mode === 'same' }">
                        <input class="visually-hidden" type="radio" name="kr-mode" value="same" :checked="filter.mode === 'same'" @change="mode('same')">
                        <span class="kr-opt__name">Vorne und hinten gleich</span>
                        <span class="kr-opt__sub">4 × {{ sizes.front }}</span>
                        <span class="kr-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                    </label>
                    <label class="kr-opt" :class="{ 'kr-opt--on': filter.mode === 'mixed' }">
                        <input class="visually-hidden" type="radio" name="kr-mode" value="mixed" :checked="filter.mode === 'mixed'" @change="mode('mixed')">
                        <span class="kr-opt__name">Vorne und hinten verschieden</span>
                        <span class="kr-opt__sub">2 × {{ sizes.front }} vorne · 2 × {{ sizes.rear }} hinten</span>
                        <span class="kr-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                    </label>
                </fieldset>

                <div class="kr-filters">
                    <div class="kr-filter" role="group" aria-label="Saison">
                        <span class="kr-filter__label">Saison</span>
                        <button v-for="season in SEASONS" :key="season.value" class="chip" type="button" :aria-pressed="filter.seasons.includes(season.value)" @click="filter.seasons = toggle(filter.seasons, season.value)">{{ season.label }}</button>
                    </div>
                    <div class="kr-filter" role="group" aria-label="Marke">
                        <span class="kr-filter__label">Marke</span>
                        <button v-for="brand in TYRE_BRANDS" :key="brand" class="chip" type="button" :aria-pressed="filter.brands.includes(brand)" @click="filter.brands = toggle(filter.brands, brand)">{{ brand }}</button>
                    </div>
                    <div class="kr-filter" role="group" aria-label="Preis für 4 Reifen">
                        <span class="kr-filter__label">Preis für 4</span>
                        <button v-for="band in PRICE_BANDS" :key="band.value" class="chip" type="button" :aria-pressed="filter.price === band.value" @click="filter.price = band.value">{{ band.label }}</button>
                    </div>
                </div>

                <div class="kr-listhead">
                    <p class="kr-count" role="status">{{ list.length === 1 ? '1 Reifen passt' : `${list.length} Reifen passen` }}</p>
                    <label class="kr-sort">
                        <span class="kr-sort__label">Sortieren</span>
                        <select v-model="filter.sort" class="input kr-sort__select">
                            <option value="preis-auf">Preis aufsteigend</option>
                            <option value="preis-ab">Preis absteigend</option>
                            <option value="marke">Marke A–Z</option>
                        </select>
                    </label>
                </div>

                <div class="kr-grid" role="radiogroup" aria-label="Reifen">
                    <TyreCard v-for="tyre in shown" :key="tyre.id" :tyre="tyre" :mode="filter.mode" :chosen="tyre.id === chosenId" @choose="chosenId = tyre.id" @details="openDetails(tyre.id)" />
                </div>
                <p v-if="list.length === 0" class="kr-empty">Kein Reifen passt zu dieser Auswahl. Nimm einen Filter heraus.</p>
                <button v-if="!all && list.length > FIRST" class="btn btn--secondary kr-more" type="button" @click="more">{{ list.length - FIRST === 1 ? '1 weiteren Reifen anzeigen' : `${list.length - FIRST} weitere Reifen anzeigen` }}</button>

                <aside class="kr-needs" aria-labelledby="kr-needs-h">
                    <h3 id="kr-needs-h" class="kr-needs__title">Was wir dafür von euch brauchen</h3>
                    <ul>
                        <li>Fotos je Reifenmodell, bis zu vier (Seite, Lauffläche, Profil, schräg). Bis dahin zeigt der Shop eine neutrale Zeichnung, nie das Foto eines anderen Reifens.</li>
                        <li>Die Daten des EU-Reifenlabels je Größe: Kraftstoffeffizienz, Nasshaftung, Rollgeräusch, Schnee- und Eisgriffigkeit, EPREL-Nummer.</li>
                        <li>Die Antwort auf die Lieferantenfrage: Kann derselbe Reifen von mehreren Lieferanten mit verschiedenen Preisen kommen, und welcher Preis gilt dann im Shop?</li>
                    </ul>
                </aside>

                <div class="kr-actions">
                    <button class="btn btn--secondary kr-actions__left" type="button" @click="go(0)">Zurück</button>
                    <span class="kr-pick t-small" role="status">{{ chosen ? `Gewählt: ${chosen.brand} ${chosen.model} · ${formatMoney(setPrice(chosen, filter.mode))}` : 'Wähl zuerst einen Reifen.' }}</span>
                    <button class="btn btn--primary" type="button" :disabled="!chosen" @click="go(2)">Weiter: Extras <Icon name="arrow-right" :size="20" /></button>
                </div>

                <TyreDetails v-model:open="detailsOpen" :tyre="details" :mode="filter.mode" :chosen="details?.id === chosenId" @choose="chooseDetails" />
            </section>

            <!-- 3 Extras -->
            <section v-else-if="step === 2" class="kr-step" aria-labelledby="kr-extras-h">
                <h2 id="kr-extras-h" class="kr-step__title" tabindex="-1">Extras</h2>
                <p class="t-small quiet kr-measure">Montage und Wuchten gehören zum Komplettrad: {{ formatMoney(MOUNTING_SET_CENTS) }} für 4 Räder (4 × {{ formatMoney(MOUNTING_EACH_CENTS) }}). Kein Extra mit Aufpreis ist vorausgewählt.</p>

                <fieldset class="kr-group">
                    <legend class="label">Wuchtgewichte</legend>
                    <p class="t-small quiet">Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt.</p>
                    <div class="kr-swatches">
                        <label v-for="colour in WEIGHTS" :key="colour.id" class="kr-swatch" :class="{ 'kr-swatch--on': weights === colour.id }">
                            <input v-model="weights" class="visually-hidden" type="radio" name="kr-weights" :value="colour.id">
                            <span class="kr-swatch__dot" data-qa-ignore :style="{ '--swatch': colour.hex }" aria-hidden="true" />
                            <span class="kr-swatch__name">{{ colour.name }}</span>
                            <span class="kr-swatch__price">{{ colour.eachCents === 0 ? 'ohne Aufpreis' : `+ ${formatMoney(colour.eachCents)} pro Rad` }}</span>
                        </label>
                    </div>
                </fieldset>

                <fieldset class="kr-group">
                    <legend class="label">RDKS-Sensoren</legend>
                    <p class="t-small quiet">Misst dein Auto den Reifendruck mit Sensoren in den Rädern, brauchen auch die neuen Räder Sensoren. Ob das so ist, steht in der Betriebsanleitung.</p>
                    <div class="kr-opts">
                        <label class="kr-opt" :class="{ 'kr-opt--on': rdks === 'ja' }">
                            <input v-model="rdks" class="visually-hidden" type="radio" name="kr-rdks" value="ja">
                            <span class="kr-opt__name">Mit RDKS-Sensoren</span>
                            <span class="kr-opt__sub">+ {{ formatMoney(RDKS.setCents) }} (4 × {{ formatMoney(RDKS.eachCents) }}) · wir setzen sie gleich mit ein</span>
                            <span class="kr-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                        </label>
                        <label class="kr-opt" :class="{ 'kr-opt--on': rdks === 'nein' }">
                            <input v-model="rdks" class="visually-hidden" type="radio" name="kr-rdks" value="nein">
                            <span class="kr-opt__name">Ohne RDKS-Sensoren</span>
                            <span class="kr-opt__sub">ohne Aufpreis</span>
                            <span class="kr-opt__check" aria-hidden="true"><Icon name="check" :size="20" /></span>
                        </label>
                    </div>
                    <p v-if="rdks === null" class="t-small quiet">Noch nicht beantwortet: Dann fragen wir an der Kasse danach.</p>
                </fieldset>

                <div class="kr-actions">
                    <button class="btn btn--secondary kr-actions__left" type="button" @click="go(1)">Zurück</button>
                    <button class="btn btn--primary" type="button" @click="go(3)">Weiter: Warenkorb <Icon name="arrow-right" :size="20" /></button>
                </div>
            </section>

            <!-- 4 Warenkorb -->
            <section v-else class="kr-step" aria-labelledby="kr-basket-h">
                <h2 id="kr-basket-h" class="kr-step__title" tabindex="-1">Dein Komplettrad</h2>
                <template v-if="chosen">
                    <div class="kr-verdict">
                        <p class="kr-verdict__line"><VerdictBadge status="CONDITIONAL" /> für deinen {{ CAR.name }}</p>
                        <p class="t-small kr-verdict__text">{{ ABNAHME_REQUIRED }} {{ ENTRY_REQUIRED }}</p>
                    </div>
                    <table class="kr-basket">
                        <caption class="visually-hidden">Was in den Warenkorb kommt</caption>
                        <tbody>
                            <tr v-for="line in lines" :key="line.label">
                                <th scope="row"><span class="kr-basket__cell"><span class="kr-basket__label">{{ line.label }}</span><span class="t-small quiet">{{ line.detail }}</span></span></th>
                                <td>{{ line.cents === 0 ? 'ohne Aufpreis' : formatMoney(line.cents) }}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <th scope="row">Summe</th>
                                <td>{{ formatMoney(total(lines)) }}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <p class="t-small quiet">inkl. MwSt., zzgl. Versandkosten<template v-if="rdks === null"> · RDKS-Sensoren: fragen wir an der Kasse</template></p>
                    <div class="kr-actions">
                        <button class="btn btn--secondary kr-actions__left" type="button" @click="go(2)">Zurück</button>
                        <button class="btn btn--primary" type="button" @click="added = true"><Icon name="cart" :size="20" /> In den Warenkorb</button>
                    </div>
                    <p v-if="added" class="t-small kr-added" role="status">In der Skizze kommt nichts in den Warenkorb.</p>
                </template>
                <p v-else class="kr-empty">Noch kein Reifen gewählt. <button class="kr-link" type="button" @click="go(1)">Reifen wählen</button></p>
            </section>
        </div>
    </section>
</template>

<style scoped>
.kr {
    display: grid;
    gap: var(--sp-24);
}

.kr-swapped {
    margin: 0;
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
    color: var(--c-ink);
}

.kr-step__title:focus {
    outline: none;
}

.kr-head {
    display: grid;
    gap: var(--sp-16);
}

.kr-step {
    display: grid;
    gap: var(--sp-20);
}

.kr-step__head {
    display: grid;
    gap: var(--sp-4);
}

.kr-step__title {
    margin: 0;
    font-size: var(--fs-h3);
    line-height: var(--lh-h3);
}

.kr-measure {
    max-width: calc(54 * var(--ch-text));
    margin: 0;
}

.kr-wheel {
    display: grid;
    grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
    gap: var(--sp-24);
    align-items: center;
}

.kr-wheel__facts {
    display: grid;
    gap: var(--sp-8);
}

.kr-wheel__name {
    margin: 0;
    font-weight: 700;
}

.kr-wheel__spec {
    margin: 0;
    font-variant-numeric: tabular-nums;
}

.kr-wheel__verdict {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: 0;
}

.kr-link {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--c-blue);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
}

.kr-mode,
.kr-group {
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

.kr-mode {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
}

.kr-mode__legend {
    margin-bottom: var(--sp-4);
}

/* The shop's radio tile (BuyModeChoice): the whole tile the control, 2 px blue and the check when chosen. */
.kr-opt {
    position: relative;
    display: grid;
    align-content: start;
    gap: var(--sp-4);
    min-height: 64px;
    padding: var(--sp-12) var(--sp-40) var(--sp-12) var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    cursor: pointer;
    transition: border-color var(--d-1) var(--ease-std), background-color var(--d-1) var(--ease-std);
}

.kr-opt--on {
    padding: calc(var(--sp-12) - 1px) calc(var(--sp-40) - 1px) calc(var(--sp-12) - 1px) calc(var(--sp-16) - 1px);
    border: 2px solid var(--c-blue);
}

.kr-opt:has(:focus-visible),
.kr-swatch:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.kr-opt:active,
.kr-swatch:active {
    background: var(--c-band);
}

@media (hover: hover) and (pointer: fine) {
    .kr-opt:hover,
    .kr-swatch:hover {
        border-color: var(--c-ink-3);
    }

    .kr-opt--on:hover,
    .kr-swatch--on:hover {
        border-color: var(--c-blue);
    }
}

.kr-opt__name {
    font-weight: 600;
}

.kr-opt__sub {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-variant-numeric: tabular-nums;
}

.kr-opt__check {
    position: absolute;
    top: var(--sp-12);
    right: var(--sp-12);
    display: none;
    color: var(--c-blue);
}

.kr-opt--on .kr-opt__check {
    display: inline-flex;
}

.kr-opts {
    display: grid;
    gap: var(--sp-8);
    max-width: 720px;
}

@media (min-width: 768px) {
    .kr-opts {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

.kr-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.kr-swatch {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
    min-height: 44px;
    padding: var(--sp-8) var(--sp-12);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    cursor: pointer;
}

.kr-swatch--on {
    padding: calc(var(--sp-8) - 1px) calc(var(--sp-12) - 1px);
    border: 2px solid var(--c-blue);
}

.kr-swatch__dot {
    width: 16px;
    height: 16px;
    border: 1px solid var(--c-line);
    border-radius: var(--r-round);
    background: var(--swatch, var(--c-ink-2));
}

.kr-swatch__name {
    font-weight: 600;
}

.kr-swatch__price {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.kr-filters {
    display: grid;
    gap: var(--sp-8);
}

.kr-filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
}

.kr-filter__label,
.kr-sort__label {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
}

.kr-filter__label {
    min-width: 88px;
}

.kr-listhead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
}

.kr-count {
    margin: 0;
    font-weight: 600;
}

.kr-sort {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    min-width: 0;
}

.kr-sort__select {
    width: auto;
    max-width: 100%;
}

.kr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: var(--sp-16);
}

.kr-more {
    justify-self: start;
}

.kr-empty {
    margin: 0;
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.kr-needs {
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-warn-tint);
}

.kr-needs__title {
    margin: 0 0 var(--sp-8);
    font-size: var(--fs-body);
}

.kr-needs ul {
    display: grid;
    gap: var(--sp-4);
    max-width: calc(72 * var(--ch-text));
    margin: 0;
    padding-left: var(--sp-20);
    font-size: var(--fs-small);
    list-style: disc;
}

.kr-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-12);
    padding-top: var(--sp-16);
    border-top: 1px solid var(--c-line);
}

.kr-actions__left {
    margin-right: auto;
}

.kr-pick {
    color: var(--c-ink-2);
}

.kr-verdict {
    display: grid;
    gap: var(--sp-8);
    max-width: 720px;
    padding: var(--sp-16);
    border-radius: var(--r-tile);
    background: var(--c-warn-tint);
}

.kr-verdict__line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: 0;
    font-weight: 600;
}

.kr-verdict__text {
    margin: 0;
    color: var(--c-ink);
}

.kr-basket {
    width: 100%;
    max-width: 720px;
    border-collapse: collapse;
}

.kr-basket th,
.kr-basket td {
    padding: var(--sp-12) 0;
    border-bottom: 1px solid var(--c-line);
    text-align: left;
    vertical-align: top;
}

.kr-basket th {
    font-weight: 400;
}

.kr-basket__cell {
    display: grid;
    gap: var(--sp-4);
}

.kr-basket td {
    padding-left: var(--sp-16);
    text-align: right;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.kr-basket__label {
    font-weight: 600;
}

.kr-basket tfoot th,
.kr-basket tfoot td {
    border-bottom: 0;
    font-size: var(--fs-h4);
    font-weight: 700;
}

.kr-added {
    margin: 0;
    color: var(--c-ink-2);
}

@media (max-width: 599px) {
    .kr-wheel {
        grid-template-columns: minmax(0, 1fr);
    }

    .kr-wheel__well {
        max-width: 220px;
    }

    .kr-filter__label {
        min-width: 100%;
    }

    /* The chosen tyre on its own line above the two buttons. */
    .kr-pick {
        order: -1;
        flex-basis: 100%;
    }
}
</style>
