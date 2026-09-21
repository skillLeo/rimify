<script setup lang="ts">
/**
 * The check result on a phone. Same content, full-width actions — this is a page people open from
 * a link someone sent them, so it has to stand alone with no prior context.
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
                <Link href="/rimify-check" class="btn btn--primary btn--block">Neue Prüfung starten</Link>
            </div>
        </div>
    </section>
</template>
