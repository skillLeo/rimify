<script setup lang="ts">
/**
 * The EU tyre label (Regulation (EU) 2020/740): fuel efficiency, wet grip and external rolling
 * noise, laid out the way the printed label lays them out, and linked to the EPREL entry when the
 * registration number is known. Every value comes from product data; nothing here is a default.
 *
 * Snow grip and ice grip are pictograms the printed label carries only where the tyre has them, so
 * a row appears only where „ja“ is on record (D-302) — never for „nein“, never for an unanswered field.
 */

import { computed } from 'vue'
import Icon from './Icon.vue'
import { withUnit } from '../../format'

export type TyreClass = 'A' | 'B' | 'C' | 'D' | 'E'

const props = defineProps<{
    fuel: TyreClass
    wet: TyreClass
    noiseDb: number
    noiseClass: 'A' | 'B' | 'C'
    /** `Continental PremiumContact 7 · 225/45 R18 95Y` */
    title: string
    eprelId?: string | null
    snowGrip?: boolean | null
    iceGrip?: boolean | null
}>()

/* Read on every change: a label shown for another tyre, or a number typed in the admin's preview, links its own entry. */
const eprelHref = computed(() => (props.eprelId ? `https://eprel.ec.europa.eu/qr/${encodeURIComponent(props.eprelId)}` : null))
</script>

<template>
    <figure class="tyre-label">
        <figcaption class="small">{{ title }}</figcaption>

        <div class="tyre-label__row">
            <Icon name="fuel" :size="24" />
            <span class="tyre-label__name">Kraftstoffeffizienz</span>
            <span class="tyre-label__class">{{ fuel }}</span>
        </div>

        <div class="tyre-label__row">
            <Icon name="rain" :size="24" />
            <span class="tyre-label__name">Nasshaftung</span>
            <span class="tyre-label__class">{{ wet }}</span>
        </div>

        <div class="tyre-label__row">
            <Icon name="sound" :size="24" />
            <span class="tyre-label__name num">Rollgeräusch {{ withUnit(noiseDb, 'dB') }}</span>
            <span class="tyre-label__class">{{ noiseClass }}</span>
        </div>

        <div v-if="snowGrip === true" class="tyre-label__row">
            <Icon name="snow" :size="24" />
            <span class="tyre-label__name">Schneegriffigkeit</span>
        </div>

        <div v-if="iceGrip === true" class="tyre-label__row">
            <Icon name="ice" :size="24" />
            <span class="tyre-label__name">Eisgriffigkeit</span>
        </div>

        <div class="tyre-label__foot">
            <a v-if="eprelHref" :href="eprelHref" rel="noopener" target="_blank">EU-Reifenlabel in der EPREL-Datenbank</a>
            <span v-else>EU-Reifenlabel nach Verordnung (EU) 2020/740</span>
        </div>
    </figure>
</template>
