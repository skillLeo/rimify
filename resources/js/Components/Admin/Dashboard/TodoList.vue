<script setup lang="ts">
/**
 * „Zu erledigen“: one list of everything waiting on this role — orders to send, Gutachten to check,
 * customers waiting on a document, failed jobs — the oldest first, each row the link to where it is
 * done. Its kind is a tag only while the list holds more than one kind: a column that says the same
 * word on every row says nothing.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../AdminIcon.vue'
import type { TodoItem } from '../../../types/admin/uebersicht'

const props = defineProps<{ items: TodoItem[] }>()

const mixed = computed(() => new Set(props.items.map((item) => item.type)).size > 1)
</script>

<template>
    <ul class="todo" :class="{ 'todo--one-kind': !mixed }">
        <li v-for="item in items" :key="item.key" class="todo__row">
            <span v-if="mixed" class="todo__type adm-tag adm-tag--neutral">{{ item.type }}</span>
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
    margin: 0 calc(-1 * var(--adm-card-pad));
    padding: 0;
    list-style: none;
}

.todo__row {
    position: relative;
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: var(--sp-12);
    /* One line, 44 px, like the orders beside it (the brief's table row); a long title wraps rather
       than being cut, and the phone stacks the row. */
    min-height: var(--adm-row-h-dash);
    padding: var(--sp-4) var(--adm-card-pad);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
}

.todo__row:last-child {
    border-bottom: 0;
}

.todo--one-kind .todo__row {
    grid-template-columns: minmax(0, 1fr) auto auto;
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

/* The kind as the admin's one quiet tag (.adm-tag): the list is one list, the tag says which of its
   kinds a row is. */
.todo__type {
    justify-self: start;
}

/* The title, then what it is about, on the one line: the detail gives way first. */
.todo__text {
    display: flex;
    align-items: baseline;
    gap: var(--sp-8);
    min-width: 0;
}

/* The title is never cut: it wraps if it must. Only the detail after it gives way. */
.todo__link {
    flex: 0 1 auto;
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
}

.todo__detail {
    flex: 1 1 0;
    min-width: 0;
}

.todo__link {
    font-weight: 600;
    color: var(--c-ink);
    text-decoration: none;
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

/* A phone: the kind and the age share the first line, so the title has the width it needs. */
@media (max-width: 767px) {
    .todo__row {
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: var(--sp-4) var(--sp-8);
        height: auto;
        padding-block: var(--sp-12);
    }

    .todo__type {
        grid-area: 1 / 1;
    }

    .todo__age {
        grid-area: 1 / 2;
    }

    .todo__go {
        grid-area: 1 / 3 / 3 / 4;
        align-self: center;
    }

    .todo__text {
        display: grid;
        grid-area: 2 / 1 / 3 / 3;
    }

    /* One kind: no tag line — the title leads, the age beside it. */
    .todo--one-kind .todo__text {
        grid-area: 1 / 1 / 3 / 2;
    }

    .todo--one-kind .todo__age {
        grid-area: 1 / 2;
    }
}
</style>
