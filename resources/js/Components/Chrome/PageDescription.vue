<script setup lang="ts">
/**
 * The page's search description, where the page does not write its own (App\Support\PageDescription, D-511): the server
 * decides it, so it stands in the server's first frame as on every later visit — as the canonical address does.
 */
import { Head } from '@inertiajs/vue3'
import { computed } from 'vue'
import { useShared } from '../../composables/useShared'

const shared = useShared()
const content = computed(() => (typeof shared.value.pageDescription === 'string' && shared.value.pageDescription !== '' ? shared.value.pageDescription : null))
</script>

<template>
    <Head v-if="content">
        <meta name="description" :content="content" head-key="description" />
    </Head>
</template>
