<script setup lang="ts">
/**
 * The phone's footer: short, because the tab bar already holds the destinations. Service and
 * legal links as rows, the cookie settings, the price note the law wants next to every price
 * list, and the copyright. It sits on the band, not the dark tone — the page's one dark band
 * belongs to the content (DIRECTION §2).
 */

import { computed } from 'vue'
import ListRow from './ListRow.vue'
import { useConsent } from '../../composables/useConsent'
import { useMenus } from '../../composables/useShared'

const menus = useMenus()
const consent = useConsent()

const service = computed(() => menus.value.footer_service ?? [])
const legal = computed(() => menus.value.footer_legal ?? [])
const year = new Date().getFullYear()
</script>

<template>
    <footer class="mfoot">
        <p class="mfoot__claim">Felgen, deren Gutachten dein Fahrzeug nennt.</p>

        <nav aria-label="Service">
            <ListRow v-for="item in service" :key="item.label" :title="item.label" :href="item.href" />
        </nav>

        <nav aria-label="Rechtliches">
            <ListRow v-for="item in legal" :key="item.label" :title="item.label" :href="item.href" />
            <ListRow title="Cookie-Einstellungen" @activate="consent.openSettings()" />
        </nav>

        <p class="mfoot__legal small muted">Alle Preise inkl. gesetzl. MwSt., zzgl. Versandkosten.</p>
        <p class="mfoot__legal small quiet num">© {{ year }} RIMIFY</p>
    </footer>
</template>

<style scoped>
.mfoot {
    padding: var(--sp-32) 0 var(--sp-24);
    background: var(--c-band);
    border-top: 1px solid var(--c-line);
}

.mfoot__claim {
    padding: 0 var(--page-margin) var(--sp-16);
    font-weight: 600;
}

.mfoot nav + nav {
    margin-top: var(--sp-24);
}

.mfoot__legal {
    padding: var(--sp-8) var(--page-margin) 0;
}

.mfoot__legal:first-of-type {
    padding-top: var(--sp-24);
}
</style>
