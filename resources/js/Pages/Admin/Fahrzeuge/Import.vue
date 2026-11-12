<script setup lang="ts">
/**
 * Fahrzeuge › Import (his admin item 2, D-297) — a vehicle dataset into the shop: the file and where it comes from, its
 * columns, the Probelauf, the import (VehicleImporter). This page is the first step and the record of every run; each
 * run has its own page (ImportRun.vue).
 *
 * Nothing reaches the cars from here: the upload makes a Probelauf, which only reads. A file of any size (D-462): it
 * goes to the server in parts (lib/partUpload), with a bar for how much is there, and a connection that drops is taken
 * up again where it stopped.
 */

import { Link, router, useForm } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminProgress from '../../../Components/Admin/AdminProgress.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import FilePick from '../../../Components/Admin/FilePick.vue'
import { useFocusAfter } from '../../../composables/admin/useFocusAfter'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal, withUnit } from '../../../format'
import { FILE_CHANGED, stillReadable } from '../../../lib/file'
import { continueUpload, type PartUploadOptions, UploadForbidden, UploadRefused, UploadStalled, uploadInParts } from '../../../lib/partUpload'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface Run {
    id: number
    file: string
    source: string
    format: string
    status: 'uploading' | 'reading' | 'checking' | 'previewed' | 'applying' | 'applied' | 'failed'
    statusLabel: string
    summary: Partial<Record<'create' | 'update' | 'unchanged' | 'merge' | 'kept' | 'refused' | 'unread', number>>
    by: string | null
    at: string | null
    href: string
}

const props = defineProps<{
    sources: { value: string; label: string }[]
    fields: { key: string; label: string; required: boolean }[]
    imports: Run[]
    total: number
    can: { preview: boolean }
}>()

const upload = useForm<{ file: File | null; quelle: string }>({ file: null, quelle: '' })
const focus = useFocusAfter()

/* The upload as it goes: how much of the file is on the server, and — when the connection dropped — where to go on. */
const sending = ref(false)
const sent = ref(0)
const size = ref(0)
const stalled = ref<UploadStalled | null>(null)
const failure = ref('')

const MB = 1024 * 1024
const percent = computed(() => (size.value > 0 ? Math.floor((sent.value / size.value) * 100) : 0))
const sentText = computed(() => `${withUnit(decimal(sent.value / MB, 1), 'MB')} von ${withUnit(decimal(size.value / MB, 1), 'MB')} hochgeladen`)

watch(
    () => upload.file,
    (chosen) => {
        if (chosen !== null) {
            upload.clearErrors('file')
            stalled.value = null
            failure.value = ''
        }
    }
)

function options(file: File): PartUploadOptions {
    return {
        file,
        start: { url: '/admin/fahrzeuge/import/hochladen', body: { quelle: upload.quelle }, name: file.name },
        partUrl: (id) => `/admin/fahrzeuge/import/${id}/teil`,
        finishUrl: (id) => `/admin/fahrzeuge/import/${id}/fertig`,
        onProgress: (held, total) => {
            sent.value = held
            size.value = total
        },
    }
}

async function send(file: File, from: UploadStalled | null): Promise<void> {
    sending.value = true
    stalled.value = null
    failure.value = ''
    sent.value = from?.held ?? 0
    size.value = file.size

    try {
        const done = from !== null && from.id > 0 ? await continueUpload(options(file), from) : await uploadInParts(options(file))

        router.visit(done.href)
    } catch (error) {
        if (error instanceof UploadRefused) {
            for (const [field, message] of Object.entries(error.errors)) {
                upload.setError(field === 'quelle' ? 'quelle' : 'file', message)
            }

            if (!error.errors.quelle) {
                upload.file = null
            }

            focus.request(error.errors.quelle && !error.errors.file && !error.errors.name && !error.errors.size ? 'fi-source' : 'fi-file-button')
        } else if (error instanceof UploadStalled) {
            stalled.value = error
            focus.request('fi-resume')
        } else {
            failure.value = error instanceof UploadForbidden ? error.message : 'Die Datei ist nicht angekommen. Lad sie bitte noch einmal hoch.'
            focus.request('fi-file-button')
        }
    } finally {
        sending.value = false
    }
}

async function submit(): Promise<void> {
    if (sending.value) {
        return
    }

    if (upload.file === null) {
        upload.setError('file', 'Bitte wähl eine Datei aus: CSV oder Excel (.xlsx).')
        focus.request('fi-file-button')

        return
    }

    if (!(await stillReadable(upload.file))) {
        upload.file = null
        upload.setError('file', FILE_CHANGED)
        focus.request('fi-file-button')

        return
    }

    upload.clearErrors()
    await send(upload.file, null)
}

/* Go on where the connection dropped: the server says how much it holds, and only the rest is sent. */
async function resume(): Promise<void> {
    if (upload.file === null || stalled.value === null) {
        return
    }

    await send(upload.file, stalled.value)
}

function counts(run: Run): string {
    // A run the server is still reading or checking has no counts yet; one that stopped has none to show.
    if (['uploading', 'reading', 'checking', 'failed'].includes(run.status)) {
        return '–'
    }

    const s = run.summary
    const parts = [
        s.create ? `${decimal(s.create, 0)} neu` : '',
        s.update ? `${decimal(s.update, 0)} geändert` : '',
        s.merge ? `${decimal(s.merge, 0)} ergänzt` : '',
        s.refused ? `${decimal(s.refused, 0)} abgelehnt` : '',
    ].filter(Boolean)

    // An empty summary is a run whose columns are not all mapped; a counted one with nothing to bring in says so.
    if (parts.length > 0) {
        return parts.join(' · ')
    }

    return Object.keys(s).length === 0 ? 'Zuordnung unvollständig' : 'Nichts zu importieren'
}

const required = props.fields.filter((field) => field.required)
const optional = props.fields.filter((field) => !field.required)
</script>

<template>
    <AdminPage title="Fahrzeug-Import" :context="total === 1 ? '1 Lauf' : `${decimal(total, 0)} Läufe`">
        <section v-if="can.preview" class="adm-section" aria-labelledby="fi-h-file">
            <div class="adm-section__head">
                <h2 id="fi-h-file" class="adm-section__title">Datei prüfen</h2>
            </div>
            <p class="adm-note">
                Eine Zeile ist ein Fahrzeug. Der Probelauf liest die Datei und zeigt, was sich ändern würde – an den Fahrzeugen ändert sich dabei
                nichts. Zum Anfangen gibt es eine <a href="/admin/fahrzeuge/import/beispiel.csv" download>Beispieldatei</a> mit allen Spalten.
            </p>

            <dl class="fi-fields">
                <div class="fi-fields__row">
                    <dt>Pflicht</dt>
                    <dd>{{ required.map((f) => f.label).join(', ') }}</dd>
                </div>
                <div class="fi-fields__row">
                    <dt>Optional</dt>
                    <dd>{{ optional.map((f) => f.label).join(', ') }}</dd>
                </div>
            </dl>
            <p class="adm-note fi-rules">
                Ein Fahrzeug erkennt der Import an HSN, TSN und Variante. Fahrzeuge, die von Hand oder aus einem bei uns hinterlegten Gutachten
                angelegt sind, überschreibt er nie – er füllt dort höchstens leere Felder. Einen Lochkreis braucht der Import nicht.
            </p>

            <p class="visually-hidden" aria-live="assertive">{{ upload.errors.file ?? upload.errors.quelle ?? failure }}</p>

            <form class="fi-form" @submit.prevent="submit">
                <div class="form-field">
                    <span id="fi-file-label" class="form-field__label">Datei (CSV oder Excel)</span>
                    <FilePick
                        id="fi-file"
                        v-model="upload.file"
                        accept=".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        :invalid="!!upload.errors.file"
                        :disabled="sending"
                        describedby="fi-file-label fi-file-help fi-file-err"
                        @refused="(name: string) => upload.setError('file', `„${name}“ nimmt dieses Feld nicht – nur CSV oder Excel (.xlsx).`)"
                    />
                    <p id="fi-file-help" class="form-field__help">Auch große Dateien sind möglich – sie werden in Teilen hochgeladen und danach auf dem Server geprüft.</p>
                    <p id="fi-file-err" class="form-field__error">{{ upload.errors.file ?? failure }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fi-source">Woher die Daten kommen</label>
                    <select id="fi-source" v-model="upload.quelle" class="input fi-source" :disabled="sending" :aria-invalid="upload.errors.quelle ? 'true' : undefined" aria-describedby="fi-source-help fi-source-err">
                        <option value="" disabled>Quelle wählen</option>
                        <option v-for="source in sources" :key="source.value" :value="source.value">{{ source.label }}</option>
                    </select>
                    <p id="fi-source-help" class="form-field__help">Jedes neue Fahrzeug trägt diese Quelle. Jede Datei beginnt mit der Spaltenzuordnung des letzten Imports derselben Quelle.</p>
                    <p id="fi-source-err" class="form-field__error">{{ upload.errors.quelle }}</p>
                </div>

                <!-- How much of the file is on the server: a bar, and the figures beside it. -->
                <div v-if="sending || stalled" class="fi-progress">
                    <AdminProgress id="fi-progress" :percent="percent" :text="sentText" />
                    <p v-if="stalled" class="adm-alert fi-progress__stalled" role="alert">
                        Die Verbindung zum Server ist abgerissen.
                        <template v-if="stalled.id > 0">Was schon angekommen ist, bleibt erhalten. „Weiter hochladen“ schickt nur den Rest.</template>
                        <template v-else>Versuch es bitte noch einmal.</template>
                    </p>
                </div>

                <div class="fi-actions">
                    <button v-if="stalled && stalled.id > 0" id="fi-resume" class="btn btn--primary" type="button" @click="resume">Weiter hochladen</button>
                    <button v-else class="btn btn--primary" type="submit" :disabled="sending" :aria-busy="sending ? 'true' : undefined">
                        {{ sending ? 'Wird hochgeladen …' : 'Probelauf starten' }}
                    </button>
                </div>
            </form>
        </section>

        <section class="adm-section" aria-labelledby="fi-h-runs">
            <div class="adm-section__head">
                <h2 id="fi-h-runs" class="adm-section__title">Bisherige Läufe</h2>
            </div>
            <AdminState v-if="imports.length === 0" kind="empty" text="Noch kein Lauf. Eine geprüfte Datei erscheint hier, mit ihrem Probelauf und, wenn sie importiert ist, mit dem Ergebnis." />
            <div v-else class="adm-panel">
                <table class="adm-table">
                    <caption class="visually-hidden">Bisherige Läufe des Fahrzeug-Imports</caption>
                    <thead>
                        <tr>
                            <th scope="col">Datei</th>
                            <th scope="col">Quelle</th>
                            <th scope="col">Stand</th>
                            <th scope="col">Ergebnis</th>
                            <th scope="col">Wann und wer</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="run in imports" :key="run.id">
                            <td data-label="Datei"><Link :href="run.href">{{ run.file }}</Link></td>
                            <td data-label="Quelle">{{ run.source }}</td>
                            <td data-label="Stand">{{ run.statusLabel }}</td>
                            <td data-label="Ergebnis">{{ counts(run) }}</td>
                            <td data-label="Wann und wer">{{ run.at }}<template v-if="run.by"> · {{ run.by }}</template></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- The latest 20 runs, as Katalog › Import says of its own (the admin audit's sweep after F-26). -->
            <p v-if="total > imports.length" class="adm-note fi-more">Hier stehen die letzten {{ decimal(imports.length, 0) }} von {{ decimal(total, 0) }} Läufen.</p>
        </section>
    </AdminPage>
</template>

<style scoped>
.fi-fields {
    display: grid;
    gap: var(--sp-8);
    max-width: var(--adm-form-max);
    margin: var(--sp-12) 0;
}

.fi-fields__row {
    display: grid;
    grid-template-columns: calc(10 * var(--ch-text)) minmax(0, 1fr);
    gap: var(--sp-12);
}

.fi-fields dt {
    font-weight: 500;
}

.fi-fields dd {
    margin: 0;
    color: var(--c-ink-2);
}

.fi-rules {
    max-width: var(--adm-form-max);
}

.fi-form {
    display: grid;
    gap: var(--sp-16);
    max-width: var(--adm-form-max);
    margin-top: var(--sp-16);
}

.fi-form .form-field__error:empty {
    display: none;
}

.fi-source {
    max-width: calc(36 * var(--ch-text));
}

.fi-progress {
    display: grid;
    gap: var(--sp-12);
}

.fi-progress__stalled {
    margin: 0;
}

.fi-actions {
    display: flex;
    gap: var(--sp-12);
}



@media (max-width: 767px) {
    .fi-fields__row {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--sp-4);
    }
}
</style>
