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
import ConditionGroups from '../../Components/Fitment/ConditionGroups.vue'
import { PAPERS_EXEMPT, entryBySize, entryLine } from '../../fitment/papers'
import { mailtoHref } from '../../lib/mailto'
import { formatNumber } from '../../lib/num'
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
        subject: 'Anfrage zu meinem RIMIFY-Check',
        // The token, named for what it is: the page's address would need the origin, which the
        // server-rendered first frame does not have.
        body: `Meine Ergebnis-Nummer: ${props.token}\n\n`,
    })
)

function print(): void {
    window.print()
}

const copy = computed<Copy>(() => {
    // Every Auflage a Hinweis (#23, D-104): „Freigegeben“, as the product page says it — the notes stay readable there.
    if (props.result?.status === 'CONDITIONAL' && props.result.notesOnly === true) {
        return {
            tag: 'tag--ok',
            label: 'Freigegeben',
            title: 'Diese Felge ist für das Fahrzeug freigegeben.',
            body: 'Das Gutachten deckt die geprüfte Kombination ab und nennt dazu nur Hinweise – nichts, was du tun musst. Jeder Hinweis steht im Wortlaut auf der Produktseite der Felge.',
            primary: { href: '/felgen', label: 'Passende Felgen anzeigen' },
        }
    }

    switch (props.result?.status) {
        case 'PERMITTED':
            return {
                tag: 'tag--ok',
                label: 'Freigegeben',
                title: 'Diese Felge ist für das Fahrzeug freigegeben.',
                body: 'Das Gutachten deckt die geprüfte Kombination ab. Gutachten-Nummer und Eintragungspflicht stehen auf der Produktseite der Felge.',
                primary: { href: '/felgen', label: 'Passende Felgen anzeigen' },
            }
        case 'CONDITIONAL':
            return {
                tag: 'tag--warn',
                label: 'Freigegeben mit Auflagen',
                title: 'Diese Felge ist mit Auflagen freigegeben.',
                body: 'Das Gutachten lässt die Kombination nur unter Bedingungen zu. Jede Auflage steht im Wortlaut auf der Produktseite der Felge – lies sie vor dem Kauf.',
                primary: { href: '/felgen', label: 'Passende Felgen anzeigen' },
            }
        case 'NOT_PERMITTED':
            return {
                tag: 'tag--danger',
                label: 'Nicht freigegeben',
                title: 'Diese Felge ist für das Fahrzeug nicht freigegeben.',
                body: 'Das Gutachten lässt diese Kombination für das Fahrzeug nicht zu. Die Liste zeigt dir Felgen, deren Gutachten dein Fahrzeug abdeckt.',
                primary: { href: '/felgen', label: 'Passende Felgen anzeigen' },
            }
        case 'UNKNOWN':
            return {
                tag: 'tag--unknown',
                label: 'Keine Angabe',
                title: 'Für diese Kombination können wir die Freigabe nicht bestätigen.',
                // The wheel approved and only the tyres open (R-03 split): never „kein Gutachten“ then.
                body: props.result?.wheelLabel
                    ? 'Die Felge ist freigegeben, die Reifen dazu können wir aber nicht bestätigen. Das heißt nicht, dass sie unzulässig sind – nur, dass wir es nicht belegen können.'
                    : 'Für diese Kombination liegt uns kein Gutachten vor. Das heißt nicht, dass die Felge unzulässig ist – nur, dass wir es nicht belegen können.',
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

            <!-- The answer as it was issued, every sentence of it: nothing is folded on a page meant to be printed. -->
            <div v-if="result" class="res__detail">
                <dl class="res__facts">
                    <div v-if="result.vehicle">
                        <dt>Fahrzeug</dt>
                        <dd>{{ result.vehicle }}</dd>
                    </div>
                    <div v-if="result.wheel">
                        <dt>Felge</dt>
                        <dd>{{ result.wheel }}<template v-if="result.wheelLabel"> – {{ result.wheelLabel }}</template></dd>
                    </div>
                    <div v-if="result.tyre">
                        <dt>Reifen</dt>
                        <dd>{{ result.tyre.statusLabel }}</dd>
                    </div>
                    <div v-if="result.document">
                        <dt>Gutachten</dt>
                        <dd>
                            {{ result.document.label }}, Fassung {{ result.document.revision }}<template v-if="result.document.issuer"> ({{ result.document.issuer }})</template><template v-if="result.document.page">, Seite {{ result.document.page }}</template>
                        </dd>
                    </div>
                    <div v-if="result.papers">
                        <dt>Deine Angaben</dt>
                        <dd>8.1 {{ formatNumber(result.papers.axleFrontKg) }}&nbsp;kg · 8.2 {{ formatNumber(result.papers.axleRearKg) }}&nbsp;kg · T {{ result.papers.topSpeedKmh }}&nbsp;km/h</dd>
                    </div>
                    <!-- What the answer assumed that our vehicle data does not hold: printed with where it came from,
                         so the workshop or the Prüfer can catch a wrong one (G-02). -->
                    <div v-for="line in result.build ?? []" :key="line.fact">
                        <dt>{{ line.fact }}</dt>
                        <dd>{{ line.value }} – {{ line.source }}</dd>
                    </div>
                </dl>

                <p v-if="result.reason && result.reason !== result.tyre?.summary" class="res__reason">{{ result.reason }}</p>

                <section v-if="result.tyre" class="res__block" aria-labelledby="res-tyre-h">
                    <h2 id="res-tyre-h" class="h4">Reifen</h2>
                    <p v-if="result.tyre.summary" class="res__summary">{{ result.tyre.summary }}</p>
                    <p v-if="result.tyre.basis" class="res__note">{{ result.tyre.basis }}</p>
                    <p v-if="result.tyre.stricterByPapers" class="res__note">Deine Angaben aus den Fahrzeugpapieren haben die Antwort strenger gemacht.</p>
                    <ol v-if="result.tyre.lines.length" class="res__sum" aria-label="So haben wir gerechnet">
                        <li v-for="line in result.tyre.lines" :key="line">{{ line }}</li>
                    </ol>
                </section>

                <section v-if="result.requiresEntry || result.papersExempt || result.conditions.length" class="res__block" aria-labelledby="res-cond-h">
                    <h2 id="res-cond-h" class="h4">Auflagen</h2>
                    <!-- One size needs the Abnahme, another does not: the line names them (fitment/papers.ts). -->
                    <p v-if="entryBySize(result.conditionGroups?.sizes, result.papersExempt === true)" class="res__note">{{ entryBySize(result.conditionGroups?.sizes, result.papersExempt === true) }}</p>
                    <p v-else-if="result.requiresEntry" class="res__note">{{ entryLine(true, result.papersExempt === true) }}<template v-if="result.entryNote"> {{ result.entryNote }}</template></p>
                    <p v-if="result.papersExempt" class="res__note">{{ PAPERS_EXEMPT }}</p>
                    <!-- Each tyre size's Auflagen with that size, the combination's once — printed as the shop shows them. -->
                    <ConditionGroups v-if="result.conditionGroups && result.conditions.length" class="res__groups" :groups="result.conditionGroups" />
                    <ul v-else-if="result.conditions.length" class="res__sum">
                        <li v-for="condition in result.conditions" :key="condition">{{ condition }}</li>
                    </ul>
                </section>

                <p v-if="result.front.length" class="res__note">
                    Zulässige Reifengrößen: {{ result.front.join(' · ') }}<template v-if="result.rear.length && result.rear.join() !== result.front.join()"> · hinten {{ result.rear.join(' · ') }}</template>
                </p>

                <p v-if="result.documentToday" class="notice notice--warn res__today">{{ result.documentToday }}</p>
            </div>

            <div class="res__actions">
                <a v-if="copy.primary.mail" :href="copy.primary.href" class="btn btn--primary">{{ copy.primary.label }}</a>
                <Link v-else :href="copy.primary.href" class="btn btn--primary">{{ copy.primary.label }}</Link>
                <button v-if="result !== null" class="btn btn--secondary" type="button" @click="print">Drucken</button>
                <Link v-if="result !== null" href="/rimify-check" class="btn btn--secondary">
                    Neue Prüfung starten
                </Link>
            </div>

            <dl class="res__meta">
                <div>
                    <dt class="micro">Ergebnis-Nummer</dt>
                    <dd class="data">{{ token }}</dd>
                </div>
                <div v-if="result?.issuedAt">
                    <dt class="micro">Geprüft am</dt>
                    <dd class="data">{{ result.issuedAt }}</dd>
                </div>
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

.res__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-16) var(--sp-40);
}

.res__detail {
    display: grid;
    gap: var(--sp-24);
    max-width: 72ch;
    margin-top: var(--sp-24);
}

.res__facts {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
}

.res__facts > div {
    display: grid;
    grid-template-columns: minmax(0, 10rem) minmax(0, 1fr);
    gap: var(--sp-16);
}

.res__facts dt {
    color: var(--c-ink-2);
}

.res__facts dd {
    margin: 0;
    overflow-wrap: anywhere;
}

.res__block {
    display: grid;
    gap: var(--sp-8);
}

.res__block h2 {
    margin: 0;
}

.res__summary {
    margin: 0;
    font-weight: 600;
}

.res__reason,
.res__note {
    margin: 0;
    color: var(--c-ink-2);
}

.res__groups {
    max-width: 65ch;
}

.res__sum {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding-left: var(--sp-20);
}

.res__today {
    margin: 0;
}

@media (max-width: 639px) {
    .res__facts > div {
        grid-template-columns: minmax(0, 1fr);
        gap: 0;
    }
}

/* On paper: the answer and the number, nothing to click and none of the shop around it. */
@media print {
    :global(.utility),
    :global(.site-header),
    :global(header),
    :global(.footer),
    :global(.tray),
    :global(.skip-link),
    .res__actions {
        display: none !important;
    }

    .res__detail {
        max-width: none;
    }
}

@media (min-width: 640px) {
    .res__actions {
        display: flex;
        flex-wrap: wrap;
    }
}
</style>
