<script setup lang="ts">
/**
 * „Zu erledigen“: one list of everything waiting on this role — orders to send, Gutachten to check,
 * customers waiting on a document, failed jobs — each with its kind as a chip, the oldest first,
 * each row the link to where it is done.
 */

import { Link } from '@inertiajs/vue3'
import Icon from '../../Ui/Icon.vue'
import type { TodoItem } from '../../../types/admin/uebersicht'

defineProps<{ items: TodoItem[] }>()
</script>

<template>
    <ul class="todo">
        <li v-for="item in items" :key="item.key" class="todo__row">
            <span class="todo__type">{{ item.type }}</span>
            <span class="todo__text">
                <Link :href="item.href" class="todo__link">{{ item.title }}</Link>
                <span v-if="item.detail" class="todo__detail">{{ item.detail }}</span>
            </span>
            <time class="todo__age" :datetime="item.iso ?? undefined">{{ item.ago ?? '' }}</time>
            <Icon class="todo__go" name="chevron-right" :size="16" />
        </li>
    </ul>
</template>

<style scoped>
.todo {
    margin: 0 calc(-1 * var(--sp-20));
    padding: 0;
    list-style: none;
}

.todo__row {
    position: relative;
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: var(--sp-12);
    min-height: var(--adm-control-h-lg);
    padding: var(--sp-8) var(--sp-20);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
}

.todo__row:last-child {
    border-bottom: 0;
}

@media (hover: hover) and (pointer: fine) {
    .todo__row:hover {
        background: var(--c-band);
    }
}

.todo__row:focus-within {
    background: var(--c-band);
}

.todo__row:has(.todo__link:focus-visible) {
    box-shadow: var(--adm-row-focus);
}

/* The kind as a quiet text chip: the list is one list, the chip says which of its kinds a row is. */
.todo__type {
    justify-self: start;
    padding: 2px var(--sp-8);
    border: 1px solid var(--c-line);
    border-radius: var(--r-round);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 500;
    color: var(--c-ink-2);
    white-space: nowrap;
}

.todo__text {
    display: grid;
    min-width: 0;
}

.todo__link {
    overflow: hidden;
    font-weight: 600;
    color: var(--c-ink);
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
    outline: none;
}

.todo__link::after {
    content: '';
    position: absolute;
    inset: 0;
}

.todo__detail {
    overflow: hidden;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
    text-overflow: ellipsis;
    white-space: nowrap;
}

.todo__age {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-variant-numeric: tabular-nums;
    color: var(--c-ink-3);
    white-space: nowrap;
}

.todo__go {
    color: var(--c-ink-3);
}
</style>
