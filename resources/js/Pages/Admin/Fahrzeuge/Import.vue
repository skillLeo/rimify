<script setup lang="ts">
/**
 * Fahrzeuge › Import (his admin item 2, D-297) — a vehicle dataset into the shop: the file and where it comes from, its
 * columns, the Probelauf, the import (VehicleImporter). This page is the first step and the record of every run; each
 * run has its own page (ImportRun.vue).
 *
 * Nothing reaches the cars from here: the upload makes a Probelauf, which only reads.
 */

import { Link, useForm } from '@inertiajs/vue3'
import { watch } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import FilePick from '../../../Components/Admin/FilePick.vue'
import { useFocusAfter } from '../../../composables/admin/useFocusAfter'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'
import { FILE_CHANGED, stillReadable } from '../../../lib/file'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface Run {
    id: number
    file: string
    source: string
    format: string
    status: 'previewed' | 'applied'
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

watch(
    () => upload.file,
    (chosen) => {
        if (chosen !== null) {
            upload.clearErrors('file')
        }
    }
)

async function submit(): Promise<void> {
    if (upload.processing) {
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

    upload.post('/admin/fahrzeuge/import/probelauf', {
        forceFormData: true,
        preserveScroll: true,
        onError: (errors) => {
            if (errors.file) {
                upload.file = null
            }

            focus.request(errors.quelle && !errors.file ? 'fi-source' : 'fi-file-button')
        },
    })
}

function counts(run: Run): string {
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

            <p class="visually-hidden" aria-live="assertive">{{ upload.errors.file ?? upload.errors.quelle ?? '' }}</p>

            <form class="fi-form" @submit.prevent="submit">
                <div class="form-field">
                    <span id="fi-file-label" class="form-field__label">Datei (CSV oder Excel, höchstens 5 MB)</span>
                    <FilePick
                        id="fi-file"
                        v-model="upload.file"
                        accept=".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        :invalid="!!upload.errors.file"
                        describedby="fi-file-label fi-file-err"
                        @refused="(name: string) => upload.setError('file', `„${name}“ nimmt dieses Feld nicht – nur CSV oder Excel (.xlsx).`)"
                    />
                    <p id="fi-file-err" class="form-field__error">{{ upload.errors.file }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fi-source">Woher die Daten kommen</label>
                    <select id="fi-source" v-model="upload.quelle" class="input fi-source" :aria-invalid="upload.errors.quelle ? 'true' : undefined" aria-describedby="fi-source-help fi-source-err">
                        <option value="" disabled>Quelle wählen</option>
                        <option v-for="source in sources" :key="source.value" :value="source.value">{{ source.label }}</option>
                    </select>
                    <p id="fi-source-help" class="form-field__help">Jedes neue Fahrzeug trägt diese Quelle. Jede Datei beginnt mit der Spaltenzuordnung des letzten Imports derselben Quelle.</p>
                    <p id="fi-source-err" class="form-field__error">{{ upload.errors.quelle }}</p>
                </div>
                <div>
                    <button class="btn btn--primary" type="submit" :disabled="upload.processing" :aria-busy="upload.processing ? 'true' : undefined">Probelauf starten</button>
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

@media (max-width: 767px) {
    .fi-fields__row {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--sp-4);
    }
}
</style>
