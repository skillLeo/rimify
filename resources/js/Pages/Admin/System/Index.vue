<script setup lang="ts">
/**
 * System › Zustand: every check behind the rail's health line, each as a sentence with its state
 * (SystemHealth). The dot is never the only signal — the word next to it says the same thing, so the
 * page reads the same in black and white and to a screen reader.
 */

import { router } from '@inertiajs/vue3'
import { ref } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import type { AdminSystemProps, HealthState } from '../../../types/admin/system'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

defineProps<AdminSystemProps>()

const STATE_WORD: Record<HealthState, string> = { ok: 'In Ordnung', warn: 'Achtung', bad: 'Gestört' }

const busy = ref(false)

function check(): void {
    busy.value = true
    router.reload({ onFinish: () => (busy.value = false) })
}
</script>

<template>
    <AdminPage title="Systemzustand" :context="`Zuletzt geprüft: ${checkedAt}`">
        <template #primary>
            <button class="btn btn--secondary" type="button" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="check">
                Erneut prüfen
            </button>
        </template>

        <p class="sy-headline" :class="`sy-headline--${report.state}`" role="status">
            <span class="adm-health__dot" :class="`adm-health__dot--${report.state}`" aria-hidden="true" />
            {{ report.sentence }}
        </p>

        <ul class="adm-panel sy-list">
            <li v-for="item in report.checks" :key="item.key" class="sy-check">
                <span class="adm-health__dot" :class="`adm-health__dot--${item.state}`" aria-hidden="true" />
                <span class="sy-check__label">{{ item.label }}</span>
                <span class="sy-check__sentence">{{ item.sentence }}</span>
                <span class="sy-check__state" :class="`sy-check__state--${item.state}`">{{ STATE_WORD[item.state] }}</span>
            </li>
        </ul>
    </AdminPage>
</template>

<style scoped>
.sy-headline {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
    margin: 0 0 var(--sp-24);
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
    font-weight: 600;
    color: var(--c-ink);
}

.sy-list {
    max-width: var(--adm-form-max);
    margin: 0;
    padding: 0;
    list-style: none;
}

.sy-check {
    display: grid;
    grid-template-columns: var(--sp-8) var(--sp-128) minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--sp-12);
    min-height: var(--adm-row-h-lg);
    padding-inline: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.sy-check__label {
    font-weight: 600;
}

.sy-check__sentence {
    color: var(--c-ink-2);
}

.sy-check__state {
    font-weight: 500;
}

.sy-check__state--warn {
    color: var(--c-warn);
}

.sy-check__state--bad {
    color: var(--c-bad);
}

.sy-check__state--ok {
    color: var(--c-ok);
}

@media (max-width: 767px) {
    .sy-check {
        grid-template-columns: var(--sp-8) minmax(0, 1fr) auto;
        padding-block: var(--sp-12);
    }

    .sy-check__sentence {
        grid-column: 2 / -1;
    }
}
</style>
