<script setup lang="ts">
/**
 * A column heading that sorts its list (F-32): pressed, the list orders by this column; pressed again, the other way.
 * The order lives in the address (`sort`, `richtung`), so a sorted list is a link, kept across its pages. The look is
 * Katalog › Felgen's, where sorting began.
 */

import Icon from './AdminIcon.vue'

const props = defineProps<{
    label: string
    column: string
    /** The list's order now. */
    sort: string
    richtung: 'auf' | 'ab'
    num?: boolean
    disabled?: boolean
}>()

const emit = defineEmits<{ sort: [column: string] }>()

const on = (): boolean => props.sort === props.column
</script>

<template>
    <th scope="col" :class="{ num }" :aria-sort="on() ? (richtung === 'auf' ? 'ascending' : 'descending') : undefined">
        <button class="adm-sort" type="button" :disabled="disabled" @click="emit('sort', column)">
            {{ label }}
            <Icon class="adm-sort__icon" :class="{ 'adm-sort__icon--on': on() }" :name="on() && richtung === 'auf' ? 'chevron-up' : 'chevron-down'" :size="16" />
        </button>
    </th>
</template>

<style scoped>
.adm-sort {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
}

.adm-sort__icon {
    color: var(--c-line-2);
}

.adm-sort__icon--on {
    color: var(--c-ink);
}

@media (hover: hover) and (pointer: fine) {
    .adm-sort:hover {
        color: var(--c-ink);
    }
}
</style>
