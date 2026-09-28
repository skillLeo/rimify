<script setup lang="ts">
/**
 * Katalog › Import › one run: which column holds what, what the Probelauf found, and the import itself
 * — or, once imported, taking it back (CatalogueImporter).
 *
 * The mapping can change without a new upload: the file's cells were kept as read. The import applies
 * exactly the Probelauf on screen; if the catalogue changed in between, the server asks for a new one.
 */

import { Link, router, useForm, usePage } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'
import type { AdminImportRunProps, ImportPlanRow } from '../../../types/admin/felgen'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminImportRunProps>()

const page = usePage()

const mappingForm = useForm<{ mapping: Record<string, string>; dezimal: 'komma' | 'punkt' }>({
    mapping: Object.fromEntries(props.fields.map((field) => [field.key, props.mapping[field.key] ?? ''])),
    dezimal: props.run.decimal,
})

watch(
    () => [props.mapping, props.run.decimal] as const,
    ([mapping, dec]) => {
        mappingForm.defaults({ mapping: Object.fromEntries(props.fields.map((field) => [field.key, mapping[field.key] ?? ''])), dezimal: dec })
        mappingForm.reset()
    }
)

function remap(): void {
    mappingForm.post(`/admin/katalog/import/${props.run.id}/zuordnung`, { preserveScroll: true })
}

const s = computed(() => props.run.summary)
const ready = computed(() => props.missing.length === 0)
const importable = computed(() => (s.value.create ?? 0) + (s.value.update ?? 0))

const context = computed(() => {
    const rows = props.run.rowCount === 1 ? '1 Zeile' : `${decimal(props.run.rowCount, 0)} Zeilen`

    return `${props.run.statusLabel}${props.run.supplier ? ` · ${props.run.supplier}` : ''} · ${rows} · ${props.run.format}${props.run.at ? ` · ${props.run.at}` : ''}`
})

const serverError = computed(() => {
    const bag = (page.props.errors ?? {}) as Record<string, string | undefined>

    return bag.import ?? ''
})

const ACTIONS: Record<ImportPlanRow['action'], { label: string; tag: string | null }> = {
    create: { label: 'Neu', tag: null },
    update: { label: 'Wird geändert', tag: null },
    unchanged: { label: 'Unverändert', tag: 'adm-tag adm-tag--neutral' },
    refused: { label: 'Abgelehnt', tag: 'adm-tag adm-tag--bad' },
}

function newParts(row: ImportPlanRow): string {
    const parts: string[] = []

    if (row.new.brand) {
        parts.push('neue Marke')
    }

    if (row.new.model) {
        parts.push('neues Modell')
    }

    if (row.new.finish) {
        parts.push('neue Ausführung')
    }

    const text = parts.join(', ')

    return text.charAt(0).toUpperCase() + text.slice(1)
}

/* ── Import and rollback ───────────────────────────────────────────────────── */

type Step = 'importieren' | 'zuruecknehmen'

const step = ref<Step | null>(null)
const busy = ref(false)
const confirmOpen = computed({
    get: () => step.value !== null,
    set: (open: boolean) => {
        if (!open) {
            step.value = null
        }
    },
})

const confirmText = computed(() => {
    if (step.value === 'zuruecknehmen') {
        return {
            title: 'Import zurücknehmen?',
            body: 'Geänderte Preise und Bestände bekommen ihren alten Wert zurück, neu angelegte Größen, Ausführungen, Modelle und Marken werden gelöscht.',
            label: 'Zurücknehmen',
        }
    }

    const create = s.value.create ?? 0
    const update = s.value.update ?? 0
    const parts = [create ? `${decimal(create, 0)} ${create === 1 ? 'Größe anlegen' : 'Größen anlegen'}` : '', update ? `${decimal(update, 0)} ${update === 1 ? 'Größe ändern' : 'Größen ändern'}` : ''].filter(Boolean)

    return {
        title: `${parts.join(' und ')}?`,
        body: 'Neue Felgen sind Entwürfe, bis du sie veröffentlichst. Geänderte Preise und Bestände gelten sofort im Shop. Du kannst den Import zurücknehmen, solange nichts darauf aufbaut.',
        label: 'Importieren',
    }
})

/** The first value of the column mapped to a field, as the file has it. */
function example(field: string): string {
    const header = mappingForm.mapping[field] ?? ''

    return header === '' ? '–' : (props.examples[header] ?? '–')
}

function runStep(): void {
    if (step.value === null) {
        return
    }

    busy.value = true
    router.post(`/admin/katalog/import/${props.run.id}/${step.value}`, {}, {
        preserveScroll: true,
        onFinish: () => {
            busy.value = false
            step.value = null
        },
    })
}
</script>

<template>
    <AdminPage :title="run.file" :context="context">
        <template v-if="can.apply && ready && importable > 0" #primary>
            <button class="btn btn--primary" type="button" :disabled="mappingForm.isDirty" @click="step = 'importieren'">Importieren</button>
        </template>
        <template v-else-if="can.rollback" #primary>
            <button class="btn btn--secondary" type="button" @click="step = 'zuruecknehmen'">Import zurücknehmen</button>
        </template>

        <p v-if="serverError" class="adm-alert" role="alert">{{ serverError }}</p>
        <p v-if="run.status === 'applied'" class="adm-note im-state">Importiert am {{ run.appliedAt }}.</p>
        <p v-else-if="run.status === 'rolled_back'" class="adm-note im-state">Importiert am {{ run.appliedAt }}, zurückgenommen am {{ run.rolledBackAt }}.</p>

        <!-- ── What the Probelauf found ────────────────────────────────── -->
        <section v-if="ready" class="adm-section" aria-labelledby="ir-h-result">
            <div class="adm-section__head">
                <h2 id="ir-h-result" class="adm-section__title">{{ run.status === 'previewed' ? 'Probelauf' : 'Ergebnis' }}</h2>
            </div>
            <dl class="ir-counts">
                <div class="ir-count">
                    <dt>Neue Größen</dt>
                    <dd>{{ decimal(s.create ?? 0, 0) }}</dd>
                </div>
                <div class="ir-count">
                    <dt>Geänderte Größen</dt>
                    <dd>{{ decimal(s.update ?? 0, 0) }}</dd>
                </div>
                <div class="ir-count">
                    <dt>Unverändert</dt>
                    <dd>{{ decimal(s.unchanged ?? 0, 0) }}</dd>
                </div>
                <div class="ir-count" :class="{ 'ir-count--bad': (s.refused ?? 0) > 0 }">
                    <dt>Abgelehnt</dt>
                    <dd>{{ decimal(s.refused ?? 0, 0) }}</dd>
                </div>
            </dl>
            <p v-if="(s.brands ?? 0) + (s.models ?? 0) + (s.finishes ?? 0) > 0" class="adm-note">
                Dabei neu: {{ decimal(s.brands ?? 0, 0) }} {{ s.brands === 1 ? 'Marke' : 'Marken' }}, {{ decimal(s.models ?? 0, 0) }} {{ s.models === 1 ? 'Modell' : 'Modelle' }},
                {{ decimal(s.finishes ?? 0, 0) }} {{ s.finishes === 1 ? 'Ausführung' : 'Ausführungen' }}. Neue Modelle sind Entwürfe.
            </p>
            <p v-if="run.status === 'previewed' && importable === 0" class="adm-note">Nichts zu importieren: Jede Zeile ist entweder schon so im Katalog oder abgelehnt.</p>
            <p v-if="run.refusedHref" class="adm-note">
                <a :href="run.refusedHref" download>Abgelehnte Zeilen als CSV</a> – mit dem Grund und der Zeile, wie sie in der Datei stand. Korrigiert kannst du sie wieder hochladen.
            </p>

            <div v-if="rows.length" class="adm-panel ir-rows">
                <table class="adm-table">
                    <caption class="visually-hidden">Zeilen der Datei, die sich ändern oder abgelehnt sind</caption>
                    <thead>
                        <tr>
                            <th scope="col" class="num">Zeile</th>
                            <th scope="col">SKU</th>
                            <th scope="col">Felge</th>
                            <th scope="col">Änderung</th>
                            <th scope="col">Einzelheiten</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in rows" :key="row.line">
                            <td data-label="Zeile" class="num">{{ row.line }}</td>
                            <td data-label="SKU" class="ir-sku">{{ row.sku || '–' }}</td>
                            <td data-label="Felge" class="ir-label">{{ row.label }}</td>
                            <td data-label="Änderung">
                                <span v-if="ACTIONS[row.action].tag" :class="ACTIONS[row.action].tag">{{ ACTIONS[row.action].label }}</span>
                                <template v-else>{{ ACTIONS[row.action].label }}</template>
                            </td>
                            <td data-label="Einzelheiten" class="ir-detail">
                                <template v-if="row.action === 'refused'">
                                    <span v-for="reason in row.reasons" :key="reason" class="ir-line">{{ reason }}</span>
                                </template>
                                <template v-else-if="row.action === 'update'">
                                    <span v-for="change in row.changes" :key="change.field" class="ir-line">{{ change.field }}: {{ change.from }} → {{ change.to }}</span>
                                </template>
                                <template v-else>{{ newParts(row) || 'Neue Größe' }}</template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p v-if="hiddenRows" class="adm-note">Weitere {{ decimal(hiddenRows, 0) }} Zeilen sind in den Zahlen oben enthalten, aber hier nicht aufgeführt.</p>
        </section>

        <!-- ── Which column holds what ────────────────────────────────── -->
        <section class="adm-section" aria-labelledby="ir-h-map">
            <div class="adm-section__head">
                <h2 id="ir-h-map" class="adm-section__title">Zuordnung der Spalten</h2>
            </div>
            <p v-if="!ready" class="adm-alert" role="alert">Diese Felder brauchen noch eine Spalte aus der Datei: {{ missing.join(', ') }}. Erst dann kann der Probelauf die Zeilen prüfen.</p>
            <p v-if="run.mappingRemembered" class="adm-note">
                Übernommen aus dem letzten Import {{ run.supplier ? `für „${run.supplier}“` : 'ohne Lieferantennamen' }}.
            </p>
            <p v-else-if="run.status === 'previewed'" class="adm-note">
                Erkannt an den Spaltennamen. Mit dem Import wird diese Zuordnung{{ run.supplier ? ` für „${run.supplier}“` : '' }} gespeichert.
            </p>

            <form class="ir-map" @submit.prevent="remap">
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
                                    <label :for="`ir-map-${field.key}`" class="ir-field">{{ field.label }}</label>
                                    <span v-if="field.required" class="ir-req">Pflicht</span>
                                </td>
                                <td data-label="Spalte aus der Datei">
                                    <select :id="`ir-map-${field.key}`" v-model="mappingForm.mapping[field.key]" class="input ir-select" :disabled="!can.remap">
                                        <option value="">– keine –</option>
                                        <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                                    </select>
                                </td>
                                <td data-label="Erster Wert" class="ir-example">{{ example(field.key) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="run.format === 'CSV'" class="form-field ir-decimal">
                    <label class="form-field__label" for="ir-decimal">Kommazahlen in der Datei</label>
                    <select id="ir-decimal" v-model="mappingForm.dezimal" class="input" :disabled="!can.remap">
                        <option value="komma">mit Komma: 8,5 und 189,00</option>
                        <option value="punkt">mit Punkt: 8.5 und 189.00</option>
                    </select>
                </div>

                <div v-if="can.remap" class="ir-map__actions">
                    <button class="btn btn--secondary" type="submit" :disabled="mappingForm.processing" :aria-busy="mappingForm.processing ? 'true' : undefined">Neu prüfen</button>
                    <p v-if="mappingForm.isDirty" class="adm-note">Die Zuordnung ist geändert. Prüf neu, bevor du importierst.</p>
                </div>
            </form>
        </section>

        <p class="im-back"><Link href="/admin/katalog/import">Zurück zum Import</Link></p>

        <AdminConfirm v-model:open="confirmOpen" :title="confirmText.title" :body="confirmText.body" :confirm-label="confirmText.label" :busy="busy" @confirm="runStep" />
    </AdminPage>
</template>

<style scoped>
.im-state {
    margin-bottom: var(--sp-16);
}

.ir-counts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--sp-16);
    max-width: var(--adm-form-max);
    margin: 0 0 var(--sp-16);
}

.ir-count {
    padding-top: var(--sp-8);
    border-top: 1px solid var(--c-line);
}

.ir-count dt {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.ir-count dd {
    margin: var(--sp-4) 0 0;
    font-size: var(--fs-h3);
    line-height: var(--lh-h3);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.ir-count--bad {
    border-top-color: var(--c-bad);
}

.ir-rows {
    margin-top: var(--sp-16);
}

.ir-sku {
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
}

.ir-label,
.ir-detail {
    overflow-wrap: anywhere;
}

.ir-line {
    display: block;
}

.ir-map {
    display: grid;
    gap: var(--sp-16);
}

.ir-field {
    font-weight: 500;
}

.ir-req {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.ir-select {
    min-width: 20ch;
}

.ir-example {
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}

.ir-decimal {
    max-width: 36ch;
}

.ir-map__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-12);
}

.im-back {
    margin: var(--sp-32) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

@media (max-width: 767px) {
    .ir-counts {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ir-select {
        width: 100%;
        min-width: 0;
    }

    .ir-map__actions .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
