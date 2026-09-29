<script setup lang="ts">
/**
 * Mein Konto: every order placed under the account's address, newest first, each opening its confirmation page with
 * the frozen verdicts and the invoice. Abmelden, and Konto löschen — the orders stay, as the law asks.
 */

import { Head, Link, router } from '@inertiajs/vue3'
import { ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout, inheritAttrs: false })

defineProps<{
    email: string
    orders: { number: string; placedAt: string | null; status: string; total: string; vehicle: string | null }[]
}>()

const confirmDelete = ref(false)
</script>

<template>
    <Head title="Mein Konto" />

    <section class="section-dense">
        <div class="wrap konto">
            <h1 class="t-h1">Mein Konto</h1>
            <p class="t-body konto__lead">Angemeldet als {{ email }}</p>

            <h2 class="t-h3 konto__title">Deine Bestellungen</h2>
            <ul v-if="orders.length" class="konto__orders">
                <li v-for="order in orders" :key="order.number">
                    <Link :href="`/bestellung/${order.number}`" class="konto__order">
                        <span class="konto__number tabular">{{ order.number }}</span>
                        <span class="konto__meta">{{ order.placedAt }} · {{ order.status }}<template v-if="order.vehicle"> · {{ order.vehicle }}</template></span>
                        <span class="konto__total tabular">{{ order.total }}</span>
                    </Link>
                </li>
            </ul>
            <p v-else class="t-body quiet">Unter dieser Adresse gibt es noch keine Bestellung.</p>

            <div class="konto__actions">
                <button class="btn btn--secondary" type="button" @click="router.post('/konto/abmelden')">Abmelden</button>
                <button v-if="!confirmDelete" class="btn btn--quiet" type="button" @click="confirmDelete = true">Konto löschen …</button>
            </div>

            <div v-if="confirmDelete" class="konto__delete" role="alert">
                <p>
                    Wenn du dein Konto löschst, bewahren wir Bestellungen und Rechnungen auf, solange wir gesetzlich dazu
                    verpflichtet sind. Deine Rechnungen findest du im Anhang deiner Bestellbestätigungen.
                </p>
                <div class="konto__actions">
                    <button class="btn btn--primary" type="button" @click="router.delete('/konto')">Konto endgültig löschen</button>
                    <button class="btn btn--secondary" type="button" @click="confirmDelete = false">Behalten</button>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.konto {
    max-width: 48rem;
}

.konto__lead {
    margin-top: var(--space-2);
    color: var(--ink2);
}

.konto__title {
    margin-top: var(--space-6);
}

.konto__orders {
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--line);
}

.konto__order {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-1) var(--space-3);
    min-height: 64px;
    padding-block: var(--space-3);
    border-bottom: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
}

.konto__number {
    font-weight: 700;
}

.konto__meta {
    grid-column: 1;
    font-size: var(--text-small);
    color: var(--ink2);
}

.konto__total {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    font-weight: 700;
}

@media (hover: hover) and (pointer: fine) {
    .konto__order:hover .konto__number {
        color: var(--blue);
    }
}

.konto__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-6);
}

.konto__delete {
    margin-top: var(--space-4);
    padding: var(--space-4);
    background: var(--band);
    border-left: 3px solid var(--danger);
}

.konto__delete .konto__actions {
    margin-top: var(--space-3);
}
</style>
