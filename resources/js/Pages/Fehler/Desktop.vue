<script setup lang="ts">
/**
 * The error pages, 404 and 500, as one component keyed by status.
 *
 * A 404 that only apologises wastes the visit. This one names three ways forward, because someone
 * who followed a dead link to a wheel still wants a wheel.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Wheel from '../../Components/Art/Wheel.vue'

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
        title: 'Diese Seite gibt es nicht.',
        body: 'Vielleicht wurde sie verschoben. Such dein Fahrzeug – wir zeigen dir anschließend nur Felgen, die dafür freigegeben sind.',
    }
})
</script>

<template>
    <Head :title="String(status)" />

    <section class="section err">
        <div class="wrap err__inner">
            <div class="err__art">
                <Wheel :spokes="10" finish="graphite" :size="280" />
            </div>

            <p class="data err__code">{{ status }}</p>
            <h1 class="t-h2">{{ copy.title }}</h1>
            <p class="t-body err__body">{{ copy.body }}</p>

            <div class="cluster err__actions">
                <Link href="/felgen-suchen" class="btn btn--primary">Fahrzeug wählen</Link>
                <Link href="/felgen" class="btn btn--secondary">Alle Felgen ansehen</Link>
                <Link href="/kontakt" class="btn btn--quiet">Kontakt</Link>
            </div>
        </div>
    </section>
</template>

<style scoped>
.err__inner {
    display: grid;
    justify-items: center;
    text-align: center;
    gap: var(--s2);
}

.err__art {
    opacity: 0.5;
    margin-bottom: var(--s4);
}

.err__code {
    margin: 0;
    font-size: 13px;
    letter-spacing: 0.2em;
    color: var(--ink3);
}

.err__body {
    max-width: 48ch;
}

.err__actions {
    justify-content: center;
    margin-top: var(--s4);
}
</style>
