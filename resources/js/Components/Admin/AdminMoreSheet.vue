<script setup lang="ts">
/**
 * Mehr (admin-shell.md §11.3): the shop's health, every group the bottom bar has no slot for, „Neu“,
 * then the account — on a phone, the rail's foot lives here.
 *
 * A group of one page is that page's row, the group named beneath it. A group of several opens a
 * second sheet with its pages — never an accordion inside a sheet, where a long group pushes the
 * account out of reach.
 * Both sheets are the product's one BottomSheet, so back, swipe and Esc close them the same way.
 */

import { Link, router } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import BottomSheet from '../Mobile/BottomSheet.vue'
import ListRow from '../Mobile/ListRow.vue'
import AdminIcon from './AdminIcon.vue'
import { monogram } from '../../composables/admin/monogram'
import { useAdmin } from '../../composables/admin/useAdmin'
import { useHealth, useHealthBanner } from '../../composables/admin/useHealth'
import type { AdminNavGroup, AdminNavPage } from '../../types/admin'

const props = defineProps<{
    /** The group keys that already have a slot in the bottom bar. */
    exclude: string[]
}>()

const open = defineModel<boolean>('open', { default: false })

const admin = useAdmin()
const account = computed(() => admin.value.account)
const actions = computed(() => admin.value.quickActions)
const initials = computed(() => monogram(account.value?.name))
const health = useHealth()
const banner = useHealthBanner()

const groups = computed(() => admin.value.nav.filter((g) => g.key !== 'uebersicht' && !props.exclude.includes(g.key)))

function total(group: AdminNavGroup): string | undefined {
    const value = group.pages.reduce((sum, p) => sum + (p.count ?? 0), 0)

    return value > 0 ? String(value) : undefined
}

function pageCount(page: AdminNavPage): string | undefined {
    return page.count ? String(page.count) : undefined
}

const group = ref<AdminNavGroup | null>(null)
/* The last group shown stays as the sheet's content while it slides away, so its title does not
   blank out mid-animation; only whether it is open follows `group`. */
const shownGroup = ref<AdminNavGroup | null>(null)

watch(group, (value) => {
    if (value !== null) {
        shownGroup.value = value
    }
})

const groupOpen = computed({
    get: () => group.value !== null,
    set: (value: boolean) => {
        if (!value) {
            group.value = null
        }
    },
})

const signingOut = ref(false)

function signOut(): void {
    if (signingOut.value) {
        return
    }

    signingOut.value = true
    router.post('/admin/abmelden', {}, { onFinish: () => (signingOut.value = false) })
}
</script>

<template>
    <BottomSheet id="admin-mehr" v-model:open="open" title="Mehr">
        <div class="adm-more">
            <!-- The rail's foot, on a phone: the shop's health first — only when something is wrong and
                 no banner is saying it already, one quiet line, the same words as the rail. -->
            <component
                :is="health.href ? Link : 'p'"
                v-if="health && health.state !== 'ok' && !banner"
                :href="health.href ?? undefined"
                class="adm-foot__health adm-more__health"
                :aria-label="health.sentence"
            >
                <span class="adm-health__dot" :class="`adm-health__dot--${health.state}`" aria-hidden="true" />
                <span class="adm-foot__label" aria-hidden="true">{{ health.label }}</span>
                <span v-if="health.count" class="adm-foot__count" :class="`adm-foot__count--${health.state}`" aria-hidden="true">· {{ health.count }}</span>
            </component>

            <template v-for="item in groups" :key="item.key">
                <!-- A group of one page is that page, with the group beneath so it can still be found by it. -->
                <ListRow
                    v-if="item.pages.length === 1"
                    :title="item.pages[0]?.label ?? item.label"
                    :sub="item.pages[0]?.label === item.label ? undefined : item.label"
                    :meta="total(item)"
                    :href="item.pages[0]?.href"
                >
                    <template #leading><AdminIcon :name="item.pages[0]?.icon ?? item.icon" :size="24" /></template>
                </ListRow>
                <ListRow v-else :title="item.label" :meta="total(item)" chevron @activate="group = item">
                    <template #leading><AdminIcon :name="item.icon" :size="24" /></template>
                </ListRow>
            </template>

            <template v-if="actions.length">
                <p class="adm-more__caption">Neu anlegen</p>
                <ListRow v-for="action in actions" :key="action.key" :title="action.label" :href="action.href">
                    <template #leading><AdminIcon :name="action.icon" :size="24" /></template>
                </ListRow>
            </template>

            <div v-if="account" class="adm-more__account">
                <span class="adm-avatar" aria-hidden="true">{{ initials }}</span>
                <span>
                    <span class="adm-more__name">{{ account.name }}</span>
                    <span class="adm-more__role">{{ account.role ?? account.email }}</span>
                </span>
            </div>

            <ListRow title="Profil" href="/admin/profil">
                <template #leading><AdminIcon name="users" :size="24" /></template>
            </ListRow>
            <ListRow title="Benachrichtigungen" href="/admin/benachrichtigungen">
                <template #leading><AdminIcon name="bell" :size="24" /></template>
            </ListRow>
            <ListRow title="Passwort ändern" href="/admin/profil#passwort">
                <template #leading><AdminIcon name="shield" :size="24" /></template>
            </ListRow>
            <ListRow
                class="adm-more__signout"
                :title="signingOut ? 'Wird abgemeldet …' : 'Abmelden'"
                :chevron="false"
                :disabled="signingOut"
                @activate="signOut"
            >
                <template #leading><AdminIcon name="logout" :size="24" /></template>
            </ListRow>
        </div>
    </BottomSheet>

    <BottomSheet id="admin-mehr-gruppe" v-model:open="groupOpen" :title="shownGroup?.label ?? ''">
        <div class="adm-more">
            <ListRow v-for="page in shownGroup?.pages ?? []" :key="page.href" :title="page.label" :meta="pageCount(page)" :href="page.href">
                <template #leading><AdminIcon :name="page.icon" :size="24" /></template>
            </ListRow>
        </div>
    </BottomSheet>
</template>
