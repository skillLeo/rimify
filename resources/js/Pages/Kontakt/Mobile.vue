<script setup lang="ts">
/**
 * Kontakt on a phone: the phone number first as a tap-to-call row, the form beneath it. Someone
 * reaching this page from a bottom-nav tap usually wants to call, not to type.
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
        <div class="wrap">
            <h1 class="t-h1">Kontakt</h1>

            <!-- The same replacement the desktop page makes: a real workshop, never the
                 smiling-team composition from the client's Figma. -->
            <div class="mkon__art">
                <Photo :photo="PHOTOS.kontakt">
                    <Scene name="werkstatt" :width="420" />
                </Photo>
            </div>

            <div class="stack mkon__direct">
                <a class="row-item mkon__row" :href="`tel:${contact.phoneIntl.replace(/\s/g, '')}`">
                    <span><Icon name="phone" :size="20" /> {{ contact.phoneIntl }}</span>
                    <Icon name="chevron-right" :size="20" />
                </a>
                <a class="row-item mkon__row" :href="`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`">
                    <span><Icon name="whatsapp" :size="20" /> WhatsApp</span>
                    <Icon name="chevron-right" :size="20" />
                </a>
                <a class="row-item mkon__row" :href="`mailto:${contact.email}`">
                    <span><Icon name="mail" :size="20" /> {{ contact.email }}</span>
                    <Icon name="chevron-right" :size="20" />
                </a>
            </div>

            <p class="quiet mkon__hours">{{ contact.hours }}</p>

            <form class="card mkon__form" @submit.prevent>
                <div class="stack-4">
                    <div>
                        <label class="field-label" for="mkon-name">
                            Name <span class="field-label__req">*</span>
                        </label>
                        <input id="mkon-name" class="field" autocomplete="name" />
                    </div>
                    <div>
                        <label class="field-label" for="mkon-mail">
                            E-Mail <span class="field-label__req">*</span>
                        </label>
                        <input id="mkon-mail" class="field" type="email" autocomplete="email" />
                    </div>
                    <div>
                        <label class="field-label" for="mkon-vehicle">Fahrzeug</label>
                        <input id="mkon-vehicle" class="field" placeholder="z. B. Audi RS 4 Avant" />
                    </div>
                    <div>
                        <label class="field-label" for="mkon-msg">
                            Nachricht <span class="field-label__req">*</span>
                        </label>
                        <textarea id="mkon-msg" class="field"></textarea>
                    </div>
                    <button class="btn btn--primary btn--block" type="submit">Nachricht senden</button>
                </div>
            </form>
        </div>
    </section>
</template>

<style scoped>
.mkon__art {
    position: relative;
    aspect-ratio: 16 / 10;
    margin-top: var(--space-4);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.mkon__direct {
    margin-top: var(--space-4);
}

.mkon__row {
    text-decoration: none;
}

.mkon__row span {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
}

.mkon__hours {
    margin: var(--space-3) 0 0;
    font-size: 13px;
}

.mkon__form {
    margin-top: var(--space-5);
}
</style>
