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

interface Check {
    key: string
    label: string
    expected: string
    count: number | null
    checked: number
    examples: string[]
    unmapped: string | null
    unchecked: string | null
}

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
    fields: { key: string; label: string; required: boolean; hint: string | null }[]
    headers: string[]
    examples: Record<string, string>
    mapping: Record<string, string>
    missing: string[]
    /**
     * What the file lacks over all its rows, with each count's share of the file (VehicleImporter::gaps, D-317) — or, for
     * a field without a column, `unmapped` and no count: what was not read is never reported as missing (R-17).
     */
    gaps: { key: string; label: string; count: number | null; share: string | null; unmapped: string | null }[]
    /**
     * The third state beside missing and mapped: read, but not as what the field can be (VehicleImporter::implausible,
     * D-318). Each says what was read and what was expected, never what the file contains; none blocks the import.
     */
    implausible: Check[]
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

/* A check's line: its finding over every row of the file, or why it has none — never a nought for a check that did not run. */
function result(check: Check): string {
    if (check.unmapped) {
        return check.unmapped
    }

    if (check.unchecked) {
        return check.unchecked
    }

    const checked = `geprüft: ${decimal(check.checked, 0)} von ${decimal(props.run.rowCount, 0)} Zeilen`
    const count = check.count ?? 0

    return count === 0 ? `In keiner Zeile · ${checked}` : `In ${count === 1 ? 'einer Zeile' : `${decimal(count, 0)} Zeilen`} · ${checked}`
}

const oddFound = computed(() => props.implausible.some((check) => (check.count ?? 0) > 0))

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
        body:
            'Neue und geänderte Fahrzeuge stehen sofort in der Fahrzeugauswahl des Shops. Fahrzeuge ohne Achslasten oder Höchstgeschwindigkeit stehen danach unter „Zur Prüfung“.' +
            // A warning, never a stop (D-318): the fix is a mapping, and the person importing decides.
            (oddFound.value ? ' Der Probelauf hat unplausible Werte gelesen – meist ist dann einem Feld die falsche Spalte zugeordnet. Prüf die Zuordnung, bevor du importierst.' : ''),
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
                In {{ s.unread === 1 ? 'einer Zeile' : `${decimal(s.unread ?? 0, 0)} Zeilen` }} ist mindestens ein Wert nicht lesbar oder unplausibel. Solche Werte bleiben
                leer und werden nie geraten; ein Fahrzeug ohne Achslasten oder Höchstgeschwindigkeit steht danach unter „Zur Prüfung“.
            </p>
            <p v-if="run.status === 'previewed' && importable === 0" class="adm-note">Nichts zu importieren: Keine Zeile ist neu, geändert oder ergänzt.</p>
            <p v-if="run.status === 'previewed' && (s.refused ?? 0) > 0" class="adm-note">Abgelehnte Zeilen übernimmt der Import nicht. Korrigier sie in der Datei und starte einen neuen Probelauf.</p>
            <p v-if="run.status === 'previewed' && importable > 0 && !can.apply" class="adm-note">Importieren kann, wer Fahrzeuge anlegen und ändern darf. Den Probelauf siehst du trotzdem.</p>

            <!-- What the file lacks, over every row: the figures a purchase of the full dataset is decided on (D-317). -->
            <div v-if="gaps.length" class="fr-gaps">
                <h3 id="fr-h-gaps" class="fr-gaps__title">Was in der Datei fehlt</h3>
                <p class="adm-note">
                    Gezählt über {{ run.rowCount === 1 ? 'die eine Zeile' : `alle ${decimal(run.rowCount, 0)} Zeilen` }} der Datei, unabhängig davon, was der Import mit einer Zeile macht.
                    Ein nicht lesbarer Wert zählt wie ein fehlender. Ist einem Feld keine Spalte zugeordnet, hat der Import es nicht gelesen. Statt der Zahlen
                    steht dann „Keine Spalte zugeordnet“ – ob die Werte in der Datei fehlen, bleibt offen.
                </p>
                <div class="adm-panel">
                    <table class="adm-table" aria-labelledby="fr-h-gaps">
                        <thead>
                            <tr>
                                <th scope="col">Angabe</th>
                                <th scope="col" class="num">Fehlt in</th>
                                <th scope="col" class="num">Anteil</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="gap in gaps" :key="gap.key" :class="{ 'fr-gap--none': gap.count === 0, 'fr-gap--unmapped': gap.unmapped !== null }">
                                <td data-label="Angabe" class="fr-gap__label">{{ gap.label }}</td>
                                <td data-label="Fehlt in" class="num">{{ gap.unmapped ?? `${decimal(gap.count ?? 0, 0)} von ${decimal(run.rowCount, 0)}` }}</td>
                                <td data-label="Anteil" class="num">{{ gap.share ?? '–' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Read, but not as what the field can be: most often a column mapped to the wrong column (D-318). -->
            <div v-if="implausible.length" class="fr-checks">
                <h3 id="fr-h-odd" class="fr-gaps__title">Gelesen, aber unplausibel</h3>
                <p class="adm-note">
                    Der Probelauf prüft, ob gelesene Werte im erwarteten Bereich liegen und zueinander passen. Fällt ein Wert auf, ist meist einem
                    Feld die falsche Spalte zugeordnet: Prüf die Zuordnung unten. Eine Achslast oder Höchstgeschwindigkeit außerhalb des erwarteten
                    Bereichs übernimmt der Import nicht. Die Zeile wird trotzdem importiert, das Fahrzeug steht danach unter „Zur Prüfung“. Achslasten,
                    die erst im Vergleich auffallen, übernimmt der Import so, wie er sie gelesen hat.
                </p>
                <ul class="fr-odd" aria-labelledby="fr-h-odd">
                    <li v-for="check in implausible" :key="check.key" class="fr-odd__check" :class="{ 'fr-odd__check--hit': (check.count ?? 0) > 0 }">
                        <p class="fr-odd__label">{{ check.label }}</p>
                        <p class="fr-odd__result">{{ result(check) }}</p>
                        <p class="fr-odd__expected">{{ check.expected }}</p>
                        <ul v-if="check.examples.length" class="fr-odd__examples">
                            <li v-for="example in check.examples" :key="example">{{ example }}</li>
                        </ul>
                    </li>
                </ul>
            </div>

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
                                    <span v-if="field.hint" class="fr-req">{{ field.hint }}</span>
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

/* The two blocks under the counts share one frame: what the file lacks, and what reads but cannot be. */
.fr-gaps,
.fr-checks {
    display: grid;
    gap: var(--sp-8);
    max-width: var(--adm-form-max);
    margin-top: var(--sp-16);
}

.fr-gaps__title {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.fr-gap__label {
    overflow-wrap: anywhere;
}

/* A field the whole file carries is quiet, as a nought among the counts is. */
.fr-gap--none td {
    color: var(--c-ink-3);
}

/* Not read is not a count: the sentence stands in the figures' place, in the page's secondary ink. */
.fr-gap--unmapped td:not(.fr-gap__label) {
    color: var(--c-ink-2);
}

.fr-odd {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
}

.fr-odd__check {
    display: grid;
    gap: var(--sp-4);
    padding-block: var(--sp-12);
    border-top: 1px solid var(--c-line);
}

.fr-odd__check p {
    margin: 0;
}

.fr-odd__label {
    font-weight: 500;
}

.fr-odd__result {
    font-variant-numeric: tabular-nums;
}

/* What was found is a warning, not an error: the import goes on, the person importing decides (D-318). */
.fr-odd__check--hit .fr-odd__result {
    color: var(--c-warn);
    font-weight: 600;
}

.fr-odd__expected,
.fr-odd__examples {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.fr-odd__examples {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
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
