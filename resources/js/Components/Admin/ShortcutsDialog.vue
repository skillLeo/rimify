<script setup lang="ts">
/**
 * Every shortcut the panel answers to, and only those — the list is drawn from the same table the
 * keyboard handler reads, so it cannot promise a key that does nothing.
 *
 * The `g` rows are this viewer's own: a role without Verkauf gets no "g dann b", because that
 * sequence is not bound for them either. `[` is listed only where it works, from 1024 px; below that
 * the rail is collapsed by the width, not by choice.
 */

import { computed, ref, watch } from 'vue'
import Dialog from '../Ui/Dialog.vue'
import Kbd from '../Ui/Kbd.vue'
import { useAdmin, useAdminShell } from '../../composables/admin/useAdmin'
import { goTargets } from '../../composables/admin/useAdminShortcuts'

const admin = useAdmin()
const { shortcutsOpen } = useAdminShell()

const targets = computed(() => goTargets(admin.value.nav))

/* Read when the dialog opens: it never renders on the server, so there is no first frame to agree on. */
const wide = ref(true)

watch(shortcutsOpen, (open) => {
    if (open) {
        wide.value = window.matchMedia('(min-width: 1024px)').matches
    }
})
</script>

<template>
    <Dialog v-model:open="shortcutsOpen" title="Tastenkürzel" content-class="adm-dialog">
        <section class="adm-keys" aria-labelledby="adm-keys-general">
            <h3 id="adm-keys-general" class="adm-keys__title">Überall</h3>
            <dl class="adm-keys__list">
                <div class="adm-keys__row">
                    <dt>Suche öffnen</dt>
                    <dd><Kbd :keys="['K']" modifier /> <span class="adm-keys__or">oder</span> <Kbd :keys="['/']" /></dd>
                </div>
                <div v-if="wide" class="adm-keys__row">
                    <dt>Seitenleiste ein- oder ausklappen</dt>
                    <dd><Kbd :keys="['[']" /></dd>
                </div>
                <div class="adm-keys__row">
                    <dt>Diese Übersicht zeigen</dt>
                    <dd><Kbd :keys="['?']" /></dd>
                </div>
                <div class="adm-keys__row">
                    <dt>Fenster oder Menü schließen</dt>
                    <dd><Kbd :keys="['Esc']" /></dd>
                </div>
            </dl>
        </section>

        <section v-if="targets.length" class="adm-keys" aria-labelledby="adm-keys-go">
            <h3 id="adm-keys-go" class="adm-keys__title">Gehe zu</h3>
            <dl class="adm-keys__list">
                <div v-for="target in targets" :key="target.key" class="adm-keys__row">
                    <dt>{{ target.label }}</dt>
                    <dd>
                        <Kbd :keys="['G']" /> <span class="adm-keys__or">dann</span>
                        <Kbd :keys="[target.key.toUpperCase()]" />
                    </dd>
                </div>
            </dl>
        </section>

        <p class="adm-keys__note">Die Kürzel ohne Strg oder ⌘ wirken nicht, solange du in ein Feld schreibst.</p>
    </Dialog>
</template>
