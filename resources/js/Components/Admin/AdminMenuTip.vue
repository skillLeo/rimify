<script setup lang="ts">
/**
 * A tooltip for a control that also opens a menu — „Neu“ and the account row in the rail's foot.
 *
 * reka's tooltip and menu both anchor through the nearest popper: one element that is the trigger of
 * both hands the menu's anchor to the tooltip, and the menu opens nowhere (off the screen, never
 * positioned). So the tooltip's trigger is a box-less wrapper (`display: contents`) around the menu's
 * own trigger, positioned on the control inside it (`reference`), and opened by the pointer as any
 * tooltip is — and by focus reaching the control, since a wrapper is never focused itself.
 */

import { TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed, ref, watch, type ComponentPublicInstance } from 'vue'

const props = defineProps<{ text: string; disabled: boolean }>()

const open = ref(false)
const wrapper = ref<ComponentPublicInstance | null>(null)
const control = computed(() => ((wrapper.value?.$el as HTMLElement | undefined)?.firstElementChild as HTMLElement | null) ?? undefined)

watch(
    () => props.disabled,
    (disabled) => {
        if (disabled) {
            open.value = false
        }
    }
)

function onFocusIn(event: FocusEvent): void {
    open.value = !props.disabled && (event.target as HTMLElement).matches(':focus-visible')
}
</script>

<template>
    <TooltipRoot v-model:open="open" :disabled="disabled">
        <TooltipTrigger ref="wrapper" as="span" class="adm-menutip" :reference="control" @focusin="onFocusIn" @focusout="open = false">
            <slot />
        </TooltipTrigger>
        <TooltipPortal>
            <TooltipContent class="adm-tooltip" side="right" :side-offset="8">{{ text }}</TooltipContent>
        </TooltipPortal>
    </TooltipRoot>
</template>

<style scoped>
.adm-menutip {
    display: contents;
}
</style>
