<script setup lang="ts">
import AppLayout from '../../Layouts/AppLayout.vue'
import Desktop from './Desktop.vue'
import Mobile from './Mobile.vue'
import { useShared } from '../../composables/useShared'
import type { BestellungProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

const props = defineProps<BestellungProps>()
const shared = useShared()
</script>

<template>
    <component :is="shared.isMobile ? Mobile : Desktop" v-bind="props" />
</template>
