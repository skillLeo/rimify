/**
 * Team › Benutzer and the invitation link, as BenutzerController::index() and
 * EinladungController::show() send them (docs/admin/team-build-plan.md). Every date is already
 * German and in Europe/Berlin (R-10); the page prints it and never formats one itself.
 */

export type BenutzerStatus = 'active' | 'invited' | 'suspended'

export interface BenutzerAccount {
    id: number
    name: string
    email: string
    /** The role the role dialog starts on; null for an account that holds none. */
    roleId: number | null
    /** The German label(s); null for an account that holds no role. */
    role: string | null
    status: BenutzerStatus
    /** `26.09.2026, 13:10 Uhr`, or null before the first sign-in. */
    lastLogin: string | null
    twoFactor: boolean
    isSelf: boolean
    /** Not yourself, and no right you lack. Presentation only — the server asks again. */
    manageable: boolean
}

export interface BenutzerInvitation {
    id: number
    email: string
    name: string | null
    role: string | null
    invitedBy: string | null
    /** `03.10.2026, 14:22 Uhr` */
    expiresAt: string
    /** The link has run out; *Erneut senden* issues a new one. */
    expired: boolean
}

export interface BenutzerRole {
    id: number
    label: string
}

export interface AdminBenutzerProps {
    accounts: BenutzerAccount[]
    /** Neither accepted nor withdrawn, newest first, one per address. */
    invitations: BenutzerInvitation[]
    /** The roles this viewer may hand out: none with a right the viewer lacks. */
    assignableRoles: BenutzerRole[]
    can: {
        /** roles × create: invite, send again, withdraw. */
        invite: boolean
        /** roles × edit: change a role, suspend, reactivate, log out everywhere. */
        manage: boolean
    }
}

export type EinladungState = 'open' | 'expired' | 'revoked' | 'used' | 'unknown'

export interface AdminEinladungProps {
    state: EinladungState
    /** Only for an open link; every dead state carries nothing about whose invitation it was. */
    invitation: {
        email: string
        name: string | null
        role: string | null
        invitedBy: string | null
        expiresAt: string
    } | null
}
