<script setup lang="ts">
/**
 * H11 · Service und FAQ.
 *
 * A person to ask, with an honest "now" or "when": the status line is computed on the server in
 * Europe/Berlin and re-fetched once a minute after mount, so the text swaps and nothing else does.
 * The contact values come from the shared `contact` prop only — never typed here. The five
 * questions are the same rows the FAQ page shows, answered in place.
 */

import { Link, router } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import Accordion, { type AccordionEntry } from '../Ui/Accordion.vue'
import Icon from '../Ui/Icon.vue'
import { useShared } from '../../composables/useShared'
import type { FaqPreview } from '../../types/pages'

const props = defineProps<{ faq: FaqPreview[] }>()

const REFRESH_MS = 60_000

const shared = useShared()
const contact = computed(() => shared.value.contact)
const status = computed(() => shared.value.serviceStatus)

const telHref = computed(() => `tel:${contact.value.phoneIntl.replace(/\s/g, '')}`)
const waHref = computed(() => `https://wa.me/${contact.value.whatsapp.replace(/[^\d]/g, '')}`)
const mailHref = computed(() => `mailto:${contact.value.email}`)

const items = computed<AccordionEntry[]>(() => props.faq.map((entry) => ({ id: entry.id, title: entry.question, body: entry.answer })))

let timer: number | undefined

onMounted(() => {
    timer = window.setInterval(() => {
        router.reload({ only: ['serviceStatus'], showProgress: false, async: true })
    }, REFRESH_MS)
})

onBeforeUnmount(() => {
    if (timer !== undefined) {
        window.clearInterval(timer)
    }
})
</script>

<template>
    <section id="h11" class="service" data-section="H11" aria-labelledby="h11-heading">
        <div class="container grid service__grid">
            <div class="service__contact">
                <h2 id="h11-heading" class="h2 service__title">Fragen zur Passform? Wir schauen mit dir drauf.</h2>

                <p class="small status" :class="status.open ? 'status--open' : 'status--closed'">{{ status.label }}</p>

                <ul class="contacts">
                    <li class="contacts__row">
                        <Icon name="phone" :size="20" />
                        <a :href="telHref" class="num contacts__link">{{ contact.phone }}</a>
                    </li>
                    <li class="contacts__row">
                        <!-- The official WhatsApp mark is never redrawn; until the brand kit is in, the slot keeps the rows aligned. -->
                        <span class="contacts__slot" aria-hidden="true" />
                        <a :href="waHref" class="num contacts__link" rel="noopener" target="_blank">WhatsApp: {{ contact.whatsapp }}</a>
                    </li>
                    <li class="contacts__row">
                        <Icon name="mail" :size="20" />
                        <a :href="mailHref" class="contacts__link">{{ contact.email }}</a>
                    </li>
                    <li class="contacts__row">
                        <Icon name="clock" :size="20" />
                        <span class="num">{{ contact.hours }}</span>
                    </li>
                </ul>
            </div>

            <div class="service__faq">
                <Accordion v-if="items.length > 0" :items="items" :level="3" />
                <p v-else class="body muted">Die häufigsten Fragen beantworten wir gerade neu.</p>

                <Link href="/faq" class="link service__all" prefetch>Alle Fragen ansehen</Link>
            </div>
        </div>
    </section>
</template>

<style scoped>
.service__grid {
    row-gap: var(--sp-40);
}

.service__contact,
.service__faq {
    grid-column: 1 / -1;
    min-width: 0;
}

.service__title {
    max-width: 20ch;
}

/* The status: a word and a dot, coloured by the one fact it states. */
.status {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    margin-top: var(--sp-24);
    font-weight: 500;
}

.status::before {
    content: '';
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: var(--r-round);
    background: currentColor;
}

.status--open {
    color: var(--c-ok);
}

.status--closed {
    color: var(--c-ink-3);
}

.contacts {
    margin-top: var(--sp-16);
}

.contacts__row {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    gap: var(--sp-12);
    align-items: center;
    min-height: 44px;
    color: var(--c-ink-2);
}

.contacts__slot {
    display: block;
    width: 20px;
    height: 20px;
}

.contacts__link {
    color: var(--c-blue);
    overflow-wrap: anywhere;
}

@media (hover: hover) and (pointer: fine) {
    .contacts__link:hover {
        color: var(--c-blue-hover);
    }
}

.service__all {
    margin-top: var(--sp-24);
}

@media (min-width: 1024px) {
    .service__contact {
        grid-column: 1 / span 4;
    }

    .service__faq {
        grid-column: 6 / span 7;
    }
}
</style>
