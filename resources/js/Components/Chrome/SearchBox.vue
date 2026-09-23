<script setup lang="ts">
/**
 * The header's search field: type, and the answer appears beneath it in four groups — Felgen,
 * Marken, Größen, Seiten. `/` from anywhere lands here. Arrow keys move through the list while the
 * field keeps focus; Enter opens the highlighted entry; Esc clears. When nothing matches, the
 * nearest name is offered — "Meintest du „BBS“?" — instead of an empty box.
 */

import { Link, router } from '@inertiajs/vue3'
import { onClickOutside } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'
import Icon from '../Ui/Icon.vue'
import { readRecent, remember, useSearch, type SearchItem } from '../../composables/useSearch'
import { useShell } from '../../composables/useShell'

const shell = useShell()
const search = useSearch()

const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const query = ref('')
const open = ref(false)
const active = ref(-1)
const recent = ref<string[]>([])

interface Row extends SearchItem {
    id: string
    group: string
}

const rows = computed<Row[]>(() => {
    const out: Row[] = []

    for (const group of search.result.value?.groups ?? []) {
        for (const [i, item] of group.items.entries()) {
            out.push({ ...item, id: `sb-${group.key}-${i}`, group: group.label })
        }
    }

    return out
})

const grouped = computed(() => {
    const out: { label: string; rows: Row[] }[] = []

    for (const row of rows.value) {
        const last = out[out.length - 1]

        if (last && last.label === row.group) {
            last.rows.push(row)
        } else {
            out.push({ label: row.group, rows: [row] })
        }
    }

    return out
})

const showRecent = computed(() => query.value.trim() === '' && recent.value.length > 0)
const empty = computed(() => query.value.trim() !== '' && search.result.value !== null && search.result.value.total === 0)
const listVisible = computed(() => open.value && (rows.value.length > 0 || showRecent.value || empty.value || search.failed.value))
const activeId = computed(() => (active.value >= 0 ? rows.value[active.value]?.id : undefined))

watch(query, (value) => {
    active.value = -1
    open.value = true
    search.run(value)
})

onClickOutside(root, () => {
    open.value = false
})

onMounted(() => {
    shell.registerSearch(() => {
        input.value?.focus()
        input.value?.select()
    })
})

/** The typed characters, marked inside a label so the eye finds the match. */
function parts(label: string): { text: string; hit: boolean }[] {
    const needle = query.value.trim().toLowerCase()
    const at = needle === '' ? -1 : label.toLowerCase().indexOf(needle)

    if (at < 0) {
        return [{ text: label, hit: false }]
    }

    return [
        { text: label.slice(0, at), hit: false },
        { text: label.slice(at, at + needle.length), hit: true },
        { text: label.slice(at + needle.length), hit: false },
    ].filter((p) => p.text !== '')
}

function go(row: Row): void {
    remember(query.value.trim())
    open.value = false
    router.visit(row.href)
}

function onFocus(): void {
    recent.value = readRecent()
    open.value = true
}

function onKeydown(event: KeyboardEvent): void {
    const count = rows.value.length

    if (event.key === 'ArrowDown' && count > 0) {
        event.preventDefault()
        active.value = (active.value + 1) % count
    } else if (event.key === 'ArrowUp' && count > 0) {
        event.preventDefault()
        active.value = active.value <= 0 ? count - 1 : active.value - 1
    } else if (event.key === 'Enter') {
        const row = rows.value[active.value] ?? rows.value[0]

        if (row) {
            event.preventDefault()
            go(row)
        }
    } else if (event.key === 'Escape') {
        if (query.value !== '') {
            event.preventDefault()
            query.value = ''
            search.clear()
        } else {
            open.value = false
            input.value?.blur()
        }
    }
}

function useSuggestion(): void {
    if (search.result.value?.suggestion) {
        query.value = search.result.value.suggestion
        input.value?.focus()
    }
}
</script>

<template>
    <form ref="root" class="sbox" role="search" @submit.prevent>
        <div class="input-group">
            <span class="input-group__icon"><Icon name="search" :size="20" /></span>
            <input
                ref="input"
                v-model="query"
                class="input sbox__input"
                type="search"
                role="combobox"
                aria-label="Suche"
                aria-autocomplete="list"
                aria-controls="sbox-list"
                :aria-expanded="listVisible"
                :aria-activedescendant="activeId"
                placeholder="Felge, Marke oder Größe"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                enterkeyhint="search"
                @focus="onFocus"
                @keydown="onKeydown"
            />
            <kbd v-if="query === ''" class="kbd sbox__hint" aria-hidden="true">/</kbd>
        </div>

        <div v-show="listVisible" id="sbox-list" class="popover sbox__list" role="listbox" aria-label="Vorschläge">
            <template v-for="group in grouped" :key="group.label">
                <p class="menu__label" role="presentation">{{ group.label }}</p>
                <Link
                    v-for="row in group.rows"
                    :id="row.id"
                    :key="row.id"
                    :href="row.href"
                    role="option"
                    :aria-selected="row.id === activeId"
                    class="menu__item sbox__item"
                    :class="{ 'sbox__item--active': row.id === activeId }"
                    tabindex="-1"
                    @click.prevent="go(row)"
                    @mousemove="active = rows.indexOf(row)"
                >
                    <span class="sbox__label">
                        <template v-for="(part, i) in parts(row.label)" :key="i">
                            <mark v-if="part.hit" class="sbox__hit">{{ part.text }}</mark>
                            <template v-else>{{ part.text }}</template>
                        </template>
                    </span>
                    <span v-if="row.sub" class="small quiet">{{ row.sub }}</span>
                </Link>
            </template>

            <template v-if="showRecent">
                <p class="menu__label" role="presentation">Zuletzt gesucht</p>
                <button v-for="term in recent" :key="term" class="menu__item" type="button" tabindex="-1" @click="query = term">
                    <Icon name="clock" :size="20" />
                    {{ term }}
                </button>
            </template>

            <p v-if="empty" class="sbox__empty">
                Nichts gefunden für „{{ query.trim() }}“.
                <button v-if="search.result.value?.suggestion" class="link" type="button" @click="useSuggestion">
                    Meintest du „{{ search.result.value?.suggestion }}“?
                </button>
                <template v-else>Versuch es mit einer Marke oder einer Größe, zum Beispiel „MOTEC“ oder „19 Zoll“.</template>
            </p>
            <p v-if="search.failed.value" class="sbox__empty">Die Suche ist gerade nicht erreichbar.</p>
        </div>
    </form>
</template>

<style scoped>
.sbox {
    position: relative;
    width: 320px;
}

.sbox__input {
    padding-right: var(--sp-40);
}

.sbox__input::-webkit-search-cancel-button {
    display: none;
}

.sbox__hint {
    position: absolute;
    right: var(--sp-12);
    pointer-events: none;
}

.sbox__list {
    position: absolute;
    top: calc(100% + var(--sp-8));
    left: 0;
    right: 0;
    max-height: 60dvh;
    overflow-y: auto;
}

.sbox__item {
    justify-content: space-between;
}

.sbox__item--active {
    background: var(--c-band);
}

.sbox__label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sbox__hit {
    background: transparent;
    color: inherit;
    font-weight: 600;
}

.sbox__empty {
    display: grid;
    gap: var(--sp-4);
    justify-items: start;
    padding: var(--sp-12);
    color: var(--c-ink-2);
}

@media (max-width: 1279px) {
    .sbox {
        width: 240px;
    }
}
</style>
