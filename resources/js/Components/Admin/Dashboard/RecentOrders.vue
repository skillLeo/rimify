<script setup lang="ts">
/**
 * „Neueste Bestellungen“ — seeded orders are said once above the figures, not on every row. Eight
 * rows; only the number is a link — the row itself is not clickable. Its actions („Öffnen“, „Alle
 * Bestellungen dieser Person“) appear while the row is pointed at or holds the keyboard's focus,
 * and are always there on a touch screen. 13 px, 44 px rows, hairlines, no zebra; the amount right-
 * aligned in tabular figures; payment and shipping as chips in the status palette; nothing to ship
 * said quietly in words; the age as a colleague would say it.
 */

import { Link } from '@inertiajs/vue3'
import Icon from '../AdminIcon.vue'
import { formatMoney } from '../../../lib/num'
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
                    <th scope="col" class="dt__actions-head"><span class="visually-hidden">Aktionen</span></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="order in orders" :key="order.id" class="dt__row">
                    <td>
                        <Link :href="order.href" class="dt__link">{{ order.number }}</Link>
                    </td>
                    <td class="dt__text"><span class="dt__clip">{{ order.customer }}</span></td>
                    <td class="dt__num">{{ formatMoney(order.total) }}</td>
                    <td><StateChip :label="order.payment.label" :tone="order.payment.tone" /></td>
                    <td><StateChip :label="order.fulfilment.label" :tone="order.fulfilment.tone" /></td>
                    <td class="dt__num dt__age">
                        <time :datetime="order.iso ?? undefined">{{ order.ago ?? '–' }}</time>
                    </td>
                    <td class="dt__actions">
                        <!-- The number is the keyboard's way to the order; this is the pointer's shortcut (M1-19). -->
                        <Link :href="order.href" class="adm-iconbtn dt__action" tabindex="-1" :aria-label="`Bestellung ${order.number} öffnen`">
                            <Icon name="arrow-right" :size="16" />
                        </Link>
                        <Link v-if="order.customerHref" :href="order.customerHref" class="adm-iconbtn dt__action" :aria-label="`Alle Bestellungen von ${order.customer}`">
                            <Icon name="customers" :size="16" />
                        </Link>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.dt-wrap {
    margin-inline: calc(-1 * var(--adm-card-pad));
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
    padding: 0 var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    color: var(--c-ink);
    white-space: nowrap;
}

.dt th:first-child,
.dt td:first-child {
    padding-left: var(--adm-card-pad);
}

.dt th:last-child,
.dt td:last-child {
    padding-right: var(--adm-card-pad);
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

/* Only the number is the link; the row is not a button. */
.dt__link {
    font-weight: 600;
    color: var(--c-ink);
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .dt__row:hover td {
        background: var(--c-band);
    }

    .dt__link:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.dt__row:focus-within td {
    background: var(--c-band);
}

/* The row's actions: there while the row is pointed at or holds the focus — reached by Tab like any
   link, never hidden from the keyboard; always there where nothing can point (touch). */
.dt__actions-head,
.dt__actions {
    width: 1%;
}

.dt__actions {
    text-align: right;
}

.dt__action {
    display: inline-flex;
    vertical-align: middle;
}

@media (hover: hover) and (pointer: fine) {
    .dt__action {
        opacity: 0;
        transition: opacity var(--d-1) var(--ease-out);
    }

    .dt__row:hover .dt__action,
    .dt__row:focus-within .dt__action {
        opacity: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .dt__action {
        transition: none;
    }
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
        padding: var(--sp-12) var(--adm-card-pad);
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

    .dt__row td:nth-child(7) {
        grid-area: 3 / 4;
    }

    /* The number, the row's one link, keeps a finger's 44 px without moving the card's lines. */
    .dt__link {
        display: inline-block;
        padding-block: var(--sp-12);
        margin-block: calc(-1 * var(--sp-12));
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
