<script setup lang="ts">
/**
 * The homepage, desktop document (docs/design/sections/home.md).
 *
 * Every section either moves the visitor to a vehicle, shows evidence that the answer is real, or
 * gets out of the way. The hero (H2) and the promise row (H3) are fixed; from H4 on, the background
 * and the section padding are assigned by position over the sections actually rendered — band and
 * surface alternate over the light sections, `.section` and `.section--tight` over all of them —
 * so two neighbours never share a tone or a padding, whichever sections the data switches off.
 *
 * Everything on the page is data from the props; nothing is typed into a template.
 */

import { Head } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import CalculatorSection from '../../Components/Home/CalculatorSection.vue'
import FindFast from '../../Components/Home/FindFast.vue'
import GuidesSection from '../../Components/Home/GuidesSection.vue'
import GutachtenStory from '../../Components/Home/GutachtenStory.vue'
import HomeHero from '../../Components/Home/HomeHero.vue'
import KomplettradBand from '../../Components/Home/KomplettradBand.vue'
import PartnersSection from '../../Components/Home/PartnersSection.vue'
import PopularWheels from '../../Components/Home/PopularWheels.vue'
import PromiseRow from '../../Components/Home/PromiseRow.vue'
import ServiceFaq from '../../Components/Home/ServiceFaq.vue'
import { useShared } from '../../composables/useShared'
import type { StartseiteProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

const props = defineProps<StartseiteProps>()

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle)

const DESCRIPTION =
    'RIMIFY zeigt dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt – mit den zulässigen Reifengrößen, allen Auflagen und dem Gutachten als PDF zu jeder Bestellung.'

/* Which sections the data switches on. H5b lives inside H5 and has no slot of its own. */
const showPromises = computed(() => props.promises.length > 0)
const showFindFast = computed(() => props.sizes.length > 0 || props.brands.length > 0)
const showPartners = computed(() => props.partners.enabled)
const showGuides = computed(() => props.guides.length > 0)

type SectionKey = 'h4' | 'h5' | 'h6' | 'h7' | 'h8' | 'h9' | 'h10' | 'h11'

/*
 * The rhythm from H4 on (§0.3): padding alternates over every rendered section, the tone over the
 * light ones only — the dark band keeps its own colour and takes no turn in the alternation.
 */
const rhythm = computed<Partial<Record<SectionKey, string>>>(() => {
    const order: SectionKey[] = ['h4', 'h5']

    if (showFindFast.value) order.push('h6')
    order.push('h7', 'h8')
    if (showPartners.value) order.push('h9')
    if (showGuides.value) order.push('h10')
    order.push('h11')

    const out: Partial<Record<SectionKey, string>> = {}
    let light = 0

    order.forEach((key, i) => {
        const density = i % 2 === 0 ? 'section' : 'section--tight'

        if (key === 'h7') {
            out[key] = density
            return
        }

        out[key] = light % 2 === 0 ? `band ${density}` : density
        light++
    })

    return out
})
</script>

<template>
    <Head title="Felgen mit Gutachten für dein Auto">
        <meta name="description" :content="DESCRIPTION" head-key="description" />
    </Head>

    <HomeHero :hero="hero" :selector="selector" />

    <PromiseRow v-if="showPromises" :promises="promises" />

    <GutachtenStory :class="rhythm.h4" :stats="hero.stats" :vehicle="vehicle" />

    <PopularWheels :class="rhythm.h5" :popular="popular" :recently-viewed="recentlyViewed" :vehicle="vehicle" />

    <FindFast v-if="showFindFast" :class="rhythm.h6" :sizes="sizes" :brands="brands" />

    <KomplettradBand :class="rhythm.h7" :tyre="komplettrad.tyre" :vehicle="vehicle" />

    <CalculatorSection :class="rhythm.h8" :prefill="calculator.prefill" />

    <PartnersSection v-if="showPartners" :class="rhythm.h9" :demo="partners.demo" />

    <GuidesSection v-if="showGuides" :class="rhythm.h10" :guides="guides" />

    <ServiceFaq :class="rhythm.h11" :faq="faq" />
</template>
