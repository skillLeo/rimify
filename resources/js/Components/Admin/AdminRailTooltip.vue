<script setup lang="ts">
/**
 * A rail item's tooltip, from hydration on (D-272).
 *
 * Until the page has hydrated a tooltip cannot open — nothing listens for the pointer yet — so the server renders the
 * item alone. reka-ui's tooltip is some ten components per item; for the rail's thirty items they were 60 % of the time
 * the server took to render an admin page (a CPU profile of the renderer, 17.10.2026). Once the browser is idle after
 * mounting, the item is drawn again inside its tooltip, with the same markup — not inside the task that hydrates the
 * page, where they cost it about 150 ms (D-276).
 */
import { TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'

defineProps<{
    /** Whether the page has hydrated: until then the item is drawn without its tooltip. */
    enabled: boolean
    disabled: boolean
}>()
</script>

<template>
    <TooltipRoot v-if="enabled" :disabled="disabled">
        <TooltipTrigger as-child>
            <slot />
        </TooltipTrigger>
        <TooltipPortal>
            <TooltipContent class="adm-tooltip" side="right" :side-offset="8">
                <slot name="content" />
            </TooltipContent>
        </TooltipPortal>
    </TooltipRoot>
    <slot v-else />
</template>
