<script setup lang="ts">
/** Gutachten on a phone: cards, not a six-column table squeezed to 390px. */

import { Head } from '@inertiajs/vue3'
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

    <div class="stack">
        <article v-for="doc in documents" :key="doc.id" class="card mgut__card">
            <div class="between">
                <span class="mgut__num">{{ doc.reportNumber }}</span>
                <span class="tag" :class="STATUS_CLASS[doc.status] ?? 'tag--unknown'">
                    {{ doc.status }}
                </span>
            </div>
            <p class="mgut__issuer">{{ KIND_LABEL[doc.kind] ?? doc.kind }} · {{ doc.issuer }}</p>
            <p class="data">
                {{ doc.issuedOn ?? '—' }} · Fassung {{ doc.revision }} ·
                {{ doc.publishedCount }} / {{ doc.fitmentCount }} Freigaben
            </p>
        </article>

        <p v-if="documents.length === 0" class="quiet">Noch keine Gutachten erfasst.</p>
    </div>
</template>

<style scoped>
.mgut__card {
    padding: var(--space-3);
}

.mgut__num {
    font-weight: 700;
}

.mgut__issuer {
    margin: var(--space-2) 0 4px;
    font-size: 14px;
    color: var(--ink2);
}
</style>
