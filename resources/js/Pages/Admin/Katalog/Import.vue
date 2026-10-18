<script setup lang="ts">
/**
 * Katalog › Import — a supplier feed into the catalogue: the file, its columns, the Probelauf, the
 * import (the review release §4.2). This page is the first step and the record of every run; each run
 * has its own page (ImportRun.vue).
 *
 * Nothing reaches the catalogue from here: the upload makes a Probelauf, which only reads.
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
import type { AdminImportProps, ImportRunRow } from '../../../types/admin/felgen'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminImportProps>()

const upload = useForm<{ file: File | null; dezimal: 'komma' | 'punkt'; lieferant: string }>({ file: null, dezimal: 'komma', lieferant: '' })
const focus = useFocusAfter()

// A file chosen answers the sentence that asked for one (K2-21).
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
        // The keyboard goes to the field the sentence is about (K2-21).
        focus.request('im-file-button')

        return
    }

    // Saved anew since it was chosen: asked for again, never sent into a failure that blames the connection (K2-29).
    if (!(await stillReadable(upload.file))) {
        upload.file = null
        upload.setError('file', FILE_CHANGED)
        focus.request('im-file-button')

        return
    }

    upload.post('/admin/katalog/import/probelauf', {
        forceFormData: true,
        preserveScroll: true,
        onError: (errors) => {
            // A refused file is let go, so the one chosen again is a fresh copy the browser will send (K2-29).
            if (errors.file) {
                upload.file = null
            }

            focus.request(errors.lieferant ? 'im-supplier' : 'im-file-button')
        },
    })
}

function counts(run: ImportRunRow): string {
    const s = run.summary
    const parts: string[] = []

    if (s.create) {
        parts.push(`${decimal(s.create, 0)} neu`)
    }

    if (s.update) {
        parts.push(`${decimal(s.update, 0)} geändert`)
    }

    if (s.refused) {
        parts.push(`${decimal(s.refused, 0)} abgelehnt`)
    }

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
    <AdminPage title="Katalog-Import" :context="total === 1 ? '1 Lauf' : `${decimal(total, 0)} Läufe`">
        <section v-if="can.preview" class="adm-section" aria-labelledby="im-h-file">
            <div class="adm-section__head">
                <h2 id="im-h-file" class="adm-section__title">Datei prüfen</h2>
            </div>
            <p class="adm-note">
                Eine Zeile ist eine Größe. Der Probelauf liest die Datei und zeigt, was sich ändern würde – im Katalog ändert sich dabei nichts. Zum
                Anfangen gibt es eine <a href="/admin/katalog/import/beispiel.csv" download>Beispieldatei</a> mit allen Spalten.
            </p>

            <dl class="im-fields">
                <div class="im-fields__row">
                    <dt>Pflicht</dt>
                    <dd>{{ required.map((f) => f.label).join(', ') }}</dd>
                </div>
                <div class="im-fields__row">
                    <dt>Optional</dt>
                    <dd>{{ optional.map((f) => f.label).join(', ') }}</dd>
                </div>
            </dl>
            <p class="adm-note im-rules">Der Import erkennt die Spalten an ihrem Namen; im nächsten Schritt kannst du sie auch selbst zuordnen. Bei einer bekannten SKU ändert der Import nur Preis, Verfügbarkeit, EAN, KBA-Nummer und Gewicht; die Radtypenbezeichnung übernimmt er nur für neue Felgen. Maße ändert ein Import nie, Demodaten fasst er nicht an, und neue Felgen sind Entwürfe.</p>

            <p class="visually-hidden" aria-live="assertive">{{ upload.errors.file ?? upload.errors.lieferant ?? '' }}</p>

            <form class="im-form" @submit.prevent="submit">
                <div class="form-field">
                    <span id="im-file-label" class="form-field__label">Datei (CSV oder Excel, höchstens 5 MB)</span>
                    <FilePick
                        id="im-file"
                        v-model="upload.file"
                        @refused="(name: string) => upload.setError('file', `„${name}“ nimmt dieses Feld nicht – nur CSV oder Excel (.xlsx).`)"
                        accept=".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        :invalid="!!upload.errors.file"
                        describedby="im-file-label im-file-err"
                    />
                    <p id="im-file-err" class="form-field__error">{{ upload.errors.file }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="im-supplier">Lieferant <span class="im-optional">(optional)</span></label>
                    <input
                        id="im-supplier"
                        v-model="upload.lieferant"
                        class="input im-supplier"
                        type="text"
                        maxlength="80"
                        autocomplete="off"
                        :list="suppliers.length ? 'im-suppliers' : undefined"
                        :aria-invalid="upload.errors.lieferant ? 'true' : undefined"
                        aria-describedby="im-supplier-help im-supplier-err"
                    >
                    <datalist v-if="suppliers.length" id="im-suppliers">
                        <option v-for="name in suppliers" :key="name" :value="name" />
                    </datalist>
                    <p id="im-supplier-help" class="form-field__help">Nennst du den Lieferanten, merkt sich der Import seine Spaltenzuordnung für die nächste Datei.</p>
                    <p id="im-supplier-err" class="form-field__error">{{ upload.errors.lieferant }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="im-decimal">Kommazahlen in der Datei</label>
                    <select id="im-decimal" v-model="upload.dezimal" class="input im-decimal" aria-describedby="im-decimal-help">
                        <option value="komma">mit Komma: 8,5 und 189,00</option>
                        <option value="punkt">mit Punkt: 8.5 und 189.00</option>
                    </select>
                    <p id="im-decimal-help" class="form-field__help">Nur für CSV. Eine Excel-Datei liest der Import immer richtig.</p>
                </div>
                <div>
                    <button class="btn btn--primary" type="submit" :disabled="upload.processing" :aria-busy="upload.processing ? 'true' : undefined">Probelauf starten</button>
                </div>
            </form>
        </section>

        <section class="adm-section" aria-labelledby="im-h-runs">
            <div class="adm-section__head">
                <h2 id="im-h-runs" class="adm-section__title">Bisherige Läufe</h2>
            </div>

            <AdminState v-if="imports.length === 0" kind="empty" text="Hier steht jeder Probelauf und jeder Import, sobald die erste Datei geprüft ist." />

            <div v-else class="adm-panel">
                <table class="adm-table">
                    <caption class="visually-hidden">Bisherige Probeläufe und Importe</caption>
                    <thead>
                        <tr>
                            <th scope="col">Datei</th>
                            <th scope="col">Stand</th>
                            <th scope="col">Ergebnis</th>
                            <th scope="col">Von</th>
                            <th scope="col">Wann</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="run in imports" :key="run.id">
                            <td data-label="Datei">
                                <Link :href="run.href" class="im-link">{{ run.file }}</Link>
                                <span class="im-sub">{{ run.supplier ? `${run.supplier} · ${run.format}` : run.format }}</span>
                            </td>
                            <td data-label="Stand" data-phone="status">
                                <span v-if="run.status !== 'applied'" class="adm-tag adm-tag--neutral">{{ run.statusLabel }}</span>
                                <template v-else>{{ run.statusLabel }}</template>
                            </td>
                            <td data-label="Ergebnis">{{ counts(run) }}</td>
                            <td data-label="Von" data-phone="hide">{{ run.by ?? '–' }}</td>
                            <td data-label="Wann" class="im-when">{{ run.at ?? '–' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p v-if="total > imports.length" class="adm-note im-more">Hier stehen die letzten {{ decimal(imports.length, 0) }} von {{ decimal(total, 0) }} Läufen.</p>
        </section>
    </AdminPage>
</template>

<style scoped>
.im-form {
    display: grid;
    gap: var(--sp-16);
    max-width: var(--adm-form-max);
    margin-block: var(--sp-16) var(--sp-24);
}

.im-decimal,
.im-supplier {
    max-width: 36ch;
}

.im-optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.im-form .form-field__error:empty {
    display: none;
}

/* The columns the importer reads: a short list at reading width, above the file it applies to. */
.im-fields {
    display: grid;
    gap: var(--sp-8);
    max-width: 54ch;
    margin: var(--sp-16) 0 0;
    /* The measure is set in the list's own type size, so its 54ch ends where the notes' does. */
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.im-fields__row {
    display: grid;
    grid-template-columns: 9ch minmax(0, 1fr);
    gap: var(--sp-12);
}

.im-fields__row dt {
    font-weight: 500;
}

.im-fields__row dd {
    margin: 0;
    color: var(--c-ink-2);
}

.im-rules {
    margin-top: var(--sp-12);
}

.im-link {
    color: var(--c-ink);
    font-weight: 500;
    overflow-wrap: anywhere;
}

.im-sub {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.im-when {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

@media (max-width: 767px) {
    .im-form .btn,
    .adm-section__head .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
