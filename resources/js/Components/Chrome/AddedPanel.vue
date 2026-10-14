<script setup lang="ts">
/**
 * The panel after an add (the client's #16): what was just put in the basket — the line at the amount added and that
 * amount's price, for a mixed set its two axles — the basket's count and subtotal as they now stand, „Weiter
 * einkaufen“ and „Zum Warenkorb“. Every figure is the server's (WarenkorbController → Basket::added, R-10).
 *
 * A dialog the size of a card, never the screen's (the operator's brief „THE 34“, #16, superseding D-129's „no focus
 * trap“): it takes the focus when it opens, so a keyboard user is where the next step is rather than deep in the page
 * below it; Tab and Shift+Tab stay among its three controls; Escape, × and „Weiter einkaufen“ close it and give the focus
 * back to the button the add came from. Nothing blocks: there is no overlay, a click anywhere else closes it, and it
 * never closes by itself while the focus is in it — on a pointer's leave it goes after ten seconds. Its name is its
 * heading and its description the subtotal, read once when the focus arrives. The toast stays quiet for an add that
 * brought this panel, so there is one confirmation, not two.
 *
 * Like the toast it listens for server responses, so the second add in a row shows again and a page restored by the
 * back button does not replay an old one.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue'
import Icon from '../Ui/Icon.vue'
import { addedFrom, firstLoad } from './toast'
import { usePriceTerms } from '../../composables/usePriceTerms'
import type { AddedToBasket } from '../../types/rimify'

/* The prices here carry the line every price on the site carries — or the Kleinunternehmer's. */
const terms = usePriceTerms()

/** Long enough to read the line and the total twice; the clock stops while the panel is being used. */
const ADDED_MS = 10_000

const page = usePage()
const added = ref<AddedToBasket | null>(null)
const panel = useTemplateRef<HTMLElement>('panel')
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

    // A second add while the panel is open keeps the button it first came from.
    if (added.value === null) {
        returnFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
    }

    added.value = next
    shownPath = pathOf(url)
    arm()

    // Into the panel: its name and the subtotal are read, and Tab goes on to its controls.
    void nextTick(() => panel.value?.focus({ preventScroll: true }))
}

/* Where the focus was when the panel opened — the basket button: a close from inside hands it back there, never to <body>. */
let returnFocus: HTMLElement | null = null

function close(): void {
    const inside = panel.value?.contains(document.activeElement) ?? false

    added.value = null
    shownPath = null
    pause()

    if (inside && returnFocus?.isConnected) {
        returnFocus.focus()
    }
}

/* Tab and Shift+Tab go round the panel's controls; the panel itself, focused on open, leads to the first or the last. */
function trap(event: KeyboardEvent): void {
    const card = panel.value

    if (event.key !== 'Tab' || card === null) {
        return
    }

    const controls = [...card.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
    const first = controls[0]
    const last = controls[controls.length - 1]

    if (first === undefined || last === undefined) {
        return
    }

    const active = document.activeElement

    if (event.shiftKey && (active === first || active === card)) {
        event.preventDefault()
        last.focus()
    } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
    }
}

/* A press anywhere else closes it — no overlay to dismiss, and the focus goes where the visitor pressed. */
function onPointerDown(event: PointerEvent): void {
    if (added.value !== null && event.target instanceof Node && !(panel.value?.contains(event.target) ?? false)) {
        returnFocus = null
        close()
    }
}

/** The clock restarts when focus leaves the panel altogether, not when it moves inside it. */
function onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget

    if (next instanceof Node && (event.currentTarget as HTMLElement).contains(next)) {
        return
    }

    arm()
}

/* Escape is the panel's only while no other dialog is open: there it closes that dialog, not this too. */
function onKeydown(event: KeyboardEvent): void {
    const other = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some((d) => d !== panel.value)

    if (event.key === 'Escape' && added.value !== null && !other) {
        close()
    }
}

onMounted(() => {
    // A full page load that arrived with the flash (a non-Inertia redirect) — the document's first mount only, never on
    // back/forward and never when a layout mounts again over props restored from history (PDP-04).
    const entry = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined

    if (firstLoad('added') && entry?.type !== 'back_forward') {
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
    document.addEventListener('pointerdown', onPointerDown, true)
})

onBeforeUnmount(() => {
    stopSuccess?.()
    stopNavigate?.()
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('pointerdown', onPointerDown, true)
    pause()
})
</script>

<template>
    <div class="addp-viewport">
        <Transition name="addp">
            <!-- A card-sized dialog: named by its heading, described by the subtotal, the focus kept among its controls. -->
            <section
                v-if="added"
                ref="panel"
                class="addp"
                role="dialog"
                aria-modal="true"
                tabindex="-1"
                :aria-labelledby="`${id}-title`"
                :aria-describedby="`${id}-sum`"
                @mouseenter="pause"
                @mouseleave="arm"
                @focusin="pause"
                @focusout="onFocusOut"
                @keydown="trap"
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

                <p :id="`${id}-sum`" class="addp__sum">
                    <span>Zwischensumme im Warenkorb <span class="num addp__count">({{ added.count }} Stück)</span></span>
                    <span class="num addp__sum-value" translate="no">{{ added.subtotal }}</span>
                </p>
                <p class="price-legal">Alle Preise {{ terms.note }}.</p>

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
    top: calc(var(--header-h) + env(safe-area-inset-top) + var(--vbar-h) + var(--sp-8));
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

/* One column, never wider than the card: an implicit `auto` column grew to its widest child at 320 px (PDP-01). */
.addp {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-12);
    padding: var(--sp-16);
    border-radius: var(--r-tile);
    background: var(--c-surface);
    box-shadow: var(--e-2);
    color: var(--c-ink);
    pointer-events: auto;
}

/* Focused on open: a ring for the keyboard only, as every control's. */
.addp:focus {
    outline: none;
}

.addp:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
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

/* Side by side where both fit, one under the other where they do not — a 320 px phone (PDP-01). */
.addp__go {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
    gap: var(--sp-8);
}

.addp__btn {
    justify-content: center;
    min-height: 44px;
    white-space: normal;
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
