<script setup lang="ts">
/**
 * The error pages — 404, 403, 500 and 503 — as one component keyed by status.
 *
 * Rendered by the exception handler in bootstrap/app.php, inside the storefront frame, so the
 * header, the basket and the chosen vehicle all survive a dead link. A 404 that only apologises
 * wastes the visit: this one names the way back to the one task the shop exists for.
 *
 * The status code is a status word, so it is the one place above an H1 where the micro-label is
 * legitimate — it states a fact, it does not decorate the heading.
 *
 * One page for every width.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = withDefaults(defineProps<{ status?: number }>(), { status: 404 })

const copy = computed(() => {
    if (props.status === 503) {
        return {
            title: 'Wir sind gleich zurück.',
            body: 'RIMIFY wird gerade aktualisiert. Das dauert nur wenige Minuten.',
        }
    }

    if (props.status >= 500) {
        return {
            title: 'Da ist etwas schiefgelaufen.',
            body: 'Der Fehler ist bei uns gelandet und wird angesehen. Versuche es in einem Moment noch einmal.',
        }
    }

    if (props.status === 403) {
        return {
            title: 'Dafür fehlt die Berechtigung.',
            body: 'Diese Seite ist nicht für dein Konto freigegeben.',
        }
    }

    return {
        title: 'Diese Seite gibt es nicht mehr.',
        body: 'Vielleicht wurde sie verschoben. Such dein Fahrzeug – wir zeigen dir anschließend nur Felgen, die dafür freigegeben sind.',
    }
})
</script>

<template>
    <Head :title="String(status)" />

    <section class="section err">
        <div class="wrap">
            <p class="micro">Fehler <span class="tabular">{{ status }}</span></p>
            <h1 class="t-h1 err__title">{{ copy.title }}</h1>
            <p class="t-body err__body">{{ copy.body }}</p>

            <div class="err__actions">
                <Link href="/felgen-suchen" class="btn btn--primary">Zurück zur Felgensuche</Link>
                <Link href="/" class="btn btn--secondary">Zur Startseite</Link>
            </div>
        </div>
    </section>
</template>

<style scoped>
/* A short page, so the space above the footer is taken by the section itself, not by a slab. */
.err {
    padding-block: var(--space-8) var(--space-9);
}

.err__title {
    margin-top: var(--space-2);
}

.err__body {
    margin-top: var(--space-3);
    color: var(--ink2);
}

.err__actions {
    display: grid;
    gap: var(--space-3);
    margin-top: var(--space-5);
}

@media (min-width: 640px) {
    .err__actions {
        display: flex;
        flex-wrap: wrap;
    }
}
</style>
