<script setup lang="ts">
/**
 * Kontakt.
 *
 * The form and the direct lines side by side from 900px; on a phone the form comes first, then
 * the workshop photograph, then the numbers — the order the brief keeps from the old phone page.
 *
 * Every contact detail renders from `config('rimify.contact')` via the controller, never from a
 * literal here (D-023). A chosen vehicle is written into the Fahrzeug field, because the first
 * thing we would ask is which car the question is about.
 *
 * Spam protection is invisible: a honeypot field no person sees or fills. There is no "security
 * check" box that checks nothing.
 */

import { Head } from '@inertiajs/vue3'
import { computed, reactive } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'
import Photo from '../../Components/Media/Photo.vue'
import Scene from '../../Components/Art/Scene.vue'
import { PHOTOS } from '../../media/photos'
import { useShared } from '../../composables/useShared'
import type { KontaktProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<KontaktProps>()

const shared = useShared()

const form = reactive({
    name: '',
    email: '',
    phone: '',
    vehicle: shared.value.vehicle
        ? `${shared.value.vehicle.label} (${shared.value.vehicle.keyNumbers})`
        : '',
    message: '',
    website: '',
})

/* Phone and WhatsApp only when the client has given them; the e-mail always. */
const telHref = computed(() => `tel:${(props.contact.phoneIntl ?? props.contact.phone ?? '').replace(/\s/g, '')}`)
const waHref = computed(() => `https://wa.me/${(props.contact.whatsapp ?? '').replace(/[^0-9]/g, '')}`)
</script>

<template>
    <Head title="Kontakt" />

    <section class="section-dense">
        <div class="wrap">
            <h1 class="t-h1">Kontakt</h1>
            <p class="t-lead kon__lead">
                Fragen zur Passgenauigkeit, zu einer Bestellung oder zu einem Gutachten?
                {{ contact.phone ? 'Schreib uns oder ruf einfach an' : 'Schreib uns' }} – wir antworten
                in der Regel noch am selben Werktag.
            </p>

            <div class="kon">
                <form class="card kon__form" @submit.prevent>
                    <h2 class="t-h3">Sende uns eine Nachricht</h2>

                    <div class="kon__grid">
                        <div class="kon__field">
                            <label class="field-label" for="kon-name">
                                Vollständiger Name <span class="field-label__req">*</span>
                            </label>
                            <input id="kon-name" v-model="form.name" class="field" autocomplete="name" required />
                        </div>
                        <div class="kon__field">
                            <label class="field-label" for="kon-mail">
                                E-Mail <span class="field-label__req">*</span>
                            </label>
                            <input
                                id="kon-mail"
                                v-model="form.email"
                                class="field"
                                type="email"
                                inputmode="email"
                                autocomplete="email"
                                required
                            />
                        </div>
                        <div class="kon__field">
                            <label class="field-label" for="kon-tel">Telefon</label>
                            <input
                                id="kon-tel"
                                v-model="form.phone"
                                class="field"
                                type="tel"
                                inputmode="tel"
                                autocomplete="tel"
                            />
                        </div>
                        <div class="kon__field">
                            <label class="field-label" for="kon-vehicle">Fahrzeug</label>
                            <input
                                id="kon-vehicle"
                                v-model="form.vehicle"
                                class="field"
                                placeholder="z. B. Audi RS 4 Avant"
                            />
                        </div>
                        <div class="kon__field kon__wide">
                            <label class="field-label" for="kon-msg">
                                Nachricht <span class="field-label__req">*</span>
                            </label>
                            <textarea id="kon-msg" v-model="form.message" class="field" required></textarea>
                        </div>

                        <!-- Honeypot: invisible to people, filled only by bots. -->
                        <div class="visually-hidden" aria-hidden="true">
                            <label for="kon-website">Website</label>
                            <input id="kon-website" v-model="form.website" tabindex="-1" autocomplete="off" />
                        </div>
                    </div>

                    <div class="kon__send">
                        <button class="btn btn--primary" type="submit">Nachricht senden</button>
                        <p class="t-small quiet">Pflichtfelder mit * markiert.</p>
                    </div>
                </form>

                <aside class="kon__side" aria-labelledby="kon-direct">
                    <!-- A real workshop, and nobody in it — never the smiling-team stock photo. -->
                    <div class="kon__photo">
                        <Photo :photo="PHOTOS.kontakt">
                            <Scene name="werkstatt" :width="480" />
                        </Photo>
                    </div>

                    <h2 id="kon-direct" class="t-h3 kon__side-title">Direkt erreichen</h2>
                    <p class="t-small quiet">{{ contact.hours }}</p>

                    <ul class="kon__ways">
                        <li v-if="contact.phone">
                            <a class="kon__way" :href="telHref">
                                <Icon name="phone" :size="20" />
                                <span>
                                    <span class="kon__way-value tabular">{{ contact.phone }}</span>
                                    <span class="kon__way-note">Telefon</span>
                                </span>
                            </a>
                        </li>
                        <li v-if="contact.whatsapp">
                            <a class="kon__way" :href="waHref" rel="noopener">
                                <Icon name="phone" :size="20" />
                                <span>
                                    <span class="kon__way-value tabular">{{ contact.whatsapp }}</span>
                                    <span class="kon__way-note">WhatsApp</span>
                                </span>
                            </a>
                        </li>
                        <li>
                            <a class="kon__way" :href="`mailto:${contact.email}`">
                                <Icon name="mail" :size="20" />
                                <span>
                                    <span class="kon__way-value">{{ contact.email }}</span>
                                    <span class="kon__way-note">E-Mail</span>
                                </span>
                            </a>
                        </li>
                    </ul>
                </aside>
            </div>
        </div>
    </section>
</template>

<style scoped>
.kon__lead {
    margin-top: var(--space-3);
    color: var(--ink2);
}

.kon {
    display: grid;
    gap: var(--space-6);
    margin-top: var(--space-6);
    align-items: start;
}

.kon__form {
    min-width: 0;
}

.kon__grid {
    display: grid;
    gap: var(--space-4);
    margin-top: var(--space-4);
}

.kon__field {
    min-width: 0;
}

.kon__send {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-4);
    margin-top: var(--space-5);
}

.kon__side {
    min-width: 0;
}

.kon__photo {
    position: relative;
    aspect-ratio: 16 / 10;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--field);
}

.kon__side-title {
    margin-top: var(--space-5);
}

.kon__ways {
    display: grid;
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--line);
}

.kon__way {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 56px;
    padding-block: var(--space-2);
    border-bottom: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
}

.kon__way :deep(svg) {
    flex: none;
    color: var(--ink2);
}

.kon__way-value {
    display: block;
    font-weight: 700;
    color: var(--blue);
}

.kon__way-note {
    display: block;
    font-size: var(--text-small);
    color: var(--ink2);
}

@media (hover: hover) and (pointer: fine) {
    .kon__way:hover .kon__way-value {
        color: var(--blue-h);
        text-decoration: underline;
    }
}

@media (min-width: 640px) {
    .kon__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .kon__wide {
        grid-column: 1 / -1;
    }
}

@media (min-width: 900px) {
    .kon {
        grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
        gap: var(--space-7);
    }
}

@media (min-width: 1200px) {
    .kon {
        grid-template-columns: minmax(0, 1fr) 420px;
    }
}
</style>
