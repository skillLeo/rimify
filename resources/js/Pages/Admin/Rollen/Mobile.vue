<script setup lang="ts">
/**
 * Rollen on a phone.
 *
 * A seven-column matrix does not survive 390px, so the axes swap: one role at a time, chosen from
 * a pill rail, with its modules listed beneath. The same data, asked the other way round.
 */

import { Head } from '@inertiajs/vue3'
import { ref } from 'vue'
import Icon from '../../../Components/Art/Icon.vue'
import type { AdminRollenProps } from '../../../types/pages'

const props = defineProps<AdminRollenProps>()

const active = ref(props.roles[0]?.id ?? 0)
</script>

<template>
    <Head title="Rollen & Rechte" />

    <div class="mrol__rail">
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

    <div class="stack mrol__modules">
        <article v-for="module in modules" :key="module.module" class="card mrol__module">
            <span class="micro">{{ module.label }}</span>
            <div class="chip-row mrol__actions">
                <span
                    v-for="action in module.actions"
                    :key="action.action"
                    class="pill"
                    :class="{ 'pill--on': action.roles[active] }"
                >
                    <Icon v-if="action.roles[active]" name="check" :size="20" />
                    {{ action.label }}
                </span>
            </div>
        </article>
    </div>
</template>

<style scoped>
.mrol__rail {
    display: flex;
    gap: var(--space-2);
    overflow-x: auto;
    padding-bottom: var(--space-2);
    scrollbar-width: none;
}

.mrol__rail::-webkit-scrollbar {
    display: none;
}

.mrol__rail .pill {
    flex: none;
}

.mrol__modules {
    margin-top: var(--space-4);
}

.mrol__module {
    padding: var(--space-3);
}

.mrol__actions {
    margin-top: var(--space-2);
}
</style>
