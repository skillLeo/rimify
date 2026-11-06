<script setup lang="ts">
/**
 * Step 5, Freigeben (the Gutachten rework §7): every car at a glance, gaps flagged, a click back to the empty one. What used to
 * stand in two banners is asked here, where it is decided: the cars whose data has no documented provenance, the codes nobody has
 * described, how the paper gives load index and speed symbol. „Freigeben“ goes through the release door as before: it names what
 * is still open, and an undescribed code or two cars of one field K with different pairs are among those things.
 */

import { router } from '@inertiajs/vue3'
import { computed, onMounted, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { decimal } from '../../../../format'
import ReleaseDialog from '../ReleaseDialog.vue'
import CodeDefine from './CodeDefine.vue'
import CountSection from './CountSection.vue'
import LegendDialog from './LegendDialog.vue'
import { carSummary, useEntry, type CarView, useGutachtenPage } from './entryStore'
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

const cars = computed(() => state.entry.cars)
const size = computed(() => state.entry.wheelSizes[0])
const empty = computed(() => cars.value.filter((car) => !car.done))
const unproven = computed(() => cars.value.filter((car) => car.unsourced))
const codes = computed(() => state.entry.undescribed)
const rows = computed(() => page.props.rowsTotal ?? 0)
const blockers = computed(() => page.props.blockers ?? [])

const LI_SOURCES = [
    { value: 'document', label: 'Bei jeder Reifengröße' },
    { value: 'papers', label: 'Mit einem Verweis auf die Fahrzeugpapiere' },
    { value: 'table', label: 'In einer Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit' },
] as const

const liSource = computed(() => doc.value.shape.tyre_index_source || null)

/* What the door says, fresh: the rows may have changed in the steps before this one. */
function refresh(): void {
    router.reload({ only: ['blockers', 'document', 'rowsTotal', 'vehicles', 'entry', 'conditions', 'unresolved', 'stamps', 'flash'] })
}

onMounted(refresh)

function jump(car: CarView): void {
    state.carId = car.id
    store.go(3)
}

async function confirm(car: CarView): Promise<void> {
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

const releaseError = computed(() => ((page.props.errors ?? {}) as Record<string, string | undefined>).release ?? '')
</script>

<template>
    <section class="ef-step" aria-labelledby="ef-release-h">
        <h2 id="ef-release-h" class="adm-section__title" tabindex="-1">Prüfen und freigeben</h2>
        <p class="adm-note">Alle Fahrzeuge auf einen Blick. Lücken sind markiert; ein Klick führt zurück zum Eintragen.</p>

        <p v-if="empty.length" class="ef-gap">
            <Icon name="warning" :size="20" />
            {{ empty.length === 1 ? '1 Fahrzeug hat' : `${decimal(empty.length, 0)} Fahrzeuge haben` }} noch keine Reifen.
            <button class="ef-link" type="button" @click="jump(empty[0]!)">Jetzt eintragen</button>
        </p>

        <div v-if="cars.length" class="adm-panel ef-matrix">
            <table class="adm-table">
                <caption class="visually-hidden">Fahrzeuge und ihre Reifen</caption>
                <thead>
                    <tr>
                        <th scope="col">Fahrzeug</th>
                        <th scope="col">Feld K</th>
                        <th scope="col">{{ size ? size.label : 'Reifen' }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="car in cars" :key="car.id">
                        <td data-label="Fahrzeug"><span class="adm-table__key">{{ car.label }}</span><span v-if="car.finish || car.axle !== 'ALL'" class="adm-table__sub">{{ [car.finish ? `nur ${car.finish}` : '', car.axle === 'FRONT' ? 'nur Vorderachse' : car.axle === 'REAR' ? 'nur Hinterachse' : ''].filter(Boolean).join(' · ') }}</span></td>
                        <td data-label="Feld K">{{ car.k ?? '–' }}</td>
                        <td data-label="Reifen">
                            <button class="ef-cellbtn" :class="{ 'ef-cellbtn--empty': !car.done || car.conflict }" type="button" @click="jump(car)">
                                {{ carSummary(car) }}
                                <span v-if="car.conflict" class="adm-tag adm-tag--warn">Prüfen</span>
                                <span v-if="car.copiedFrom" class="adm-tag adm-tag--neutral">kopiert von {{ car.copiedFrom }}</span>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p v-if="failure" class="adm-alert" role="alert">{{ failure }}</p>

        <div class="ef-checks">
            <section v-if="state.entry.conflicts.length" class="ef-check" aria-labelledby="ef-conflict-h">
                <h3 id="ef-conflict-h" class="ef-check__title">Gleiche Betriebserlaubnis, andere Kombinationen</h3>
                <p class="adm-note">Der Shop speichert Kombinationen je Betriebserlaubnis (Feld K). Ein Fahrzeug bekäme hier eine Kombination, die bei ihm nicht eingetragen ist. Trag sie bei allen betroffenen Fahrzeugen ein oder bei keinem: „Kopieren nach …“ gleicht sie an.</p>
                <ul class="ef-check__list">
                    <li v-for="conflict in state.entry.conflicts" :key="`${conflict.vehicleId}-${conflict.pair}`" class="ef-check__item">
                        <span><strong>{{ conflict.car }}</strong> · Feld K {{ conflict.k }} · {{ conflict.pair }}<template v-if="conflict.others.length">, eingetragen bei {{ conflict.others.join(', ') }}</template></span>
                        <button class="btn btn--secondary" type="button" @click="jump(cars.find((c) => c.vehicleId === conflict.vehicleId)!)">Zum Fahrzeug</button>
                    </li>
                </ul>
            </section>

            <section v-if="state.entry.unreachable.length" class="ef-check" aria-labelledby="ef-reach-h">
                <h3 id="ef-reach-h" class="ef-check__title">Fahrzeuge, denen der Shop keine Kombination zuordnen kann</h3>
                <p class="adm-note">Der Shop ordnet Kombinationen über die EG-Nummer in Feld K zu. Bei diesen Fahrzeugen ist keine hinterlegt, oder sie passt zu keinem Eintrag. Ihre Felge lässt sich freigeben, ihre Reifen bleiben im Shop „Noch nicht bestätigt“.</p>
                <ul class="ef-check__list">
                    <li v-for="car in state.entry.unreachable" :key="car.vehicleId" class="ef-check__item">
                        <span><strong>{{ car.car }}</strong> · Feld K {{ car.k ?? 'nicht hinterlegt' }}</span>
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
                <h3 id="ef-open-h" class="ef-check__title">Codes ohne Beschreibung</h3>
                <p class="adm-note">Der Shop zeigt eine Auflage als ganzen Satz. Ohne Beschreibung hätte er keinen.</p>
                <ul class="ef-check__list">
                    <li v-for="code in codes" :key="code" class="ef-check__item">
                        <span class="ef-code ef-code--open">{{ code }}</span>
                        <button v-if="describing !== code" class="btn btn--secondary" type="button" @click="describing = code">{{ code }} beschreiben</button>
                        <div v-else class="ef-check__form">
                            <CodeDefine :code="code" :id-prefix="`ef-release-${code}`" @done="describing = null" @cancel="describing = null" />
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

            <CountSection v-if="doc.count" />
        </div>

        <PreviewSection />

        <div v-if="blockers.length" class="ef-blockers" role="status">
            <p class="ef-blockers__title">Noch offen vor der Freigabe</p>
            <ul class="ef-blockers__list">
                <li v-for="line in blockers" :key="line">{{ line }}</li>
            </ul>
            <button v-if="state.editable && blockers.some((line) => line.includes('Auflagenverzeichnis'))" class="ef-link" type="button" @click="legendOpen = true">Auflagenverzeichnis öffnen</button>
        </div>
        <p v-if="releaseError" class="adm-alert" role="alert">{{ releaseError }}</p>

        <div class="ef-actions">
            <button class="btn btn--secondary ef-actions__left" type="button" @click="store.go(3)">Zurück</button>
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
