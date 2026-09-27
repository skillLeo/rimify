<script setup lang="ts">
/**
 * The Gespeicherte Ansichten above a list (docs/admin/rest-build-plan.md, step 2.2): the whole list,
 * then this person's own views, then those shared with their role — each a link, so Back, a bookmark
 * and a pasted address all work. The admin's tab row (AdminSectionTabs), not ARIA tabs.
 *
 * With filters on screen that no view keeps, „Als Ansicht speichern“ offers to keep them. With the
 * person's own view open and its filters changed, „Änderungen speichern“ saves over it and
 * „Verwerfen“ opens it as it was. The open view of one's own has a menu: rename and share, delete —
 * and a deleted view comes back with „Rückgängig“ in the toast. Shared views are for using: only
 * their owner changes them.
 */

import { Link, router } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import Icon from '../AdminIcon.vue'
import SaveViewDialog from './SaveViewDialog.vue'
import { toast } from '../../Chrome/toast'
import type { ListViewItem, ListViewsProps } from '../../../types/admin/lists'

const props = defineProps<{
    list: string
    /** The list itself, unfiltered. */
    base: string
    /** „Alle Bestellungen“ */
    allLabel: string
    views: ListViewsProps
    /** The filters and sort on screen, as the server wrote them. */
    query: Record<string, string>
}>()

const activeView = computed(() => props.views.items.find((view) => view.id === props.views.active) ?? null)
const filtersOn = computed(() => Object.keys(props.query).length > 0)

/** „Alle“ is where one is with no view and nothing filtered — in whatever order: all is all. */
const allCurrent = computed(() => props.views.active === null && Object.keys(props.query).every((key) => key === 'sort' || key === 'richtung'))

/** Filters on screen that no view keeps as they are. */
const wantsSave = computed(() => filtersOn.value && (activeView.value === null || props.views.modified))
const offerSave = computed(() => props.views.canSave && wantsSave.value)

/** The same wish at the limit of views: said, rather than the button simply gone. */
const atLimit = computed(() => !props.views.canSave && wantsSave.value)

/** The person's own view, open and changed. */
const offerSaveOver = computed(() => activeView.value !== null && activeView.value.mine && props.views.modified)

const dialogOpen = ref(false)
const editing = ref<ListViewItem | null>(null)
const busy = ref(false)

function openCreate(): void {
    editing.value = null
    dialogOpen.value = true
}

function openEdit(view: ListViewItem): void {
    editing.value = view
    dialogOpen.value = true
}

function saveOver(): void {
    const view = activeView.value

    if (view === null || busy.value) {
        return
    }

    busy.value = true
    router.patch(`/admin/ansichten/${view.id}`, { query: props.query }, {
        preserveScroll: true,
        // The button goes with the change it saved: the focus goes to the view.
        onSuccess: () => void nextTick(() => focusTab('current')),
        onFinish: () => (busy.value = false),
    })
}

const bar = ref<HTMLElement | null>(null)

/*
 * After a save, a delete or „Rückgängig“ the control that was pressed is gone with the change it
 * made; the focus goes where the result is — the view, or the whole list — never to the page's end.
 */
function focusTab(target: 'current' | 'all' | number): void {
    const root = bar.value

    if (root === null) {
        return
    }

    const tab =
        target === 'current'
            ? root.querySelector<HTMLElement>('.lv__tabs [aria-current="page"]')
            : target === 'all'
              ? null
              : root.querySelector<HTMLElement>(`[data-view="${target}"]`)

    ;(tab ?? root.querySelector<HTMLElement>('.adm-tabs__item'))?.focus()
}

/* A view far along a long row is brought into sight when it is the one open — with its menu. */
function revealCurrent(): void {
    const tab = bar.value?.querySelector<HTMLElement>('.lv__tabs [aria-current="page"]')

    ;(tab?.closest<HTMLElement>('.lv__item') ?? tab)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

onMounted(revealCurrent)
watch(
    () => props.views.active,
    () => void nextTick(revealCurrent)
)

function remove(view: ListViewItem): void {
    router.delete(`/admin/ansichten/${view.id}`, {
        preserveScroll: true,
        onSuccess: () => {
            // Its menu went with it: the focus goes to the whole list.
            void nextTick(() => focusTab('all'))
            toast.show({
                text: `Ansicht „${view.name}“ gelöscht.`,
                icon: 'info',
                action: {
                    label: 'Rückgängig',
                    run: () =>
                        router.post(`/admin/ansichten/${view.id}/wiederherstellen`, {}, { preserveScroll: true, onSuccess: () => void nextTick(() => focusTab(view.id)) }),
                },
            })
        },
    })
}

function sharedNote(view: ListViewItem): string {
    if (view.owner) {
        return `, geteilt von ${view.owner}`
    }

    return view.sharedWith ? `, geteilt mit der Rolle „${view.sharedWith}“` : ''
}
</script>

<template>
    <div ref="bar" class="lv">
        <nav class="adm-tabs lv__tabs" aria-label="Ansichten">
            <Link :href="base" class="adm-tabs__item" :aria-current="allCurrent ? 'page' : undefined">{{ allLabel }}</Link>

            <span v-for="view in views.items" :key="view.id" class="lv__item">
                <Link :href="view.href" class="adm-tabs__item lv__view" :data-view="view.id" :aria-current="view.id === views.active ? 'page' : undefined">
                    <Icon v-if="view.owner || view.sharedWith" name="customers" :size="20" />
                    {{ view.name }}
                    <span class="visually-hidden">{{ sharedNote(view) }}</span>
                    <!-- The comma keeps a screen reader from running the name into „geändert“. -->
                    <template v-if="view.id === views.active && views.modified">
                        <span class="visually-hidden">, </span>
                        <span class="lv__changed">geändert</span>
                    </template>
                </Link>

                <DropdownMenuRoot v-if="view.mine && view.id === views.active">
                    <DropdownMenuTrigger class="adm-iconbtn lv__more" :aria-label="`Aktionen für die Ansicht „${view.name}“`">
                        <Icon name="more" :size="20" />
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuContent class="adm-menu" align="start" :side-offset="8">
                            <DropdownMenuItem class="adm-menu__item" @select="openEdit(view)">
                                <Icon name="edit" :size="20" />
                                Umbenennen und teilen
                            </DropdownMenuItem>
                            <DropdownMenuSeparator class="adm-menu__sep" />
                            <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="remove(view)">
                                <Icon name="delete" :size="20" />
                                Löschen
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenuPortal>
                </DropdownMenuRoot>
            </span>
        </nav>

        <div v-if="offerSaveOver || offerSave || atLimit" class="lv__actions">
            <template v-if="offerSaveOver && activeView">
                <button class="btn btn--secondary btn--sm" type="button" :aria-busy="busy ? 'true' : undefined" @click="saveOver">
                    Änderungen speichern
                </button>
                <Link :href="activeView.href" class="btn btn--ghost btn--sm" preserve-scroll>Verwerfen</Link>
            </template>
            <button v-if="offerSave" class="btn btn--ghost btn--sm" type="button" @click="openCreate">
                <Icon name="bookmark" :size="20" />
                Als Ansicht speichern
            </button>
            <p v-else-if="atLimit" class="lv__limit">{{ views.limit }} von {{ views.limit }} Ansichten gespeichert. Lösch eine, um diese Filter zu speichern.</p>
        </div>
    </div>

    <!-- A link to a view that is gone: its filters apply, and the page says why no view is marked. -->
    <p v-if="views.missing" class="lv__missing" role="status">
        Die verlinkte Ansicht gibt es nicht mehr oder sie ist nicht mit dir geteilt. Die Filter aus dem Link gelten trotzdem.
    </p>

    <SaveViewDialog v-model:open="dialogOpen" :list="list" :query="query" :share-options="views.shareOptions" :view="editing" @saved="focusTab('current')" />
</template>

<style scoped>
/* The tab row with the save actions at its end, one hairline under both — the row's own and the
   actions' bottoms on it, whichever is taller (a touch screen's 48 px buttons beside 44 px tabs). */
.lv {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: var(--sp-16);
    margin-bottom: var(--sp-24);
}

.lv::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 1px;
    background: var(--c-line);
}

.lv__tabs {
    flex: 1 1 auto;
    min-width: 0;
    margin-bottom: 0;
}

.lv__item {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: var(--sp-4);
}

.lv__view {
    gap: var(--sp-8);
}

.lv__limit,
.lv__missing {
    margin: 0;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-2);
}

.lv__missing {
    margin: calc(-1 * var(--sp-16)) 0 var(--sp-24);
}

.lv__changed {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 400;
    color: var(--c-ink-3);
}

/* The row scrolls sideways, which clips anything drawn outside it: the ring goes inside. */
.lv__more:focus-visible {
    outline-offset: -2px;
}

.lv__more[data-state='open'] {
    background: var(--c-band);
    color: var(--c-ink);
}

.lv__actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--sp-8);
    padding-bottom: var(--sp-4);
}

/* From 768 px one hairline runs under the tabs and the actions: the tab row's own gives way. */
@media (min-width: 768px) {
    .lv__tabs::after {
        display: none;
    }
}

/* On a phone the row of views scrolls sideways (no bar: a finger swipes it); the actions go under
   it and wrap — three of them are wider than the screen. */
@media (max-width: 767px) {
    .lv {
        flex-wrap: wrap;
        row-gap: var(--sp-8);
    }

    .lv::after {
        display: none;
    }

    .lv__tabs {
        flex-basis: 100%;
        scrollbar-width: none;
    }

    .lv__actions {
        flex: 1 1 100%;
        flex-wrap: wrap;
        padding-bottom: 0;
    }
}
</style>
