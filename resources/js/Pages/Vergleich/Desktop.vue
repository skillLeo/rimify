<script setup lang="ts">
/**
 * `/vergleich`, the desktop document: the comparison table on the page grid, in the storefront
 * frame. A comparison is not a landing page, so it is `noindex`.
 */

import { Head } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import CompareTable from '../../Components/Compare/CompareTable.vue'
import type { VergleichProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

const props = defineProps<VergleichProps>()
</script>

<template>
    <Head title="Felgen vergleichen">
        <meta head-key="robots" name="robots" content="noindex" />
    </Head>

    <section class="section--tight">
        <div class="container">
            <CompareTable v-bind="props" />
        </div>
    </section>
</template>
