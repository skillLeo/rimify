<script setup lang="ts">
/**
 * A row of sibling pages under one rail item — Einstellungen › Zubehörpreise holds the Wuchtgewicht
 * colours and the RDKS sensor prices. Each is its own page with its own address, so this is a small
 * navigation with `aria-current`, not an ARIA tab list: the browser's Back, a bookmark and a pasted
 * link all work, and nothing is hidden inside one page.
 */

import { Link, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import type { SectionTab } from './sectionTabs'

const props = defineProps<{
    label: string
    items: SectionTab[]
}>()

const page = usePage()

/** The address without its query or hash: `?seite=2` is still the same tab. */
const path = computed(() => {
    const url: unknown = page.url

    return typeof url === 'string' ? url.replace(/[?#].*$/, '') : ''
})

const items = computed(() => props.items.map((item) => ({ ...item, current: path.value === item.href })))
</script>

<template>
    <nav class="adm-tabs" :aria-label="label">
        <Link
            v-for="item in items"
            :key="item.href"
            :href="item.href"
            class="adm-tabs__item"
            :aria-current="item.current ? 'page' : undefined"
        >
            {{ item.label }}
        </Link>
    </nav>
</template>
