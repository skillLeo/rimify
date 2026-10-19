<script setup lang="ts">
/**
 * Fahrzeuge › Import › one run (his admin item 2, D-297): which column holds what, what the Probelauf found, and the
 * import itself (VehicleImporter).
 *
 * The mapping can change without a new upload: the file's cells were kept as read. The import applies exactly the
 * Probelauf on screen; if the cars changed in between, the server asks for a new one.
 */

import { Link, router, useForm, usePage } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

type Status = 'create' | 'update' | 'unchanged' | 'merge' | 'kept' | 'refused'

interface PlanRow {
    line: string
    label: string
    keys: string | null
    status: Status
    vehicle: number | null
    changes: string[]
    notes: string[]
    reason: string | null
}

const props = defineProps<{
    run: {
        id: number
        file: string
        source: string
        format: string
        status: 'previewed' | 'applied'
        statusLabel: string
        summary: Partial<Record<Status | 'unread', number>>
        by: string | null
        at: string | null
        rowCount: number
        appliedAt: string | null
    }
    fields: { key: string; label: string; required: boolean }[]
    headers: string[]
    examples: Record<string, string>
    mapping: Record<string, string>
    missing: string[]
    rows: PlanRow[]
    hiddenRows: number
    /** The fingerprint of the Probelauf on screen, sent back with „Importieren“ (VehicleImporter::fingerprint). */
    planHash: string
    can: { remap: boolean; apply: boolean }
}>()

const page = usePage()

const mappingForm = useForm<{ mapping: Record<string, string> }>({
    mapping: Object.fromEntries(props.fields.map((field) => [field.key, props.mapping[field.key] ?? ''])),
})

watch(
    () => props.mapping,
    (mapping) => {
        mappingForm.defaults({ mapping: Object.fromEntries(props.fields.map((field) => [field.key, mapping[field.key] ?? ''])) })
        mappingForm.reset()
    }
)

function remap(): void {
    mappingForm.post(`/admin/fahrzeuge/import/${props.run.id}/zuordnung`, { preserveScroll: true })
}

const s = computed(() => props.run.summary)
const ready = computed(() => props.missing.length === 0)
const importable = computed(() => (s.value.create ?? 0) + (s.value.update ?? 0) + (s.value.merge ?? 0))

const context = computed(() => {
    const rows = props.run.rowCount === 1 ? '1 Zeile' : `${decimal(props.run.rowCount, 0)} Zeilen`

    return `${props.run.statusLabel} · ${props.run.source} · ${rows} · ${props.run.format}${props.run.at ? ` · ${props.run.at}` : ''}`
})

const serverError = computed(() => ((page.props.errors ?? {}) as Record<string, string | undefined>).import ?? '')

const STATUS: Record<Status, { label: string; tag: string | null }> = {
    create: { label: 'Neu', tag: null },
    update: { label: 'Geändert', tag: null },
    merge: { label: 'Ergänzt', tag: null },
    unchanged: { label: 'Unverändert', tag: 'adm-tag adm-tag--neutral' },
    kept: { label: 'Nicht überschrieben', tag: 'adm-tag adm-tag--neutral' },
    refused: { label: 'Abgelehnt', tag: 'adm-tag adm-tag--bad' },
}

/* The counts, named as the catalogue's run names its own („Neue Größen“); a nought is quiet, a refusal is an error. */
const tiles = computed(() => [
    { key: 'create', label: 'Neue Fahrzeuge', n: s.value.create ?? 0, bad: false },
    { key: 'update', label: 'Geänderte Fahrzeuge', n: s.value.update ?? 0, bad: false },
    { key: 'merge', label: 'Ergänzte Fahrzeuge', n: s.value.merge ?? 0, bad: false },
    { key: 'unchanged', label: 'Unverändert', n: s.value.unchanged ?? 0, bad: false },
    { key: 'kept', label: 'Nicht überschrieben', n: s.value.kept ?? 0, bad: false },
    { key: 'refused', label: 'Abgelehnt', n: s.value.refused ?? 0, bad: true },
])

/* The columns of a car, as the plan names them, in the words of the page. */
const COLUMN: Record<string, string> = {
    make: 'Hersteller',
    model: 'Modell',
    type_designation: 'Fahrzeugtyp',
    eg_nummer_raw: 'EG-Nummer',
    power_kw: 'Leistung',
    build_from: 'Gebaut ab',
    build_to: 'Gebaut bis',
    body_form: 'Karosserie',
    drive_axle: 'Antrieb',
    axle_load_front_kg: 'Achslast vorn',
    axle_load_rear_kg: 'Achslast hinten',
    max_speed_kmh: 'Höchstgeschwindigkeit',
    hsn: 'HSN',
    tsn: 'TSN',
}

function detail(row: PlanRow): string[] {
    const lines: string[] = []

    if (row.reason) {
        lines.push(row.reason)
    }

    if (row.changes.length) {
        lines.push(`${row.status === 'merge' ? 'Füllt' : 'Ändert'}: ${row.changes.map((c) => COLUMN[c] ?? c).join(', ')}`)
    }

    return [...lines, ...row.notes]
}

const confirmOpen = ref(false)
const busy = ref(false)

const confirmText = computed(() => {
    // The noun goes with the first figure, whichever it is: „3 Fahrzeuge ändern und 2 ergänzen?“
    const steps = [
        { n: s.value.create ?? 0, verb: 'anlegen' },
        { n: s.value.update ?? 0, verb: 'ändern' },
        { n: s.value.merge ?? 0, verb: 'ergänzen' },
    ].filter((step) => step.n > 0)
    const parts = steps.map((step, i) => (i === 0 ? `${decimal(step.n, 0)} ${step.n === 1 ? 'Fahrzeug' : 'Fahrzeuge'} ${step.verb}` : `${decimal(step.n, 0)} ${step.verb}`))
    const title = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1]}` : (parts[0] ?? '')

    return {
        title: `${title}?`,
        body: 'Neue und geänderte Fahrzeuge stehen sofort in der Fahrzeugauswahl des Shops. Fahrzeuge ohne Achslasten oder Höchstgeschwindigkeit stehen danach unter „Zur Prüfung“.',
    }
})

function example(field: string): string {
    const header = mappingForm.mapping[field] ?? ''

    return header === '' ? '–' : (props.examples[header] ?? '–')
}

function runImport(): void {
    busy.value = true
    router.post(`/admin/fahrzeuge/import/${props.run.id}/importieren`, { plan: props.planHash }, {
        preserveScroll: true,
        onFinish: () => {
            busy.value = false
            confirmOpen.value = false
        },
    })
}
</script>

<template>
    <AdminPage :title="run.file" :context="context">
        <template v-if="can.apply && ready && importable > 0" #primary>
            <button class="btn btn--primary" type="button" :disabled="mappingForm.isDirty" @click="confirmOpen = true">Importieren</button>
        </template>

        <p v-if="serverError" class="adm-alert" role="alert">{{ serverError }}</p>
        <p v-if="run.status === 'applied'" class="adm-note fr-state">Importiert am {{ run.appliedAt }}.</p>

        <!-- ── What the Probelauf found ────────────────────────────────── -->
        <section v-if="ready" class="adm-section" aria-labelledby="fr-h-result">
            <div class="adm-section__head">
                <h2 id="fr-h-result" class="adm-section__title">{{ run.status === 'previewed' ? 'Probelauf' : 'Ergebnis' }}</h2>
            </div>
            <dl class="fr-counts">
                <div v-for="tile in tiles" :key="tile.key" class="fr-count" :class="{ 'fr-count--none': tile.n === 0, 'fr-count--bad': tile.bad && tile.n > 0 }">
                    <dt>{{ tile.label }}</dt>
                    <dd>{{ decimal(tile.n, 0) }}</dd>
                </div>
            </dl>
            <p v-if="(s.unread ?? 0) > 0" class="adm-note">
                In {{ s.unread === 1 ? 'einer Zeile' : `${decimal(s.unread ?? 0, 0)} Zeilen` }} ist mindestens ein Wert nicht lesbar. Solche Werte bleiben
                leer und werden nie geraten; ein Fahrzeug ohne Achslasten oder Höchstgeschwindigkeit steht danach unter „Zur Prüfung“.
            </p>
            <p v-if="run.status === 'previewed' && importable === 0" class="adm-note">Nichts zu importieren: Keine Zeile ist neu, geändert oder ergänzt.</p>
            <p v-if="run.status === 'previewed' && (s.refused ?? 0) > 0" class="adm-note">Abgelehnte Zeilen übernimmt der Import nicht. Korrigier sie in der Datei und starte einen neuen Probelauf.</p>
            <p v-if="run.status === 'previewed' && importable > 0 && !can.apply" class="adm-note">Importieren kann, wer Fahrzeuge anlegen und ändern darf. Den Probelauf siehst du trotzdem.</p>

            <div v-if="rows.length" class="adm-panel fr-rows">
                <table class="adm-table">
                    <caption class="visually-hidden">Zeilen der Datei, die sich ändern, bleiben oder abgelehnt sind</caption>
                    <thead>
                        <tr>
                            <th scope="col" class="num">Zeile</th>
                            <th scope="col">HSN/TSN</th>
                            <th scope="col">Fahrzeug</th>
                            <th scope="col">Ergebnis</th>
                            <th scope="col">Einzelheiten</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in rows" :key="row.line">
                            <td data-label="Zeile" class="num"><span class="fr-line-word">Zeile </span>{{ row.line }}</td>
                            <td data-label="HSN/TSN" class="fr-keys">{{ row.keys ?? '–' }}</td>
                            <td data-label="Fahrzeug" class="fr-label">{{ row.label || '–' }}</td>
                            <td data-label="Ergebnis" data-phone="status">
                                <span v-if="STATUS[row.status].tag" :class="STATUS[row.status].tag">{{ STATUS[row.status].label }}</span>
                                <template v-else>{{ STATUS[row.status].label }}</template>
                            </td>
                            <td data-label="Einzelheiten" class="fr-detail" :data-phone="detail(row).length === 0 ? 'hide' : undefined">
                                <span v-for="line in detail(row)" :key="line" class="fr-detail-line">{{ line }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p v-if="hiddenRows === 1" class="adm-note">Eine weitere Zeile ist in den Zahlen oben enthalten, aber hier nicht aufgeführt.</p>
            <p v-else-if="hiddenRows" class="adm-note">Weitere {{ decimal(hiddenRows, 0) }} Zeilen sind in den Zahlen oben enthalten, aber hier nicht aufgeführt.</p>
        </section>

        <!-- ── Which column holds what ────────────────────────────────── -->
        <section class="adm-section" aria-labelledby="fr-h-map">
            <div class="adm-section__head">
                <h2 id="fr-h-map" class="adm-section__title">Zuordnung der Spalten</h2>
            </div>
            <p v-if="!ready" class="adm-alert" role="alert">Diese Felder brauchen noch eine Spalte aus der Datei: {{ missing.join(', ') }}. Erst dann kann der Probelauf die Zeilen prüfen.</p>

            <form class="fr-map" @submit.prevent="remap">
                <div class="adm-panel">
                    <table class="adm-table">
                        <caption class="visually-hidden">Welche Spalte der Datei welches Feld füllt</caption>
                        <thead>
                            <tr>
                                <th scope="col">Feld</th>
                                <th scope="col">Spalte aus der Datei</th>
                                <th scope="col">Erster Wert</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="field in fields" :key="field.key">
                                <td data-label="Feld">
                                    <label :for="`fr-map-${field.key}`" class="fr-field">{{ field.label }}</label>
                                    <span v-if="field.required" class="fr-req">Pflicht</span>
                                </td>
                                <td data-label="Spalte">
                                    <select :id="`fr-map-${field.key}`" v-model="mappingForm.mapping[field.key]" class="input fr-select" :disabled="!can.remap">
                                        <option value="">– keine –</option>
                                        <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                                    </select>
                                </td>
                                <td data-label="Erster Wert" class="fr-example">{{ example(field.key) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="can.remap" class="fr-map__actions">
                    <button class="btn btn--secondary" type="submit" :disabled="mappingForm.processing" :aria-busy="mappingForm.processing ? 'true' : undefined">Neu prüfen</button>
                    <p v-if="mappingForm.isDirty" class="adm-note">Die Zuordnung ist geändert. Prüf neu, bevor du importierst.</p>
                </div>
            </form>
        </section>

        <p class="fr-back"><Link href="/admin/fahrzeuge/import">Zurück zum Import</Link></p>

        <AdminConfirm v-model:open="confirmOpen" :title="confirmText.title" :body="confirmText.body" confirm-label="Importieren" :busy="busy" @confirm="runImport" />
    </AdminPage>
</template>

<style scoped>
.fr-state {
    margin-bottom: var(--sp-16);
}

.fr-counts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--sp-16);
    max-width: var(--adm-form-max);
    margin: 0 0 var(--sp-16);
}

/* A label that wraps on a phone keeps its figure on the row's line. */
.fr-count {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-top: var(--sp-8);
    border-top: 1px solid var(--c-line);
}

.fr-count dt {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.fr-count dd {
    margin: var(--sp-4) 0 0;
    font-size: var(--fs-h3);
    line-height: var(--lh-h3);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

/* A nought is quiet; what was refused is an error (DIRECTION §2). */
.fr-count--none dd {
    color: var(--c-ink-3);
}

.fr-count--bad {
    border-top-color: var(--c-bad);
}

.fr-count--bad dd {
    color: var(--c-bad);
}

.fr-rows {
    margin-top: var(--sp-16);
}

.fr-keys {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.fr-line-word {
    display: none;
}

.fr-label,
.fr-detail {
    overflow-wrap: anywhere;
}

.fr-detail-line {
    display: block;
}

.fr-map {
    display: grid;
    gap: var(--sp-16);
}

.fr-field {
    font-weight: 500;
}

.fr-req {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.fr-select {
    min-width: calc(20 * var(--ch-text));
}

.fr-example {
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}

.fr-map__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-12);
}

.fr-back {
    margin: var(--sp-32) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

@media (max-width: 767px) {
    .fr-line-word {
        display: inline;
    }

    .fr-counts {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .fr-select {
        width: 100%;
        min-width: 0;
    }

    .fr-map__actions .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
