<script setup lang="ts">
/**
 * The one system problem worth a banner across the top of every page, not only the rail's quiet line:
 * the shop in maintenance mode, a queue that has not moved for an hour, or a scheduler silent for an hour —
 * unpaid orders then keep their stock for good (SystemHealth::urgent).
 *
 * It cannot be dismissed — a problem hidden for good is how a dead queue goes unnoticed. „Später
 * erinnern“ keeps it away for 8 hours, saved on the account so it does not flash up on the next page
 * (the server leaves it out of the first frame). While it shows, the rail's line about the same
 * problem stays away; put off, the line comes back and reminds (useHealthBanner). The link leads to
 * System › Zustand, which explains it and retries.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import { useAdmin } from '../../composables/admin/useAdmin'
import { snoozeBanner, useHealthBanner } from '../../composables/admin/useHealth'

const admin = useAdmin()
const banner = useHealthBanner()

const href = computed(() => admin.value.health?.href ?? null)
const tone = computed(() => (banner.value?.key === 'maintenance' ? 'bad' : 'warn'))

/** Laravel's XSRF cookie, decoded, as the `X-XSRF-TOKEN` header the request is checked against. */
function xsrfToken(): string {
    const match = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(document.cookie)

    return match?.[1] ? decodeURIComponent(match[1]) : ''
}

function remindLater(): void {
    const key = banner.value?.key

    if (!key) {
        return
    }

    snoozeBanner(key)

    void fetch('/admin/ansicht', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: JSON.stringify({ snooze: key }),
    }).catch(() => undefined)
}
</script>

<template>
    <div v-if="banner" class="adm-banner" :class="`adm-banner--${tone}`" role="alert">
        <span class="adm-health__dot" :class="`adm-health__dot--${tone}`" aria-hidden="true" />
        <p class="adm-banner__text">{{ banner.sentence }}</p>
        <span class="adm-banner__actions">
            <Link v-if="href" :href="href" class="btn btn--secondary btn--sm">Zum Systemzustand</Link>
            <button class="btn btn--ghost btn--sm" type="button" @click="remindLater">Später erinnern</button>
        </span>
    </div>
</template>
