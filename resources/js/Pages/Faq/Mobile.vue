<script setup lang="ts">
/** The FAQ on a phone: accordions full width, the help card last. */

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
        <div class="wrap">
            <h1 class="t-h2">Meistgestellte Fragen</h1>

            <div v-for="group in groups" :key="group.key" class="mfaq__group">
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

            <article class="card mfaq__help">
                <div class="mfaq__art">
                    <Photo :photo="PHOTOS.werkstatt">
                        <Scene name="werkstatt" :width="420" />
                    </Photo>
                </div>
                <div class="mfaq__helpbody">
                    <h2 class="t-h3">Weitere Fragen oder Unterstützung benötigt?</h2>
                    <p class="mfaq__phone">{{ contact.phone }}</p>
                    <p class="quiet">{{ contact.hours }}</p>
                    <Link href="/kontakt" class="btn btn--secondary btn--block">Zum Kontaktformular</Link>
                </div>
            </article>
        </div>
    </section>
</template>

<style scoped>
.mfaq__group {
    margin-top: var(--s5);
}

.mfaq__group .micro {
    margin-bottom: var(--s2);
}

.mfaq__help {
    margin-top: var(--s6);
    padding: 0;
    overflow: hidden;
}

.mfaq__art {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
}

.mfaq__helpbody {
    padding: var(--s4);
}

.mfaq__helpbody h2 {
    margin: 0 0 var(--s3);
}

.mfaq__phone {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--blue);
}
</style>
