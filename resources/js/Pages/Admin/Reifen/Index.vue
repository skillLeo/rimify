<script setup lang="ts">
/**
 * Katalog › Reifen (his admin item 10, D-302; the Gutachten rework §9): every tyre model, with a photo where it has one, and what
 * its sizes add up to. The shop offers a size that is available (D-301) with its EU label complete on record (D-303); only the
 * exception is tagged, the normal state is plain text. Search, filters and the order stay in the address; fifty to a page.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { computed, reactive } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSortHeader from '../../../Components/Admin/AdminSortHeader.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import Picture from '../../../Components/Ui/Picture.vue'
import SeasonMark from '../../../Components/Ui/SeasonMark.vue'
import TyreSilhouette from '../../../Components/Ui/TyreSilhouette.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { anzahl, decimal } from '../../../format'
import { nextSort, sortQuery, type ListSort } from '../../../lib/adminSort'
import { formatMoney } from '../../../lib/num'
import type { AdminReifenIndexProps } from '../../../types/admin/reifen'

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
    const text = anzahl(props.pagination.total, 'Reifenmodell', 'Reifenmodelle')

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

</script>

<template>
    <AdminPage title="Reifen" :context="context">
        <template v-if="can.create" #primary>
            <Link href="/admin/reifen/neu" class="btn btn--primary">
                <Icon name="plus" :size="20" />
                Neues Reifenmodell
            </Link>
        </template>

        <p class="adm-note rf-intro">
            Reifen verkauft der Shop als Komplettrad, nie allein. Angeboten wird ein Reifen auf Felgen, deren Gutachten seine
            Größe für das Fahrzeug des Kunden freigibt. Außerdem muss er verfügbar sein und ein vollständig eingetragenes
            EU-Reifenlabel haben.
        </p>

        <div v-if="refusals.length" class="adm-alert" role="alert">
            <p v-for="message in refusals" :key="message">{{ message }}</p>
        </div>

        <!-- The backfill (D-303): real tyres whose label is not complete on record are kept, and not offered until it is. -->
        <p v-if="missingLabels > 0 && filters.stand !== 'label-fehlt'" class="adm-note rf-backfill">
            {{ decimal(missingLabels, 0) }} {{ missingLabels === 1 ? 'Größe ist' : 'Größen sind' }} ohne vollständiges EU-Reifenlabel
            und {{ missingLabels === 1 ? 'wird' : 'werden' }} deshalb nicht angeboten.
            <Link href="/admin/reifen?stand=label-fehlt">{{ missingLabels === 1 ? 'Nur das Modell mit dieser Größe anzeigen' : 'Nur Modelle mit diesen Größen anzeigen' }}</Link>
        </p>

        <form class="rf-search" role="search" :action="BASE" method="get" @submit.prevent="apply">
            <div class="form-field rf-search__q">
                <label class="form-field__label" for="rf-q">Suche</label>
                <input id="rf-q" v-model="form.q" class="input" type="search" name="q" maxlength="80" placeholder="Marke, Modell oder Größe wie 225/45 R18" autocomplete="off">
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

        <AdminState v-if="models.length === 0 && filtered" kind="filtered" :total="totalAll" @reset="reset" />
        <AdminState v-else-if="models.length === 0" kind="empty" text="Reifenmodelle erscheinen hier, sobald du eines anlegst: Marke, Modell, Saison und Fotos, dazu seine Größen mit EU-Reifenlabel.">
            <Link v-if="can.create" href="/admin/reifen/neu" class="btn btn--primary">Neues Reifenmodell</Link>
        </AdminState>

        <template v-else>
            <div class="adm-panel">
                <table class="adm-table">
                    <caption class="visually-hidden">Reifen, {{ context }}</caption>
                    <thead>
                        <tr>
                            <AdminSortHeader label="Reifen" column="reifen" :sort="filters.sort" :richtung="filters.richtung" @sort="sortBy" />
                            <th scope="col">Saison</th>
                            <th scope="col">Größen</th>
                            <AdminSortHeader label="Preis ab" column="preis" :sort="filters.sort" :richtung="filters.richtung" num @sort="sortBy" />
                            <th scope="col" class="num">Lieferanten</th>
                            <th scope="col">Stand</th>
                            <AdminSortHeader label="Geändert" column="geaendert" :sort="filters.sort" :richtung="filters.richtung" @sort="sortBy" />
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="model in models" :key="model.id">
                            <td data-label="Reifen">
                                <span class="rf-model">
                                    <span class="rf-thumb" :class="{ 'rf-thumb--none': !model.thumb }">
                                        <Picture v-if="model.thumb" :image="model.thumb" alt="" sizes="48px" />
                                        <TyreSilhouette v-else plain />
                                    </span>
                                    <span class="rf-model__text">
                                        <Link :href="model.href" class="rf-name"><span class="rf-brand">{{ model.brand }}</span> {{ model.name }}</Link>
                                        <span v-if="model.demo" class="adm-tag adm-tag--neutral adm-demo">Demodaten</span>
                                        <span class="rf-sub">{{ model.photos === 0 ? 'kein Foto' : anzahl(model.photos, 'Foto', 'Fotos') }}</span>
                                    </span>
                                </span>
                            </td>
                            <td data-label="Saison"><SeasonMark :season="model.season" /></td>
                            <td data-label="Größen">{{ anzahl(model.sizes, 'Größe', 'Größen') }}, {{ model.diameters }}</td>
                            <td data-label="Preis ab" class="num">{{ formatMoney(model.priceFromCents) }}</td>
                            <td data-label="Lieferanten" class="num" data-phone="hide">{{ model.suppliers === 0 ? '–' : decimal(model.suppliers, 0) }}</td>
                            <td data-label="Stand" data-phone="status">
                                <span v-if="model.demo" class="rf-quiet">Demodaten</span>
                                <span v-else-if="model.missingLabels > 0" class="adm-tag adm-tag--warn">{{ model.missingLabels === 1 ? '1 Größe ohne Label' : `${decimal(model.missingLabels, 0)} Größen ohne Label` }}</span>
                                <span v-else-if="model.offered === 0" class="adm-tag adm-tag--neutral">Nicht im Shop</span>
                                <template v-else-if="model.offered === model.sizes">Im Shop</template>
                                <template v-else>{{ decimal(model.offered, 0) }} von {{ decimal(model.sizes, 0) }} im Shop</template>
                            </td>
                            <td data-label="Geändert" data-phone="hide">{{ model.changed }}</td>
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

.rf-model {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
}

.rf-model__text {
    min-width: 0;
}

/* A thumbnail a list of hundreds can carry: the photo or the neutral outline, one size. */
.rf-thumb {
    display: grid;
    flex: none;
    place-items: center;
    width: 48px;
    height: 48px;
    overflow: hidden;
    border-radius: var(--r-control);
    background: var(--c-band);
}

.rf-thumb :deep(.tyre-silhouette) {
    width: 32px;
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
