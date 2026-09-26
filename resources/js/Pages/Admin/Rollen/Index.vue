<script setup lang="ts">
/**
 * Team › Rollen & Rechte (BRIEF.md §2).
 *
 * The roles on the left, one role's rights on the right: modules down, actions across, and only the
 * actions a module really has — a cell that cannot exist is left quiet, never a checkbox that does
 * nothing. A single box saves at once, as before. Anything that changes several rights at once — a
 * module's "Alle", "Von Rolle kopieren" — first shows exactly what would be gained and lost, and
 * saves only after a yes.
 *
 * Every refusal is the server's (R-11): the Super-Admin always has everything, nobody widens a role
 * they hold themselves, and nobody takes away the last way back into this screen. The page only
 * draws what the viewer may try, and shows the server's sentence when a try is refused. A refused
 * box springs back to what the server stored rather than keeping a tick the server never saved.
 *
 * Below 1024 px the role is chosen from a select and each module becomes a block of its actions.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, nextTick, ref, watch } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import Icon from '../../../Components/Ui/Icon.vue'
import RightBox from './RightBox.vue'
import RoleDiffList from './RoleDiffList.vue'
import { matchModules, moduleState, rightKey, roleDiff, withModule } from '../../../composables/admin/roleDiff'
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

/** A box the viewer may tick: not on the Super-Admin, and — on a role they hold — only to take a right away. */
function boxEditable(key: string): boolean {
    if (!editable.value || role.value === null) {
        return false
    }

    return !role.value.raiseBlocked || role.value.rights.includes(key)
}

function actionLabel(action: string): string {
    return props.actions.find((a) => a.action === action)?.label ?? action
}

function has(key: string): boolean {
    return role.value?.rights.includes(key) ?? false
}

/* ── The server's refusals, shown once above the grid they belong to ─────────────── */

const errors = computed<Record<string, string>>(() => {
    const bag: unknown = page.props.errors

    return bag !== null && typeof bag === 'object' ? (bag as Record<string, string>) : {}
})

const refusal = computed(() => errors.value.allowed ?? errors.value.rights ?? errors.value.role ?? '')

/* ── One box, saved at once ──────────────────────────────────────────────────────── */

const saving = ref<string | null>(null)

function toggle(module: string, action: string, event: Event): void {
    const target = event.target as HTMLInputElement
    const current = role.value

    if (current === null) {
        return
    }

    const key = rightKey(module, action)
    saving.value = key

    router.patch(
        `/admin/rollen/${current.id}/rechte`,
        { module, action, allowed: target.checked },
        {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                saving.value = null
                // Whatever the answer, the box shows what the server now holds: Vue would not put back a
                // value that did not change, so a refused tick is undone here, by hand.
                void nextTick(() => (target.checked = has(key)))
            },
        }
    )
}

/* ── Several rights at once: shown first, saved after a yes ──────────────────────── */

const pending = ref<{ title: string; rights: string[] } | null>(null)
const replacing = ref(false)

const pendingOpen = computed({
    get: () => pending.value !== null,
    set: (open: boolean) => {
        if (!open) {
            pending.value = null
        }
    },
})

const pendingDiff = computed(() =>
    pending.value === null || role.value === null ? null : roleDiff(role.value.rights, pending.value.rights, props.modules, props.actions)
)

function moduleAll(module: RollenModule, event: Event): void {
    const target = event.target as HTMLInputElement
    const current = role.value

    // The box itself never changes on its own; the question decides.
    target.checked = moduleState(current?.rights ?? [], module) === 'all'

    if (current === null) {
        return
    }

    const on = moduleState(current.rights, module) !== 'all'

    pending.value = {
        title: on ? `Alle Rechte für „${module.label}“ geben?` : `Alle Rechte für „${module.label}“ nehmen?`,
        rights: withModule(current.rights, props.modules, module.module, on),
    }
}

function applyPending(): void {
    const current = role.value
    const next = pending.value

    if (current === null || next === null) {
        return
    }

    replacing.value = true

    router.put(
        `/admin/rollen/${current.id}/rechte`,
        { rights: next.rights },
        {
            preserveScroll: true,
            onSuccess: () => (pending.value = null),
            onFinish: () => (replacing.value = false),
        }
    )
}

/* Von Rolle kopieren */
const copyOpen = ref(false)
const copySource = ref<number | null>(null)
const copyCandidates = computed(() => props.roles.filter((r) => r.id !== props.selected))
const copyDiff = computed(() => {
    const source = props.roles.find((r) => r.id === copySource.value)

    return source && role.value ? roleDiff(role.value.rights, source.rights, props.modules, props.actions) : null
})

function openCopy(): void {
    copySource.value = copyCandidates.value[0]?.id ?? null
    copyOpen.value = true
}

function applyCopy(): void {
    const source = props.roles.find((r) => r.id === copySource.value)
    const current = role.value

    if (!source || current === null) {
        return
    }

    replacing.value = true

    router.put(
        `/admin/rollen/${current.id}/rechte`,
        { rights: source.rights },
        {
            preserveScroll: true,
            onSuccess: () => (copyOpen.value = false),
            onFinish: () => (replacing.value = false),
        }
    )
}

/* ── The role itself: create, rename, duplicate, delete ──────────────────────────── */

const createOpen = ref(false)
const createForm = ref({ label: '', description: '', copyFrom: '' as number | '' })
const createBusy = ref(false)

function openCreate(): void {
    createForm.value = { label: '', description: '', copyFrom: '' }
    createOpen.value = true
}

function submitCreate(): void {
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

function openRename(): void {
    renameForm.value = { label: role.value?.label ?? '', description: role.value?.description ?? '' }
    renameOpen.value = true
}

function submitRename(): void {
    const current = role.value

    if (current === null) {
        return
    }

    renameBusy.value = true

    router.patch(
        `/admin/rollen/${current.id}`,
        { label: renameForm.value.label, description: renameForm.value.description || null },
        {
            preserveScroll: true,
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
        onSuccess: () => (deleteOpen.value = false),
        onFinish: () => (deleteBusy.value = false),
    })
}

/** What the role menu offers for this role and this viewer. */
const menu = computed(() => {
    const current = role.value

    if (current === null || current.isSuperAdmin) {
        return { rename: false, duplicate: false, remove: false }
    }

    return {
        rename: props.can.update,
        duplicate: props.can.create,
        // A role still held by accounts is refused on the server; the page does not offer it.
        remove: props.can.delete && !current.isSystem && current.users === 0,
    }
})

const hasMenu = computed(() => menu.value.rename || menu.value.duplicate || menu.value.remove)

/* ── Ansicht als Rolle, search, the phone's picker ───────────────────────────────── */

const previewOpen = ref(false)
const search = ref('')
const shownModules = computed(() => matchModules(props.modules, search.value))

function pick(event: Event): void {
    router.get('/admin/rollen', { rolle: (event.target as HTMLSelectElement).value }, { preserveScroll: true })
}

watch(
    () => props.selected,
    () => {
        pending.value = null
        copyOpen.value = false
    }
)

function accounts(n: number): string {
    return `${decimal(n, 0)} ${n === 1 ? 'Konto' : 'Konten'}`
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
                <select id="rol-pick" class="input" :value="selected ?? ''" @change="pick">
                    <option v-for="item in roles" :key="item.id" :value="item.id">{{ item.label }} ({{ accounts(item.users) }})</option>
                </select>
            </div>

            <section v-if="role" class="rol__editor" aria-labelledby="rol-title">
                <header class="rol__head">
                    <div class="rol__titles">
                        <h2 id="rol-title" class="adm-section__title">{{ role.label }}</h2>
                        <p class="adm-note">
                            {{ role.description ?? 'Ohne Beschreibung.' }} · {{ accounts(role.users) }}
                        </p>
                    </div>

                    <div class="rol__actions">
                        <button class="btn btn--secondary" type="button" @click="previewOpen = true">
                            <Icon name="eye" :size="16" />
                            Ansicht als Rolle
                        </button>
                        <button v-if="editable && !role.raiseBlocked" class="btn btn--secondary" type="button" @click="openCopy">
                            Von Rolle kopieren
                        </button>

                        <DropdownMenuRoot v-if="hasMenu">
                            <DropdownMenuTrigger class="adm-iconbtn rol__more" :aria-label="`Weitere Aktionen für ${role.label}`">
                                <Icon name="more" :size="20" />
                            </DropdownMenuTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuContent class="adm-menu" align="end" :side-offset="8">
                                    <DropdownMenuItem v-if="menu.rename" class="adm-menu__item" @select="openRename">
                                        <Icon name="text" :size="20" />
                                        {{ role.isSystem ? 'Beschreibung ändern' : 'Umbenennen' }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem v-if="menu.duplicate" class="adm-menu__item" @select="duplicate">
                                        <Icon name="plus" :size="20" />
                                        Duplizieren
                                    </DropdownMenuItem>
                                    <template v-if="menu.remove">
                                        <DropdownMenuSeparator v-if="menu.rename || menu.duplicate" class="adm-menu__sep" />
                                        <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="deleteOpen = true">
                                            <Icon name="trash" :size="20" />
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
                <p v-else-if="editable" class="adm-note rol__note">
                    Ein Häkchen speichert sofort. Die Änderung gilt beim nächsten Klick der betroffenen Personen.
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
                                        :label="`${role.label}: ${module.label} – alle Rechte`"
                                        :allowed="moduleState(role.rights, module) === 'all'"
                                        :mixed="moduleState(role.rights, module) === 'some'"
                                        editable
                                        :busy="replacing"
                                        @change="moduleAll(module, $event)"
                                    />
                                </td>
                                <td v-for="action in actions" :key="action.action" class="rol__c">
                                    <RightBox
                                        v-if="module.actions.includes(action.action)"
                                        :label="`${role.label}: ${module.label} – ${action.label}`"
                                        :allowed="has(rightKey(module.module, action.action))"
                                        :editable="boxEditable(rightKey(module.module, action.action))"
                                        :busy="saving === rightKey(module.module, action.action)"
                                        @change="toggle(module.module, action.action, $event)"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Below 1024 px: each module a block, its actions as rows. -->
                <div v-if="shownModules.length" class="rol__blocks">
                    <section v-for="module in shownModules" :key="module.module" class="rol__block" :aria-label="module.label">
                        <h3 class="rol__block-title">{{ module.label }}</h3>
                        <ul class="rol__rows">
                            <li v-for="action in module.actions" :key="action" class="rol__row">
                                <span>{{ actionLabel(action) }}</span>
                                <RightBox
                                    :label="`${role.label}: ${module.label} – ${actionLabel(action)}`"
                                    :allowed="has(rightKey(module.module, action))"
                                    :editable="boxEditable(rightKey(module.module, action))"
                                    :busy="saving === rightKey(module.module, action)"
                                    @change="toggle(module.module, action, $event)"
                                />
                            </li>
                        </ul>
                    </section>
                </div>
            </section>
        </div>

        <!-- Several rights at once: what changes, before it is saved. -->
        <Dialog v-model:open="pendingOpen" :title="pending?.title ?? ''" content-class="adm-dialog adm-dialog--narrow">
            <RoleDiffList v-if="pendingDiff && role" :diff="pendingDiff" :role-label="role.label" />
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="pending = null">Abbrechen</button>
                <button
                    class="btn btn--primary"
                    type="button"
                    :aria-busy="replacing ? 'true' : undefined"
                    :aria-disabled="pendingDiff && pendingDiff.gained.length + pendingDiff.lost.length === 0 ? 'true' : undefined"
                    @click="applyPending"
                >
                    Übernehmen
                </button>
            </template>
        </Dialog>

        <Dialog v-model:open="copyOpen" :title="`Rechte für „${role?.label ?? ''}“ kopieren`" content-class="adm-dialog adm-dialog--narrow">
            <div class="form-field rol__dialog-field">
                <label class="form-field__label" for="rol-copy">Rechte übernehmen von</label>
                <select id="rol-copy" v-model="copySource" class="input">
                    <option v-for="item in copyCandidates" :key="item.id" :value="item.id">{{ item.label }}</option>
                </select>
            </div>
            <RoleDiffList v-if="copyDiff && role" :diff="copyDiff" :role-label="role.label" />
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="copyOpen = false">Abbrechen</button>
                <button
                    class="btn btn--primary"
                    type="button"
                    :aria-busy="replacing ? 'true' : undefined"
                    :aria-disabled="!copyDiff || copyDiff.gained.length + copyDiff.lost.length === 0 ? 'true' : undefined"
                    @click="applyCopy"
                >
                    Übernehmen
                </button>
            </template>
        </Dialog>

        <Dialog v-model:open="previewOpen" :title="`Ansicht als „${role?.label ?? ''}“`" content-class="adm-dialog adm-dialog--narrow">
            <p class="adm-note rol__dialog-field">So sieht die Navigation für diese Rolle aus. Seiten, die sie nicht öffnen darf, kommen darin nicht vor.</p>
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
                        maxlength="64"
                        autocomplete="off"
                        aria-required="true"
                        :aria-invalid="errors.label ? 'true' : undefined"
                        aria-describedby="rol-new-label-err"
                    >
                    <p id="rol-new-label-err" class="form-field__error">{{ createOpen ? (errors.label ?? '') : '' }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="rol-new-desc">Beschreibung (optional)</label>
                    <input id="rol-new-desc" v-model="createForm.description" class="input" type="text" maxlength="255" autocomplete="off">
                    <p class="form-field__help">Für wen die Rolle gedacht ist, zum Beispiel „Lager und Versand“.</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="rol-new-copy">Rechte übernehmen von</label>
                    <select id="rol-new-copy" v-model="createForm.copyFrom" class="input">
                        <option value="">Keine – leer anfangen</option>
                        <option v-for="item in roles" :key="item.id" :value="item.id">{{ item.label }}</option>
                    </select>
                    <p class="form-field__error">{{ createOpen ? (errors.copyFrom ?? '') : '' }}</p>
                </div>
            </form>
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="createOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="submit" form="rol-create" :aria-busy="createBusy ? 'true' : undefined">Rolle anlegen</button>
            </template>
        </Dialog>

        <Dialog
            v-model:open="renameOpen"
            :title="role?.isSystem ? 'Beschreibung ändern' : 'Rolle umbenennen'"
            content-class="adm-dialog adm-dialog--narrow"
        >
            <form id="rol-rename" class="rol__form" novalidate @submit.prevent="submitRename">
                <div v-if="!role?.isSystem" class="form-field">
                    <label class="form-field__label" for="rol-edit-label">Bezeichnung</label>
                    <input
                        id="rol-edit-label"
                        v-model="renameForm.label"
                        class="input"
                        type="text"
                        maxlength="64"
                        autocomplete="off"
                        aria-required="true"
                        :aria-invalid="errors.label ? 'true' : undefined"
                        aria-describedby="rol-edit-label-err"
                    >
                    <p id="rol-edit-label-err" class="form-field__error">{{ renameOpen ? (errors.label ?? '') : '' }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="rol-edit-desc">Beschreibung (optional)</label>
                    <input id="rol-edit-desc" v-model="renameForm.description" class="input" type="text" maxlength="255" autocomplete="off">
                    <p class="form-field__error">{{ renameOpen ? (errors.description ?? '') : '' }}</p>
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
    gap: 0;
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

.rol__pick {
    max-width: 32ch;
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
    flex-wrap: wrap;
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
    max-width: 32ch;
    margin-bottom: var(--sp-16);
}

.rol__grid {
    display: none;
    overflow-x: auto;
    border-top: 1px solid var(--c-line);
}

.rol__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
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
    width: 88px;
    text-align: center;
}

.rol__module {
    font-weight: 500;
    color: var(--c-ink);
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

.rol__block-title {
    margin: 0;
    padding: var(--sp-12) 0 var(--sp-4);
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
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

@media (min-width: 1024px) {
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

    .rol__grid {
        display: block;
    }

    .rol__blocks {
        display: none;
    }
}
</style>
