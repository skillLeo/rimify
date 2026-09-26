<script setup lang="ts">
/**
 * „Neueste Bestellungen“ — seeded orders are said once above the figures, not on every row: eight rows, each one link (the number is the link; the row's hover and
 * focus light up as one). 13 px, 44 px rows, hairlines, no zebra; the amount right-aligned in
 * tabular figures; payment and shipping as chips; the age as a colleague would say it.
 */

import { Link } from '@inertiajs/vue3'
import StateChip from './StateChip.vue'
import type { DashboardOrderRow } from '../../../types/admin/uebersicht'

defineProps<{ orders: DashboardOrderRow[] }>()
</script>

<template>
    <div class="dt-wrap">
        <table class="dt">
            <thead>
                <tr>
                    <th scope="col">Nummer</th>
                    <th scope="col">Kunde</th>
                    <th scope="col" class="dt__num">Betrag</th>
                    <th scope="col">Zahlung</th>
                    <th scope="col">Versand</th>
                    <th scope="col" class="dt__num">Alter</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="order in orders" :key="order.id" class="dt__row">
                    <td>
                        <Link :href="order.href" class="dt__link">{{ order.number }}</Link>
                    </td>
                    <td class="dt__text"><span class="dt__clip" :title="order.customer">{{ order.customer }}</span></td>
                    <td class="dt__num">{{ order.total }}</td>
                    <td><StateChip :label="order.payment.label" :tone="order.payment.tone" /></td>
                    <td><StateChip :label="order.fulfilment.label" :tone="order.fulfilment.tone" /></td>
                    <td class="dt__num dt__age">
                        <time :datetime="order.iso ?? undefined">{{ order.ago ?? '–' }}</time>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.dt-wrap {
    margin-inline: calc(-1 * var(--sp-20));
    overflow-x: auto;
}

.dt {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--adm-fs-table);
    line-height: var(--adm-lh-table);
    font-variant-numeric: tabular-nums;
}

.dt th {
    position: sticky;
    top: 0;
    z-index: var(--z-raised);
    height: 36px;
    padding: 0 var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    background: var(--c-surface);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 500;
    color: var(--c-ink-3);
    text-align: left;
    white-space: nowrap;
}

.dt td {
    height: var(--adm-row-h-dash);
    padding: 0 6px;
    border-bottom: 1px solid var(--c-line);
    color: var(--c-ink);
    white-space: nowrap;
}

.dt th:first-child,
.dt td:first-child {
    padding-left: var(--sp-20);
}

.dt th:last-child,
.dt td:last-child {
    padding-right: var(--sp-20);
}

.dt tbody tr:last-child td {
    border-bottom: 0;
}

.dt__num {
    text-align: right;
}

.dt th.dt__num {
    text-align: right;
}

/* A long name — or the e-mail address an order without one shows — wraps onto a second line inside
   its column; it is never cut, and never pushes the columns beside it out of view. (A table cell
   ignores a max-width; the span inside it does not.) */
.dt__clip {
    display: block;
    max-width: 18ch;
    white-space: normal;
    overflow-wrap: anywhere;
}

.dt__age {
    color: var(--c-ink-3);
}

/* The number is the link; the whole row answers to it. */
.dt__row {
    position: relative;
}

.dt__link {
    font-weight: 600;
    color: var(--c-ink);
    text-decoration: none;
    outline: none;
}

.dt__link::after {
    content: '';
    position: absolute;
    inset: 0;
}

@media (hover: hover) and (pointer: fine) {
    .dt__row:hover td {
        background: var(--c-band);
    }
}

.dt__row:focus-within td {
    background: var(--c-band);
}

.dt__row:has(.dt__link:focus-visible) td:first-child {
    box-shadow: var(--adm-row-focus);
}

/* A phone: each order a card — number and amount, then customer and age, then its two states. */
@media (max-width: 767px) {
    .dt thead {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }

    .dt,
    .dt tbody {
        display: block;
    }

    .dt__row {
        display: grid;
        grid-template-columns: auto auto minmax(0, 1fr) auto;
        gap: var(--sp-4) var(--sp-8);
        padding: var(--sp-12) var(--sp-20);
        border-bottom: 1px solid var(--c-line);
    }

    .dt tbody tr:last-child {
        border-bottom: 0;
    }

    .dt td,
    .dt td:first-child,
    .dt td:last-child {
        display: block;
        height: auto;
        padding: 0;
        border: 0;
    }

    .dt__row td:nth-child(1) {
        grid-area: 1 / 1 / 2 / 4;
    }

    .dt__row td:nth-child(3) {
        grid-area: 1 / 4;
        font-weight: 600;
    }

    .dt__row td:nth-child(2) {
        grid-area: 2 / 1 / 3 / 4;
        max-width: none;
        color: var(--c-ink-2);
    }

    .dt__row td:nth-child(6) {
        grid-area: 2 / 4;
    }

    .dt__row td:nth-child(4) {
        grid-area: 3 / 1;
        padding-top: var(--sp-4);
    }

    .dt__row td:nth-child(5) {
        grid-area: 3 / 2;
        padding-top: var(--sp-4);
    }

    /* Nothing to say about shipping: on a card a lone dash is noise, so the chip line keeps only the payment. */
    .dt__row td:nth-child(5):has(.chip-none) {
        display: none;
    }

    @media (hover: hover) and (pointer: fine) {
        .dt__row:hover {
            background: var(--c-band);
        }
    }

    .dt__row:focus-within,
    .dt__row:focus-within td {
        background: var(--c-band);
    }
}
</style>
