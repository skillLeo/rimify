<script setup lang="ts">
/**
 * Verkauf › Anfragen (the „Sag mir Bescheid“ subscriptions): customers who asked to be told when a document for their car
 * arrives. Not "Benachrichtigungen" — that word belongs to the team's own notifications.
 *
 * Two lists from the same rows. The demand ranking comes first because it answers the question this
 * feature exists for: which Gutachten is worth buying next, by how many people are waiting for it.
 * The full list underneath is for support, newest first.
 */

import { router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import ListPager from '../../../Components/Admin/Lists/ListPager.vue'
import { decimal } from '../../../format'
import type { AdminBenachrichtigungenProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminBenachrichtigungenProps>()

/**
 * Only the exception is tagged. Waiting and notified are the two normal outcomes and read as plain
 * text; an address never confirmed or since unsubscribed is set apart, neutral — it is nobody's fault.
 */
const TAGGED: ReadonlySet<string> = new Set(['Unbestätigt', 'Abgemeldet'])

/* Every request reachable, page by page, and found by its address, its car or its key numbers (the admin audit's F-26). */
const q = ref(props.search)

/* Not `search`: the template reads that name as the prop — the search on screen — never as this function. */
function runSearch(): void {
    router.get('/admin/anfragen', q.value.trim() === '' ? {} : { q: q.value.trim() }, { preserveScroll: true, preserveState: true })
}

function resetSearch(): void {
    q.value = ''
    runSearch()
}

const context = computed(() => {
    const { waiting, total } = props.summary

    if (total === 0) {
        return 'Noch keine Anfrage'
    }

    return `${decimal(waiting, 0)} ${waiting === 1 ? 'wartet' : 'warten'} · ${decimal(total, 0)} ${total === 1 ? 'Anfrage' : 'Anfragen'} insgesamt`
})
</script>

<template>
    <AdminPage title="Anfragen" :context="context">
        <AdminState
            v-if="summary.total === 0"
            kind="empty"
            text="Kundinnen und Kunden tragen sich im Shop ein, wenn für ihr Fahrzeug noch keine Felge freigegeben ist."
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
                                <td data-label="Wartende" class="num">{{ decimal(row.waiting, 0) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p v-if="(summary.vehicles ?? 0) > demand.length" class="adm-note ben__more">
                    Hier stehen die {{ decimal(demand.length, 0) }} von {{ decimal(summary.vehicles ?? 0, 0) }} Fahrzeugen mit den meisten Wartenden. Jede Anfrage steht unter „Alle Anfragen“.
                </p>
            </section>

            <section class="adm-section" aria-labelledby="ben-all">
                <div class="adm-section__head">
                    <h2 id="ben-all" class="adm-section__title">Alle Anfragen</h2>
                </div>
                <form class="ben-search" role="search" @submit.prevent="runSearch">
                    <div class="form-field">
                        <label class="form-field__label" for="ben-q">Suchen</label>
                        <input id="ben-q" v-model="q" class="input" type="search" maxlength="100" autocomplete="off" placeholder="E-Mail-Adresse, Fahrzeug oder HSN/TSN">
                    </div>
                    <button class="btn btn--secondary" type="submit">Suchen</button>
                </form>
                <!-- A search that finds nothing is said once, by the state below — as in every other list. -->
                <p v-if="search !== '' && summary.found > 0" class="adm-note ben__note">{{ summary.found === 1 ? '1 Anfrage gefunden.' : `${decimal(summary.found, 0)} Anfragen gefunden.` }}</p>

                <AdminState v-if="subscriptions.length === 0 && search !== ''" kind="filtered" :total="summary.total" @reset="resetSearch" />

                <div v-else class="adm-panel">
                    <table class="adm-table">
                        <thead>
                            <tr>
                                <th scope="col">E-Mail</th>
                                <th scope="col">Fahrzeug</th>
                                <th scope="col">Status</th>
                                <th scope="col" class="num">Angefragt am</th>
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
                                <td data-label="Status" data-phone="status">
                                    <span v-if="TAGGED.has(row.status)" class="adm-tag adm-tag--neutral">{{ row.status }}</span>
                                    <template v-else>{{ row.status }}</template>
                                </td>
                                <td data-label="Angefragt am" class="num">{{ row.requestedAt }}</td>
                                <td data-label="Benachrichtigt" class="num">{{ row.notifiedAt ?? '–' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <ListPager :pagination="pagination" label="Seiten der Anfragen" />
            </section>
        </template>
    </AdminPage>
</template>

<style scoped>
.ben__note {
    margin-bottom: var(--sp-12);
}

/* The search above the list: the field takes what room there is, the button stays beside it, and wraps under it on a phone. */
.ben-search {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--sp-12);
    margin-bottom: var(--sp-16);
}

.ben-search .form-field {
    flex: 1 1 280px;
    max-width: 480px;
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
