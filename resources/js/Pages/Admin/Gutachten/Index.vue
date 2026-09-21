<script setup lang="ts">
/**
 * Gutachten-Erfassung, list view.
 *
 * The Freigaben column shows published against total on purpose: a document with twenty rows
 * entered and none published is the most common half-finished state in this workflow, and it is
 * invisible unless the list says so.
 *
 * Status and type narrow the list in place. A draft renders neutral, never red: "not yet checked"
 * is not "refused" (R-03, R-07).
 *
 * One table for every width. Below 900px each row lays itself out as a block — same fields, same
 * order — with its column name beside each value.
 */

import { Head } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import type { AdminGutachtenProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminGutachtenProps>()

const KIND_LABEL: Record<string, string> = {
    ABE: 'ABE',
    TEILEGUTACHTEN: 'Teilegutachten',
    ECE: 'ECE',
    EC: 'EG-Genehmigung',
}

const STATUS: Record<string, { label: string; cls: string }> = {
    published: { label: 'Veröffentlicht', cls: 'tag--ok' },
    draft: { label: 'Entwurf', cls: 'tag--unknown' },
    superseded: { label: 'Ersetzt', cls: 'tag--warn' },
    withdrawn: { label: 'Zurückgezogen', cls: 'tag--danger' },
}

function statusOf(status: string): { label: string; cls: string } {
    return STATUS[status] ?? { label: status, cls: 'tag--unknown' }
}

const status = ref<string | null>(null)
const kind = ref<string | null>(null)

/** Only the values that actually occur, each with its count. */
const statusOptions = computed(() => countBy((d) => d.status))
const kindOptions = computed(() => countBy((d) => d.kind))

function countBy(key: (d: AdminGutachtenProps['documents'][number]) => string): { value: string; count: number }[] {
    const counts = new Map<string, number>()

    for (const doc of props.documents) {
        counts.set(key(doc), (counts.get(key(doc)) ?? 0) + 1)
    }

    return [...counts.entries()].map(([value, count]) => ({ value, count }))
}

function resetFilters(): void {
    status.value = null
    kind.value = null
}

const rows = computed(() =>
    props.documents.filter(
        (d) => (status.value === null || d.status === status.value) && (kind.value === null || d.kind === kind.value)
    )
)
</script>

<template>
    <Head title="Gutachten" />

    <div class="gut__head">
        <h1 class="t-h1">Gutachten</h1>
        <p class="gut__count"><span class="tabular">{{ documents.length }}</span> Dokumente erfasst</p>
    </div>

    <div v-if="documents.length > 0" class="gut__filters">
        <div class="gut__filter" role="group" aria-label="Status">
            <span class="gut__filter-label">Status</span>
            <button
                class="pill"
                :class="{ 'pill--on': status === null }"
                type="button"
                :aria-pressed="status === null"
                @click="status = null"
            >
                Alle
            </button>
            <button
                v-for="option in statusOptions"
                :key="option.value"
                class="pill"
                :class="{ 'pill--on': status === option.value }"
                type="button"
                :aria-pressed="status === option.value"
                @click="status = status === option.value ? null : option.value"
            >
                {{ statusOf(option.value).label }}
                <span class="gut__n tabular">{{ option.count }}</span>
            </button>
        </div>

        <div class="gut__filter" role="group" aria-label="Art">
            <span class="gut__filter-label">Art</span>
            <button
                class="pill"
                :class="{ 'pill--on': kind === null }"
                type="button"
                :aria-pressed="kind === null"
                @click="kind = null"
            >
                Alle
            </button>
            <button
                v-for="option in kindOptions"
                :key="option.value"
                class="pill"
                :class="{ 'pill--on': kind === option.value }"
                type="button"
                :aria-pressed="kind === option.value"
                @click="kind = kind === option.value ? null : option.value"
            >
                {{ KIND_LABEL[option.value] ?? option.value }}
                <span class="gut__n tabular">{{ option.count }}</span>
            </button>
        </div>
    </div>

    <div class="gut__box">
        <table v-if="rows.length > 0" class="table gut__table">
            <thead>
                <tr>
                    <th scope="col">Nummer</th>
                    <th scope="col">Art</th>
                    <th scope="col">Aussteller</th>
                    <th scope="col" class="num">Ausgestellt</th>
                    <th scope="col">Status</th>
                    <th scope="col" class="num">Freigaben</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="doc in rows" :key="doc.id">
                    <td data-label="Nummer">
                        <div>
                            <span class="gut__num">{{ doc.reportNumber }}</span>
                            <span v-if="doc.kbaNumber" class="data gut__kba">KBA {{ doc.kbaNumber }}</span>
                        </div>
                    </td>
                    <td data-label="Art">{{ KIND_LABEL[doc.kind] ?? doc.kind }}</td>
                    <td data-label="Aussteller">{{ doc.issuer }}</td>
                    <td data-label="Ausgestellt" class="num data">{{ doc.issuedOn ?? '–' }}</td>
                    <td data-label="Status">
                        <div>
                            <span class="tag" :class="statusOf(doc.status).cls">{{ statusOf(doc.status).label }}</span>
                            <span class="data gut__rev">Fassung {{ doc.revision }}</span>
                        </div>
                    </td>
                    <td data-label="Freigaben" class="num data">
                        {{ doc.publishedCount }} von {{ doc.fitmentCount }} veröffentlicht
                    </td>
                </tr>
            </tbody>
        </table>

        <div v-else class="state gut__empty">
            <p class="state__title">
                {{ documents.length === 0 ? 'Noch keine Gutachten erfasst.' : 'Kein Gutachten passt zu diesen Filtern.' }}
            </p>
            <button
                v-if="documents.length > 0"
                class="btn btn--secondary"
                type="button"
                @click="resetFilters"
            >
                Filter zurücksetzen
            </button>
        </div>
    </div>
</template>

<style scoped>
.gut__head {
    margin-bottom: var(--space-4);
}

.gut__count {
    margin-top: var(--space-1);
    color: var(--ink2);
}

.gut__filters {
    display: grid;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
}

.gut__filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
}

.gut__filter-label {
    min-width: 56px;
    font-size: var(--text-small);
    font-weight: 700;
    color: var(--ink2);
}

.gut__n {
    font-family: var(--mono);
    font-weight: 500;
    color: var(--ink3);
}

.pill--on .gut__n {
    color: inherit;
}

.gut__box {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.gut__num {
    display: block;
    font-weight: 700;
}

.gut__kba,
.gut__rev {
    display: block;
    margin-top: var(--space-1);
}

.gut__empty {
    padding: var(--space-6) var(--space-5);
}

/* Below 900px: each row is a block, every value labelled with its column name. */
@media (max-width: 899px) {
    .gut__table thead {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }

    .gut__table,
    .gut__table tbody,
    .gut__table tr,
    .gut__table td {
        display: block;
    }

    .gut__table tr {
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--line);
    }

    .gut__table td {
        display: grid;
        grid-template-columns: 110px minmax(0, 1fr);
        gap: var(--space-3);
        height: auto;
        padding: var(--space-1) 0;
        border: 0;
        text-align: left;
    }

    .gut__table td::before {
        content: attr(data-label);
        font-size: var(--text-small);
        color: var(--ink2);
    }
}
</style>
