<script setup lang="ts">
/**
 * Team › Protokoll: every change made in the panel — who, when, what it was before (BRIEF.md §2).
 *
 * Read-only by nature: the log is append-only, so there is no form here, only filters and a list.
 * The entries arrive in words, grouped by the Berlin day they happened on; each one can open to show
 * its before → after and the IP it came from. The filters live in the URL, so a filtered view is a
 * link and the CSV export takes exactly the set on screen.
 *
 * The filters are applied with a button, not on every change: a native select fires `change` on each
 * arrow key in some browsers, and a list that reloads under the keyboard is a list nobody can use.
 *
 * On a phone the list comes first: the filters, and the export, wait behind one "Filter" button in
 * a sheet (admin-shell §11.4), which says how many are on.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import Icon from '../../../Components/Ui/Icon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import BottomSheet from '../../../Components/Mobile/BottomSheet.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { hasMobileShell } from '../../../composables/mobile/useMobileShell'
import { decimal } from '../../../format'
import type { AdminProtokollProps, ProtokollEntry } from '../../../types/admin/protokoll'
import FilterFields from './FilterFields.vue'
import { activeCount, berlinToday, formFromFilters, queryFromForm, type FilterForm } from './filters'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminProtokollProps>()

const BASE = '/admin/protokoll'

const EMPTY_TEXT =
    'Jede Änderung im Admin-Bereich erscheint hier, sobald jemand aus dem Team sie speichert – mit Zeitpunkt, Person und dem Wert davor und danach.'

const page = usePage()
const form = ref<FilterForm>(formFromFilters(props.filters, berlinToday()))
const dateError = ref('')
const busy = ref(false)
/** The entries whose details are open, by id. */
const open = ref<number[]>([])

/** The phone's filter sheet — only where the admin layout provides the sheet's shell. */
const sheetAvailable = hasMobileShell()
const sheetOpen = ref(false)
const active = computed(() => activeCount(props.filters))

// After every visit the server's filters are the truth: the form shows what is actually applied.
watch(
    () => props.filters,
    (filters) => {
        form.value = formFromFilters(filters, berlinToday())
        dateError.value = ''
    }
)

const context = computed(() => {
    const n = props.pagination.total
    const count = `${decimal(n, 0)} ${n === 1 ? 'Eintrag' : 'Einträge'}`

    return props.filtered ? `${count} · gefiltert` : count
})

/** A filter the server refused, in its own words. */
const refusals = computed<string[]>(() => {
    const raw: unknown = page.props.errors

    if (raw === null || typeof raw !== 'object') {
        return []
    }

    return Object.values(raw as Record<string, unknown>).filter((m): m is string => typeof m === 'string' && m !== '')
})

/** Consecutive entries of one Berlin day under one heading; the server already sent them newest first. */
const days = computed(() => {
    const groups: { key: string; label: string; entries: ProtokollEntry[] }[] = []

    for (const entry of props.entries) {
        const key = entry.day ?? 'ohne-datum'
        const last = groups[groups.length - 1]

        if (last !== undefined && last.key === key) {
            last.entries.push(entry)
        } else {
            groups.push({ key, label: entry.dayLabel, entries: [entry] })
        }
    }

    return groups
})

const showFilters = computed(() => props.totalAll > 0 || props.filtered)

function visit(query: Record<string, string>): void {
    busy.value = true
    open.value = []

    router.get(BASE, query, {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => {
            busy.value = false
        },
    })
}

function apply(): void {
    const result = queryFromForm(form.value, berlinToday())

    if ('error' in result) {
        dateError.value = result.error

        return
    }

    dateError.value = ''
    sheetOpen.value = false
    visit(result.query)
}

function reset(): void {
    form.value = { person: '', bereich: '', zeitraum: '', von: '', bis: '' }
    dateError.value = ''
    sheetOpen.value = false
    visit({})
}

function hasDetails(entry: ProtokollEntry): boolean {
    return entry.changes.length > 0 || entry.ip !== null
}

function isOpen(id: number): boolean {
    return open.value.includes(id)
}

function toggle(id: number): void {
    open.value = isOpen(id) ? open.value.filter((o) => o !== id) : [...open.value, id]
}
</script>

<template>
    <AdminPage title="Protokoll" :context="context">
        <template v-if="can.export && exportUrl" #primary>
            <!-- A plain link, not an Inertia visit: the answer is a file, and the page stays.
                 On a phone it moves into the filter sheet, with the filters it exports. -->
            <a class="btn btn--secondary pk-export" :href="exportUrl" download>
                <Icon name="import" :size="20" />
                Als CSV exportieren
            </a>
        </template>

        <div v-if="refusals.length" class="adm-alert" role="alert">
            <p v-for="message in refusals" :key="message" class="pk__refusal">{{ message }}</p>
        </div>

        <!-- From 768 px: the filters in one row above the list. -->
        <form v-if="showFilters" class="pk-filters" :action="BASE" method="get" aria-label="Protokoll filtern" @submit.prevent="apply">
            <div class="pk-filters__fields" :class="{ 'pk-filters__fields--range': form.zeitraum === 'eigen' }">
                <FilterFields v-model:form="form" :people="options.people" :areas="options.areas" id-prefix="pk" :date-error="dateError" />
                <div class="pk-filters__actions">
                    <button class="btn btn--secondary" type="submit" :disabled="busy" :aria-busy="busy ? 'true' : undefined">Anwenden</button>
                    <button v-if="filtered" class="btn btn--ghost" type="button" :disabled="busy" @click="reset">Zurücksetzen</button>
                </div>
            </div>
        </form>

        <!-- Below 768: the list first, the filters behind one button. -->
        <div v-if="showFilters && sheetAvailable" class="pk-filterbar">
            <button class="btn btn--secondary" type="button" aria-haspopup="dialog" @click="sheetOpen = true">
                <Icon name="filter" :size="20" />
                {{ active > 0 ? `Filter · ${active}` : 'Filter' }}
            </button>
            <button v-if="filtered" class="btn btn--ghost" type="button" :disabled="busy" @click="reset">Zurücksetzen</button>
        </div>

        <BottomSheet v-if="sheetAvailable" id="protokoll-filter" v-model:open="sheetOpen" title="Protokoll filtern">
            <form class="pk-sheet" aria-label="Protokoll filtern" @submit.prevent="apply">
                <FilterFields v-model:form="form" :people="options.people" :areas="options.areas" id-prefix="pk-s" :date-error="dateError" />
                <button class="btn btn--primary btn--block" type="submit" :disabled="busy">Anwenden</button>
                <button v-if="filtered" class="btn btn--secondary btn--block" type="button" :disabled="busy" @click="reset">Zurücksetzen</button>
                <a v-if="can.export && exportUrl" class="btn btn--ghost btn--block" :href="exportUrl" download>
                    <Icon name="import" :size="20" />
                    Als CSV exportieren
                </a>
            </form>
        </BottomSheet>

        <template v-if="entries.length === 0">
            <AdminState v-if="filtered" kind="filtered" :total="totalAll" @reset="reset" />
            <AdminState v-else kind="empty" :text="EMPTY_TEXT" />
        </template>

        <div v-else class="pk-days" :aria-busy="busy ? 'true' : undefined">
            <section v-for="group in days" :key="group.key" class="adm-section pk-day" :aria-labelledby="`pk-day-${group.key}`">
                <h2 :id="`pk-day-${group.key}`" class="adm-section__title pk-day__title">{{ group.label }}</h2>

                <ol class="adm-panel pk-list">
                    <li v-for="entry in group.entries" :key="entry.id" class="pk-entry">
                        <!-- An entry with details is itself the disclosure: the whole row opens it. -->
                        <component
                            :is="hasDetails(entry) ? 'button' : 'div'"
                            class="pk-entry__row"
                            :class="{ 'pk-entry__row--button': hasDetails(entry) }"
                            :type="hasDetails(entry) ? 'button' : undefined"
                            :aria-expanded="hasDetails(entry) ? (isOpen(entry.id) ? 'true' : 'false') : undefined"
                            :aria-controls="hasDetails(entry) ? `pk-details-${entry.id}` : undefined"
                            @click="hasDetails(entry) && toggle(entry.id)"
                        >
                            <time class="pk-entry__time" :datetime="entry.iso ?? undefined" :title="entry.at ?? undefined">{{ entry.time ?? '–' }}</time>

                            <span class="pk-entry__text">
                                <span class="pk-entry__who">
                                    <span class="pk-entry__person">{{ entry.person }}</span>
                                    <span class="pk-entry__area"><span aria-hidden="true"> · </span><span class="visually-hidden">, Bereich </span>{{ entry.area }}</span>
                                </span>
                                <span class="pk-entry__sentence">{{ entry.sentence }}</span>
                            </span>

                            <Icon v-if="hasDetails(entry)" class="pk-entry__chevron" name="chevron-down" :size="16" />
                        </component>

                        <dl v-if="hasDetails(entry)" v-show="isOpen(entry.id)" :id="`pk-details-${entry.id}`" class="adm-facts pk-entry__details">
                            <div v-for="(change, i) in entry.changes" :key="`${entry.id}-${i}`" class="adm-facts__row">
                                <dt>{{ change.label }}</dt>
                                <dd class="pk-change">
                                    <span class="visually-hidden">vorher: </span>
                                    <span class="pk-change__before">{{ change.before }}</span>
                                    <span class="pk-change__arrow" aria-hidden="true">→</span>
                                    <span class="visually-hidden">, nachher: </span>
                                    <span class="pk-change__after">{{ change.after }}</span>
                                </dd>
                            </div>
                            <div v-if="entry.ip" class="adm-facts__row">
                                <dt>IP-Adresse</dt>
                                <dd class="pk-entry__ip">{{ entry.ip }}</dd>
                            </div>
                        </dl>
                    </li>
                </ol>
            </section>

            <nav v-if="pagination.last > 1" class="pk-pages" aria-label="Seiten des Protokolls">
                <Link v-if="pagination.prev" :href="pagination.prev" class="btn btn--secondary">
                    <Icon name="chevron-left" :size="16" />
                    Neuere
                </Link>
                <span v-else class="pk-pages__spacer" aria-hidden="true" />

                <p class="pk-pages__where">Seite {{ decimal(pagination.current, 0) }} von {{ decimal(pagination.last, 0) }}</p>

                <Link v-if="pagination.next" :href="pagination.next" class="btn btn--secondary">
                    Ältere
                    <Icon name="chevron-right" :size="16" />
                </Link>
                <span v-else class="pk-pages__spacer" aria-hidden="true" />
            </nav>
        </div>
    </AdminPage>
</template>

<style scoped>
.pk__refusal {
    margin: 0;
}

/* ── Filters: a row above the list from 768 px; on a phone, a button and a sheet ── */

.pk-filters {
    display: none;
    margin-bottom: var(--sp-24);
}

.pk-filters__fields {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) repeat(2, minmax(0, 1fr)) auto;
    align-items: end;
    gap: var(--sp-16);
}

.pk-filters__fields--range {
    grid-template-columns: minmax(0, 1.4fr) repeat(4, minmax(0, 1fr)) auto;
}

.pk-filters__actions {
    display: flex;
    gap: var(--sp-8);
}

/* The own range's error spans the row under the fields it is about. */
.pk-filters :deep(.pk-date-error) {
    grid-column: 1 / -1;
    order: 99;
}

.pk-filters :deep(.pk-date-error:empty) {
    display: none;
}

.pk-filterbar {
    display: flex;
    gap: var(--sp-8);
    margin-bottom: var(--sp-16);
}

.pk-filterbar .btn,
.pk-sheet .btn {
    min-height: var(--adm-control-h-lg);
}

.pk-sheet {
    display: grid;
    gap: var(--sp-16);
    padding-bottom: var(--sp-8);
}

/* ── The entries ────────────────────────────────────────────────────────────── */

.pk-day + .pk-day {
    margin-top: var(--sp-24);
}

.pk-day__title {
    margin-bottom: var(--sp-8);
}

.pk-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.pk-entry + .pk-entry {
    border-top: 1px solid var(--c-line);
}

.pk-entry__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
        'time chevron'
        'text text';
    gap: var(--sp-4) var(--sp-12);
    align-items: start;
    width: 100%;
    min-height: var(--adm-row-h-lg);
    padding: var(--sp-12) var(--sp-16);
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
}

.pk-entry__row--button {
    cursor: pointer;
    transition: background-color var(--d-1) var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
    .pk-entry__row--button:hover {
        background: var(--c-band);
    }
}

.pk-entry__row--button:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: -2px;
}

.pk-entry__time {
    grid-area: time;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.pk-entry__text {
    display: grid;
    grid-area: text;
    min-width: 0;
}

.pk-entry__who {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.pk-entry__person {
    font-weight: 600;
    color: var(--c-ink);
    overflow-wrap: anywhere;
}

.pk-entry__sentence {
    max-width: 72ch;
    margin-top: var(--sp-4);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink);
    overflow-wrap: anywhere;
}

.pk-entry__chevron {
    grid-area: chevron;
    justify-self: end;
    color: var(--c-ink-3);
    transition: transform var(--d-1) var(--ease-out);
}

.pk-entry__row[aria-expanded='true'] .pk-entry__chevron {
    transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
    .pk-entry__chevron,
    .pk-entry__row--button {
        transition: none;
    }
}

.pk-entry__details {
    margin: 0 var(--sp-16) var(--sp-12);
}

.pk-change {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 var(--sp-8);
    font-variant-numeric: tabular-nums;
}

.pk-change__before {
    color: var(--c-ink-2);
}

.pk-change__arrow {
    color: var(--c-ink-3);
}

.pk-entry__ip {
    font-variant-numeric: tabular-nums;
}

.pk-pages {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
    margin-top: var(--sp-24);
}

.pk-pages__where {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
}

.pk-pages__spacer {
    min-width: 1px;
}

@media (min-width: 768px) {
    .pk-filters {
        display: block;
    }

    .pk-filterbar {
        display: none;
    }

    .pk-entry__row {
        grid-template-columns: var(--sp-80) minmax(0, 1fr) auto;
        grid-template-areas: 'time text chevron';
        gap: var(--sp-16);
    }
}

/* Between 768 and 1023 the row wraps: the fields two by two, the buttons under them. */
@media (min-width: 768px) and (max-width: 1023px) {
    .pk-filters__fields,
    .pk-filters__fields--range {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .pk-filters__actions {
        grid-column: 1 / -1;
    }
}

@media (max-width: 767px) {
    .pk-export {
        display: none;
    }

    .pk-pages .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
