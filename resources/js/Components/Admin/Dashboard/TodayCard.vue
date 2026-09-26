<script setup lang="ts">
/**
 * „Heute“: at most three sentences telling this role what to do now, each with the button that
 * starts it. The Übersicht shows it where it serves the width: beside the Umsatz curve from 1440 px,
 * above the two tables when they stack (768–1439), and straight under the figures on a phone.
 */

import { Link } from '@inertiajs/vue3'
import DashWidget from './DashWidget.vue'
import type { TodaySentence } from '../../../types/admin/uebersicht'

defineProps<{ items: TodaySentence[] }>()
</script>

<template>
    <DashWidget title="Heute" :empty="items.length ? null : 'Heute ist nichts offen. Neues erscheint hier, sobald es dich betrifft.'">
        <ul class="today">
            <li v-for="item in items" :key="item.key" class="today__row">
                <p class="today__sentence">{{ item.sentence }}</p>
                <Link :href="item.href" class="btn btn--secondary btn--sm">{{ item.action }}</Link>
            </li>
        </ul>
    </DashWidget>
</template>

<style scoped>
.today {
    display: grid;
    gap: var(--sp-12);
    margin: 0;
    padding: 0;
    list-style: none;
}

.today__row {
    display: grid;
    justify-items: start;
    gap: var(--sp-8);
    padding-bottom: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
}

.today__row:last-child {
    padding-bottom: 0;
    border-bottom: 0;
}

.today__sentence {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink);
}
</style>
