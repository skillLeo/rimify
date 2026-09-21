<script setup lang="ts">
/** The shortcut list: opened with `?` or from the footer. */

import Dialog from '../Ui/Dialog.vue'
import Kbd from '../Ui/Kbd.vue'
import { useShell } from '../../composables/useShell'

const shell = useShell()
</script>

<template>
    <Dialog v-model:open="shell.helpOpen.value" title="Tastenkürzel" description="Die Kürzel gelten überall, außer wenn du gerade in ein Feld schreibst.">
        <dl class="shortcuts">
            <dt><Kbd :keys="['/']" /></dt>
            <dd>Suche fokussieren</dd>
            <dt><Kbd :keys="['K']" modifier /></dt>
            <dd>Suche und Befehle öffnen</dd>
            <dt><Kbd :keys="['?']" /></dt>
            <dd>Diese Liste</dd>
            <dt><Kbd :keys="['Esc']" /></dt>
            <dd>Dialog oder Menü schließen</dd>
            <dt><Kbd :keys="['↑', '↓']" /></dt>
            <dd>In Listen bewegen</dd>
            <dt><Kbd :keys="['↵']" /></dt>
            <dd>Auswahl öffnen</dd>
            <dt><Kbd :keys="['F8']" /></dt>
            <dd>Letzte Meldung</dd>
        </dl>
    </Dialog>
</template>

<style scoped>
.shortcuts {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--sp-12) var(--sp-16);
    align-items: center;
}

.shortcuts dt {
    display: flex;
    justify-content: flex-end;
}
</style>
