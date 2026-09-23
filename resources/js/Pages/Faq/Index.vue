<script setup lang="ts">
/**
 * The FAQ. Groups and answers come from `faq_entries`, so an editor adds an answer without a
 * deployment — and the answers are the legally reviewed copy, rendered as stored.
 *
 * A search field above the groups filters questions and answers as the customer types. When
 * nothing matches, the empty state names the term that was searched and offers to clear it,
 * rather than showing an empty page.
 *
 * The help card sits beside the list from 1200px and after it below that.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'
import type { FaqProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<FaqProps>()

const open = ref<number | null>(null)
const query = ref('')

const visibleGroups = computed(() => {
    const needle = query.value.trim().toLowerCase()

    if (needle === '') {
        return props.groups
    }

    return props.groups
        .map((group) => ({
            ...group,
            entries: group.entries.filter(
                (entry) =>
                    entry.question.toLowerCase().includes(needle) ||
                    entry.answer.toLowerCase().includes(needle)
            ),
        }))
        .filter((group) => group.entries.length > 0)
})

function toggle(id: number): void {
    open.value = open.value === id ? null : id
}

/* Phone and WhatsApp only when the client has given them; without a phone the e-mail carries the hours. */
const phone = computed(() => props.contact.phoneIntl ?? props.contact.phone)
const telHref = computed(() => `tel:${(phone.value ?? '').replace(/\s/g, '')}`)
const waHref = computed(() => `https://wa.me/${(props.contact.whatsapp ?? '').replace(/[^0-9]/g, '')}`)
</script>

<template>
    <Head title="Meistgestellte Fragen" />

    <section class="section-dense">
        <div class="wrap faq">
            <div class="faq__main">
                <h1 class="t-h1">Meistgestellte Fragen</h1>

                <form class="faq__search" role="search" @submit.prevent>
                    <label class="visually-hidden" for="faq-q">Fragen durchsuchen</label>
                    <Icon name="search" :size="20" />
                    <input
                        id="faq-q"
                        v-model="query"
                        class="field faq__input"
                        type="search"
                        placeholder="Suchen"
                        autocomplete="off"
                    />
                </form>

                <div v-for="group in visibleGroups" :key="group.key" class="faq__group">
                    <h2 class="micro faq__group-title">{{ group.key }}</h2>

                    <div v-for="entry in group.entries" :key="entry.id" class="acc">
                        <button
                            class="acc__head"
                            type="button"
                            :aria-expanded="open === entry.id"
                            :aria-controls="`faq-a-${entry.id}`"
                            @click="toggle(entry.id)"
                        >
                            {{ entry.question }}
                            <span class="faq__chev" :class="{ 'faq__chev--open': open === entry.id }">
                                <Icon name="chevron-down" :size="20" />
                            </span>
                        </button>
                        <div v-show="open === entry.id" :id="`faq-a-${entry.id}`" class="acc__body t-body">
                            {{ entry.answer }}
                        </div>
                    </div>
                </div>

                <!-- Nothing matched: name the term, offer the way back. -->
                <div v-if="visibleGroups.length === 0" class="state faq__empty">
                    <Icon name="search" :size="24" />
                    <p class="state__title">Keine Antwort zu „{{ query.trim() }}“ gefunden.</p>
                    <p class="t-body">Versuche einen anderen Begriff, etwa „Eintragung“ oder „HSN“.</p>
                    <button class="btn btn--primary" type="button" @click="query = ''">Suche löschen</button>
                </div>
            </div>

            <aside class="card faq__help" aria-labelledby="faq-help-title">
                <h2 id="faq-help-title" class="t-h3">Nicht gefunden, was du suchst?</h2>
                <!-- No reply-time promise: the client gave hours, and the hours are printed below. -->
                <p class="t-body faq__help-sub">Schreib uns eine E-Mail – wir helfen dir gern weiter.</p>

                <ul class="faq__ways">
                    <li v-if="phone">
                        <a class="faq__way" :href="telHref">
                            <Icon name="phone" :size="20" />
                            <span>
                                <span class="faq__way-value tabular">{{ phone }}</span>
                                <span class="faq__way-note">{{ contact.hours }}</span>
                            </span>
                        </a>
                    </li>
                    <li v-if="contact.whatsapp">
                        <a class="faq__way" :href="waHref" rel="noopener">
                            <Icon name="phone" :size="20" />
                            <span>
                                <span class="faq__way-value tabular">{{ contact.whatsapp }}</span>
                                <span class="faq__way-note">WhatsApp</span>
                            </span>
                        </a>
                    </li>
                    <li>
                        <a class="faq__way" :href="`mailto:${contact.email}`">
                            <Icon name="mail" :size="20" />
                            <span>
                                <span class="faq__way-value">{{ contact.email }}</span>
                                <span class="faq__way-note">{{ phone ? 'E-Mail' : `E-Mail · ${contact.hours}` }}</span>
                            </span>
                        </a>
                    </li>
                </ul>

                <hr class="hr faq__rule" />

                <p class="faq__promo">Kompatibilität sofort prüfen</p>
                <Link href="/rimify-check" class="btn btn--secondary btn--block">RIMIFY-CHECK öffnen</Link>
            </aside>
        </div>
    </section>
</template>

<style scoped>
.faq {
    display: grid;
    gap: var(--space-7);
    align-items: start;
}

.faq__main {
    min-width: 0;
}

.faq__search {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 560px;
    margin-top: var(--space-5);
    color: var(--ink3);
}

.faq__search :deep(svg) {
    position: absolute;
    left: var(--space-3);
    pointer-events: none;
}

.faq__input {
    padding-left: 44px;
}

.faq__group {
    margin-top: var(--space-6);
}

.faq__group-title {
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--line);
}

.faq__chev {
    display: inline-flex;
    flex: none;
    color: var(--ink2);
    transition: transform var(--duration-base) var(--ease-in-out);
}

.faq__chev--open {
    transform: rotate(180deg);
}

.faq__empty {
    padding-block: var(--space-7);
}

.faq__help-sub {
    margin-top: var(--space-2);
    color: var(--ink2);
}

.faq__ways {
    display: grid;
    margin: var(--space-4) 0 0;
    padding: 0;
    list-style: none;
}

.faq__way {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 56px;
    padding-block: var(--space-2);
    border-bottom: 1px solid var(--line-s);
    color: var(--ink);
    text-decoration: none;
}

.faq__way :deep(svg) {
    flex: none;
    color: var(--ink2);
}

.faq__way-value {
    display: block;
    font-weight: 700;
    color: var(--blue);
}

.faq__way-note {
    display: block;
    font-size: var(--text-small);
    color: var(--ink2);
}

@media (hover: hover) and (pointer: fine) {
    .faq__way:hover .faq__way-value {
        color: var(--blue-h);
        text-decoration: underline;
    }
}

.faq__rule {
    margin: var(--space-5) 0 var(--space-4);
}

.faq__promo {
    margin-bottom: var(--space-3);
    font-weight: 700;
}

@media (min-width: 1200px) {
    .faq {
        grid-template-columns: minmax(0, 1fr) 360px;
    }

    .faq__help {
        position: sticky;
        top: calc(var(--header-h) + var(--space-5));
    }
}
</style>
