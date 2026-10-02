<script setup lang="ts">
/**
 * „Rückmeldung geben“ on the shop's own pages (D-142): the admin's feedback point — one sentence, sent with the
 * page's address, the window, the browser, the role and a screenshot — for a signed-in admin while the review is on.
 *
 * The server decides it (`reviewer`, HandleInertiaRequests): an ordinary visitor's page carries neither the button
 * nor its code, and the first frame already has it or not (R-08). Bottom right, out of the design's way, above
 * whatever holds a page's bottom edge — the price bar, the compare tray — and never in its own screenshot
 * (`data-feedback-skip`). On a phone it is the bubble alone, with the same name for assistive technology. While the
 * page is drawn for the screenshot the bubble gives way to the system's spinner; the label stays, so nothing moves.
 */

import { onBeforeUnmount, onMounted, ref } from 'vue'
import FeedbackDialog from '../Admin/FeedbackDialog.vue'
import Icon from '../Ui/Icon.vue'
import { feedback, startFeedback } from '../../composables/admin/useFeedback'

/*
 * What holds the bottom edge — a product's price bar, the phone's action bar, the compare tray — is measured, not
 * assumed: the tray on a narrow window wraps onto two lines and is twice the price bar's height (SHOP-FEEDBACK-03).
 * All of them appear only in the browser, after hydration; the button rides 12 px above the highest one.
 */
const BARS = '.stickybar, .msticky, .tray'

const lift = ref(0)
let resize: ResizeObserver | null = null
let mutation: MutationObserver | null = null
let frame = 0

function measure(): void {
    let highest = 0

    for (const bar of document.querySelectorAll<HTMLElement>(BARS)) {
        const box = bar.getBoundingClientRect()

        if (box.height > 0 && box.bottom >= window.innerHeight - 1) {
            highest = Math.max(highest, window.innerHeight - box.top)
        }
    }

    lift.value = Math.ceil(highest)
}

function watchBars(): void {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
        resize?.disconnect()
        document.querySelectorAll<HTMLElement>(BARS).forEach((bar) => resize?.observe(bar))
        measure()
    })
}

onMounted(() => {
    resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    mutation = new MutationObserver(watchBars)
    mutation.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    // A bar slides in (the tray over --d-3): measured as it is added it still stands below the window, and a slide
    // changes no size a ResizeObserver would see — so once more when it has arrived.
    document.addEventListener('transitionend', measure, true)
    document.addEventListener('animationend', measure, true)
    watchBars()
})

onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    resize?.disconnect()
    mutation?.disconnect()
    window.removeEventListener('resize', measure)
    window.removeEventListener('scroll', measure)
    document.removeEventListener('transitionend', measure, true)
    document.removeEventListener('animationend', measure, true)
})
</script>

<template>
    <button
        class="shop-fb"
        :style="lift > 0 ? { '--shop-fb-lift': `${lift}px` } : undefined"
        type="button"
        aria-label="Rückmeldung geben"
        aria-keyshortcuts="R"
        :aria-busy="feedback.capturing ? 'true' : undefined"
        data-feedback-skip
        @click="startFeedback"
    >
        <span v-if="feedback.capturing" class="shop-fb__spin" aria-hidden="true" />
        <Icon v-else name="feedback" :size="20" />
        <span class="shop-fb__label" aria-hidden="true">Rückmeldung geben</span>
    </button>
    <FeedbackDialog surface="shop" />
</template>

<style scoped>
.shop-fb {
    position: fixed;
    right: calc(var(--sp-24) + env(safe-area-inset-right));
    /* The corner, or 12 px above whatever holds the bottom edge (`--shop-fb-lift`, measured above). */
    bottom: max(calc(var(--shop-fb-lift, 0px) + var(--sp-12)), calc(var(--sp-24) + env(safe-area-inset-bottom)));
    z-index: var(--z-header);
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
    min-height: 44px;
    padding-inline: var(--sp-12) var(--sp-16);
    /* A light face lifted by its shadow: it reads on a white section, the blue-grey band and the dark footer alike,
       and never competes with the page's own blue action. */
    background: var(--c-surface);
    border: 0;
    border-radius: var(--r-control);
    box-shadow: var(--e-2);
    color: var(--c-ink);
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 500;
    line-height: var(--lh-small);
    cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
    .shop-fb:hover {
        background: var(--c-band);
    }
}

.shop-fb:active {
    background: var(--c-band);
    transform: translateY(1px);
}

/* Inside its own face: over the dark footer an outer ring would sit on --c-dark and barely show. */
.shop-fb:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: -2px;
}

.shop-fb[aria-busy='true'] {
    cursor: progress;
}

/* The system's spinner (components.css, `.btn[aria-busy]`), in the bubble's place. */
.shop-fb__spin {
    flex: none;
    width: 18px;
    height: 18px;
    margin: 1px;
    border: 2px solid var(--c-blue);
    border-right-color: transparent;
    border-radius: var(--r-round);
    animation: spin var(--d-4) linear infinite;
}

/* A phone: the bubble alone, a thumb's size, in the corner. */
@media (max-width: 767px) {
    .shop-fb {
        right: calc(var(--sp-16) + env(safe-area-inset-right));
        bottom: max(calc(var(--shop-fb-lift, 0px) + var(--sp-12)), calc(var(--sp-16) + env(safe-area-inset-bottom)));
        justify-content: center;
        width: 44px;
        padding: 0;
    }

    .shop-fb__label {
        display: none;
    }
}

@media print {
    .shop-fb {
        display: none;
    }
}
</style>

<style>
/* The cookie card owns that corner until it is answered: the button waits, rather than sit under it, reachable by Tab
   and invisible (SHOP-FEEDBACK-02). */
:root:has(.consent) .shop-fb {
    display: none;
}

/* The footer's last line — on the preview the release stamp the client is asked to send — never ends under it: the
   footer's own bottom (SiteFooter) plus the button's height and its gap. `body` outweighs the footer's scoped rules. */
:root:has(.shop-fb) body .footer {
    padding-bottom: calc(var(--sp-32) + var(--sp-64) + env(safe-area-inset-bottom));
}

:root:has(.shop-fb):has(.stickybar, .msticky) body .footer {
    padding-bottom: calc(var(--sp-32) + var(--stickybar-h) + var(--sp-64) + env(safe-area-inset-bottom));
}

/* Above the price bar its right edge lines up with the bar's own content, not the window's corner. */
@media (min-width: 900px) {
    :root:has(.stickybar) .shop-fb {
        right: max(var(--page-margin), calc((100% - var(--content-max)) / 2));
    }
}
</style>
