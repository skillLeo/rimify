<script setup lang="ts">
import AppLayout from '../../Layouts/AppLayout.vue'
import Desktop from './Desktop.vue'
import Mobile from './Mobile.vue'
import { useShared } from '../../composables/useShared'

defineOptions({ layout: AppLayout })

const props = withDefaults(defineProps<{ status?: number }>(), { status: 404 })
const shared = useShared()
</script>

<template>
    <component :is="shared.isMobile ? Mobile : Desktop" v-bind="props" />
</template>
