<script setup lang="ts">
/**
 * The panel after an add (the client's #16): what was just put in the basket — the line at the amount added and that
 * amount's price, for a mixed set its two axles — the basket's count and subtotal as they now stand, „Weiter
 * einkaufen“ and „Zum Warenkorb“. Every figure is the server's (WarenkorbController → Basket::added, R-10).
 *
 * Not a modal: no overlay, no focus trap, the focus stays where the visitor was. It stands under the header beside the
 * basket, is announced once, and goes on ×, Escape, „Weiter einkaufen“, a visit to another page — or by itself after
 * ten seconds, a clock that stops while the pointer rests on it or the focus is in it. The toast stays quiet for an add
 * that brought this panel, so there is one confirmation, not two.
 *
 * Like the toast it listens for server responses, so the second add in a row shows again and a page restored by the
 * back button does not replay an old one.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import Icon from '../Ui/Icon.vue'
import { addedFrom } from './toast'
import type { AddedToBasket } from '../../types/rimify'

/** Long enough to read the line and the total twice; the clock stops while the panel is being used. */
const ADDED_MS = 10_000

const page = usePage()
const added = ref<AddedToBasket | null>(null)
const id = useId()
let shownPath: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let stopSuccess: (() => void) | undefined
let stopNavigate: (() => void) | undefined

function pathOf(url: string): string {
    return url.split('?')[0]?.split('#')[0] ?? url
}

function pause(): void {
    if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
    }
}

function arm(): void {
    pause()
    timer = setTimeout(close, ADDED_MS)
}

function open(next: AddedToBasket | null, url: string): void {
    if (next === null) {
        return
    }

    added.value = next
    shownPath = pathOf(url)
    arm()
}

function close(): void {
    added.value = null
    shownPath = null
    pause()
}

/** The clock restarts when focus leaves the panel altogether, not when it moves inside it. */
function onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget

    if (next instanceof Node && (event.currentTarget as HTMLElement).contains(next)) {
        return
    }

    arm()
}

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && added.value !== null) {
        close()
    }
}

onMounted(() => {
    // A full page load that arrived with the flash (a non-Inertia redirect); never on back/forward.
    const entry = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined

    if (entry?.type !== 'back_forward') {
        open(addedFrom(page.props), page.url)
    }

    stopSuccess = router.on('success', (event) => open(addedFrom(event.detail.page.props), event.detail.page.url))
    // Another page: the panel belongs to the one the add was made on.
    stopNavigate = router.on('navigate', (event) => {
        if (shownPath !== null && pathOf(event.detail.page.url) !== shownPath) {
            close()
        }
    })
    document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
    stopSuccess?.()
    stopNavigate?.()
    document.removeEventListener('keydown', onKeydown)
    pause()
})
</script>

<template>
    <!-- The live region is always in the document, so the panel inserted into it is announced. -->
    <div class="addp-viewport" role="status" aria-live="polite">
        <Transition name="addp">
            <section
                v-if="added"
                class="addp"
                :aria-labelledby="`${id}-title`"
                @mouseenter="pause"
                @mouseleave="arm"
                @focusin="pause"
                @focusout="onFocusOut"
            >
                <div class="addp__head">
                    <Icon name="check-circle" :size="20" class="addp__mark" />
                    <p :id="`${id}-title`" class="addp__title">{{ added.heading }}</p>
                    <button class="icon-btn addp__close" type="button" aria-label="Schließen" @click="close">
                        <Icon name="close" :size="20" />
                    </button>
                </div>

                <ul class="addp__lines">
                    <li v-for="(line, i) in added.lines" :key="i" class="addp__line">
                        <span class="addp__name"><span class="num">{{ line.quantity }} ×</span> <span translate="no">{{ line.title }}</span></span>
                        <span class="addp__price num" translate="no">{{ line.price }}</span>
                        <span class="addp__detail">{{ line.detail }}</span>
                    </li>
                </ul>

                <p class="addp__sum">
                    <span>Zwischensumme im Warenkorb <span class="num addp__count">({{ added.count }} Stück)</span></span>
                    <span class="num addp__sum-value" translate="no">{{ added.subtotal }}</span>
                </p>

                <div class="addp__go">
                    <button class="btn btn--secondary addp__btn" type="button" @click="close">Weiter einkaufen</button>
                    <Link class="btn btn--primary addp__btn" href="/warenkorb">Zum Warenkorb</Link>
                </div>
            </section>
        </Transition>
    </div>
</template>

<style scoped>
/*
 * Under the header and the vehicle bar, never over the bar's „Ändern“; on a desktop beside the basket, its right edge on
 * the content's; on a phone within the page margins, clear of the price bar below. A popover's elevation (DIRECTION §4).
 */
.addp-viewport {
    position: fixed;
    top: calc(var(--header-h-m) + env(safe-area-inset-top) + var(--vbar-h) + var(--sp-8));
    left: var(--page-margin);
    right: var(--page-margin);
    z-index: var(--z-toast);
    pointer-events: none;
}

@media (min-width: 1024px) {
    .addp-viewport {
        top: calc(var(--header-h) + var(--vbar-h) + var(--sp-12));
        left: auto;
        right: max(var(--page-margin), calc((100% - var(--content-max)) / 2));
        width: 400px;
    }
}

.addp {
    display: grid;
    gap: var(--sp-12);
    padding: var(--sp-16);
    border-radius: var(--r-tile);
    background: var(--c-surface);
    box-shadow: var(--e-2);
    color: var(--c-ink);
    pointer-events: auto;
}

.addp__head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--sp-8);
}

/* Ink, not green: green is the verdict's and the stock's (DIRECTION §2), and this says only that the basket took it. */
.addp__mark {
    color: var(--c-ink);
}

.addp__title {
    margin: 0;
    font-weight: 600;
}

.addp__close {
    margin: calc(-1 * var(--sp-8)) calc(-1 * var(--sp-8)) calc(-1 * var(--sp-8)) 0;
}

.addp__lines {
    display: grid;
    gap: var(--sp-12);
    margin: 0;
    padding: 0;
    list-style: none;
}

.addp__line {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4) var(--sp-12);
}

.addp__name {
    font-weight: 600;
    overflow-wrap: anywhere;
}

.addp__price {
    font-weight: 600;
    white-space: nowrap;
}

.addp__detail {
    grid-column: 1 / -1;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.addp__sum {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-12);
    margin: 0;
    padding-top: var(--sp-12);
    border-top: 1px solid var(--c-line);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.addp__count {
    white-space: nowrap;
}

.addp__sum-value {
    color: var(--c-ink);
    font-weight: 600;
    white-space: nowrap;
}

.addp__go {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-8);
}

.addp__btn {
    justify-content: center;
    min-height: 44px;
}

/* Arriving from above, leaving faster than it came (DIRECTION §8). */
.addp-enter-active {
    animation: addp-in var(--d-2) var(--ease-out) both;
}

.addp-leave-active {
    animation: addp-in var(--d-1) var(--ease-in) reverse both;
}

@keyframes addp-in {
    from {
        opacity: 0;
        transform: translateY(calc(-1 * var(--sp-8)));
    }
}

@media (prefers-reduced-motion: reduce) {
    .addp-enter-active,
    .addp-leave-active {
        animation: none;
    }
}
</style>
