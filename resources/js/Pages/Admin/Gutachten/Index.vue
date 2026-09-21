<script setup lang="ts">
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import Desktop from './Desktop.vue'
import Mobile from './Mobile.vue'
import { useShared } from '../../../composables/useShared'
import type { AdminGutachtenProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout })

const props = defineProps<AdminGutachtenProps>()
const shared = useShared()
</script>

<template>
    <component :is="shared.isMobile ? Mobile : Desktop" v-bind="props" />
</template>
