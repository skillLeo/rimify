<script setup lang="ts">
/**
 * The help line under the hero's selector (the client's #3, D-107): the one thing the utility strip above the
 * header said that nothing else on the page said — where to ask, and when someone reads it. The strip's two
 * promises, shipping from Germany and a Gutachten with every Felge, stand in the promise row right under the hero in
 * the client's own words, so they are not said twice.
 *
 * Help goes to the contact form, never to a mail program (the client's #26); a phone number stands only where the
 * client has given one. No reply time is promised (ServiceStatus).
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Ui/Icon.vue'
import { useShared } from '../../composables/useShared'

const shared = useShared()
const contact = computed(() => shared.value.contact)
const telHref = computed(() => `tel:${(contact.value.phoneIntl ?? contact.value.phone ?? '').replace(/\s/g, '')}`)
</script>

<template>
    <p class="hero-help">
        <Icon name="mail" :size="20" class="hero-help__icon" />
        <span>
            Fragen zu deinem Fahrzeug?
            <a v-if="contact.phone" :href="telHref" class="hero-help__link num">{{ contact.phone }}</a>
            <Link v-else href="/kontakt" class="hero-help__link">Schreib uns</Link>
            {{ ' ' }}<span class="hero-help__hours">· {{ contact.hours }}</span>
        </span>
    </p>
</template>

<style scoped>
.hero-help {
    display: flex;
    /* On two lines the mark stands with the first, not between them. */
    align-items: flex-start;
    gap: var(--sp-8);
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

/* The brand's blue on the mark (#33). */
.hero-help__icon {
    flex: none;
    color: var(--c-blue);
}

.hero-help__link {
    color: var(--c-blue);
    font-weight: 500;
    white-space: nowrap;
    text-decoration: underline;
    text-underline-offset: 3px;
}

@media (hover: hover) and (pointer: fine) {
    .hero-help__link:hover {
        color: var(--c-blue-hover);
    }
}

.hero-help__hours {
    white-space: nowrap;
}
</style>
