<script setup lang="ts">
/**
 * Every failure the shop has a designed answer for, as one page keyed by status.
 *
 * Rendered by App\Services\Storefront\ErrorPage inside the storefront frame, so the header, the
 * basket and the chosen vehicle all survive a dead link. A visitor who followed a broken link to a
 * wheel still wants a wheel, and a page that only apologises wastes the visit.
 *
 * The shape is the same for every status, because the questions are the same: what happened, what
 * that means for you, and how you get on from here. The third part is not optional — a failure
 * always offers THREE ways forward (R-09), never a cleared form and never a lone "back".
 *
 * On what these sentences may claim: a 500 really is written to the log, and nothing and nobody is
 * notified of it — there is no error reporting service in this application — so the page asks for a
 * message instead of promising that somebody is already looking. The 419 says the session has been
 * renewed because ErrorPage writes a fresh XSRF-TOKEN beside the response; without that the second
 * attempt would fail exactly like the first, and the sentence would be a lie.
 *
 * A release window is NOT rendered here: it is resources/views/errors/503.blade.php, which needs
 * neither this bundle nor the database. One page for every width.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../../Components/Art/Icon.vue'
import Wheel from '../../Components/Art/Wheel.vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import type { IconName } from '../../art'
import { useShared } from '../../composables/useShared'
import { mailtoHref } from '../../lib/mailto'
import type { ContactProp, VehicleProp } from '../../types/rimify'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        status?: number
        /** The device split, decided on the server (R-08); the body class is its only consumer. */
        isMobile?: boolean
        /** Whole seconds the server itself named. Null wherever it named none. */
        retryAfter?: number | null
        /** Never printed: it travels only in the prepared e-mail, so nothing from the URL is reflected. */
        failedPath?: string | null
    }>(),
    { status: 404, isMobile: false, retryAfter: null, failedPath: null }
)

type Tone = 'primary' | 'secondary' | 'ghost'

interface Route {
    key: string
    label: string
    href: string
    tone: Tone
    /** A full page request rather than an Inertia visit: the reload, and the mail program. */
    plain?: boolean
}

interface View {
    icon: IconName
    title: string
    lead: string
    detail: string | null
    routes: [Route, Route, Route]
}

const shared = useShared()
const vehicle = computed<VehicleProp | null>(() => shared.value.vehicle ?? null)
const contact = computed<ContactProp | null>(() => (shared.value.contact as ContactProp | undefined) ?? null)

/*
 * The one channel the shop has confirmed (ACCURACY D5). The address is the shared `contact` prop
 * and never a literal; were it ever missing, this route still leads somewhere — to the Kontakt
 * page — because the rule is three ways forward, not two and a gap.
 */
const mailHref = computed<string>(() => {
    const details = contact.value

    if (details === null) {
        return '/kontakt'
    }

    return mailtoHref(details.email, {
        subject: `RIMIFY – Fehler ${props.status}`,
        body: `Fehler: ${props.status}\nSeite: ${props.failedPath ?? ''}\n\nWas ich tun wollte:\n\n`,
    })
})

/** Where the vehicle already chosen leads, and where its absence leads instead. */
const felgen = (tone: Tone): Route =>
    vehicle.value !== null
        ? { key: 'felgen', label: 'Passende Felgen anzeigen', href: '/felgen', tone }
        : { key: 'felgen', label: 'Fahrzeug wählen', href: '/felgen-suchen', tone }

const home = (tone: Tone): Route => ({ key: 'home', label: 'Zur Startseite', href: '/', tone })
const faq = (tone: Tone): Route => ({ key: 'faq', label: 'Häufige Fragen lesen', href: '/faq', tone })
const basket = (tone: Tone): Route => ({ key: 'basket', label: 'Zum Warenkorb', href: '/warenkorb', tone })

const signIn = (tone: Tone): Route => ({
    key: 'anmelden',
    label: 'Mit einem anderen Konto anmelden',
    href: '/admin/anmelden',
    tone,
})

/* An empty href is the current document: "try this again" with no JavaScript and no guesswork. */
const reload = (tone: Tone): Route => ({ key: 'reload', label: 'Diese Seite neu laden', href: '', tone, plain: true })

const ask = (tone: Tone): Route => ({
    key: 'kontakt',
    label: contact.value === null ? 'Zur Kontaktseite' : 'Per E-Mail nachfragen',
    href: mailHref.value,
    tone,
    plain: contact.value !== null,
})

/**
 * Only ever the figure the server named, phrased as a wait and never as a promise.
 *
 * Declined, because the commonest wait of all is the one the throttler names: `throttle:60,1` sends
 * `Retry-After: 60`, and "In etwa 1 Minuten kannst du es noch einmal versuchen" is the sentence a
 * German customer would then have read.
 */
const wait = computed<string | null>(() => {
    const seconds = props.retryAfter

    if (typeof seconds !== 'number' || seconds <= 0) {
        return null
    }

    if (seconds < 60) {
        return seconds === 1 ? 'einer Sekunde' : `${seconds} Sekunden`
    }

    const minutes = Math.ceil(seconds / 60)

    return minutes === 1 ? 'einer Minute' : `${minutes} Minuten`
})

const view = computed<View>(() => {
    if (props.status === 403) {
        return {
            icon: 'lock',
            title: 'Dafür fehlt dir die Berechtigung.',
            lead: 'Am Link liegt es nicht: Die Seite gibt es, dein Konto darf sie nur nicht öffnen.',
            detail: 'Wenn du in diesem Bereich arbeiten sollst, lass dein Konto dafür freischalten.',
            routes: [signIn('primary'), home('secondary'), ask('ghost')],
        }
    }

    if (props.status === 419) {
        return {
            icon: 'clock',
            title: 'Deine Sitzung ist abgelaufen.',
            lead: 'Das Formular stand zu lange offen, deshalb hat der Server es abgelehnt – so kann niemand sonst in deinem Namen etwas abschicken.',
            detail: 'Gespeichert wurde nichts, bestellt hast du nichts. Wir haben deine Sitzung gerade erneuert: Geh im Browser einen Schritt zurück und schick das Formular noch einmal ab.',
            routes: [basket('primary'), felgen('secondary'), ask('ghost')],
        }
    }

    if (props.status === 429) {
        return {
            icon: 'clock',
            title: 'Zu viele Anfragen in kurzer Zeit.',
            lead: 'Wir bremsen deine Anfragen gerade ab, damit die Fahrzeugsuche für alle schnell bleibt.',
            detail: wait.value === null ? 'Warte einen Moment und versuche es dann noch einmal.' : null,
            routes: [home('primary'), reload('secondary'), ask('ghost')],
        }
    }

    if (props.status === 404) {
        return {
            icon: 'search',
            title: 'Diese Seite haben wir nicht gefunden.',
            lead: 'Der Link führt ins Leere – vielleicht wurde die Seite verschoben, oder diese Felge steht nicht mehr im Sortiment.',
            detail: 'RIMIFY zeigt ausschließlich Felgen, für die ein gültiges Gutachten vorliegt. Sag uns dein Fahrzeug, dann zeigen wir dir genau diese.',
            routes: [felgen('primary'), home('secondary'), faq('ghost')],
        }
    }

    if (props.status >= 500) {
        return {
            icon: 'warning',
            title: 'Da ist etwas schiefgelaufen.',
            lead: 'Nicht bei dir, sondern bei uns: Diese Seite konnte der Server nicht fertig ausliefern.',
            detail: 'Der Fehler steht in unserem Protokoll. Benachrichtigt wird davon aber niemand automatisch – wenn du nicht weiterkommst, schreib uns kurz, dann sehen wir nach.',
            routes: [reload('primary'), felgen('secondary'), ask('ghost')],
        }
    }

    /*
     * A status this page was never designed for. It says so plainly rather than borrowing a
     * reassuring sentence from a failure it is not: not knowing is an allowed answer here, and a
     * confident wrong one never is (CLAUDE.md §2).
     */
    return {
        icon: 'info',
        title: 'Diese Seite können wir gerade nicht anzeigen.',
        lead: 'Der Server hat den Aufruf mit dem Code oben abgelehnt. Was genau dahintersteckt, wissen wir an dieser Stelle nicht – und raten wollen wir lieber nicht.',
        detail: 'Sag uns kurz, was du vorhattest, dann sehen wir nach.',
        routes: [home('primary'), felgen('secondary'), ask('ghost')],
    }
})
</script>

<template>
    <Head :title="view.title" />

    <section class="section err">
        <div class="wrap err__wrap">
            <div class="err__text">
                <p class="micro err__code">
                    <Icon :name="view.icon" :size="20" />
                    <span>Fehler <span class="tabular" translate="no">{{ status }}</span></span>
                </p>

                <h1 class="t-h1 err__title">{{ view.title }}</h1>
                <p class="err__lead">{{ view.lead }}</p>

                <p v-if="wait" class="t-body err__detail">
                    In etwa <span translate="no">{{ wait }}</span> kannst du es noch einmal versuchen.
                </p>
                <p v-if="view.detail" class="t-body err__detail">{{ view.detail }}</p>

                <p v-if="vehicle" class="t-body err__detail">
                    Dein Fahrzeug bleibt gewählt:
                    <span translate="no">{{ vehicle.label }}</span>.
                </p>

                <!-- Three ways on, every time (R-09). -->
                <nav class="err__routes" aria-label="Wie es weitergeht">
                    <template v-for="route in view.routes" :key="route.key">
                        <a v-if="route.plain" class="btn" :class="`btn--${route.tone}`" :href="route.href">
                            {{ route.label }}
                        </a>
                        <Link v-else class="btn" :class="`btn--${route.tone}`" :href="route.href">
                            {{ route.label }}
                        </Link>
                    </template>
                </nav>

                <p v-if="contact" class="t-small err__note">
                    Du erreichst uns unter
                    <a class="err__mail" :href="mailHref" translate="no">{{ contact.email }}</a>,
                    <span translate="no">{{ contact.hours }}</span>.
                </p>
            </div>

            <!-- The shop's own drawn wheel, quietly. From 900px up, where it costs the copy nothing. -->
            <div class="err__art" aria-hidden="true">
                <Wheel :spokes="7" finish="graphite" :size="240" />
            </div>
        </div>
    </section>
</template>

<style scoped>
/* A short page, so the space above the footer is taken by the section itself, not by a slab. */
.err {
    padding-block: var(--sp-64) var(--sp-80);
}

.err__wrap {
    display: grid;
    gap: var(--sp-40);
    align-items: start;
}

.err__text {
    min-width: 0;
}

.err__code {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    color: var(--c-ink-3);
}

.err__title {
    margin-top: var(--sp-12);
}

.err__lead {
    margin-top: var(--sp-16);
    max-width: 54ch;
    font-size: var(--fs-body-l);
    line-height: var(--lh-body-l);
    color: var(--c-ink-2);
}

.err__detail {
    margin-top: var(--sp-12);
    max-width: 54ch;
    color: var(--c-ink-2);
}

.err__routes {
    display: grid;
    gap: var(--sp-12);
    margin-top: var(--sp-32);
}

.err__note {
    margin-top: var(--sp-24);
    max-width: 54ch;
    color: var(--c-ink-3);
}

.err__mail {
    color: var(--c-blue);
}

.err__art {
    display: none;
    place-items: center;
    padding: var(--sp-24);
    border-radius: var(--r-tile);
    background: var(--c-band);
}

/* From 560px the three routes sit in a row and wrap rather than push the page sideways; below
   it they are full-width taps. */
@media (min-width: 560px) {
    .err__routes {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
    }
}

@media (min-width: 900px) {
    .err__wrap {
        grid-template-columns: minmax(0, 1fr) 288px;
    }

    .err__art {
        display: grid;
    }
}
</style>
