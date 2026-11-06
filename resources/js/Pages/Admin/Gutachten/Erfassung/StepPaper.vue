<script setup lang="ts">
/**
 * Step 1, Gutachten (the Gutachten rework §7): the PDF, the Art and the number are all a paper needs; date and issuer are optional;
 * everything else is folded under „Weitere Angaben“. Saved as it is typed: what does not pass stays in its field and says why.
 */

import { useForm } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import DateField from '../../../../Components/Admin/DateField.vue'
import DocumentSelect from '../../../../Components/Admin/DocumentSelect.vue'
import FilePick from '../../../../Components/Admin/FilePick.vue'
import { stampHeaders } from '../../../../composables/admin/useDirtyForm'
import { usePresignedUpload } from '../../../../composables/admin/usePresignedUpload'
import { decimal } from '../../../../format'
import { FILE_CHANGED } from '../../../../lib/file'
import type { RecordShape } from '../../../../types/admin/gutachten'
import DeratingTable from '../DeratingTable.vue'
import { deratingAbsent as absentLine, deratingShown as isDeratingShown } from '../derating'
import DocumentExtras from '../DocumentExtras.vue'
import RecordFields from '../RecordFields.vue'
import { useEntry, useGutachtenPage } from './entryStore'

const store = useEntry()
const { state, go } = store
const page = useGutachtenPage()
const doc = computed(() => page.props.document)

const shape = ref<RecordShape>({ ...doc.value.shape })
const pdf = ref<File | null>(null)
const upload = usePresignedUpload()

const form = useForm({
    upload_key: '',
    kind: doc.value.kind,
    kba_number: doc.value.kbaNumber,
    report_number: doc.value.reportNumber,
    approval_mark: doc.value.approvalMark,
    issuer: doc.value.issuer,
    issued_on: doc.value.issuedOn,
    page_count: doc.value.pageCount ?? ('' as string | number),
    supersedes_id: doc.value.supersedesId,
})

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

const errors = computed(() => form.errors as Record<string, string | undefined>)
const uploading = computed(() => upload.state.value === 'uploading' || upload.state.value === 'retrying')
const numberMissing = computed(() => String(form[numberField.value.key] ?? '').trim() === '')

async function save(): Promise<void> {
    if (!state.editable || uploading.value || numberMissing.value) {
        return
    }

    form.upload_key = ''

    if (pdf.value !== null) {
        const key = await upload.upload(pdf.value)

        if (key === null) {
            form.setError('upload_key', upload.error.value ?? 'Die Datei konnte nicht hochgeladen werden.')

            if (upload.error.value === FILE_CHANGED) {
                pdf.value = null
            }

            return
        }

        form.upload_key = key
    }

    state.save = 'saving'
    form.transform((data) => ({ ...data, ...shape.value, autosave: true })).put(`/admin/gutachten/${state.documentId}`, {
        preserveScroll: true,
        preserveState: true,
        headers: stampHeaders(page.props.stamps?.document),
        onSuccess: () => {
            state.save = 'saved'
            pdf.value = null
        },
        onError: () => {
            state.save = 'failed'
        },
    })
}

let timer: ReturnType<typeof setTimeout> | undefined

function later(): void {
    clearTimeout(timer)
    timer = setTimeout(() => void save(), 700)
}

watch(() => [form.kind, form.kba_number, form.report_number, form.approval_mark, form.issuer, form.issued_on, form.page_count, form.supersedes_id], later)
watch(shape, later, { deep: true })
watch(pdf, (file) => {
    if (file !== null) {
        void save()
    }
})

const deratingRequired = computed(() => doc.value.shape.tyre_index_source === 'table')
const deratingShown = computed(() => isDeratingShown(doc.value.shape.tyre_index_source, page.props.derating.rows.length))
const deratingAbsent = computed(() => absentLine(doc.value.shape.tyre_index_source, state.editable))

async function next(): Promise<void> {
    clearTimeout(timer)
    await save()
    go(1)
}
</script>

<template>
    <section class="ef-step" aria-labelledby="ef-paper-h">
        <h2 id="ef-paper-h" class="adm-section__title" tabindex="-1">Gutachten</h2>
        <p class="adm-note">Nur das PDF, die Art und die Nummer sind nötig. Alles andere ist freiwillig.</p>

        <div class="ef-paper">
            <p v-if="errors._stamp" class="adm-alert" role="alert">{{ errors._stamp }}</p>

            <div class="form-field">
                <span id="ef-pdf-label" class="form-field__label">PDF des Gutachtens</span>
                <p v-if="doc.hasPdf" class="ef-file">
                    <Icon name="documents" :size="20" />
                    <a v-if="doc.pdfUrl" :href="doc.pdfUrl" target="_blank" rel="noopener">PDF öffnen</a>
                    <span v-if="doc.pageCount" class="ef-file__meta">{{ doc.pageCount === 1 ? '1 Seite' : `${doc.pageCount} Seiten` }}</span>
                </p>
                <FilePick id="ef-pdf" v-model="pdf" accept="application/pdf,.pdf" :label="doc.hasPdf ? 'PDF ersetzen' : 'PDF auswählen'" :invalid="!!errors.upload_key" describedby="ef-pdf-label ef-pdf-err" :disabled="uploading || !state.editable" />
                <p v-if="uploading" class="form-field__help" role="status">
                    <template v-if="upload.state.value === 'uploading'">Wird hochgeladen … {{ decimal(Math.round(upload.progress.value * 100), 0) }} %</template>
                    <template v-else>Die Verbindung hakt – neuer Versuch ({{ upload.attempt.value }} von 3) …</template>
                </p>
                <p id="ef-pdf-err" class="form-field__error">{{ errors.upload_key }}</p>
                <span v-for="twin in doc.samePdf ?? []" :key="twin.href" class="form-field__help">
                    Dieselbe Datei liegt auch bei <a :href="twin.href">{{ twin.label }}</a> ({{ twin.status }}).
                </span>
            </div>

            <fieldset class="form-field ef-fieldset">
                <legend class="form-field__label">Art</legend>
                <div class="ef-seg" role="radiogroup" aria-label="Art">
                    <label v-for="kind in page.props.kinds" :key="kind.value" class="adm-chip">
                        <input v-model="form.kind" class="visually-hidden" type="radio" name="ef-art" :value="kind.value" :disabled="!state.editable">
                        {{ kind.label }}
                    </label>
                </div>
            </fieldset>

            <div class="ef-pair">
                <div class="form-field">
                    <label class="form-field__label" for="ef-number">{{ numberField.label }}</label>
                    <input
                        id="ef-number"
                        v-model="form[numberField.key]"
                        class="input"
                        type="text"
                        maxlength="64"
                        spellcheck="false"
                        :disabled="!state.editable"
                        :aria-invalid="errors[numberField.key] || numberMissing ? 'true' : undefined"
                        aria-describedby="ef-number-help ef-number-err"
                    >
                    <p id="ef-number-help" class="form-field__help">{{ numberField.help }}</p>
                    <p id="ef-number-err" class="form-field__error">{{ errors[numberField.key] ?? (numberMissing ? 'Die Nummer fehlt. Gib sie so ein, wie sie im Gutachten steht.' : '') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="ef-date">Ausgestellt am <span class="ef-optional">(optional)</span></label>
                    <DateField id="ef-date" v-model="form.issued_on" :invalid="Boolean(errors.issued_on)" describedby="ef-date-err" />
                    <p id="ef-date-err" class="form-field__error">{{ errors.issued_on }}</p>
                </div>
            </div>

            <div class="form-field">
                <label class="form-field__label" for="ef-issuer">Aussteller <span class="ef-optional">(optional)</span></label>
                <input id="ef-issuer" v-model="form.issuer" class="input ef-wide" type="text" maxlength="120" placeholder="z. B. TÜV Austria" :disabled="!state.editable">
                <p class="form-field__error">{{ errors.issuer }}</p>
            </div>

            <details class="ef-more">
                <summary class="ef-more__summary"><Icon class="ef-more__marker" name="chevron-right" :size="16" /> <span>Weitere Angaben <span class="ef-optional">(optional)</span></span></summary>
                <div class="ef-more__body">
                    <RecordFields v-model:shape="shape" :kind="form.kind" :errors="errors" :supplementable="page.props.supplementable.filter((d) => d.value !== doc.id)" id-prefix="ef" />
                    <div class="ef-pair">
                        <div class="form-field">
                            <label class="form-field__label" for="ef-pages">Seiten</label>
                            <input id="ef-pages" v-model="form.page_count" class="input" type="text" inputmode="numeric" :aria-invalid="errors.page_count ? 'true' : undefined" aria-describedby="ef-pages-err" :disabled="!state.editable">
                            <p id="ef-pages-err" class="form-field__error">{{ errors.page_count }}</p>
                        </div>
                        <div v-if="page.props.replaceable.length" class="form-field">
                            <label class="form-field__label" for="ef-supersedes">Ersetzt eine frühere Fassung</label>
                            <DocumentSelect id="ef-supersedes" v-model="form.supersedes_id" :options="page.props.replaceable" none-label="Nein, ein neues Dokument" :invalid="Boolean(errors.supersedes_id)" describedby="ef-supersedes-err" />
                            <p id="ef-supersedes-err" class="form-field__error">{{ errors.supersedes_id }}</p>
                        </div>
                    </div>

                    <section class="ef-more__section" aria-labelledby="ef-derating-h">
                        <h3 id="ef-derating-h" class="ef-more__title">Tragfähigkeit bei hoher Geschwindigkeit</h3>
                        <DeratingTable v-if="deratingShown" :document-id="doc.id" :stamp="page.props.stamps.derating" :derating="page.props.derating" :editable="state.editable" :page-count="doc.pageCount" :required="deratingRequired" />
                        <p v-else class="adm-note">{{ deratingAbsent }}</p>
                    </section>

                    <section class="ef-more__section" aria-labelledby="ef-extras-h">
                        <h3 id="ef-extras-h" class="ef-more__title">Befestigung und Hinweise</h3>
                        <DocumentExtras :document-id="doc.id" :fasteners="page.props.fasteners" :notices="page.props.notices" :reworks="page.props.reworks" :conditions="page.props.conditions" :editable="state.editable" :page-count="doc.pageCount" />
                    </section>
                </div>
            </details>
        </div>

        <div class="ef-actions">
            <button class="btn btn--primary" type="button" :disabled="numberMissing || uploading" @click="next">
                Weiter: Felge
                <Icon name="arrow-right" :size="20" />
            </button>
        </div>
    </section>
</template>

<style scoped>
.ef-paper {
    display: grid;
    gap: var(--sp-20);
    max-width: var(--adm-form-max);
    margin-top: var(--sp-20);
}

.ef-file {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
    padding: var(--sp-12) var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
}

.ef-file__name {
    font-weight: 600;
}

.ef-file__meta {
    flex: 1;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.ef-seg {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.ef-pair {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
    gap: var(--sp-16);
}

.ef-wide {
    width: 100%;
}

.ef-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
    gap: var(--sp-16);
}
</style>
