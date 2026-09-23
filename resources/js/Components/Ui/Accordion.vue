<script setup lang="ts">
/**
 * A list of questions, one open at a time. Each row is a real button with the answer's id, so a
 * screen reader hears "collapsed" and "expanded" and the chevron only confirms what the button
 * already says.
 */

import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui'
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
</script>

<template>
    <AccordionRoot type="single" collapsible class="accordion">
        <AccordionItem v-for="item in items" :key="item.id" :value="String(item.id)" class="accordion__item">
            <AccordionHeader :as="`h${level}`" class="accordion__header">
                <AccordionTrigger class="accordion__trigger">
                    <span>{{ item.title }}</span>
                    <Icon name="chevron-down" :size="20" />
                </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent class="accordion__content">
                <div class="accordion__body">
                    <slot name="body" :item="item">{{ item.body }}</slot>
                </div>
            </AccordionContent>
        </AccordionItem>
    </AccordionRoot>
</template>

<style scoped>
.accordion__header {
    margin: 0;
}
</style>
