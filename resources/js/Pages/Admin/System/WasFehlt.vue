<script setup lang="ts">
/**
 * System › Was fehlt: what the live shop still needs, read from the state it is in (GoLiveChecks; the operator's brief
 * of 05.10.2026, §7) — the same checks `php artisan rimify:go-live-check` prints. Read only. The client's items by
 * default; the choice is a link, so it works before the page is interactive. What is open comes first in each group;
 * the state is a word beside its dot, never the colour alone.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import type { AdminWasFehltProps, GoLiveCheck, GoLiveOwner, GoLiveState } from '../../../types/admin/system'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminWasFehltProps>()

const STATE_WORD: Record<GoLiveState, string> = { ok: 'Erledigt', fehlt: 'Fehlt', 'nicht prüfbar': 'Nicht prüfbar' }
const STATE_DOT: Record<GoLiveState, string> = { ok: 'ok', fehlt: 'bad', 'nicht prüfbar': 'warn' }
const STATE_ORDER: Record<GoLiveState, number> = { fehlt: 0, 'nicht prüfbar': 1, ok: 2 }
const OWNER_WORD: Record<GoLiveOwner, string> = { kunde: 'Kunde', wir: 'RIMIFY', host: 'Host' }
const FILTERS: Array<{ key: GoLiveOwner | 'alle'; label: string }> = [
    { key: 'kunde', label: 'Beim Kunden' },
    { key: 'wir', label: 'Bei uns' },
    { key: 'host', label: 'Beim Host' },
    { key: 'alle', label: 'Alle' },
]

/** How many checks are open per owner — the number beside each choice. */
const openCount = (key: GoLiveOwner | 'alle'): number => props.checks.filter((c) => c.state === 'fehlt' && (key === 'alle' || c.owner === key)).length

const shown = computed<Array<{ group: string; checks: GoLiveCheck[] }>>(() =>
    props.groups
        .map((group) => ({
            group,
            checks: props.checks
                .filter((c) => c.group === group && (props.owner === 'alle' || c.owner === props.owner))
                .sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state]),
        }))
        .filter((g) => g.checks.length > 0),
)

const isAdminPath = (place: string): boolean => place.startsWith('/admin')
</script>

<template>
    <AdminPage title="Was fehlt" :context="`Stand: ${checkedAt}`">
        <p class="wf-summary" role="status">{{ summary }}</p>
        <p class="wf-intro">
            Jede Prüfung liest den Zustand, den der Shop gerade hat. Echte Zahlungen bleiben gesperrt, solange unter „Recht und Pflichtangaben“
            etwas fehlt.
        </p>

        <nav class="wf-filter" aria-label="Wessen Punkte">
            <Link
                v-for="filter in FILTERS"
                :key="filter.key"
                :href="`/admin/system/was-fehlt?wer=${filter.key}`"
                class="wf-filter__item"
                :aria-current="owner === filter.key ? 'page' : undefined"
                preserve-scroll
                replace
            >
                {{ filter.label }}
                <span class="wf-filter__count num">{{ openCount(filter.key) }} offen</span>
            </Link>
        </nav>

        <p v-if="shown.length === 0" class="wf-empty">Hier ist nichts zu prüfen.</p>

        <section v-for="part in shown" :key="part.group" class="wf-group" :aria-labelledby="`wf-${part.group}`">
            <h2 :id="`wf-${part.group}`" class="adm-form__heading">{{ part.group }}</h2>
            <ul class="adm-panel wf-list">
                <li v-for="check in part.checks" :key="check.id" class="wf-check" :data-state="check.state">
                    <span class="adm-health__dot" :class="`adm-health__dot--${STATE_DOT[check.state]}`" aria-hidden="true" />
                    <span class="wf-check__title">{{ check.title }}</span>
                    <span class="wf-check__state" :class="`wf-check__state--${STATE_DOT[check.state]}`">{{ STATE_WORD[check.state] }}</span>
                    <p class="wf-check__sentence">{{ check.sentence }}</p>
                    <p class="wf-check__place">
                        <span v-if="owner === 'alle'" class="wf-check__owner">{{ OWNER_WORD[check.owner] }} · </span>
                        Wo:
                        <Link v-if="isAdminPath(check.place)" :href="check.place">{{ check.place }}</Link>
                        <code v-else>{{ check.place }}</code>
                    </p>
                </li>
            </ul>
        </section>
    </AdminPage>
</template>

<style scoped>
.wf-summary {
    margin: 0 0 var(--sp-8);
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
    font-weight: 600;
    color: var(--c-ink);
}

.wf-intro {
    max-width: var(--adm-form-max);
    margin: 0 0 var(--sp-24);
    color: var(--c-ink-2);
}

.wf-filter {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    margin-bottom: var(--sp-32);
}

.wf-filter__item {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
    min-height: var(--adm-row-h-lg);
    padding-inline: var(--sp-12);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    color: var(--c-ink);
    text-decoration: none;
}

.wf-filter__item[aria-current='page'] {
    border-color: var(--c-ink);
    font-weight: 600;
}

.wf-filter__count {
    color: var(--c-ink-3);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 400;
}

.wf-group + .wf-group {
    margin-top: var(--sp-32);
}

.wf-list {
    max-width: var(--adm-form-max);
    margin: 0;
    padding: 0;
    list-style: none;
}

.wf-check {
    display: grid;
    grid-template-columns: var(--sp-8) minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--sp-4) var(--sp-12);
    padding: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.wf-check__title {
    font-weight: 600;
}

.wf-check__state {
    font-weight: 500;
}

.wf-check__state--ok {
    color: var(--c-ok);
}

.wf-check__state--warn {
    color: var(--c-warn);
}

.wf-check__state--bad {
    color: var(--c-bad);
}

.wf-check__sentence,
.wf-check__place {
    grid-column: 2 / -1;
    margin: 0;
    color: var(--c-ink-2);
}

.wf-check__place {
    color: var(--c-ink-3);
    overflow-wrap: anywhere;
}

.wf-empty {
    color: var(--c-ink-2);
}
</style>
