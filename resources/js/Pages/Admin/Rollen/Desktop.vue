<script setup lang="ts">
/**
 * Rollen & Rechte — roles as columns, modules as rows.
 *
 * A grid rather than a list of permission strings, because that is how the question is asked:
 * "can the Buchhaltung export orders?" is read across, not looked up. Every cell is written in the
 * database whether allowed or not, so an empty cell here always means denied and never means
 * unknown.
 */

import { Head } from '@inertiajs/vue3'
import Icon from '../../../Components/Art/Icon.vue'
import type { AdminRollenProps } from '../../../types/pages'

defineProps<AdminRollenProps>()
</script>

<template>
    <Head title="Rollen & Rechte" />

    <div class="card rol__legend">
        <article v-for="role in roles" :key="role.id" class="rol__role">
            <span class="rol__name">{{ role.label }}</span>
            <span v-if="role.isSystem" class="tag tag--unknown rol__sys">Vorlage</span>
            <p class="quiet rol__desc">{{ role.description }}</p>
            <span class="data">{{ role.users }} Konten</span>
        </article>
    </div>

    <div class="card rol__matrix">
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
                        <th v-if="index === 0" :rowspan="module.actions.length" scope="rowgroup" class="rol__module">
                            {{ module.label }}
                        </th>
                        <td>{{ action.label }}</td>
                        <td v-for="role in roles" :key="role.id" class="rol__cell">
                            <Icon
                                v-if="action.roles[role.id]"
                                name="check"
                                :size="20"
                                :label="`${action.label} erlaubt`"
                            />
                            <span v-else class="rol__no" aria-label="nicht erlaubt">–</span>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.rol__legend {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--s4);
}

.rol__role {
    min-width: 0;
}

.rol__name {
    font-weight: 700;
}

.rol__sys {
    margin-left: var(--s2);
}

.rol__desc {
    margin: 4px 0;
    font-size: 13px;
}

.rol__matrix {
    margin-top: var(--s4);
    overflow-x: auto;
}

.rol__matrix td,
.rol__matrix th {
    height: 44px;
    padding-block: var(--s2);
}

.rol__col {
    text-align: center;
}

.rol__module {
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
    text-transform: none;
    letter-spacing: 0;
    vertical-align: top;
    padding-top: var(--s3);
    white-space: nowrap;
}

.rol__cell {
    text-align: center;
    color: var(--ok);
}

.rol__cell :deep(svg) {
    margin-inline: auto;
}

.rol__no {
    color: var(--ink3);
}

@media (max-width: 1200px) {
    .rol__legend {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
