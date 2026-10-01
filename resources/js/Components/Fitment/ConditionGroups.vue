<script setup lang="ts">
/**
 * The Auflagen as the document hangs them (App\Domain\Fitment\Verdict\ConditionGroups) — the one way any page shows a
 * verdict's Auflagen: the combination's once, then each permitted tyre size with its own. ABE 55255 gives the BMW X3 X83
 * fine-link snow chains on the rear axle with 235/45R19 and 245/40R19 and no chains at all with 255/40R19; in one list
 * the customer would read both and believe neither. With a size chosen (a Komplettrad), just what applies to it.
 *
 * Only sentences, never codes (R-15). The papers' line (Abnahme, Eintragung) stays the page's own — per size where the
 * sizes differ (fitment/papers.ts entryBySize).
 */

import type { ConditionGroupsView } from '../../types/rimify'

withDefaults(defineProps<{
    groups: ConditionGroupsView
    /** Sentences the page already says above — the entry line — are not said twice. */
    omit?: string[]
}>(), { omit: () => [] })
</script>

<template>
    <div class="cgroups" data-condition-groups>
        <template v-if="groups.chosen">
            <p class="cgroups__head">Für {{ groups.chosen }}</p>
            <ul v-if="groups.combination.filter((c) => !omit.includes(c)).length" class="cgroups__list">
                <li v-for="condition in groups.combination.filter((c) => !omit.includes(c))" :key="condition">{{ condition }}</li>
            </ul>
        </template>

        <template v-else>
            <template v-if="groups.combination.filter((c) => !omit.includes(c)).length">
                <!-- Labelled only where sizes follow: alone, the list is simply the answer's. -->
                <p v-if="groups.sizes.length" class="cgroups__head">Für jede zulässige Reifengröße</p>
                <ul class="cgroups__list">
                    <li v-for="condition in groups.combination.filter((c) => !omit.includes(c))" :key="condition">{{ condition }}</li>
                </ul>
            </template>

            <section v-for="size in groups.sizes" :key="size.size" class="cgroups__size" :aria-label="`Auflagen nur mit ${size.size}`">
                <p class="cgroups__head">
                    Nur mit <span class="data" translate="no">{{ size.size }}</span>
                    <span class="cgroups__axle">· {{ size.axle }}</span>
                </p>
                <ul v-if="size.conditions.filter((c) => !omit.includes(c)).length" class="cgroups__list">
                    <li v-for="condition in size.conditions.filter((c) => !omit.includes(c))" :key="condition">{{ condition }}</li>
                </ul>
                <p v-else class="cgroups__none">Keine weiteren Auflagen.</p>
            </section>
        </template>
    </div>
</template>

<style scoped>
.cgroups {
    display: grid;
    gap: var(--space-3);
}

.cgroups__head {
    margin: 0;
    font-size: var(--text-small);
    font-weight: 700;
    color: var(--ink);
}

.cgroups__axle {
    font-weight: 400;
    color: var(--ink2);
}

.cgroups__list {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-1) 0 0;
    padding-left: var(--space-4);
    list-style: disc;
}

/* Each size its own block: a rule above it, so where one size's Auflagen end is never a guess. */
.cgroups__size {
    padding-top: var(--space-3);
    border-top: 1px solid var(--line);
}

.cgroups__none {
    margin: var(--space-1) 0 0;
    font-size: var(--text-small);
    color: var(--ink2);
}
</style>
