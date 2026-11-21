<script setup lang="ts">
/**
 * The RIMIFY-Check for the tyre sizes chosen in the Komplettrad's tyre step (D-488, the client's review of 19.11.2026): what the
 * Gutachten asks of exactly this combination — its Auflagen, or „Keine Auflagen.“ —, the Eintragung where a code asks for it,
 * and the document to read it in. Its colour is the one the admin gave the codes (D-439): red, yellow or green, loudest first;
 * an Auflage without a colour of its own is the yellow caution. Every word comes from the server's answer (ConditionGroups).
 */
import { computed } from 'vue'
import ConditionGroups from '../../../Components/Fitment/ConditionGroups.vue'
import Icon from '../../../Components/Ui/Icon.vue'
import type { IconName } from '../../../icons'
import { LINE_ROOM, countedDe, fitsWhole } from '../../../fitment/auflagen'
import { entryLine } from '../../../fitment/papers'
import type { ConditionGroupsView } from '../../../types/rimify'

const props = defineProps<{
    answer: ConditionGroupsView
    /** `BMW 330Ci` — whom the answer is for. */
    vehicle: string
    /** `225/40 R18`, or `vorne 225/35 R19 · hinten 255/30 R19`. */
    sizes: string
    papersExempt: boolean
    document: { url: string; page: number | null; example: boolean } | null
}>()

const standing = computed(() => props.answer.standing ?? (props.answer.combination.length > 0 || props.answer.sizes.some((s) => s.conditions.length > 0) ? 'auflagen' : 'keine'))

const tone = computed<{ cls: string; icon: IconName }>(() => {
    if (standing.value !== 'auflagen') {
        return { cls: '', icon: 'check-circle' }
    }

    return props.answer.hint === 'red'
        ? { cls: 'rcheck-panel--danger', icon: 'warning' }
        : props.answer.hint === 'green' ? { cls: '', icon: 'info' } : { cls: 'rcheck-panel--warn', icon: 'warning' }
})

const headline = computed(() => (standing.value === 'auflagen' ? `Mit Auflagen freigegeben für ${props.vehicle}` : `Freigegeben für ${props.vehicle}`))
const entry = computed(() => (props.answer.entry === true ? entryLine(true, props.papersExempt) : null))

/* A real Gutachten's sentences run to paragraphs (D-197): long, they fold, and the tyres stay near. */
const sentences = computed(() => [...props.answer.combination, ...props.answer.sizes.flatMap((size) => size.conditions)])
const folded = computed(() => !fitsWhole(sentences.value, LINE_ROOM))
</script>

<template>
    <section class="rcheck-panel cc" :class="tone.cls" aria-labelledby="cc-h" data-chosen-check>
        <p class="rcheck-panel__head">
            <Icon :name="tone.icon" :size="20" /> RIMIFY-Check
        </p>
        <h3 id="cc-h" class="rcheck-panel__vehicle">{{ headline }}</h3>
        <p class="cc__sizes">mit <span class="data" translate="no">{{ sizes }}</span></p>

        <p v-if="entry" class="cc__entry">{{ entry }}</p>

        <p v-if="standing === 'keine'" class="cc__none">Keine Auflagen.</p>
        <p v-else-if="standing === 'hinweise'" class="cc__notes">Mit Hinweisen aus dem Gutachten – nichts davon musst du tun.</p>

        <template v-if="standing !== 'keine'">
            <details v-if="folded" class="cc__fold">
                <summary class="cc__toggle">{{ countedDe(sentences.length) }} anzeigen</summary>
                <ConditionGroups :groups="answer" :omit="entry ? [entry] : []" />
            </details>
            <ConditionGroups v-else :groups="answer" :omit="entry ? [entry] : []" />
        </template>

        <p v-if="document" class="cc__doc">
            <a class="link" :href="document.url" target="_blank" rel="noopener">
                Gutachten öffnen (<template v-if="document.example">Beispiel, </template>PDF<template v-if="document.page">, Seite {{ document.page }}</template>)
            </a>
        </p>
    </section>
</template>

<style scoped>
.cc {
    display: grid;
    gap: var(--sp-8);
}

.cc .rcheck-panel__vehicle {
    margin: 0;
}

.cc__sizes,
.cc__entry,
.cc__none,
.cc__notes,
.cc__doc {
    margin: 0;
}

.cc__sizes {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.cc__entry,
.cc__none {
    font-weight: 600;
    color: var(--c-ink);
}

.cc__notes {
    color: var(--c-ink-2);
}

.cc__toggle {
    cursor: pointer;
    color: var(--c-blue);
    font-weight: 600;
    min-height: 44px;
    display: flex;
    align-items: center;
}

.cc__toggle:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}
</style>
