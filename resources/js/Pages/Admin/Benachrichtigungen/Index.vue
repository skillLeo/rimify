<script setup lang="ts">
/**
 * Benachrichtigungen.
 *
 * Two lists from the same rows. The demand list comes first because it answers the question this
 * feature exists for: which Gutachten is worth buying next, ranked by how many confirmed
 * addresses are waiting for it. The full list underneath is for support.
 */

import { Head } from '@inertiajs/vue3'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import type { AdminBenachrichtigungenProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

defineProps<AdminBenachrichtigungenProps>()
</script>

<template>
    <Head title="Benachrichtigungen" />

    <h1 class="t-h1 ben__title">Benachrichtigungen</h1>

    <section class="ben__section" aria-labelledby="ben-demand">
        <h2 id="ben-demand" class="t-h3">Gefragte Fahrzeuge</h2>
        <p class="t-small ben__lead">Bestätigte Adressen, die auf ein Gutachten warten – nach Fahrzeug.</p>

        <p v-if="demand.length === 0" class="quiet">Noch wartet niemand.</p>

        <table v-else class="table">
            <thead>
                <tr>
                    <th scope="col">Fahrzeug</th>
                    <th scope="col">HSN/TSN</th>
                    <th scope="col" class="ben__num">Wartende</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in demand" :key="row.keyNumbers + row.vehicle">
                    <td>{{ row.vehicle }}</td>
                    <td class="tabular">{{ row.keyNumbers }}</td>
                    <td class="tabular ben__num">{{ row.waiting }}</td>
                </tr>
            </tbody>
        </table>
    </section>

    <section class="ben__section" aria-labelledby="ben-all">
        <h2 id="ben-all" class="t-h3">Alle Eintragungen</h2>

        <p v-if="subscriptions.length === 0" class="quiet">Noch keine Eintragungen.</p>

        <table v-else class="table">
            <thead>
                <tr>
                    <th scope="col">E-Mail</th>
                    <th scope="col">Fahrzeug</th>
                    <th scope="col">Status</th>
                    <th scope="col">Eingetragen</th>
                    <th scope="col">Benachrichtigt</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in subscriptions" :key="row.id">
                    <td>{{ row.email }}</td>
                    <td>{{ row.vehicle }} <span class="quiet tabular">{{ row.keyNumbers }}</span></td>
                    <td>{{ row.status }}</td>
                    <td class="tabular">{{ row.requestedAt }}</td>
                    <td class="tabular">{{ row.notifiedAt ?? '–' }}</td>
                </tr>
            </tbody>
        </table>
    </section>
</template>

<style scoped>
.ben__title {
    margin-bottom: var(--space-5);
}

.ben__section {
    margin-bottom: var(--space-6);
}

.ben__lead {
    margin: var(--space-1) 0 var(--space-3);
    color: var(--ink2);
}

.ben__num {
    text-align: right;
}
</style>
