<script setup lang="ts">
/**
 * Gutachten-Erfassung, list view.
 *
 * The count column shows published against total on purpose: a document with twenty rows entered
 * and none published is the most common half-finished state in this workflow, and it is invisible
 * unless the list says so.
 */

import { Head } from '@inertiajs/vue3'
import Icon from '../../../Components/Art/Icon.vue'
import type { AdminGutachtenProps } from '../../../types/pages'

defineProps<AdminGutachtenProps>()

const KIND_LABEL: Record<string, string> = {
    ABE: 'ABE',
    TEILEGUTACHTEN: 'Teilegutachten',
    ECE: 'ECE',
    EC: 'EG-Genehmigung',
}

const STATUS_CLASS: Record<string, string> = {
    published: 'tag--ok',
    draft: 'tag--unknown',
    superseded: 'tag--warn',
    withdrawn: 'tag--danger',
}
</script>

<template>
    <Head title="Gutachten" />

    <div class="card">
        <div class="between gut__head">
            <span class="micro">{{ documents.length }} Dokumente</span>
            <button class="btn btn--primary btn--sm" type="button">
                <Icon name="plus" :size="20" /> Gutachten erfassen
            </button>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th scope="col">Nummer</th>
                    <th scope="col">Art</th>
                    <th scope="col">Aussteller</th>
                    <th scope="col">Ausgestellt</th>
                    <th scope="col">Status</th>
                    <th scope="col" class="num">Freigaben</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="doc in documents" :key="doc.id">
                    <td>
                        <p class="gut__num">{{ doc.reportNumber }}</p>
                        <span v-if="doc.kbaNumber" class="data">KBA {{ doc.kbaNumber }}</span>
                    </td>
                    <td>{{ KIND_LABEL[doc.kind] ?? doc.kind }}</td>
                    <td>{{ doc.issuer }}</td>
                    <td class="data">{{ doc.issuedOn ?? '—' }}</td>
                    <td>
                        <span class="tag" :class="STATUS_CLASS[doc.status] ?? 'tag--unknown'">
                            {{ doc.status }}
                        </span>
                        <span class="data gut__rev">Fassung {{ doc.revision }}</span>
                    </td>
                    <td class="num data">{{ doc.publishedCount }} / {{ doc.fitmentCount }}</td>
                </tr>
            </tbody>
        </table>

        <p v-if="documents.length === 0" class="quiet gut__empty">
            Noch keine Gutachten erfasst.
        </p>
    </div>
</template>

<style scoped>
.gut__head {
    margin-bottom: var(--s4);
}

.gut__num {
    margin: 0;
    font-weight: 700;
}

.gut__rev {
    display: block;
    margin-top: 4px;
}

.gut__empty {
    margin: var(--s5) 0 0;
    text-align: center;
}
</style>
