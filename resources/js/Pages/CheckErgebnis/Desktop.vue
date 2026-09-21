<script setup lang="ts">
/**
 * The shareable check result.
 *
 * Addressed by a token rather than a query string, because the whole point of this page is that it
 * can be sent to a workshop, printed, and still say the same thing next week. The four verdict
 * states are all rendered here — including `UNKNOWN`, which is a neutral answer and never dressed
 * as a refusal (R-07).
 */

import { Head, Link } from '@inertiajs/vue3'
import Icon from '../../Components/Art/Icon.vue'
import type { CheckErgebnisProps } from '../../types/pages'

defineProps<CheckErgebnisProps>()
</script>

<template>
    <Head title="Ergebnis" />

    <section class="section">
        <div class="wrap">
            <div v-if="result === null" class="state">
                <Icon name="info" :size="24" />
                <p class="state__title">Dieses Ergebnis ist nicht mehr verfügbar.</p>
                <p class="t-body">
                    Ergebnis-Links verfallen, wenn sich die zugrunde liegende Freigabe geändert hat.
                    Führe die Prüfung erneut durch, damit du den aktuellen Stand erhältst.
                </p>
                <Link href="/rimify-check" class="btn btn--primary">Neue Prüfung starten</Link>
            </div>
        </div>
    </section>
</template>
