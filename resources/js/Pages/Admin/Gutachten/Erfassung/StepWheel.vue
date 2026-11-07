<script setup lang="ts">
/**
 * Step 2, Felge (the Gutachten rework §7; the client's change of 07.11.2026): one paper is for one specific wheel, but it may allow
 * different versions of it front and rear. So the step builds wheel combinations: the model, then per combination a version for the
 * front axle and one for the rear, listed by dimension with their colours beneath. Colours are not chosen: every colour of a version
 * is covered. Picking the front takes the same version for the rear, until someone changes it; the same version front and rear is the
 * normal case. A paper can hold several combinations, each with its own cars' tyres.
 *
 * Beside it what the paper itself prints for the wheel, typed by staff: its Radtyp next to the wheel's Radtypenbezeichnung, so they
 * can see the two match (the second real paper sells as Rotiform NUE and prints RC200 8,5x20), and its Raddaten, one row per size it
 * names, compared with the versions chosen. A difference is a warning, never a block, and so are two bolt patterns on one car (the
 * operator's notes of 06.11.2026 and 07.11.2026). Saved as it is typed (autosave.ts).
 */

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import AdminConfirm from '../../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { createAutosave } from './autosave'
import { Refused, send, useEntry, type CombinationView } from './entryStore'

interface Version {
    key: string
    configId: number
    diameter: number
    label: string
    short: string
    detail: string
    colours: { name: string | null; hex: string | null }[]
}

interface ModelHit {
    modelId: number
    model: string
    wheelType: string | null
    demo: boolean
    sizes: Version[]
}

interface PrintedForm {
    type: string
    size: string
    et: string
    bolts: string
}

const store = useEntry()
const { state, go } = store

const combinations = computed(() => state.entry.combinations)
const sizes = computed(() => state.entry.wheelSizes)
/* A paper from before this flow can hold several wheels. It stays as it is: nothing here chooses for it. */
const severalModels = computed(() => new Set(sizes.value.map((size) => size.wheelModelId)).size > 1)
const paperModelId = computed(() => sizes.value[0]?.wheelModelId ?? null)

const query = ref(sizes.value[0]?.wheel ?? '')
const found = ref<ModelHit[]>([])
const more = ref(false)
const searching = ref(false)
const searched = ref(false)
const searchFailed = ref(false)
const failure = ref('')
const errors = ref<Record<string, string>>({})

const model = ref<ModelHit | null>(null)
const frontKey = ref<string | null>(null)
const rearKey = ref<string | null>(null)
/* The rear is the front's, until someone picks another. */
const rearFollows = ref(true)
const editing = ref<number | null>(null)
const removing = ref<CombinationView | null>(null)
const removeOpen = computed({
    get: () => removing.value !== null,
    set: (open: boolean) => {
        if (!open) {
            removing.value = null
        }
    },
})
const busy = ref(false)

const versions = computed(() => model.value?.sizes ?? [])
const front = computed(() => versions.value.find((version) => version.key === frontKey.value) ?? null)
const rear = computed(() => versions.value.find((version) => version.key === rearKey.value) ?? null)
const same = computed(() => front.value !== null && front.value.key === rear.value?.key)
const duplicate = computed(() => combinations.value.some((c) => c.id !== editing.value && c.frontKey === frontKey.value && c.rearKey === rearKey.value))
const boltsDiffer = computed(() => front.value !== null && rear.value !== null && boltsOf(front.value) !== boltsOf(rear.value))
const diametersDiffer = computed(() => front.value !== null && rear.value !== null && front.value.diameter !== rear.value.diameter)

/* The bolt pattern as the version's detail line starts: „5 × 120 · Mittenloch 72,5 mm“. */
function boltsOf(version: Version): string {
    return version.detail.split(' · ')[0] ?? ''
}

function pick(side: 'front' | 'rear', key: string): void {
    if (side === 'front') {
        frontKey.value = key

        if (rearFollows.value) {
            rearKey.value = key
        }
    } else {
        rearKey.value = key
        rearFollows.value = key === frontKey.value
    }

    failure.value = ''
}

function swap(): void {
    const was = frontKey.value

    frontKey.value = rearKey.value
    rearKey.value = was
    rearFollows.value = frontKey.value === rearKey.value
}

function resetChoice(): void {
    editing.value = null
    frontKey.value = null
    rearKey.value = null
    rearFollows.value = true
}

function edit(combination: CombinationView): void {
    editing.value = combination.id
    frontKey.value = combination.frontKey
    rearKey.value = combination.rearKey
    rearFollows.value = combination.same
    failure.value = ''
    document.getElementById('ef-axles')?.scrollIntoView({ block: 'nearest' })
}

async function save(): Promise<void> {
    if (front.value === null || rear.value === null || busy.value) {
        return
    }

    busy.value = true
    failure.value = ''

    try {
        const body = { front_config_id: front.value.configId, rear_config_id: rear.value.configId }

        if (editing.value === null) {
            await store.save('POST', '/kombinationen', body)
        } else {
            await store.save('PUT', `/kombinationen/${editing.value}`, body)
        }

        resetChoice()
    } catch (error) {
        failure.value = error instanceof Refused ? Object.values(error.errors)[0]?.[0] ?? error.message : error instanceof Error ? error.message : 'Das wurde nicht gespeichert.'
    } finally {
        busy.value = false
    }
}

/* A combination with tyres entered asks first; an empty one goes at once. */
function askRemove(combination: CombinationView): void {
    const filled = state.entry.cars.some((car) => car.combinationId === combination.id && car.lines + car.unread + car.codes > 0)

    if (filled) {
        removing.value = combination
    } else {
        void remove(combination)
    }
}

async function remove(combination: CombinationView): Promise<void> {
    failure.value = ''

    try {
        await store.save('DELETE', `/kombinationen/${combination.id}`)

        if (editing.value === combination.id) {
            resetChoice()
        }
    } catch (error) {
        failure.value = error instanceof Refused ? Object.values(error.errors)[0]?.[0] ?? error.message : error instanceof Error ? error.message : 'Das wurde nicht gespeichert.'
    } finally {
        removing.value = null
    }
}

/* ── What the paper prints ───────────────────────────────────────────────────────────────────── */

const blankRow = (): PrintedForm => ({ type: '', size: '', et: '', bolts: '' })
const printed = reactive<PrintedForm[]>(
    state.entry.printed.length > 0
        ? state.entry.printed.map((row) => ({ type: row.type ?? '', size: row.size, et: row.et === null ? '' : String(row.et), bolts: row.bolts }))
        : [blankRow()],
)

async function write(): Promise<boolean> {
    errors.value = {}

    try {
        await store.save('PUT', '/felge', {
            printed: printed.map((row) => ({ type: row.type, size: row.size, et: row.et.trim() === '' ? null : row.et.trim(), bolts: row.bolts })),
        })

        return true
    } catch (error) {
        if (error instanceof Refused) {
            errors.value = Object.fromEntries(Object.entries(error.errors).map(([key, list]) => [key, list[0] ?? '']))
        } else {
            failure.value = error instanceof Error ? error.message : 'Das wurde nicht gespeichert.'
        }

        return false
    }
}

const autosave = createAutosave({
    content: () => JSON.stringify(printed),
    write,
    delay: 700,
    clean: () => {
        errors.value = {}
        state.save = 'saved'
    },
})

watch(printed, () => autosave.changed())

/* ── The search ──────────────────────────────────────────────────────────────────────────────── */

let timer: ReturnType<typeof setTimeout> | undefined
/* The search on screen: a late answer to an older one never replaces it. */
let asked = 0

async function search(): Promise<void> {
    const mine = ++asked

    searching.value = true
    searchFailed.value = false

    try {
        const answer = await send<{ groups: ModelHit[]; more: boolean }>('GET', `/admin/gutachten/suche/felgen?q=${encodeURIComponent(query.value.trim())}`)

        if (mine === asked) {
            found.value = answer.groups
            more.value = answer.more
            searched.value = true
        }
    } catch {
        if (mine === asked) {
            found.value = []
            searchFailed.value = true
        }
    } finally {
        if (mine === asked) {
            searching.value = false
        }
    }
}

watch(query, () => {
    if (model.value === null) {
        clearTimeout(timer)
        timer = setTimeout(() => void search(), 250)
    }
})

/* A model's every version, whatever the search above left out. */
async function loadModel(id: number): Promise<void> {
    const answer = await send<{ groups: ModelHit[] }>('GET', `/admin/gutachten/suche/felgen?q=&modell=${id}`)

    model.value = answer.groups[0] ?? null
}

async function chooseModel(hit: ModelHit): Promise<void> {
    model.value = hit
    query.value = hit.model
    resetChoice()
    await loadModel(hit.modelId)
}

function otherModel(): void {
    model.value = null
    resetChoice()
    void search()
}

let letGo = (): void => {}

onMounted(() => {
    autosave.mark()
    letGo = store.hold(autosave)

    if (paperModelId.value !== null && !severalModels.value) {
        void loadModel(paperModelId.value)
    } else if (query.value.trim() !== '') {
        void search()
    }
})

onBeforeUnmount(() => {
    letGo()
    clearTimeout(timer)

    if (autosave.owed()) {
        void autosave.flush()
    }
})
</script>

<template>
    <section class="ef-step" aria-labelledby="ef-wheel-h">
        <h2 id="ef-wheel-h" class="adm-section__title" tabindex="-1">Für welche Felgenkombination gilt das Gutachten?</h2>
        <p class="adm-note">Wähl die Ausführung der Felge für vorne und hinten. Meist ist es dieselbe. Gibt das Gutachten vorne und hinten verschiedene Größen frei, trag sie als eigene Kombination ein. Farben wählst du hier nicht: Der Eintrag gilt für jede Farbe einer Ausführung, auch für eine, die später dazukommt.</p>

        <div v-if="severalModels" class="ef-wheel">
            <p class="adm-note">Bei diesem Gutachten sind aus der früheren Erfassung mehrere Felgen hinterlegt. Sie bleiben, wie sie sind:</p>
            <ul class="ef-wheel__list">
                <li v-for="combination in combinations" :key="combination.id">{{ combination.label }}</li>
            </ul>
        </div>

        <div v-else class="ef-wheel">
            <div class="ef-wheel__main">
                <div v-if="model === null" class="form-field ef-wheel__search">
                    <label class="form-field__label" for="ef-wheel-q">Felge suchen</label>
                    <input id="ef-wheel-q" v-model="query" class="input" type="search" placeholder="Marke, Modell oder Radtyp" autocomplete="off" :disabled="!state.editable">
                </div>

                <div v-if="model === null" class="ef-wheel__hits">
                    <button v-for="hit in found" :key="hit.modelId" class="ef-model" type="button" :disabled="!state.editable" @click="chooseModel(hit)">
                        <span class="ef-model__name">{{ hit.model }}</span>
                        <span v-if="hit.demo" class="adm-tag adm-tag--neutral">Demodaten</span>
                        <span class="ef-model__sub">{{ hit.sizes.length }} {{ hit.sizes.length === 1 ? 'Ausführung' : 'Ausführungen' }}<template v-if="hit.wheelType"> · Radtyp {{ hit.wheelType }}</template></span>
                    </button>
                    <p v-if="searchFailed" class="adm-alert" role="alert">Die Suche hat nicht geantwortet. Versuch es noch einmal.</p>
                    <p v-else-if="searched && !searching && found.length === 0" class="adm-note">Keine Felge gefunden. Felgen legst du unter Katalog › Felgen an.</p>
                    <p v-if="more" class="adm-note">Es gibt mehr Treffer. Grenz die Suche ein.</p>
                </div>

                <div v-else class="ef-wheel__model">
                    <p class="ef-wheel__chosen">
                        <strong>{{ model.model }}</strong>
                        <template v-if="model.wheelType"> · Radtyp bei der Felge: {{ model.wheelType }}</template>
                        <button v-if="state.editable && combinations.length === 0" class="ef-link" type="button" @click="otherModel">Andere Felge</button>
                    </p>
                </div>

                <fieldset class="ef-fieldset ef-printed">
                    <legend class="form-field__label">Trag die Felge so ein, wie sie im Gutachten steht <span class="ef-optional">(optional)</span></legend>
                    <p class="form-field__help">Zum Vergleich mit den gewählten Ausführungen. Weicht etwas ab, sagen wir es dir; freigeben kannst du trotzdem. Nennt das Gutachten mehrere Größen, trag sie einzeln ein.</p>
                    <div v-for="(row, i) in printed" :key="i" class="ef-printed__grid">
                        <div class="form-field">
                            <label class="form-field__label" :for="`ef-printed-type-${i}`">Radtyp</label>
                            <input :id="`ef-printed-type-${i}`" v-model="row.type" class="input" type="text" maxlength="64" spellcheck="false" placeholder="z. B. RC200 8,5x20" :disabled="!state.editable">
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" :for="`ef-printed-size-${i}`">Radgröße</label>
                            <input :id="`ef-printed-size-${i}`" v-model="row.size" class="input" type="text" maxlength="32" spellcheck="false" placeholder="z. B. 8 1/2 J X 18 H2" :aria-invalid="errors[`printed.${i}.size`] ? 'true' : undefined" :disabled="!state.editable">
                            <p class="form-field__error">{{ errors[`printed.${i}.size`] }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" :for="`ef-printed-et-${i}`">Einpresstiefe</label>
                            <input :id="`ef-printed-et-${i}`" v-model="row.et" class="input" type="text" inputmode="numeric" maxlength="4" placeholder="z. B. 35" :aria-invalid="errors[`printed.${i}.et`] ? 'true' : undefined" :disabled="!state.editable">
                            <p class="form-field__error">{{ errors[`printed.${i}.et`] }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" :for="`ef-printed-bolts-${i}`">Lochkreis</label>
                            <input :id="`ef-printed-bolts-${i}`" v-model="row.bolts" class="input" type="text" maxlength="16" spellcheck="false" placeholder="z. B. 120/5" :aria-invalid="errors[`printed.${i}.bolts`] ? 'true' : undefined" :disabled="!state.editable">
                            <p class="form-field__error">{{ errors[`printed.${i}.bolts`] }}</p>
                        </div>
                        <button v-if="printed.length > 1 && state.editable" class="ef-link ef-printed__remove" type="button" @click="printed.splice(i, 1)">Zeile entfernen</button>
                    </div>
                    <button v-if="state.editable && printed.length < 8" class="btn btn--ghost ef-printed__add" type="button" @click="printed.push(blankRow())">
                        <Icon name="plus" :size="20" />
                        Weitere Größe aus dem Gutachten
                    </button>
                </fieldset>

                <div v-if="model" id="ef-axles" class="ef-axles">
                    <fieldset v-for="side in (['front', 'rear'] as const)" :key="side" class="ef-fieldset ef-axle">
                        <legend class="ef-axle__title">{{ side === 'front' ? 'Vorderachse' : 'Hinterachse' }}</legend>
                        <label v-for="version in versions" :key="version.key" class="ef-size" :class="{ 'ef-size--on': (side === 'front' ? frontKey : rearKey) === version.key }">
                            <input class="ef-size__radio" type="radio" :name="`ef-version-${side}`" :checked="(side === 'front' ? frontKey : rearKey) === version.key" :disabled="!state.editable" :data-version="version.short" @change="pick(side, version.key)">
                            <span class="ef-size__text">
                                <span class="ef-size__dim">{{ version.short }}</span>
                                <span class="ef-size__detail">{{ version.detail }}</span>
                                <span class="ef-size__colours">
                                    <span v-for="colour in version.colours" :key="colour.name ?? ''" class="ef-size__colour">
                                        <span class="ef-dot" data-qa-ignore :style="colour.hex ? { '--swatch': colour.hex } : undefined" />
                                        {{ colour.name }}
                                    </span>
                                    <span v-if="version.colours.length === 1" class="ef-size__only">nur in dieser Farbe</span>
                                </span>
                            </span>
                        </label>
                    </fieldset>
                </div>
            </div>

            <aside class="ef-wheel__side" aria-label="Felgenkombinationen">
                <section v-if="model" class="ef-pick" aria-labelledby="ef-pick-h">
                    <h3 id="ef-pick-h" class="ef-side__title">{{ editing === null ? 'Neue Kombination' : 'Kombination ändern' }}</h3>
                    <p v-if="front === null" class="adm-note">Wähl zuerst die Ausführung für vorne. Hinten nehmen wir dieselbe, bis du eine andere wählst.</p>
                    <template v-else>
                        <p class="ef-pick__line"><span class="ef-pick__axle">Vorne</span> {{ front.short }}</p>
                        <p class="ef-pick__line"><span class="ef-pick__axle">Hinten</span> {{ rear?.short ?? '–' }}</p>
                        <span class="adm-tag adm-tag--neutral" data-pick-badge>{{ same ? 'gleich vorne und hinten' : 'vorne und hinten verschieden' }}</span>
                        <button v-if="state.editable" class="ef-link" type="button" @click="swap">Achsen tauschen</button>
                        <p v-if="boltsDiffer" class="ef-warn" role="status">Vorne und hinten haben verschiedene Lochkreise: {{ boltsOf(front) }} und {{ rear ? boltsOf(rear) : '' }}.</p>
                        <p v-if="diametersDiffer" class="adm-note">Die Felgen haben vorne und hinten verschiedene Durchmesser: In Schritt 4 trägst du je Zeile beide Reifengrößen ein.</p>
                        <p v-if="duplicate" class="ef-warn" role="status">Diese Kombination steht schon im Gutachten.</p>
                    </template>
                    <p v-if="failure" class="adm-alert" role="alert">{{ failure }}</p>
                    <div v-if="state.editable" class="ef-pick__actions">
                        <button class="btn btn--primary" type="button" :disabled="front === null || rear === null || duplicate || busy" :aria-busy="busy ? 'true' : undefined" @click="save">
                            <Icon :name="editing === null ? 'plus' : 'check'" :size="20" />
                            {{ editing === null ? 'Kombination hinzufügen' : 'Änderung speichern' }}
                        </button>
                        <button v-if="editing !== null" class="btn btn--ghost" type="button" @click="resetChoice">Abbrechen</button>
                    </div>
                </section>

                <section class="ef-combos" aria-labelledby="ef-combos-h">
                    <h3 id="ef-combos-h" class="ef-side__title">{{ combinations.length === 1 ? '1 Kombination im Gutachten' : `${combinations.length} Kombinationen im Gutachten` }}</h3>
                    <p v-if="combinations.length === 0" class="adm-note">Noch keine. Wähl die Felge, dann vorne und hinten eine Ausführung.</p>
                    <ul v-else class="ef-combos__list">
                        <li v-for="combination in combinations" :key="combination.id" class="ef-combo" :class="{ 'ef-combo--on': editing === combination.id }" :data-combination="combination.id">
                            <p class="ef-combo__label">{{ combination.label }}</p>
                            <span class="adm-tag adm-tag--neutral">{{ combination.badge }}</span>
                            <p v-for="warning in combination.warnings" :key="warning" class="ef-warn" role="status">{{ warning }}</p>
                            <div v-if="state.editable" class="ef-combo__actions">
                                <button class="ef-link" type="button" :disabled="model === null" @click="edit(combination)">Bearbeiten</button>
                                <button class="ef-link" type="button" @click="askRemove(combination)">Entfernen</button>
                            </div>
                        </li>
                    </ul>
                </section>
            </aside>
        </div>

        <AdminConfirm
            v-model:open="removeOpen"
            title="Kombination entfernen?"
            :body="removing ? `${removing.label} wird aus diesem Gutachten entfernt, mit den Reifen, die Fahrzeuge dort eingetragen haben.` : ''"
            confirm-label="Entfernen"
            @confirm="removing && remove(removing)"
        />

        <div class="ef-actions">
            <button class="btn btn--secondary ef-actions__left" type="button" @click="go(0)">Zurück</button>
            <button class="btn btn--primary" type="button" :disabled="combinations.length === 0" @click="go(2)">
                Weiter: Fahrzeuge
                <Icon name="arrow-right" :size="20" />
            </button>
        </div>
    </section>
</template>

<style scoped>
.ef-wheel {
    display: grid;
    gap: var(--sp-24);
    align-items: start;
    margin-top: var(--sp-20);
}

@media (min-width: 1100px) {
    .ef-wheel {
        grid-template-columns: minmax(0, 1fr) minmax(300px, 0.5fr);
    }

    .ef-wheel__side {
        position: sticky;
        top: calc(var(--adm-topbar-h) + var(--sp-16));
    }
}

.ef-wheel__main,
.ef-wheel__side {
    display: grid;
    gap: var(--sp-20);
    min-width: 0;
}

.ef-wheel__search .input {
    max-width: calc(40 * var(--ch-text));
}

.ef-wheel__hits {
    display: grid;
    gap: var(--sp-4);
}

.ef-model {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-4) var(--sp-12);
    min-height: 44px;
    padding: var(--sp-12);
    border: 0;
    border-bottom: 1px solid var(--c-line);
    background: none;
    color: var(--c-ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
}

.ef-model__name {
    font-weight: 600;
}

.ef-model__sub {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

@media (hover: hover) and (pointer: fine) {
    .ef-model:hover {
        background: var(--c-band);
    }
}

.ef-wheel__chosen {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-8);
    margin: 0;
}

.ef-printed__add {
    justify-self: start;
}

.ef-printed__remove {
    grid-column: 1 / -1;
    justify-self: start;
}

/* The two axles side by side, as they stand on the car: stacked where the column is too narrow to read two. */
.ef-axles {
    display: grid;
    gap: var(--sp-16);
}

@media (min-width: 720px) {
    .ef-axles {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

.ef-axle {
    display: grid;
    gap: 0;
    min-width: 0;
}

.ef-axle__title {
    margin-bottom: var(--sp-8);
    font-weight: 600;
}

/* Rows, as the cars of step 3 and the to-do list of step 4: the chosen one tinted, with the rail's bar on its left. */
.ef-size {
    display: flex;
    gap: var(--sp-12);
    align-items: flex-start;
    padding: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    cursor: pointer;
}

.ef-size--on {
    background: var(--c-blue-tint);
    box-shadow: var(--adm-row-focus);
}

@media (hover: hover) and (pointer: fine) {
    .ef-size:not(.ef-size--on):hover {
        background: var(--c-band);
    }
}

.ef-size__radio {
    flex: none;
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: var(--c-blue);
}

.ef-size__text {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.ef-size__dim {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.ef-size__detail {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
}

.ef-size__colours {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-4) var(--sp-12);
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.ef-size__colour {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
}

.ef-size__only {
    color: var(--c-ink-3);
}

.ef-dot {
    width: 12px;
    height: 12px;
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-round);
    background: var(--swatch, var(--c-ink-2));
}

.ef-pick,
.ef-combos {
    display: grid;
    gap: var(--sp-8);
    justify-items: start;
}

.ef-pick__line {
    margin: 0;
    font-variant-numeric: tabular-nums;
}

.ef-pick__axle {
    display: inline-block;
    min-width: calc(7 * var(--ch-text));
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.ef-pick__actions,
.ef-combo__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-12);
}

.ef-combos__list {
    display: grid;
    gap: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
}

.ef-combo {
    display: grid;
    gap: var(--sp-4);
    justify-items: start;
    padding-block: var(--sp-12);
    border-top: 1px solid var(--c-line);
}

.ef-combo--on {
    background: var(--c-blue-tint);
    box-shadow: var(--adm-row-focus);
}

.ef-combo__label {
    margin: 0;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
}
</style>
