<script setup lang="ts">
/**
 * Team › Rollen & Rechte.
 *
 * The roles first, as a plain list — what each is for and how many accounts hold it. Then the
 * permissions: from 900px a matrix with roles as columns and modules as rows, because "can the
 * Buchhaltung export orders?" is read across, not looked up. Below 900px the matrix does not fit,
 * so the axes swap: one role at a time, chosen above, with its modules listed beneath.
 *
 * Every cell is written in the database whether allowed or not, so an empty cell always means
 * denied and never means unknown.
 *
 * Whoever holds `roles × ändern` edits the grid here, one cell at a time; everyone else reads the
 * same grid as ticks and dashes, and the page says once that it is read-only. `can.update` only
 * decides which of the two is drawn — the server refuses the write regardless (R-11) — and the one
 * change the server will not make is taking the last account's ability to edit roles away, because
 * there is no second door back in.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import Icon from '../../../Components/Art/Icon.vue'
import { decimal } from '../../../format'
import type { AdminRollenProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminRollenProps>()

const active = ref(props.roles[0]?.id ?? 0)
const activeRole = computed(() => props.roles.find((r) => r.id === active.value) ?? null)

const page = usePage()
/** The cell in flight, `roleId:module:action`, so only that checkbox is disabled while it saves. */
const saving = ref<string | null>(null)

/** The server's refusal — the lockout sentence — shown once, above the grid it belongs to. */
const refusal = computed<string>(() => {
    const bag: unknown = page.props.errors

    return bag !== null && typeof bag === 'object' ? ((bag as Record<string, string>).allowed ?? '') : ''
})

const context = computed(() => {
    const accounts = props.roles.reduce((sum, r) => sum + r.users, 0)

    return `${decimal(props.roles.length, 0)} ${props.roles.length === 1 ? 'Rolle' : 'Rollen'} · ${decimal(accounts, 0)} ${accounts === 1 ? 'Konto' : 'Konten'}`
})

function cellKey(roleId: number, module: string, action: string): string {
    return `${roleId}:${module}:${action}`
}

/**
 * The checkbox is not bound to the prop: it posts, and the server's re-render is what moves it.
 * Binding it would leave the tick showing a permission the server had just refused.
 */
function toggle(roleId: number, module: string, action: string, allowed: boolean): void {
    const key = cellKey(roleId, module, action)
    saving.value = key

    router.patch(
        `/admin/rollen/${roleId}/rechte`,
        { module, action, allowed },
        {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                saving.value = saving.value === key ? null : saving.value
            },
        }
    )
}
</script>

<template>
    <AdminPage title="Rollen & Rechte" :context="context" :read-only="!can.update">
        <section class="adm-section" aria-labelledby="rol-roles">
            <div class="adm-section__head">
                <h2 id="rol-roles" class="adm-section__title">Rollen</h2>
            </div>

            <ul class="adm-panel rol__roles">
                <li v-for="role in roles" :key="role.id" class="rol__role">
                    <div class="rol__role-text">
                        <p class="rol__name">
                            {{ role.label }}
                            <span v-if="role.isSystem" class="tag tag--unknown">Vorlage</span>
                        </p>
                        <p v-if="role.description" class="rol__desc">{{ role.description }}</p>
                    </div>
                    <p class="rol__users">{{ decimal(role.users, 0) }} {{ role.users === 1 ? 'Konto' : 'Konten' }}</p>
                </li>
            </ul>
        </section>

        <section class="adm-section" aria-labelledby="rol-rights">
            <div class="adm-section__head">
                <h2 id="rol-rights" class="adm-section__title">Rechte je Modul</h2>
            </div>

            <p v-if="can.update" class="adm-note rol__hint">
                Ein Häkchen setzen oder entfernen speichert sofort. Die Änderung gilt beim nächsten Klick der
                betroffenen Person – niemand muss sich neu anmelden.
            </p>

            <!-- The one refusal the server makes: it belongs above the grid, read before the retry. -->
            <p v-if="refusal" class="adm-alert" role="alert">{{ refusal }}</p>

            <!-- From 900px: the full matrix. -->
            <div class="adm-panel rol__matrix">
                <table class="rol__table">
                    <thead>
                        <tr>
                            <th scope="col">Modul</th>
                            <th scope="col">Aktion</th>
                            <th v-for="role in roles" :key="role.id" scope="col" class="rol__col">{{ role.label }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="module in modules" :key="module.module">
                            <tr v-for="(action, index) in module.actions" :key="action.action" :class="{ 'rol__first': index === 0 }">
                                <th v-if="index === 0" :rowspan="module.actions.length" scope="rowgroup" class="rol__module">
                                    {{ module.label }}
                                </th>
                                <td>{{ action.label }}</td>
                                <td v-for="role in roles" :key="role.id" class="rol__cell">
                                    <!-- The label names the whole question, because a checkbox in a
                                         grid is read out as "checkbox" and nothing else. -->
                                    <label v-if="can.update" class="rol__switch">
                                        <input
                                            type="checkbox"
                                            :checked="action.roles[role.id]"
                                            :disabled="saving === `${role.id}:${module.module}:${action.action}`"
                                            @change="toggle(role.id, module.module, action.action, ($event.target as HTMLInputElement).checked)"
                                        >
                                        <span class="visually-hidden">{{ role.label }}: {{ module.label }} {{ action.label }}</span>
                                    </label>
                                    <template v-else>
                                        <Icon
                                            v-if="action.roles[role.id]"
                                            name="check"
                                            :size="20"
                                            :label="`${role.label}: ${action.label} erlaubt`"
                                        />
                                        <span v-else class="rol__no">
                                            <span aria-hidden="true">–</span>
                                            <span class="visually-hidden">nicht erlaubt</span>
                                        </span>
                                    </template>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <!-- Below 900px: one role at a time. -->
            <div class="rol__byrole">
                <div class="adm-filter" role="group" aria-label="Rolle">
                    <button
                        v-for="role in roles"
                        :key="role.id"
                        class="adm-chip"
                        type="button"
                        :aria-pressed="role.id === active"
                        @click="active = role.id"
                    >
                        {{ role.label }}
                    </button>
                </div>

                <div v-for="module in modules" :key="module.module" class="adm-panel rol__mod">
                    <h3 class="rol__mod-title">{{ module.label }}</h3>
                    <ul class="rol__actions" :aria-label="`${module.label} – ${activeRole?.label ?? ''}`">
                        <li
                            v-for="action in module.actions"
                            :key="action.action"
                            class="rol__action"
                            :class="{ 'rol__action--on': action.roles[active] }"
                        >
                            <span>{{ action.label }}</span>
                            <label v-if="can.update" class="rol__switch">
                                <input
                                    type="checkbox"
                                    :checked="action.roles[active]"
                                    :disabled="saving === `${active}:${module.module}:${action.action}`"
                                    @change="toggle(active, module.module, action.action, ($event.target as HTMLInputElement).checked)"
                                >
                                <span class="visually-hidden">{{ activeRole?.label }}: {{ module.label }} {{ action.label }}</span>
                            </label>
                            <template v-else>
                                <span v-if="action.roles[active]" class="rol__yes">
                                    <Icon name="check" :size="20" />
                                    <span class="visually-hidden">erlaubt</span>
                                </span>
                                <span v-else class="rol__no">
                                    <span aria-hidden="true">–</span>
                                    <span class="visually-hidden">nicht erlaubt</span>
                                </span>
                            </template>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    </AdminPage>
</template>

<style scoped>
.rol__hint {
    max-width: 72ch;
    margin-bottom: var(--sp-12);
}

/* ── The roles ────────────────────────────────────────────────────────────── */

.rol__roles {
    margin: 0;
    padding: 0;
    list-style: none;
}

.rol__role {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-16);
    padding: var(--sp-12) var(--sp-16);
}

.rol__role + .rol__role {
    border-top: 1px solid var(--c-line);
}

.rol__role-text {
    min-width: 0;
}

.rol__name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
}

.rol__desc {
    max-width: 65ch;
    margin: var(--sp-4) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.rol__users {
    flex: none;
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
}

/* ── The matrix, from 900px ───────────────────────────────────────────────── */

.rol__matrix {
    display: none;
    overflow-x: auto;
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
    padding: 0 var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    text-align: left;
}

.rol__table thead th {
    font-weight: 500;
    color: var(--c-ink-2);
    white-space: nowrap;
}

/* A module's first row carries the heavier rule, so the grid reads in blocks. */
.rol__first > * {
    border-top: 1px solid var(--c-line-2);
}

.rol__table .rol__col,
.rol__table .rol__cell {
    text-align: center;
}

.rol__module {
    padding-top: var(--sp-8);
    font-weight: 600;
    color: var(--c-ink);
    vertical-align: top;
    white-space: nowrap;
}

.rol__cell {
    color: var(--c-ink);
}

.rol__cell :deep(svg) {
    margin-inline: auto;
}

/* The checkbox is the target, so it carries the size rather than sitting inside something that has it. */
.rol__switch {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--adm-control-h-lg);
    min-height: var(--adm-control-h);
    cursor: pointer;
}

.rol__switch input:disabled {
    cursor: progress;
}

.rol__no {
    color: var(--c-ink-3);
}

/* ── One role at a time, below 900px ──────────────────────────────────────── */

.rol__byrole {
    display: grid;
    gap: var(--sp-16);
}

.rol__mod-title {
    margin: 0;
    padding: var(--sp-12) var(--sp-16);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.rol__actions {
    margin: 0;
    padding: 0;
    list-style: none;
}

.rol__action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
    min-height: var(--adm-control-h-lg);
    padding: 0 var(--sp-16);
    font-size: var(--fs-small);
    color: var(--c-ink-2);
}

.rol__action + .rol__action {
    border-top: 1px solid var(--c-line);
}

.rol__action--on {
    color: var(--c-ink);
    font-weight: 600;
}

.rol__yes {
    display: inline-flex;
}

@media (min-width: 900px) {
    .rol__matrix {
        display: block;
    }

    .rol__byrole {
        display: none;
    }
}
</style>
