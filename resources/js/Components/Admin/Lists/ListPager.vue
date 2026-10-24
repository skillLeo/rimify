<script setup lang="ts">
/**
 * The way through a long list, page by page (ListPaging.php): „Vorherige“, where one is, and „Nächste“ — as the lists of
 * Felgen and Reifen have always drawn it. Shown only where there is more than one page.
 */

import { Link } from '@inertiajs/vue3'
import Icon from '../AdminIcon.vue'
import { decimal } from '../../../format'

export interface ListPagination {
    current: number
    last: number
    total: number
    prev: string | null
    next: string | null
}

defineProps<{
    pagination: ListPagination
    /** What the pages are of, for a screen reader: „Seiten der Bewertungen“. */
    label: string
}>()
</script>

<template>
    <nav v-if="pagination.last > 1" class="lp" :aria-label="label">
        <Link v-if="pagination.prev" :href="pagination.prev" class="btn btn--secondary" preserve-scroll>
            <Icon name="chevron-left" :size="16" />
            Vorherige
        </Link>
        <span v-else aria-hidden="true" />
        <p class="lp__where">Seite {{ decimal(pagination.current, 0) }} von {{ decimal(pagination.last, 0) }}</p>
        <Link v-if="pagination.next" :href="pagination.next" class="btn btn--secondary" preserve-scroll>
            Nächste
            <Icon name="chevron-right" :size="16" />
        </Link>
        <span v-else aria-hidden="true" />
    </nav>
</template>

<style scoped>
.lp {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
    margin-top: var(--sp-24);
}

.lp__where {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}
</style>
