<script setup lang="ts">
/**
 * Search as a full-screen sheet: the field at the top with the keyboard's focus, "Abbrechen"
 * beside it, and under it the recent searches, then the grouped results as the visitor types —
 * everything reachable with one thumb. The sheet is as tall as the visual viewport, so the last
 * result is never under the keyboard. Back closes it.
 */

import { router } from '@inertiajs/vue3'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { computed, nextTick, ref, watch } from 'vue'
import Icon from '../Ui/Icon.vue'
import Skeleton from '../Ui/Skeleton.vue'
import ListRow from './ListRow.vue'
import { readRecent, remember, useSearch } from '../../composables/useSearch'
import { useShared } from '../../composables/useShared'
import { useMobileShell } from '../../composables/mobile/useMobileShell'
import { useSheetHistory } from '../../composables/mobile/useSheetHistory'
import type { IconName } from '../../icons'

const shared = useShared()
const shell = useMobileShell()
const search = useSearch()

const open = computed({
    get: () => shell.searchOpen.value,
    set: (value: boolean) => {
        shell.searchOpen.value = value
    },
})

const query = ref('')
const input = ref<HTMLInputElement | null>(null)
const recent = ref<string[]>([])

let closedByHistory = false

const history = useSheetHistory('search', () => {
    closedByHistory = true
    open.value = false
})

watch(open, async (isOpen) => {
    if (isOpen) {
        query.value = ''
        search.clear()
        recent.value = readRecent()
        history.open()
        await nextTick()
        input.value?.focus()

        return
    }

    if (closedByHistory) {
        closedByHistory = false

        return
    }

    void history.close()
})

watch(query, (value) => search.run(value))

const ICONS: Record<string, IconName> = { felgen: 'wheel', marken: 'grid', groessen: 'ruler', seiten: 'document' }

const groups = computed(() =>
    (search.result.value?.groups ?? []).map((group) => ({
        ...group,
        icon: ICONS[group.key] ?? ('search' as IconName),
    }))
)

const quick = computed(() => {
    const vehicle = shared.value.vehicle
    const list: { label: string; sub: string | null; href: string; icon: IconName }[] = []

    if (vehicle) {
        list.push({ label: `Passende Felgen für ${vehicle.short}`, sub: vehicle.label, href: '/felgen', icon: 'wheel' })
        list.push({ label: 'Fahrzeug ändern', sub: null, href: '/felgen-suchen', icon: 'car' })
    } else {
        list.push({ label: 'Fahrzeug wählen', sub: 'Marke und Modell oder HSN/TSN', href: '/felgen-suchen', icon: 'car' })
    }

    list.push({ label: 'RIMIFY-Check', sub: 'Passt eine Felge an mein Auto?', href: '/rimify-check', icon: 'check-circle' })
    list.push({ label: 'Warenkorb', sub: shared.value.cartCount > 0 ? `${shared.value.cartCount} Artikel` : null, href: '/warenkorb', icon: 'cart' })

    return list
})

const nothingFound = computed(() => query.value.trim() !== '' && search.result.value !== null && search.result.value.total === 0)

/** Close first, then go, so the sheet's history entry is gone before Inertia pushes its own. */
async function go(href: string | undefined): Promise<void> {
    if (href === undefined) {
        return
    }

    if (query.value.trim() !== '') {
        remember(query.value.trim())
    }

    closedByHistory = true
    open.value = false
    await history.close()
    router.visit(href)
}

function submit(): void {
    const first = groups.value[0]?.items[0]

    if (first) {
        void go(first.href)
    }
}

function useSuggestion(): void {
    if (search.result.value?.suggestion) {
        query.value = search.result.value.suggestion
    }
}
</script>

<template>
    <DialogRoot v-model:open="open">
        <DialogPortal>
            <DialogOverlay class="overlay" />
            <DialogContent class="msearch" aria-describedby="">
                <DialogTitle class="visually-hidden">Suche</DialogTitle>

                <form class="msearch__bar" role="search" @submit.prevent="submit">
                    <div class="input-group msearch__field">
                        <span class="input-group__icon"><Icon name="search" :size="20" /></span>
                        <input
                            ref="input"
                            v-model="query"
                            class="input"
                            type="search"
                            name="q"
                            aria-label="Suche"
                            placeholder="Felge, Marke oder Größe"
                            autocomplete="off"
                            autocapitalize="off"
                            autocorrect="off"
                            spellcheck="false"
                            inputmode="search"
                            enterkeyhint="search"
                        />
                    </div>
                    <button class="btn btn--ghost msearch__cancel" type="button" @click="open = false">Abbrechen</button>
                </form>

                <div class="msearch__list" :aria-busy="search.loading.value ? 'true' : undefined">
                    <template v-if="query.trim() === ''">
                        <template v-if="recent.length">
                            <p class="menu__label">Zuletzt gesucht</p>
                            <ListRow v-for="term in recent" :key="term" icon="clock" :title="term" @activate="query = term" />
                        </template>

                        <p class="menu__label">Direkt zu</p>
                        <ListRow v-for="item in quick" :key="item.href" :icon="item.icon" :title="item.label" :sub="item.sub ?? undefined" :href="item.href" manual @activate="go" />
                    </template>

                    <template v-else>
                        <template v-if="search.loading.value && groups.length === 0">
                            <div v-for="n in 4" :key="n" class="msearch__skeleton" aria-hidden="true">
                                <Skeleton width="24px" height="24px" />
                                <Skeleton width="62%" height="var(--lh-body)" />
                            </div>
                        </template>

                        <template v-for="group in groups" :key="group.key">
                            <p class="menu__label">{{ group.label }}</p>
                            <ListRow
                                v-for="item in group.items"
                                :key="item.href"
                                :icon="group.icon"
                                :title="item.label"
                                :sub="item.sub ?? undefined"
                                :href="item.href"
                                manual
                                @activate="go"
                            />
                        </template>

                        <div v-if="nothingFound" class="msearch__empty">
                            <p>Nichts gefunden für „{{ query.trim() }}“.</p>
                            <button v-if="search.result.value?.suggestion" class="link" type="button" @click="useSuggestion">
                                Meintest du „{{ search.result.value.suggestion }}“?
                            </button>
                            <p v-else class="small muted">Versuch es mit einer Marke oder einer Größe, zum Beispiel „MOTEC“ oder „19 Zoll“.</p>
                        </div>

                        <p v-if="search.failed.value" class="msearch__empty">Die Suche ist gerade nicht erreichbar. Versuch es gleich noch einmal.</p>
                    </template>
                </div>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>

<!-- In a portal: unscoped on purpose. -->
<style>
.msearch {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: var(--z-dialog);
    display: flex;
    flex-direction: column;
    height: var(--vv-h, 100dvh);
    padding-top: env(safe-area-inset-top);
    background: var(--c-surface);
    color: var(--c-ink);
    animation: fade-in var(--d-2) var(--ease-out);
}

.msearch[data-state='closed'] {
    animation: fade-out var(--d-2) var(--ease-in);
}

.msearch__bar {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    min-height: var(--header-h-m);
    padding: var(--sp-8) var(--sp-12) var(--sp-8) var(--page-margin);
    border-bottom: 1px solid var(--c-line);
}

.msearch__field {
    flex: 1;
    min-width: 0;
}

.msearch__cancel {
    flex: none;
    padding-inline: var(--sp-12);
}

.msearch__list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-bottom: var(--sp-24);
}

.msearch__list .menu__label {
    padding-inline: var(--page-margin);
    padding-top: var(--sp-16);
}

.msearch__skeleton {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
    min-height: 56px;
    padding-inline: var(--page-margin);
}

.msearch__empty {
    display: grid;
    gap: var(--sp-8);
    justify-items: start;
    padding: var(--sp-16) var(--page-margin);
    color: var(--c-ink-2);
}
</style>
