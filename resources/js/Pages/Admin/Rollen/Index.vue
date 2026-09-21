<script setup lang="ts">
/**
 * Rollen & Rechte.
 *
 * The roles first, as a plain list — what each is for and how many accounts hold it. Then the
 * permissions: from 900px a matrix with roles as columns and modules as rows, because "can the
 * Buchhaltung export orders?" is read across, not looked up. Below 900px the matrix does not fit,
 * so the axes swap: one role at a time, chosen above, with its modules listed beneath.
 *
 * Every cell is written in the database whether allowed or not, so an empty cell always means
 * denied and never means unknown. This screen only displays; every change is authorised by a
 * Policy on the server (R-11).
 */

import { Head } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import Icon from '../../../Components/Art/Icon.vue'
import type { AdminRollenProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminRollenProps>()

const active = ref(props.roles[0]?.id ?? 0)
const activeRole = computed(() => props.roles.find((r) => r.id === active.value) ?? null)
</script>

<template>
    <Head title="Rollen & Rechte" />

    <h1 class="t-h1 rol__title">Rollen &amp; Rechte</h1>

    <section class="rol__section" aria-labelledby="rol-roles">
        <h2 id="rol-roles" class="t-h3">Rollen</h2>
        <ul class="rol__roles">
            <li v-for="role in roles" :key="role.id" class="rol__role">
                <div class="rol__role-text">
                    <p class="rol__name">
                        {{ role.label }}
                        <span v-if="role.isSystem" class="tag tag--unknown">Vorlage</span>
                    </p>
                    <p v-if="role.description" class="t-small rol__desc">{{ role.description }}</p>
                </div>
                <p class="rol__users">
                    <span class="tabular">{{ role.users }}</span> {{ role.users === 1 ? 'Konto' : 'Konten' }}
                </p>
            </li>
        </ul>
    </section>

    <section class="rol__section" aria-labelledby="rol-rights">
        <h2 id="rol-rights" class="t-h3">Rechte je Modul</h2>

        <!-- From 900px: the full matrix. -->
        <div class="rol__matrix">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Modul</th>
                        <th scope="col">Aktion</th>
                        <th v-for="role in roles" :key="role.id" scope="col" class="rol__col">
                            {{ role.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="module in modules" :key="module.module">
                        <tr v-for="(action, index) in module.actions" :key="action.action">
                            <th
                                v-if="index === 0"
                                :rowspan="module.actions.length"
                                scope="rowgroup"
                                class="rol__module"
                            >
                                {{ module.label }}
                            </th>
                            <td>{{ action.label }}</td>
                            <td v-for="role in roles" :key="role.id" class="rol__cell">
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
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <!-- Below 900px: one role at a time. -->
        <div class="rol__byrole">
            <div class="rol__pick" role="group" aria-label="Rolle">
                <button
                    v-for="role in roles"
                    :key="role.id"
                    class="pill"
                    :class="{ 'pill--on': role.id === active }"
                    type="button"
                    :aria-pressed="role.id === active"
                    @click="active = role.id"
                >
                    {{ role.label }}
                </button>
            </div>

            <div v-for="module in modules" :key="module.module" class="rol__mod">
                <h3 class="rol__mod-title">{{ module.label }}</h3>
                <ul class="rol__actions" :aria-label="`${module.label} – ${activeRole?.label ?? ''}`">
                    <li
                        v-for="action in module.actions"
                        :key="action.action"
                        class="rol__action"
                        :class="{ 'rol__action--on': action.roles[active] }"
                    >
                        <span>{{ action.label }}</span>
                        <span v-if="action.roles[active]" class="rol__yes">
                            <Icon name="check" :size="20" />
                            <span class="visually-hidden">erlaubt</span>
                        </span>
                        <span v-else class="rol__no">
                            <span aria-hidden="true">–</span>
                            <span class="visually-hidden">nicht erlaubt</span>
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    </section>
</template>

<style scoped>
.rol__title {
    margin-bottom: var(--space-5);
}

.rol__section + .rol__section {
    margin-top: var(--space-7);
}

.rol__roles {
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
}

.rol__role {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
}

.rol__role + .rol__role {
    border-top: 1px solid var(--line-s);
}

.rol__role-text {
    min-width: 0;
}

.rol__name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    font-weight: 700;
}

.rol__desc {
    margin-top: var(--space-1);
    color: var(--ink2);
    max-width: 65ch;
}

.rol__users {
    flex: none;
    font-size: var(--text-small);
    color: var(--ink2);
}

.rol__users .tabular {
    font-family: var(--mono);
}

/* ── Matrix, from 900px ───────────────────────────────────────────────────── */

.rol__matrix {
    display: none;
    margin-top: var(--space-3);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    overflow-x: auto;
}

.rol__matrix td,
.rol__matrix th {
    height: 44px;
    padding-block: var(--space-2);
}

.rol__col {
    text-align: center;
}

.rol__module {
    font-size: var(--text-body);
    font-weight: 700;
    color: var(--ink);
    text-transform: none;
    letter-spacing: 0;
    vertical-align: top;
    padding-top: var(--space-3);
    white-space: nowrap;
    background: var(--surface);
    border-bottom: 1px solid var(--line-s);
}

.rol__cell {
    text-align: center;
    color: var(--ink);
}

.rol__cell :deep(svg) {
    margin-inline: auto;
}

.rol__no {
    color: var(--ink3);
}

/* ── One role at a time, below 900px ──────────────────────────────────────── */

.rol__pick {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-3);
}

.rol__mod {
    margin-top: var(--space-4);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
}

.rol__mod-title {
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-body);
    font-weight: 700;
    border-bottom: 1px solid var(--line-s);
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
    gap: var(--space-3);
    min-height: 44px;
    padding: var(--space-2) var(--space-4);
    color: var(--ink2);
}

.rol__action + .rol__action {
    border-top: 1px solid var(--line-s);
}

.rol__action--on {
    color: var(--ink);
    font-weight: 700;
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
