<script setup lang="ts">
/**
 * The command palette: Ctrl/⌘+K anywhere, or the search icon on a phone. One field, and under it
 * the instant search's groups plus the handful of actions people reach for by keyboard — the
 * vehicle, the basket, the check, the contact, the shortcut list. Arrow keys move, Enter goes,
 * Esc closes; the field keeps focus throughout (aria-activedescendant), so a screen reader hears
 * every move.
 */

import { Link, router } from '@inertiajs/vue3'
import { computed, nextTick, ref, watch } from 'vue'
import Dialog from '../Ui/Dialog.vue'
import Icon from '../Ui/Icon.vue'
import Kbd from '../Ui/Kbd.vue'
import { useSearch, readRecent, remember } from '../../composables/useSearch'
import { useShell } from '../../composables/useShell'
import { useShared } from '../../composables/useShared'
import type { IconName } from '../../icons'

interface Entry {
    id: string
    group: string
    label: string
    sub: string | null
    href: string
    icon: IconName
    action?: () => void
}

const shell = useShell()
const shared = useShared()
const search = useSearch()
const query = ref('')
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
const recent = ref<string[]>([])

const actions = computed<Entry[]>(() => {
    const vehicle = shared.value.vehicle
    const list: Entry[] = []

    if (vehicle) {
        list.push({ id: 'a-felgen', group: 'Aktionen', label: `Passende Felgen für ${vehicle.short}`, sub: null, href: '/felgen', icon: 'wheel' })
        list.push({ id: 'a-change', group: 'Aktionen', label: 'Fahrzeug ändern', sub: vehicle.label, href: '/felgen-suchen', icon: 'car' })
    } else {
        list.push({ id: 'a-choose', group: 'Aktionen', label: 'Fahrzeug wählen', sub: 'Marke und Modell oder HSN/TSN', href: '/felgen-suchen', icon: 'car' })
    }

    list.push({ id: 'a-cart', group: 'Aktionen', label: 'Warenkorb öffnen', sub: shared.value.cartCount > 0 ? `${shared.value.cartCount} Artikel` : null, href: '/warenkorb', icon: 'cart' })
    list.push({ id: 'a-check', group: 'Aktionen', label: 'RIMIFY-Check', sub: 'Passt eine Felge an mein Auto?', href: '/rimify-check', icon: 'check-circle' })
    // The phone when the client has given one, otherwise the address — never an invented number.
    const phone = shared.value.contact.phone
    list.push({ id: 'a-contact', group: 'Aktionen', label: 'Kontakt', sub: phone ?? shared.value.contact.email, href: '/kontakt', icon: phone ? 'phone' : 'mail' })
    list.push({
        id: 'a-help',
        group: 'Aktionen',
        label: 'Tastenkürzel',
        sub: null,
        href: '#',
        icon: 'keyboard',
        action: () => {
            shell.paletteOpen.value = false
            shell.helpOpen.value = true
        },
    })

    return list
})

const ICONS: Record<string, IconName> = { felgen: 'wheel', marken: 'grid', groessen: 'ruler', seiten: 'document' }

const entries = computed<Entry[]>(() => {
    const result = search.result.value
    const found: Entry[] = []

    if (result) {
        for (const group of result.groups) {
            for (const [i, item] of group.items.entries()) {
                found.push({ id: `${group.key}-${i}`, group: group.label, label: item.label, sub: item.sub, href: item.href, icon: ICONS[group.key] ?? 'search' })
            }
        }
    }

    const needle = query.value.trim().toLowerCase()
    const matching = needle === '' ? actions.value : actions.value.filter((a) => a.label.toLowerCase().includes(needle))

    return [...found, ...matching]
})

const groups = computed(() => {
    const out: { label: string; entries: Entry[] }[] = []

    for (const entry of entries.value) {
        const last = out[out.length - 1]

        if (last && last.label === entry.group) {
            last.entries.push(entry)
        } else {
            out.push({ label: entry.group, entries: [entry] })
        }
    }

    return out
})

const activeId = computed(() => entries.value[active.value]?.id ?? undefined)

watch(query, (value) => {
    active.value = 0
    search.run(value)
})

watch(
    () => shell.paletteOpen.value,
    async (open) => {
        if (open) {
            query.value = ''
            active.value = 0
            search.clear()
            recent.value = readRecent()
            await nextTick()
            input.value?.focus()
        }
    }
)

function go(entry: Entry): void {
    if (entry.action) {
        entry.action()

        return
    }

    if (query.value.trim() !== '') {
        remember(query.value.trim())
    }

    shell.paletteOpen.value = false
    router.visit(entry.href)
}

function onKeydown(event: KeyboardEvent): void {
    const count = entries.value.length

    if (event.key === 'ArrowDown') {
        event.preventDefault()
        active.value = count === 0 ? 0 : (active.value + 1) % count
    } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        active.value = count === 0 ? 0 : (active.value - 1 + count) % count
    } else if (event.key === 'Enter') {
        const entry = entries.value[active.value]

        if (entry) {
            event.preventDefault()
            go(entry)
        }
    }
}

function useSuggestion(): void {
    if (search.result.value?.suggestion) {
        query.value = search.result.value.suggestion
    }
}
</script>

<template>
    <Dialog v-model:open="shell.paletteOpen.value" title="Suche und Befehle" hide-title class="palette">
        <div class="palette__field input-group">
            <span class="input-group__icon"><Icon name="search" :size="20" /></span>
            <input
                ref="input"
                v-model="query"
                class="input palette__input"
                type="text"
                role="combobox"
                aria-label="Suche und Befehle"
                aria-autocomplete="list"
                aria-controls="palette-list"
                :aria-expanded="entries.length > 0"
                :aria-activedescendant="activeId"
                placeholder="Felge, Marke, Größe oder Seite"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                enterkeyhint="go"
                @keydown="onKeydown"
            />
        </div>

        <div id="palette-list" class="palette__list" role="listbox" aria-label="Ergebnisse" :aria-busy="search.loading.value ? 'true' : undefined">
            <template v-for="group in groups" :key="group.label">
                <p class="menu__label" role="presentation">{{ group.label }}</p>
                <Link
                    v-for="entry in group.entries"
                    :id="entry.id"
                    :key="entry.id"
                    :href="entry.href"
                    role="option"
                    :aria-selected="entry.id === activeId"
                    class="menu__item palette__item"
                    :class="{ 'palette__item--active': entry.id === activeId }"
                    tabindex="-1"
                    @click.prevent="go(entry)"
                    @mousemove="active = entries.indexOf(entry)"
                >
                    <Icon :name="entry.icon" :size="20" />
                    <span class="palette__text">
                        <span>{{ entry.label }}</span>
                        <span v-if="entry.sub" class="small quiet">{{ entry.sub }}</span>
                    </span>
                </Link>
            </template>

            <p v-if="search.loading.value && entries.length === 0" class="palette__empty">Suche läuft …</p>
            <p v-else-if="query.trim() !== '' && search.result.value && search.result.value.total === 0" class="palette__empty">
                Nichts gefunden für „{{ query.trim() }}“.
                <button v-if="search.result.value.suggestion" class="link" type="button" @click="useSuggestion">
                    Meintest du „{{ search.result.value.suggestion }}“?
                </button>
                <template v-else>Versuch es mit einer Marke oder einer Größe, zum Beispiel „BBS“ oder „19 Zoll“.</template>
            </p>
            <p v-if="search.failed.value" class="palette__empty">Die Suche ist gerade nicht erreichbar. Versuch es gleich noch einmal.</p>

            <template v-if="query.trim() === '' && recent.length">
                <p class="menu__label" role="presentation">Zuletzt gesucht</p>
                <button v-for="term in recent" :key="term" class="menu__item palette__item" type="button" tabindex="-1" @click="query = term">
                    <Icon name="clock" :size="20" />
                    <span>{{ term }}</span>
                </button>
            </template>
        </div>

        <p class="palette__hints small quiet">
            <Kbd :keys="['↑', '↓']" /> wählen <Kbd :keys="['↵']" /> öffnen <Kbd :keys="['Esc']" /> schließen
        </p>
    </Dialog>
</template>

<style scoped>
.palette__field {
    margin-bottom: var(--sp-8);
}

.palette__list {
    max-height: 50dvh;
    overflow-y: auto;
    margin-inline: calc(-1 * var(--sp-8));
}

.palette__item--active {
    background: var(--c-band);
}

.palette__text {
    display: grid;
    min-width: 0;
}

.palette__text > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.palette__empty {
    display: grid;
    gap: var(--sp-4);
    justify-items: start;
    padding: var(--sp-16) var(--sp-12);
    color: var(--c-ink-2);
}

.palette__hints {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin-top: var(--sp-16);
    padding-top: var(--sp-12);
    border-top: 1px solid var(--c-line);
}
</style>

<style>
/* On a phone the palette is a full sheet anchored to the top, so the keyboard never covers the
   field. Unscoped: the dialog element is rendered by Reka outside this component's scope. */
@media (max-width: 767px) {
    .dialog.palette {
        top: 0;
        left: 0;
        width: 100%;
        max-width: none;
        height: 100dvh;
        max-height: none;
        padding: var(--sp-16) var(--page-margin);
        border-radius: 0;
        transform: none;
        animation: fade-in var(--d-2) var(--ease-out);
    }

    .dialog.palette .palette__list {
        max-height: none;
        flex: 1;
    }
}
</style>
