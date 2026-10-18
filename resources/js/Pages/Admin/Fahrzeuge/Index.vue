<script setup lang="ts">
/**
 * Fahrzeuge — every vehicle variant the shop knows (and, as „Zur Prüfung“, the ones still missing the
 * legal data a verdict needs, R-03). Found by name or HSN/TSN; each row says how many released
 * Gutachten rows name it.
 */

import { Link, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<{
    review: boolean
    vehicles: { id: number; name: string; variant: string; keys: string; window: string; power: string | null; approvals: number; needsReview: boolean; demo?: boolean; href: string }[]
    filters: { q: string; marke: string }
    makes: string[]
    counts: { all: number; review: number }
    pagination: { current: number; last: number; total: number; prev: string | null; next: string | null }
}>()

const BASE = computed(() => (props.review ? '/admin/fahrzeuge/pruefung' : '/admin/fahrzeuge'))
const q = ref(props.filters.q)
const marke = ref(props.filters.marke)
const filtered = computed(() => props.filters.q !== '' || props.filters.marke !== '')

const context = computed(() => {
    const n = props.pagination.total
    const text = `${decimal(n, 0)} ${n === 1 ? 'Fahrzeug' : 'Fahrzeuge'}`

    return filtered.value ? `${text} · gefiltert` : text
})

function apply(): void {
    const query: Record<string, string> = {}

    if (q.value.trim()) {
        query.q = q.value.trim()
    }

    if (marke.value) {
        query.marke = marke.value
    }

    router.get(BASE.value, query, { preserveScroll: true, preserveState: true })
}

function reset(): void {
    q.value = ''
    marke.value = ''
    router.get(BASE.value, {}, { preserveScroll: true, preserveState: true })
}
</script>

<template>
    <AdminPage :title="review ? 'Zur Prüfung' : 'Fahrzeuge'" :context="context">
        <p v-if="review" class="adm-note fz-intro">Diesen Fahrzeugen fehlen Achslasten oder die Höchstgeschwindigkeit. Die Felgen zeigt der Shop trotzdem mit ihrer Freigabe. Wo er die fehlenden Werte für die Reifen braucht, bestätigt er die Reifen nur für Kunden, die ihre Werte aus der Zulassungsbescheinigung Teil I (Felder 8.1, 8.2 und T) eintragen. Ohne bestätigte Reifen verkauft er weder Felge noch Komplettrad.</p>

        <nav class="fz-tabs" aria-label="Fahrzeuge">
            <Link href="/admin/fahrzeuge" class="fz-tab" :aria-current="review ? undefined : 'page'">Alle · {{ decimal(counts.all, 0) }}</Link>
            <Link href="/admin/fahrzeuge/pruefung" class="fz-tab" :aria-current="review ? 'page' : undefined">Zur Prüfung · {{ decimal(counts.review, 0) }}</Link>
        </nav>

        <form class="fz-search" role="search" @submit.prevent="apply">
            <label class="visually-hidden" for="fz-q">Fahrzeuge durchsuchen</label>
            <input id="fz-q" v-model="q" class="input" type="search" maxlength="80" placeholder="Marke, Modell oder HSN/TSN" autocomplete="off">
            <label class="visually-hidden" for="fz-marke">Marke</label>
            <select id="fz-marke" v-model="marke" class="input fz-make">
                <option value="">Alle Marken</option>
                <option v-for="make in makes" :key="make" :value="make">{{ make }}</option>
            </select>
            <button class="btn btn--secondary" type="submit">Suchen</button>
            <button v-if="filtered" class="btn btn--ghost" type="button" @click="reset">Zurücksetzen</button>
        </form>

        <AdminState v-if="vehicles.length === 0 && filtered" kind="filtered" :total="review ? counts.review : counts.all" @reset="reset" />
        <AdminState v-else-if="vehicles.length === 0 && review" kind="empty" text="Kein Fahrzeug wartet auf seine Angaben." />
        <!-- Empty, the way on is the Gutachten: its rows put the cars in, until the vehicle dataset is loaded. -->
        <AdminState v-else-if="vehicles.length === 0" kind="empty" text="Fahrzeuge erscheinen hier, sobald sie in einem Gutachten eingetragen sind oder der Fahrzeugdatensatz eingespielt ist.">
            <Link href="/admin/gutachten" class="btn btn--secondary">Zu den Gutachten</Link>
        </AdminState>

        <template v-else>
            <div class="adm-panel">
                <table class="adm-table">
                    <caption class="visually-hidden">{{ review ? 'Fahrzeuge zur Prüfung' : 'Fahrzeuge' }}, {{ context }}</caption>
                    <thead>
                        <tr>
                            <th scope="col">Fahrzeug</th>
                            <th scope="col">HSN/TSN</th>
                            <th scope="col">Bauzeitraum</th>
                            <th scope="col" class="num">Freigaben</th>
                            <th scope="col">Stand</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="vehicle in vehicles" :key="vehicle.id">
                            <td data-label="Fahrzeug">
                                <Link :href="vehicle.href" class="fz-name">{{ vehicle.name }}</Link>
                                <span v-if="vehicle.demo" class="adm-tag adm-tag--neutral adm-demo">Demodaten</span>
                                <span class="fz-sub">{{ vehicle.variant }}<template v-if="vehicle.power"> · {{ vehicle.power }}</template></span>
                            </td>
                            <td data-label="HSN/TSN" class="fz-keys">{{ vehicle.keys }}</td>
                            <td data-label="Bauzeitraum">{{ vehicle.window }}</td>
                            <td data-label="Freigaben" class="num">{{ decimal(vehicle.approvals, 0) }}</td>
                            <td data-label="Stand" data-phone="status">
                                <span v-if="vehicle.needsReview" class="adm-tag adm-tag--warn">Angaben fehlen</span>
                                <template v-else>Vollständig</template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <nav v-if="pagination.last > 1" class="fz-pages" aria-label="Seiten der Fahrzeuge">
                <Link v-if="pagination.prev" :href="pagination.prev" class="btn btn--secondary" preserve-scroll>
                    <Icon name="chevron-left" :size="16" />
                    Vorherige
                </Link>
                <span v-else aria-hidden="true" />
                <p class="fz-pages__where">Seite {{ decimal(pagination.current, 0) }} von {{ decimal(pagination.last, 0) }}</p>
                <Link v-if="pagination.next" :href="pagination.next" class="btn btn--secondary" preserve-scroll>
                    Nächste
                    <Icon name="chevron-right" :size="16" />
                </Link>
                <span v-else aria-hidden="true" />
            </nav>
        </template>
    </AdminPage>
</template>

<style scoped>
.fz-intro {
    margin-bottom: var(--sp-16);
}

.fz-tabs {
    display: flex;
    gap: var(--sp-24);
    margin-bottom: var(--sp-16);
    border-bottom: 1px solid var(--c-line);
}

.fz-tab {
    padding-block: var(--sp-12);
    border-bottom: 2px solid transparent;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    text-decoration: none;
    font-variant-numeric: tabular-nums;
}

.fz-tab[aria-current='page'] {
    border-bottom-color: var(--c-ink);
    color: var(--c-ink);
}

.fz-search {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    margin-bottom: var(--sp-16);
}

.fz-search .input {
    flex: 1 1 28ch;
    min-width: 0;
}

.fz-search .fz-make {
    flex: 0 1 22ch;
}

.fz-name {
    color: var(--c-ink);
    font-weight: 500;
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .fz-name:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.fz-sub {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.fz-keys {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.fz-pages {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
    margin-top: var(--sp-24);
}

.fz-pages__where {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

@media (max-width: 767px) {
    .fz-search .btn,
    .fz-pages .btn {
        min-height: var(--adm-control-h-lg);
    }

    .fz-search .fz-make {
        flex: 1 1 100%;
    }
}
</style>
