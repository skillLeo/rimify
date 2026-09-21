<script setup lang="ts">
/**
 * Kontakt.
 *
 * The stock photograph of a smiling team in a bright office is on the banned list — including the
 * one in the client's own Figma — so the slot is filled by the drawn `werkstatt` scene instead.
 * Every contact detail renders from configuration, never from a literal in this file (D-023).
 */

import { Head } from '@inertiajs/vue3'
import Icon from '../../Components/Art/Icon.vue'
import Photo from '../../Components/Media/Photo.vue'
import Scene from '../../Components/Art/Scene.vue'
import { PHOTOS } from '../../media/photos'
import type { KontaktProps } from '../../types/pages'

defineProps<KontaktProps>()
</script>

<template>
    <Head title="Kontakt" />

    <section class="section">
        <div class="wrap kon">
            <div>
                <h1 class="t-h2">Kontakt</h1>
                <p class="t-body">
                    Fragen zur Freigabe, zur Größe oder zur Lieferung? Schreib uns – oder ruf einfach an.
                </p>

                <form class="card kon__form" @submit.prevent>
                    <div class="kon__grid">
                        <div>
                            <label class="field-label" for="kon-name">
                                Name <span class="field-label__req">*</span>
                            </label>
                            <input id="kon-name" class="field" autocomplete="name" />
                        </div>
                        <div>
                            <label class="field-label" for="kon-mail">
                                E-Mail <span class="field-label__req">*</span>
                            </label>
                            <input id="kon-mail" class="field" type="email" autocomplete="email" />
                        </div>
                        <div class="kon__wide">
                            <label class="field-label" for="kon-vehicle">Fahrzeug</label>
                            <input id="kon-vehicle" class="field" placeholder="z. B. Audi RS 4 Avant" />
                        </div>
                        <div class="kon__wide">
                            <label class="field-label" for="kon-msg">
                                Nachricht <span class="field-label__req">*</span>
                            </label>
                            <textarea id="kon-msg" class="field"></textarea>
                        </div>
                    </div>

                    <button class="btn btn--primary kon__send" type="submit">Nachricht senden</button>
                </form>
            </div>

            <aside class="stack-4">
                <div class="card kon__card">
                    <!-- This slot replaces the smiling-team stock photo from the client's own
                         Figma. No faces, no team: a real workshop, or nothing. -->
                    <div class="kon__art">
                        <Photo :photo="PHOTOS.kontakt">
                            <Scene name="werkstatt" :width="480" />
                        </Photo>
                    </div>
                    <div class="kon__cardbody">
                        <span class="micro">Telefon</span>
                        <p class="kon__value">{{ contact.phoneIntl }}</p>
                        <p class="quiet">{{ contact.hours }}</p>

                        <hr class="hr kon__rule" />

                        <span class="micro">WhatsApp</span>
                        <p class="kon__value">{{ contact.whatsapp }}</p>

                        <hr class="hr kon__rule" />

                        <span class="micro">E-Mail</span>
                        <p class="kon__value">{{ contact.email }}</p>
                    </div>
                </div>

                <div class="panel--wash kon__note">
                    <Icon name="phone" :size="24" />
                    <p class="t-body">
                        Fragen beantworten wir am Telefon, nicht per Formularbrief.
                    </p>
                </div>
            </aside>
        </div>
    </section>
</template>

<style scoped>
.kon {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: var(--s6);
    align-items: start;
}

.kon__form {
    margin-top: var(--s5);
}

.kon__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--s3);
}

.kon__wide {
    grid-column: span 2;
}

.kon__send {
    margin-top: var(--s4);
}

.kon__card {
    padding: 0;
    overflow: hidden;
}

.kon__art {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
}

.kon__cardbody {
    padding: var(--s5);
}

.kon__value {
    margin: 4px 0 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--blue);
}

.kon__rule {
    margin: var(--s4) 0;
}

.kon__note {
    display: flex;
    align-items: flex-start;
    gap: var(--s3);
    color: var(--blue);
}

.kon__note p {
    margin: 0;
    color: var(--ink);
}
</style>
