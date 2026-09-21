<script setup lang="ts">
/**
 * The device split. `isMobile` is decided on the server from the User-Agent, so the first frame
 * the server renders is already the frame the client hydrates to — there is no layout shift and no
 * moment where a phone briefly shows a desktop grid.
 *
 * The props type lives in `types/pages.ts` and is shared with both variants, so a renamed
 * controller key breaks the build rather than emptying a section quietly.
 */

import AppLayout from '../../Layouts/AppLayout.vue'
import Desktop from './Desktop.vue'
import Mobile from './Mobile.vue'
import { useShared } from '../../composables/useShared'
import type { StartseiteProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

const props = defineProps<StartseiteProps>()
const shared = useShared()
</script>

<template>
    <component :is="shared.isMobile ? Mobile : Desktop" v-bind="props" />
</template>
