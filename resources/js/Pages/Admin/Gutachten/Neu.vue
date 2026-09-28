<script setup lang="ts">
/**
 * Gutachten › Neues Gutachten — the first step of the chain: the PDF and the facts printed on its
 * first page (the review release §4.3). The PDF goes from the browser straight into the bucket
 * (usePresignedUpload); the server confirms it — a PDF, not too large, scanned — before the document's
 * row exists. The document starts as a draft; the Verwendungsbereich follows on its own page.
 *
 * Each kind is named by its own number, so the form asks for the one the chosen kind carries.
 */

import { useForm } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import DateField from '../../../Components/Admin/DateField.vue'
import FilePick from '../../../Components/Admin/FilePick.vue'
import { focusRefused } from '../../../composables/admin/focusRefused'
import { usePresignedUpload } from '../../../composables/admin/usePresignedUpload'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'
import { FILE_CHANGED } from '../../../lib/file'
import type { RecordShape } from '../../../types/admin/gutachten'
import RecordFields from './RecordFields.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<{
    kinds: { value: string; label: string }[]
    replaceable: { value: number; label: string }[]
    /** The documents a Nachtrag may supplement. */
    supplementable: { value: number; label: string }[]
    maxMb: number
}>()

/* A Nachtrag's base and page 1's header, sent with the facts (the corrections memo §4). */
const shape = ref<RecordShape>({
    supplement_to_id: null,
    supplement_to_number: '',
    annex: '',
    test_report_number: '',
    copy_number: '',
    designation_number: '',
    test_site: '',
    test_date: '',
    revision_date: '',
    valid_from_production: '',
})

const pdf = ref<File | null>(null)
const upload = usePresignedUpload()

const form = useForm({
    upload_key: '',
    kind: props.kinds[0]?.value ?? 'ABE',
    kba_number: '',
    report_number: '',
    approval_mark: '',
    issuer: '',
    issued_on: '',
    page_count: '' as string | number,
    supersedes_id: null as number | null,
})

/** The number field the chosen kind is known by. */
const numberField = computed(() => {
    switch (form.kind) {
        case 'ABE':
            return { key: 'kba_number' as const, label: 'KBA-Nummer', help: 'Die Nummer der Allgemeinen Betriebserlaubnis, zum Beispiel 53810.' }
        case 'NACHTRAG':
            return { key: 'report_number' as const, label: 'Nummer des Nachtrags', help: 'So, wie sie auf der ersten Seite steht, zum Beispiel 366-0350-21-WIRD/N1.' }
        case 'TEILEGUTACHTEN':
            return { key: 'report_number' as const, label: 'Gutachten-Nummer', help: 'So, wie sie auf der ersten Seite steht.' }
        default:
            return { key: 'approval_mark' as const, label: 'Genehmigungszeichen', help: 'Zum Beispiel E1 124R-001234.' }
    }
})

const busy = computed(() => form.processing || upload.state.value === 'uploading' || upload.state.value === 'retrying')

const progressText = computed(() => {
    if (upload.state.value === 'uploading') {
        return `Wird hochgeladen … ${decimal(Math.round(upload.progress.value * 100), 0)} %`
    }

    if (upload.state.value === 'retrying') {
        return `Die Verbindung hakt – neuer Versuch (${upload.attempt.value} von 3) …`
    }

    return ''
})

const errors = computed(() => form.errors as Record<string, string | undefined>)

async function submit(): Promise<void> {
    if (busy.value) {
        return
    }

    form.clearErrors()

    if (pdf.value === null) {
        form.setError('upload_key', 'Bitte wähl das PDF des Gutachtens aus.')
        focusRefused('.gn-form')

        return
    }

    // An upload already done for this file is not repeated after a refused field.
    if (form.upload_key === '') {
        const key = await upload.upload(pdf.value)

        if (key === null) {
            form.setError('upload_key', upload.error.value ?? 'Die Datei konnte nicht hochgeladen werden.')

            // Changed on disk since it was chosen: let go, so the field asks for it again (K2-29).
            if (upload.error.value === FILE_CHANGED) {
                pdf.value = null
            }

            focusRefused('.gn-form')

            return
        }

        form.upload_key = key
    }

    form.transform((data) => ({ ...data, ...shape.value })).post('/admin/gutachten', {
        preserveScroll: true,
        onError: (bag) => {
            // A refused file must be chosen and sent again; the other fields keep what was typed.
            if (bag.upload_key) {
                form.upload_key = ''
            }

            focusRefused('.gn-form')
        },
    })
}

function chose(file: File | null): void {
    pdf.value = file
    form.upload_key = ''
}
</script>

<template>
    <AdminPage title="Neues Gutachten" context="Entwurf, noch nicht freigegeben">
        <form class="adm-form gn-form" novalidate @submit.prevent="submit">
            <section class="adm-form__group" aria-labelledby="gn-h-pdf">
                <h2 id="gn-h-pdf" class="adm-form__heading">Das Dokument</h2>
                <div class="form-field">
                    <span id="gn-pdf-label" class="form-field__label">PDF des Gutachtens (höchstens {{ maxMb }} MB)</span>
                    <FilePick
                        id="gn-pdf"
                        :model-value="pdf"
                        accept="application/pdf,.pdf"
                        label="PDF auswählen"
                        :invalid="!!errors.upload_key"
                        describedby="gn-pdf-label gn-pdf-err"
                        :disabled="busy"
                        @update:model-value="chose"
                    />
                    <p v-if="progressText" class="form-field__help" role="status">{{ progressText }}</p>
                    <p id="gn-pdf-err" class="form-field__error">{{ errors.upload_key }}</p>
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="gn-kind">Art</label>
                    <select id="gn-kind" v-model="form.kind" class="input gn-short" :disabled="busy">
                        <option v-for="kind in kinds" :key="kind.value" :value="kind.value">{{ kind.label }}</option>
                    </select>
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="gn-number">{{ numberField.label }}</label>
                    <input
                        id="gn-number"
                        v-model="form[numberField.key]"
                        class="input gn-short"
                        type="text"
                        maxlength="64"
                        spellcheck="false"
                        :aria-invalid="errors[numberField.key] ? 'true' : undefined"
                        aria-describedby="gn-number-help gn-number-err"
                    >
                    <p id="gn-number-help" class="form-field__help">{{ numberField.help }}</p>
                    <p id="gn-number-err" class="form-field__error">{{ errors[numberField.key] }}</p>
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="gn-issuer">Aussteller <span class="gn-optional">(optional)</span></label>
                    <input id="gn-issuer" v-model="form.issuer" class="input" type="text" maxlength="120" placeholder="z. B. Kraftfahrt-Bundesamt" aria-describedby="gn-issuer-err">
                    <p id="gn-issuer-err" class="form-field__error">{{ errors.issuer }}</p>
                </div>

                <RecordFields v-model:shape="shape" :kind="form.kind" :errors="errors" :supplementable="supplementable" id-prefix="gn" />

                <div class="gn-pair">
                    <div class="form-field">
                        <label class="form-field__label" for="gn-date">Ausgestellt am <span class="gn-optional">(optional)</span></label>
                        <DateField id="gn-date" v-model="form.issued_on" :invalid="Boolean(errors.issued_on)" describedby="gn-date-err" />
                        <p id="gn-date-err" class="form-field__error">{{ errors.issued_on }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="gn-pages">Seiten <span class="gn-optional">(optional)</span></label>
                        <input id="gn-pages" v-model="form.page_count" class="input" type="number" min="1" max="2000" inputmode="numeric" :aria-invalid="errors.page_count ? 'true' : undefined" aria-describedby="gn-pages-help gn-pages-err">
                        <p id="gn-pages-help" class="form-field__help">Damit jede Zeile auf eine echte Seite zeigt.</p>
                        <p id="gn-pages-err" class="form-field__error">{{ errors.page_count }}</p>
                    </div>
                </div>

                <div v-if="replaceable.length" class="form-field">
                    <label class="form-field__label" for="gn-supersedes">Ersetzt eine frühere Fassung <span class="gn-optional">(optional)</span></label>
                    <select id="gn-supersedes" v-model="form.supersedes_id" class="input" aria-describedby="gn-supersedes-help gn-supersedes-err">
                        <option :value="null">Nein, ein neues Dokument</option>
                        <option v-for="doc in replaceable" :key="doc.value" :value="doc.value">{{ doc.label }}</option>
                    </select>
                    <p id="gn-supersedes-help" class="form-field__help">Die frühere Fassung gilt bis zur Freigabe dieser weiter; Bestellungen darauf bleiben erklärbar.</p>
                    <p id="gn-supersedes-err" class="form-field__error">{{ errors.supersedes_id }}</p>
                </div>
            </section>

            <div class="gn-actions">
                <button class="btn btn--primary" type="submit" :disabled="busy" :aria-busy="busy ? 'true' : undefined">Gutachten anlegen</button>
            </div>
        </form>
    </AdminPage>
</template>

<style scoped>
.gn-form .form-field__error:empty {
    display: none;
}

.gn-short {
    max-width: 32ch;
}

.gn-optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.gn-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-16);
}

.gn-actions {
    display: flex;
    gap: var(--sp-8);
}

@media (max-width: 767px) {
    /* One column, one edge: every field as wide as the form. */
    .gn-short {
        max-width: none;
    }

    .gn-pair {
        grid-template-columns: minmax(0, 1fr);
    }

    .gn-actions .btn {
        width: 100%;
        min-height: var(--adm-control-h-lg);
    }
}
</style>
