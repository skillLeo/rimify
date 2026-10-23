<script setup lang="ts">
/**
 * Team › Rollen & Rechte (BRIEF.md §2).
 *
 * The roles on the left, one role's rights on the right: modules down, actions across, and only the
 * actions a module really has — a cell that cannot exist is left quiet, never a checkbox that does
 * nothing.
 *
 * Nothing saves on a click. Ticks, a module's "Alle" and "Von Rolle kopieren" all change a draft;
 * the save bar says so, and Speichern first shows exactly which rights the role gains and loses
 * (BRIEF §2: "a diff of what changes before saving", "every change is confirmed"). Leaving with an
 * unsaved draft is asked about, like every admin form.
 *
 * Every refusal is the server's (R-11): the Super-Admin always has everything, nobody widens a role
 * they hold themselves, and nobody takes away the last way back into this screen. The page only
 * draws what the viewer may try, and shows the server's sentence when a save is refused.
 *
 * Below 1024 px the role is chosen from a select and each module becomes a block of its actions.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, ref, watch } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSaveBar from '../../../Components/Admin/AdminSaveBar.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import RightBox from './RightBox.vue'
import RoleDiffList from './RoleDiffList.vue'
import { stampHeaders, useDirtyForm } from '../../../composables/admin/useDirtyForm'
import { matchModules, moduleState, realCells, rightKey, roleDiff, withModule } from '../../../composables/admin/roleDiff'
import { decimal } from '../../../format'
import type { AdminRollenPageProps, RollenModule, RollenRole } from '../../../types/admin/rollen'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminRollenPageProps>()

const page = usePage()

const role = computed<RollenRole | null>(() => props.roles.find((r) => r.id === props.selected) ?? null)

const context = computed(
    () =>
        `${decimal(props.roles.length, 0)} ${props.roles.length === 1 ? 'Rolle' : 'Rollen'} · ${decimal(props.accounts, 0)} ${props.accounts === 1 ? 'Konto' : 'Konten'}`
)

/** What this viewer may change on the selected role. */
const editable = computed(() => props.can.update && role.value !== null && !role.value.isSuperAdmin)

function actionLabel(action: string): string {
    return props.actions.find((a) => a.action === action)?.label ?? action
}

function accounts(n: number): string {
    return `${decimal(n, 0)} ${n === 1 ? 'Konto' : 'Konten'}`
}

/* ── The draft: what the grid shows, saved only through the save bar ─────────────── */

/** The save waiting for its yes, while the difference is on screen. */
let send: (() => void) | null = null
const confirmOpen = ref(false)

const editor = useDirtyForm(
    { rights: [...(role.value?.rights ?? [])] },
    {
        method: 'put',
        url: () => `/admin/rollen/${props.selected ?? 0}/rechte`,
        stamp: () => props.stamp,
        beforeSave: (proceed) => {
            send = proceed
            confirmOpen.value = true
        },
    }
)

const draft = computed(() => editor.form.rights)

// Another role is another draft: the server's rights become the new "unchanged".
watch(
    () => [props.selected, role.value?.rights.join(',')],
    () => {
        editor.form.defaults({ rights: [...(role.value?.rights ?? [])] })
        editor.form.reset()
        confirmOpen.value = false
    }
)

function has(key: string): boolean {
    return draft.value.includes(key)
}

/** Whether this viewer may hand out every one of these rights (they hold them, or are a Super-Admin). */
function mayGrant(rights: readonly string[]): boolean {
    return props.grantable === null || rights.every((key) => props.grantable?.includes(key) === true)
}

/**
 * A box the viewer may change: never on the Super-Admin; a right the role already had may always go;
 * a new one only when the role is not their own and they hold that right themselves.
 */
function boxEditable(key: string): boolean {
    if (!editable.value || role.value === null) {
        return false
    }

    if (role.value.rights.includes(key)) {
        return true
    }

    return !role.value.raiseBlocked && mayGrant([key])
}

function setRight(key: string, on: boolean): void {
    const next = new Set(draft.value)

    if (on) {
        next.add(key)
    } else {
        next.delete(key)
    }

    // Kept in the grid's own order, so the same set of rights always reads as the same draft.
    editor.form.rights = realCells(props.modules).filter((k) => next.has(k))
}

function moduleAll(module: RollenModule): void {
    const on = moduleState(draft.value, module) !== 'all'
    const next = withModule(draft.value, props.modules, module.module, on)

    // "Alle" gives only what this viewer may give; the rest of the module stays as it is.
    editor.form.rights = on ? next.filter((key) => draft.value.includes(key) || role.value?.rights.includes(key) || mayGrant([key])) : next
}

/** "Alle" is offered where it can do something for this viewer. */
function allEditable(module: RollenModule): boolean {
    return editable.value && role.value !== null && !role.value.raiseBlocked && module.actions.some((a) => boxEditable(rightKey(module.module, a)))
}

const saveDiff = computed(() => (role.value === null ? null : roleDiff(role.value.rights, draft.value, props.modules, props.actions)))

function confirmSave(): void {
    confirmOpen.value = false
    send?.()
    send = null
}

/* ── The server's refusals, shown once above the grid they belong to ─────────────── */

const errors = computed<Record<string, string>>(() => {
    const bag: unknown = page.props.errors

    return bag !== null && typeof bag === 'object' ? (bag as Record<string, string>) : {}
})

const refusal = computed(() => errors.value.rights ?? errors.value.allowed ?? errors.value.role ?? '')

/* ── Von Rolle kopieren: into the draft, saved like any other change ─────────────── */

const copyOpen = ref(false)
const copySource = ref<number | ''>('')
/** Only roles whose rights this viewer may hand out can be copied from. */
const copyCandidates = computed(() => props.roles.filter((r) => r.id !== props.selected && mayGrant(r.rights)))
const createSources = computed(() => props.roles.filter((r) => mayGrant(r.rights)))
const copyDiff = computed(() => {
    const source = props.roles.find((r) => r.id === copySource.value)

    return source ? roleDiff(draft.value, source.rights, props.modules, props.actions) : null
})

function openCopy(): void {
    copySource.value = ''
    copyOpen.value = true
}

function applyCopy(): void {
    const source = props.roles.find((r) => r.id === copySource.value)

    // The greyed-out button does nothing: no source yet, or nothing that would change.
    if (!source || !copyDiff.value || copyDiff.value.gained.length + copyDiff.value.lost.length === 0) {
        return
    }

    const cells = new Set(source.rights)
    editor.form.rights = realCells(props.modules).filter((k) => cells.has(k))
    copyOpen.value = false
}

/* ── The role itself: create, rename, duplicate, delete ──────────────────────────── */

/** Which dialog sent the last request: each shows only the server's messages about its own save. */
const sentFrom = ref<'create' | 'rename' | null>(null)

function dialogError(from: 'create' | 'rename', key: string): string {
    return sentFrom.value === from ? (errors.value[key] ?? '') : ''
}

const createOpen = ref(false)
const createForm = ref({ label: '', description: '', copyFrom: '' as number | '' })
const createBusy = ref(false)

function openCreate(): void {
    createForm.value = { label: '', description: '', copyFrom: '' }
    sentFrom.value = null
    createOpen.value = true
}

function submitCreate(): void {
    // Enter twice is one request.
    if (createBusy.value) {
        return
    }

    sentFrom.value = 'create'
    createBusy.value = true

    router.post(
        '/admin/rollen',
        {
            label: createForm.value.label,
            description: createForm.value.description || null,
            copyFrom: createForm.value.copyFrom === '' ? null : createForm.value.copyFrom,
        },
        {
            preserveScroll: true,
            onSuccess: () => (createOpen.value = false),
            onFinish: () => (createBusy.value = false),
        }
    )
}

const renameOpen = ref(false)
const renameForm = ref({ label: '', description: '' })
const renameBusy = ref(false)
/* Name and description as the dialog opened on (EditStamp, the admin audit's F-25): sent with the save. */
const renameStamp = ref<string | undefined>(undefined)

function openRename(): void {
    renameForm.value = { label: role.value?.label ?? '', description: role.value?.description ?? '' }
    renameStamp.value = role.value?.nameStamp
    sentFrom.value = null
    renameOpen.value = true
}

function submitRename(): void {
    const current = role.value

    if (current === null || renameBusy.value) {
        return
    }

    sentFrom.value = 'rename'
    renameBusy.value = true

    router.patch(
        `/admin/rollen/${current.id}`,
        { label: renameForm.value.label, description: renameForm.value.description || null },
        {
            preserveScroll: true,
            headers: stampHeaders(renameStamp.value),
            onSuccess: () => (renameOpen.value = false),
            onFinish: () => (renameBusy.value = false),
        }
    )
}

function duplicate(): void {
    if (role.value !== null) {
        router.post(`/admin/rollen/${role.value.id}/duplizieren`, {}, { preserveScroll: true })
    }
}

const deleteOpen = ref(false)
const deleteBusy = ref(false)

function submitDelete(): void {
    const current = role.value

    if (current === null) {
        return
    }

    deleteBusy.value = true

    router.delete(`/admin/rollen/${current.id}`, {
        // Closed either way: a refusal is shown above the grid, where it can be read, not behind a dialog.
        onFinish: () => {
            deleteBusy.value = false
            deleteOpen.value = false
        },
    })
}

/** The one menu of secondary actions for this role and this viewer (admin-shell §8.1). */
const menu = computed(() => {
    const current = role.value

    if (current === null || current.isSuperAdmin) {
        return { copy: false, rename: false, duplicate: false, remove: false }
    }

    return {
        copy: editable.value && !current.raiseBlocked && copyCandidates.value.length > 0,
        rename: props.can.update,
        duplicate: props.can.create && mayGrant(current.rights),
        // A role still held by accounts is refused on the server; the page does not offer it.
        remove: props.can.delete && !current.isSystem && current.users === 0,
    }
})

const hasMenu = computed(() => menu.value.copy || menu.value.rename || menu.value.duplicate || menu.value.remove)

/* ── Ansicht als Rolle, search, the phone's picker ───────────────────────────────── */

const previewOpen = ref(false)
const search = ref('')
const shownModules = computed(() => matchModules(props.modules, search.value))

/*
 * The phone's and tablet's role select. On Windows a closed select fires `change` on every arrow
 * key; navigating on each would reload the page under the keyboard. So a choice made with the arrows
 * waits for Enter or for leaving the field; a choice made by picking goes at once.
 */
let pendingPick: string | null = null
let arrowed = false

function goTo(id: string): void {
    pendingPick = null

    if (id !== String(props.selected)) {
        router.get('/admin/rollen', { rolle: id }, { preserveScroll: true })
    }
}

function pickKey(event: KeyboardEvent): void {
    if (['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
        arrowed = true
    } else if (event.key === 'Enter' && pendingPick !== null) {
        event.preventDefault()
        goTo(pendingPick)
    }
}

function pick(event: Event): void {
    const id = (event.target as HTMLSelectElement).value

    if (arrowed) {
        arrowed = false
        pendingPick = id

        return
    }

    goTo(id)
}

function pickBlur(): void {
    arrowed = false

    if (pendingPick !== null) {
        goTo(pendingPick)
    }
}
</script>

<template>
    <AdminPage title="Rollen & Rechte" :context="context" :read-only="!can.update && !can.create">
        <template v-if="can.create" #primary>
            <button class="btn btn--primary" type="button" @click="openCreate">Rolle anlegen</button>
        </template>

        <div class="rol">
            <!-- The roles. From 1024 px a list beside the editor; below it a select. -->
            <nav class="rol__list" aria-label="Rollen">
                <ul>
                    <li v-for="item in roles" :key="item.id">
                        <Link
                            :href="`/admin/rollen?rolle=${item.id}`"
                            class="rol__role"
                            :aria-current="item.id === selected ? 'page' : undefined"
                            preserve-scroll
                        >
                            <span class="rol__role-name">{{ item.label }}</span>
                            <span class="rol__role-meta">{{ accounts(item.users) }}</span>
                        </Link>
                    </li>
                </ul>
            </nav>

            <div class="form-field rol__pick">
                <label class="form-field__label" for="rol-pick">Rolle</label>
                <select id="rol-pick" class="input" :value="selected ?? ''" @change="pick" @keydown="pickKey" @blur="pickBlur">
                    <option v-for="item in roles" :key="item.id" :value="item.id">{{ item.label }} ({{ accounts(item.users) }})</option>
                </select>
            </div>

            <section v-if="role" class="rol__editor" aria-labelledby="rol-title">
                <header class="rol__head">
                    <div class="rol__titles">
                        <h2 id="rol-title" class="adm-section__title">{{ role.label }}</h2>
                        <p class="adm-note">{{ role.description ?? 'Ohne Beschreibung.' }} · {{ accounts(role.users) }}</p>
                    </div>

                    <div class="rol__actions">
                        <button class="btn btn--secondary" type="button" @click="previewOpen = true">
                            <Icon name="eye" :size="16" />
                            Ansicht als Rolle
                        </button>

                        <DropdownMenuRoot v-if="hasMenu">
                            <DropdownMenuTrigger class="adm-iconbtn rol__more" :aria-label="`Weitere Aktionen für ${role.label}`">
                                <Icon name="more" :size="20" />
                            </DropdownMenuTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuContent class="adm-menu" align="end" :side-offset="8">
                                    <DropdownMenuItem v-if="menu.copy" class="adm-menu__item" @select="openCopy">
                                        <Icon name="imports" :size="20" />
                                        Von Rolle kopieren
                                    </DropdownMenuItem>
                                    <DropdownMenuItem v-if="menu.rename" class="adm-menu__item" @select="openRename">
                                        <Icon name="edit" :size="20" />
                                        {{ role.isSystem ? 'Beschreibung ändern' : 'Umbenennen' }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem v-if="menu.duplicate" class="adm-menu__item" @select="duplicate">
                                        <Icon name="duplicate" :size="20" />
                                        Duplizieren
                                    </DropdownMenuItem>
                                    <template v-if="menu.remove">
                                        <DropdownMenuSeparator class="adm-menu__sep" />
                                        <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="deleteOpen = true">
                                            <Icon name="delete" :size="20" />
                                            Löschen
                                        </DropdownMenuItem>
                                    </template>
                                </DropdownMenuContent>
                            </DropdownMenuPortal>
                        </DropdownMenuRoot>
                    </div>
                </header>

                <p v-if="role.isSuperAdmin" class="adm-note rol__note">Super-Admin hat immer alle Rechte. Sie lassen sich nicht ändern.</p>
                <p v-else-if="role.raiseBlocked && editable" class="adm-note rol__note">
                    Du hast diese Rolle selbst. Rechte kannst du ihr nehmen, aber nicht geben – das macht eine andere Person.
                </p>
                <!-- A rule, not a missing menu item (the admin audit's rules): nobody is left without a role by a delete. -->
                <p v-if="can.delete && !role.isSystem && role.users > 0" class="adm-note rol__note rol__held">
                    Löschen lässt sich eine Rolle erst, wenn kein Konto sie mehr hat. Gib {{ role.users === 1 ? 'dem Konto' : `den ${decimal(role.users, 0)} Konten` }} unter Benutzer zuerst eine andere Rolle.
                </p>
                <!-- The same for the shop's own roles (the admin audit's F-40): the menu leaves the two out, this says why. -->
                <p v-if="role.isSystem && !role.isSuperAdmin" class="adm-note rol__note rol__standard">
                    Diese Standardrolle lässt sich weder umbenennen noch löschen.{{ editable ? ' Ihre Rechte und ihre Beschreibung kannst du ändern.' : '' }}
                </p>

                <!-- The one refusal the server made: above the grid, read before the retry. -->
                <p v-if="refusal" class="adm-alert" role="alert">{{ refusal }}</p>

                <div class="form-field rol__search">
                    <label class="form-field__label" for="rol-search">Modul suchen</label>
                    <input id="rol-search" v-model="search" class="input" type="search" autocomplete="off">
                </div>

                <p v-if="shownModules.length === 0" class="adm-note">Kein Modul heißt so.</p>

                <!-- From 1024 px: modules down, actions across. -->
                <div v-if="shownModules.length" class="rol__grid">
                    <table class="rol__table">
                        <colgroup>
                            <col>
                            <col v-if="editable && !role.raiseBlocked" class="rol__col">
                            <col v-for="action in actions" :key="action.action" class="rol__col">
                        </colgroup>
                        <thead>
                            <tr>
                                <th scope="col">Modul</th>
                                <th v-if="editable && !role.raiseBlocked" scope="col" class="rol__c">Alle</th>
                                <th v-for="action in actions" :key="action.action" scope="col" class="rol__c">{{ action.label }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="module in shownModules" :key="module.module">
                                <th scope="row" class="rol__module">{{ module.label }}</th>
                                <td v-if="editable && !role.raiseBlocked" class="rol__c">
                                    <RightBox
                                        v-if="allEditable(module)"
                                        :label="`${role.label}: ${module.label} – alle Rechte`"
                                        :allowed="moduleState(draft, module) === 'all'"
                                        :mixed="moduleState(draft, module) === 'some'"
                                        editable
                                        @change="moduleAll(module)"
                                    />
                                </td>
                                <td v-for="action in actions" :key="action.action" class="rol__c">
                                    <RightBox
                                        v-if="module.actions.includes(action.action)"
                                        :label="`${role.label}: ${module.label} – ${action.label}`"
                                        :allowed="has(rightKey(module.module, action.action))"
                                        :editable="boxEditable(rightKey(module.module, action.action))"
                                        @change="setRight(rightKey(module.module, action.action), ($event.target as HTMLInputElement).checked)"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Below 1024 px: each module a block, its actions as rows. -->
                <div v-if="shownModules.length" class="rol__blocks">
                    <section v-for="module in shownModules" :key="module.module" class="rol__block" :aria-label="module.label">
                        <div class="rol__block-head">
                            <h3 class="rol__block-title">{{ module.label }}</h3>
                            <span v-if="allEditable(module)" class="rol__all">
                                <span aria-hidden="true">Alle</span>
                                <RightBox
                                    :label="`${role.label}: ${module.label} – alle Rechte`"
                                    :allowed="moduleState(draft, module) === 'all'"
                                    :mixed="moduleState(draft, module) === 'some'"
                                    editable
                                    @change="moduleAll(module)"
                                />
                            </span>
                        </div>
                        <ul class="rol__rows">
                            <li v-for="action in module.actions" :key="action" class="rol__row">
                                <span>{{ actionLabel(action) }}</span>
                                <RightBox
                                    :label="`${role.label}: ${module.label} – ${actionLabel(action)}`"
                                    :allowed="has(rightKey(module.module, action))"
                                    :editable="boxEditable(rightKey(module.module, action))"
                                    @change="setRight(rightKey(module.module, action), ($event.target as HTMLInputElement).checked)"
                                />
                            </li>
                        </ul>
                    </section>
                </div>
            </section>
        </div>

        <!-- Speichern: what changes, before it is saved. -->
        <Dialog v-model:open="confirmOpen" :title="`Rechte für „${role?.label ?? ''}“ speichern?`" content-class="adm-dialog adm-dialog--narrow">
            <RoleDiffList v-if="saveDiff && role" :diff="saveDiff" :role-label="role.label" />
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="confirmOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="button" @click="confirmSave">Speichern</button>
            </template>
        </Dialog>

        <Dialog v-model:open="copyOpen" :title="`Rechte für „${role?.label ?? ''}“ kopieren`" content-class="adm-dialog adm-dialog--narrow">
            <div class="form-field rol__dialog-field">
                <label class="form-field__label" for="rol-copy">Rechte übernehmen von</label>
                <select id="rol-copy" v-model="copySource" class="input">
                    <option value="" disabled>Rolle wählen</option>
                    <option v-for="item in copyCandidates" :key="item.id" :value="item.id">{{ item.label }}</option>
                </select>
            </div>
            <RoleDiffList v-if="copyDiff && role" :diff="copyDiff" :role-label="role.label" />
            <p class="adm-note rol__dialog-note">Gespeichert wird erst mit Speichern in der Leiste unten.</p>
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="copyOpen = false">Abbrechen</button>
                <button
                    class="btn btn--primary"
                    type="button"
                    :aria-disabled="!copyDiff || copyDiff.gained.length + copyDiff.lost.length === 0 ? 'true' : undefined"
                    @click="applyCopy"
                >
                    Übernehmen
                </button>
            </template>
        </Dialog>

        <Dialog v-model:open="previewOpen" :title="`Ansicht als „${role?.label ?? ''}“`" content-class="adm-dialog adm-dialog--narrow">
            <p class="adm-note rol__dialog-field">
                So sieht die Navigation für diese Rolle aus – mit den gespeicherten Rechten. Seiten, die sie nicht öffnen darf,
                kommen darin nicht vor.
            </p>
            <p v-if="navigation.length === 0" class="adm-note">Diese Rolle sieht keine Seite außer ihrem Profil.</p>
            <div v-for="group in navigation" :key="group.key" class="rol__nav-group">
                <p class="rol__nav-label">{{ group.label }}</p>
                <ul class="rol__nav-list">
                    <li v-for="item in group.pages" :key="item.href" class="rol__nav-item">
                        <Icon :name="item.icon" :size="20" />
                        {{ item.label }}
                    </li>
                </ul>
            </div>
        </Dialog>

        <Dialog v-model:open="createOpen" title="Rolle anlegen" content-class="adm-dialog adm-dialog--narrow">
            <form id="rol-create" class="rol__form" novalidate @submit.prevent="submitCreate">
                <div class="form-field">
                    <label class="form-field__label" for="rol-new-label">Bezeichnung</label>
                    <input
                        id="rol-new-label"
                        v-model="createForm.label"
                        class="input"
                        type="text"
                        maxlength="60"
                        autocomplete="off"
                        aria-required="true"
                        :aria-invalid="dialogError('create', 'label') ? 'true' : undefined"
                        aria-describedby="rol-new-label-err"
                    >
                    <p id="rol-new-label-err" class="form-field__error">{{ dialogError('create', 'label') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="rol-new-desc">Beschreibung (optional)</label>
                    <input id="rol-new-desc" v-model="createForm.description" class="input" type="text" maxlength="500" autocomplete="off">
                    <p class="form-field__help">Für wen die Rolle gedacht ist, zum Beispiel „Lager und Versand“.</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="rol-new-copy">Rechte übernehmen von</label>
                    <select id="rol-new-copy" v-model="createForm.copyFrom" class="input">
                        <option value="">Keine – leer anfangen</option>
                        <option v-for="item in createSources" :key="item.id" :value="item.id">{{ item.label }}</option>
                    </select>
                    <p class="form-field__error">{{ dialogError('create', 'copyFrom') }}</p>
                </div>
            </form>
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="createOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="submit" form="rol-create" :aria-busy="createBusy ? 'true' : undefined">Rolle anlegen</button>
            </template>
        </Dialog>

        <Dialog v-model:open="renameOpen" :title="role?.isSystem ? 'Beschreibung ändern' : 'Rolle umbenennen'" content-class="adm-dialog adm-dialog--narrow">
            <form id="rol-rename" class="rol__form" novalidate @submit.prevent="submitRename">
                <!-- Changed meanwhile elsewhere (EditStamp): nothing was saved, and what was typed stays. -->
                <p v-if="dialogError('rename', '_stamp')" class="adm-alert" role="alert">{{ dialogError('rename', '_stamp') }}</p>
                <div v-if="!role?.isSystem" class="form-field">
                    <label class="form-field__label" for="rol-edit-label">Bezeichnung</label>
                    <input
                        id="rol-edit-label"
                        v-model="renameForm.label"
                        class="input"
                        type="text"
                        maxlength="60"
                        autocomplete="off"
                        aria-required="true"
                        :aria-invalid="dialogError('rename', 'label') ? 'true' : undefined"
                        aria-describedby="rol-edit-label-err"
                    >
                    <p id="rol-edit-label-err" class="form-field__error">{{ dialogError('rename', 'label') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="rol-edit-desc">Beschreibung (optional)</label>
                    <input id="rol-edit-desc" v-model="renameForm.description" class="input" type="text" maxlength="500" autocomplete="off">
                    <p class="form-field__error">{{ dialogError('rename', 'description') }}</p>
                </div>
            </form>
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="renameOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="submit" form="rol-rename" :aria-busy="renameBusy ? 'true' : undefined">Speichern</button>
            </template>
        </Dialog>

        <AdminConfirm
            v-model:open="deleteOpen"
            :title="`Rolle „${role?.label ?? ''}“ löschen?`"
            body="Kein Konto hat diese Rolle. Ihre Rechte gehen mit ihr verloren; das Protokoll behält, was sie hatte."
            :busy="deleteBusy"
            @confirm="submitDelete"
        />

        <AdminSaveBar v-if="editable" :editor="editor" />
    </AdminPage>
</template>

<style scoped>
.rol {
    display: grid;
    gap: var(--sp-24);
}

/* ── The roles ─────────────────────────────────────────────────────────────── */

.rol__list {
    display: none;
}

.rol__list ul {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
}

.rol__role {
    position: relative;
    display: grid;
    padding: var(--sp-8) var(--sp-12);
    border-radius: var(--r-tile);
    color: var(--c-ink-2);
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .rol__role:hover {
        background: var(--c-band);
    }
}

.rol__role[aria-current='page'] {
    background: var(--c-blue-tint);
    color: var(--c-ink);
}

.rol__role[aria-current='page']::before {
    content: '';
    position: absolute;
    top: var(--sp-8);
    bottom: var(--sp-8);
    left: 0;
    width: 2px;
    background: var(--c-blue);
}

.rol__role-name {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
}

.rol__role-meta {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
    font-variant-numeric: tabular-nums;
}

/* ── The editor ────────────────────────────────────────────────────────────── */

.rol__editor {
    min-width: 0;
}

.rol__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-12) var(--sp-16);
    margin-bottom: var(--sp-12);
}

.rol__titles {
    min-width: 0;
}

.rol__titles .adm-note {
    margin-top: var(--sp-4);
}

.rol__actions {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
}

.rol__actions .btn .icon {
    margin-right: var(--sp-4);
}

.rol__note {
    margin-bottom: var(--sp-12);
}

.rol__search {
    margin-bottom: var(--sp-16);
}

/* Positioned, so the hidden labels of its checkboxes belong to its scroll box and never widen the page. */
.rol__grid {
    position: relative;
    display: none;
    overflow-x: auto;
    border-top: 1px solid var(--c-line);
}

.rol__table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

/* One pitch for every action column, wide enough for "Veröffentlichen". */
.rol__col {
    width: calc(var(--sp-96) + var(--sp-16));
}

.rol__table th,
.rol__table td {
    height: var(--adm-row-h);
    padding: 0 var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    text-align: left;
}

.rol__table thead th {
    font-weight: 500;
    color: var(--c-ink-2);
    white-space: nowrap;
}

.rol__table .rol__c {
    text-align: center;
}

.rol__module {
    overflow: hidden;
    font-weight: 500;
    color: var(--c-ink);
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ── Below 1024 px: a block per module ─────────────────────────────────────── */

.rol__blocks {
    display: grid;
    gap: var(--sp-16);
}

.rol__block {
    border-top: 1px solid var(--c-line);
}

.rol__block-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
    padding: var(--sp-8) 0 var(--sp-4);
}

.rol__block-title {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.rol__all {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    font-size: var(--fs-small);
    color: var(--c-ink-2);
}

.rol__rows {
    margin: 0;
    padding: 0;
    list-style: none;
}

.rol__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
    min-height: var(--adm-control-h-lg);
    font-size: var(--fs-small);
    color: var(--c-ink-2);
}

.rol__row + .rol__row {
    border-top: 1px solid var(--c-line);
}

/* ── Dialogs ───────────────────────────────────────────────────────────────── */

.rol__form {
    display: grid;
    gap: var(--sp-16);
}

.rol__dialog-field {
    margin-bottom: var(--sp-16);
}

.rol__dialog-note {
    margin-top: var(--sp-16);
}

.rol__nav-group + .rol__nav-group {
    margin-top: var(--sp-12);
}

.rol__nav-label {
    margin: 0 0 var(--sp-4);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.rol__nav-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.rol__nav-item {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
    min-height: var(--adm-control-h);
    font-size: var(--fs-small);
    color: var(--c-ink-2);
}

/* The grid needs about 900 px beside the role list; below 1280 (the rail open) it has not got them,
   so the list becomes a select and each module a block. */
@media (min-width: 1280px) {
    .rol {
        grid-template-columns: minmax(0, 240px) minmax(0, 1fr);
        align-items: start;
    }

    .rol__list {
        display: block;
        position: sticky;
        top: calc(var(--adm-topbar-h) + var(--sp-16));
    }

    .rol__pick {
        display: none;
    }

    .rol__search {
        max-width: 32ch;
    }

    .rol__grid {
        display: block;
    }

    .rol__blocks {
        display: none;
    }
}
</style>
