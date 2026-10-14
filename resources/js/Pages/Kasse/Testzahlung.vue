<script setup lang="ts">
/**
 * The sandbox's payment page (App\Payments\SandboxGateway): a test order, and the three ways its
 * payment can end, chosen by whoever tests. It says plainly that it is a test and that no money moves;
 * it exists only where the review is on.
 */

import { Head, router } from '@inertiajs/vue3'
import { ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout, inheritAttrs: false })

defineProps<{
    order: { number: string; total: string; lines: { label: string; quantity: number; total: string }[]; note: string | null }
}>()

const busy = ref<string | null>(null)

/* The same signed address the page came from: the POST carries its signature. */
function finish(outcome: 'bezahlt' | 'abgelehnt' | 'abgebrochen'): void {
    busy.value = outcome
    router.post(window.location.pathname + window.location.search, { outcome }, { onFinish: () => (busy.value = null) })
}
</script>

<template>
    <Head title="Testzahlung" />
    <section class="section-dense">
        <div class="wrap tz">
            <p class="tag tag--unknown tz__tag">Testzahlung – es wird kein Geld bewegt</p>
            <h1 class="t-h1">Bestellung {{ order.number }} bezahlen</h1>
            <p class="t-lead tz__lead">Diese Seite ersetzt in der Vorschau den Zahlungsanbieter. Wähle, wie die Zahlung ausgehen soll.</p>

            <ul class="tz__lines">
                <li v-for="line in order.lines" :key="line.label" class="tz__line">
                    <span>{{ line.quantity }} × {{ line.label }}</span>
                    <span class="tz__money">{{ line.total }}</span>
                </li>
                <li class="tz__line tz__line--total">
                    <span>Summe</span>
                    <span class="tz__money">{{ order.total }}</span>
                </li>
            </ul>
            <p v-if="order.note" class="t-small tz__note">{{ order.note }}</p>

            <div class="tz__actions">
                <button class="btn btn--primary" type="button" :disabled="busy !== null" :aria-busy="busy === 'bezahlt' ? 'true' : undefined" @click="finish('bezahlt')">Zahlung erfolgreich</button>
                <button class="btn btn--secondary" type="button" :disabled="busy !== null" :aria-busy="busy === 'abgelehnt' ? 'true' : undefined" @click="finish('abgelehnt')">Zahlung abgelehnt</button>
                <button class="btn btn--ghost" type="button" :disabled="busy !== null" :aria-busy="busy === 'abgebrochen' ? 'true' : undefined" @click="finish('abgebrochen')">Zahlung abbrechen</button>
            </div>
        </div>
    </section>
</template>

<style scoped>
.tz {
    display: grid;
    gap: var(--sp-16);
    max-width: 720px;
}

.tz__tag {
    justify-self: start;
}

.tz__lead {
    margin: 0;
}

.tz__lines {
    margin: var(--sp-8) 0 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.tz__line {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-16);
    padding-block: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.tz__line--total {
    font-weight: 600;
}

.tz__money {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.tz__note {
    margin: 0;
    color: var(--c-ink-2);
}

.tz__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    margin-top: var(--sp-8);
}

@media (max-width: 767px) {
    .tz__actions .btn {
        width: 100%;
    }
}
</style>
