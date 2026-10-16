<script setup lang="ts">
/**
 * An example document, opened from the shop (decision 6, D-239). The PDF carries no mark of its own, so the shop never
 * links it bare: it opens through this page, which says first — before anything else, in the heading — that the document
 * is held here only as an example and that no answer drawn from it is evidence for a car, and then offers the file.
 */

import { Head } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'

defineOptions({ layout: AppLayout, inheritAttrs: false })

defineProps<{
    document: { label: string; issuer: string | null }
    pdf: { url: string; page: number | null } | null
}>()
</script>

<template>
    <Head :title="`Beispiel: ${document.label}`" />

    <section class="section-dense">
        <div class="wrap ex">
            <p class="ex__mark">
                <Icon name="info" :size="20" />
                <span class="tag tag--unknown">Beispieldaten</span>
            </p>
            <h1 class="t-h1">{{ document.label }} – nur als Beispiel hinterlegt</h1>
            <p class="t-lead ex__lead">
                Dieses Gutachten gehört zu den Beispieldaten dieses Shops. Eine Freigabe, die auf ihm beruht, ist hier kein
                Nachweis für ein Fahrzeug, und eine Bestellung damit ist ein Testkauf.
            </p>
            <p v-if="document.issuer" class="ex__issuer">{{ document.issuer }}</p>
            <p v-if="pdf" class="ex__open">
                <a class="btn btn--secondary" :href="pdf.url" target="_blank" rel="noopener">
                    Das Dokument öffnen (PDF<template v-if="pdf.page">, Seite {{ pdf.page }}</template>)
                </a>
            </p>
            <p v-else class="ex__issuer">Die Datei zu diesem Dokument liegt gerade nicht bei uns.</p>
        </div>
    </section>
</template>

<style scoped>
.ex {
    display: grid;
    gap: var(--space-3);
    padding-block: var(--space-6);
}

.ex__mark {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--ink2);
}

.ex__lead,
.ex__issuer {
    color: var(--ink2);
}

.ex__open {
    margin-top: var(--space-2);
}
</style>
