<script setup lang="ts">
/**
 * `/vergleich`, the phone document: the same table two columns wide with the rest by scrolling,
 * under the app bar titled *Vergleich* with the way back to the listing. No sticky action bar —
 * four sticky buys make no sense; each column carries its own.
 */

import { Head } from '@inertiajs/vue3'
import MobileLayout from '../../Layouts/MobileLayout.vue'
import CompareTable from '../../Components/Compare/CompareTable.vue'
import type { VergleichProps } from '../../types/pages'

defineOptions({ layout: [MobileLayout, { title: 'Vergleich', back: '/felgen' }] })

const props = defineProps<VergleichProps>()
</script>

<template>
    <Head title="Felgen vergleichen">
        <meta head-key="robots" name="robots" content="noindex" />
    </Head>

    <section class="section--tight">
        <div class="container">
            <CompareTable v-bind="props" phone />
        </div>
    </section>
</template>
