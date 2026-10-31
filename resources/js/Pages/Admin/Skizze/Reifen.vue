<script setup lang="ts">
/**
 * Katalog › Reifen with tyre models, as a sketch (the Gutachten rework brief §9): the list as the live list is built —
 * search and selects at the top, sortable headings, the filtered state — with a photo thumbnail per model, made for
 * hundreds; and one model with up to four photos and its size lines: load index, speed symbol, supplier, price,
 * availability and the EU tyre label per line. The question only the client can answer stands where it arises. Nothing
 * reaches the server.
 */

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSortHeader from '../../../Components/Admin/AdminSortHeader.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import SeasonMark from '../../../Components/Sketch/SeasonMark.vue'
import SketchBanner from '../../../Components/Sketch/SketchBanner.vue'
import TyrePicture from '../../../Components/Sketch/TyrePicture.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { anzahl, withUnit, zoll } from '../../../format'
import { formatMoney } from '../../../lib/num'
import { SEASONS, TYRE_BRANDS } from '../../Skizze/shopDemo'
import { MODELS, SUPPLIERS, SUPPLIER_QUESTION, type TyreModel } from './reifenDemo'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<{ modell: string | null }>()

/* A model the sketch knows, or „neu" for an empty one; anything else opens the list. */
function known(id: string | null): string | null {
    return id === 'neu' || MODELS.some((m) => m.id === id) ? id : null
}

const modelId = ref<string | null>(known(props.modell))
const uploadNote = ref(false)
const filters = reactive({ q: '', marke: '', saison: '' })
const order = reactive<{ sort: string; richtung: 'auf' | 'ab' }>({ sort: 'reifen', richtung: 'auf' })
const editing = ref<string | null>(null)

/* „Neues Reifenmodell": the same page, empty — no photo, no size yet. */
const BLANK: TyreModel = { id: 'neu', brand: TYRE_BRANDS[0] ?? '', model: '', season: 'sommer', photos: 0, sizes: [], changed: '' }

const model = computed<TyreModel | undefined>(() => (modelId.value === 'neu' ? BLANK : MODELS.find((m) => m.id === modelId.value)))
const filtered = computed(() => filters.q.trim() !== '' || filters.marke !== '' || filters.saison !== '')

function priceFrom(m: TyreModel): number {
    return Math.min(...m.sizes.map((s) => s.priceCents))
}

const list = computed(() => {
    const squeeze = (text: string): string => text.toLowerCase().replace(/\s+/g, '')
    const q = squeeze(filters.q)
    const found = MODELS.filter(
        (m) =>
            (q === '' || squeeze(`${m.brand} ${m.model} ${m.sizes.map((s) => s.size).join(' ')}`).includes(q)) &&
            (filters.marke === '' || m.brand === filters.marke) &&
            (filters.saison === '' || m.season === filters.saison),
    )
    const way = order.richtung === 'auf' ? 1 : -1

    return found.sort((a, b) => {
        if (order.sort === 'preis') {
            return way * (priceFrom(a) - priceFrom(b))
        }

        if (order.sort === 'geaendert') {
            return way * a.changed.localeCompare(b.changed)
        }

        return way * (a.brand.localeCompare(b.brand, 'de') || a.model.localeCompare(b.model, 'de'))
    })
})

/* A heading pressed sorts by it; pressed again, the other way (AdminSortHeader, F-32). */
function sortBy(column: string): void {
    order.richtung = order.sort === column && order.richtung === 'auf' ? 'ab' : 'auf'
    order.sort = column
}

function reset(): void {
    Object.assign(filters, { q: '', marke: '', saison: '' })
}

const sizeLines = computed(() => MODELS.reduce((n, m) => n + m.sizes.length, 0))

function missingLabels(m: TyreModel): number {
    return m.sizes.filter((s) => s.label === null).length
}

function suppliers(m: TyreModel): number {
    return new Set(m.sizes.map((s) => s.supplier)).size
}

function diameters(m: TyreModel): string {
    const list = [...new Set(m.sizes.map((s) => Number(s.size.slice(-2))))].sort((a, b) => a - b)

    return list.length === 1 ? zoll(list[0] ?? 0) : withUnit(`${list[0]}–${list[list.length - 1]}`, 'Zoll')
}

/* The same size from more than one supplier: the case the question to the client is about. */
function twice(m: TyreModel, size: string): boolean {
    return m.sizes.filter((s) => s.size === size).length > 1
}

function address(id: string | null): URL {
    const url = new URL(window.location.href)

    if (id === null) {
        url.searchParams.delete('modell')
    } else {
        url.searchParams.set('modell', id)
    }

    return url
}

function show(id: string | null): void {
    modelId.value = id
    editing.value = null
    uploadNote.value = false
    window.scrollTo({ top: 0 })
    void nextTick(() => document.querySelector<HTMLElement>('.adm-page__title')?.focus({ preventScroll: true }))
}

function open(id: string | null): void {
    window.history.pushState({ ...window.history.state, skizzeModell: id }, '', address(id))
    show(id)
}

function back(): void {
    show(known(new URL(window.location.href).searchParams.get('modell')))
}

onMounted(() => {
    // An address that names no model the sketch knows opens the list, and says so in the address too.
    window.history.replaceState(window.history.state, '', address(modelId.value))
    window.addEventListener('popstate', back)
})

onBeforeUnmount(() => window.removeEventListener('popstate', back))

const context = computed(() =>
    model.value
        ? `${anzahl(model.value.sizes.length, 'Größe', 'Größen')} · ${anzahl(suppliers(model.value), 'Lieferant', 'Lieferanten')} · Skizze`
        : `${anzahl(MODELS.length, 'Modell', 'Modelle')} · ${anzahl(sizeLines.value, 'Größe', 'Größen')}${filtered.value ? ' · gefiltert' : ''} · Skizze`,
)
const title = computed(() => (model.value === undefined ? 'Reifen' : model.value.id === 'neu' ? 'Neues Reifenmodell' : `${model.value.brand} ${model.value.model}`))
</script>

<template>
    <div class="rk">
        <SketchBanner note="So sollen Reifen künftig gepflegt werden: je Modell Fotos und Größen, je Größe Lieferant, Preis und EU-Reifenlabel. Alle Werte sind Beispiele." />

        <AdminPage :title="title" :context="context">
            <template #primary>
                <button v-if="model" class="btn btn--secondary" type="button" @click="open(null)">
                    <Icon name="chevron-left" :size="20" />
                    Alle Reifen
                </button>
                <button v-else class="btn btn--primary" type="button" @click="open('neu')">
                    <Icon name="plus" :size="20" />
                    Neues Reifenmodell
                </button>
            </template>

            <section class="rk-note" aria-labelledby="rk-question-h">
                <h2 id="rk-question-h" class="rk-note__title">Frage an euch</h2>
                <p class="rk-note__text">{{ SUPPLIER_QUESTION }}</p>
                <p class="rk-note__text rk-note__text--quiet">Bis zu eurer Antwort entscheiden wir das nicht.<template v-if="model?.id === MODELS[0]?.id"> In dieser Skizze kommt 225/40 R18 von zwei Lieferanten, zu zwei Preisen.</template></p>
            </section>

            <!-- The list -->
            <template v-if="!model">
                <form class="rk-search" role="search" @submit.prevent>
                    <div class="form-field rk-search__q">
                        <label class="form-field__label" for="rk-q">Suche</label>
                        <input id="rk-q" v-model="filters.q" class="input" type="search" placeholder="Marke, Modell oder Größe wie 225/40 R18" autocomplete="off">
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="rk-marke">Marke</label>
                        <select id="rk-marke" v-model="filters.marke" class="input">
                            <option value="">Alle</option>
                            <option v-for="brand in TYRE_BRANDS" :key="brand" :value="brand">{{ brand }}</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="rk-saison">Saison</label>
                        <select id="rk-saison" v-model="filters.saison" class="input">
                            <option value="">Alle</option>
                            <option v-for="season in SEASONS" :key="season.value" :value="season.value">{{ season.label }}</option>
                        </select>
                    </div>
                    <div class="rk-search__actions">
                        <button v-if="filtered" class="btn btn--ghost" type="button" @click="reset">Zurücksetzen</button>
                    </div>
                </form>

                <AdminState v-if="list.length === 0" kind="filtered" :total="MODELS.length" @reset="reset" />

                <template v-else>
                    <div class="adm-panel">
                        <table class="adm-table rk-table">
                            <caption class="visually-hidden">Reifenmodelle</caption>
                            <thead>
                                <tr>
                                    <AdminSortHeader label="Reifen" column="reifen" :sort="order.sort" :richtung="order.richtung" @sort="sortBy" />
                                    <th scope="col">Saison</th>
                                    <th scope="col">Größen</th>
                                    <AdminSortHeader label="Preis ab" column="preis" :sort="order.sort" :richtung="order.richtung" num @sort="sortBy" />
                                    <th scope="col" class="num">Lieferanten</th>
                                    <th scope="col">EU-Label</th>
                                    <AdminSortHeader label="Geändert" column="geaendert" :sort="order.sort" :richtung="order.richtung" @sort="sortBy" />
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in list" :key="item.id" class="rk-row">
                                    <td data-label="Reifen">
                                        <span class="rk-name">
                                            <span class="rk-thumb" :class="{ 'rk-thumb--none': item.photos === 0 }">
                                                <TyrePicture v-if="item.photos > 0" :px="36" caption="" />
                                                <Icon v-else name="media" :size="20" />
                                            </span>
                                            <span>
                                                <button class="rk-open" type="button" @click="open(item.id)"><span class="rk-brand">{{ item.brand }}</span> {{ item.model }}</button>
                                                <span class="adm-table__sub">{{ item.photos === 0 ? 'kein Foto' : anzahl(item.photos, 'Foto', 'Fotos') }}</span>
                                            </span>
                                        </span>
                                    </td>
                                    <td data-label="Saison"><SeasonMark :season="item.season" /></td>
                                    <td data-label="Größen">{{ anzahl(item.sizes.length, 'Größe', 'Größen') }}, {{ diameters(item) }}</td>
                                    <td class="num" data-label="Preis ab">{{ formatMoney(priceFrom(item)) }}</td>
                                    <td class="num" data-label="Lieferanten">{{ suppliers(item) }}</td>
                                    <td data-label="EU-Label">
                                        <span v-if="missingLabels(item)" class="adm-tag adm-tag--warn">{{ missingLabels(item) === 1 ? '1 Größe ohne Label' : `${missingLabels(item)} Größen ohne Label` }}</span>
                                        <template v-else>vollständig</template>
                                    </td>
                                    <td data-label="Geändert">{{ item.changed }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p class="adm-note rk-scale">
                        Bei Hunderten von Reifen zeigt die Liste 50 je Seite; Suche, Filter und Sortierung bleiben beim Blättern erhalten.
                    </p>
                </template>
            </template>

            <!-- One model -->
            <template v-else>
                <section class="adm-section" aria-labelledby="rk-photos-h">
                    <div class="adm-section__head">
                        <h2 id="rk-photos-h" class="adm-section__title">Fotos</h2>
                    </div>
                    <p class="adm-note">Bis zu vier Fotos je Modell (Seite, Lauffläche, Profil, schräg); sie gelten für alle seine Größen. Das erste ist das Hauptbild im Shop. Hochladen und Sortieren wie bei den Felgen.</p>
                    <ul class="rk-photos">
                        <li v-for="n in 4" :key="n" class="rk-photo" :class="{ 'rk-photo--empty': n > model.photos }">
                            <TyrePicture v-if="n <= model.photos" :px="120" :caption="n === 1 ? 'Beispielbild · Hauptbild' : 'Beispielbild'" />
                            <button v-else class="rk-photo__add" type="button" @click="uploadNote = true">
                                <Icon name="plus" :size="20" />
                                Foto hinzufügen
                            </button>
                        </li>
                    </ul>
                    <p v-if="uploadNote" class="adm-note" role="status">In der Skizze wird kein Foto hochgeladen. Im echten Admin öffnet sich hier die Dateiauswahl, wie bei den Felgen.</p>
                </section>

                <section class="adm-section" aria-labelledby="rk-facts-h">
                    <div class="adm-section__head">
                        <h2 id="rk-facts-h" class="adm-section__title">Modell</h2>
                    </div>
                    <div class="rk-facts">
                        <div class="form-field">
                            <label class="form-field__label" for="rk-brand">Marke</label>
                            <select id="rk-brand" class="input" :value="model.brand">
                                <option v-for="brand in TYRE_BRANDS" :key="brand" :value="brand">{{ brand }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="rk-model">Modell</label>
                            <input id="rk-model" class="input" type="text" :value="model.model">
                        </div>
                        <fieldset class="form-field rk-fieldset rk-facts__season">
                            <legend class="form-field__label">Saison</legend>
                            <div class="rk-seg">
                                <label v-for="season in SEASONS" :key="season.value" class="adm-chip">
                                    <input class="visually-hidden" type="radio" name="rk-season" :value="season.value" :checked="season.value === model.season">
                                    {{ season.label }}
                                </label>
                            </div>
                        </fieldset>
                    </div>
                </section>

                <section class="adm-section" aria-labelledby="rk-sizes-h">
                    <div class="adm-section__head">
                        <h2 id="rk-sizes-h" class="adm-section__title">Größen</h2>
                        <button class="btn btn--ghost" type="button" @click="editing = 'neu'"><Icon name="plus" :size="20" /> Größe hinzufügen</button>
                    </div>
                    <p class="adm-note">Je Größe: Lastindex und Geschwindigkeitssymbol, Lieferant, Preis, Verfügbarkeit und das EU-Reifenlabel. Ohne vollständiges Label bietet der Shop die Größe nicht an.</p>
                    <AdminState v-if="model.sizes.length === 0" kind="empty" text="Noch keine Größe. Leg die erste mit „Größe hinzufügen“ an: Größe mit Lastindex und Symbol, Lieferant, Preis und EU-Reifenlabel." />
                    <div v-else class="adm-panel">
                        <table class="adm-table rk-sizes">
                            <caption class="visually-hidden">Größen von {{ model.brand }} {{ model.model }}</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Größe</th>
                                    <th scope="col">Lieferant</th>
                                    <th scope="col" class="num">Preis</th>
                                    <th scope="col">Verfügbar</th>
                                    <th scope="col">EU-Label</th>
                                    <th scope="col">EPREL</th>
                                </tr>
                            </thead>
                            <tbody>
                                <template v-for="line in model.sizes" :key="line.id">
                                    <tr>
                                        <td data-label="Größe">
                                            <button class="rk-open" type="button" :aria-expanded="editing === line.id" @click="editing = editing === line.id ? null : line.id">{{ line.size }} {{ line.li }}{{ line.si }}</button>
                                        </td>
                                        <td data-label="Lieferant">
                                            {{ line.supplier }}
                                            <span v-if="twice(model, line.size)" class="adm-tag adm-tag--warn">gleiche Größe, anderer Preis</span>
                                        </td>
                                        <td class="num" data-label="Preis">{{ formatMoney(line.priceCents) }}</td>
                                        <td data-label="Verfügbar">{{ line.available ? 'ja' : 'nein' }}</td>
                                        <td data-label="EU-Label">
                                            <template v-if="line.label">
                                                {{ line.label.fuel }} · {{ line.label.wet }} · {{ withUnit(line.label.noiseDb, 'dB') }} ({{ line.label.noiseClass }})<template v-if="line.label.snow"> · Schnee</template><template v-if="line.label.ice"> · Eis</template>
                                            </template>
                                            <span v-else class="adm-tag adm-tag--warn">fehlt</span>
                                        </td>
                                        <td data-label="EPREL">{{ line.label?.eprel ?? '–' }}</td>
                                    </tr>
                                    <tr v-if="editing === line.id" class="rk-edit">
                                        <td colspan="6">
                                            <div class="rk-editform">
                                                <div class="form-field"><label class="form-field__label" :for="`rk-size-${line.id}`">Größe</label><input :id="`rk-size-${line.id}`" class="input" type="text" :value="`${line.size} ${line.li}${line.si}`"></div>
                                                <div class="form-field">
                                                    <label class="form-field__label" :for="`rk-sup-${line.id}`">Lieferant</label>
                                                    <select :id="`rk-sup-${line.id}`" class="input" :value="line.supplier"><option v-for="s in SUPPLIERS" :key="s" :value="s">{{ s }}</option></select>
                                                </div>
                                                <div class="form-field"><label class="form-field__label" :for="`rk-price-${line.id}`">Preis je Reifen (€)</label><input :id="`rk-price-${line.id}`" class="input" type="text" inputmode="decimal" :value="formatMoney(line.priceCents).replace(/\s*€$/, '')"></div>
                                                <div class="form-field">
                                                    <label class="form-field__label" :for="`rk-av-${line.id}`">Verfügbarkeit</label>
                                                    <select :id="`rk-av-${line.id}`" class="input" :value="line.available ? 'ja' : 'nein'"><option value="ja">Verfügbar</option><option value="nein">Nicht verfügbar</option></select>
                                                </div>
                                                <div class="form-field">
                                                    <label class="form-field__label" :for="`rk-fuel-${line.id}`">Kraftstoffeffizienz</label>
                                                    <select :id="`rk-fuel-${line.id}`" class="input" :value="line.label?.fuel ?? ''"><option value="">–</option><option v-for="c in ['A', 'B', 'C', 'D', 'E']" :key="c">{{ c }}</option></select>
                                                </div>
                                                <div class="form-field">
                                                    <label class="form-field__label" :for="`rk-wet-${line.id}`">Nasshaftung</label>
                                                    <select :id="`rk-wet-${line.id}`" class="input" :value="line.label?.wet ?? ''"><option value="">–</option><option v-for="c in ['A', 'B', 'C', 'D', 'E']" :key="c">{{ c }}</option></select>
                                                </div>
                                                <div class="form-field"><label class="form-field__label" :for="`rk-db-${line.id}`">Rollgeräusch (dB)</label><input :id="`rk-db-${line.id}`" class="input" type="text" inputmode="numeric" :value="line.label?.noiseDb ?? ''"></div>
                                                <div class="form-field">
                                                    <label class="form-field__label" :for="`rk-nc-${line.id}`">Geräuschklasse</label>
                                                    <select :id="`rk-nc-${line.id}`" class="input" :value="line.label?.noiseClass ?? ''"><option value="">–</option><option v-for="c in ['A', 'B', 'C']" :key="c">{{ c }}</option></select>
                                                </div>
                                                <div class="form-field"><label class="form-field__label" :for="`rk-eprel-${line.id}`">EPREL-Nummer</label><input :id="`rk-eprel-${line.id}`" class="input" type="text" inputmode="numeric" :value="line.label?.eprel ?? ''"></div>
                                                <fieldset class="form-field rk-fieldset">
                                                    <legend class="form-field__label">Symbole</legend>
                                                    <label class="check"><input type="checkbox" :checked="line.label?.snow === true"> Schneegriffigkeit</label>
                                                    <label class="check"><input type="checkbox" :checked="line.label?.ice === true"> Eisgriffigkeit</label>
                                                </fieldset>
                                            </div>
                                            <div class="rk-editbar">
                                                <span class="rk-editbar__status">In der Skizze wird nichts gespeichert.</span>
                                                <button class="btn btn--ghost" type="button" @click="editing = null">Abbrechen</button>
                                                <button class="btn btn--primary" type="button" @click="editing = null">Speichern</button>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                    <p v-if="editing === 'neu'" class="adm-note" role="status">In der Skizze wird keine Größe angelegt. Eine neue Größe hat dieselben Felder wie eine bestehende; ein Klick auf eine Größe öffnet sie.</p>
                </section>

                <aside class="rk-note" aria-labelledby="rk-needs-h">
                    <h2 id="rk-needs-h" class="rk-note__title">Was wir von euch brauchen</h2>
                    <ul class="rk-note__list">
                        <li>Fotos je Reifenmodell: mindestens eines, bis zu vier.</li>
                        <li>Die Daten des EU-Reifenlabels je Größe, mit der EPREL-Nummer.</li>
                        <li>Die Antwort auf die Frage oben: mehrere Lieferanten für denselben Reifen und welcher Preis dann gilt.</li>
                    </ul>
                </aside>
            </template>
        </AdminPage>
    </div>
</template>

<style scoped>
.rk {
    display: grid;
    gap: var(--sp-16);
}

/* The two notes for the client wear the banner's tint: what we ask of them, apart from the page's own content. */
.rk-note {
    display: grid;
    gap: var(--sp-4);
    margin-bottom: var(--sp-24);
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-warn-tint);
}

aside.rk-note {
    margin: var(--sp-32) 0 0;
}

.rk-note__title {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
}

.rk-note__text {
    max-width: calc(54 * var(--ch-text));
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
}

.rk-note__text--quiet {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.rk-note__list {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding-left: var(--sp-20);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    list-style: disc;
}

.rk-search {
    display: grid;
    grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr)) auto;
    align-items: end;
    gap: var(--sp-8) var(--sp-12);
    margin-bottom: var(--sp-24);
}

.rk-search .form-field {
    margin: 0;
}

.rk-search__actions {
    display: flex;
    gap: var(--sp-8);
}

@media (max-width: 1099px) {
    .rk-search {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .rk-search__q,
    .rk-search__actions {
        grid-column: 1 / -1;
    }
}

.rk-name {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
}

.rk-thumb {
    display: grid;
    flex: none;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: var(--r-control);
    background: var(--c-band);
    overflow: hidden;
}

.rk-thumb :deep(.sk-tyrepic) {
    padding: var(--sp-4);
}

.rk-thumb--none {
    color: var(--c-ink-3);
}

.rk-open {
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--c-ink);
    font: inherit;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
}

.rk-brand {
    color: var(--c-ink-2);
    font-weight: 400;
}

@media (hover: hover) and (pointer: fine) {
    .rk-open:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }

    .rk-photo__add:hover {
        background: var(--c-band);
        color: var(--c-ink);
    }
}

.rk-open:focus-visible,
.rk-photo__add:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.rk-scale {
    margin-top: var(--sp-12);
    max-width: calc(54 * var(--ch-text));
}

.rk-photos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr));
    gap: var(--sp-12);
    margin: var(--sp-12) 0 0;
    padding: 0;
    list-style: none;
}

.rk-photo--empty {
    display: grid;
    min-height: 180px;
    border: 1px dashed var(--c-line-2);
    border-radius: var(--r-control);
}

.rk-photo__add {
    display: grid;
    place-content: center;
    justify-items: center;
    gap: var(--sp-4);
    border: 0;
    border-radius: var(--r-control);
    background: none;
    color: var(--c-ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
}

.rk-photo__add:active {
    background: var(--c-line);
}

.rk-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-16);
    max-width: var(--adm-form-max);
}

.rk-facts__season {
    grid-column: 1 / -1;
}

.rk-fieldset {
    margin: 0;
    padding: 0;
    border: 0;
}

.rk-fieldset > legend {
    padding: 0;
}

.rk-seg {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.rk-seg .adm-chip:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.rk-edit td {
    background: var(--c-band);
}

.rk-editform {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
    gap: var(--sp-12);
    padding: var(--sp-12) 0;
}

.rk-editbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-8);
    padding-top: var(--sp-12);
    border-top: 1px solid var(--c-line);
}

.rk-editbar__status {
    margin-right: auto;
    color: var(--c-ink-3);
    font-size: var(--fs-small);
}

@media (max-width: 599px) {
    .rk-facts {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
