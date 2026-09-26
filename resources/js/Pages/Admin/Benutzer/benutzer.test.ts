import { describe, expect, it } from 'vitest'
import type { BenutzerAccount, BenutzerInvitation } from '../../../types/admin/benutzer'
import { actionBody, actionLabel, actionTitle, actionUrl, contextLine } from './benutzer'

function account(overrides: Partial<BenutzerAccount> = {}): BenutzerAccount {
    return {
        id: 4,
        name: 'Nils Fuchs',
        email: 'nils@example.test',
        roleId: 6,
        role: 'Support Agent',
        status: 'active',
        lastLogin: null,
        twoFactor: false,
        isSelf: false,
        manageable: true,
        ...overrides,
    }
}

function invitation(overrides: Partial<BenutzerInvitation> = {}): BenutzerInvitation {
    return {
        id: 1,
        email: 'jana@example.test',
        name: null,
        role: 'Support Agent',
        invitedBy: 'Sabine Roth',
        expiresAt: '03.10.2026, 14:22 Uhr',
        expired: false,
        ...overrides,
    }
}

describe('the context line', () => {
    it('always counts the accounts, and adds only what is not zero', () => {
        expect(contextLine([account()], [])).toBe('1 Konto')
        expect(contextLine([account(), account({ id: 5 })], [])).toBe('2 Konten')
    })

    it('says how many invitations are open, and how many have run out, separately', () => {
        const accounts = Array.from({ length: 7 }, (_, i) => account({ id: i + 1 }))

        expect(contextLine(accounts, [invitation()])).toBe('7 Konten · 1 Einladung offen')
        expect(contextLine(accounts, [invitation(), invitation({ id: 2 }), invitation({ id: 3, expired: true })])).toBe(
            '7 Konten · 2 Einladungen offen · 1 Einladung abgelaufen'
        )
    })

    it('counts suspended accounts', () => {
        expect(contextLine([account(), account({ id: 5, status: 'suspended' })], [])).toBe('2 Konten · 1 gesperrt')
    })

    it('writes a large team the German way', () => {
        const accounts = Array.from({ length: 1200 }, (_, i) => account({ id: i + 1 }))

        expect(contextLine(accounts, [])).toBe('1.200 Konten')
    })
})

describe('the account actions', () => {
    it('names the person and the consequence, never just the button again', () => {
        const nils = account()

        expect(actionTitle('suspend', nils)).toBe('Nils Fuchs sperren?')
        expect(actionBody('suspend', nils)).toContain('kann sich nicht mehr anmelden')
        expect(actionBody('suspend', nils)).toContain('bleiben erhalten')
        expect(actionTitle('signout', nils)).toBe('Nils Fuchs überall abmelden?')
        expect(actionBody('signout', nils)).toContain('muss sich neu anmelden')
        expect(actionTitle('reactivate', nils)).toBe('Nils Fuchs entsperren?')
        expect(actionBody('reactivate', nils)).toContain('in der Rolle Support Agent')
        expect(actionBody('reactivate', account({ role: null }))).toContain('Das Konto hat keine Rolle.')
    })

    it('labels the confirming button with the action itself', () => {
        expect(actionLabel('suspend')).toBe('Sperren')
        expect(actionLabel('reactivate')).toBe('Entsperren')
        expect(actionLabel('signout')).toBe('Überall abmelden')
    })

    it('posts each action to its own route', () => {
        expect(actionUrl('suspend', account())).toBe('/admin/benutzer/4/sperren')
        expect(actionUrl('reactivate', account())).toBe('/admin/benutzer/4/entsperren')
        expect(actionUrl('signout', account())).toBe('/admin/benutzer/4/abmelden')
    })
})
