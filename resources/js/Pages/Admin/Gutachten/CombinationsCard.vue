<script setup lang="ts">
/**
 * The document's own „Bereifungskombinationen“ (D-256; the client's item 8), per vehicle type since his admin item 19
 * (D-358: „the Bereifungskombinationen should be adjustable per EG-Typgenehmigungsnummer“) — as the PDF prints them: a
 * Verwendungsbereich lists the types by their EG type-approval number, and each type its own combinations, each with its
 * number, the size on the front axle and the size on the rear (`225/40 R18`). Once a type has any, the shop offers it no
 * tyres on this document but these; a car whose EG number has none is told its tyres are not confirmed yet.
 *
 * The EG number is chosen first. Its list is saved whole, into its own error bag (`kombinationen`); „Kombinationen
 * kopieren von …“ fills the form with another number's list to check before saving, and „Auf mehrere EG-Nummern
 * anwenden“ puts one combination on several numbers at once.
 */

import { router, useForm, usePage } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import { useFocusAfter } from '../../../composables/admin/useFocusAfter'
import { stampHeaders } from '../../../composables/admin/useDirtyForm'
import type { CombinationRow, CombinationsView } from '../../../types/admin/gutachten'

const props = defineProps<{
    documentId: number
    combinations: CombinationsView
    editable: boolean
    pageCount: number | null
    /** The lists as this card was opened on (EditStamp): a save against an older one is refused. */
    stamp?: string
}>()

const BAG = 'kombinationen'
const focus = useFocusAfter()
const page = usePage()

interface Row {
    number: number | ''
    front: string
    rear: string
}

const entries = computed(() => props.combinations.entries)
const selected = ref<string>(entries.value[0]?.eg ?? '')
const current = computed(() => entries.value.find((e) => e.eg === selected.value) ?? null)
const others = computed(() => entries.value.filter((e) => e.eg !== selected.value))
/* „Auf mehrere EG-Nummern anwenden“ only where the list may change and there is another number to put it on. */
const canApply = computed(() => props.editable && others.value.length > 0)

/* The list a person sees for an entry, with the car's names after its number. */
function entryLabel(entry: CombinationsView['entries'][number]): string {
    const cars = entry.cars.length > 0 ? ` – ${entry.cars.join(', ')}` : ''
    const count = entry.combinations.length === 1 ? '1 Kombination' : `${entry.combinations.length} Kombinationen`

    return `${entry.eg}${cars} (${count})`
}

const rowsOf = (list: CombinationRow[]): Row[] => list.map((c): Row => ({ number: c.number, front: c.front, rear: c.rear }))

const form = useForm({
    entry: selected.value,
    source_page: (props.combinations.sourcePage ?? '') as number | '',
    combinations: rowsOf(current.value?.combinations ?? []),
})

const editing = ref(false)
const empty = computed(() => (current.value?.combinations.length ?? 0) === 0)
const errors = computed(() => ((page.props.errors ?? {}) as Record<string, Record<string, string> | undefined>)[BAG] ?? {})

/* Another EG number chosen, or the lists saved anew: the form follows the entry shown. */
watch([selected, () => props.combinations], () => {
    if (!editing.value) {
        form.entry = selected.value
        form.combinations = rowsOf(current.value?.combinations ?? [])
        form.defaults()
    }
})

function nextNumber(): number {
    return form.combinations.reduce((highest, row) => Math.max(highest, typeof row.number === 'number' ? row.number : 0), 0) + 1
}

function start(): void {
    form.entry = selected.value

    if (form.combinations.length === 0) {
        form.combinations = [{ number: 1, front: '', rear: '' }]
    }

    editing.value = true
    focus.request('kb-page')
}

function addRow(): void {
    form.combinations.push({ number: nextNumber(), front: '', rear: '' })
    focus.request(`kb-front-${form.combinations.length - 1}`)
}

function removeRow(i: number): void {
    form.combinations.splice(i, 1)
    focus.request(form.combinations.length > 0 ? `kb-front-${Math.max(0, i - 1)}` : 'kb-add-row')
}

/* „Kombinationen kopieren von …“: another number's list into the form, to check and save — nothing is saved by it. */
const copyFrom = ref('')
const copied = ref('')

function copy(): void {
    const source = entries.value.find((e) => e.eg === copyFrom.value)

    if (source === undefined) {
        return
    }

    form.combinations = rowsOf(source.combinations)
    copied.value = `${source.combinations.length === 1 ? 'Eine Kombination' : `${source.combinations.length} Kombinationen`} von ${source.eg} übernommen – prüf sie und speichere.`
    focus.request('kb-save')
}

function cancel(): void {
    form.reset()
    form.clearErrors()
    copied.value = ''
    editing.value = false
    focus.request('kb-edit')
}

function save(): void {
    form.put(`/admin/gutachten/${props.documentId}/bereifungskombinationen`, {
        preserveScroll: true,
        errorBag: BAG,
        headers: stampHeaders(props.stamp),
        onSuccess: () => {
            editing.value = false
            copied.value = ''
            focus.request('kb-edit')
        },
        onError: () => {
            const first = Object.keys(errors.value)[0] ?? ''
            const field = /^combinations\.(\d+)\.(number|front|rear)$/.exec(first)

            focus.request(field ? `kb-${field[2]}-${field[1]}` : first === 'source_page' ? 'kb-page' : 'kb-save')
        },
    })
}

function fieldError(i: number, field: 'number' | 'front' | 'rear'): string {
    return errors.value[`combinations.${i}.${field}`] ?? ''
}

/* „Auf mehrere EG-Nummern anwenden“: one combination, the numbers ticked, one request. */
const applying = ref<CombinationRow | null>(null)
const targets = ref<string[]>([])
const sending = ref(false)

const applyOpen = computed({
    get: () => applying.value !== null,
    set: (open: boolean) => {
        if (!open) {
            applying.value = null
        }
    },
})

function openApply(row: CombinationRow): void {
    targets.value = []
    applying.value = row
}

function apply(): void {
    if (applying.value === null || targets.value.length === 0 || sending.value) {
        return
    }

    sending.value = true
    router.post(`/admin/gutachten/${props.documentId}/bereifungskombinationen/anwenden`, { combination: applying.value.id, targets: targets.value }, {
        preserveScroll: true,
        errorBag: BAG,
        headers: stampHeaders(props.stamp),
        onSuccess: () => {
            applying.value = null
        },
        onFinish: () => {
            sending.value = false
        },
    })
}
</script>

<template>
    <div class="kb">
        <p class="adm-note">
            Nennt das Gutachten Bereifungskombinationen, trag sie je Fahrzeugtyp ein: bei der EG-Typgenehmigungsnummer, unter der das
            Gutachten den Typ führt, jede mit ihrer Nummer, wie sie im Gutachten steht. Der Shop bietet für diesen Typ dann nur diese
            Kombinationen an – vier gleiche Reifen also nur, wenn eine Kombination vorne und hinten dieselbe Größe nennt. Ist für die
            EG-Nummer eines Fahrzeugs hier keine Kombination eingetragen, bestätigt der Shop dessen Reifen nicht.
        </p>

        <!-- Rows carried over without a number of a car (no car of the document named one): they match no car. -->
        <p v-if="combinations.unassigned.length > 0" class="adm-alert" role="status">
            {{ combinations.unassigned.length === 1 ? 'Eine Kombination ist' : `${combinations.unassigned.length} Kombinationen sind` }} ohne
            EG-Typgenehmigungsnummer erfasst und {{ combinations.unassigned.length === 1 ? 'gilt' : 'gelten' }} deshalb für kein Fahrzeug. Trag
            {{ combinations.unassigned.length === 1 ? 'sie' : 'sie jeweils' }} bei der passenden EG-Nummer ein.
        </p>

        <p v-if="entries.length === 0" class="adm-note">
            Zu diesem Gutachten ist bei uns noch kein Fahrzeug mit EG-Typgenehmigungsnummer erfasst. Leg zuerst die Fahrzeuge seines
            Verwendungsbereichs an, danach trägst du hier die Kombinationen je EG-Nummer ein.
        </p>

        <template v-else>
            <div class="form-field kb-entry">
                <label class="form-field__label" for="kb-entry">Fahrzeugtyp (EG-Typgenehmigungsnummer)</label>
                <select id="kb-entry" v-model="selected" class="input" :disabled="editing">
                    <option v-for="entry in entries" :key="entry.eg" :value="entry.eg">{{ entryLabel(entry) }}</option>
                </select>
            </div>

            <template v-if="!editing">
                <p v-if="current?.carriedOver" class="adm-note kb-carried">
                    <span class="adm-tag adm-tag--warn">Übernommen, bitte prüfen</span>
                    Diese Liste war bisher bei uns für alle Fahrzeuge des Gutachtens hinterlegt. Prüf sie für diese EG-Nummer und speichere sie.
                </p>

                <p v-if="empty" class="adm-note">Für diese EG-Nummer sind keine Bereifungskombinationen hinterlegt.</p>

                <div v-else class="kb-scroll">
                    <table class="adm-table kb-table">
                        <caption class="visually-hidden">Bereifungskombinationen für {{ selected }}</caption>
                        <thead>
                            <tr>
                                <th scope="col" class="num">Nr.</th>
                                <th scope="col">Vorderachse</th>
                                <th scope="col">Hinterachse</th>
                                <th v-if="canApply" scope="col"><span class="visually-hidden">Aktionen</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- By position: one number may print several pairs (`Nr. 8: 235/45 R19 – 255/40 R19, 265/40 R19`). -->
                            <tr v-for="row in current?.combinations ?? []" :key="row.id">
                                <th scope="row" class="num kb-nr">{{ row.number }}</th>
                                <!-- The labels the phone's card writes before each size (Human QA 28.10.2026). -->
                                <td class="num" data-label="Vorderachse">{{ row.front }}</td>
                                <td class="num" data-label="Hinterachse">{{ row.rear }}</td>
                                <td v-if="canApply" data-label="Aktionen">
                                    <button class="btn btn--ghost btn--sm" type="button" @click="openApply(row)">
                                        Auf mehrere EG-Nummern anwenden<span class="visually-hidden">: Kombination {{ row.number }}</span>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- Outside the scroll box, so the section's own gap separates it from the last row. -->
                <p v-if="!empty && combinations.sourcePage" class="adm-note">Seite {{ combinations.sourcePage }} im Gutachten.</p>

                <button v-if="editable" id="kb-edit" class="btn btn--ghost" type="button" @click="start">
                    <Icon :name="empty ? 'plus' : 'edit'" :size="20" />
                    {{ empty ? 'Kombinationen eintragen' : 'Kombinationen ändern' }}
                </button>
            </template>

            <form v-else class="kb-form" novalidate aria-labelledby="kb-form-h" @submit.prevent="save">
                <!-- Changed meanwhile elsewhere (EditStamp): nothing was saved, and the pairs typed stay. -->
                <p v-if="errors._stamp" class="adm-alert" role="alert">{{ errors._stamp }}</p>
                <p v-if="errors.entry" class="adm-alert" role="alert">{{ errors.entry }}</p>
                <p id="kb-form-h" class="form-field__label">Bereifungskombinationen für {{ selected }}</p>
                <p class="form-field__help">Je Kombination die Nummer und die beiden Größen, so wie das Gutachten sie druckt, etwa 225/40 R18. Lastindex und Geschwindigkeitssymbol lässt du weg.</p>

                <div v-if="others.length > 0" class="kb-copy">
                    <div class="form-field">
                        <label class="form-field__label" for="kb-copy-from">Kombinationen kopieren von …</label>
                        <select id="kb-copy-from" v-model="copyFrom" class="input">
                            <option value="">EG-Nummer wählen</option>
                            <option v-for="entry in others" :key="entry.eg" :value="entry.eg" :disabled="entry.combinations.length === 0">{{ entryLabel(entry) }}</option>
                        </select>
                    </div>
                    <button class="btn btn--ghost" type="button" :disabled="copyFrom === ''" @click="copy">Übernehmen</button>
                    <p v-if="copied" class="adm-note kb-copied" role="status">{{ copied }}</p>
                </div>

                <div class="form-field kb-page">
                    <label class="form-field__label" for="kb-page">Seite im Gutachten</label>
                    <input
                        id="kb-page"
                        v-model.number="form.source_page"
                        class="input"
                        type="number"
                        min="1"
                        :max="pageCount ?? undefined"
                        inputmode="numeric"
                        :aria-invalid="errors.source_page ? 'true' : undefined"
                        aria-describedby="kb-page-err"
                    >
                    <p id="kb-page-err" class="form-field__error">{{ errors.source_page }}</p>
                </div>

                <div class="kb-scroll">
                    <table class="kb-grid">
                        <thead>
                            <tr>
                                <th scope="col">Nr.</th>
                                <th scope="col">Vorderachse</th>
                                <th scope="col">Hinterachse</th>
                                <th scope="col"><span class="visually-hidden">Kombination entfernen</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, i) in form.combinations" :key="i">
                                <td>
                                    <label class="visually-hidden" :for="`kb-number-${i}`">Nummer der Kombination in Zeile {{ i + 1 }}</label>
                                    <input
                                        :id="`kb-number-${i}`"
                                        v-model.number="row.number"
                                        class="input kb-number"
                                        type="number"
                                        min="1"
                                        inputmode="numeric"
                                        :aria-invalid="fieldError(i, 'number') ? 'true' : undefined"
                                        :aria-describedby="`kb-number-${i}-err`"
                                    >
                                    <p :id="`kb-number-${i}-err`" class="form-field__error">{{ fieldError(i, 'number') }}</p>
                                </td>
                                <td>
                                    <label class="visually-hidden" :for="`kb-front-${i}`">Kombination {{ row.number || i + 1 }}, Vorderachse</label>
                                    <input
                                        :id="`kb-front-${i}`"
                                        v-model="row.front"
                                        class="input kb-size"
                                        type="text"
                                        maxlength="20"
                                        autocomplete="off"
                                        spellcheck="false"
                                        placeholder="225/40 R18"
                                        :aria-invalid="fieldError(i, 'front') ? 'true' : undefined"
                                        :aria-describedby="`kb-front-${i}-err`"
                                    >
                                    <p :id="`kb-front-${i}-err`" class="form-field__error">{{ fieldError(i, 'front') }}</p>
                                </td>
                                <td>
                                    <label class="visually-hidden" :for="`kb-rear-${i}`">Kombination {{ row.number || i + 1 }}, Hinterachse</label>
                                    <input
                                        :id="`kb-rear-${i}`"
                                        v-model="row.rear"
                                        class="input kb-size"
                                        type="text"
                                        maxlength="20"
                                        autocomplete="off"
                                        spellcheck="false"
                                        placeholder="245/35 R18"
                                        :aria-invalid="fieldError(i, 'rear') ? 'true' : undefined"
                                        :aria-describedby="`kb-rear-${i}-err`"
                                    >
                                    <p :id="`kb-rear-${i}-err`" class="form-field__error">{{ fieldError(i, 'rear') }}</p>
                                </td>
                                <td>
                                    <button class="btn btn--ghost btn--icon" type="button" :aria-label="`Kombination ${row.number || i + 1} entfernen`" @click="removeRow(i)">
                                        <Icon name="close" :size="20" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="kb-actions">
                    <button id="kb-add-row" class="btn btn--ghost" type="button" @click="addRow">
                        <Icon name="plus" :size="20" />
                        Kombination hinzufügen
                    </button>
                </div>

                <!-- What concerns the list as a whole (more than 60): said beside the button the focus goes to. -->
                <p v-if="errors.combinations" id="kb-list-err" class="form-field__error" role="alert">{{ errors.combinations }}</p>

                <div class="kb-actions">
                    <button
                        id="kb-save"
                        class="btn btn--primary"
                        type="submit"
                        :disabled="form.processing"
                        :aria-busy="form.processing ? 'true' : undefined"
                        :aria-describedby="errors.combinations ? 'kb-list-err' : undefined"
                    >
                        Kombinationen speichern
                    </button>
                    <button class="btn btn--ghost" type="button" :disabled="form.processing" @click="cancel">Abbrechen</button>
                </div>
            </form>
        </template>

        <Dialog v-model:open="applyOpen" :title="`Kombination ${applying?.number ?? ''} auf mehrere EG-Nummern anwenden`" content-class="adm-dialog adm-dialog--narrow">
            <div class="adm-fields">
                <p class="adm-note">
                    Vorne {{ applying?.front }}, hinten {{ applying?.rear }}: für welche EG-Nummern dieses Gutachtens gilt die Kombination auch?
                    Wo sie schon steht, bleibt alles, wie es ist.
                </p>
                <fieldset class="kb-targets">
                    <legend class="visually-hidden">EG-Nummern</legend>
                    <label v-for="entry in others" :key="entry.eg" class="check">
                        <input v-model="targets" type="checkbox" :value="entry.eg">
                        {{ entryLabel(entry) }}
                    </label>
                </fieldset>
                <p v-if="errors.targets || errors.combination" class="adm-alert" role="alert">{{ errors.targets ?? errors.combination }}</p>
            </div>
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="applying = null">Abbrechen</button>
                <button class="btn btn--primary" type="button" :disabled="targets.length === 0 || sending" :aria-busy="sending ? 'true' : undefined" @click="apply">
                    {{ targets.length === 1 ? 'Für eine EG-Nummer eintragen' : `Für ${targets.length} EG-Nummern eintragen` }}
                </button>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.kb,
.kb-form {
    display: grid;
    gap: var(--sp-12);
}

.kb-form {
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.kb-form > .form-field__label,
.kb-form > .form-field__help {
    margin: 0;
}

.kb-entry {
    max-width: 40rem;
}

.kb-carried {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
}

.kb-copy {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--sp-8) var(--sp-12);
}

.kb-copied {
    flex-basis: 100%;
    margin: 0;
}

.kb-page {
    max-width: 12rem;
}

.kb-scroll {
    max-width: 100%;
    overflow-x: auto;
}

.kb-table {
    width: auto;
    min-width: 20rem;
}

/* On a phone each pair is a card: its number as the title, the two axles labelled under it. */
@media (max-width: 767px) {
    .kb-table {
        min-width: 0;
    }

    .kb-table .kb-nr {
        grid-column: 1 / -1;
        padding: 0;
        border: 0;
        text-align: left;
        font-weight: 600;
    }

    .kb-table .kb-nr::before {
        content: 'Kombination ';
    }
}

.kb-grid {
    border-collapse: collapse;
}

.kb-grid th {
    padding: 0 var(--sp-8) var(--sp-4) 0;
    font-size: var(--fs-small);
    font-weight: 600;
    text-align: left;
}

.kb-grid td {
    padding: 0 var(--sp-8) var(--sp-8) 0;
    vertical-align: top;
}

.kb-number {
    width: 4.5rem;
}

.kb-size {
    width: 9rem;
}

.kb-form .form-field__error:empty {
    display: none;
}

.kb-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.kb-targets {
    display: grid;
    gap: var(--sp-8);
    max-height: 40vh;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    border: 0;
}
</style>
