<script setup lang="ts">
/**
 * The top app bar: 56 px plus the status-bar inset, sticky, never changing height.
 *
 * On a top-level page it carries the wordmark (the homepage) or nothing on the left, and the
 * search and the vehicle on the right. On an inner page: the back arrow (44 px), a truncated
 * title, and at most two actions. A page may ask for a large title: 28 px under the bar, in the
 * flow, which collapses into the bar as it scrolls under it — scroll-driven where the browser
 * can, an IntersectionObserver everywhere else.
 *
 * The bar gains `--e-1` once the page has scrolled under it, and nothing else.
 *
 * While the shop shows demonstration rows, the *Demodaten* badge sits after the wordmark or the
 * title (ACCURACY D4). The title is the one element that shrinks, so the badge never covers it
 * and never pushes an action off the row.
 */

import { Link } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Ui/Icon.vue'
import DemoBadge from '../Chrome/DemoBadge.vue'
import { useShared } from '../../composables/useShared'
import { useMobileShell } from '../../composables/mobile/useMobileShell'
import { goBack } from '../../composables/mobile/useNavigationDirection'

const props = withDefaults(
    defineProps<{
        /** A top-level page: no back arrow, the search and the vehicle on the right. */
        top?: boolean
        title?: string
        /** Render the title large under the bar and collapse it on scroll. */
        large?: boolean
        /** Where the back arrow leads when this session has no history; null hides the arrow. */
        back?: string | null
    }>(),
    { top: false, title: undefined, large: false, back: '/' }
)

const shared = useShared()
const shell = useMobileShell()
const vehicle = computed(() => shared.value.vehicle)
const showBrand = computed(() => props.top && !props.title)

const sentinel = ref<HTMLElement | null>(null)
const largeTitle = ref<HTMLElement | null>(null)
const scrolled = ref(false)
const collapsed = ref(false)
let scrollObserver: IntersectionObserver | undefined
let titleObserver: IntersectionObserver | undefined

onMounted(() => {
    if (sentinel.value) {
        scrollObserver = new IntersectionObserver(([entry]) => {
            scrolled.value = entry ? !entry.isIntersecting : false
        })
        scrollObserver.observe(sentinel.value)
    }

    if (largeTitle.value) {
        // Collapsed once the large title's lower half has gone under the bar.
        titleObserver = new IntersectionObserver(
            ([entry]) => {
                collapsed.value = entry ? !entry.isIntersecting : false
            },
            { rootMargin: `-${largeTitle.value.offsetTop + 1}px 0px 0px 0px`, threshold: 0.5 }
        )
        titleObserver.observe(largeTitle.value)
    }
})

onBeforeUnmount(() => {
    scrollObserver?.disconnect()
    titleObserver?.disconnect()
})
</script>

<template>
    <div ref="sentinel" class="mbar__sentinel" aria-hidden="true" />

    <header class="mbar" :class="{ 'mbar--scrolled': scrolled, 'mbar--collapsed': collapsed, 'mbar--large': large && title }">
        <div class="mbar__row">
            <template v-if="top">
                <Link v-if="showBrand" href="/" class="mbar__brand" aria-label="RIMIFY – Startseite">RIMIFY</Link>
                <p v-else class="mbar__title" :aria-hidden="large ? 'true' : undefined">{{ title }}</p>
                <DemoBadge />

                <div class="mbar__tools">
                    <button class="icon-btn m-press" type="button" aria-label="Suche" @click="shell.searchOpen.value = true">
                        <Icon name="search" :size="24" />
                    </button>
                    <button
                        v-if="vehicle"
                        class="icon-btn m-press mbar__vicon"
                        type="button"
                        :aria-label="`Dein Fahrzeug: ${vehicle.label}`"
                        @click="shell.vehicleOpen.value = true"
                    >
                        <Icon name="car" :size="24" />
                        <span class="mbar__dot" aria-hidden="true" />
                    </button>
                    <Link v-else href="/felgen-suchen" class="icon-btn m-press" aria-label="Fahrzeug wählen">
                        <Icon name="car" :size="24" />
                    </Link>
                </div>
            </template>

            <template v-else>
                <button v-if="back !== null" class="icon-btn m-press mbar__back" type="button" aria-label="Zurück" @click="goBack(back)">
                    <Icon name="arrow-left" :size="24" />
                </button>
                <p class="mbar__title" :aria-hidden="large ? 'true' : undefined">{{ title }}</p>
                <DemoBadge />
                <div class="mbar__tools">
                    <slot name="actions" />
                </div>
            </template>
        </div>
    </header>

    <!-- The large title is the page's h1; a page that asks for it renders no second one. -->
    <h1 v-if="large && title" ref="largeTitle" class="mbar__large h2">{{ title }}</h1>
</template>

<style scoped>
.mbar__sentinel {
    height: 1px;
    margin-top: -1px;
}

.mbar {
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    height: calc(var(--header-h-m) + env(safe-area-inset-top));
    padding-top: env(safe-area-inset-top);
    background: var(--c-surface);
    view-transition-name: m-appbar;
}

.mbar--scrolled {
    box-shadow: var(--e-1);
}

.mbar__row {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    height: var(--header-h-m);
    padding-inline: var(--sp-12);
}

.mbar__brand {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding-inline: var(--sp-8);
    font-size: var(--fs-h4);
    font-weight: 700;
    font-stretch: var(--wdth-display);
    letter-spacing: 0.04em;
    color: var(--c-ink);
    text-decoration: none;
}

.mbar__back {
    flex: none;
    margin-left: calc(-1 * var(--sp-4));
}

.mbar__title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
    font-weight: 600;
}

/* Two actions at most; a third never renders. */
.mbar__tools {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    margin-left: auto;
}

.mbar__tools > :nth-child(n + 3) {
    display: none;
}

.mbar__vicon {
    position: relative;
}

.mbar__dot {
    position: absolute;
    top: var(--sp-8);
    right: var(--sp-8);
    width: 8px;
    height: 8px;
    border-radius: var(--r-round);
    background: var(--c-blue);
}

/* ── The large title ──────────────────────────────────────────────────────── */

.mbar__large {
    padding: var(--sp-8) var(--page-margin) var(--sp-16);
}

/* Its compact twin is invisible until the large one has scrolled under the bar. */
.mbar--large .mbar__title {
    opacity: 0;
    transition: opacity var(--d-1) var(--ease-std);
}

.mbar--large.mbar--collapsed .mbar__title {
    opacity: 1;
}

@media (prefers-reduced-motion: no-preference) {
    @supports (animation-timeline: scroll()) {
        .mbar--large .mbar__title {
            transition: none;
            animation: mbar-reveal linear both;
            animation-timeline: scroll(root);
            animation-range: var(--sp-24) calc(var(--lh-h2) + var(--sp-24));
        }

        @keyframes mbar-reveal {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }
    }
}
</style>
