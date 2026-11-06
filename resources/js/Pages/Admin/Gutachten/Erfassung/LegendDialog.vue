<script setup lang="ts">
/**
 * The paper's whole Auflagenverzeichnis, for what the short list beside the tyres does not do: a legend pasted at once and split
 * for a person to check, a code taken out, a limit confirmed with its reason, how loud a code is in the shop. Saved as it was
 * before the five steps; the page's props carry the result back into the list and the tags.
 */

import Dialog from '../../../../Components/Ui/Dialog.vue'
import Auflagenverzeichnis from '../Auflagenverzeichnis.vue'
import { useEntry, useGutachtenPage } from './entryStore'

const open = defineModel<boolean>('open', { required: true })

const { state } = useEntry()
const page = useGutachtenPage()
</script>

<template>
    <Dialog v-model:open="open" wide title="Auflagenverzeichnis" description="Die Codes dieses Gutachtens. Füg sie einzeln oder als ganze Legende ein.">
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
