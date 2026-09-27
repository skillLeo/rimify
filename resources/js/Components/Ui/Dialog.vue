<script setup lang="ts">
/**
 * A modal surface in one of three shapes: a centred dialog, a drawer from the right edge, or a
 * sheet from the bottom edge. Focus is trapped inside, the page behind does not scroll, Esc and
 * the scrim close it, and focus returns to the control that opened it — all of that comes from
 * the primitive, so no page implements it twice.
 */

import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { watch } from 'vue'
import Icon from './Icon.vue'

const props = withDefaults(
    defineProps<{
        title: string
        description?: string
        variant?: 'dialog' | 'drawer' | 'sheet'
        wide?: boolean
        /** The title is rendered for assistive technology only, when the content carries its own heading. */
        hideTitle?: boolean
        /** A class for the surface itself — it is portalled, so a surrounding class cannot reach it. */
        contentClass?: string
        /**
         * Where the focus starts — a selector inside the dialog (`#sv-name`). Without one the primitive
         * takes the first control, which is „Schließen“ in the head: a form opens on its first field.
         */
        initialFocus?: string
    }>(),
    { description: undefined, variant: 'dialog', wide: false, hideTitle: false, contentClass: undefined, initialFocus: undefined }
)

const open = defineModel<boolean>('open', { default: false })

/* For the rare caller that must send focus somewhere else on close — calling preventDefault() on
   the event keeps the primitive from returning it to the opener. */
const emit = defineEmits<{ closeAutoFocus: [event: Event] }>()

/*
 * Where focus goes back to. A dialog opened from a menu item would hand it back to that item — which
 * the closing menu has removed — and focus fell to the end of the page. The menu's own trigger (the
 * element whose aria-controls names the menu) is remembered instead.
 */
let opener: HTMLElement | null = null

watch(open, (value) => {
    if (!value || typeof document === 'undefined') {
        return
    }

    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const menu = active?.closest<HTMLElement>('[role="menu"]')
    const trigger = menu?.id ? document.querySelector<HTMLElement>(`[aria-controls="${menu.id}"]`) : null

    opener = trigger ?? active
})

function onOpenAutoFocus(event: Event): void {
    const target = props.initialFocus ? document.querySelector<HTMLElement>(props.initialFocus) : null

    if (target) {
        event.preventDefault()
        target.focus()
    }
}

function onCloseAutoFocus(event: Event): void {
    emit('closeAutoFocus', event)

    if (!event.defaultPrevented && opener?.isConnected) {
        event.preventDefault()
        opener.focus()
    }

    opener = null
}
</script>

<template>
    <DialogRoot v-model:open="open">
        <DialogPortal>
            <DialogOverlay class="overlay" />
            <DialogContent
                :class="[variant === 'dialog' ? 'dialog' : variant, { 'dialog--wide': wide }, contentClass]"
                :aria-describedby="description ? undefined : ''"
                @open-auto-focus="onOpenAutoFocus"
                @close-auto-focus="onCloseAutoFocus"
            >
                <div v-if="variant === 'sheet'" class="sheet__grab" aria-hidden="true" />

                <div class="dialog__head" :class="{ 'visually-hidden': hideTitle }">
                    <DialogTitle class="h3">{{ title }}</DialogTitle>
                    <DialogClose class="icon-btn dialog__close" aria-label="Schließen">
                        <Icon name="close" :size="24" />
                    </DialogClose>
                </div>

                <DialogDescription v-if="description" class="muted dialog__description">
                    {{ description }}
                </DialogDescription>

                <slot />

                <div v-if="$slots.actions" class="dialog__actions">
                    <slot name="actions" />
                </div>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>

<style scoped>
.dialog__description {
    margin-bottom: var(--sp-16);
}
</style>
