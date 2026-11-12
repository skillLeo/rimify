<script setup lang="ts">
/**
 * Step 5, Freigeben (the Gutachten rework §7): every car at a glance, gaps flagged, a click back to the empty one. What used to
 * stand in two banners is asked here, where it is decided: the cars whose data has no documented provenance, the codes nobody has
 * described, how the paper gives load index and speed symbol. „Freigeben“ goes through the release door as before: it names what
 * is still open, and an undescribed code or two cars of one field K with different pairs are among those things.
 */

import { computed, nextTick, onMounted, ref } from 'vue'
import AdminConfirm from '../../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { decimal } from '../../../../format'
import { cancelReload, freshReload } from '../../../../lib/freshReload'
import ReleaseDialog from '../ReleaseDialog.vue'
import CodeDefine from './CodeDefine.vue'
import LegendDialog from './LegendDialog.vue'
import { carSummary, distinctCars, useEntry, type CarView, useGutachtenPage } from './entryStore'
import PreviewSection from './PreviewSection.vue'

const store = useEntry()
const { state } = store
const page = useGutachtenPage()
const doc = computed(() => page.props.document)

const describing = ref<string | null>(null)
const legendOpen = ref(false)
const releaseOpen = ref(false)
const busy = ref<number | null>(null)
const failure = ref('')
/* A cell with something typed in it, or a car's last: asked before it goes. */
const dropping = ref<CarView | null>(null)
const dropOpen = computed({
    get: () => dropping.value !== null,
    set: (open: boolean) => {
        if (!open) {
            dropping.value = null
        }
    },
})
const cellBusy = ref(false)

const cars = computed(() => state.entry.cars)
const combinations = computed(() => state.entry.combinations)
const vehicles = computed(() => distinctCars(cars.value))
const empty = computed(() => cars.value.filter((car) => !car.done))
const unproven = computed(() => vehicles.value.filter((car) => car.unsourced))
/* Labels carry commas of their own: each in quotes, the last joined with „und“, as the door's sentence has them. */
const quoted = (labels: string[]): string => {
    const all = labels.map((label) => `„${label}“`)
    const last = all.pop() ?? ''

    return all.length ? `${all.join(', ')} und ${last}` : last
}
const codes = computed(() => state.entry.undescribed)
const rows = computed(() => page.props.rowsTotal ?? 0)
const blockers = computed(() => page.props.blockers ?? [])

const LI_SOURCES = [
    { value: 'document', label: 'Bei jeder Reifengröße' },
    { value: 'papers', label: 'Mit einem Verweis auf die Fahrzeugpapiere' },
    { value: 'table', label: 'In einer Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit' },
] as const

const liSource = computed(() => doc.value.shape.tyre_index_source || null)

/* What the door says, fresh: the rows may have changed in the steps before this one. A save calls off the reload
   still on its way, whose answer it makes old (freshReload). */
const REFRESH = 'erfassung-freigabe'

function refresh(): void {
    freshReload(REFRESH, { only: ['blockers', 'document', 'rowsTotal', 'vehicles', 'entry', 'conditions', 'unresolved', 'stamps', 'flash'] })
}

onMounted(refresh)

/* A car's cell in a wheel combination; undefined where it was taken out. */
function cell(vehicleId: number, combinationId: number): CarView | undefined {
    return cars.value.find((car) => car.vehicleId === vehicleId && car.combinationId === combinationId)
}

const isLastCell = (car: CarView): boolean => cars.value.filter((other) => other.vehicleId === car.vehicleId).length === 1

function askDrop(car: CarView): void {
    if (car.lines + car.unread + car.codes > 0 || isLastCell(car)) {
        dropping.value = car
    } else {
        void dropCell(car)
    }
}

const dropBody = computed(() => {
    const car = dropping.value

    if (car === null) {
        return ''
    }

    const typed = car.lines + car.unread + car.codes > 0 ? 'Was in diesem Feld eingetragen ist, wird gelöscht. ' : ''
    const leaves = isLastCell(car) ? 'Es ist das letzte Feld dieses Fahrzeugs: Das Fahrzeug fällt damit aus dieser Erfassung.' : 'Das Fahrzeug bleibt mit seinen anderen Feldern in der Erfassung.'

    return `${typed}${leaves}`
})

/* „Gilt nicht für dieses Fahrzeug“: a car stays on the paper by its other combinations. The door stops asking for this one. */
async function dropCell(car: CarView): Promise<void> {
    cancelReload(REFRESH)
    // One request, however often it is pressed: the second would only fail, and say so over one that worked.
    if (cellBusy.value) {
        return
    }

    cellBusy.value = true
    failure.value = ''

    try {
        await store.save('DELETE', `/fahrzeuge/${car.id}/zelle`)
        refresh()
    } catch (error) {
        failure.value = error instanceof Error ? error.message : 'Das hat nicht geklappt.'
    } finally {
        dropping.value = null
        cellBusy.value = false
    }
}

async function addCell(vehicleId: number, combinationId: number): Promise<void> {
    cancelReload(REFRESH)
    if (cellBusy.value) {
        return
    }

    cellBusy.value = true
    failure.value = ''

    try {
        await store.save('POST', '/zellen', { vehicle_id: vehicleId, combination_id: combinationId })
        refresh()
    } catch (error) {
        failure.value = error instanceof Error ? error.message : 'Das hat nicht geklappt.'
    } finally {
        cellBusy.value = false
    }
}

function jump(car: CarView): void {
    state.carId = car.id
    void store.go(3)
}

/* The form is gone with the code it described: the keyboard goes on from the list, or the step where the list is gone too. */
function describedDone(): void {
    describing.value = null
    void nextTick(() => (document.getElementById('ef-open-h') ?? document.getElementById('ef-release-h'))?.focus())
}

async function confirm(car: CarView): Promise<void> {
    cancelReload(REFRESH)
    busy.value = car.id
    failure.value = ''

    try {
        await store.save('POST', `/fahrzeuge/${car.id}/geprueft`)
        refresh()
    } catch (error) {
        failure.value = error instanceof Error ? error.message : 'Das hat nicht geklappt.'
    } finally {
        busy.value = null
    }
}

async function answerIndex(value: string): Promise<void> {
    cancelReload(REFRESH)
    failure.value = ''

    try {
        await store.save('PUT', '/lastindex', { tyre_index_source: value })
        refresh()
    } catch (error) {
        failure.value = error instanceof Error ? error.message : 'Das hat nicht geklappt.'
    }
}

const releaseBody = computed(() => {
    const what = rows.value === 0
        ? 'Der Shop übernimmt danach die Angaben dieses Grundgutachtens für seine Nachträge.'
        : `${rows.value === 1 ? 'Die Zeile gilt' : `Alle ${decimal(rows.value, 0)} Zeilen gelten`} danach sofort im Shop.`

    return `${what} Angaben, Codes und Zeilen lassen sich dann nicht mehr ändern – eine Korrektur geht über „Neue Fassung anlegen“, und die neue Fassung ersetzt dieses Gutachten, sobald sie freigegeben ist.`
})

/* One combination: a gap is a car. Several: a gap is one field of the overview, and a car may have the others filled. */
const gap = computed(() => {
    const count = empty.value.length

    if (combinations.value.length > 1) {
        return count === 1 ? '1 Feld der Übersicht ist noch leer.' : `${decimal(count, 0)} Felder der Übersicht sind noch leer.`
    }

    return count === 1 ? '1 Fahrzeug hat noch keine Reifen.' : `${decimal(count, 0)} Fahrzeuge haben noch keine Reifen.`
})

const releaseError = computed(() => ((page.props.errors ?? {}) as Record<string, string | undefined>).release ?? '')
</script>

<template>
    <section class="ef-step" aria-labelledby="ef-release-h">
        <h2 id="ef-release-h" class="adm-section__title" tabindex="-1">Prüfen und freigeben</h2>
        <p class="adm-note">Alle Fahrzeuge auf einen Blick. Lücken sind markiert; ein Klick führt zurück zum Eintragen.</p>

        <p v-if="empty.length" class="ef-gap">
            <Icon name="warning" :size="20" />
            {{ gap }}
            <button class="ef-link" type="button" @click="jump(empty[0]!)">Jetzt eintragen</button>
        </p>

        <div v-if="cars.length" class="adm-panel ef-matrix">
            <table class="adm-table">
                <caption class="visually-hidden">Fahrzeuge und ihre Reifen</caption>
                <thead>
                    <tr>
                        <th scope="col">Fahrzeug</th>
                        <th scope="col">Feld K</th>
                        <th v-for="combination in combinations" :key="combination.id" scope="col">
                            <span v-for="part in combination.label.split(' · ')" :key="part" class="ef-matrix__head">{{ part }}</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="car in vehicles" :key="car.vehicleId">
                        <td data-label="Fahrzeug"><span class="adm-table__key">{{ car.label }}</span><span v-if="car.finish || car.axle !== 'ALL'" class="adm-tag adm-tag--neutral ef-matrix__scope">{{ [car.finish ? `nur ${car.finish}` : '', car.axle === 'FRONT' ? 'nur Vorderachse' : car.axle === 'REAR' ? 'nur Hinterachse' : ''].filter(Boolean).join(' · ') }}</span></td>
                        <td data-label="Feld K">{{ car.k ?? '–' }}</td>
                        <td v-for="combination in combinations" :key="combination.id" :data-label="combination.label">
                            <div v-if="cell(car.vehicleId, combination.id)" class="ef-matrix__cell">
                                <button class="ef-cellbtn" :class="{ 'ef-cellbtn--empty': !cell(car.vehicleId, combination.id)!.done || cell(car.vehicleId, combination.id)!.unread > 0 || cell(car.vehicleId, combination.id)!.conflict }" type="button" @click="jump(cell(car.vehicleId, combination.id)!)">
                                    {{ carSummary(cell(car.vehicleId, combination.id)!) }}
                                    <span v-if="cell(car.vehicleId, combination.id)!.conflict" class="adm-tag adm-tag--warn">Prüfen</span>
                                    <span v-if="cell(car.vehicleId, combination.id)!.copiedFrom" class="adm-tag adm-tag--neutral">kopiert von {{ cell(car.vehicleId, combination.id)!.copiedFrom }}</span>
                                </button>
                                <button v-if="state.editable && combinations.length > 1 && !cell(car.vehicleId, combination.id)!.done" class="ef-link ef-matrix__drop" type="button" :aria-label="`Gilt nicht für dieses Fahrzeug: ${combination.label}`" @click="askDrop(cell(car.vehicleId, combination.id)!)">Gilt nicht</button>
                            </div>
                            <div v-else class="ef-matrix__cell">
                                <span class="quiet">gilt nicht</span>
                                <button v-if="state.editable" class="ef-link ef-matrix__drop" type="button" @click="addCell(car.vehicleId, combination.id)">Wieder aufnehmen</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p v-if="failure" class="adm-alert" role="alert">{{ failure }}</p>

        <!-- Why the button below is off, next to what it speaks of. -->
        <div v-if="blockers.length" id="ef-open-points" class="ef-blockers" role="status" tabindex="-1" data-dialog-fallback>
            <p class="ef-blockers__title">Noch offen vor der Freigabe</p>
            <ul class="ef-blockers__list">
                <li v-for="line in blockers" :key="line">{{ line }}</li>
            </ul>
            <button v-if="state.editable && blockers.some((line) => line.includes('Auflagenverzeichnis'))" class="ef-link" type="button" @click="legendOpen = true">Auflagenverzeichnis öffnen</button>
        </div>

        <AdminConfirm
            v-model:open="dropOpen"
            title="Gilt nicht für dieses Fahrzeug?"
            :body="dropBody"
            confirm-label="Feld entfernen"
            :busy="cellBusy"
            @confirm="dropping && dropCell(dropping)"
        />

        <div class="ef-checks">
            <section v-if="state.entry.conflicts.length" class="ef-check" aria-labelledby="ef-conflict-h">
                <h3 id="ef-conflict-h" class="ef-check__title">Reifenkombinationen ohne eindeutige Felgenkombination</h3>
                <p class="adm-note">Der Shop speichert Reifenkombinationen je Fahrzeug, nicht je Felgenkombination. Haben zwei Felgenkombinationen eines Fahrzeugs vorne und hinten dieselben Durchmesser, erkennt er eine Reifenkombination nur an ihren Größen. Stehen ihre Größen bei beiden, würde er sie bei beiden anbieten. Gilt sie bei beiden, trag sie bei beiden ein; sonst nimm sie dort heraus, wo sie eingetragen ist.</p>
                <ul class="ef-check__list">
                    <li v-for="conflict in state.entry.conflicts" :key="`${conflict.entryId}-${conflict.pair}`" class="ef-check__item">
                        <span><strong>{{ conflict.car }}</strong> · {{ conflict.combination }} · {{ conflict.pair }}<template v-if="conflict.enteredAt.length">, eingetragen nur bei {{ quoted(conflict.enteredAt) }}</template></span>
                        <button class="btn btn--secondary" type="button" @click="jump(cars.find((c) => c.id === conflict.entryId)!)">Zum Fahrzeug</button>
                    </li>
                </ul>
            </section>

            <section v-if="state.entry.unread.length" class="ef-check" aria-labelledby="ef-unread-h">
                <h3 id="ef-unread-h" class="ef-check__title">Nicht lesbare Reifen</h3>
                <ul class="ef-check__list">
                    <li v-for="line in state.entry.unread" :key="`${line.entryId}-${line.text}`" class="ef-check__item">
                        <span><strong>{{ line.car }}</strong> · „{{ line.text }}“</span>
                        <button class="btn btn--secondary" type="button" @click="jump(cars.find((c) => c.id === line.entryId)!)">Zum Fahrzeug</button>
                    </li>
                </ul>
            </section>

            <section v-if="unproven.length" class="ef-check" aria-labelledby="ef-prov-h">
                <h3 id="ef-prov-h" class="ef-check__title">Fahrzeuge ohne belegte Herkunft</h3>
                <p class="adm-note">Zur Freigabe müssen die Daten jedes Fahrzeugs aus einem Import oder aus einem Gutachten stammen oder von Hand geprüft sein.</p>
                <ul class="ef-check__list">
                    <li v-for="car in unproven" :key="car.id" class="ef-check__item">
                        <span><strong>{{ car.label }}</strong><template v-if="car.sourceLabel"> · {{ car.sourceLabel }}</template></span>
                        <button class="btn btn--secondary" type="button" :disabled="busy === car.id" :aria-busy="busy === car.id ? 'true' : undefined" @click="confirm(car)">Daten geprüft</button>
                    </li>
                </ul>
            </section>

            <section v-if="codes.length" class="ef-check" aria-labelledby="ef-open-h">
                <h3 id="ef-open-h" class="ef-check__title" tabindex="-1">Codes ohne Beschreibung</h3>
                <p class="adm-note">Der Shop zeigt eine Auflage als ganzen Satz. Ohne Beschreibung hätte er keinen.</p>
                <ul class="ef-check__list">
                    <li v-for="code in codes" :key="code" class="ef-check__item">
                        <span class="ef-code ef-code--open">{{ code }}</span>
                        <button v-if="describing !== code" class="btn btn--secondary" type="button" @click="describing = code">{{ code }} beschreiben</button>
                        <div v-else class="ef-check__form">
                            <CodeDefine :code="code" :id-prefix="`ef-release-${code}`" @done="describedDone" @cancel="describing = null" />
                        </div>
                    </li>
                </ul>
            </section>

            <fieldset class="ef-fieldset ef-check">
                <legend class="ef-check__title">Wie gibt das Gutachten Lastindex und Geschwindigkeitssymbol an?</legend>
                <label v-for="option in LI_SOURCES" :key="option.value" class="check ef-check__radio">
                    <input type="radio" name="ef-li-release" :value="option.value" :checked="liSource === option.value" @change="answerIndex(option.value)">
                    {{ option.label }}
                    <span v-if="state.entry.suggestion === option.value" class="adm-tag adm-tag--neutral">Vorschlag</span>
                </label>
                <p v-if="state.entry.suggestion" class="form-field__help">Der Vorschlag kommt aus den eingetragenen Reifen. Entscheidend ist, was im Gutachten steht.</p>
            </fieldset>

        </div>

        <PreviewSection />

        <p v-if="releaseError" class="adm-alert" role="alert">{{ releaseError }}</p>

        <div class="ef-actions">
            <button class="btn btn--secondary ef-actions__left" type="button" @click="store.go(3)">Zurück</button>
            <a v-if="blockers.length" class="ef-link ef-actions__why" href="#ef-open-points">{{ blockers.length === 1 ? '1 Punkt offen' : `${decimal(blockers.length, 0)} Punkte offen` }}</a>
            <button v-if="page.props.can.release" class="btn btn--primary" type="button" :disabled="blockers.length > 0" @click="releaseOpen = true">
                <Icon name="publish" :size="20" />
                Freigeben
            </button>
        </div>

        <ReleaseDialog v-if="page.props.can.release" v-model:open="releaseOpen" mode="release" :document="doc" :rows="rows" :note="releaseBody" />
        <LegendDialog v-if="state.editable" v-model:open="legendOpen" />
    </section>
</template>

<style scoped>
.ef-gap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: var(--sp-16) 0;
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-warn-tint);
    color: var(--c-ink);
}

.ef-matrix {
    margin-top: var(--sp-16);
}

/* Each axle on its own line: four combinations stay readable side by side. */
.ef-matrix__head {
    display: block;
    white-space: nowrap;
}

.ef-matrix__cell {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
    min-height: 24px;
}

/* The exception is quieter than the gap it answers. */
.ef-matrix__drop {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

/* Scrolling sideways never loses the cars. */
@media (min-width: 768px) {
    .ef-matrix :is(th, td):first-child {
        position: sticky;
        left: 0;
        z-index: var(--z-raised);
        min-width: calc(24 * var(--ch-text));
        background: var(--c-surface);
    }
}

.ef-cellbtn {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    padding: var(--sp-4) var(--sp-8);
    border: 0;
    border-radius: var(--r-control);
    background: none;
    color: var(--c-blue);
    font: inherit;
    text-align: left;
    cursor: pointer;
}

/* A filled cell reads as the column's text, under its heading; an empty one as a tag, the height of „Offen“. */
.ef-cellbtn:not(.ef-cellbtn--empty) {
    padding-inline: 0;
}

.ef-cellbtn--empty {
    min-height: 24px;
    padding-block: 0;
    background: var(--c-warn-tint);
    color: var(--c-ink);
    font-weight: 500;
}

@media (hover: hover) and (pointer: fine) {
    .ef-cellbtn:hover {
        text-decoration: underline;
    }
}

.ef-checks {
    display: grid;
    gap: var(--sp-24);
    max-width: var(--adm-form-max);
    margin-block: var(--sp-32);
}

.ef-check {
    display: grid;
    gap: var(--sp-8);
}

.ef-check__title {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.ef-check__radio {
    min-height: var(--adm-control-h);
}

.ef-check__list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
}

.ef-check__item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8) var(--sp-12);
    padding: var(--sp-8) 0;
    border-bottom: 1px solid var(--c-line);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

/* A row keeps its one button at its end; only the form that opens in place takes a line of its own. */
@media (min-width: 768px) {
    .ef-check__item:not(:has(.ef-check__form)) {
        flex-wrap: nowrap;
    }
}

.ef-check__list {
    border-top: 1px solid var(--c-line);
}

.ef-check__form {
    flex-basis: 100%;
}

.ef-check__page {
    flex: 1;
    color: var(--c-ink-3);
    font-size: var(--fs-small);
}

.ef-check__then {
    margin: calc(var(--sp-4) * -1) 0 var(--sp-4) var(--sp-24);
}

.ef-done {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    color: var(--c-ok);
    font-weight: 600;
}

.ef-check__missing {
    margin-left: var(--sp-24);
}

.ef-suggest {
    margin-left: var(--sp-8);
}

.ef-release {
    margin-top: var(--sp-32);
}

.ef-release__open {
    max-width: var(--adm-form-max);
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.ef-release__open ul {
    margin: var(--sp-8) 0 0;
    padding-left: var(--sp-20);
    list-style: disc;
}

.ef-read__tyres {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.ef-read__tyres li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
}

.ef-read__size {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}
</style>
