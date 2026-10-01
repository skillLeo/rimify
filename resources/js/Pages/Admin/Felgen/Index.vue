<script setup lang="ts">
/**
 * Katalog › Felgen: every wheel model, found by brand, name, SKU or EAN (the review release §4.2).
 *
 * A row is a model with what its sizes add up to — how many, from which price, how much stock, and
 * how many of them an approval document already covers. „Freigaben noch nicht hinterlegt“ is counted
 * from published fitment rows, never a flag. Filters and sort live in the URL, so a view is a link.
 *
 * Several models can be published, taken out or archived at once. The server asks for each one: a
 * demo model, or one the Freigabe-Check stops, stays as it was and is named in the answer.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import ColumnChooser from '../../../Components/Admin/Lists/ColumnChooser.vue'
import ListViews from '../../../Components/Admin/Lists/ListViews.vue'
import BottomSheet from '../../../Components/Mobile/BottomSheet.vue'
import Picture from '../../../Components/Ui/Picture.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { hasMobileShell } from '../../../composables/mobile/useMobileShell'
import { decimal } from '../../../format'
import { formatMoney } from '../../../lib/num'
import type { AdminFelgenProps, WheelSort, WheelState } from '../../../types/admin/felgen'
import type { ColumnsInForce } from '../../../types/admin/lists'
import { activeCount, felgen, formFromFilters, nextSort, queryFromForm, sortQuery, type WheelFilterForm } from './list'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminFelgenProps>()

const BASE = '/admin/felgen'

const EMPTY_TEXT = 'Hier erscheint jede Felge, sobald du eine anlegst oder eine Lieferantendatei importierst.'

const COLUMNS: { id: string; key: WheelSort | null; label: string; num?: boolean }[] = [
    { id: 'felge', key: 'name', label: 'Felge' },
    { id: 'status', key: null, label: 'Status' },
    { id: 'groessen', key: 'groessen', label: 'Größen' },
    { id: 'preis', key: 'preis', label: 'Preis ab', num: true },
    { id: 'bestand', key: null, label: 'Bestand', num: true },
    { id: 'freigaben', key: null, label: 'Freigaben' },
    { id: 'aktualisiert', key: 'aktualisiert', label: 'Geändert' },
]

const page = usePage()

/* ── Spaltenwahl and Gespeicherte Ansichten, exactly as the Bestellungen list keeps them ─────── */

const mine = ref<string[]>([...props.columns.shown])
watch(
    () => props.columns.shown,
    (value) => (mine.value = [...value])
)

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

/* The sorted column stays visible: hidden, its arrow — the only way to turn the order — would go too. */
const sortedColumn = computed(() =>
    props.filters.sort === 'name' && props.filters.richtung === 'auf' ? null : (COLUMNS.find((column) => column.key === props.filters.sort)?.id ?? null)
)
const visible = computed(() => (sortedColumn.value && !shown.value.includes(sortedColumn.value) ? [...shown.value, sortedColumn.value] : shown.value))
const columns = computed(() => COLUMNS.filter((column) => visible.value.includes(column.id)))
const has = (id: string): boolean => visible.value.includes(id)

function refreshFromServer(): void {
    router.reload({ only: ['views', 'columns'] })
}

onMounted(() => window.addEventListener('popstate', refreshFromServer))
onBeforeUnmount(() => window.removeEventListener('popstate', refreshFromServer))

/* ── Search, filters, sort ─────────────────────────────────────────────────── */

const form = ref<WheelFilterForm>(formFromFilters(props.filters))
const search = ref(props.filters.q)
const busy = ref(false)
const sheetAvailable = hasMobileShell()
const sheetOpen = ref(false)
const active = computed(() => activeCount(props.filters))
const sort = computed(() => ({ sort: props.filters.sort, richtung: props.filters.richtung }))

watch(
    () => props.filters,
    (filters) => {
        form.value = formFromFilters(filters)
        search.value = filters.q
    }
)

const context = computed(() => (props.filtered ? `${felgen(props.pagination.total)} · gefiltert` : felgen(props.pagination.total)))

const FILTER_KEYS = ['q', 'status', 'marke', 'freigaben', 'demo', 'sort', 'richtung', 'seite', 'ansicht']

const refusals = computed<string[]>(() => {
    const raw: unknown = page.props.errors

    if (raw === null || typeof raw !== 'object') {
        return []
    }

    return Object.entries(raw as Record<string, unknown>)
        .filter(([key]) => FILTER_KEYS.includes(key) || key === 'action' || key.startsWith('ids'))
        .map(([, message]) => message)
        .filter((m): m is string => typeof m === 'string' && m !== '')
})

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

/* The phone sheet's sort is part of its form: it applies with the filters on „Anwenden“, never on its
   own — choosing it first must not drop the Status picked a moment before. */
const sheetSort = ref(`${props.filters.sort}:${props.filters.richtung}`)

watch(
    () => `${props.filters.sort}:${props.filters.richtung}`,
    (value) => (sheetSort.value = value)
)

function apply(): void {
    const [column, direction] = sheetSort.value.split(':') as [WheelSort, 'auf' | 'ab']
    const chosen = sheetOpen.value ? { sort: column, richtung: direction } : sort.value

    sheetOpen.value = false
    visit(queryFromForm(form.value, search.value, chosen))
}

function reset(): void {
    search.value = ''
    form.value = { status: '', marke: '', freigaben: '', demo: '' }
    sheetOpen.value = false
    visit(sortQuery(sort.value), false)
}

function sortBy(column: WheelSort): void {
    const query = Object.fromEntries(Object.entries(props.query).filter(([key]) => key !== 'sort' && key !== 'richtung'))

    visit({ ...query, ...sortQuery(nextSort(sort.value, column)) })
}

function sortState(column: WheelSort | null): 'ascending' | 'descending' | undefined {
    if (column === null || props.filters.sort !== column) {
        return undefined
    }

    return props.filters.richtung === 'auf' ? 'ascending' : 'descending'
}

function tagClass(state: WheelState): string | null {
    return state.tone === 'plain' ? null : `adm-tag adm-tag--${state.tone}`
}

function statusTag(status: string): string | null {
    // Only the exception is tagged: an archived model, out of the shop and out of the way. A draft and
    // a model in the shop are the list's two ordinary states, written as words.
    return status === 'archived' ? 'adm-tag adm-tag--neutral' : null
}

/* ── Selection and the step for all of it ─────────────────────────────────── */

const canBulk = computed(() => props.can.publish || props.can.archive)
const selected = ref<number[]>([])

// A new page of the list is a new selection: nothing chosen stays chosen out of sight.
watch(
    () => props.wheels.map((wheel) => wheel.id).join(),
    () => (selected.value = selected.value.filter((id) => props.wheels.some((wheel) => wheel.id === id)))
)

const allOnPage = computed({
    get: () => props.wheels.length > 0 && props.wheels.every((wheel) => selected.value.includes(wheel.id)),
    set: (on: boolean) => (selected.value = on ? props.wheels.map((wheel) => wheel.id) : []),
})

type BulkAction = 'publish' | 'unpublish' | 'archive'

const pending = ref<BulkAction | null>(null)
const confirmOpen = computed({
    get: () => pending.value !== null,
    set: (open: boolean) => {
        if (!open) {
            pending.value = null
        }
    },
})

const BULK: Record<BulkAction, { label: string; title: (n: string) => string; body: string }> = {
    publish: {
        label: 'Veröffentlichen',
        title: (n) => `${n} veröffentlichen?`,
        body: 'Sie sind danach im Shop. Demodaten und Felgen, die der Freigabe-Check stoppt, bleiben, wie sie sind.',
    },
    unpublish: {
        label: 'Zurückziehen',
        title: (n) => `${n} zurückziehen?`,
        body: 'Sie sind danach nicht mehr im Shop. Offene Warenkörbe mit diesen Felgen können nicht mehr bestellt werden.',
    },
    archive: {
        label: 'Archivieren',
        title: (n) => `${n} archivieren?`,
        body: 'Sie verschwinden aus dem Shop und aus dieser Liste. Unter „Status: Archiviert“ findest du sie wieder.',
    },
}

function runBulk(): void {
    if (pending.value === null) {
        return
    }

    busy.value = true
    router.post(
        `${BASE}/sammelaktion`,
        { action: pending.value, ids: selected.value },
        {
            preserveScroll: true,
            onSuccess: () => {
                selected.value = []
            },
            onFinish: () => {
                busy.value = false
                pending.value = null
                // The bar's buttons are gone with the selection: focus returns to the list's first row.
                void nextTick(() => document.querySelector<HTMLElement>('.fg-table tbody .fg-check, .fg-table tbody .fg-name')?.focus())
            },
        }
    )
}
</script>

<template>
    <AdminPage title="Felgen" :context="context">
        <template #primary>
            <span class="fg-columns">
                <ColumnChooser
                    v-model:shown="shown"
                    list="felgen"
                    :columns="props.columns.all"
                    :defaults="props.columns.defaults"
                    :sorted="sortedColumn"
                    :owner="inForce.fromView ? 'view' : 'person'"
                />
            </span>
            <Link v-if="can.import" href="/admin/katalog/import" class="btn btn--secondary fg-import">
                <Icon name="imports" :size="20" />
                Importieren
            </Link>
            <Link v-if="can.create" href="/admin/felgen/neu" class="btn btn--primary">
                <Icon name="plus" :size="20" />
                Neue Felge
            </Link>
        </template>

        <ListViews list="felgen" :base="BASE" all-label="Alle Felgen" :views="views" :query="query" :columns="inForce" @own-columns="ownColumns" />

        <div v-if="refusals.length" class="adm-alert" role="alert">
            <p v-for="message in refusals" :key="message" class="fg-refusal">{{ message }}</p>
        </div>

        <form class="fg-search" role="search" :action="BASE" method="get" @submit.prevent="apply">
            <label class="visually-hidden" for="fg-q">Felgen durchsuchen</label>
            <input id="fg-q" v-model="search" class="input" type="search" name="q" maxlength="120" placeholder="Marke, Modell, SKU oder EAN" autocomplete="off">
            <button class="btn btn--secondary" type="submit" :disabled="busy">Suchen</button>
        </form>

        <form class="fg-filters" :action="BASE" method="get" aria-label="Felgen filtern" @submit.prevent="apply">
            <div class="fg-filters__fields">
                <div class="form-field">
                    <label class="form-field__label" for="fg-status">Status</label>
                    <select id="fg-status" v-model="form.status" class="input">
                        <option value="">Entwurf und im Shop</option>
                        <option v-for="status in options.statuses" :key="status.value" :value="status.value">{{ status.label }} ({{ decimal(status.count, 0) }})</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fg-marke">Marke</label>
                    <select id="fg-marke" v-model="form.marke" class="input">
                        <option value="">Alle</option>
                        <option v-for="brand in options.brands" :key="brand.value" :value="brand.value">{{ brand.label }}</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fg-freigaben">Freigaben</label>
                    <select id="fg-freigaben" v-model="form.freigaben" class="input">
                        <option value="">Alle</option>
                        <option value="keine">Noch nicht hinterlegt</option>
                        <option value="teilweise">Für einen Teil der Größen</option>
                        <option value="alle">Für alle Größen</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fg-demo">Herkunft</label>
                    <select id="fg-demo" v-model="form.demo" class="input">
                        <option value="">Alle</option>
                        <option value="nein">Echte Felgen</option>
                        <option value="ja">Demodaten</option>
                    </select>
                </div>
                <div class="fg-filters__actions">
                    <button class="btn btn--secondary" type="submit" :disabled="busy" :aria-busy="busy ? 'true' : undefined">Anwenden</button>
                    <button v-if="filtered" class="btn btn--ghost" type="button" :disabled="busy" @click="reset">Zurücksetzen</button>
                </div>
            </div>
        </form>

        <div v-if="sheetAvailable" class="fg-filterbar">
            <button class="btn btn--secondary" type="button" aria-haspopup="dialog" @click="sheetOpen = true">
                <Icon name="filter" :size="20" />
                {{ active > 0 ? `Filter · ${active}` : 'Filter und Sortierung' }}
            </button>
            <button v-if="filtered" class="btn btn--ghost" type="button" :disabled="busy" @click="reset">Zurücksetzen</button>
        </div>

        <BottomSheet v-if="sheetAvailable" id="felgen-filter" v-model:open="sheetOpen" title="Felgen filtern">
            <form class="fg-sheet" aria-label="Felgen filtern" @submit.prevent="apply">
                <div class="form-field">
                    <label class="form-field__label" for="fg-s-sort">Sortierung</label>
                    <select id="fg-s-sort" v-model="sheetSort" class="input">
                        <option value="name:auf">Name, A bis Z</option>
                        <option value="name:ab">Name, Z bis A</option>
                        <option value="aktualisiert:ab">Zuletzt geändert zuerst</option>
                        <option value="preis:auf">Niedrigster Preis zuerst</option>
                        <option value="preis:ab">Höchster Preis zuerst</option>
                        <option value="groessen:ab">Meiste Größen zuerst</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fg-s-status">Status</label>
                    <select id="fg-s-status" v-model="form.status" class="input">
                        <option value="">Entwurf und im Shop</option>
                        <option v-for="status in options.statuses" :key="status.value" :value="status.value">{{ status.label }} ({{ decimal(status.count, 0) }})</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fg-s-marke">Marke</label>
                    <select id="fg-s-marke" v-model="form.marke" class="input">
                        <option value="">Alle</option>
                        <option v-for="brand in options.brands" :key="brand.value" :value="brand.value">{{ brand.label }}</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fg-s-freigaben">Freigaben</label>
                    <select id="fg-s-freigaben" v-model="form.freigaben" class="input">
                        <option value="">Alle</option>
                        <option value="keine">Noch nicht hinterlegt</option>
                        <option value="teilweise">Für einen Teil der Größen</option>
                        <option value="alle">Für alle Größen</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fg-s-demo">Herkunft</label>
                    <select id="fg-s-demo" v-model="form.demo" class="input">
                        <option value="">Alle</option>
                        <option value="nein">Echte Felgen</option>
                        <option value="ja">Demodaten</option>
                    </select>
                </div>
                <button class="btn btn--primary btn--block" type="submit" :disabled="busy">Anwenden</button>
                <button v-if="filtered" class="btn btn--secondary btn--block" type="button" :disabled="busy" @click="reset">Zurücksetzen</button>
            </form>
        </BottomSheet>

        <template v-if="wheels.length === 0">
            <AdminState v-if="filtered" kind="filtered" :total="totalAll" @reset="reset" />
            <AdminState v-else kind="empty" :text="EMPTY_TEXT">
                <div class="fg-empty-actions">
                    <Link v-if="can.create" href="/admin/felgen/neu" class="btn btn--primary">Neue Felge anlegen</Link>
                    <Link v-if="can.import" href="/admin/katalog/import" class="btn btn--secondary">Lieferantendatei importieren</Link>
                </div>
            </AdminState>
        </template>

        <template v-else>
            <!-- Always there, so ticking a row never moves the table under the pointer; it only fills. -->
            <div v-if="canBulk" class="fg-bulk" :class="{ 'fg-bulk--idle': selected.length === 0 }" role="region" aria-label="Auswahl">
                <p v-if="selected.length === 0" class="fg-bulk__count fg-bulk__hint">Wähl Felgen aus, um mehrere auf einmal zu veröffentlichen, zurückzuziehen oder zu archivieren.</p>
                <p v-else class="fg-bulk__count" aria-live="polite">{{ felgen(selected.length) }} ausgewählt</p>
                <div v-if="selected.length" class="fg-bulk__actions">
                    <button v-if="can.publish" class="btn btn--secondary" type="button" :disabled="busy" @click="pending = 'publish'">Veröffentlichen</button>
                    <button v-if="can.publish" class="btn btn--secondary" type="button" :disabled="busy" @click="pending = 'unpublish'">Zurückziehen</button>
                    <button v-if="can.archive" class="btn btn--secondary" type="button" :disabled="busy" @click="pending = 'archive'">Archivieren</button>
                    <button class="btn btn--ghost" type="button" @click="selected = []">Auswahl aufheben</button>
                </div>
            </div>

            <div class="adm-panel" :aria-busy="busy ? 'true' : undefined">
                <table class="adm-table fg-table">
                    <caption class="visually-hidden">Felgen, {{ context }}</caption>
                    <thead>
                        <tr>
                            <th v-if="canBulk" scope="col" class="fg-pick">
                                <input v-model="allOnPage" class="fg-check" type="checkbox" aria-label="Alle Felgen dieser Seite auswählen">
                            </th>
                            <th v-for="column in columns" :key="column.id" scope="col" :class="{ num: column.num }" :aria-sort="sortState(column.key)">
                                <button v-if="column.key" class="fg-sort" type="button" :disabled="busy" @click="sortBy(column.key)">
                                    {{ column.label }}
                                    <Icon
                                        class="fg-sort__icon"
                                        :class="{ 'fg-sort__icon--on': filters.sort === column.key }"
                                        :name="filters.sort === column.key && filters.richtung === 'auf' ? 'chevron-up' : 'chevron-down'"
                                        :size="16"
                                    />
                                </button>
                                <template v-else>{{ column.label }}</template>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="wheel in wheels" :key="wheel.id">
                            <td v-if="canBulk" class="fg-pick" data-phone="hide">
                                <input v-model="selected" class="fg-check" type="checkbox" :value="wheel.id" :aria-label="`${wheel.brand} ${wheel.name} auswählen`">
                            </td>
                            <td data-label="Felge" class="fg-key">
                                <div class="fg-wheel">
                                    <span class="fg-thumb" aria-hidden="true">
                                        <Picture v-if="wheel.image" :image="wheel.image.manifest" alt="" sizes="40px" />
                                    </span>
                                    <span class="fg-wheel__text">
                                        <Link :href="wheel.href" class="fg-name">
                                            <span class="fg-brand">{{ wheel.brand }}</span> {{ wheel.name }}
                                        </Link>
                                        <span class="fg-sub">
                                            {{ wheel.finishes === 1 ? '1 Ausführung' : `${decimal(wheel.finishes, 0)} Ausführungen` }}
                                            <span v-if="wheel.demo" class="adm-tag adm-tag--neutral fg-demo">Demodaten</span>
                                        </span>
                                        <span v-if="wheel.internalNote" class="fg-memo">Notiz: {{ wheel.internalNote }}</span>
                                    </span>
                                </div>
                            </td>
                            <td v-if="has('status')" data-label="Status" data-phone="status">
                                <span v-if="statusTag(wheel.status)" :class="statusTag(wheel.status)">{{ wheel.statusLabel }}</span>
                                <template v-else>{{ wheel.statusLabel }}</template>
                            </td>
                            <td v-if="has('groessen')" data-label="Größen">
                                <span>
                                    {{ wheel.sizes === 0 ? '–' : decimal(wheel.sizes, 0) }}
                                    <span v-if="wheel.diameters" class="fg-sub">{{ wheel.diameters }}</span>
                                </span>
                            </td>
                            <td v-if="has('preis')" data-label="Preis ab" class="num">{{ wheel.fromCents === null ? '–' : formatMoney(wheel.fromCents) }}</td>
                            <td v-if="has('bestand')" data-label="Bestand" class="num">{{ decimal(wheel.stock, 0) }}</td>
                            <td v-if="has('freigaben')" data-label="Freigaben">
                                <span v-if="tagClass(wheel.coverage)" class="fg-coverage" :class="tagClass(wheel.coverage)">{{ wheel.coverage.label }}</span>
                                <span v-else class="fg-covered" :class="{ 'fg-covered--partial': wheel.covered < wheel.sizes }">{{ wheel.coverage.label }}</span>
                            </td>
                            <td v-if="has('aktualisiert')" data-label="Geändert" class="fg-date">{{ wheel.updated ?? '–' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <nav v-if="pagination.last > 1" class="fg-pages" aria-label="Seiten der Felgen">
                <Link v-if="pagination.prev" :href="pagination.prev" class="btn btn--secondary" preserve-scroll preserve-state>
                    <Icon name="chevron-left" :size="16" />
                    Vorherige
                </Link>
                <span v-else class="fg-pages__spacer" aria-hidden="true" />
                <p class="fg-pages__where">Seite {{ decimal(pagination.current, 0) }} von {{ decimal(pagination.last, 0) }}</p>
                <Link v-if="pagination.next" :href="pagination.next" class="btn btn--secondary" preserve-scroll preserve-state>
                    Nächste
                    <Icon name="chevron-right" :size="16" />
                </Link>
                <span v-else class="fg-pages__spacer" aria-hidden="true" />
            </nav>
        </template>

        <AdminConfirm
            v-model:open="confirmOpen"
            :title="pending ? BULK[pending].title(felgen(selected.length)) : ''"
            :body="pending ? BULK[pending].body : ''"
            :confirm-label="pending ? BULK[pending].label : ''"
            :busy="busy"
            @confirm="runBulk"
        />
    </AdminPage>
</template>

<style scoped>
.fg-refusal {
    margin: 0;
}

.fg-search {
    display: flex;
    gap: var(--sp-8);
    max-width: var(--adm-form-max);
    margin-bottom: var(--sp-16);
}

.fg-search .input {
    flex: 1 1 auto;
    min-width: 0;
}

.fg-filters {
    display: none;
    margin-bottom: var(--sp-24);
}

.fg-filters__fields {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
    align-items: end;
    gap: var(--sp-16);
}

.fg-filters__actions {
    display: flex;
    gap: var(--sp-8);
}

.fg-filterbar {
    display: flex;
    gap: var(--sp-8);
    margin-bottom: var(--sp-16);
}

.fg-filterbar .btn,
.fg-sheet .btn,
.fg-search .btn {
    min-height: var(--adm-control-h-lg);
}

.fg-sheet {
    display: grid;
    gap: var(--sp-16);
    padding-bottom: var(--sp-8);
}

.fg-empty-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

/* ── The step for the selection: above the table, only while something is chosen ── */

.fg-bulk {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8) var(--sp-16);
    /* The buttons' height, the padding and the 1 px border: idle and filled are the same height. */
    min-height: calc(var(--adm-control-h) + 2 * var(--sp-8) + 2px);
    margin-bottom: var(--sp-12);
    padding: var(--sp-8) var(--sp-12);
    border: 1px solid transparent;
    border-radius: var(--r-control);
    background: var(--c-band);
}

.fg-bulk__count {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}

/* Idle: the same box, holding its height (the actions' control height) with a quiet line. */
.fg-bulk--idle {
    border-style: dashed;
    border-color: var(--c-line);
    background: transparent;
}

.fg-bulk__hint {
    font-weight: 400;
    color: var(--c-ink-3);
}

/* „Freigaben noch nicht hinterlegt“ wraps like a sentence instead of pushing the card sideways. */
.fg-coverage {
    height: auto;
    min-height: 20px;
    padding-block: 2px;
    white-space: normal;
}

.fg-covered {
    font-variant-numeric: tabular-nums;
}

.fg-covered--partial {
    font-weight: 500;
}

.fg-bulk__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

/* ── The table ─────────────────────────────────────────────────────────────── */

.fg-pick {
    width: 44px;
}

.fg-check {
    width: 20px;
    height: 20px;
    margin: 0;
    accent-color: var(--c-ink);
    cursor: pointer;
}

.fg-sort {
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

.fg-sort__icon {
    color: var(--c-line-2);
}

.fg-sort__icon--on {
    color: var(--c-ink);
}

@media (hover: hover) and (pointer: fine) {
    .fg-sort:hover {
        color: var(--c-ink);
    }
}

.fg-wheel {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
    min-width: 0;
}

.fg-thumb {
    flex: none;
    width: 40px;
    height: 40px;
    overflow: hidden;
    border-radius: var(--r-control);
    background: var(--c-band);
}

.fg-thumb :deep(.picture) {
    width: 100%;
    height: 100%;
}

.fg-wheel__text {
    min-width: 0;
}

.fg-name {
    color: var(--c-ink);
    text-decoration: none;
    overflow-wrap: anywhere;
}

.fg-brand {
    font-weight: 600;
}

@media (hover: hover) and (pointer: fine) {
    .fg-name:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.fg-sub {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

/* The internal note under the name, in the warning ink's tint: seen in passing, never in the shop. */
.fg-memo {
    display: block;
    width: fit-content;
    max-width: 40ch;
    margin-top: var(--sp-4);
    padding: 0 var(--sp-4);
    border-radius: var(--r-control);
    background: var(--c-warn-tint);
    color: var(--c-ink);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    overflow-wrap: anywhere;
}

.fg-demo {
    margin-left: var(--sp-4);
}

.fg-date {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.fg-pages {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
    margin-top: var(--sp-24);
}

.fg-pages__where {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
}

.fg-pages__spacer {
    min-width: 1px;
}

@media (min-width: 768px) {
    .fg-filters {
        display: block;
    }

    .fg-filterbar {
        display: none;
    }

    .fg-search .btn {
        min-height: 0;
    }
}

@media (min-width: 768px) and (max-width: 1023px) {
    .fg-filters__fields {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .fg-filters__actions {
        grid-column: 1 / -1;
    }
}

@media (max-width: 767px) {
    .fg-columns,
    .fg-import {
        display: none;
    }

    .fg-pages .btn,
    .fg-bulk .btn {
        min-height: var(--adm-control-h-lg);
    }

    /* The selection is desk work: on a phone the card's title is the Felge itself. */
    .fg-table .fg-pick {
        display: none;
    }

    .fg-table td.fg-key {
        display: block;
        grid-row: 1;
        grid-column: 1;
        align-self: start;
        padding-bottom: var(--sp-8);
    }

    /* The status sits on the name's line, not at the thumbnail's foot. */
    .fg-table td[data-phone='status'] {
        align-self: start;
        line-height: var(--lh-body);
    }

    .fg-bulk {
        display: none;
    }

    .fg-table td.fg-key::before {
        content: none;
    }
}
</style>
