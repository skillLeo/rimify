<script setup lang="ts">
/**
 * A modal surface in one of three shapes: a centred dialog, a drawer from the right edge, or a
 * sheet from the bottom edge. Focus is trapped inside, the page behind does not scroll, Esc and
 * the scrim close it, and focus returns to the control that opened it — all of that comes from
 * the primitive, so no page implements it twice.
 */

import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import Icon from './Icon.vue'

withDefaults(
    defineProps<{
        title: string
        description?: string
        variant?: 'dialog' | 'drawer' | 'sheet'
        wide?: boolean
        /** The title is rendered for assistive technology only, when the content carries its own heading. */
        hideTitle?: boolean
    }>(),
    { description: undefined, variant: 'dialog', wide: false, hideTitle: false }
)

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
    <DialogRoot v-model:open="open">
        <DialogPortal>
            <DialogOverlay class="overlay" />
            <DialogContent
                :class="[variant === 'dialog' ? 'dialog' : variant, { 'dialog--wide': wide }]"
                :aria-describedby="description ? undefined : ''"
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
