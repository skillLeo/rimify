<script setup lang="ts">
/**
 * Übersicht › Nachfrage: every car asked for in the Zeitraum that the shop has no approved wheel for,
 * the most in demand first — the list of which Gutachten to obtain next.
 *
 * The Zeitraum is the Übersicht's own (same switcher, same memory). Each gap says how often it was
 * asked for, how many people are waiting, and what the team has done: „Gutachten anfordern“ prepares
 * the e-mail to a wheel brand and records that it went; „Als beobachtet markieren“ says it was seen.
 * A role without the Gutachten edit right reads the list and nothing more.
 */

import { router } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import ListPager from '../../../Components/Admin/Lists/ListPager.vue'
import PeriodSwitcher from '../../../Components/Admin/Dashboard/PeriodSwitcher.vue'
import StateChip from '../../../Components/Admin/Dashboard/StateChip.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import { decimal } from '../../../format'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import type { AdminNachfrageProps, DemandState } from '../../../types/admin/nachfrage'
import type { DemandGap } from '../../../types/admin/uebersicht'
import RequestDialog from './RequestDialog.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminNachfrageProps>()

const FILTERS: { key: DemandState; label: string }[] = [
    { key: 'offen', label: 'Offen' },
    { key: 'beobachtet', label: 'Beobachtet' },
    { key: 'angefordert', label: 'Angefordert' },
    { key: 'alle', label: 'Alle' },
]

const EMPTY: Record<DemandState, string> = {
    offen: 'Keine offene Lücke in diesem Zeitraum. Fragt jemand nach einem Auto, für das der Shop keine Felge zeigen kann, steht es hier.',
    beobachtet: 'Keine Lücke ist als beobachtet markiert.',
    angefordert: 'Für keine Lücke wurde bisher ein Gutachten angefordert.',
    alle: 'In diesem Zeitraum hat niemand nach einem Auto gefragt, für das der Shop keine Felge zeigen kann.',
}

const summary = computed(() => {
    const d = props.demand
    const gaps = d.counts.alle === 1 ? '1 Lücke' : `${decimal(d.counts.alle, 0)} Lücken`
    const waiting = d.waiting === 0 ? 'niemand wartet' : d.waiting === 1 ? '1 Person wartet' : `${decimal(d.waiting, 0)} Personen warten`

    return `${gaps} · ${decimal(d.asks, 0)}-mal gefragt · ${waiting}`
})

const busy = ref<string | null>(null)
const requesting = ref<DemandGap | null>(null)
const dialogOpen = ref(false)

/** The row the Übersicht's widget opened, lit until the reader moves on — the first click or key. */
const target = ref<string | null>(null)

function moveOn(): void {
    target.value = null
    window.removeEventListener('pointerdown', moveOn)
    window.removeEventListener('keydown', moveOn)
}

onMounted(() => {
    const id = window.location.hash.slice(1)

    if (id.startsWith('gap-')) {
        target.value = id
        document.getElementById(id)?.scrollIntoView({ block: 'center' })
        window.addEventListener('pointerdown', moveOn, { once: true })
        window.addEventListener('keydown', moveOn, { once: true })
    }
})

onBeforeUnmount(moveOn)

function anchor(key: string): string {
    return `gap-${key.replace(':', '-')}`
}

/** The Zeitraum on screen, sent with every change of the list, so both always count the same days. */
function shownPeriod(): Record<string, string> {
    return props.period.key === 'eigen' ? { zeitraum: 'eigen', von: props.period.von, bis: props.period.bis } : { zeitraum: props.period.key }
}

function show(stand: DemandState): void {
    if (stand !== props.state) {
        router.get('/admin/nachfrage', { ...shownPeriod(), stand, ...searched() }, { preserveScroll: true, preserveState: true })
    }
}

/* A car or key numbers, searched on the server over every gap (the admin audit's F-31); the Stand and the Zeitraum stay. */
const q = ref(props.search ?? '')

function searched(): Record<string, string> {
    return q.value.trim() === '' ? {} : { q: q.value.trim() }
}

function runSearch(): void {
    router.get('/admin/nachfrage', { ...shownPeriod(), ...(props.state === 'offen' ? {} : { stand: props.state }), ...searched() }, { preserveScroll: true, preserveState: true })
}

function resetSearch(): void {
    q.value = ''
    runSearch()
}

/*
 * After a mark the row may leave the list (it is no longer „Offen“), and with it the control the menu
 * or the dialog would hand the focus back to. The focus then goes where the reader's work goes on: the
 * row that took its place, else the row above it, else the Stand filter — never back to the top of
 * the page.
 */
const table = ref<HTMLElement | null>(null)
const filters = ref<HTMLElement | null>(null)

function keepFocus(index: number): void {
    void nextTick(() => {
        const active = document.activeElement

        // Still on a control of the page: nothing to do. On the dialog that is closing (its link keeps
        // the focus while it fades), or nowhere: the list takes it.
        if (active instanceof HTMLElement && active !== document.body && active.isConnected && !active.closest('[role="dialog"]')) {
            return
        }

        const rows = table.value?.querySelectorAll<HTMLElement>('tbody tr') ?? []
        const row = rows[Math.min(index, rows.length - 1)]
        const control = row?.querySelector<HTMLElement>('button, a[href]')

        ;(control ?? filters.value?.querySelector<HTMLElement>('[aria-pressed="true"]'))?.focus()
    })
}

/** One mark at a time: a second press while the first is on its way (a double-click) does nothing. */
function mark(gap: DemandGap, state: 'watched' | 'requested', brandId: number | null = null): void {
    if (busy.value !== null) {
        return
    }

    const index = props.demand.rows.findIndex((row) => row.key === gap.key)

    busy.value = gap.key
    router.post(
        '/admin/nachfrage/markierung',
        { key: gap.key, state, ...(brandId === null ? {} : { brand_id: brandId }) },
        { preserveScroll: true, onSuccess: () => keepFocus(index), onFinish: () => (busy.value = null) }
    )
}

function unmark(gap: DemandGap): void {
    if (busy.value !== null) {
        return
    }

    const index = props.demand.rows.findIndex((row) => row.key === gap.key)

    busy.value = gap.key
    router.delete('/admin/nachfrage/markierung', {
        data: { key: gap.key },
        preserveScroll: true,
        onSuccess: () => keepFocus(index),
        onFinish: () => (busy.value = null),
    })
}

function request(gap: DemandGap): void {
    requesting.value = gap
    dialogOpen.value = true
}

/*
 * A gap's state in a word, on a quiet chip: amber and green belong to the verdicts (Mit Auflagen,
 * Freigegeben), and an open gap is neither — it is work, said by the word „Offen“.
 */
function chip(gap: DemandGap): { label: string; tone: 'neutral' } {
    const label = gap.mark?.state === 'requested' ? 'Angefordert' : gap.mark?.state === 'watched' ? 'Beobachtet' : 'Offen'

    return { label, tone: 'neutral' }
}
</script>

<template>
    <AdminPage title="Nachfrage-Lücken" dashboard :context="summary">
        <template #primary>
            <PeriodSwitcher :period="period" :export-url="null" base="/admin/nachfrage" :comparable="false" :keep="{ stand: state, ...((search ?? '') === '' ? {} : { q: search ?? '' }) }" />
        </template>

        <div class="nf">
            <p class="nf__period">
                <span class="nf__period-name">{{ period.label }}</span>
                <span>{{ period.range }}</span>
            </p>

            <div class="adm-filters">
                <div ref="filters" class="adm-filter" role="group" aria-label="Stand">
                    <span class="adm-filter__label" aria-hidden="true">Stand</span>
                    <button v-for="f in FILTERS" :key="f.key" class="adm-chip" type="button" :aria-pressed="state === f.key" @click="show(f.key)">
                        {{ f.label }}
                        <span class="adm-chip__n">{{ decimal(demand.counts[f.key], 0) }}</span>
                    </button>
                </div>
            </div>

            <form class="nf__search" role="search" @submit.prevent="runSearch">
                <div class="form-field">
                    <label class="form-field__label" for="nf-q">Suchen</label>
                    <input id="nf-q" v-model="q" class="input" type="search" maxlength="100" autocomplete="off" placeholder="Fahrzeug oder HSN/TSN">
                </div>
                <button class="btn btn--secondary" type="submit">Suchen</button>
            </form>
            <p v-if="(search ?? '') !== '' && pagination.total > 0" class="adm-note nf__found">
                {{ pagination.total === 1 ? '1 Lücke gefunden.' : `${decimal(pagination.total, 0)} Lücken gefunden.` }}
            </p>

            <p class="nf__how">
                <Icon name="info" :size="16" />
                <span>
                    So entsteht die Reihenfolge: Jede Anfrage zählt, eine von vor {{ weighting.halfLife }} Tagen halb so viel wie eine von heute.
                    Wer auf eine Nachricht wartet, zählt {{ weighting.waiting === 3 ? 'dreifach' : `${weighting.waiting}-fach` }}.
                </span>
            </p>

            <div v-if="demand.rows.length" class="adm-panel nf__panel">
                <table ref="table" class="adm-table nf__table">
                    <thead>
                        <tr>
                            <th scope="col">Fahrzeug</th>
                            <th scope="col" class="num">Gefragt</th>
                            <th scope="col" class="num">Warten</th>
                            <th scope="col">Zuletzt</th>
                            <th scope="col">Stand</th>
                            <th v-if="can.mark" scope="col"><span class="visually-hidden">Aktionen</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(gap, i) in demand.rows"
                            :id="anchor(gap.key)"
                            :key="gap.key"
                            :aria-current="target === anchor(gap.key) ? 'true' : undefined"
                            :aria-busy="busy === gap.key ? 'true' : undefined"
                        >
                            <td data-label="Fahrzeug">
                                <span class="nf__vehicle">
                                    <span class="nf__rank" aria-hidden="true">{{ gap.rank ?? i + 1 }}</span>
                                    <span>
                                        <span class="adm-table__key">{{ gap.title }}</span>
                                        <span class="adm-table__sub">{{ gap.detail }}</span>
                                    </span>
                                </span>
                            </td>
                            <td data-label="Gefragt" class="num">
                                <span class="nf__asked">
                                    {{ decimal(gap.asked, 0) }}×
                                    <span class="nf__bar" aria-hidden="true"><span :style="{ width: `${gap.weight}%` }" /></span>
                                </span>
                            </td>
                            <td data-label="Warten" class="num">{{ gap.waiting ? decimal(gap.waiting, 0) : '–' }}</td>
                            <td data-label="Zuletzt">
                                <time :datetime="gap.lastIso ?? undefined">{{ gap.lastAgo ?? '–' }}</time>
                            </td>
                            <td data-label="Stand" data-phone="status">
                                <StateChip v-bind="chip(gap)" />
                                <span v-if="gap.mark" class="adm-table__sub nf__mark">
                                    {{ gap.mark.label }}<template v-if="gap.mark.by">, {{ gap.mark.by }}</template>
                                </span>
                            </td>
                            <td v-if="can.mark" data-label="Aktionen">
                                <div class="adm-table__actions nf__actions">
                                    <button
                                        v-if="gap.mark?.state !== 'requested'"
                                        class="btn btn--secondary btn--sm"
                                        type="button"
                                        :aria-disabled="busy === gap.key ? 'true' : undefined"
                                        @click="busy === gap.key || request(gap)"
                                    >
                                        Gutachten anfordern
                                    </button>
                                    <DropdownMenuRoot>
                                        <DropdownMenuTrigger class="adm-iconbtn" :aria-label="`Weitere Aktionen für ${gap.title}`" :aria-disabled="busy === gap.key ? 'true' : undefined">
                                            <Icon name="more" :size="20" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuContent class="adm-menu" align="end" :side-offset="4">
                                                <DropdownMenuItem v-if="gap.mark?.state !== 'watched'" class="adm-menu__item" @select="mark(gap, 'watched')">
                                                    <Icon name="eye" :size="20" />
                                                    Als beobachtet markieren
                                                </DropdownMenuItem>
                                                <DropdownMenuItem v-if="gap.mark?.state !== 'requested'" class="adm-menu__item" @select="mark(gap, 'requested')">
                                                    <Icon name="check" :size="20" />
                                                    Als angefordert markieren
                                                </DropdownMenuItem>
                                                <DropdownMenuItem v-if="gap.mark?.state === 'requested'" class="adm-menu__item" @select="request(gap)">
                                                    <Icon name="emails" :size="20" />
                                                    Erneut anfordern
                                                </DropdownMenuItem>
                                                <template v-if="gap.mark">
                                                    <DropdownMenuSeparator class="adm-menu__sep" />
                                                    <DropdownMenuItem class="adm-menu__item" @select="unmark(gap)">
                                                        <Icon name="close" :size="20" />
                                                        Markierung aufheben
                                                    </DropdownMenuItem>
                                                </template>
                                            </DropdownMenuContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuRoot>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <AdminState v-else-if="(search ?? '') !== ''" kind="filtered" :total="demand.counts[state]" @reset="resetSearch" />
            <AdminState v-else kind="empty" :text="EMPTY[state]" />

            <ListPager :pagination="pagination" label="Seiten der Lücken" />

            <section class="nf__searches" aria-labelledby="nf-searches">
                <div class="adm-section__head">
                    <h2 id="nf-searches" class="adm-section__title">Suchen ohne Treffer</h2>
                </div>
                <p class="nf__note">
                    Freitext nennt kein bestimmtes Auto, darum steht er hier und nicht in der Liste oben. Gezählt wird jede Suche ohne Treffer bisher,
                    gezeigt die zuletzt in diesem Zeitraum gesuchten.
                </p>
                <div v-if="searches.length" class="adm-panel">
                    <table class="adm-table nf__table">
                        <thead>
                            <tr>
                                <th scope="col">Suchbegriff</th>
                                <th scope="col" class="num">Suchen bisher</th>
                                <th scope="col">Zuletzt</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="miss in searches" :key="miss.query">
                                <td data-label="Suchbegriff"><span class="adm-table__key">„{{ miss.query }}“</span></td>
                                <td data-label="Suchen bisher" class="num">{{ decimal(miss.misses, 0) }}</td>
                                <td data-label="Zuletzt" data-phone="status" class="nf__ago">{{ miss.lastAgo ?? '–' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <AdminState v-else kind="empty" text="In diesem Zeitraum blieb keine Suche ohne Treffer." />
            </section>
        </div>

        <RequestDialog v-if="can.mark" v-model:open="dialogOpen" :gap="requesting" :brands="brands" @requested="(gap, brandId) => mark(gap, 'requested', brandId)" />
    </AdminPage>
</template>

<style scoped>
.nf {
    display: grid;
    gap: var(--sp-16);
    max-width: var(--adm-dash-max);
}

.nf__period {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-4) var(--sp-12);
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
}

.nf__period-name {
    font-weight: 600;
    color: var(--c-ink);
}

.nf__summary {
    color: var(--c-ink-3);
}

.nf__how {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-8);
    max-width: 72ch;
    margin: 0;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-2);
}

.nf__how :deep(svg) {
    margin-top: 1px;
    color: var(--c-ink-3);
}

.nf__panel {
    overflow-x: auto;
}

.nf__table {
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
}

/* A gap is two lines — the car, then its key numbers and years — so the shell's two-line row; the
   searches below are one line and keep the table's own. */
.nf__panel .nf__table td {
    height: var(--adm-row-h-lg);
}

.nf__vehicle {
    display: flex;
    align-items: baseline;
    gap: var(--sp-12);
}

.nf__rank {
    min-width: 2ch;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 600;
    color: var(--c-ink-3);
    font-variant-numeric: tabular-nums;
    text-align: right;
}

/* The count, and beneath it how it compares with the largest gap in the list. */
.nf__asked {
    display: inline-grid;
    justify-items: end;
    gap: 2px;
    min-width: 72px;
    font-weight: 600;
}

.nf__bar {
    display: block;
    width: 72px;
    height: 4px;
    border-radius: var(--r-round);
    background: var(--c-line);
    overflow: hidden;
}

.nf__bar > span {
    display: block;
    height: 100%;
    border-radius: var(--r-round);
    background: var(--chart-accent);
}

.nf__mark {
    margin-top: 2px;
}

.nf__actions {
    flex-wrap: nowrap;
    align-items: center;
}

.nf__searches {
    margin-top: var(--sp-16);
}

.nf__search {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--sp-12);
}

.nf__search .form-field {
    flex: 1 1 280px;
    max-width: 480px;
}

.nf__found {
    margin: 0;
}

.nf__note {
    max-width: 72ch;
    margin: 0 0 var(--sp-12);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

@media (max-width: 767px) {
    .nf__ago {
        font-size: var(--fs-micro);
        color: var(--c-ink-3);
    }

    .nf__asked {
        justify-items: start;
    }

    .nf__actions {
        flex-wrap: wrap;
    }
}
</style>
