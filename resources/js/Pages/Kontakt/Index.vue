<script setup lang="ts">
/**
 * Kontakt.
 *
 * E-mail is the shop's one confirmed channel (docs/phase0/ACCURACY.md D5), so the page is an
 * e-mail block: the address, the service hours, and a button that opens the customer's mail
 * program. There is no form. A form needs an endpoint behind it — a Form Request, a Policy, a mail
 * and a feature test (CLAUDE.md §8) — and one without swallows the message without a word. It
 * comes back together with that endpoint, not before.
 *
 * Every contact detail renders from `config('rimify.contact')` via the controller, never from a
 * literal here (D-023). A chosen vehicle is written into the prepared e-mail, because the first
 * thing we would ask is which car the question is about. No reply-time promise: the client gave
 * service hours, not a response time.
 */

import { Head } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'
import { useShared } from '../../composables/useShared'
import { mailtoHref } from '../../lib/mailto'
import type { KontaktProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<KontaktProps>()

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle ?? null)

const mailHref = computed(() =>
    mailtoHref(props.contact.email, {
        subject: 'Anfrage',
        body: vehicle.value === null ? '' : `Fahrzeug: ${vehicle.value.label} (${vehicle.value.keyNumbers})\n\n`,
    })
)

/* Phone and WhatsApp only once the client has given them (config); today there are none. */
const telHref = computed(() => `tel:${(props.contact.phoneIntl ?? props.contact.phone ?? '').replace(/\s/g, '')}`)
const waHref = computed(() => `https://wa.me/${(props.contact.whatsapp ?? '').replace(/[^0-9]/g, '')}`)
</script>

<template>
    <Head title="Kontakt" />

    <section class="section-dense">
        <div class="wrap">
            <h1 class="t-h1">Kontakt</h1>
            <p class="t-lead kon__lead">
                Fragen zur Passgenauigkeit, zu einer Bestellung oder zu einem Gutachten? Schreib uns.
            </p>

            <section class="card kon__mail" aria-labelledby="kon-mail-title">
                <h2 id="kon-mail-title" class="t-h3">Schreib uns eine E-Mail</h2>
                <p class="t-body kon__text">
                    An <a class="kon__address" :href="mailHref">{{ contact.email }}</a> – wir sind
                    {{ contact.hours }} für dich da.
                </p>
                <p class="t-small kon__hint">
                    <template v-if="vehicle">
                        Dein Fahrzeug steht schon in der E-Mail: {{ vehicle.label }} ({{ vehicle.keyNumbers }}).
                    </template>
                    <template v-else>Wenn es um die Passform geht, gern mit HSN, TSN und Modell.</template>
                </p>

                <a class="btn btn--primary kon__send" :href="mailHref">
                    <Icon name="mail" :size="20" />
                    E-Mail schreiben
                </a>

                <ul v-if="contact.phone || contact.whatsapp" class="kon__ways">
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
                </ul>
            </section>
        </div>
    </section>
</template>

<style scoped>
.kon__lead {
    margin-top: var(--space-3);
    color: var(--ink2);
}

.kon__mail {
    max-width: 640px;
    margin-top: var(--space-6);
}

.kon__text {
    margin-top: var(--space-3);
}

/* A long address breaks rather than pushing the card past a 320px screen. */
.kon__address {
    font-weight: 700;
    color: var(--blue);
    overflow-wrap: anywhere;
}

.kon__hint {
    margin-top: var(--space-2);
    color: var(--ink2);
}

.kon__send {
    margin-top: var(--space-5);
}

.kon__ways {
    display: grid;
    margin: var(--space-5) 0 0;
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
    .kon__address:hover,
    .kon__way:hover .kon__way-value {
        color: var(--blue-h);
        text-decoration: underline;
    }
}
</style>
