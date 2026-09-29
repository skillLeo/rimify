<script setup lang="ts">
/**
 * The Übersicht's one Zeitraum, applied to every widget and remembered on the account: 7, 30 or 90
 * days, or an own range typed the German way (TT.MM.JJJJ) — plus „Mit dem Vorzeitraum vergleichen“, and
 * the page's menu (CSV, print).
 *
 * The presets are a toggle group: one pressed at a time, arrows move between them (reka). An own
 * range opens a small popover with two fields and "Anwenden"; its errors are the admin's shared date
 * rules, said under the fields before anything is sent.
 */

import { router } from '@inertiajs/vue3'
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuTrigger,
    PopoverContent,
    PopoverPortal,
    PopoverRoot,
    PopoverTrigger,
    SwitchRoot,
    SwitchThumb,
    ToggleGroupItem,
    ToggleGroupRoot,
} from 'reka-ui'
import { computed, ref } from 'vue'
import Icon from '../AdminIcon.vue'
import { formatGermanDay, parseGermanDay } from '../../../composables/admin/days'
import type { DashboardPeriod } from '../../../types/admin/uebersicht'

const props = withDefaults(
    defineProps<{
        period: DashboardPeriod
        exportUrl: string | null
        /** The page it steers: the Übersicht, or a page beneath it sharing its Zeitraum. */
        base?: string
        /** Whether „Mit dem Vorzeitraum vergleichen“ means anything on this page. */
        comparable?: boolean
        /** Query that rides along with every change (the page's own filter). */
        keep?: Record<string, string>
    }>(),
    { base: '/admin', comparable: true, keep: () => ({}) }
)

/** Period::MAX_DAYS: a year and a day, so a year compares with the year before. */
const MAX_DAYS = 366

const PRESETS = [
    { key: '7', label: '7 Tage' },
    { key: '30', label: '30 Tage' },
    { key: '90', label: '90 Tage' },
] as const

const busy = ref(false)
const customOpen = ref(false)
const von = ref(formatGermanDay(props.period.von))
const bis = ref(formatGermanDay(props.period.bis))
const error = ref('')

const preset = computed({
    get: () => (props.period.key === 'eigen' ? '' : props.period.key),
    set: (key: string) => {
        if (key && key !== props.period.key) {
            go({ zeitraum: key })
        }
    },
})

/**
 * The Zeitraum as it stands on screen. Every change sends all of it, so what the reader sees is what
 * the next page counts — even after the browser's Back has shown an older page than the one the
 * account last remembered.
 */
function shown(): Record<string, string> {
    const days: Record<string, string> = props.period.key === 'eigen' ? { zeitraum: 'eigen', von: props.period.von, bis: props.period.bis } : { zeitraum: props.period.key }

    return props.comparable ? { ...days, vergleich: props.period.compare ? '1' : '0' } : days
}

/* A second press while the first is on its way is ignored — the controls stay enabled, so the focus
   never falls off a control that disabled itself under it. */
function go(change: Record<string, string>): void {
    if (busy.value) {
        return
    }

    busy.value = true
    const query = { ...props.keep, ...shown(), ...change }

    if (query.zeitraum !== 'eigen') {
        delete query.von
        delete query.bis
    }

    router.get(props.base, query, { preserveScroll: true, preserveState: true, onFinish: () => (busy.value = false) })
}

function openCustom(open: boolean): void {
    customOpen.value = open

    if (open) {
        von.value = formatGermanDay(props.period.von)
        bis.value = formatGermanDay(props.period.bis)
        error.value = ''
    }
}

function applyCustom(): void {
    const from = parseGermanDay(von.value)
    const to = parseGermanDay(bis.value)

    if (from === null || to === null) {
        error.value = 'Bitte schreib das Datum als TT.MM.JJJJ, zum Beispiel 01.09.2026.'

        return
    }

    if (to < from) {
        error.value = 'Das Enddatum liegt vor dem Anfangsdatum.'

        return
    }

    // The server's own limits, said here before anything is sent — never a range that quietly does
    // nothing (outside 2000–2099) or is quietly shortened (over a year).
    if (from < '2000-01-01' || to > '2099-12-31') {
        error.value = 'Bitte wähl ein Datum zwischen dem 01.01.2000 und dem 31.12.2099.'

        return
    }

    if ((Date.parse(to) - Date.parse(from)) / 86_400_000 + 1 > MAX_DAYS) {
        error.value = 'Der Zeitraum ist zu lang. Bitte kürz ihn auf höchstens 366 Tage.'

        return
    }

    customOpen.value = false
    go({ zeitraum: 'eigen', von: from, bis: to })
}

function setCompare(on: boolean): void {
    go({ vergleich: on ? '1' : '0' })
}

function print(): void {
    window.print()
}
</script>

<template>
    <div class="period">
        <ToggleGroupRoot v-model="preset" type="single" class="period__group" aria-label="Zeitraum" :aria-busy="busy ? 'true' : undefined">
            <ToggleGroupItem v-for="item in PRESETS" :key="item.key" :value="item.key" class="period__seg">{{ item.label }}</ToggleGroupItem>
        </ToggleGroupRoot>

        <PopoverRoot :open="customOpen" @update:open="openCustom">
            <PopoverTrigger class="period__seg period__custom" :class="{ 'period__seg--on': period.key === 'eigen' }" :aria-pressed="period.key === 'eigen'">
                <Icon name="calendar" :size="16" />
                <span class="period__custom-label">{{ period.key === 'eigen' ? period.range : 'Eigener Zeitraum' }}</span>
                <!-- On a phone the four choices are one control: the own range is its fourth segment. -->
                <span class="period__custom-short" aria-hidden="true">Eigen</span>
            </PopoverTrigger>
            <PopoverPortal>
                <PopoverContent class="adm-menu period__popover" align="end" :side-offset="8">
                    <form class="period__form" @submit.prevent="applyCustom">
                        <div class="form-field">
                            <label class="form-field__label" for="period-von">Von</label>
                            <input id="period-von" v-model="von" class="input" inputmode="numeric" placeholder="TT.MM.JJJJ" autocomplete="off" :aria-invalid="error ? 'true' : undefined" aria-describedby="period-error">
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="period-bis">Bis</label>
                            <input id="period-bis" v-model="bis" class="input" inputmode="numeric" placeholder="TT.MM.JJJJ" autocomplete="off" :aria-invalid="error ? 'true' : undefined" aria-describedby="period-error">
                        </div>
                        <p id="period-error" class="form-field__error period__error">{{ error }}</p>
                        <button class="btn btn--primary" type="submit">Anwenden</button>
                    </form>
                </PopoverContent>
            </PopoverPortal>
        </PopoverRoot>

        <label v-if="comparable" class="period__compare">
            <SwitchRoot class="period__switch" :model-value="period.compare" @update:model-value="setCompare">
                <SwitchThumb class="period__thumb" />
            </SwitchRoot>
            Mit dem Vorzeitraum vergleichen
        </label>

        <DropdownMenuRoot>
            <DropdownMenuTrigger class="adm-iconbtn" aria-label="Weitere Aktionen">
                <Icon name="more" :size="20" />
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent class="adm-menu" align="end" :side-offset="8">
                    <DropdownMenuItem v-if="exportUrl" as-child>
                        <a class="adm-menu__item" :href="exportUrl" download>
                            <Icon name="export" :size="20" />
                            Als CSV exportieren
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem class="adm-menu__item" @select="print">
                        <Icon name="print" :size="20" />
                        Als PDF drucken
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenuRoot>
    </div>
</template>

<style scoped>
.period {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-12);
}

.period__group {
    display: inline-flex;
    padding: 2px;
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-control);
    background: var(--c-surface);
}

.period__seg {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    height: calc(var(--adm-control-h) - 6px);
    padding-inline: var(--sp-12);
    border: 0;
    border-radius: var(--r-control);
    background: transparent;
    color: var(--c-ink-2);
    font: inherit;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    cursor: pointer;
}

.period__seg[data-state='on'],
.period__seg--on {
    background: var(--c-ink);
    color: var(--c-surface);
}

@media (hover: hover) and (pointer: fine) {
    .period__seg:not([data-state='on'], .period__seg--on):hover {
        background: var(--c-band);
        color: var(--c-ink);
    }
}

/* The own range stands beside the group, framed like it. */
.period__custom {
    height: var(--adm-control-h);
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-control);
    background: var(--c-surface);
}

/* Chosen, the own range is pressed like any segment: ink, the words in the surface colour — its
   frame's own white must not win over that, or it reads white on white. */
.period__custom.period__seg--on {
    background: var(--c-ink);
    color: var(--c-surface);
}

.period__compare {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    cursor: pointer;
}

.period__switch {
    position: relative;
    flex: none;
    width: 32px;
    height: 20px;
    padding: 0;
    border: 0;
    border-radius: var(--r-round);
    background-color: var(--c-line-2);
    cursor: pointer;
    transition: background-color var(--d-1) var(--ease-out);
}

/* The colour alone: the shorthand would reset `background-clip`, and on a finger's 44 px box the
   whole target turned into a blue disc (M1-01). */
.period__switch[data-state='checked'] {
    background-color: var(--c-blue);
}

.period__thumb {
    display: block;
    width: 16px;
    height: 16px;
    border-radius: var(--r-round);
    background: var(--c-surface);
    transform: translateX(2px);
    transition: transform var(--d-1) var(--ease-out);
}

.period__thumb[data-state='checked'] {
    transform: translateX(14px);
}

.period__popover {
    width: 280px;
    padding: var(--sp-16);
}

.period__form {
    display: grid;
    gap: var(--sp-12);
}

.period__error:empty {
    display: none;
}

/* A finger's targets: 44 px segments, the own range as tall as the group around them (its 2 px inset
   and hairline on both sides), and the comparison's whole line a target, not just its switch. */
@media (pointer: coarse) {
    .period__seg {
        height: var(--adm-control-h-lg);
    }

    .period__custom {
        height: calc(var(--adm-control-h-lg) + 6px);
    }

    /* Chosen, the own range is pressed like any segment: ink, the words in the surface colour — its
   frame's own white must not win over that, or it reads white on white. */
.period__custom.period__seg--on {
    background: var(--c-ink);
    color: var(--c-surface);
}

.period__compare {
        min-height: var(--adm-control-h-lg);
    }
}

.period__custom-short {
    display: none;
}

/* A phone: 7 · 30 · 90 · Eigen as one segmented control across the width, the comparison and the
   menu on the line beneath. The chosen own range is named in the line under the header anyway. */
@media (max-width: 767px) {
    .period {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--sp-12) 0;
        width: 100%;
    }

    .period__group {
        display: flex;
        grid-area: 1 / 1;
        border-right: 0;
        border-radius: var(--r-control) 0 0 var(--r-control);
    }

    .period__group .period__seg {
        flex: 1;
        justify-content: center;
    }

    .period__custom {
        grid-area: 1 / 2;
        align-self: stretch;
        height: auto;
        border-left: 0;
        border-radius: 0 var(--r-control) var(--r-control) 0;
    }

    .period__custom :deep(svg),
    .period__custom-label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }

    .period__custom-short {
        display: inline;
    }

    /* Chosen, the own range is pressed like any segment: ink, the words in the surface colour — its
   frame's own white must not win over that, or it reads white on white. */
.period__custom.period__seg--on {
    background: var(--c-ink);
    color: var(--c-surface);
}

.period__compare {
        grid-area: 2 / 1;
    }

    .period > :last-child {
        grid-area: 2 / 2;
        justify-self: end;
    }
}

@media (prefers-reduced-motion: reduce) {
    .period__switch,
    .period__thumb {
        transition: none;
    }
}

/* A finger's target: the switch's own box grows to 44 px, its track stays 32 × 20 (the background
   drawn in the content box only). */
@media (pointer: coarse), (max-width: 767px) {
    .period__switch {
        box-sizing: content-box;
        padding: var(--sp-12) var(--sp-8);
        background-clip: content-box;
    }
}
</style>
