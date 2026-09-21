<script setup lang="ts">
/** The error page on a phone: the same three ways forward, stacked full width. */

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
            body: 'Der Fehler ist bei uns gelandet und wird angesehen.',
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
        body: 'Such dein Fahrzeug – wir zeigen dir anschließend nur Felgen, die dafür freigegeben sind.',
    }
})
</script>

<template>
    <Head :title="String(status)" />

    <section class="section">
        <div class="wrap merr">
            <div class="merr__art">
                <Wheel :spokes="10" finish="graphite" :size="200" />
            </div>

            <p class="data merr__code">{{ status }}</p>
            <h1 class="t-h2">{{ copy.title }}</h1>
            <p class="t-body">{{ copy.body }}</p>

            <div class="stack merr__actions">
                <Link href="/felgen-suchen" class="btn btn--primary btn--block">Fahrzeug wählen</Link>
                <Link href="/felgen" class="btn btn--secondary btn--block">Alle Felgen ansehen</Link>
            </div>
        </div>
    </section>
</template>

<style scoped>
.merr {
    display: grid;
    justify-items: center;
    text-align: center;
    gap: var(--s2);
}

.merr__art {
    opacity: 0.5;
    margin-bottom: var(--s3);
}

.merr__code {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.2em;
    color: var(--ink3);
}

.merr__actions {
    width: 100%;
    margin-top: var(--s4);
}
</style>
