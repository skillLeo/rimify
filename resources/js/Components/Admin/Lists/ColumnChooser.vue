<script setup lang="ts">
/**
 * „Spalten“: which columns of a list this person sees (docs/admin/rest-build-plan.md, step 2.2).
 *
 * A menu of the list's columns, each with a tick; the column that names the row cannot be taken
 * away. A change shows at once and is kept on the account behind it (AdminLists on the server), so
 * the list opens the same way next time, on any machine. „Standard“ puts back the list's own set.
 * The menu stays open while columns are ticked — choosing three columns is one visit, not three.
 *
 * While an open view shows its own columns („Spalten mitspeichern“), the menu changes those: the
 * change stays on screen, the view reads as changed, and its owner can save it into the view. The
 * person's own set is not touched.
 */

import { DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuItemIndicator, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import Icon from '../AdminIcon.vue'
import { savePreference } from '../../../composables/admin/preferences'
import { nextRev } from '../../../composables/admin/railResize'
import type { ListColumn } from '../../../types/admin/lists'

const props = defineProps<{
    list: string
    columns: ListColumn[]
    /** The list's own set, for „Standard“. */
    defaults: string[]
    /** The column the list is sorted by: shown and fixed while the sort lasts. */
    sorted?: string | null
    /** Whose columns these are: the person's own (kept on the account), or the open view's. */
    owner?: 'person' | 'view'
}>()

const fixed = (column: ListColumn): boolean => column.required || column.key === props.sorted

const shown = defineModel<string[]>('shown', { required: true })

function inOrder(keys: Set<string>): string[] {
    return props.columns.filter((column) => column.required || keys.has(column.key)).map((column) => column.key)
}

/* Each save carries a revision that only grows: two quick ticks whose requests overtake each other
   leave the later choice stored, not the earlier (AdminUser::rememberColumns). */
let rev = 0

function choose(next: string[]): void {
    shown.value = next

    // A view's columns are the view's to keep („Änderungen speichern“), never the account's.
    if (props.owner !== 'view') {
        rev = nextRev(rev, Date.now())
        void savePreference({ list: props.list, columns: next, rev })
    }
}

function toggle(column: ListColumn, on: boolean): void {
    if (fixed(column)) {
        return
    }

    const keys = new Set(shown.value)

    if (on) {
        keys.add(column.key)
    } else {
        keys.delete(column.key)
    }

    choose(inOrder(keys))
}

function isDefault(): boolean {
    return shown.value.join() === props.defaults.join()
}
</script>

<template>
    <DropdownMenuRoot>
        <DropdownMenuTrigger class="btn btn--secondary lc-trigger">
            <Icon name="columns" :size="20" />
            Spalten
            <Icon name="chevron-down" :size="16" />
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
            <DropdownMenuContent class="adm-menu lc-menu" align="end" :side-offset="8">
                <DropdownMenuLabel class="adm-menu__caption">{{ owner === 'view' ? 'Spalten dieser Ansicht' : 'Spalten in der Liste' }}</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                    v-for="column in columns"
                    :key="column.key"
                    class="adm-menu__item lc-item"
                    :model-value="fixed(column) || shown.includes(column.key)"
                    :disabled="fixed(column)"
                    @update:model-value="(on: boolean | 'indeterminate') => toggle(column, on === true)"
                    @select="(event: Event) => event.preventDefault()"
                >
                    <span class="lc-tick" aria-hidden="true">
                        <DropdownMenuItemIndicator>
                            <Icon name="check" :size="16" />
                        </DropdownMenuItemIndicator>
                    </span>
                    {{ column.label }}
                    <span v-if="column.required" class="lc-note">immer sichtbar</span>
                    <span v-else-if="column.key === sorted" class="lc-note">danach sortiert</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator class="adm-menu__sep" />
                <DropdownMenuItem class="adm-menu__item" :disabled="isDefault()" @select="choose([...defaults])">
                    <span class="lc-tick" aria-hidden="true" />
                    Standard wiederherstellen
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>

<style scoped>
.lc-menu {
    min-width: 240px;
}

.lc-tick {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: var(--sp-20);
    color: var(--c-blue);
}

.lc-note {
    margin-left: auto;
    padding-left: var(--sp-12);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

/* The fixed column: readable, quiet, and not a busy cursor (the menu's `[data-disabled]` default
   means "wait"); its tick is not the accent — it cannot be changed. */
.lc-item[data-disabled] {
    color: var(--c-ink-2);
}

.lc-menu [data-disabled] {
    cursor: default;
}

.lc-item[data-disabled] .lc-tick {
    color: var(--c-ink-3);
}

.lc-trigger[data-state='open'] {
    border-color: var(--c-ink);
}
</style>
