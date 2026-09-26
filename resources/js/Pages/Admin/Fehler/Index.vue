<script setup lang="ts">
/**
 * A failure inside the admin, inside the admin's frame (AdminErrorPage): the rail stays, so the
 * person keeps their way around instead of being dropped onto the shop's error page.
 *
 * 403 is the no-permission state of admin-shell §9.5, naming the area when the server knows it. The
 * rail never leads here; this exists for a pasted link, a bookmark and a role changed mid-session.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import Icon from '../../../Components/Ui/Icon.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<{ status: number; area: string | null }>()

const page = computed(() => {
    switch (props.status) {
        case 403:
            return { title: 'Keine Berechtigung', context: props.area ? `Bereich „${props.area}“` : 'Diese Seite ist für deine Rolle nicht freigegeben' }
        case 404:
            return { title: 'Seite nicht gefunden', context: 'Diese Adresse gibt es im Admin nicht' }
        case 429:
            return { title: 'Zu viele Anfragen', context: 'In kurzer Zeit kam zu viel auf einmal' }
        default:
            return { title: 'Nicht erreichbar', context: `Fehler ${props.status}` }
    }
})
</script>

<template>
    <AdminPage :title="page.title" :context="page.context">
        <AdminState v-if="status === 403" kind="forbidden" :module="area ?? undefined" />

        <section v-else class="adm-state" :role="status === 429 ? 'status' : undefined">
            <Icon class="adm-state__icon" :name="status === 404 ? 'search' : 'clock'" :size="20" />
            <h2 class="adm-state__heading">
                {{ status === 404 ? 'Diese Seite gibt es nicht.' : 'Bitte warte einen Moment.' }}
            </h2>
            <p class="adm-state__text">
                {{
                    status === 404
                        ? 'Vielleicht war der Link veraltet oder falsch kopiert. Alles, was du öffnen darfst, findest du in der Navigation.'
                        : 'Warte eine Minute und lade die Seite dann neu.'
                }}
            </p>
            <div class="adm-state__action">
                <Link href="/admin" class="btn btn--secondary">Zur Übersicht</Link>
            </div>
        </section>
    </AdminPage>
</template>
