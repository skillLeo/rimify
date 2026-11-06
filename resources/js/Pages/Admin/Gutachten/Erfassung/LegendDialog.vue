<script setup lang="ts">
/**
 * The paper's whole Auflagenverzeichnis, for what the short list beside the tyres does not do: a legend pasted at once and split
 * for a person to check, a code taken out, a limit confirmed with its reason, how loud a code is in the shop. Saved as it was
 * before the five steps; the page's props carry the result back into the list and the tags.
 */

import { provide, ref } from 'vue'
import Dialog from '../../../../Components/Ui/Dialog.vue'
import Auflagenverzeichnis from '../Auflagenverzeichnis.vue'
import { LEGEND_DRAFT } from '../legendDraft'
import { useEntry, useGutachtenPage } from './entryStore'

const open = defineModel<boolean>('open', { required: true })

const { state } = useEntry()
const page = useGutachtenPage()

/* A legend pasted and split: Esc or a click beside the dialog closes it, and it is still here on reopening. */
provide(LEGEND_DRAFT, { open: ref(false), pasted: ref(''), split: ref([]) })
</script>

<template>
    <Dialog v-model:open="open" wide content-class="ef-legend" title="Auflagenverzeichnis" description="Die Codes dieses Gutachtens. Füg sie einzeln oder als ganze Legende ein.">
        <Auflagenverzeichnis
            :document-id="state.documentId"
            :conditions="page.props.conditions"
            :choices="page.props.choices"
            :unresolved="page.props.unresolved"
            :editable="state.editable"
            :page-count="page.props.document.pageCount"
            :levels="page.props.levels"
            :levels-editable="page.props.can.levels === true"
            :level-floor-sentence="page.props.levelFloorSentence"
        />
    </Dialog>
</template>

<style>
/* Portalled out of the page. The whole table has to fit: „Im Shop“, „Seite“, „Verwendet“ and its menu are what the dialog is for. */
.dialog.ef-legend {
    max-width: min(1040px, calc(100vw - 2 * var(--sp-20)));
}

.ef-legend .adm-panel {
    overflow-x: auto;
}
</style>
