<script setup lang="ts">
/**
 * Who you are, and the three things you do with that: look at your account, change your password,
 * leave.
 *
 * The account sits here rather than in the rail because the rail is navigation and "who am I" is
 * not a destination — and the topbar's right corner is where anybody trained on any other panel
 * looks first. The role is the server's own label; without one the address is shown, never an
 * invented role.
 *
 * *Zwei-Faktor* is not in this menu yet. Enrolment arrives with the security step, and a menu entry
 * that leads nowhere is the dead link the brief forbids.
 */

import { Link, router } from '@inertiajs/vue3'
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from 'reka-ui'
import { computed, ref } from 'vue'
import Icon from '../Ui/Icon.vue'
import { useAdmin } from '../../composables/admin/useAdmin'

const admin = useAdmin()
const account = computed(() => admin.value.account)

const signingOut = ref(false)

/** A post, not a link, and not twice: while it is in flight the row says so and refuses again. */
function signOut(event: Event): void {
    event.preventDefault()

    if (signingOut.value) {
        return
    }

    signingOut.value = true
    router.post('/admin/abmelden', {}, { onFinish: () => (signingOut.value = false) })
}
</script>

<template>
    <DropdownMenuRoot v-if="account">
        <DropdownMenuTrigger class="adm-usermenu" :aria-label="`Konto: ${account.name}`">
            <Icon name="user" :size="20" />
            <span class="adm-usermenu__name">{{ account.name }}</span>
            <Icon class="adm-usermenu__chevron" name="chevron-down" :size="16" />
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
            <DropdownMenuContent class="adm-menu" align="end" :side-offset="8">
                <div class="adm-menu__head">
                    <DropdownMenuLabel class="adm-menu__name">{{ account.name }}</DropdownMenuLabel>
                    <DropdownMenuLabel class="adm-menu__meta">{{ account.role ?? account.email }}</DropdownMenuLabel>
                </div>

                <DropdownMenuSeparator class="adm-menu__sep" />

                <DropdownMenuItem as-child>
                    <Link href="/admin/profil" class="adm-menu__item">
                        <Icon name="user" :size="20" />
                        Profil
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem as-child>
                    <Link href="/admin/profil#passwort" class="adm-menu__item">
                        <Icon name="shield" :size="20" />
                        Passwort ändern
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator class="adm-menu__sep" />

                <DropdownMenuItem
                    class="adm-menu__item"
                    :disabled="signingOut"
                    :aria-busy="signingOut ? 'true' : undefined"
                    @select="signOut"
                >
                    <Icon name="logout" :size="20" />
                    {{ signingOut ? 'Wird abgemeldet …' : 'Abmelden' }}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>
