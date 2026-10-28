<script setup lang="ts">
/**
 * Katalog › Reifen (his admin item 10, D-302): every tyre the shop can put on a Felge — one size of one profile per row —
 * and whether the shop offers it now. Offered means available (D-301) and its EU label complete on record (D-303); only
 * the exception is tagged, the normal state is plain text. A tyre whose label is still missing is kept and listed for the
 * backfill, one click away.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { computed, reactive } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSortHeader from '../../../Components/Admin/AdminSortHeader.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal, withUnit } from '../../../format'
import { nextSort, sortQuery, type ListSort } from '../../../lib/adminSort'
import { formatMoney } from '../../../lib/num'
import type { AdminReifenIndexProps, TyreRow } from '../../../types/admin/reifen'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminReifenIndexProps>()

const BASE = '/admin/reifen'

const form = reactive({ q: props.filters.q, marke: props.filters.marke, saison: props.filters.saison, zoll: props.filters.zoll, stand: props.filters.stand })

/* The order (F-32): the plain list is A to Z by brand and profile; a heading turns it, kept across filters and pages. */
const PLAIN: ListSort = { sort: 'reifen', richtung: 'auf' }
const order = computed<ListSort>(() => ({ sort: props.filters.sort, richtung: props.filters.richtung }))

function sortBy(column: string): void {
    const rest = Object.fromEntries(Object.entries(props.query).filter(([key]) => key !== 'sort' && key !== 'richtung'))

    router.get(BASE, { ...rest, ...sortQuery(nextSort(order.value, column), PLAIN) }, { preserveScroll: true, preserveState: true })
}

const context = computed(() => {
    const text = `${decimal(props.pagination.total, 0)} Reifen`

    return props.filtered ? `${text} · gefiltert` : text
})

/* A link whose filter does not read opens the list without it — and says so, as the Felgen list does. */
const FILTER_KEYS = ['q', 'marke', 'saison', 'zoll', 'stand', 'sort', 'richtung', 'seite']
const page = usePage()

const refusals = computed<string[]>(() => {
    const raw: unknown = page.props.errors

    if (raw === null || typeof raw !== 'object') {
        return []
    }

    return Object.entries(raw as Record<string, unknown>)
        .filter(([key]) => FILTER_KEYS.includes(key))
        .map(([, message]) => message)
        .filter((m): m is string => typeof m === 'string' && m !== '')
})

function query(): Record<string, string> {
    const out: Record<string, string> = {}

    for (const [key, value] of Object.entries(form)) {
        if (value.trim() !== '') {
            out[key] = value.trim()
        }
    }

    return { ...out, ...sortQuery(order.value, PLAIN) }
}

function apply(): void {
    router.get(BASE, query(), { preserveScroll: true, preserveState: true })
}

function reset(): void {
    Object.assign(form, { q: '', marke: '', saison: '', zoll: '', stand: '' })
    router.get(BASE, sortQuery(order.value, PLAIN), { preserveScroll: true, preserveState: true })
}

/** `B · A · 71 dB (B)` — the label's classes in the order the printed label stands them. */
function labelLine(row: TyreRow): string {
    const label = row.label

    return label === null ? '' : `${label.fuel} · ${label.wet} · ${withUnit(label.noiseDb, 'dB')} (${label.noiseClass})`
}
</script>

<template>
    <AdminPage title="Reifen" :context="context">
        <template v-if="can.create" #primary>
            <Link href="/admin/reifen/neu" class="btn btn--primary">
                <Icon name="plus" :size="20" />
                Neuer Reifen
            </Link>
        </template>

        <p class="adm-note rf-intro">
            Reifen verkauft der Shop als Komplettrad, nie allein. Angeboten wird ein Reifen auf Felgen, deren Gutachten seine
            Größe für das Fahrzeug des Kunden freigibt. Dafür muss er verfügbar und sein EU-Reifenlabel vollständig
            eingetragen sein.
        </p>

        <div v-if="refusals.length" class="adm-alert" role="alert">
            <p v-for="message in refusals" :key="message">{{ message }}</p>
        </div>

        <!-- The backfill (D-303): real tyres whose label is not complete on record are kept, and not offered until it is. -->
        <p v-if="missingLabels > 0 && filters.stand !== 'label-fehlt'" class="adm-note rf-backfill">
            {{ decimal(missingLabels, 0) }} {{ missingLabels === 1 ? 'Reifen ist' : 'Reifen sind' }} ohne vollständiges EU-Reifenlabel
            und {{ missingLabels === 1 ? 'wird' : 'werden' }} deshalb nicht angeboten.
            <Link href="/admin/reifen?stand=label-fehlt">{{ missingLabels === 1 ? 'Nur diesen anzeigen' : 'Nur diese anzeigen' }}</Link>
        </p>

        <form class="rf-search" role="search" :action="BASE" method="get" @submit.prevent="apply">
            <div class="form-field rf-search__q">
                <label class="form-field__label" for="rf-q">Suche</label>
                <input id="rf-q" v-model="form.q" class="input" type="search" name="q" maxlength="80" placeholder="Marke, Profil oder Größe wie 225/45 R18" autocomplete="off">
            </div>
            <div class="form-field">
                <label class="form-field__label" for="rf-marke">Marke</label>
                <select id="rf-marke" v-model="form.marke" class="input">
                    <option value="">Alle</option>
                    <option v-for="brand in options.brands" :key="brand.value" :value="brand.value">{{ brand.label }}</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="rf-saison">Saison</label>
                <select id="rf-saison" v-model="form.saison" class="input">
                    <option value="">Alle</option>
                    <option value="sommer">Sommerreifen</option>
                    <option value="winter">Winterreifen</option>
                    <option value="ganzjahres">Ganzjahresreifen</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="rf-zoll">Durchmesser</label>
                <select id="rf-zoll" v-model="form.zoll" class="input">
                    <option value="">Alle</option>
                    <option v-for="d in options.diameters" :key="d.value" :value="d.value">{{ d.label }}</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="rf-stand">Stand</label>
                <select id="rf-stand" v-model="form.stand" class="input">
                    <option value="">Alle</option>
                    <option v-for="s in options.stands" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
            </div>
            <div class="rf-search__actions">
                <button class="btn btn--secondary" type="submit">Suchen</button>
                <button v-if="filtered" class="btn btn--ghost" type="button" @click="reset">Zurücksetzen</button>
            </div>
        </form>

        <AdminState v-if="tyres.length === 0 && filtered" kind="filtered" :total="totalAll" @reset="reset" />
        <AdminState v-else-if="tyres.length === 0" kind="empty" text="Reifen erscheinen hier, sobald du einen anlegst – jede Größe eines Profils als eigenen Reifen, mit ihrem EU-Reifenlabel.">
            <Link v-if="can.create" href="/admin/reifen/neu" class="btn btn--primary">Neuer Reifen</Link>
        </AdminState>

        <template v-else>
            <div class="adm-panel">
                <table class="adm-table">
                    <caption class="visually-hidden">Reifen, {{ context }}</caption>
                    <thead>
                        <tr>
                            <AdminSortHeader label="Reifen" column="reifen" :sort="filters.sort" :richtung="filters.richtung" @sort="sortBy" />
                            <AdminSortHeader label="Größe" column="groesse" :sort="filters.sort" :richtung="filters.richtung" @sort="sortBy" />
                            <th scope="col">EU-Reifenlabel</th>
                            <AdminSortHeader label="Preis" column="preis" :sort="filters.sort" :richtung="filters.richtung" num @sort="sortBy" />
                            <th scope="col">Stand</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="tyre in tyres" :key="tyre.id">
                            <td data-label="Reifen">
                                <Link :href="tyre.href" class="rf-name"><span class="rf-brand">{{ tyre.brand }}</span> {{ tyre.name }}</Link>
                                <span v-if="tyre.demo" class="adm-tag adm-tag--neutral adm-demo">Demodaten</span>
                                <span class="rf-sub">{{ tyre.season }}</span>
                            </td>
                            <td data-label="Größe" class="rf-size">{{ tyre.size }}</td>
                            <td data-label="EU-Reifenlabel">
                                <template v-if="tyre.label">
                                    <span class="rf-label">{{ labelLine(tyre) }}</span>
                                    <span v-if="tyre.label.snow || tyre.label.ice" class="rf-sub">
                                        {{ [tyre.label.snow ? 'Schneegriffigkeit' : '', tyre.label.ice ? 'Eisgriffigkeit' : ''].filter(Boolean).join(' · ') }}
                                    </span>
                                </template>
                                <template v-else-if="tyre.demo">–</template>
                                <span v-else class="adm-tag adm-tag--warn" :title="`Noch nicht eingetragen: ${tyre.missingLabel.join(', ')}`">Unvollständig</span>
                            </td>
                            <td data-label="Preis" class="num">{{ formatMoney(tyre.priceCents) }}</td>
                            <td data-label="Stand" data-phone="status">
                                <span v-if="tyre.demo" class="rf-quiet">Demodaten</span>
                                <span v-else-if="!tyre.available" class="adm-tag adm-tag--neutral">Nicht verfügbar</span>
                                <span v-else-if="!tyre.offered" class="adm-tag adm-tag--warn">Nicht im Shop</span>
                                <template v-else>Im Shop</template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <nav v-if="pagination.last > 1" class="rf-pages" aria-label="Seiten der Reifen">
                <Link v-if="pagination.prev" :href="pagination.prev" class="btn btn--secondary" preserve-scroll>
                    <Icon name="chevron-left" :size="16" />
                    Vorherige
                </Link>
                <span v-else aria-hidden="true" />
                <p class="rf-pages__where">Seite {{ decimal(pagination.current, 0) }} von {{ decimal(pagination.last, 0) }}</p>
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
.rf-intro,
.rf-backfill {
    margin-bottom: var(--sp-16);
}

.rf-search {
    display: grid;
    grid-template-columns: minmax(0, 2fr) repeat(4, minmax(0, 1fr)) auto;
    align-items: end;
    gap: var(--sp-8) var(--sp-12);
    margin-bottom: var(--sp-24);
}

.rf-search .form-field {
    margin: 0;
}

.rf-search__actions {
    display: flex;
    gap: var(--sp-8);
}

.rf-name {
    color: var(--c-ink);
    font-weight: 500;
    text-decoration: none;
}

.rf-brand {
    font-weight: 400;
    color: var(--c-ink-2);
}

@media (hover: hover) and (pointer: fine) {
    .rf-name:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.rf-sub {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

/* The size as a tyre's wall prints it: a code, kept on one line. */
.rf-size,
.rf-label {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.rf-quiet {
    color: var(--c-ink-3);
}

.rf-pages {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
    margin-top: var(--sp-24);
}

.rf-pages__where {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

/* Below 1100 the filters take two rows before they squeeze: the search alone on the first. */
@media (max-width: 1099px) {
    .rf-search {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .rf-search__q,
    .rf-search__actions {
        grid-column: 1 / -1;
    }
}

@media (max-width: 767px) {
    .rf-search .btn,
    .rf-pages .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
