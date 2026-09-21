<script setup lang="ts">
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import Desktop from './Desktop.vue'
import Mobile from './Mobile.vue'
import { useShared } from '../../../composables/useShared'
import type { AdminDashboardProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout })

const props = defineProps<AdminDashboardProps>()
const shared = useShared()
</script>

<template>
    <component :is="shared.isMobile ? Mobile : Desktop" v-bind="props" />
</template>
