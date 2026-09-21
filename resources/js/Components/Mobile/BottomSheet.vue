<script setup lang="ts">
/**
 * The bottom sheet: the phone's answer to every modal and every dropdown.
 *
 * Focus trap, scroll lock, Esc, backdrop tap and focus return come from the Reka dialog. On top
 * of it: a 36 × 4 handle; swipe down to close, which begins only when the content is scrolled
 * to the top and closes on velocity or on distance; snap points at 50 % and 92 % of the
 * viewport when a sheet asks for them (`snap="half"`); `overscroll-behavior: contain`; and one
 * history entry, so Android back and browser back close the sheet instead of leaving the page.
 *
 * Only `transform` moves. A half sheet is a full-height sheet resting 42 dvh lower, so the snap
 * between the two points is a transform, never a height.
 */

import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Icon from '../Ui/Icon.vue'
import { useMobileShell } from '../../composables/mobile/useMobileShell'
import { useSheetHistory } from '../../composables/mobile/useSheetHistory'

const props = withDefaults(
    defineProps<{
        /** Unique per sheet on a page; names its history entry. */
        id: string
        title: string
        description?: string
        /** `content`: as tall as its content, up to 92 %. `half`: snaps at 50 % and 92 %. */
        snap?: 'content' | 'half'
        /** The title is for assistive technology only, when the content carries its own. */
        hideTitle?: boolean
    }>(),
    { description: undefined, snap: 'content', hideTitle: false }
)

const open = defineModel<boolean>('open', { default: false })

const shell = useMobileShell()

/* ── History ───────────────────────────────────────────────────────────────── */

let closedByHistory = false

const history = useSheetHistory(props.id, () => {
    closedByHistory = true
    open.value = false
})

const unregister = shell.registerSheet(() => {
    if (open.value) {
        closedByHistory = true
        open.value = false
    }
})

watch(open, (isOpen) => {
    if (isOpen) {
        expanded.value = false
        offset.value = 0
        history.open()

        return
    }

    if (closedByHistory) {
        closedByHistory = false

        return
    }

    void history.close()
})

onBeforeUnmount(() => {
    unregister()

    if (open.value) {
        void history.close()
    }
})

/* ── Drag ──────────────────────────────────────────────────────────────────── */

const CLOSE_VELOCITY_PX_PER_MS = 0.6
const CLOSE_FRACTION = 0.3
const EXPAND_DISTANCE_PX = 60
const START_DISTANCE_PX = 8

const content = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)
const offset = ref(0)
const dragging = ref(false)
const expanded = ref(false)

let startY = 0
let startTime = 0
let lastY = 0
let lastTime = 0
let fromBody = false

const style = computed(() => (offset.value !== 0 ? { transform: `translateY(${offset.value}px)` } : undefined))

function atTop(): boolean {
    return (body.value?.scrollTop ?? 0) <= 0
}

function onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0]

    if (!touch) {
        return
    }

    startY = lastY = touch.clientY
    startTime = lastTime = event.timeStamp
    fromBody = body.value !== null && body.value.contains(event.target as Node)
    dragging.value = false
}

function onTouchMove(event: TouchEvent): void {
    const touch = event.touches[0]

    if (!touch) {
        return
    }

    const dy = touch.clientY - startY

    if (!dragging.value) {
        // Downward from the handle or the header always; from the body only at the top of its scroll.
        const canStart = Math.abs(dy) > START_DISTANCE_PX && (!fromBody || (atTop() && dy > 0) || (props.snap === 'half' && !expanded.value && dy < 0))

        if (!canStart) {
            return
        }

        dragging.value = true
    }

    // The browser must not scroll or refresh while the sheet follows the finger.
    event.preventDefault()

    const rest = restingOffset()
    offset.value = Math.max(-rest, dy)
    lastY = touch.clientY
    lastTime = event.timeStamp
}

function restingOffset(): number {
    if (props.snap !== 'half' || expanded.value || content.value === null) {
        return 0
    }

    return content.value.getBoundingClientRect().height * (42 / 92)
}

function onTouchEnd(): void {
    if (!dragging.value) {
        return
    }

    dragging.value = false
    const height = content.value?.getBoundingClientRect().height ?? 1
    const elapsed = Math.max(1, lastTime - startTime)
    const velocity = (lastY - startY) / elapsed
    const moved = offset.value

    if (velocity > CLOSE_VELOCITY_PX_PER_MS || moved > height * CLOSE_FRACTION) {
        offset.value = 0
        open.value = false

        return
    }

    if (props.snap === 'half' && !expanded.value && (moved < -EXPAND_DISTANCE_PX || velocity < -CLOSE_VELOCITY_PX_PER_MS)) {
        expanded.value = true
    } else if (props.snap === 'half' && expanded.value && moved > EXPAND_DISTANCE_PX) {
        expanded.value = false
    }

    offset.value = 0
}
</script>

<template>
    <DialogRoot v-model:open="open">
        <DialogPortal>
            <DialogOverlay class="overlay" />
            <DialogContent
                ref="content"
                class="msheet"
                :class="{ 'msheet--half': snap === 'half', 'msheet--expanded': expanded, 'msheet--dragging': dragging }"
                :style="style"
                :aria-describedby="description ? undefined : ''"
                @touchstart.passive="onTouchStart"
                @touchmove="onTouchMove"
                @touchend="onTouchEnd"
                @touchcancel="onTouchEnd"
            >
                <div class="msheet__handle" aria-hidden="true"><span /></div>

                <div class="msheet__head" :class="{ 'visually-hidden': hideTitle }">
                    <DialogTitle class="h4">{{ title }}</DialogTitle>
                    <DialogClose class="icon-btn m-press msheet__close" aria-label="Schließen">
                        <Icon name="close" :size="24" />
                    </DialogClose>
                </div>

                <div ref="body" class="msheet__body">
                    <DialogDescription v-if="description" class="muted msheet__description">{{ description }}</DialogDescription>
                    <slot />
                </div>

                <div v-if="$slots.actions" class="msheet__actions">
                    <slot name="actions" />
                </div>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>

<!-- Rendered in a portal, out of reach of a scoped attribute. -->
<style>
.msheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-dialog);
    display: flex;
    flex-direction: column;
    max-height: 92dvh;
    padding-bottom: env(safe-area-inset-bottom);
    border-radius: var(--r-tile) var(--r-tile) 0 0;
    background: var(--c-surface);
    color: var(--c-ink);
    box-shadow: var(--e-3);
    touch-action: none;
    transition: transform var(--d-2) var(--ease-std);
    animation: msheet-in var(--d-3) var(--ease-out);
}

.msheet--dragging {
    transition: none;
}

.msheet[data-state='closed'] {
    animation: msheet-out var(--d-2) var(--ease-in);
}

/* A half sheet is the full sheet resting lower; the snap is a transform. */
.msheet--half {
    height: 92dvh;
    transform: translateY(42dvh);
}

.msheet--half.msheet--expanded {
    transform: translateY(0);
}

.msheet__handle {
    display: flex;
    justify-content: center;
    padding: var(--sp-8) 0 var(--sp-4);
}

.msheet__handle span {
    width: 36px;
    height: 4px;
    border-radius: var(--r-round);
    background: var(--c-line-2);
}

.msheet__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
    padding: 0 var(--sp-8) var(--sp-8) var(--page-margin);
}

.msheet__close {
    flex: none;
}

.msheet__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    padding: 0 var(--page-margin) var(--sp-24);
}

.msheet__description {
    margin-bottom: var(--sp-16);
}

.msheet__actions {
    display: grid;
    gap: var(--sp-8);
    padding: var(--sp-12) var(--page-margin) var(--sp-16);
    border-top: 1px solid var(--c-line);
}

@keyframes msheet-in {
    from {
        transform: translateY(100%);
    }
}

@keyframes msheet-out {
    to {
        transform: translateY(100%);
    }
}
</style>
