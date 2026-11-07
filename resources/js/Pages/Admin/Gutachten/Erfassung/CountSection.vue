<script setup lang="ts">
/**
 * The count of the paper's Verwendungsbereich, in step 5: what the person releasing reads off the PDF (D-228), which the release
 * compares with what was entered. Folded while it agrees; the card itself is the one the page has always used.
 */

import { computed } from 'vue'
import CountCard from '../CountCard.vue'
import { useEntry, useGutachtenPage } from './entryStore'

const { state } = useEntry()
const page = useGutachtenPage()
const doc = computed(() => page.props.document)
</script>

<template>
    <section class="ef-check" aria-labelledby="ef-count-h">
        <h3 id="ef-count-h" class="ef-check__title">Zählung aus dem Gutachten</h3>
        <CountCard :document-id="doc.id" :stamp="page.props.stamps.document" :count="doc.count ?? null" :editable="state.editable" :page-count="doc.pageCount" :rows="page.props.rowsTotal ?? 0" />
    </section>
</template>
