<script setup lang="ts">
/**
 * The PDFs of a Gutachten (D-494, the operator's brief of 19.11.2026, item C): the paper's own first, then its Nachträge,
 * Anlagen or older versions — each with the label the customer reads, an optional date and a place. On a draft and on the
 * released revision alike, for no verdict rests on them. A further PDF goes straight into storage (usePresignedUpload) and the
 * server checks it — a PDF by its first bytes, within the limit, scanned. Hidden, never deleted: an order may name it.
 */
import { router } from '@inertiajs/vue3'
import { ref } from 'vue'
import { usePresignedUpload } from '../../../composables/admin/usePresignedUpload'

export interface PdfEntry {
    id: number | null
    label: string
    datedOn: string | null
    dateLabel: string | null
    main: boolean
    hidden: boolean
    url: string | null
}

const props = defineProps<{
    documentId: number
    pdfs: PdfEntry[]
    /** `approvals` × edit on a draft or the released revision (ApprovalDocumentPolicy::manageFiles); without it, the list only. */
    can: boolean
    maxMb: number
}>()

const LABELS = ['Gutachten', 'Nachtrag', 'Anlage', 'Ältere Fassung']

const upload = usePresignedUpload()
const file = ref<File | null>(null)
const label = ref('Nachtrag')
const datedOn = ref('')
const error = ref('')
const busy = ref(false)
const editing = ref<number | 'main' | null>(null)
const editLabel = ref('')
const editDate = ref('')

const keyOf = (entry: PdfEntry): number | 'main' => (entry.main ? 'main' : (entry.id as number))

function pick(event: Event): void {
    file.value = (event.target as HTMLInputElement).files?.[0] ?? null
    error.value = ''
}

async function add(): Promise<void> {
    error.value = ''

    if (file.value === null) {
        error.value = 'Bitte wähl das PDF aus.'

        return
    }

    if (label.value.trim() === '') {
        error.value = 'Gib dem PDF eine Bezeichnung, die der Kunde liest – etwa „Nachtrag“ oder „Anlage 3“.'

        return
    }

    busy.value = true
    const key = await upload.upload(file.value)

    if (key === null) {
        error.value = upload.error.value ?? 'Die Datei konnte nicht hochgeladen werden.'
        busy.value = false

        return
    }

    router.post(`/admin/gutachten/${props.documentId}/pdfs`, { upload_key: key, label: label.value.trim(), dated_on: datedOn.value || null }, {
        preserveScroll: true,
        onSuccess: () => {
            file.value = null
            datedOn.value = ''
        },
        onError: (errors) => {
            error.value = Object.values(errors as Record<string, string>)[0] ?? 'Das hat nicht geklappt.'
        },
        onFinish: () => {
            busy.value = false
        },
    })
}

function edit(entry: PdfEntry): void {
    editing.value = keyOf(entry)
    editLabel.value = entry.label
    editDate.value = entry.datedOn ?? ''
}

function save(entry: PdfEntry): void {
    router.put(`/admin/gutachten/${props.documentId}/pdfs${entry.main && entry.id === null ? '' : `/${entry.id}`}`, { label: editLabel.value.trim(), dated_on: editDate.value || null }, {
        preserveScroll: true,
        onSuccess: () => {
            editing.value = null
        },
        onError: (errors) => {
            error.value = Object.values(errors as Record<string, string>)[0] ?? 'Das hat nicht geklappt.'
        },
    })
}

function toggle(entry: PdfEntry): void {
    router.post(`/admin/gutachten/${props.documentId}/pdfs/${entry.id}/sichtbar`, { visible: entry.hidden }, { preserveScroll: true })
}

function move(index: number, by: -1 | 1): void {
    const order = props.pdfs.map((entry) => entry.id)
    const to = index + by

    if (to < 0 || to >= order.length) {
        return
    }

    ;[order[index], order[to]] = [order[to] ?? null, order[index] ?? null]
    router.put(`/admin/gutachten/${props.documentId}/pdfs-reihenfolge`, { order }, { preserveScroll: true })
}
</script>

<template>
    <section class="adm-section dp" aria-labelledby="dp-h" data-document-pdfs>
        <div class="adm-section__head">
            <h2 id="dp-h" class="adm-section__title">PDFs im Shop</h2>
        </div>
        <p class="adm-note">
            Der Kunde sieht alle sichtbaren PDFs in dieser Reihenfolge, mit Bezeichnung und Datum. Das PDF, das bei uns für diesen Eintrag
            hinterlegt ist, gehört stets dazu. Ein ausgeblendetes PDF bleibt gespeichert, denn Bestellungen können darauf verweisen.
        </p>

        <ol class="dp__list">
            <li v-for="(entry, i) in pdfs" :key="entry.main ? 'main' : entry.id ?? i" class="dp__item" :class="{ 'dp__item--hidden': entry.hidden }">
                <div v-if="editing === keyOf(entry)" class="dp__edit">
                    <label class="form-field__label" :for="`dp-label-${i}`">Bezeichnung</label>
                    <input :id="`dp-label-${i}`" v-model="editLabel" class="input" type="text" maxlength="80" list="dp-labels">
                    <label class="form-field__label" :for="`dp-date-${i}`">Datum <span class="adm-hint">(wahlweise)</span></label>
                    <input :id="`dp-date-${i}`" v-model="editDate" class="input" type="date">
                    <div class="dp__actions">
                        <button class="btn btn--primary btn--sm" type="button" @click="save(entry)">Speichern</button>
                        <button class="btn btn--secondary btn--sm" type="button" @click="editing = null">Abbrechen</button>
                    </div>
                </div>
                <template v-else>
                    <span class="dp__name">
                        <a v-if="entry.url" class="link" :href="entry.url" target="_blank" rel="noopener">{{ entry.label }}</a>
                        <template v-else>{{ entry.label }}</template>
                        <span v-if="entry.dateLabel" class="dp__date"> · {{ entry.dateLabel }}</span>
                        <span v-if="entry.main" class="adm-tag adm-tag--neutral">PDF des Gutachtens</span>
                        <span v-if="entry.hidden" class="adm-tag adm-tag--neutral">Ausgeblendet</span>
                    </span>
                    <span v-if="can" class="dp__actions">
                        <button class="btn btn--secondary btn--sm" type="button" :disabled="i === 0" :aria-label="`${entry.label} nach oben`" @click="move(i, -1)">↑</button>
                        <button class="btn btn--secondary btn--sm" type="button" :disabled="i === pdfs.length - 1" :aria-label="`${entry.label} nach unten`" @click="move(i, 1)">↓</button>
                        <button class="btn btn--secondary btn--sm" type="button" @click="edit(entry)">Bearbeiten</button>
                        <button v-if="!entry.main" class="btn btn--secondary btn--sm" type="button" @click="toggle(entry)">{{ entry.hidden ? 'Einblenden' : 'Ausblenden' }}</button>
                    </span>
                </template>
            </li>
        </ol>

        <form v-if="can" class="dp__add" novalidate @submit.prevent="add">
            <div class="form-field">
                <label class="form-field__label" for="dp-file">Weiteres PDF</label>
                <input id="dp-file" class="input" type="file" accept="application/pdf,.pdf" aria-describedby="dp-file-help dp-err" @change="pick">
                <p id="dp-file-help" class="form-field__help">Nur PDF, bis {{ maxMb }} MB.</p>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="dp-new-label">Bezeichnung</label>
                <input id="dp-new-label" v-model="label" class="input" type="text" maxlength="80" list="dp-labels">
            </div>
            <div class="form-field">
                <label class="form-field__label" for="dp-new-date">Datum <span class="adm-hint">(wahlweise)</span></label>
                <input id="dp-new-date" v-model="datedOn" class="input" type="date">
            </div>
            <div>
                <button class="btn btn--primary" type="submit" :disabled="busy" :aria-busy="busy ? 'true' : undefined">{{ busy ? 'Wird hochgeladen …' : 'PDF hinzufügen' }}</button>
            </div>
            <datalist id="dp-labels">
                <option v-for="item in LABELS" :key="item" :value="item" />
            </datalist>
        </form>
        <p id="dp-err" class="form-field__error" role="alert">{{ error }}</p>
    </section>
</template>

<style scoped>
.dp__list {
    display: grid;
    gap: var(--sp-8);
    margin: var(--sp-12) 0 0;
    padding: 0;
    list-style: none;
}

.dp__item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8) var(--sp-16);
    padding: var(--sp-12) var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
}

.dp__item--hidden .dp__name {
    color: var(--c-ink-2);
}

.dp__name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
}

.dp__date {
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
}

.dp__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.dp__edit {
    display: grid;
    gap: var(--sp-4);
    width: 100%;
    max-width: 28rem;
}

.dp__add {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    align-items: end;
    gap: var(--sp-12) var(--sp-16);
    margin-top: var(--sp-16);
}

.dp .form-field__error:empty {
    display: none;
}
</style>
