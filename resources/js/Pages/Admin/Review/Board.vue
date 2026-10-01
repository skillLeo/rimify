<script setup lang="ts">
/**
 * Review › Stand der Seiten (the review release §3): every screen of the admin in the order to look at
 * them, each with its state — fertig, in Arbeit, noch nicht gebaut — a link where there is something
 * to open, one line on what it does, and how many points of the review are still open on it.
 */

import { Link } from '@inertiajs/vue3'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

defineProps<{
    areas: { key: string; label: string; screens: { label: string; href: string | null; state: string; line: string; open: number; locked?: boolean }[] }[]
    counts: { open: number; all: number }
}>()

/** Only the exception is tagged, and neutral: work still to do is no warning. */
function stateTag(state: string): string | null {
    return state === 'fertig' ? null : 'adm-tag adm-tag--neutral'
}

const STATE_LABEL: Record<string, string> = { fertig: 'Fertig', 'in Arbeit': 'In Arbeit', 'noch nicht gebaut': 'Noch nicht gebaut' }

function stateLabel(state: string): string {
    return STATE_LABEL[state] ?? state
}
</script>

<template>
    <AdminPage title="Stand der Seiten" :context="counts.open === 1 ? '1 offene Rückmeldung' : `${decimal(counts.open, 0)} offene Rückmeldungen`">
        <p class="adm-note rb-intro">
            Fertige Seiten kannst du prüfen. Seiten, die noch fehlen, sind als „Noch nicht gebaut“ markiert. Zu jeder Seite kannst du mit „Rückmeldung
            geben“ etwas sagen – in der Leiste links, am Telefon unter „Mehr“. Ein Satz genügt, ein Bildschirmfoto wird automatisch
            mitgeschickt.
        </p>

        <section v-for="area in areas" :key="area.key" class="adm-section" :aria-labelledby="`rb-${area.key}`">
            <div class="adm-section__head">
                <h2 :id="`rb-${area.key}`" class="adm-section__title">{{ area.label }}</h2>
            </div>
            <ul class="rb-list">
                <li v-for="screen in area.screens" :key="screen.label" class="rb-row">
                    <span class="rb-state">
                        <span v-if="stateTag(screen.state)" :class="stateTag(screen.state)">{{ stateLabel(screen.state) }}</span>
                        <template v-else>{{ stateLabel(screen.state) }}</template>
                    </span>
                    <span class="rb-text">
                        <Link v-if="screen.href" :href="screen.href" class="rb-label">{{ screen.label }}</Link>
                        <span v-else class="rb-label rb-label--plain">{{ screen.label }}</span>
                        <span class="rb-line">{{ screen.line }}<template v-if="screen.locked"> Mit deiner Rolle nicht zu öffnen.</template></span>
                    </span>
                    <Link v-if="screen.open" :href="`/admin/review/rueckmeldungen?seite=${encodeURIComponent(screen.label)}`" class="rb-open">
                        {{ screen.open === 1 ? '1 offen' : `${decimal(screen.open, 0)} offen` }}
                    </Link>
                    <span v-else class="rb-open rb-open--none" aria-hidden="true" />
                </li>
            </ul>
        </section>
    </AdminPage>
</template>

<style scoped>
.rb-intro {
    margin-bottom: var(--sp-24);
}

.rb-list {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.rb-row {
    display: grid;
    grid-template-columns: 17ch minmax(0, 1fr) 10ch;
    align-items: baseline;
    gap: var(--sp-16);
    padding-block: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.rb-state {
    color: var(--c-ink-2);
}

.rb-text {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.rb-label {
    color: var(--c-ink);
    font-weight: 500;
    overflow-wrap: anywhere;
}

.rb-label--plain {
    color: var(--c-ink-2);
}

.rb-line {
    max-width: 72ch;
    color: var(--c-ink-2);
}

.rb-open {
    justify-self: end;
    font-variant-numeric: tabular-nums;
}

@media (max-width: 767px) {
    .rb-row {
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--sp-8) var(--sp-12);
    }

    .rb-state {
        grid-column: 1 / -1;
    }

    .rb-open--none {
        display: none;
    }
}
</style>
