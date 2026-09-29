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
/** A request on its way: the buttons wait, and a second press does nothing. */
const busy = ref(false)

function send(method: 'post' | 'delete', url: string): void {
    if (busy.value) {
        return
    }

    busy.value = true
    const onFinish = (): void => {
        busy.value = false
    }

    if (method === 'delete') {
        router.delete(url, { onFinish })
    } else {
        router.post(url, {}, { onFinish })
    }
}
</script>

<template>
    <Head title="Mein Konto" />

    <section class="section--tight">
        <div class="container">
            <div class="konto">
                <h1 class="h1">Mein Konto</h1>
                <p class="konto__lead">Angemeldet als {{ email }}</p>

                <h2 class="h3 konto__title">Deine Bestellungen</h2>
                <ul v-if="orders.length" class="konto__orders">
                    <li v-for="order in orders" :key="order.number">
                        <Link :href="`/bestellung/${order.number}`" class="konto__order">
                            <span class="konto__number num">{{ order.number }}</span>
                            <span class="konto__meta">{{ order.placedAt }} · {{ order.status }}<template v-if="order.vehicle"> · {{ order.vehicle }}</template></span>
                            <span class="konto__total num">{{ order.total }}</span>
                        </Link>
                    </li>
                </ul>
                <p v-else class="konto__lead">Unter dieser Adresse gibt es noch keine Bestellung.</p>

                <div class="konto__actions">
                    <button class="btn btn--secondary" type="button" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="send('post', '/konto/abmelden')">Abmelden</button>
                    <button v-if="!confirmDelete" class="btn btn--quiet" type="button" @click="confirmDelete = true">Konto löschen …</button>
                </div>

                <div v-if="confirmDelete" class="konto__delete" role="alert">
                    <p>
                        Wenn du dein Konto löschst, bewahren wir Bestellungen und Rechnungen auf, solange wir gesetzlich dazu
                        verpflichtet sind. Deine Rechnungen findest du im Anhang deiner Bestellbestätigungen.
                    </p>
                    <div class="konto__actions">
                        <button class="btn btn--primary" type="button" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="send('delete', '/konto')">Konto endgültig löschen</button>
                        <button class="btn btn--secondary" type="button" @click="confirmDelete = false">Behalten</button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.konto {
    max-width: 72ch;
}

.konto__lead {
    margin-top: var(--sp-8);
    color: var(--c-ink-2);
}

.konto__title {
    margin-top: var(--sp-32);
}

.konto__orders {
    margin: var(--sp-12) 0 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.konto__order {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4) var(--sp-16);
    min-height: 64px;
    padding-block: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    color: var(--c-ink);
    text-decoration: none;
}

.konto__number {
    font-weight: 500;
}

.konto__meta {
    grid-column: 1;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.konto__total {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    font-weight: 500;
}

@media (hover: hover) and (pointer: fine) {
    .konto__order:hover .konto__number {
        color: var(--c-blue);
    }
}

.konto__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-12);
    margin-top: var(--sp-32);
}

.konto__delete {
    margin-top: var(--sp-16);
    padding-top: var(--sp-16);
    border-top: 1px solid var(--c-line);
}

.konto__delete .konto__actions {
    margin-top: var(--sp-12);
}
</style>
