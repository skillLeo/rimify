<script setup lang="ts">
/**
 * Gutachten › Dokumente: every approval document on file.
 *
 * The Freigaben column shows published against total on purpose: a document with twenty rows
 * entered and none published is the most common half-finished state in this workflow, and it is
 * invisible unless the list says so.
 *
 * Status and type narrow the list in place. A draft renders neutral, never red: "not yet checked"
 * is not "refused" (R-03, R-07). Nothing on file and nothing matching the filters are two different
 * states with two different sentences (admin-shell.md §9.3).
 */

import { computed, ref } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
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

const context = computed(() => {
    const total = props.documents.length

    if (total === 0) {
        return 'Noch kein Dokument erfasst'
    }

    const published = props.documents.filter((d) => d.status === 'published').length

    return `${total} ${total === 1 ? 'Dokument' : 'Dokumente'} · ${published} veröffentlicht`
})
</script>

<template>
    <AdminPage title="Dokumente" :context="context">
        <div v-if="documents.length > 0" class="adm-filters">
            <div class="adm-filter" role="group" aria-label="Status">
                <span class="adm-filter__label" aria-hidden="true">Status</span>
                <button class="adm-chip" type="button" :aria-pressed="status === null" @click="status = null">Alle</button>
                <button
                    v-for="option in statusOptions"
                    :key="option.value"
                    class="adm-chip"
                    type="button"
                    :aria-pressed="status === option.value"
                    @click="status = status === option.value ? null : option.value"
                >
                    {{ statusOf(option.value).label }}
                    <span class="adm-chip__n">{{ option.count }}</span>
                </button>
            </div>

            <div class="adm-filter" role="group" aria-label="Art">
                <span class="adm-filter__label" aria-hidden="true">Art</span>
                <button class="adm-chip" type="button" :aria-pressed="kind === null" @click="kind = null">Alle</button>
                <button
                    v-for="option in kindOptions"
                    :key="option.value"
                    class="adm-chip"
                    type="button"
                    :aria-pressed="kind === option.value"
                    @click="kind = kind === option.value ? null : option.value"
                >
                    {{ KIND_LABEL[option.value] ?? option.value }}
                    <span class="adm-chip__n">{{ option.count }}</span>
                </button>
            </div>
        </div>

        <div v-if="rows.length > 0" class="adm-panel">
            <table class="adm-table">
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
                            <span class="adm-table__key">{{ doc.reportNumber }}</span>
                            <span v-if="doc.kbaNumber" class="adm-table__sub">KBA {{ doc.kbaNumber }}</span>
                        </td>
                        <td data-label="Art">{{ KIND_LABEL[doc.kind] ?? doc.kind }}</td>
                        <td data-label="Aussteller">{{ doc.issuer }}</td>
                        <td data-label="Ausgestellt" class="num">{{ doc.issuedOn ?? '–' }}</td>
                        <td data-label="Status">
                            <span>
                                <span class="tag" :class="statusOf(doc.status).cls">{{ statusOf(doc.status).label }}</span>
                                <span class="adm-table__sub">Fassung {{ doc.revision }}</span>
                            </span>
                        </td>
                        <td data-label="Freigaben" class="num">{{ doc.publishedCount }} von {{ doc.fitmentCount }} veröffentlicht</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <AdminState v-else-if="documents.length === 0" kind="empty" text="Gutachten erfasst das Compliance-Team; jedes erscheint hier mit seinen Freigaben." />

        <AdminState v-else kind="filtered" :total="documents.length" @reset="resetFilters" />
    </AdminPage>
</template>
