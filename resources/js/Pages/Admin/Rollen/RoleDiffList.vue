<script setup lang="ts">
/**
 * What saving would change, before it is saved (BRIEF.md §2): the rights a role gains and the ones
 * it loses, each named the way the grid names it — "Katalog · Löschen" — and nothing else. The
 * count in the summary is the list's own length, never an estimate.
 */

import { computed } from 'vue'
import Icon from '../../../Components/Ui/Icon.vue'
import type { RoleDiff } from '../../../composables/admin/roleDiff'
import { decimal } from '../../../format'

const props = defineProps<{
    diff: RoleDiff
    /** The role being changed, as the page names it. */
    roleLabel: string
}>()

function rights(n: number): string {
    return `${decimal(n, 0)} ${n === 1 ? 'Recht' : 'Rechte'}`
}

const summary = computed(() => {
    const gained = props.diff.gained.length
    const lost = props.diff.lost.length
    const who = `„${props.roleLabel}“`

    if (gained > 0 && lost > 0) {
        return `${who} bekommt ${rights(gained)} dazu und verliert ${rights(lost)}.`
    }

    return gained > 0 ? `${who} bekommt ${rights(gained)} dazu.` : `${who} verliert ${rights(lost)}.`
})

const empty = computed(() => props.diff.gained.length === 0 && props.diff.lost.length === 0)
</script>

<template>
    <div class="rol-diff">
        <p v-if="empty" class="adm-note">Es ändert sich nichts: „{{ roleLabel }}“ hat schon genau diese Rechte.</p>

        <template v-else>
            <p class="rol-diff__sum">{{ summary }}</p>

            <div v-if="diff.gained.length" class="rol-diff__block">
                <h3 class="rol-diff__title">Kommt dazu</h3>
                <ul class="rol-diff__list">
                    <li v-for="change in diff.gained" :key="change.key" class="rol-diff__item">
                        <Icon class="rol-diff__gain" name="plus" :size="16" />
                        {{ change.label }}
                    </li>
                </ul>
            </div>

            <div v-if="diff.lost.length" class="rol-diff__block">
                <h3 class="rol-diff__title">Fällt weg</h3>
                <ul class="rol-diff__list">
                    <li v-for="change in diff.lost" :key="change.key" class="rol-diff__item">
                        <Icon class="rol-diff__loss" name="minus" :size="16" />
                        {{ change.label }}
                    </li>
                </ul>
            </div>
        </template>
    </div>
</template>

<style scoped>
.rol-diff {
    display: grid;
    gap: var(--sp-16);
}

.rol-diff__sum {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink);
}

.rol-diff__title {
    margin: 0 0 var(--sp-4);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
    color: var(--c-ink-2);
}

.rol-diff__list {
    max-height: 40vh;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
}

.rol-diff__item {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    min-height: var(--adm-control-h);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink);
}

.rol-diff__item + .rol-diff__item {
    border-top: 1px solid var(--c-line);
}

.rol-diff__gain {
    color: var(--c-ok);
}

.rol-diff__loss {
    color: var(--c-bad);
}
</style>
