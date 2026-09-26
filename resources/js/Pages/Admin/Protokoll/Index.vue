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
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { computed, reactive, ref, watch } from 'vue'
import Icon from '../../../Components/Ui/Icon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'
import type { AdminProtokollProps, ProtokollEntry, ProtokollFilters } from '../../../types/admin/protokoll'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminProtokollProps>()

const BASE = '/admin/protokoll'

const EMPTY_TEXT =
    'Jede Änderung im Admin-Bereich erscheint hier, sobald jemand aus dem Team sie speichert – mit Zeitpunkt, Person und dem Wert davor und danach.'

type FilterForm = { [K in keyof ProtokollFilters]: string }

function fromProps(filters: ProtokollFilters): FilterForm {
    return { person: filters.person ?? '', bereich: filters.bereich ?? '', von: filters.von ?? '', bis: filters.bis ?? '' }
}

const page = usePage()
const form = reactive<FilterForm>(fromProps(props.filters))
const busy = ref(false)
/** The entries whose details are open, by id. */
const open = ref<number[]>([])

// After every visit the server's filters are the truth: the form shows what is actually applied.
watch(
    () => props.filters,
    (filters) => {
        Object.assign(form, fromProps(filters))
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
    const query: Record<string, string> = {}

    for (const [key, value] of Object.entries(form)) {
        if (value !== '') {
            query[key] = value
        }
    }

    visit(query)
}

function reset(): void {
    Object.assign(form, { person: '', bereich: '', von: '', bis: '' })
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
            <!-- A plain link, not an Inertia visit: the answer is a file, and the page stays. -->
            <a class="btn btn--secondary" :href="exportUrl" download>
                <Icon name="import" :size="20" />
                Als CSV exportieren
            </a>
        </template>

        <div v-if="refusals.length" class="adm-alert" role="alert">
            <p v-for="message in refusals" :key="message" class="pk__refusal">{{ message }}</p>
        </div>

        <form
            v-if="showFilters"
            class="adm-panel adm-panel--pad pk-filters"
            :action="BASE"
            method="get"
            aria-label="Protokoll filtern"
            @submit.prevent="apply"
        >
            <div class="pk-filters__fields">
                <div class="form-field">
                    <label class="form-field__label" for="pk-person">Person</label>
                    <select id="pk-person" v-model="form.person" class="input" name="person">
                        <option value="">Alle Personen</option>
                        <option v-for="person in options.people" :key="person.value" :value="person.value">{{ person.label }}</option>
                    </select>
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="pk-bereich">Bereich</label>
                    <select id="pk-bereich" v-model="form.bereich" class="input" name="bereich">
                        <option value="">Alle Bereiche</option>
                        <option v-for="area in options.areas" :key="area.value" :value="area.value">{{ area.label }}</option>
                    </select>
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="pk-von">Von</label>
                    <input id="pk-von" v-model="form.von" class="input" type="date" name="von" :max="form.bis || undefined">
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="pk-bis">Bis</label>
                    <input id="pk-bis" v-model="form.bis" class="input" type="date" name="bis" :min="form.von || undefined">
                </div>
            </div>

            <div class="adm-fields__actions pk-filters__actions">
                <button class="btn btn--primary" type="submit" :disabled="busy" :aria-busy="busy ? 'true' : undefined">Anwenden</button>
                <button v-if="filtered" class="btn btn--secondary" type="button" :disabled="busy" @click="reset">Filter zurücksetzen</button>
            </div>
        </form>

        <template v-if="entries.length === 0">
            <AdminState v-if="filtered" kind="filtered" :total="totalAll" @reset="reset" />
            <AdminState v-else kind="empty" :text="EMPTY_TEXT" />
        </template>

        <div v-else class="pk-days" :aria-busy="busy ? 'true' : undefined">
            <section v-for="group in days" :key="group.key" class="adm-section pk-day" :aria-labelledby="`pk-day-${group.key}`">
                <h2 :id="`pk-day-${group.key}`" class="adm-section__title pk-day__title">{{ group.label }}</h2>

                <ol class="adm-panel pk-list">
                    <li v-for="entry in group.entries" :key="entry.id" class="pk-entry">
                        <div class="pk-entry__row">
                            <time class="pk-entry__time" :datetime="entry.iso ?? undefined" :title="entry.at ?? undefined">{{ entry.time ?? '–' }}</time>

                            <div class="pk-entry__text">
                                <p class="pk-entry__who">
                                    <span class="pk-entry__person">{{ entry.person }}</span>
                                    <span class="pk-entry__area"><span aria-hidden="true"> · </span><span class="visually-hidden">, Bereich </span>{{ entry.area }}</span>
                                </p>
                                <p class="pk-entry__sentence">{{ entry.sentence }}</p>
                            </div>

                            <button
                                v-if="hasDetails(entry)"
                                class="btn btn--ghost btn--sm pk-entry__toggle"
                                type="button"
                                :aria-expanded="isOpen(entry.id) ? 'true' : 'false'"
                                :aria-controls="`pk-details-${entry.id}`"
                                @click="toggle(entry.id)"
                            >
                                Details<span class="visually-hidden">: {{ entry.time }}, {{ entry.person }}</span>
                                <Icon class="pk-entry__chevron" name="chevron-down" :size="16" />
                            </button>
                        </div>

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

.pk-filters {
    margin-bottom: var(--sp-24);
}

.pk-filters__fields {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-16);
}

.pk-filters__actions {
    margin-top: var(--sp-16);
}

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
        'time toggle'
        'text text';
    gap: var(--sp-4) var(--sp-12);
    align-items: start;
    min-height: var(--adm-row-h-lg);
    padding: var(--sp-12) var(--sp-16);
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
    grid-area: text;
    min-width: 0;
}

.pk-entry__who {
    margin: 0;
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
    margin: var(--sp-4) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink);
    overflow-wrap: anywhere;
}

.pk-entry__toggle {
    grid-area: toggle;
    justify-self: end;
}

.pk-entry__chevron {
    transition: transform var(--d-1) var(--ease-out);
}

.pk-entry__toggle[aria-expanded='true'] .pk-entry__chevron {
    transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
    .pk-entry__chevron {
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
    .pk-entry__row {
        grid-template-columns: 88px minmax(0, 1fr) auto;
        grid-template-areas: 'time text toggle';
        gap: var(--sp-16);
    }

    .pk-entry__time {
        padding-top: 1px;
    }
}

@media (min-width: 1024px) {
    .pk-filters__fields {
        grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
    }
}

@media (max-width: 767px) {
    .pk-entry__toggle,
    .pk-pages .btn,
    .pk-filters__actions .btn {
        min-height: var(--adm-control-h-lg);
    }

    .pk-filters__actions .btn {
        flex: 1 1 auto;
    }
}
</style>
