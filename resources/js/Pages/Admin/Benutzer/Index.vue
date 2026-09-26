<script setup lang="ts">
/**
 * Team › Benutzer — who can sign in to the admin, in which role, and who has been invited.
 *
 * One primary action, *Person einladen*. Everything done to an account sits behind its row's
 * more-menu: *Rolle ändern…*, *Überall abmelden*, and *Sperren* or *Entsperren*, each confirmed with
 * what it does. Your own row has no menu, and neither has a row whose account holds a right you
 * lack — the server refuses both regardless (R-11); the page only stops offering them.
 *
 * An account is never deleted here. The role select offers only the roles this viewer may hand
 * out, so the refusal the server would give is never the first thing somebody meets.
 */

import { router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, reactive, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { useOpenOnArrival } from '../../../composables/admin/useOpenOnArrival'
import type { AdminBenutzerProps, BenutzerAccount, BenutzerInvitation } from '../../../types/admin/benutzer'
import { actionBody, actionLabel, actionTitle, actionUrl, contextLine, type AccountAction } from './benutzer'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminBenutzerProps>()

const page = usePage()

/** Which request the server's messages belong to: each form only shows what it sent itself. */
type Sender = 'invite' | 'role' | 'account' | 'invitation' | null

const sender = ref<Sender>(null)
const busy = ref(false)

const bag = computed<Record<string, string>>(() => {
    const raw: unknown = page.props.errors

    return raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})

const inviteErrors = computed<Record<string, string>>(() => (sender.value === 'invite' ? bag.value : {}))
const roleErrors = computed<Record<string, string>>(() => (sender.value === 'role' ? bag.value : {}))

/** A refusal about a row, said once above the lists and read before the retry. */
const alert = computed(() => {
    if (sender.value === 'account') {
        return bag.value.account ?? ''
    }

    return sender.value === 'invitation' ? (bag.value.invitation ?? '') : ''
})

const context = computed(() => contextLine(props.accounts, props.invitations))

/** Under an invitation's name: the address (when a name stands above it) and who invited. */
function invitationSub(invitation: BenutzerInvitation): string {
    return [invitation.name ? invitation.email : null, invitation.invitedBy ? `eingeladen von ${invitation.invitedBy}` : null]
        .filter(Boolean)
        .join(' · ')
}
const readOnly = computed(() => !props.can.invite && !props.can.manage)
const hasRowActions = computed(() => props.can.manage && props.accounts.some((a) => a.manageable))

/* ── Person einladen ─────────────────────────────────────────────────────────────── */

const inviting = ref(false)
const invite = reactive<{ name: string; email: string; role_id: number | '' }>({ name: '', email: '', role_id: '' })

function openInvite(): void {
    Object.assign(invite, { name: '', email: '', role_id: props.assignableRoles.length === 1 ? props.assignableRoles[0]!.id : '' })
    sender.value = null
    inviting.value = true
}

// „Neu › Person einladen“ from the rail's foot or the palette lands here with ?einladen=1.
useOpenOnArrival('einladen', openInvite, () => props.can.invite)

function sendInvite(): void {
    if (busy.value) {
        return
    }

    sender.value = 'invite'
    busy.value = true

    router.post(
        '/admin/benutzer/einladungen',
        { ...invite },
        {
            preserveScroll: true,
            onSuccess: () => {
                inviting.value = false
            },
            onFinish: () => {
                busy.value = false
            },
        }
    )
}

/* ── Rolle ändern ────────────────────────────────────────────────────────────────── */

const reroling = ref<BenutzerAccount | null>(null)
const roleChoice = ref<number | ''>('')

const roleOpen = computed({
    get: () => reroling.value !== null,
    set: (open: boolean) => {
        if (!open) {
            reroling.value = null
        }
    },
})

const roleUnchanged = computed(() => reroling.value !== null && roleChoice.value === reroling.value.roleId)

function openRole(account: BenutzerAccount): void {
    sender.value = null
    roleChoice.value = account.roleId ?? ''
    reroling.value = account
}

function saveRole(): void {
    const account = reroling.value

    if (account === null || busy.value || roleUnchanged.value) {
        return
    }

    sender.value = 'role'
    busy.value = true

    router.patch(
        `/admin/benutzer/${account.id}/rolle`,
        { role_id: roleChoice.value },
        {
            preserveScroll: true,
            onSuccess: () => {
                reroling.value = null
            },
            onFinish: () => {
                busy.value = false
            },
        }
    )
}

/* ── Sperren, Entsperren, Überall abmelden ───────────────────────────────────────── */

const asking = ref<{ action: AccountAction; account: BenutzerAccount } | null>(null)

const askOpen = computed({
    get: () => asking.value !== null,
    set: (open: boolean) => {
        if (!open) {
            asking.value = null
        }
    },
})

function ask(action: AccountAction, account: BenutzerAccount): void {
    sender.value = null
    asking.value = { action, account }
}

function runAction(): void {
    const current = asking.value

    if (current === null || busy.value) {
        return
    }

    sender.value = 'account'
    busy.value = true

    router.post(
        actionUrl(current.action, current.account),
        {},
        {
            preserveScroll: true,
            // Closed either way: a refusal is shown above the list, where it stays readable.
            onFinish: () => {
                busy.value = false
                asking.value = null
            },
        }
    )
}

/* ── Offene Einladungen ──────────────────────────────────────────────────────────── */

const sending = ref<number | null>(null)
const withdrawing = ref<BenutzerInvitation | null>(null)

const withdrawOpen = computed({
    get: () => withdrawing.value !== null,
    set: (open: boolean) => {
        if (!open) {
            withdrawing.value = null
        }
    },
})

function resend(invitation: BenutzerInvitation): void {
    if (sending.value !== null) {
        return
    }

    sender.value = 'invitation'
    sending.value = invitation.id

    router.post(`/admin/benutzer/einladungen/${invitation.id}/erneut`, {}, {
        preserveScroll: true,
        onFinish: () => {
            sending.value = null
        },
    })
}

function withdraw(): void {
    const invitation = withdrawing.value

    if (invitation === null || busy.value) {
        return
    }

    sender.value = 'invitation'
    busy.value = true

    router.delete(`/admin/benutzer/einladungen/${invitation.id}`, {
        preserveScroll: true,
        onFinish: () => {
            busy.value = false
            withdrawing.value = null
        },
    })
}
</script>

<template>
    <AdminPage title="Benutzer" :context="context" :read-only="readOnly">
        <template v-if="can.invite" #primary>
            <button class="btn btn--primary" type="button" @click="openInvite">Person einladen</button>
        </template>

        <p v-if="alert" class="adm-alert" role="alert">{{ alert }}</p>

        <!-- One list: the accounts, then the invitations still waiting — one grid, one kind of row.
             The state is said only where it is the exception (Gesperrt, Eingeladen). -->
        <div v-if="accounts.length > 0 || invitations.length > 0" class="adm-panel">
            <table class="adm-table">
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Rolle</th>
                        <th scope="col">Letzte Anmeldung</th>
                        <th scope="col">Zwei-Faktor</th>
                        <th v-if="hasRowActions || can.invite" scope="col"><span class="visually-hidden">Aktionen</span></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="account in accounts" :key="`a${account.id}`">
                        <td data-label="Name">
                            <span class="adm-table__key bn__name">
                                {{ account.name }}<span v-if="account.isSelf" class="bn__you"> (du)</span>
                                <span v-if="account.status === 'suspended'" class="adm-tag adm-tag--bad">Gesperrt</span>
                                <span v-else-if="account.status === 'invited'" class="adm-tag adm-tag--neutral">Eingeladen</span>
                            </span>
                            <span class="adm-table__sub">{{ account.email }}</span>
                        </td>
                        <td data-label="Rolle">{{ account.role ?? 'Keine Rolle' }}</td>
                        <td data-label="Letzte Anmeldung" class="bn__num">{{ account.lastLogin ?? 'Noch nie' }}</td>
                        <td data-label="Zwei-Faktor" data-phone="hide">{{ account.twoFactor ? 'Ja' : 'Nein' }}</td>
                        <td v-if="hasRowActions || can.invite" data-label="Aktionen" data-phone="menu" class="bn__actions">
                            <DropdownMenuRoot v-if="account.manageable">
                                <DropdownMenuTrigger class="adm-iconbtn" :aria-label="`Aktionen für ${account.name}`">
                                    <Icon name="more" :size="20" />
                                </DropdownMenuTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuContent class="adm-menu" align="end" :side-offset="4">
                                        <DropdownMenuItem class="adm-menu__item" @select="openRole(account)">
                                            <Icon name="shield" :size="20" />
                                            Rolle ändern…
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            v-if="account.status !== 'suspended'"
                                            class="adm-menu__item"
                                            @select="ask('signout', account)"
                                        >
                                            <Icon name="logout" :size="20" />
                                            Überall abmelden
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator class="adm-menu__sep" />

                                        <DropdownMenuItem
                                            v-if="account.status === 'suspended'"
                                            class="adm-menu__item"
                                            @select="ask('reactivate', account)"
                                        >
                                            <Icon name="check" :size="20" />
                                            Entsperren
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            v-else
                                            class="adm-menu__item adm-menu__item--danger"
                                            @select="ask('suspend', account)"
                                        >
                                            <Icon name="lock" :size="20" />
                                            Sperren
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenuPortal>
                            </DropdownMenuRoot>
                        </td>
                    </tr>

                    <tr v-for="invitation in invitations" :key="`i${invitation.id}`">
                        <td data-label="Name">
                            <span class="adm-table__key bn__name">
                                {{ invitation.name || invitation.email }}
                                <span class="adm-tag adm-tag--neutral">Eingeladen</span>
                            </span>
                            <span v-if="invitationSub(invitation)" class="adm-table__sub">{{ invitationSub(invitation) }}</span>
                        </td>
                        <td data-label="Rolle">{{ invitation.role ?? 'Keine Rolle' }}</td>
                        <td data-label="Letzte Anmeldung" class="bn__num">
                            <span v-if="invitation.expired" class="adm-tag adm-tag--warn">Link abgelaufen</span>
                            <template v-else>Link gültig bis {{ invitation.expiresAt }}</template>
                        </td>
                        <td data-label="Zwei-Faktor" data-phone="hide">–</td>
                        <td v-if="hasRowActions || can.invite" data-label="Aktionen" data-phone="menu" class="bn__actions">
                            <DropdownMenuRoot v-if="can.invite">
                                <DropdownMenuTrigger class="adm-iconbtn" :aria-label="`Aktionen für die Einladung an ${invitation.email}`">
                                    <Icon name="more" :size="20" />
                                </DropdownMenuTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuContent class="adm-menu" align="end" :side-offset="4">
                                        <DropdownMenuItem class="adm-menu__item" :disabled="sending !== null" @select="resend(invitation)">
                                            <Icon name="emails" :size="20" />
                                            {{ sending === invitation.id ? 'Wird gesendet …' : 'Erneut senden' }}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator class="adm-menu__sep" />
                                        <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="withdrawing = invitation">
                                            <Icon name="close" :size="20" />
                                            Widerrufen
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenuPortal>
                            </DropdownMenuRoot>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <AdminState v-else kind="empty" text="Noch kein Konto und keine Einladung. Wer eingeladen wird, erscheint hier und bekommt ein Konto, sobald die Einladung angenommen ist." />

        <!-- Person einladen -->
        <Dialog v-model:open="inviting" title="Person einladen" content-class="adm-dialog">
            <form id="bn-invite" class="adm-fields" novalidate @submit.prevent="sendInvite">
                <p class="adm-note">Die Person bekommt eine E-Mail mit einem Link. Darüber legt sie ihr Passwort fest und ist danach angemeldet.</p>

                <div class="form-field">
                    <label class="form-field__label" for="bn-invite-name">Name (optional)</label>
                    <input
                        id="bn-invite-name"
                        v-model="invite.name"
                        class="input"
                        :class="{ 'input--error': inviteErrors.name }"
                        type="text"
                        maxlength="255"
                        autocomplete="off"
                        aria-describedby="bn-invite-name-err"
                        :aria-invalid="inviteErrors.name ? 'true' : undefined"
                    >
                    <p id="bn-invite-name-err" class="form-field__error">{{ inviteErrors.name ?? '' }}</p>
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="bn-invite-email">E-Mail</label>
                    <input
                        id="bn-invite-email"
                        v-model="invite.email"
                        class="input"
                        :class="{ 'input--error': inviteErrors.email }"
                        type="email"
                        inputmode="email"
                        maxlength="255"
                        autocomplete="off"
                        spellcheck="false"
                        aria-required="true"
                        aria-describedby="bn-invite-email-err"
                        :aria-invalid="inviteErrors.email ? 'true' : undefined"
                    >
                    <p id="bn-invite-email-err" class="form-field__error">{{ inviteErrors.email ?? '' }}</p>
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="bn-invite-role">Rolle</label>
                    <select
                        id="bn-invite-role"
                        v-model="invite.role_id"
                        class="input"
                        :class="{ 'input--error': inviteErrors.role_id }"
                        aria-required="true"
                        aria-describedby="bn-invite-role-help bn-invite-role-err"
                        :aria-invalid="inviteErrors.role_id ? 'true' : undefined"
                    >
                        <option value="" disabled>Rolle wählen</option>
                        <option v-for="role in assignableRoles" :key="role.id" :value="role.id">{{ role.label }}</option>
                    </select>
                    <p id="bn-invite-role-help" class="form-field__help">Du kannst nur Rollen vergeben, deren Rechte du selbst hast.</p>
                    <p id="bn-invite-role-err" class="form-field__error">{{ inviteErrors.role_id ?? '' }}</p>
                </div>
            </form>

            <template #actions>
                <button class="btn btn--secondary" type="button" @click="inviting = false">Abbrechen</button>
                <button class="btn btn--primary" type="submit" form="bn-invite" :aria-busy="busy ? 'true' : undefined" :disabled="busy">
                    {{ busy ? 'Wird gesendet …' : 'Einladung senden' }}
                </button>
            </template>
        </Dialog>

        <!-- Rolle ändern -->
        <Dialog v-model:open="roleOpen" :title="`Rolle von ${reroling?.name ?? ''} ändern`" content-class="adm-dialog adm-dialog--narrow">
            <form id="bn-role" class="adm-fields" novalidate @submit.prevent="saveRole">
                <div class="form-field">
                    <label class="form-field__label" for="bn-role-select">Rolle</label>
                    <select
                        id="bn-role-select"
                        v-model="roleChoice"
                        class="input"
                        :class="{ 'input--error': roleErrors.role_id }"
                        aria-describedby="bn-role-help bn-role-err"
                        :aria-invalid="roleErrors.role_id ? 'true' : undefined"
                    >
                        <option value="" disabled>Rolle wählen</option>
                        <option v-for="role in assignableRoles" :key="role.id" :value="role.id">{{ role.label }}</option>
                    </select>
                    <p id="bn-role-help" class="form-field__help">Die neuen Rechte gelten ab dem nächsten Klick der Person.</p>
                    <p id="bn-role-err" class="form-field__error">{{ roleErrors.role_id ?? '' }}</p>
                </div>
            </form>

            <template #actions>
                <button class="btn btn--secondary" type="button" @click="roleOpen = false">Abbrechen</button>
                <button
                    class="btn btn--primary"
                    type="submit"
                    form="bn-role"
                    :aria-busy="busy ? 'true' : undefined"
                    :disabled="busy || roleUnchanged || roleChoice === ''"
                >
                    Rolle speichern
                </button>
            </template>
        </Dialog>

        <AdminConfirm
            v-model:open="askOpen"
            :title="asking ? actionTitle(asking.action, asking.account) : ''"
            :body="asking ? actionBody(asking.action, asking.account) : ''"
            :confirm-label="asking ? actionLabel(asking.action) : ''"
            :busy="busy"
            @confirm="runAction"
        />

        <AdminConfirm
            v-model:open="withdrawOpen"
            :title="`Einladung an ${withdrawing?.email ?? ''} widerrufen?`"
            body="Der Link in der E-Mail funktioniert danach nicht mehr. Du kannst die Person jederzeit neu einladen."
            confirm-label="Widerrufen"
            :busy="busy"
            @confirm="withdraw"
        />
    </AdminPage>
</template>

<style scoped>
.bn__you {
    font-weight: 400;
    color: var(--c-ink-3);
}

.bn__actions {
    width: 1%;
    text-align: right;
}

/* The exceptional state stands right after the name, where the eye already is. */
.bn__name {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
}

.bn__num {
    font-variant-numeric: tabular-nums;
}
</style>
