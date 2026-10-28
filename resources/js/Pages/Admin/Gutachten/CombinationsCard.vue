<script setup lang="ts">
/**
 * The document's own „Bereifungskombinationen“ (D-256; the client's item 8) — typed as the PDF prints them: each with
 * its number, the size on the front axle and the size on the rear (`225/40 R18`). Once there are any, the shop offers
 * no tyres on this document but these: a mixed set only as a listed pair, four of a kind only where a combination
 * names the same size on both axles.
 *
 * Saved whole, into its own error bag (`kombinationen`).
 */

import { useForm, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import { useFocusAfter } from '../../../composables/admin/useFocusAfter'
import { stampHeaders } from '../../../composables/admin/useDirtyForm'
import type { CombinationsView } from '../../../types/admin/gutachten'

const props = defineProps<{
    documentId: number
    combinations: CombinationsView
    editable: boolean
    pageCount: number | null
    /** The list as this card was opened on (EditStamp): a save against an older one is refused. */
    stamp?: string
}>()

const BAG = 'kombinationen'
const focus = useFocusAfter()
const page = usePage()

interface Entry {
    number: number | ''
    front: string
    rear: string
}

const form = useForm({
    source_page: (props.combinations.sourcePage ?? '') as number | '',
    combinations: props.combinations.entries.map((entry): Entry => ({ number: entry.number, front: entry.front, rear: entry.rear })),
})

const editing = ref(false)
const empty = computed(() => props.combinations.entries.length === 0)
const errors = computed(() => ((page.props.errors ?? {}) as Record<string, Record<string, string> | undefined>)[BAG] ?? {})

function nextNumber(): number {
    return form.combinations.reduce((highest, entry) => Math.max(highest, typeof entry.number === 'number' ? entry.number : 0), 0) + 1
}

function start(): void {
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

function cancel(): void {
    form.reset()
    form.clearErrors()
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
</script>

<template>
    <div class="kb">
        <p class="adm-note">
            Nennt das Gutachten Bereifungskombinationen, trag sie hier ein – mit ihrer Nummer, so wie es sie druckt. Dann bietet der Shop zu
            diesem Gutachten nur diese an: vier gleiche Reifen nur, wo eine Kombination vorne und hinten dieselbe Größe nennt. Die Liste
            gilt für alle Fahrzeuge dieses Gutachtens. Druckt jede Anlage ihre eigenen Kombinationen, leg jede Anlage als eigenes Gutachten
            an, mit ihrem Namen im Feld „Anlage“.
        </p>

        <template v-if="!editing">
            <p v-if="empty" class="adm-note">Zu diesem Gutachten sind keine Bereifungskombinationen hinterlegt.</p>

            <div v-else class="kb-scroll">
                <table class="adm-table kb-table">
                    <caption class="visually-hidden">Bereifungskombinationen</caption>
                    <thead>
                        <tr>
                            <th scope="col" class="num">Nr.</th>
                            <th scope="col">Vorderachse</th>
                            <th scope="col">Hinterachse</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- By position: one number may print several pairs (`Nr. 8: 235/45 R19 – 255/40 R19, 265/40 R19`). -->
                        <tr v-for="(entry, i) in combinations.entries" :key="i">
                            <th scope="row" class="num kb-nr">{{ entry.number }}</th>
                            <!-- The labels the phone's card writes before each size (Human QA 28.10.2026): without them the two sizes stood
                                 one under the other, and which was front and which rear was left to guess. -->
                            <td class="num" data-label="Vorderachse">{{ entry.front }}</td>
                            <td class="num" data-label="Hinterachse">{{ entry.rear }}</td>
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
            <p id="kb-form-h" class="form-field__label">Bereifungskombinationen aus dem Gutachten</p>
            <p class="form-field__help">Je Kombination die Nummer und die beiden Größen, so wie das Gutachten sie druckt, etwa 225/40 R18. Lastindex und Geschwindigkeitssymbol lässt du weg.</p>

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
                        <tr v-for="(entry, i) in form.combinations" :key="i">
                            <td>
                                <label class="visually-hidden" :for="`kb-number-${i}`">Nummer der Kombination in Zeile {{ i + 1 }}</label>
                                <input
                                    :id="`kb-number-${i}`"
                                    v-model.number="entry.number"
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
                                <label class="visually-hidden" :for="`kb-front-${i}`">Kombination {{ entry.number || i + 1 }}, Vorderachse</label>
                                <input
                                    :id="`kb-front-${i}`"
                                    v-model="entry.front"
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
                                <label class="visually-hidden" :for="`kb-rear-${i}`">Kombination {{ entry.number || i + 1 }}, Hinterachse</label>
                                <input
                                    :id="`kb-rear-${i}`"
                                    v-model="entry.rear"
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
                                <button class="btn btn--ghost btn--icon" type="button" :aria-label="`Kombination ${entry.number || i + 1} entfernen`" @click="removeRow(i)">
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
</style>
