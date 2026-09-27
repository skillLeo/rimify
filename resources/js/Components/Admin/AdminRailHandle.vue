<script setup lang="ts">
/**
 * The rail's resize handle, on its right edge, as Linear, Slack and VS Code have it.
 *
 * An 8 px grip (the edge's 4 px, widened invisibly) that shows nothing at rest; a 2 px blue line after
 * 120 ms of hovering, the col-resize cursor, and while dragging the line stays, the cursor is
 * col-resize over the whole window and text cannot be selected. The rail follows the pointer with no
 * animation: the rail's left edge is read once, on pointerdown, and the width written through
 * requestAnimationFrame. The magnets at 260 and 320 hold the rail still for 6 ms when they catch it,
 * so the snap is felt rather than seen. Below 200 px it collapses; pulled out past 120 px it opens
 * again (railResize.ts has every rule). A double-click resets it to 260.
 *
 * From the keyboard it is a separator with a value: arrows move it 16 px (Shift: 48), Home is 260,
 * End the widest there is room for, Enter and Space collapse and open it; once it stops, the result
 * is said („Seitenleiste 320 Pixel breit“), never the pixels on the way. It exists from 1024 px only
 * (the stylesheet takes it away below): a tablet's rail and a phone's bottom bar are not resized.
 */

import { computed, onBeforeUnmount, ref } from 'vue'
import { useAdminShell } from '../../composables/admin/useAdmin'
import { RAIL, dragTo, keyTo, railSentence, type RailState } from '../../composables/admin/railResize'

const shell = useAdminShell()
const rail = shell.rail

const handle = ref<HTMLElement | null>(null)
const said = ref('')

const state = computed<RailState>(() => ({ collapsed: rail?.shown.value ?? false, width: rail?.width.value ?? RAIL.default }))

/** The shell's own width — the page without whatever scrollbar it has: the content's 960 px are measured against this. */
function room(): number {
    return document.querySelector<HTMLElement>('.adm')?.clientWidth || document.documentElement.clientWidth
}

/* ── Dragging ─────────────────────────────────────────────────────────────────────── */

let dragging: RailState | null = null
/** The rail when the pointer went down: a press that moves nothing saves and says nothing. */
let started: RailState | null = null
let railLeft = 0
let pointerX = 0
let frame = 0
let holdUntil = 0
let lastSnap: number | null = null

function onPointerDown(event: PointerEvent): void {
    if (!rail || event.button !== 0) {
        return
    }

    event.preventDefault()
    handle.value?.setPointerCapture?.(event.pointerId)
    railLeft = document.querySelector('.adm-rail')?.getBoundingClientRect().left ?? 0
    pointerX = event.clientX
    started = { collapsed: state.value.collapsed, width: state.value.width }
    dragging = { ...state.value, origin: state.value.width }
    lastSnap = null
    rail.resizing.value = true
    document.documentElement.dataset.railResizing = ''
}

function onPointerMove(event: PointerEvent): void {
    if (dragging === null) {
        return
    }

    // The newest position the browser has, not merely this event's: a busy frame folds several moves
    // into one event, the last of them where the pointer really is.
    const coalesced = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : []
    pointerX = (coalesced.at(-1) ?? event).clientX

    if (frame === 0) {
        frame = requestAnimationFrame(step)
    }
}

function step(now: number): void {
    frame = 0

    if (dragging === null || !rail) {
        return
    }

    // Held by a magnet: the pointer's next position is taken once the hold is over.
    if (now < holdUntil) {
        frame = requestAnimationFrame(step)

        return
    }

    const next = advance()

    if (next.snapped !== null && next.snapped !== lastSnap) {
        holdUntil = now + RAIL.snapHoldMs
    }

    lastSnap = next.snapped
    rail.set(dragging, { save: 'soon' })
}

/** The rail for the pointer's latest position, kept as the drag's state. */
function advance(): ReturnType<typeof dragTo> {
    const next = dragTo(pointerX - railLeft, dragging ?? state.value, room())

    dragging = { collapsed: next.collapsed, width: next.width, holding: next.holding, pointer: next.pointer, origin: next.origin }

    return next
}

function onPointerUp(event: PointerEvent): void {
    if (dragging === null || !rail) {
        return
    }

    if (handle.value?.hasPointerCapture?.(event.pointerId)) {
        handle.value.releasePointerCapture(event.pointerId)
    }

    cancelAnimationFrame(frame)
    frame = 0

    // The rail ends under the pointer: the release's own position counts, even when a quick flick
    // never gave the last move a frame of its own.
    if (event.type === 'pointerup') {
        pointerX = event.clientX
        advance()
    }

    const last = { collapsed: dragging.collapsed, width: dragging.width }
    const moved = started === null || last.collapsed !== started.collapsed || last.width !== started.width

    dragging = null
    started = null
    rail.resizing.value = false
    delete document.documentElement.dataset.railResizing

    // A press that moved nothing — a plain click, the two clicks of a double-click — is not a change.
    if (moved) {
        rail.set(last, { save: 'now' })
        say(last)
    }
}

/** Back to the default width — collapse, expand and reset are the three moves that animate. */
function reset(): void {
    if (!rail) {
        return
    }

    const next = { collapsed: false, width: RAIL.default }

    rail.set(next, { animate: true, save: 'now' })
    say(next)
}

/* ── The keyboard ─────────────────────────────────────────────────────────────────── */

let sayTimer: ReturnType<typeof setTimeout> | undefined
/** Where the keys have moved the rail and not yet said nor saved: the keyboard's pointerup is pending. */
let keyed: { state: RailState; save: boolean } | null = null

function onKey(event: KeyboardEvent): void {
    // Alt+← is the browser's Back, Ctrl and ⌘ belong to the browser too: only Shift is the handle's.
    if (!rail || event.altKey || event.ctrlKey || event.metaKey) {
        return
    }

    const next = keyTo(event.key, event.shiftKey, state.value, room())

    if (next === null) {
        return
    }

    event.preventDefault()

    // Enter and Space are the toggle's own move (the one the button and `[` make): collapsed and
    // opened again, the width stays the person's — shown as wide as the window allows.
    if (next.collapsed !== state.value.collapsed) {
        shell.toggleRail()
        keyed = { state: next, save: false }
    } else {
        rail.set(next, { animate: event.key === 'Home', save: 'soon' })
        keyed = { state: next, save: true }
    }

    whenQuiet()
}

/*
 * Once the keys have been quiet for 250 ms — no key down, none coming up — the rail is said, and
 * saved as it is then: the keyboard's pointerup.
 */
function whenQuiet(): void {
    clearTimeout(sayTimer)

    if (keyed === null) {
        return
    }

    sayTimer = setTimeout(() => {
        if (keyed === null || !rail) {
            return
        }

        if (keyed.save) {
            rail.set(keyed.state, { save: 'now' })
        }

        say(keyed.state)
        keyed = null
    }, RAIL.keyQuietMs)
}

function say(next: RailState): void {
    said.value = ''
    // A fresh node's text is announced even when the sentence is the one said last time.
    requestAnimationFrame(() => (said.value = railSentence(next)))
}

onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    clearTimeout(sayTimer)

    if (dragging !== null && rail) {
        rail.resizing.value = false
        delete document.documentElement.dataset.railResizing
    }
})
</script>

<template>
    <div
        v-if="rail"
        ref="handle"
        class="adm-handle"
        role="separator"
        aria-orientation="vertical"
        aria-controls="adm-nav"
        aria-label="Seitenleistenbreite"
        :aria-valuemin="RAIL.min"
        :aria-valuemax="rail.max?.value ?? RAIL.max"
        :aria-valuenow="state.width"
        :aria-valuetext="railSentence(state)"
        tabindex="0"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @lostpointercapture="onPointerUp"
        @dblclick="reset"
        @keydown="onKey"
        @keyup="whenQuiet"
    />
    <span v-if="rail" class="visually-hidden" role="status">{{ said }}</span>
</template>
