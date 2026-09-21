<script setup lang="ts">
/**
 * The FAQ. Groups from the database, so marketing adds an answer without a deployment.
 *
 * This is one of the pages that shows the blue bar rather than the white box: a visitor with a car
 * chosen is not inside the buying process here, and restating their vehicle in the black header
 * would imply this page is about it.
 */

import { Head, Link } from '@inertiajs/vue3'
import { ref } from 'vue'
import Icon from '../../Components/Art/Icon.vue'
import Photo from '../../Components/Media/Photo.vue'
import Scene from '../../Components/Art/Scene.vue'
import { PHOTOS } from '../../media/photos'
import type { FaqProps } from '../../types/pages'

defineProps<FaqProps>()

const open = ref<number | null>(null)
</script>

<template>
    <Head title="Meistgestellte Fragen" />

    <section class="section">
        <div class="wrap faq">
            <div>
                <h1 class="t-h1">Meistgestellte Fragen</h1>

                <div v-for="group in groups" :key="group.key" class="faq__group">
                    <p class="micro">{{ group.key }}</p>

                    <div v-for="entry in group.entries" :key="entry.id" class="acc">
                        <button
                            class="acc__head"
                            type="button"
                            :aria-expanded="open === entry.id"
                            @click="open = open === entry.id ? null : entry.id"
                        >
                            {{ entry.question }}
                            <Icon :name="open === entry.id ? 'minus' : 'plus'" :size="20" />
                        </button>
                        <div v-if="open === entry.id" class="acc__body t-body">{{ entry.answer }}</div>
                    </div>
                </div>
            </div>

            <aside class="card faq__help">
                <div class="faq__art">
                    <Photo :photo="PHOTOS.werkstatt">
                        <Scene name="werkstatt" :width="480" />
                    </Photo>
                </div>
                <div class="faq__helpbody">
                    <h2 class="t-h3">Weitere Fragen oder Unterstützung benötigt?</h2>
                    <p class="faq__phone">{{ contact.phone }}</p>
                    <p class="quiet">{{ contact.hours }}</p>
                    <p class="t-body">Wir freuen uns von dir zu hören.</p>
                    <Link href="/kontakt" class="btn btn--secondary btn--block">Zum Kontaktformular</Link>
                </div>
            </aside>
        </div>
    </section>
</template>

<style scoped>
.faq {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: var(--space-6);
    align-items: start;
}

.faq__group {
    margin-top: var(--space-6);
}

.faq__group .micro {
    margin-bottom: var(--space-3);
}

.faq__help {
    padding: 0;
    overflow: hidden;
}

.faq__art {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
}

.faq__helpbody {
    padding: var(--space-5);
}

.faq__helpbody h2 {
    margin: 0 0 var(--space-3);
}

.faq__phone {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--blue);
}
</style>
