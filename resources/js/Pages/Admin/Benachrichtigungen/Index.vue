<script setup lang="ts">
/**
 * Gutachten › Benachrichtigungswünsche: customers who asked to be told when a document for their car
 * arrives. Not "Benachrichtigungen" — that word belongs to the team's own notifications.
 *
 * Two lists from the same rows. The demand ranking comes first because it answers the question this
 * feature exists for: which Gutachten is worth buying next, by how many people are waiting for it.
 * The full list underneath is for support, newest first.
 */

import { computed } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import { decimal } from '../../../format'
import type { AdminBenachrichtigungenProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminBenachrichtigungenProps>()

const STATUS: Record<string, string> = {
    Wartet: 'tag--unknown',
    Benachrichtigt: 'tag--ok',
    Unbestätigt: 'tag--unknown',
    Abgemeldet: 'tag--unknown',
}

const context = computed(() => {
    const { waiting, total } = props.summary

    if (total === 0) {
        return 'Noch niemand hat sich eingetragen'
    }

    return `${decimal(waiting, 0)} warten · ${decimal(total, 0)} ${total === 1 ? 'Eintragung' : 'Eintragungen'} insgesamt`
})
</script>

<template>
    <AdminPage title="Benachrichtigungswünsche" :context="context">
        <AdminState
            v-if="summary.total === 0"
            kind="empty"
            text="Wer im Shop für sein Fahrzeug noch keine passende Felge findet, kann sich hier eintragen lassen."
        />

        <template v-else>
            <section class="adm-section" aria-labelledby="ben-demand">
                <div class="adm-section__head">
                    <h2 id="ben-demand" class="adm-section__title">Gefragte Fahrzeuge</h2>
                </div>
                <p class="adm-note ben__note">Bestätigte Adressen, die noch auf ein Gutachten warten – je Fahrzeug, die meisten zuerst.</p>

                <p v-if="demand.length === 0" class="adm-note">Gerade wartet niemand.</p>

                <div v-else class="adm-panel">
                    <table class="adm-table">
                        <thead>
                            <tr>
                                <th scope="col">Fahrzeug</th>
                                <th scope="col">HSN/TSN</th>
                                <th scope="col" class="num">Wartende</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in demand" :key="row.keyNumbers + row.vehicle">
                                <td data-label="Fahrzeug"><span class="adm-table__key">{{ row.vehicle }}</span></td>
                                <td data-label="HSN/TSN" class="num ben__keys">{{ row.keyNumbers }}</td>
                                <td data-label="Wartende" class="num">{{ row.waiting }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="adm-section" aria-labelledby="ben-all">
                <div class="adm-section__head">
                    <h2 id="ben-all" class="adm-section__title">Alle Eintragungen</h2>
                </div>
                <p v-if="summary.total > summary.limit" class="adm-note ben__note">
                    Die neuesten {{ decimal(summary.limit, 0) }} von {{ decimal(summary.total, 0) }}.
                </p>

                <div class="adm-panel">
                    <table class="adm-table">
                        <thead>
                            <tr>
                                <th scope="col">E-Mail</th>
                                <th scope="col">Fahrzeug</th>
                                <th scope="col">Status</th>
                                <th scope="col" class="num">Eingetragen</th>
                                <th scope="col" class="num">Benachrichtigt</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in subscriptions" :key="row.id">
                                <td data-label="E-Mail"><span class="adm-table__key ben__mail">{{ row.email }}</span></td>
                                <td data-label="Fahrzeug">
                                    <span>
                                        {{ row.vehicle }}
                                        <span class="adm-table__sub">{{ row.keyNumbers }}</span>
                                    </span>
                                </td>
                                <td data-label="Status"><span class="tag" :class="STATUS[row.status] ?? 'tag--unknown'">{{ row.status }}</span></td>
                                <td data-label="Eingetragen" class="num">{{ row.requestedAt }}</td>
                                <td data-label="Benachrichtigt" class="num">{{ row.notifiedAt ?? '–' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </template>
    </AdminPage>
</template>

<style scoped>
.ben__note {
    margin-bottom: var(--sp-12);
}

/* A key number keeps its leading zeros and never breaks between HSN and TSN. */
.ben__keys {
    white-space: nowrap;
}

/* An address is one word as far as the table knows; it breaks anywhere rather than overflow. */
.ben__mail {
    overflow-wrap: anywhere;
}
</style>
