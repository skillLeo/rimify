<script setup lang="ts">
/**
 * The page's one address (the client's #8): the server writes it — the shop's own host, the car as its key numbers,
 * the filters as the page has them (HandleInertiaRequests::address) — and this puts it in the head, in the server's
 * first frame as on every later visit.
 */
import { Head } from '@inertiajs/vue3'
import { computed } from 'vue'
import { useShared } from '../../composables/useShared'

const shared = useShared()
const href = computed(() => (typeof shared.value.canonical === 'string' && shared.value.canonical !== '' ? shared.value.canonical : null))
</script>

<template>
    <Head v-if="href">
        <link rel="canonical" :href="href" head-key="canonical" />
    </Head>
</template>
