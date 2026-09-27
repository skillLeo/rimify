<script setup lang="ts">
/**
 * Gutachten › one document — the workspace the compliance team enters a Gutachten in (the review
 * release §4.3): its facts and PDF, the Verwendungsbereich rows grouped by vehicle, the form that adds
 * rows for vehicles × sizes, the preview of what the shop will say, and the Freigabe.
 *
 * The Freigabe is the document's, never a row's: all rows become visible at once. What stops it is
 * said above the rows. A page number on a row opens the PDF at that page.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage, { type AdminPageAction } from '../../../Components/Admin/AdminPage.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'
import type { AdminGutachtenShowProps, FitmentRowView, RowForm } from '../../../types/admin/gutachten'
import FactsDialog from './FactsDialog.vue'
import RowComposer from './RowComposer.vue'
import RowFields from './RowFields.vue'
import { formFromRow, payload, unreadable } from './rows'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminGutachtenShowProps>()

const page = usePage()
const draft = computed(() => props.document.status === 'draft')

const context = computed(() => {
    const n = props.rows.length
    const rows = n === 1 ? '1 Zeile' : `${decimal(n, 0)} Zeilen`

    return `${props.document.statusLabel} · ${rows} · Fassung ${props.document.revision}`
})

/** Rows by vehicle, in the order the server sent them. */
const groups = computed(() => {
    const out: { vehicleId: number; vehicle: string; rows: FitmentRowView[] }[] = []

    for (const row of props.rows) {
        const last = out[out.length - 1]

        if (last && last.vehicleId === row.vehicleId) {
            last.rows.push(row)
        } else {
            out.push({ vehicleId: row.vehicleId, vehicle: row.vehicle, rows: [row] })
        }
    }

    return out
})

function pageHref(n: number | null): string | null {
    return props.document.pdfUrl && n !== null ? `${props.document.pdfUrl}#page=${n}` : null
}

const releaseError = computed(() => ((page.props.errors ?? {}) as Record<string, string | undefined>).release ?? '')

/* ── Facts ─────────────────────────────────────────────────────────────────── */

const factsOpen = ref(false)

const more = computed<AdminPageAction[]>(() => {
    const actions: AdminPageAction[] = []

    if (props.document.pdfUrl) {
        actions.push({ label: 'PDF öffnen', href: props.document.pdfUrl, icon: 'documents' })
    }

    if (props.can.edit) {
        actions.push({ label: 'Angaben ändern', run: () => (factsOpen.value = true), icon: 'edit' })
    }

    return actions
})

/* ── Freigabe ──────────────────────────────────────────────────────────────── */

const releaseOpen = ref(false)
const releasing = ref(false)

function release(): void {
    releasing.value = true
    router.post(`/admin/gutachten/${props.document.id}/freigeben`, {}, {
        preserveScroll: true,
        onFinish: () => {
            releasing.value = false
            releaseOpen.value = false
        },
    })
}

/* ── One row: change or take out ──────────────────────────────────────────── */

const editing = ref<FitmentRowView | null>(null)
const editForm = ref<RowForm | null>(null)
const editErrors = ref<Record<string, string | undefined>>({})
const editBusy = ref(false)
const editOpen = computed({
    get: () => editing.value !== null,
    set: (open: boolean) => {
        if (!open) {
            editing.value = null
        }
    },
})

function edit(row: FitmentRowView): void {
    editing.value = row
    editForm.value = formFromRow(row)
    editErrors.value = {}
}

function saveRow(): void {
    const row = editing.value
    const form = editForm.value

    if (!row || !form || unreadable(form).length > 0) {
        return
    }

    editBusy.value = true
    router.put(`/admin/gutachten/${props.document.id}/zeilen/${row.id}`, payload(form) as never, {
        preserveScroll: true,
        onSuccess: () => (editing.value = null),
        onError: (bag) => (editErrors.value = bag),
        onFinish: () => (editBusy.value = false),
    })
}

const removing = ref<FitmentRowView | null>(null)
const removeOpen = computed({
    get: () => removing.value !== null,
    set: (open: boolean) => {
        if (!open) {
            removing.value = null
        }
    },
})

function remove(): void {
    const row = removing.value

    if (!row) {
        return
    }

    router.delete(`/admin/gutachten/${props.document.id}/zeilen/${row.id}`, {
        preserveScroll: true,
        onFinish: () => (removing.value = null),
    })
}

/* ── Preview ───────────────────────────────────────────────────────────────── */

const previewVehicle = ref<number | null>(props.previewVehicle)
const previewBusy = ref(false)

function loadPreview(): void {
    if (previewVehicle.value === null) {
        return
    }

    previewBusy.value = true
    router.reload({
        only: ['preview', 'previewVehicle'],
        data: { fahrzeug: previewVehicle.value },
        onFinish: () => (previewBusy.value = false),
    })
}

const TONE: Record<string, string | null> = {
    PERMITTED: null,
    CONDITIONAL: 'adm-tag adm-tag--warn',
    NOT_PERMITTED: 'adm-tag adm-tag--bad',
    UNKNOWN: 'adm-tag adm-tag--neutral',
}
</script>

<template>
    <AdminPage :title="document.label" :context="context" :more="more" :read-only="!can.edit && draft">
        <template v-if="can.release" #primary>
            <button class="btn btn--primary" type="button" :disabled="blockers.length > 0" @click="releaseOpen = true">
                <Icon name="publish" :size="20" />
                Freigeben
            </button>
        </template>

        <!-- ── The state of the document ─────────────────────────────── -->
        <section class="gs-state" :class="{ 'gs-state--blocked': draft && blockers.length }" aria-labelledby="gs-state-h">
            <h2 id="gs-state-h" class="gs-state__title">
                <template v-if="draft && blockers.length">Noch nicht freigebbar</template>
                <template v-else-if="draft">Kann freigegeben werden</template>
                <template v-else>{{ document.statusLabel }}<template v-if="document.validFrom"> seit {{ document.validFrom }}</template></template>
            </h2>
            <ul v-if="draft && blockers.length" class="gs-state__list">
                <li v-for="line in blockers" :key="line">{{ line }}</li>
            </ul>
            <p v-else-if="draft" class="adm-note">Mit der Freigabe gelten alle {{ rows.length === 1 ? 'eine Zeile' : `${decimal(rows.length, 0)} Zeilen` }} auf einmal im Shop. Prüf sie vorher in der Vorschau unten.</p>
            <p v-else-if="document.status === 'superseded'" class="adm-note">Eine neuere Fassung hat dieses Dokument ersetzt. Seine Zeilen sind nicht mehr im Shop; Bestellungen darauf bleiben erklärbar.</p>
            <p v-else class="adm-note">Ein freigegebenes Gutachten ändert sich nicht mehr. Für Änderungen legst du eine neue Fassung an, die es ersetzt.</p>
            <p v-if="openConflicts" class="adm-note">{{ openConflicts === 1 ? 'Eine Zeile widerspricht' : `${decimal(openConflicts, 0)} Zeilen widersprechen` }} einem anderen Gutachten. Bis zur Klärung gilt die strengere Angabe.</p>
            <p v-if="releaseError" class="adm-alert" role="alert">{{ releaseError }}</p>
        </section>

        <!-- ── Facts ─────────────────────────────────────────────────── -->
        <section class="adm-section" aria-labelledby="gs-facts-h">
            <div class="adm-section__head">
                <h2 id="gs-facts-h" class="adm-section__title">Angaben</h2>
                <button v-if="can.edit" class="btn btn--ghost" type="button" @click="factsOpen = true">
                    <Icon name="edit" :size="20" />
                    Ändern
                </button>
            </div>
            <dl class="adm-facts gs-facts">
                <div class="adm-facts__row"><dt>Art</dt><dd>{{ document.kindLabel }}</dd></div>
                <div v-if="document.kbaNumber" class="adm-facts__row"><dt>KBA-Nummer</dt><dd>{{ document.kbaNumber }}</dd></div>
                <div v-if="document.reportNumber" class="adm-facts__row"><dt>Gutachten-Nummer</dt><dd>{{ document.reportNumber }}</dd></div>
                <div v-if="document.approvalMark" class="adm-facts__row"><dt>Genehmigungszeichen</dt><dd>{{ document.approvalMark }}</dd></div>
                <div class="adm-facts__row"><dt>Aussteller</dt><dd>{{ document.issuer || '–' }}</dd></div>
                <div class="adm-facts__row"><dt>Ausgestellt am</dt><dd>{{ document.issuedOnLabel ?? '–' }}</dd></div>
                <div class="adm-facts__row"><dt>Seiten</dt><dd>{{ document.pageCount ?? '–' }}</dd></div>
                <div class="adm-facts__row"><dt>Fassung</dt><dd>{{ document.revision }}<template v-if="document.supersedesLabel"> · ersetzt {{ document.supersedesLabel }}</template></dd></div>
                <div class="adm-facts__row">
                    <dt>PDF</dt>
                    <dd>
                        <a v-if="document.pdfUrl" :href="document.pdfUrl" target="_blank" rel="noopener">PDF öffnen</a>
                        <template v-else>Kein PDF hinterlegt</template>
                    </dd>
                </div>
            </dl>
        </section>

        <!-- ── Verwendungsbereich ────────────────────────────────────── -->
        <section class="adm-section" aria-labelledby="gs-rows-h">
            <div class="adm-section__head">
                <h2 id="gs-rows-h" class="adm-section__title">Verwendungsbereich</h2>
            </div>

            <p v-if="rows.length === 0" class="adm-note">Noch keine Zeile. {{ can.edit ? 'Leg unten die ersten an: Fahrzeuge und Größen wählen, Reifengrößen und Auflagen eintragen.' : '' }}</p>

            <div v-for="group in groups" :key="group.vehicleId" class="gs-group">
                <h3 class="gs-group__title">{{ group.vehicle }}</h3>
                <div class="adm-panel">
                    <table class="adm-table gs-table">
                        <caption class="visually-hidden">Zeilen für {{ group.vehicle }}</caption>
                        <thead>
                            <tr>
                                <th scope="col">Felge</th>
                                <th scope="col">Reifen</th>
                                <th scope="col">Auflagen</th>
                                <th scope="col">Eintragung</th>
                                <th scope="col" class="num">Seite</th>
                                <th v-if="can.edit" scope="col"><span class="visually-hidden">Aktionen</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in group.rows" :key="row.id">
                                <td data-label="Felge">
                                    <span class="gs-wheel">{{ row.wheel }}</span>
                                    <span class="gs-sub">{{ row.size }}<template v-if="row.finish"> · {{ row.finish }}</template><template v-if="row.axle !== 'ALL'"> · {{ row.axleLabel }}</template></span>
                                </td>
                                <td data-label="Reifen">
                                    <span>
                                        <span v-for="size in row.tyreSizes" :key="size.label" class="gs-line">{{ size.label }}</span>
                                    </span>
                                </td>
                                <td data-label="Auflagen">
                                    <span v-if="row.conditions.length === 0">–</span>
                                    <span v-else>
                                        <span v-for="c in row.conditions" :key="c.id" class="gs-line">{{ c.text }}<template v-if="c.note"> {{ c.note }}</template></span>
                                    </span>
                                </td>
                                <td data-label="Eintragung">{{ row.requiresEntry ? 'Ja' : 'Nein' }}</td>
                                <td data-label="Seite" class="num">
                                    <a v-if="pageHref(row.sourcePage)" :href="pageHref(row.sourcePage)!" target="_blank" rel="noopener">S. {{ row.sourcePage }}</a>
                                    <template v-else>{{ row.sourcePage ?? '–' }}</template>
                                </td>
                                <td v-if="can.edit" data-label="Aktionen" class="gs-actions">
                                    <button class="adm-iconbtn" type="button" :aria-label="`Zeile ${row.wheel} ${row.size} ändern`" title="Ändern" @click="edit(row)">
                                        <Icon name="edit" :size="20" />
                                    </button>
                                    <button class="adm-iconbtn" type="button" :aria-label="`Zeile ${row.wheel} ${row.size} entfernen`" title="Entfernen" @click="removing = row">
                                        <Icon name="delete" :size="20" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <section v-if="can.edit" class="adm-section" aria-labelledby="gs-add-h">
            <div class="adm-section__head">
                <h2 id="gs-add-h" class="adm-section__title">Zeilen hinzufügen</h2>
            </div>
            <RowComposer :document-id="document.id" :conditions="conditions" :page-count="document.pageCount" />
        </section>

        <!-- ── Preview ───────────────────────────────────────────────── -->
        <section v-if="vehicles.length" class="adm-section" aria-labelledby="gs-preview-h">
            <div class="adm-section__head">
                <h2 id="gs-preview-h" class="adm-section__title">Vorschau im Shop</h2>
            </div>
            <p class="adm-note">So antwortet der Shop{{ draft ? ' nach der Freigabe' : '' }} für dieses Fahrzeug – berechnet von derselben Prüfung, die jede Kundin und jeder Kunde bekommt.</p>
            <form class="gs-preview-pick" @submit.prevent="loadPreview">
                <label class="visually-hidden" for="gs-preview-vehicle">Fahrzeug für die Vorschau</label>
                <select id="gs-preview-vehicle" v-model="previewVehicle" class="input">
                    <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.label }}</option>
                </select>
                <button class="btn btn--secondary" type="submit" :disabled="previewBusy" :aria-busy="previewBusy ? 'true' : undefined">Vorschau zeigen</button>
            </form>

            <ul v-if="preview && preview.length" class="gs-verdicts" aria-live="polite">
                <li v-for="verdict in preview" :key="verdict.config" class="gs-verdict">
                    <div class="gs-verdict__head">
                        <span class="gs-verdict__wheel">{{ verdict.wheel }}</span>
                        <span v-if="TONE[verdict.status]" :class="TONE[verdict.status]">{{ verdict.statusLabel }}</span>
                        <span v-else class="gs-verdict__ok">{{ verdict.statusLabel }}</span>
                    </div>
                    <p v-if="verdict.reason" class="gs-verdict__line">{{ verdict.reason }}</p>
                    <p v-if="verdict.front.length" class="gs-verdict__line">Reifen: {{ verdict.front.join(', ') }}<template v-if="verdict.rear.length && verdict.rear.join() !== verdict.front.join()"> · hinten {{ verdict.rear.join(', ') }}</template></p>
                    <p v-if="verdict.requiresEntry" class="gs-verdict__line">Eintragung in die Fahrzeugpapiere erforderlich.<template v-if="verdict.entryNote"> {{ verdict.entryNote }}</template></p>
                    <p v-for="sentence in verdict.conditions" :key="sentence" class="gs-verdict__line">{{ sentence }}</p>
                </li>
            </ul>
            <p v-else-if="preview" class="adm-note">Für dieses Fahrzeug gibt es in diesem Gutachten keine Zeile.</p>
        </section>

        <AdminConfirm
            v-model:open="releaseOpen"
            title="Gutachten freigeben?"
            :body="`Alle ${rows.length === 1 ? 'eine Zeile' : `${decimal(rows.length, 0)} Zeilen`} gelten danach sofort im Shop. Ein freigegebenes Gutachten ändert sich nicht mehr; Änderungen kommen mit einer neuen Fassung.`"
            confirm-label="Freigeben"
            :busy="releasing"
            @confirm="release"
        />

        <AdminConfirm
            v-model:open="removeOpen"
            title="Zeile entfernen?"
            :body="removing ? `${removing.wheel} ${removing.size} für ${removing.vehicle} wird aus dem Verwendungsbereich entfernt.` : ''"
            confirm-label="Entfernen"
            @confirm="remove"
        />

        <Dialog v-model:open="editOpen" title="Zeile ändern" :description="editing ? `${editing.vehicle} · ${editing.wheel} ${editing.size}` : undefined" content-class="adm-dialog gs-dialog" wide>
            <RowFields v-if="editForm" v-model:form="editForm" :conditions="conditions" :errors="editErrors" id-prefix="gs-edit" :page-count="document.pageCount" />
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="editOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="button" :disabled="editBusy" :aria-busy="editBusy ? 'true' : undefined" @click="saveRow">Speichern</button>
            </template>
        </Dialog>

        <FactsDialog v-if="can.edit" v-model:open="factsOpen" :document="document" :kinds="kinds" :replaceable="replaceable" />
    </AdminPage>
</template>

<style scoped>
.gs-state {
    display: grid;
    gap: var(--sp-8);
    max-width: var(--adm-form-max);
    margin-bottom: var(--sp-32);
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.gs-state--blocked {
    background: var(--c-warn-tint);
}

.gs-state__title {
    margin: 0;
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
}

.gs-state__list {
    margin: 0;
    padding-left: var(--sp-20);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.gs-state .adm-alert {
    margin: 0;
}

.gs-facts {
    max-width: var(--adm-form-max);
}

.gs-group + .gs-group {
    margin-top: var(--sp-24);
}

.gs-group__title {
    margin: 0 0 var(--sp-8);
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
    overflow-wrap: anywhere;
}

.gs-wheel {
    font-weight: 500;
}

.gs-sub {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.gs-line {
    display: block;
}

.gs-actions {
    white-space: nowrap;
    text-align: right;
}

.gs-preview-pick {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    max-width: var(--adm-form-max);
    margin-block: var(--sp-12) var(--sp-16);
}

.gs-preview-pick .input {
    flex: 1 1 24ch;
    min-width: 0;
}

.gs-verdicts {
    display: grid;
    gap: 0;
    max-width: var(--adm-form-max);
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.gs-verdict {
    display: grid;
    gap: var(--sp-4);
    padding-block: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
}

.gs-verdict__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8);
}

.gs-verdict__wheel {
    font-weight: 500;
}

.gs-verdict__ok {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.gs-verdict__line {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

@media (max-width: 767px) {
    .gs-preview-pick .btn {
        width: 100%;
        min-height: var(--adm-control-h-lg);
    }
}
</style>
