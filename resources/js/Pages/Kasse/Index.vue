<script setup lang="ts">
import AppLayout from '../../Layouts/AppLayout.vue'
import Desktop from './Desktop.vue'
import Mobile from './Mobile.vue'
import { useShared } from '../../composables/useShared'
import type { KasseProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

const props = defineProps<KasseProps>()
const shared = useShared()
</script>

<template>
    <component :is="shared.isMobile ? Mobile : Desktop" v-bind="props" />
</template>
