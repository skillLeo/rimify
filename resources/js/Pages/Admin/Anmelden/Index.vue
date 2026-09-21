<script setup lang="ts">
/** No layout: the login screen is the only admin page outside the panel frame. */

import Desktop from './Desktop.vue'
import Mobile from './Mobile.vue'
import { useShared } from '../../../composables/useShared'
import type { AdminAnmeldenProps } from '../../../types/pages'

const props = defineProps<AdminAnmeldenProps>()
const shared = useShared()
</script>

<template>
    <component :is="shared.isMobile ? Mobile : Desktop" v-bind="props" />
</template>
