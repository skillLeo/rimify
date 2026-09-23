<script setup lang="ts">
/**
 * The shareable check result.
 *
 * Addressed by a token rather than a query string, because the point of this page is that it can
 * be sent to a workshop, printed, and still say the same thing next week. It opens cold, from a
 * link someone else sent, so the H1 states the answer in words rather than leaving it to a badge.
 *
 * Four states plus an expired link. `UNKNOWN` is a neutral answer and never dressed as a refusal
 * (R-07): it gets the neutral tag and its own explanation.
 *
 * One page for every width.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import { useShared } from '../../composables/useShared'
import { mailtoHref } from '../../lib/mailto'
import type { CheckErgebnisProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<CheckErgebnisProps>()

const shared = useShared()

interface Copy {
    tag: string | null
    label: string | null
    title: string
    body: string
    /** `mail` opens the customer's mail program; it is a plain link, never an Inertia visit. */
    primary: { href: string; label: string; mail?: true }
}

/*
 * "No document" is a question we can take by e-mail, the shop's one channel (ACCURACY D5): the
 * mail already carries the result number, so nobody has to describe the combination again.
 */
const askHref = computed(() =>
    mailtoHref(shared.value.contact.email, {
        subject: 'Anfrage zu meinem RIMIFY-CHECK',
        // The token, named for what it is: the page's address would need the origin, which the
        // server-rendered first frame does not have.
        body: `Meine Ergebnis-Nummer: ${props.token}\n\n`,
    })
)

const copy = computed<Copy>(() => {
    switch (props.result?.status) {
        case 'PERMITTED':
            return {
                tag: 'tag--ok',
                label: 'Freigegeben',
                title: 'Diese Felge ist für das Fahrzeug freigegeben.',
                body: 'Das Gutachten deckt die geprüfte Kombination ab. Gutachten-Nummer und Eintragungspflicht stehen auf der Produktseite der Felge.',
                primary: { href: '/felgen', label: 'Zur Felge' },
            }
        case 'CONDITIONAL':
            return {
                tag: 'tag--warn',
                label: 'Freigegeben mit Auflagen',
                title: 'Diese Felge ist mit Auflagen freigegeben.',
                body: 'Das Gutachten lässt die Kombination nur unter Bedingungen zu. Jede Auflage steht im Wortlaut auf der Produktseite der Felge – lies sie vor dem Kauf.',
                primary: { href: '/felgen', label: 'Auflagen auf der Produktseite lesen' },
            }
        case 'NOT_PERMITTED':
            return {
                tag: 'tag--danger',
                label: 'Nicht freigegeben',
                title: 'Diese Felge ist für das Fahrzeug nicht freigegeben.',
                body: 'Für dieses Fahrzeug liegt keine Freigabe vor. Die Liste zeigt dir Felgen, deren Gutachten dein Fahrzeug abdeckt.',
                primary: { href: '/felgen', label: 'Zur passenden Felge' },
            }
        case 'UNKNOWN':
            return {
                tag: 'tag--unknown',
                label: 'Keine Angabe',
                title: 'Zu dieser Kombination können wir nichts sagen.',
                body: 'Für diese Kombination liegt uns kein Gutachten vor. Das heißt nicht, dass die Felge unzulässig ist – nur, dass wir es nicht belegen können.',
                primary: { href: askHref.value, label: 'Per E-Mail nachfragen', mail: true },
            }
        default:
            return {
                tag: null,
                label: null,
                title: 'Dieses Ergebnis ist nicht mehr verfügbar.',
                body: 'Ergebnis-Links verfallen, wenn sich die zugrunde liegende Freigabe geändert hat. Führe die Prüfung erneut durch, damit du den aktuellen Stand erhältst.',
                primary: { href: '/rimify-check', label: 'Neue Prüfung starten' },
            }
    }
})
</script>

<template>
    <Head title="Ergebnis" />

    <section class="section">
        <div class="wrap res">
            <h1 class="t-h1">{{ copy.title }}</h1>
            <!-- The badge follows the sentence; it never sits above the H1 as an eyebrow. -->
            <p v-if="copy.tag" class="res__verdict">
                <span class="tag" :class="copy.tag">{{ copy.label }}</span>
            </p>
            <p class="t-body res__body">{{ copy.body }}</p>

            <div class="res__actions">
                <a v-if="copy.primary.mail" :href="copy.primary.href" class="btn btn--primary">{{ copy.primary.label }}</a>
                <Link v-else :href="copy.primary.href" class="btn btn--primary">{{ copy.primary.label }}</Link>
                <Link v-if="result !== null" href="/rimify-check" class="btn btn--secondary">
                    Neue Prüfung starten
                </Link>
            </div>

            <dl class="res__meta">
                <dt class="micro">Ergebnis-Nummer</dt>
                <dd class="data">{{ token }}</dd>
            </dl>
        </div>
    </section>
</template>

<style scoped>
.res__verdict {
    margin-top: var(--space-3);
}

.res__body {
    margin-top: var(--space-3);
    color: var(--ink2);
}

.res__actions {
    display: grid;
    gap: var(--space-3);
    margin-top: var(--space-5);
}

.res__meta {
    margin: var(--space-7) 0 0;
    padding-top: var(--space-4);
    border-top: 1px solid var(--line);
}

.res__meta dd {
    margin: var(--space-1) 0 0;
    overflow-wrap: anywhere;
}

@media (min-width: 640px) {
    .res__actions {
        display: flex;
        flex-wrap: wrap;
    }
}
</style>
