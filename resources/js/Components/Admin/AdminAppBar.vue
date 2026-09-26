<script setup lang="ts">
/**
 * The phone's top bar (admin-shell.md §11.1): below 768 px it replaces the topbar.
 *
 * The page's own `<h1>` is the heading, directly beneath. So the bar starts with the wordmark and
 * takes the page's title only once that heading has scrolled away under it — the title is always
 * in view, and never twice. At the right: the environment badge when this is not the live shop, and
 * the bell — on a phone as on a desk, alerts are the one thing that should not wait for the Mehr sheet.
 *
 * No breadcrumbs and no back arrow yet: every admin page today is reached from the bottom bar or
 * the Mehr sheet. The arrow arrives with the first page that is opened from a record list.
 */

import { Link, usePage } from '@inertiajs/vue3'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AdminBell from './AdminBell.vue'
import EnvironmentBadge from './EnvironmentBadge.vue'
import { useAdmin } from '../../composables/admin/useAdmin'

const admin = useAdmin()
const page = usePage()

const title = computed(() => admin.value.breadcrumbs.at(-1)?.label ?? null)

/* The page title has scrolled out from under the bar. Client-only; the first frame shows the mark. */
const titled = ref(false)
let observer: IntersectionObserver | null = null

function observe(): void {
    observer?.disconnect()
    titled.value = false

    const heading = document.querySelector('.adm-page__title')

    if (!heading || typeof IntersectionObserver === 'undefined') {
        return
    }

    // 56 px is the bar (`--header-h-m`): the heading counts as gone once it is under the bar.
    observer = new IntersectionObserver(
        ([entry]) => {
            titled.value = entry !== undefined && !entry.isIntersecting && entry.boundingClientRect.bottom <= 56
        },
        { rootMargin: '-56px 0px 0px 0px' }
    )
    observer.observe(heading)
}

onMounted(() => {
    observe()
    watch(
        // A new page, not a new query: a Zeitraum or filter change keeps the page and its heading, so
        // the bar keeps its title instead of flipping to the wordmark and back.
        () => page.url.split('?')[0],
        () => void nextTick(observe)
    )
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
    <header class="adm-appbar" :data-titled="titled ? '' : undefined">
        <Link href="/admin" class="adm-wordmark adm-appbar__brand" aria-label="RIMIFY – zur Übersicht">RIMIFY</Link>
        <!-- Presentation only: the page's h1 is the heading a screen reader lands on. -->
        <p v-if="title" class="adm-appbar__title" aria-hidden="true">{{ title }}</p>
        <div class="adm-appbar__end">
            <EnvironmentBadge />
            <AdminBell />
        </div>
    </header>
</template>
