<script setup lang="ts">
/**
 * The facts of a draft Gutachten, changed: kind, number, issuer, date, pages, the revision it
 * replaces — and, if the wrong file was uploaded, the PDF itself (usePresignedUpload, confirmed by the
 * server). A released Gutachten does not change (ApprovalDocumentPolicy); this opens only for drafts.
 */

import { useForm } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import DateField from '../../../Components/Admin/DateField.vue'
import FilePick from '../../../Components/Admin/FilePick.vue'
import { focusRefused } from '../../../composables/admin/focusRefused'
import Dialog from '../../../Components/Ui/Dialog.vue'
import { usePresignedUpload } from '../../../composables/admin/usePresignedUpload'
import { decimal } from '../../../format'
import { FILE_CHANGED } from '../../../lib/file'
import type { DocumentFacts } from '../../../types/admin/gutachten'

const props = defineProps<{
    document: DocumentFacts
    kinds: { value: string; label: string }[]
    replaceable: { value: number; label: string }[]
}>()

const open = defineModel<boolean>('open', { default: false })

function fromDocument() {
    return {
        upload_key: '',
        kind: props.document.kind,
        kba_number: props.document.kbaNumber,
        report_number: props.document.reportNumber,
        approval_mark: props.document.approvalMark,
        issuer: props.document.issuer,
        issued_on: props.document.issuedOn,
        page_count: props.document.pageCount ?? ('' as string | number),
        supersedes_id: props.document.supersedesId,
    }
}

const form = useForm(fromDocument())
const pdf = ref<File | null>(null)
const upload = usePresignedUpload()

watch(open, (value) => {
    if (value) {
        form.defaults(fromDocument())
        form.reset()
        form.clearErrors()
        pdf.value = null
    }
})

const numberField = computed(() => {
    switch (form.kind) {
        case 'ABE':
            return { key: 'kba_number' as const, label: 'KBA-Nummer' }
        case 'TEILEGUTACHTEN':
            return { key: 'report_number' as const, label: 'Gutachten-Nummer' }
        default:
            return { key: 'approval_mark' as const, label: 'Genehmigungszeichen' }
    }
})

const errors = computed(() => form.errors as Record<string, string | undefined>)
const busy = computed(() => form.processing || upload.state.value === 'uploading' || upload.state.value === 'retrying')

async function save(): Promise<void> {
    if (busy.value) {
        return
    }

    form.upload_key = ''

    if (pdf.value !== null) {
        const key = await upload.upload(pdf.value)

        if (key === null) {
            form.setError('upload_key', upload.error.value ?? 'Die Datei konnte nicht hochgeladen werden.')

            // Changed on disk since it was chosen: let go, so the field asks for it again (K2-29).
            if (upload.error.value === FILE_CHANGED) {
                pdf.value = null
            }

            focusRefused('.fd')

            return
        }

        form.upload_key = key
    }

    form.put(`/admin/gutachten/${props.document.id}`, {
        preserveScroll: true,
        onSuccess: () => (open.value = false),
        onError: () => focusRefused('.fd'),
    })
}
</script>

<template>
    <Dialog v-model:open="open" title="Angaben ändern" :description="document.label" content-class="adm-dialog" initial-focus="#fd-kind">
        <form id="fd-form" class="fd" novalidate @submit.prevent="save">
            <div class="form-field">
                <label class="form-field__label" for="fd-kind">Art</label>
                <select id="fd-kind" v-model="form.kind" class="input">
                    <option v-for="kind in kinds" :key="kind.value" :value="kind.value">{{ kind.label }}</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="fd-number">{{ numberField.label }}</label>
                <input id="fd-number" v-model="form[numberField.key]" class="input" type="text" maxlength="64" :aria-invalid="errors[numberField.key] ? 'true' : undefined" aria-describedby="fd-number-err">
                <p id="fd-number-err" class="form-field__error">{{ errors[numberField.key] }}</p>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="fd-issuer">Aussteller</label>
                <input id="fd-issuer" v-model="form.issuer" class="input" type="text" maxlength="120">
            </div>
            <div class="fd-pair">
                <div class="form-field">
                    <label class="form-field__label" for="fd-date">Ausgestellt am</label>
                    <DateField id="fd-date" v-model="form.issued_on" :invalid="Boolean(errors.issued_on)" describedby="fd-date-err" />
                    <p id="fd-date-err" class="form-field__error">{{ errors.issued_on }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fd-pages">Seiten</label>
                    <input id="fd-pages" v-model="form.page_count" class="input" type="number" min="1" inputmode="numeric" :aria-invalid="errors.page_count ? 'true' : undefined" aria-describedby="fd-pages-err">
                    <p id="fd-pages-err" class="form-field__error">{{ errors.page_count }}</p>
                </div>
            </div>
            <div v-if="replaceable.length" class="form-field">
                <label class="form-field__label" for="fd-supersedes">Ersetzt eine frühere Fassung</label>
                <select id="fd-supersedes" v-model="form.supersedes_id" class="input" aria-describedby="fd-supersedes-err">
                    <option :value="null">Nein, ein neues Dokument</option>
                    <option v-for="doc in replaceable" :key="doc.value" :value="doc.value">{{ doc.label }}</option>
                </select>
                <p id="fd-supersedes-err" class="form-field__error">{{ errors.supersedes_id }}</p>
            </div>
            <div class="form-field">
                <span id="fd-pdf-label" class="form-field__label">Anderes PDF (optional)</span>
                <FilePick id="fd-pdf" v-model="pdf" accept="application/pdf,.pdf" label="PDF ersetzen" :invalid="!!errors.upload_key" describedby="fd-pdf-label fd-pdf-err" :disabled="busy" />
                <p class="form-field__help" role="status">
                    <template v-if="upload.state.value === 'uploading'">Wird hochgeladen … {{ decimal(Math.round(upload.progress.value * 100), 0) }} %</template>
                    <template v-else-if="upload.state.value === 'retrying'">Die Verbindung hakt – neuer Versuch ({{ upload.attempt.value }} von 3) …</template>
                </p>
                <p id="fd-pdf-err" class="form-field__error">{{ errors.upload_key }}</p>
            </div>
        </form>
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Abbrechen</button>
            <button class="btn btn--primary" type="submit" form="fd-form" :disabled="busy" :aria-busy="busy ? 'true' : undefined">Speichern</button>
        </template>
    </Dialog>
</template>

<style scoped>
.fd {
    display: grid;
    gap: var(--sp-16);
}

.fd .form-field__error:empty {
    display: none;
}

.fd-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-16);
}

@media (max-width: 767px) {
    .fd-pair {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
