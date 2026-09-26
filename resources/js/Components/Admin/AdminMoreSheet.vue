<script setup lang="ts">
/**
 * Mehr (admin-shell.md §11.3): every group the bottom bar has no slot for, then the account.
 *
 * A group of one page is that page's row, the group named beneath it. A group of several opens a
 * second sheet with its pages — never an accordion inside a sheet, where a long group pushes the
 * account out of reach.
 * Both sheets are the product's one BottomSheet, so back, swipe and Esc close them the same way.
 */

import { router } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import BottomSheet from '../Mobile/BottomSheet.vue'
import ListRow from '../Mobile/ListRow.vue'
import { useAdmin } from '../../composables/admin/useAdmin'
import type { AdminNavGroup, AdminNavPage } from '../../types/admin'

const props = defineProps<{
    /** The group keys that already have a slot in the bottom bar. */
    exclude: string[]
}>()

const open = defineModel<boolean>('open', { default: false })

const admin = useAdmin()
const account = computed(() => admin.value.account)

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
            <template v-for="item in groups" :key="item.key">
                <!-- A group of one page is that page, with the group beneath so it can still be found by it. -->
                <ListRow
                    v-if="item.pages.length === 1"
                    :icon="item.pages[0]?.icon ?? item.icon"
                    :title="item.pages[0]?.label ?? item.label"
                    :sub="item.pages[0]?.label === item.label ? undefined : item.label"
                    :meta="total(item)"
                    :href="item.pages[0]?.href"
                />
                <ListRow v-else :icon="item.icon" :title="item.label" :meta="total(item)" chevron @activate="group = item" />
            </template>

            <div v-if="account" class="adm-more__account">
                <p class="adm-more__name">{{ account.name }}</p>
                <p class="adm-more__role">{{ account.role ?? account.email }}</p>
            </div>

            <ListRow icon="user" title="Profil" href="/admin/profil" />
            <ListRow icon="shield" title="Passwort ändern" href="/admin/profil#passwort" />
            <ListRow icon="logout" :title="signingOut ? 'Wird abgemeldet …' : 'Abmelden'" :chevron="false" :disabled="signingOut" @activate="signOut" />
        </div>
    </BottomSheet>

    <BottomSheet id="admin-mehr-gruppe" v-model:open="groupOpen" :title="shownGroup?.label ?? ''">
        <div class="adm-more">
            <ListRow v-for="page in shownGroup?.pages ?? []" :key="page.href" :icon="page.icon" :title="page.label" :meta="pageCount(page)" :href="page.href" />
        </div>
    </BottomSheet>
</template>
