<script setup lang="ts">
/**
 * A list of questions, one open at a time. Each row is a real button with the answer's id, so a
 * screen reader hears "collapsed" and "expanded" and the chevron only confirms what the button
 * already says.
 *
 * Our own, no longer reka-ui's (29.10.2026): reka measured the opened panel on every tap — the transition switched off,
 * a forced layout of the whole page for a height no animation here uses — and on the phone's home page that tap took
 * 210–320 ms at four times slower CPU (tests/e2e/mobile/startseite.spec.ts, budget 200). A tap now only flips one
 * value; the browser lays out the panel when it paints it. The markup, the classes, `data-state`, the ARIA and the
 * keys between the questions (↑ ↓ Home End, as the WAI-ARIA accordion describes them) stay as they were.
 */

import { ref, useId } from 'vue'
import Icon from './Icon.vue'

export interface AccordionEntry {
    id: string | number
    title: string
    body: string
}

withDefaults(
    defineProps<{
        items: AccordionEntry[]
        /** The heading level the questions render as, so the page's outline stays in order. */
        level?: 2 | 3 | 4
    }>(),
    { level: 3 }
)

const base = useId()
const open = ref<string | null>(null)
const root = ref<HTMLElement | null>(null)

const key = (item: AccordionEntry): string => String(item.id)
const state = (item: AccordionEntry): 'open' | 'closed' => (open.value === key(item) ? 'open' : 'closed')

/* One at a time, and a second tap closes it again. */
function toggle(item: AccordionEntry): void {
    open.value = open.value === key(item) ? null : key(item)
}

/* ↑ ↓ move between the questions, Home and End to the first and the last; Tab leaves the list as it would. */
function move(event: KeyboardEvent): void {
    const triggers = [...(root.value?.querySelectorAll<HTMLButtonElement>('.accordion__trigger') ?? [])]
    const at = triggers.indexOf(document.activeElement as HTMLButtonElement)

    if (at === -1 || triggers.length === 0) {
        return
    }

    const to = { ArrowDown: (at + 1) % triggers.length, ArrowUp: (at - 1 + triggers.length) % triggers.length, Home: 0, End: triggers.length - 1 }[event.key]

    if (to === undefined) {
        return
    }

    event.preventDefault()
    triggers[to]?.focus()
}
</script>

<template>
    <div ref="root" class="accordion" @keydown="move">
        <div v-for="item in items" :key="item.id" class="accordion__item" :data-state="state(item)">
            <component :is="`h${level}`" class="accordion__header" :data-state="state(item)">
                <button
                    :id="`${base}-q-${item.id}`"
                    type="button"
                    class="accordion__trigger"
                    :data-state="state(item)"
                    :aria-expanded="state(item) === 'open' ? 'true' : 'false'"
                    :aria-controls="`${base}-a-${item.id}`"
                    @click="toggle(item)"
                >
                    <span>{{ item.title }}</span>
                    <Icon name="chevron-down" :size="20" />
                </button>
            </component>
            <div
                :id="`${base}-a-${item.id}`"
                role="region"
                :aria-labelledby="`${base}-q-${item.id}`"
                class="accordion__content"
                :data-state="state(item)"
                :hidden="state(item) === 'closed'"
            >
                <div class="accordion__body">
                    <slot name="body" :item="item">{{ item.body }}</slot>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.accordion__header {
    margin: 0;
}
</style>
