<script setup lang="ts">
/**
 * The admin's one search (admin-shell.md §7): ⌘K, `/`, the topbar field and the phone's Suche tab
 * all open this.
 *
 * It finds the viewer's pages and a few actions, from the tree the server already sent — nothing is
 * fetched, so there is no loading state and no error state to design yet. Records join as groups
 * when the pages that open them exist; until then the copy says what is searched rather than
 * promising order numbers it cannot find.
 *
 * Focus stays in the field the whole time. The active row is pointed at with
 * `aria-activedescendant`, so a screen reader hears every move and the caret never leaves the query.
 */

import { router, usePage } from '@inertiajs/vue3'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Icon from './AdminIcon.vue'
import Kbd from '../Ui/Kbd.vue'
import { useAdmin, useAdminShell } from '../../composables/admin/useAdmin'
import { goTargets } from '../../composables/admin/useAdminShortcuts'
import {
    GROUP_LABEL,
    pageEntries,
    readRecent,
    recentEntries,
    recentKey,
    rememberRecent,
    search,
    type PaletteEntry,
    type PaletteGroup,
    type RecentPage,
} from '../../composables/admin/palette'
import { hasMobileShell, useMobileShell } from '../../composables/mobile/useMobileShell'
import { useSheetHistory } from '../../composables/mobile/useSheetHistory'

const admin = useAdmin()
const shell = useAdminShell()
const { paletteOpen } = shell
const page = usePage()

const query = ref('')
const active = ref(0)
const recent = ref<RecentPage[]>([])
const wide = ref(true)
/** A keyboard to press shortcuts on; a phone has none, so it is offered neither the list nor the chips. */
const keyboard = ref(true)

const path = computed(() => {
    const url = page.url.replace(/[?#].*$/, '')

    return url.length > 1 ? url.replace(/\/$/, '') : url
})

/** Recent pages are the signed-in person's own: two people sharing a browser do not see each other's. */
const accountKey = computed(() => recentKey(admin.value.account?.email ?? null))

const pages = computed(() =>
    pageEntries(
        admin.value.nav,
        Object.fromEntries(goTargets(admin.value.nav).map((t) => [t.href, t.key]))
    )
)

function signOut(): void {
    router.post('/admin/abmelden')
}

/** Only what works today (shell-build-plan.md). The rail toggle only where the rail can be toggled. */
const actions = computed<PaletteEntry[]>(() => {
    const collapsed = shell.railCollapsed.value
    // „Neu“ first: the rail foot's quick actions, the one list the server decided (QuickActions).
    const list: PaletteEntry[] = admin.value.quickActions.map((action) => ({
        id: `action:new:${action.key}`,
        group: 'actions',
        label: action.label,
        sub: 'Neu',
        keys: null,
        icon: action.icon,
        href: action.href,
        keywords: 'neu anlegen erstellen',
    }))

    if (wide.value) {
        list.push({
            id: 'action:rail',
            group: 'actions',
            label: collapsed ? 'Seitenleiste ausklappen' : 'Seitenleiste einklappen',
            sub: null,
            keys: ['['],
            icon: collapsed ? 'chevron-right' : 'chevron-left',
            run: shell.toggleRail,
            keywords: 'navigation menue',
        })
    }

    if (keyboard.value) {
        list.push({
            id: 'action:keys',
            group: 'actions',
            label: 'Tastenkürzel anzeigen',
            sub: null,
            keys: ['?'],
            icon: 'keyboard',
            run: () => (shell.shortcutsOpen.value = true),
            keywords: 'tastatur hilfe',
        })
    }

    list.push(
        { id: 'action:password', group: 'actions', label: 'Passwort ändern', sub: 'Profil', keys: null, icon: 'shield', href: '/admin/profil#passwort', keywords: 'kennwort' },
        { id: 'action:logout', group: 'actions', label: 'Abmelden', sub: null, keys: null, icon: 'logout', run: signOut, keywords: 'ausloggen' }
    )

    return list
})

interface Section {
    group: PaletteGroup
    entries: PaletteEntry[]
}

/** Empty field: where you were, then what you can do. Typing: the pages that match, then actions. */
const sections = computed<Section[]>(() => {
    const q = query.value.trim()
    const list: Section[] = q
        ? [
              { group: 'goto', entries: search(pages.value, q) },
              { group: 'actions', entries: search(actions.value, q) },
          ]
        : [
              { group: 'recent', entries: recentEntries(recent.value, pages.value, path.value) },
              { group: 'actions', entries: actions.value },
          ]

    return list.filter((s) => s.entries.length > 0)
})

/** One flat index across every group — the arrows move through it and wrap at the ends. */
const flat = computed(() => sections.value.flatMap((s) => s.entries))
const indexOf = computed(() => new Map(flat.value.map((entry, index) => [entry.id, index])))

function optionId(index: number): string {
    return `adm-pal-${index}`
}

watch(query, () => (active.value = 0))

watch(active, async (index) => {
    await nextTick()
    document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' })
})

/*
 * On a phone the palette is a full-screen sheet, and the phone's Back must close it rather than leave
 * the page under it — the same history entry every BottomSheet takes (useSheetHistory). A close that
 * came from Back, or from a navigation the layout is already cleaning up after, does not pop again.
 */
let closedByHistory = false
let tookHistory = false

const history = useSheetHistory('admin-palette', () => {
    closedByHistory = true
    paletteOpen.value = false
})

// Outside the admin layout (a component test) there is no mobile shell to register with.
const unregister = hasMobileShell()
    ? useMobileShell().registerSheet(() => {
          if (paletteOpen.value) {
              closedByHistory = true
              paletteOpen.value = false
          }
      })
    : () => undefined

onBeforeUnmount(unregister)

watch(paletteOpen, (open) => {
    if (open) {
        query.value = ''
        active.value = 0
        recent.value = readRecent(accountKey.value)
        wide.value = window.matchMedia('(min-width: 1024px)').matches
        keyboard.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
        tookHistory = window.matchMedia('(max-width: 767px)').matches

        if (tookHistory) {
            history.open()
        }

        return
    }

    if (closedByHistory || !tookHistory) {
        closedByHistory = false

        return
    }

    void history.close()
})

function choose(entry: PaletteEntry, newTab = false): void {
    if (entry.href && newTab) {
        window.open(entry.href, '_blank', 'noopener')

        return
    }

    if (entry.href) {
        // The visit's own `before` strips the sheet's entry (AdminLayout); popping it as well would
        // race the visit's push.
        closedByHistory = true
        paletteOpen.value = false
        router.visit(entry.href)

        return
    }

    paletteOpen.value = false

    // After the palette has closed and handed focus back, so an action that opens something of its
    // own (the shortcuts dialog) is not fighting it for focus.
    void nextTick(() => entry.run?.())
}

function onKeydown(event: KeyboardEvent): void {
    const count = flat.value.length

    if (count === 0) {
        return
    }

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault()
            active.value = (active.value + 1) % count
            break
        case 'ArrowUp':
            event.preventDefault()
            active.value = (active.value - 1 + count) % count
            break
        case 'Home':
            event.preventDefault()
            active.value = 0
            break
        case 'End':
            event.preventDefault()
            active.value = count - 1
            break
        case 'Enter': {
            event.preventDefault()
            const entry = flat.value[active.value]

            if (entry) {
                choose(entry, event.metaKey || event.ctrlKey)
            }
            break
        }
    }
}

/* Zuletzt geöffnet: every page the viewer lands on that the palette can find, most recent first. */
function remember(): void {
    const entry = pages.value.find((p) => p.href === path.value)

    if (entry?.href) {
        rememberRecent({ href: entry.href, label: entry.label }, accountKey.value)
    }
}

onMounted(() => {
    remember()
    watch(path, remember)
})
</script>

<template>
    <DialogRoot v-model:open="paletteOpen">
        <DialogPortal>
            <DialogOverlay class="overlay adm-palette__scrim" />
            <DialogContent class="adm-palette">
                <DialogTitle class="visually-hidden">Suche</DialogTitle>
                <DialogDescription class="visually-hidden">
                    Seiten und Aktionen durchsuchen. Mit den Pfeiltasten wählen, mit Enter öffnen.
                </DialogDescription>

                <div class="adm-palette__field">
                    <Icon name="search" :size="20" />
                    <input
                        v-model="query"
                        class="adm-palette__input"
                        type="text"
                        role="combobox"
                        aria-label="Suchbegriff"
                        aria-autocomplete="list"
                        :aria-expanded="flat.length ? 'true' : 'false'"
                        :aria-controls="flat.length ? 'adm-palette-list' : undefined"
                        :aria-activedescendant="flat.length ? optionId(active) : undefined"
                        placeholder="Seite oder Aktion suchen"
                        autocomplete="off"
                        spellcheck="false"
                        enterkeyhint="go"
                        @keydown="onKeydown"
                    >
                    <DialogClose class="adm-palette__cancel">Abbrechen</DialogClose>
                </div>

                <div v-if="flat.length" id="adm-palette-list" class="adm-palette__results" role="listbox" aria-label="Ergebnisse">
                    <div
                        v-for="section in sections"
                        :key="section.group"
                        class="adm-palette__group"
                        role="group"
                        :aria-labelledby="`adm-pal-h-${section.group}`"
                    >
                        <p :id="`adm-pal-h-${section.group}`" class="adm-palette__heading" role="presentation">
                            {{ GROUP_LABEL[section.group] }}
                        </p>
                        <div
                            v-for="entry in section.entries"
                            :id="optionId(indexOf.get(entry.id) ?? 0)"
                            :key="entry.id"
                            class="adm-palette__row"
                            :class="{ 'adm-palette__row--two': entry.sub }"
                            role="option"
                            :aria-selected="indexOf.get(entry.id) === active ? 'true' : 'false'"
                            @click="choose(entry, $event.metaKey || $event.ctrlKey)"
                        >
                            <Icon :name="entry.icon" :size="20" />
                            <span class="adm-palette__text">
                                <span class="adm-palette__key">{{ entry.label }}</span>
                                <span v-if="entry.sub" class="adm-palette__sub">{{ entry.sub }}</span>
                            </span>
                            <span v-if="entry.keys && keyboard" class="adm-palette__meta"><Kbd :keys="entry.keys" /></span>
                        </div>
                    </div>
                </div>

                <div v-else class="adm-palette__results adm-palette__none" role="status">
                    <p class="adm-palette__none-title">Keine Treffer für „{{ query.trim() }}“.</p>
                    <p class="adm-palette__none-hint">Gesucht wird in allen Seiten und Aktionen, die du öffnen darfst.</p>
                </div>

                <div class="adm-palette__foot" aria-hidden="true">
                    <Kbd :keys="['↑', '↓']" /> wählen · <Kbd :keys="['Enter']" /> öffnen · <Kbd :keys="['Esc']" /> schließen
                </div>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>
