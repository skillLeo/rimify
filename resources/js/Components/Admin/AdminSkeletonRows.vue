<script setup lang="ts">
/**
 * A table that has not arrived yet, drawn at its real size (admin-shell.md §9.2): the same column
 * widths, the same row height, eight rows — a screen's worth, so the page does not grow when the
 * data lands. No spinner: the layout is already known, and a spinner over a known layout is an
 * apology for not having drawn it.
 *
 * `columns` are the table's own track sizes, one per column, so the placeholder and the table
 * cannot disagree about where a column starts.
 */

withDefaults(
    defineProps<{
        columns: string[]
        rows?: number
        /** Rows of two lines (a name and a detail) are 56 px, not 40. */
        twoLine?: boolean
    }>(),
    { rows: 8, twoLine: false }
)
</script>

<template>
    <div class="adm-skel" aria-busy="true">
        <span class="visually-hidden">Wird geladen …</span>
        <div
            v-for="row in rows"
            :key="row"
            class="adm-skel__row"
            :class="{ 'adm-skel__row--two': twoLine }"
            :style="{ gridTemplateColumns: columns.join(' ') }"
            aria-hidden="true"
        >
            <span v-for="(_, column) in columns" :key="column" class="adm-skel__cell">
                <span class="skeleton adm-skel__bar" />
                <span v-if="twoLine && column === 0" class="skeleton adm-skel__bar adm-skel__bar--sub" />
            </span>
        </div>
    </div>
</template>
