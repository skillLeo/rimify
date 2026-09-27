<script setup lang="ts">
/**
 * Verkauf › Bestellungen: every order, found by what the team knows about it — the number, a name,
 * an e-mail address, the car (docs/admin/rest-build-plan.md, step 2.1).
 *
 * Search, filters and sort live in the URL, so a view is a link and Back returns to it. The filters
 * are applied with a button, not on every change: a list that reloads under the keyboard is a list
 * nobody can use. Each row says in words how the order stands — paid or not, sent or not — and a
 * seeded order says it is Demodaten, so nobody ships wheels to a customer who does not exist.
 *
 * On a phone the list comes first; the filters, the sort and the export wait behind one "Filter"
 * button in a sheet, which says how many are on.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import ColumnChooser from '../../../Components/Admin/Lists/ColumnChooser.vue'
import ListViews from '../../../Components/Admin/Lists/ListViews.vue'
import BottomSheet from '../../../Components/Mobile/BottomSheet.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { berlinToday } from '../../../composables/admin/days'
import { hasMobileShell } from '../../../composables/mobile/useMobileShell'
import { decimal } from '../../../format'
import type { AdminBestellungenProps, OrderSort, OrderState } from '../../../types/admin/bestellungen'
import type { ColumnsInForce } from '../../../types/admin/lists'
import FilterFields from './FilterFields.vue'
import { activeCount, formFromFilters, nextSort, queryFromForm, sortQuery, type FilterForm } from './filters'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminBestellungenProps>()

const BASE = '/admin/bestellungen'

const EMPTY_TEXT = 'Hier erscheint jede Bestellung, sobald jemand im Shop bestellt – mit Zahlung, Versand und dem Gutachten, unter dem sie verkauft wurde.'

/** The table's columns, in the list's order (AdminLists on the server names the same keys). */
const COLUMNS: { id: string; key: OrderSort | null; label: string; num?: boolean }[] = [
    { id: 'nummer', key: null, label: 'Nummer' },
    { id: 'datum', key: 'datum', label: 'Datum' },
    { id: 'kunde', key: null, label: 'Kundin oder Kunde' },
    { id: 'fahrzeug', key: null, label: 'Fahrzeug' },
    { id: 'summe', key: 'summe', label: 'Summe', num: true },
    { id: 'zahlung', key: 'status', label: 'Zahlung' },
    { id: 'versand', key: null, label: 'Versand' },
]

const page = usePage()

/* The Spaltenwahl: the person's own, from the server in the first frame; changed here at once. */
const mine = ref<string[]>([...props.columns.shown])
watch(
    () => props.columns.shown,
    (value) => (mine.value = [...value])
)

/*
 * A view saved with „Spalten mitspeichern“ shows its own columns while it is open — from the first
 * frame, since the view comes with the page. Changed on screen they are a draft the owner can save
 * into the view; „Meine Spalten wiederherstellen“ shows the person's own for as long as the view
 * stays open (the filters may change, the pages may turn).
 */
const openView = computed(() => props.views.items.find((view) => view.id === props.views.active) ?? null)
const draft = ref<string[] | null>(null)
const ownFor = ref<number | null>(null)

watch(
    () => `${props.views.active ?? ''}:${openView.value?.columns?.join() ?? ''}`,
    () => (draft.value = null)
)

const inForce = computed<ColumnsInForce>(() => {
    const view = openView.value

    return view?.storesColumns && view.columns && ownFor.value !== view.id
        ? { keys: draft.value ?? view.columns, fromView: true }
        : { keys: mine.value, fromView: false }
})

const shown = computed({
    get: () => inForce.value.keys,
    set: (keys: string[]) => {
        if (inForce.value.fromView) {
            draft.value = keys
        } else {
            mine.value = keys
        }
    },
})

function ownColumns(): void {
    ownFor.value = props.views.active
    draft.value = null
}

/* The column the list is sorted by is always there: hidden, its arrow — the only way to see and turn
   the order — would be gone with it. The chooser shows it fixed while the sort lasts. The list's own
   order (newest first) needs no arrow to be understood: Datum may go. */
const sortedColumn = computed(() =>
    props.filters.sort === 'datum' && props.filters.richtung === 'ab' ? null : (COLUMNS.find((column) => column.key === props.filters.sort)?.id ?? null)
)
const visible = computed(() => (sortedColumn.value && !shown.value.includes(sortedColumn.value) ? [...shown.value, sortedColumn.value] : shown.value))
const columns = computed(() => COLUMNS.filter((column) => visible.value.includes(column.id)))
const has = (id: string): boolean => visible.value.includes(id)

/*
 * Back and Forward bring a page from the browser's history, as it was — with the views and the
 * columns of then. Both are the account's now: asked for again, quietly, once the page is back.
 */
function refreshFromServer(): void {
    router.reload({ only: ['views', 'columns'] })
}

onMounted(() => window.addEventListener('popstate', refreshFromServer))
onBeforeUnmount(() => window.removeEventListener('popstate', refreshFromServer))

const form = ref<FilterForm>(formFromFilters(props.filters, berlinToday()))
const search = ref(props.filters.q)
const dateError = ref('')
const busy = ref(false)

/** The phone's filter sheet — only where the admin layout provides the sheet's shell. */
const sheetAvailable = hasMobileShell()
const sheetOpen = ref(false)
const active = computed(() => activeCount(props.filters))
const sort = computed(() => ({ sort: props.filters.sort, richtung: props.filters.richtung }))

// After every visit the server's filters are the truth: the form shows what is actually applied.
watch(
    () => props.filters,
    (filters) => {
        form.value = formFromFilters(filters, berlinToday())
        search.value = filters.q
        dateError.value = ''
    }
)

const context = computed(() => {
    const n = props.pagination.total
    const count = `${decimal(n, 0)} ${n === 1 ? 'Bestellung' : 'Bestellungen'}`

    return props.filtered ? `${count} · gefiltert` : count
})

/** The query's own keys (BestellungenFilterRequest): only their refusals belong above the list. */
const FILTER_KEYS = ['q', 'status', 'zeitraum', 'von', 'bis', 'zahlart', 'versandart', 'min', 'max', 'auflagen', 'sort', 'richtung', 'seite', 'ansicht']

/** A filter the server refused, in its own words — a view's name refused is the dialog's to say. */
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

/**
 * Filters applied, a column sorted: the open view stays open, now changed — so it can be saved over
 * or set back (ListViews). `keepView: false` leaves it: back to the whole list.
 */
function visit(query: Record<string, string>, keepView = true): void {
    busy.value = true

    if (keepView && props.views.active !== null) {
        query = { ...query, ansicht: String(props.views.active) }
    }

    router.get(BASE, query, {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => {
            busy.value = false
        },
    })
}

function apply(): void {
    const result = queryFromForm(form.value, search.value, sort.value, berlinToday())

    if ('error' in result) {
        dateError.value = result.error

        return
    }

    dateError.value = ''
    sheetOpen.value = false
    visit(result.query)
}

function reset(): void {
    search.value = ''
    form.value = { status: '', zeitraum: '', von: '', bis: '', zahlart: '', versandart: '', min: '', max: '', auflagen: false }
    dateError.value = ''
    sheetOpen.value = false
    visit(sortQuery(sort.value), false)
}

/** A column heading re-sorts the list as it stands: the filters in force stay. */
function sortBy(column: OrderSort): void {
    const next = nextSort(sort.value, column)
    const query = Object.fromEntries(Object.entries(props.query).filter(([key]) => key !== 'sort' && key !== 'richtung'))

    visit({ ...query, ...sortQuery(next) })
}

function sortState(column: OrderSort | null): 'ascending' | 'descending' | undefined {
    if (column === null || props.filters.sort !== column) {
        return undefined
    }

    return props.filters.richtung === 'auf' ? 'ascending' : 'descending'
}

/** The phone sheet's sort select: one value per field and direction. */
const sortChoice = computed({
    get: () => `${props.filters.sort}:${props.filters.richtung}`,
    set: (value: string) => {
        const [column, direction] = value.split(':') as [OrderSort, 'auf' | 'ab']
        const query = Object.fromEntries(Object.entries(props.query).filter(([key]) => key !== 'sort' && key !== 'richtung'))

        sheetOpen.value = false
        visit({ ...query, ...sortQuery({ sort: column, richtung: direction }) })
    },
})

function tagClass(state: OrderState): string | null {
    return state.tone === 'plain' ? null : `adm-tag adm-tag--${state.tone}`
}
</script>

<template>
    <AdminPage title="Bestellungen" :context="context">
        <template #primary>
            <span class="ob-columns">
                <ColumnChooser
                    v-model:shown="shown"
                    list="bestellungen"
                    :columns="props.columns.all"
                    :defaults="props.columns.defaults"
                    :sorted="sortedColumn"
                    :owner="inForce.fromView ? 'view' : 'person'"
                />
            </span>
            <!-- Plain links, not Inertia visits: the answer is a file, and the page stays. -->
            <DropdownMenuRoot v-if="exportUrls">
                <DropdownMenuTrigger class="btn btn--secondary ob-export">
                    <Icon name="export" :size="20" />
                    Exportieren
                    <Icon name="chevron-down" :size="16" />
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuContent class="adm-menu" align="end" :side-offset="8">
                        <DropdownMenuItem as-child>
                            <a class="adm-menu__item" :href="exportUrls.xlsx" download>Als Excel-Datei (.xlsx)</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem as-child>
                            <a class="adm-menu__item" :href="exportUrls.csv" download>Als CSV-Datei</a>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenuPortal>
            </DropdownMenuRoot>
        </template>

        <ListViews list="bestellungen" :base="BASE" all-label="Alle Bestellungen" :views="views" :query="query" :columns="inForce" @own-columns="ownColumns" />

        <div v-if="refusals.length" class="adm-alert" role="alert">
            <p v-for="message in refusals" :key="message" class="ob-refusal">{{ message }}</p>
        </div>

        <form class="ob-search" role="search" :action="BASE" method="get" @submit.prevent="apply">
            <label class="visually-hidden" for="ob-q">Bestellungen durchsuchen</label>
            <input
                id="ob-q"
                v-model="search"
                class="input"
                type="search"
                name="q"
                maxlength="120"
                placeholder="Nummer, Name, E-Mail oder Fahrzeug"
                autocomplete="off"
            >
            <button class="btn btn--secondary" type="submit" :disabled="busy">Suchen</button>
        </form>

        <!-- From 768 px: the filters in one row above the list. -->
        <form class="ob-filters" :action="BASE" method="get" aria-label="Bestellungen filtern" @submit.prevent="apply">
            <div class="ob-filters__fields">
                <FilterFields
                    v-model:form="form"
                    :statuses="options.statuses"
                    :payment="options.payment"
                    :shipping="options.shipping"
                    id-prefix="ob"
                    :date-error="dateError"
                />
                <div class="ob-filters__actions">
                    <button class="btn btn--secondary" type="submit" :disabled="busy" :aria-busy="busy ? 'true' : undefined">Anwenden</button>
                    <button v-if="filtered" class="btn btn--ghost" type="button" :disabled="busy" @click="reset">Zurücksetzen</button>
                </div>
            </div>
        </form>

        <!-- Below 768: the list first, the filters behind one button. -->
        <div v-if="sheetAvailable" class="ob-filterbar">
            <button class="btn btn--secondary" type="button" aria-haspopup="dialog" @click="sheetOpen = true">
                <Icon name="filter" :size="20" />
                {{ active > 0 ? `Filter · ${active}` : 'Filter und Sortierung' }}
            </button>
            <button v-if="filtered" class="btn btn--ghost" type="button" :disabled="busy" @click="reset">Zurücksetzen</button>
        </div>

        <BottomSheet v-if="sheetAvailable" id="bestellungen-filter" v-model:open="sheetOpen" title="Bestellungen filtern">
            <form class="ob-sheet" aria-label="Bestellungen filtern" @submit.prevent="apply">
                <div class="form-field">
                    <label class="form-field__label" for="ob-s-sort">Sortierung</label>
                    <select id="ob-s-sort" v-model="sortChoice" class="input">
                        <option value="datum:ab">Neueste zuerst</option>
                        <option value="datum:auf">Älteste zuerst</option>
                        <option value="summe:ab">Höchste Summe zuerst</option>
                        <option value="summe:auf">Niedrigste Summe zuerst</option>
                        <option value="status:auf">Nach Status</option>
                    </select>
                </div>
                <FilterFields
                    v-model:form="form"
                    :statuses="options.statuses"
                    :payment="options.payment"
                    :shipping="options.shipping"
                    id-prefix="ob-s"
                    :date-error="dateError"
                />
                <button class="btn btn--primary btn--block" type="submit" :disabled="busy">Anwenden</button>
                <button v-if="filtered" class="btn btn--secondary btn--block" type="button" :disabled="busy" @click="reset">Zurücksetzen</button>
                <template v-if="exportUrls">
                    <a class="btn btn--ghost btn--block" :href="exportUrls.xlsx" download>Als Excel-Datei exportieren</a>
                    <a class="btn btn--ghost btn--block" :href="exportUrls.csv" download>Als CSV-Datei exportieren</a>
                </template>
            </form>
        </BottomSheet>

        <template v-if="orders.length === 0">
            <AdminState v-if="filtered" kind="filtered" :total="totalAll" @reset="reset" />
            <AdminState v-else kind="empty" :text="EMPTY_TEXT" />
        </template>

        <template v-else>
            <div class="adm-panel" :aria-busy="busy ? 'true' : undefined">
                <table class="adm-table ob-table">
                    <caption class="visually-hidden">Bestellungen, {{ context }}</caption>
                    <thead>
                        <tr>
                            <th
                                v-for="column in columns"
                                :key="column.id"
                                scope="col"
                                :class="{ num: column.num }"
                                :aria-sort="sortState(column.key)"
                            >
                                <button v-if="column.key" class="ob-sort" type="button" :disabled="busy" @click="sortBy(column.key)">
                                    {{ column.label }}
                                    <Icon
                                        class="ob-sort__icon"
                                        :class="{ 'ob-sort__icon--on': filters.sort === column.key }"
                                        :name="filters.sort === column.key && filters.richtung === 'auf' ? 'chevron-up' : 'chevron-down'"
                                        :size="16"
                                    />
                                </button>
                                <template v-else>{{ column.label }}</template>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="order in orders" :key="order.id">
                            <td data-label="Nummer">
                                <span class="ob-number">{{ order.number }}</span>
                                <span v-if="order.demo" class="adm-tag adm-tag--neutral ob-demo">Demodaten</span>
                                <span v-if="order.conditions" class="ob-sub">mit Auflagen</span>
                            </td>
                            <td v-if="has('datum')" data-label="Datum" class="ob-date">
                                <time :datetime="order.iso ?? undefined" :title="order.at ?? undefined">{{ order.date ?? '–' }}</time>
                                <span v-if="!order.placed" class="ob-sub">begonnen, nicht abgeschickt</span>
                            </td>
                            <td v-if="has('kunde')" data-label="Kundin oder Kunde">
                                <span class="ob-customer">{{ order.customer ?? order.email ?? '–' }}</span>
                                <span v-if="order.customer && order.email" class="ob-sub">{{ order.email }}</span>
                            </td>
                            <td v-if="has('fahrzeug')" data-label="Fahrzeug">
                                <span class="ob-vehicle">{{ order.vehicle ?? '–' }}</span>
                            </td>
                            <td v-if="has('summe')" data-label="Summe" class="num">{{ order.total }}</td>
                            <td v-if="has('zahlung')" data-label="Zahlung">
                                <span v-if="tagClass(order.payment)" :class="tagClass(order.payment)">{{ order.payment.label }}</span>
                                <template v-else>{{ order.payment.label }}</template>
                                <span v-if="order.paymentMethod" class="ob-sub">{{ order.paymentMethod }}</span>
                            </td>
                            <td v-if="has('versand')" data-label="Versand">
                                <span v-if="tagClass(order.fulfilment)" :class="tagClass(order.fulfilment)">{{ order.fulfilment.label }}</span>
                                <template v-else>{{ order.fulfilment.label }}</template>
                                <span v-if="order.shippingMethod" class="ob-sub">{{ order.shippingMethod }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <nav v-if="pagination.last > 1" class="ob-pages" aria-label="Seiten der Bestellungen">
                <!-- The state kept: a view shown with the person's own columns stays so on the next page. -->
                <Link v-if="pagination.prev" :href="pagination.prev" class="btn btn--secondary" preserve-scroll preserve-state>
                    <Icon name="chevron-left" :size="16" />
                    Vorherige
                </Link>
                <span v-else class="ob-pages__spacer" aria-hidden="true" />

                <p class="ob-pages__where">Seite {{ decimal(pagination.current, 0) }} von {{ decimal(pagination.last, 0) }}</p>

                <Link v-if="pagination.next" :href="pagination.next" class="btn btn--secondary" preserve-scroll preserve-state>
                    Nächste
                    <Icon name="chevron-right" :size="16" />
                </Link>
                <span v-else class="ob-pages__spacer" aria-hidden="true" />
            </nav>
        </template>
    </AdminPage>
</template>

<style scoped>
.ob-refusal {
    margin: 0;
}

/* ── Search, always in view ─────────────────────────────────────────────────────── */

.ob-search {
    display: flex;
    gap: var(--sp-8);
    max-width: var(--adm-form-max);
    margin-bottom: var(--sp-16);
}

.ob-search .input {
    flex: 1 1 auto;
    min-width: 0;
}

/* ── Filters: a row above the list from 768 px; on a phone, a button and a sheet ── */

.ob-filters {
    display: none;
    margin-bottom: var(--sp-24);
}

.ob-filters__fields {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: end;
    gap: var(--sp-16);
}

.ob-filters__actions {
    display: flex;
    gap: var(--sp-8);
}

.ob-filters :deep(.ob-date-error) {
    grid-column: 1 / -1;
}

.ob-filters :deep(.ob-date-error:empty) {
    display: none;
}

.ob-filters :deep(.ob-check) {
    min-height: var(--adm-control-h);
}

.ob-filterbar {
    display: flex;
    gap: var(--sp-8);
    margin-bottom: var(--sp-16);
}

.ob-filterbar .btn,
.ob-sheet .btn,
.ob-search .btn {
    min-height: var(--adm-control-h-lg);
}

.ob-sheet {
    display: grid;
    gap: var(--sp-16);
    padding-bottom: var(--sp-8);
}

/* ── The table ────────────────────────────────────────────────────────────────── */

.ob-sort {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
}

.ob-sort__icon {
    color: var(--c-line-2);
}

.ob-sort__icon--on {
    color: var(--c-ink);
}

@media (hover: hover) and (pointer: fine) {
    .ob-sort:hover {
        color: var(--c-ink);
    }
}

.ob-number {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.ob-demo {
    margin-left: var(--sp-8);
}

.ob-date {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.ob-sub {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
    overflow-wrap: anywhere;
}

.ob-customer,
.ob-vehicle {
    overflow-wrap: anywhere;
}

/* ── Pages ─────────────────────────────────────────────────────────────────────── */

.ob-pages {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
    margin-top: var(--sp-24);
}

.ob-pages__where {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
}

.ob-pages__spacer {
    min-width: 1px;
}

@media (min-width: 768px) {
    .ob-filters {
        display: block;
    }

    .ob-filterbar {
        display: none;
    }

    .ob-search .btn {
        min-height: 0;
    }
}

/* Between 768 and 1023 the row wraps: the fields two by two, the buttons under them. */
@media (min-width: 768px) and (max-width: 1023px) {
    .ob-filters__fields {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ob-filters__actions {
        grid-column: 1 / -1;
    }
}

/* On a phone the list is cards of the chosen columns; the choice itself is made at a desk. */
@media (max-width: 767px) {
    .ob-export,
    .ob-columns {
        display: none;
    }

    .ob-pages .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
