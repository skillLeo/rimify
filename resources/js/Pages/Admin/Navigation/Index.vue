<script setup lang="ts">
/**
 * Inhalte › Navigation — the shop's five menus: the header, the three footer columns and the phone's
 * bottom bar (docs/admin/inhalte-build-plan.md, "Navigation").
 *
 * One primary action, *Eintrag anlegen*. An entry opens its dialog; its place moves with *nach
 * oben* / *nach unten* (beside the row from 768 px, and always in its menu); everything else is
 * behind its more-menu. A target is chosen from a list, never typed. Every change is live on every
 * page at once, and Impressum and Datenschutz can only be moved, never hidden, renamed or removed.
 */

import { router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, nextTick, reactive, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import StoreIcon from '../../../Components/Ui/Icon.vue'
import { isIconName, type IconName } from '../../../icons'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import type { AdminNavigationProps, NavEntry, NavMenu } from '../../../types/admin/navigation'
import type { SchemaField } from '../../../types/admin/seiten'
import FieldInput from '../Seiten/FieldInput.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminNavigationProps>()

const page = usePage()

const readOnly = computed(() => !props.can.edit && !props.can.create && !props.can.delete)

const context = computed(() => {
    const entries = props.menus.reduce((sum, menu) => sum + menu.items.length, 0)

    return `${props.menus.length} Menüs · ${entries} Einträge`
})

/** What a menu holds, said once under its name: its room and its label length. */
function menuNote(menu: NavMenu): string {
    const room = menu.maxVisible === null ? null : `höchstens ${menu.maxVisible} sichtbare Einträge`
    const length = `Namen bis ${menu.max} Zeichen`

    return [room, length, menu.icon ? 'jeder mit Symbol' : null].filter(Boolean).join(' · ')
}

function menuOf(entry: NavEntry): NavMenu | undefined {
    return props.menus.find((menu) => menu.items.some((item) => item.id === entry.id))
}

function positionOf(entry: NavEntry): { index: number; count: number } {
    const menu = menuOf(entry)

    return { index: menu?.items.findIndex((item) => item.id === entry.id) ?? -1, count: menu?.items.length ?? 0 }
}

function glyph(name: string | null): IconName | null {
    return name !== null && isIconName(name) ? name : null
}

function iconLabel(name: string | null): string {
    return props.icons.find((option) => option.value === name)?.label ?? 'keins'
}

/* ── What this viewer may do with one entry ──────────────────────────────────────────── */

function mayChange(entry: NavEntry): boolean {
    return props.can.edit && !entry.locked
}

function mayDelete(entry: NavEntry): boolean {
    return props.can.delete && !entry.locked
}

/** A menu is offered only when it holds something: never an empty one. */
function hasMenu(entry: NavEntry): boolean {
    return mayChange(entry) || props.can.edit || mayDelete(entry)
}

/* ── After an answer: the row that changed, and where focus goes ─────────────────────── */

const fresh = ref<number | null>(null)

function markFresh(id: number | undefined): void {
    if (id === undefined) {
        return
    }

    fresh.value = null
    void nextTick(() => (fresh.value = id))
}

/* A dialog opened from a row's menu hands focus back to the row's own "…", not to the menu item
   that is gone once the menu closes; after a delete, to the next row still there. */
let returnTo = ''

/* A menu trigger carries its key in `data-focus`: the menu primitive owns the element's id. */
function byKey(key: string): HTMLElement | null {
    return key === '' ? null : (document.getElementById(key) ?? document.querySelector<HTMLElement>(`[data-focus="${key}"]`))
}

function restoreFocus(event: Event): void {
    const target = byKey(returnTo)

    if (target) {
        event.preventDefault()
        target.focus()
    }
}

/** A refusal about one row — no room, the legal floor, out of date — said in that row's menu, in view. */
const rowError = ref<{ menu: string; text: string } | null>(null)

function refused(menu: string): (bag: Record<string, string>) => void {
    return (bag) => {
        rowError.value = { menu, text: Object.values(bag)[0] ?? '' }
    }
}

/* ── Eintrag anlegen / bearbeiten ────────────────────────────────────────────────────── */

const editing = ref<NavEntry | 'new' | null>(null)
const busy = ref(false)
const title = ref('')
let opened = 0
const sentFrom = ref(-1)
const draft = reactive<{ menu: string; label: string; target: string; icon: string; visible: boolean }>({
    menu: '',
    label: '',
    target: '',
    icon: '',
    visible: true,
})

const dialogOpen = computed({
    get: () => editing.value !== null,
    set: (open: boolean) => {
        if (!open) {
            editing.value = null
        }
    },
})

const draftMenu = computed(() => props.menus.find((menu) => menu.key === draft.menu))

const errors = computed<Record<string, string>>(() => {
    const raw: unknown = page.props.errors

    return sentFrom.value === opened && raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})

const labelField = computed<SchemaField>(() => ({ key: 'label', label: 'Name', kind: 'text', required: true, max: draftMenu.value?.max ?? 32 }))
const iconField = computed<SchemaField>(() => ({ key: 'icon', label: 'Symbol', kind: 'icon', required: true, max: null, options: props.icons }))

function openNew(): void {
    const first = props.menus[0]

    Object.assign(draft, { menu: first?.key ?? '', label: '', target: '', icon: first?.icon ? (props.icons[0]?.value ?? '') : '', visible: true })
    opened++
    title.value = 'Eintrag anlegen'
    returnTo = 'nav-new'
    editing.value = 'new'
}

function openEdit(entry: NavEntry): void {
    Object.assign(draft, { menu: menuOf(entry)?.key ?? '', label: entry.label, target: entry.target, icon: entry.icon ?? '', visible: entry.visible })
    opened++
    title.value = 'Eintrag bearbeiten'
    returnTo = `nav-more-${entry.id}`
    editing.value = entry
}

function onMenuChange(): void {
    // The phone bar needs a glyph; the other menus carry none.
    draft.icon = draftMenu.value?.icon ? draft.icon || (props.icons[0]?.value ?? '') : ''
}

function save(): void {
    if (busy.value || editing.value === null) {
        return
    }

    const target = editing.value
    const token = opened
    busy.value = true
    sentFrom.value = token
    rowError.value = null

    const options = {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
            const id = target === 'new' ? props.menus.find((menu) => menu.key === draft.menu)?.items.at(-1)?.id : target.id

            if (target === 'new' && id !== undefined) {
                returnTo = `nav-more-${id}`
            }

            if (opened === token) {
                editing.value = null
            }

            markFresh(id)
        },
        onError: () => {
            if (opened === token) {
                void nextTick(() => document.querySelector<HTMLElement>('.adm-dialog [aria-invalid="true"]')?.focus())
            }
        },
        onFinish: () => {
            busy.value = false
        },
    }

    const payload = { ...draft, icon: draftMenu.value?.icon ? draft.icon : null }

    if (target === 'new') {
        router.post('/admin/navigation', payload, options)
    } else {
        router.put(`/admin/navigation/${target.id}`, payload, options)
    }
}

/* ── Zeigen / ausblenden, löschen ────────────────────────────────────────────────────── */

function toggle(entry: NavEntry): void {
    rowError.value = null
    // The visibility alone: a list that is out of date never writes a colleague's renamed entry back.
    router.patch(
        `/admin/navigation/${entry.id}/sichtbarkeit`,
        { visible: !entry.visible },
        { preserveScroll: true, preserveState: true, onSuccess: () => markFresh(entry.id), onError: refused(menuOf(entry)?.key ?? '') }
    )
}

const deleting = ref<NavEntry | null>(null)
const deleteTitle = ref('')

const deleteOpen = computed({
    get: () => deleting.value !== null,
    set: (open: boolean) => {
        if (!open) {
            deleting.value = null
        }
    },
})

function askDelete(entry: NavEntry): void {
    deleteTitle.value = `Eintrag „${entry.label}“ löschen?`
    returnTo = `nav-more-${entry.id}`
    deleting.value = entry
}

function remove(): void {
    const entry = deleting.value
    const menu = entry ? menuOf(entry) : undefined

    if (entry === null || busy.value) {
        return
    }

    const at = menu?.items.findIndex((item) => item.id === entry.id) ?? -1
    const next = menu?.items[at + 1] ?? menu?.items[at - 1]

    busy.value = true
    rowError.value = null
    router.delete(`/admin/navigation/${entry.id}`, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
            returnTo = next ? `nav-more-${next.id}` : 'nav-new'
        },
        onError: refused(menu?.key ?? ''),
        onFinish: () => {
            busy.value = false
            deleting.value = null
        },
    })
}

/* ── Reihenfolge ─────────────────────────────────────────────────────────────────────── */

const moving = ref(false)

function move(entry: NavEntry, by: -1 | 1): void {
    const menu = menuOf(entry)

    if (moving.value || !menu) {
        return
    }

    const from = menu.items.findIndex((item) => item.id === entry.id)
    const to = from + by

    if (to < 0 || to >= menu.items.length) {
        return
    }

    const items = [...menu.items]
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved as NavEntry)

    moving.value = true
    rowError.value = null
    router.put('/admin/navigation/reihenfolge', { menu: menu.key, ids: items.map((item) => item.id) }, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => markFresh(entry.id),
        onError: refused(menu.key),
        onFinish: () => {
            moving.value = false

            // The keyboard stays on the entry it moved; at the first or last place the other
            // direction's button takes it, and from the menu, the "…".
            void nextTick(() => {
                const same = document.getElementById(`nav-${by < 0 ? 'up' : 'down'}-${entry.id}`) as HTMLButtonElement | null
                const other = document.getElementById(`nav-${by < 0 ? 'down' : 'up'}-${entry.id}`) as HTMLButtonElement | null
                const usable = [same, other].find((button) => button !== null && !button.disabled && button.offsetParent !== null)

                ;(usable ?? byKey(`nav-more-${entry.id}`))?.focus()
            })
        },
    })
}
</script>

<template>
    <AdminPage title="Navigation" :context="context" :read-only="readOnly">
        <template v-if="can.create" #primary>
            <button id="nav-new" class="btn btn--primary" type="button" @click="openNew">Eintrag anlegen</button>
        </template>

        <p class="adm-note nav-adm__live">Jede Änderung steht sofort im Shop, auf jeder Seite.</p>

        <section v-for="menu in menus" :key="menu.key" class="nav-adm__menu" :aria-labelledby="`nav-m-${menu.key}`">
            <div class="nav-adm__head">
                <h2 :id="`nav-m-${menu.key}`" class="adm-section__title">{{ menu.label }}</h2>
                <p class="nav-adm__note">{{ menuNote(menu) }}</p>
            </div>

            <!-- A refusal stands in the menu it is about, in view of the row just touched. -->
            <p v-if="rowError?.menu === menu.key" class="adm-alert" role="alert">{{ rowError.text }}</p>

            <ol class="nav-adm__list">
                <li
                    v-for="(entry, index) in menu.items"
                    :key="entry.id"
                    class="nav-adm__entry"
                    :class="{ 'adm-row--fresh': fresh === entry.id }"
                    @animationend="fresh = null"
                >
                    <div class="nav-adm__text">
                        <p class="nav-adm__label">
                            <button v-if="mayChange(entry)" class="nav-adm__open" type="button" @click="openEdit(entry)">{{ entry.label }}</button>
                            <span v-else>{{ entry.label }}</span>
                            <span v-if="!entry.visible" class="adm-tag adm-tag--neutral">Ausgeblendet</span>
                        </p>
                        <p class="nav-adm__target">
                            führt zu {{ entry.targetLabel }}<template v-if="entry.locked"> · muss auf jeder Seite erreichbar sein</template>
                            <!-- The glyph is part of the entry: named in words beside its drawing, so it is read aloud too. -->
                            <template v-if="menu.icon">
                                · Symbol:
                                <StoreIcon v-if="glyph(entry.icon)" class="nav-adm__glyph" :name="glyph(entry.icon)!" :size="16" />
                                {{ iconLabel(entry.icon) }}
                            </template>
                        </p>
                    </div>

                    <div class="nav-adm__tools">
                        <div v-if="can.edit" class="adm-row-arrows">
                            <button
                                :id="`nav-up-${entry.id}`"
                                class="adm-iconbtn"
                                type="button"
                                :disabled="index === 0 || moving"
                                :aria-label="`${entry.label} nach oben`"
                                @click="move(entry, -1)"
                            >
                                <Icon name="chevron-up" :size="20" />
                            </button>
                            <button
                                :id="`nav-down-${entry.id}`"
                                class="adm-iconbtn"
                                type="button"
                                :disabled="index === menu.items.length - 1 || moving"
                                :aria-label="`${entry.label} nach unten`"
                                @click="move(entry, 1)"
                            >
                                <Icon name="chevron-down" :size="20" />
                            </button>
                        </div>

                        <DropdownMenuRoot v-if="hasMenu(entry)">
                            <DropdownMenuTrigger :data-focus="`nav-more-${entry.id}`" class="adm-iconbtn" :aria-label="`Aktionen für ${entry.label}`">
                                <Icon name="more" :size="20" />
                            </DropdownMenuTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuContent class="adm-menu" align="end" :side-offset="4">
                                    <template v-if="mayChange(entry)">
                                        <DropdownMenuItem class="adm-menu__item" @select="openEdit(entry)">
                                            <Icon name="edit" :size="20" />
                                            Bearbeiten
                                        </DropdownMenuItem>
                                        <DropdownMenuItem class="adm-menu__item" @select="toggle(entry)">
                                            <Icon :name="entry.visible ? 'eye-off' : 'eye'" :size="20" />
                                            {{ entry.visible ? 'Ausblenden' : 'Zeigen' }}
                                        </DropdownMenuItem>
                                    </template>
                                    <template v-if="can.edit">
                                        <DropdownMenuItem class="adm-menu__item" :disabled="positionOf(entry).index === 0 || moving" @select="move(entry, -1)">
                                            <Icon name="chevron-up" :size="20" />
                                            Nach oben
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            class="adm-menu__item"
                                            :disabled="positionOf(entry).index === positionOf(entry).count - 1 || moving"
                                            @select="move(entry, 1)"
                                        >
                                            <Icon name="chevron-down" :size="20" />
                                            Nach unten
                                        </DropdownMenuItem>
                                    </template>
                                    <template v-if="mayDelete(entry)">
                                        <DropdownMenuSeparator class="adm-menu__sep" />
                                        <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="askDelete(entry)">
                                            <Icon name="delete" :size="20" />
                                            Löschen
                                        </DropdownMenuItem>
                                    </template>
                                </DropdownMenuContent>
                            </DropdownMenuPortal>
                        </DropdownMenuRoot>
                    </div>
                </li>
            </ol>
        </section>

        <Dialog v-model:open="dialogOpen" :title="title" content-class="adm-dialog" @close-auto-focus="restoreFocus">
            <form id="nav-form" class="adm-fields" novalidate @submit.prevent="save">
                <div v-if="editing === 'new'" class="form-field">
                    <label class="form-field__label" for="nav-menu">Menü</label>
                    <select
                        id="nav-menu"
                        v-model="draft.menu"
                        class="input"
                        :aria-invalid="errors.menu ? 'true' : undefined"
                        aria-describedby="nav-menu-err"
                        @change="onMenuChange"
                    >
                        <option v-for="menu in menus" :key="menu.key" :value="menu.key">{{ menu.label }}</option>
                    </select>
                    <p id="nav-menu-err" class="form-field__error">{{ errors.menu ?? '' }}</p>
                </div>

                <FieldInput
                    id="nav-label"
                    :model-value="draft.label"
                    :field="labelField"
                    :error="errors.label ?? ''"
                    @update:model-value="draft.label = String($event ?? '')"
                />

                <div class="form-field">
                    <label class="form-field__label" for="nav-target">Führt zu</label>
                    <select
                        id="nav-target"
                        v-model="draft.target"
                        class="input"
                        :aria-invalid="errors.target ? 'true' : undefined"
                        aria-describedby="nav-target-help nav-target-err"
                    >
                        <option value="" disabled>Ziel wählen</option>
                        <option v-for="option in targets" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                    <p id="nav-target-help" class="form-field__help">Nur Seiten dieses Shops. Einen Ratgeber-Artikel legst du unter Seiten an.</p>
                    <p id="nav-target-err" class="form-field__error">{{ errors.target ?? '' }}</p>
                </div>

                <FieldInput
                    v-if="draftMenu?.icon"
                    id="nav-icon"
                    :model-value="draft.icon"
                    :field="iconField"
                    :error="errors.icon ?? ''"
                    @update:model-value="draft.icon = String($event ?? '')"
                />

                <label class="check">
                    <input
                        id="nav-visible"
                        v-model="draft.visible"
                        type="checkbox"
                        :aria-invalid="errors.visible ? 'true' : undefined"
                        aria-describedby="nav-visible-err"
                    >
                    Im Shop zeigen
                </label>
                <p id="nav-visible-err" class="form-field__error">{{ errors.visible ?? '' }}</p>
            </form>

            <template #actions>
                <button class="btn btn--secondary" type="button" @click="dialogOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="submit" form="nav-form" :disabled="busy" :aria-busy="busy ? 'true' : undefined">
                    {{ title === 'Eintrag anlegen' ? 'Anlegen' : 'Speichern' }}
                </button>
            </template>
        </Dialog>

        <AdminConfirm
            v-model:open="deleteOpen"
            :title="deleteTitle"
            body="Der Eintrag verschwindet aus dem Menü, auf jeder Seite des Shops. Die Seite, zu der er führt, bleibt bestehen."
            confirm-label="Löschen"
            :busy="busy"
            @confirm="remove"
            @close-auto-focus="restoreFocus"
        />
    </AdminPage>
</template>

<style scoped>
/* The same rhythm as the FAQ page: one note, then the lists at an even distance. */
.nav-adm__live {
    margin-bottom: var(--sp-24);
}

.nav-adm__menu {
    display: grid;
    gap: var(--sp-12);
}

.nav-adm__menu + .nav-adm__menu {
    margin-top: var(--sp-32);
}

.nav-adm__head {
    display: grid;
    gap: var(--sp-4);
}

.nav-adm__note {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-3);
}

.nav-adm__list {
    display: grid;
    border-top: 1px solid var(--c-line);
}

.nav-adm__entry {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
    min-height: var(--adm-row-h-lg);
    padding-block: var(--sp-8);
    border-bottom: 1px solid var(--c-line);
}

.nav-adm__glyph {
    vertical-align: -3px;
    color: var(--c-ink-2);
}

.nav-adm__text {
    display: grid;
    flex: 1;
    min-width: 0;
}

.nav-adm__label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
    font-weight: 600;
}

.nav-adm__open {
    padding: 0;
    font: inherit;
    color: inherit;
    text-align: left;
    background: none;
    border: 0;
    cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
    .nav-adm__open:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
}

@media (pointer: coarse) {
    .nav-adm__open {
        min-height: var(--adm-control-h-lg);
    }
}

.nav-adm__target {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-3);
    overflow-wrap: anywhere;
}

.nav-adm__tools {
    display: flex;
    flex: none;
    gap: var(--sp-4);
}
</style>
