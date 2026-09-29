import { describe, expect, it } from 'vitest'
import { matchModules, moduleState, realCells, roleDiff, withModule } from './roleDiff'
import type { RollenAction, RollenModule } from '../../types/admin/rollen'

/*
 * The editor's arithmetic (BRIEF.md §2): what a role gains and loses before anything is saved, what
 * a module's "Alle" would save, and which modules a search keeps. Only real cells count.
 */

const MODULES: RollenModule[] = [
    { module: 'catalogue', label: 'Katalog', actions: ['view', 'create', 'edit', 'delete', 'publish', 'export'] },
    { module: 'orders', label: 'Bestellungen', actions: ['view', 'edit', 'export'] },
    { module: 'audit_log', label: 'Protokoll', actions: ['view', 'export'] },
]

const ACTIONS: RollenAction[] = [
    { action: 'view', label: 'Ansehen' },
    { action: 'create', label: 'Anlegen' },
    { action: 'edit', label: 'Bearbeiten' },
    { action: 'delete', label: 'Löschen' },
    { action: 'publish', label: 'Veröffentlichen' },
    { action: 'export', label: 'Exportieren' },
]

describe('roleDiff', () => {
    it('names what is gained and what is lost, in German and in the grid order', () => {
        const diff = roleDiff(['orders.view', 'orders.export', 'catalogue.view'], ['audit_log.view', 'catalogue.edit', 'catalogue.view', 'orders.view'], MODULES, ACTIONS)

        expect(diff.gained.map((c) => c.label)).toEqual(['Katalog · Bearbeiten', 'Protokoll · Ansehen'])
        expect(diff.lost.map((c) => c.key)).toEqual(['orders.export'])
        expect(diff.lost[0]).toEqual({ key: 'orders.export', module: 'orders', action: 'export', label: 'Bestellungen · Exportieren' })
    })

    it('is empty when both sides hold the same rights, in whatever order', () => {
        expect(roleDiff(['orders.view', 'catalogue.view'], ['catalogue.view', 'orders.view'], MODULES, ACTIONS)).toEqual({ gained: [], lost: [] })
    })

    it('ignores cells the grid does not have, on either side', () => {
        const diff = roleDiff(['audit_log.delete'], ['orders.publish', 'erfunden.view'], MODULES, ACTIONS)

        expect(diff).toEqual({ gained: [], lost: [] })
    })

    it('takes everything away when the source has nothing', () => {
        expect(roleDiff(['orders.view', 'audit_log.export'], [], MODULES, ACTIONS).lost.map((c) => c.key)).toEqual(['orders.view', 'audit_log.export'])
    })
})

describe('withModule', () => {
    it('switches one module wholly on, leaving the others alone', () => {
        expect(withModule(['audit_log.view'], MODULES, 'orders', true)).toEqual(['orders.view', 'orders.edit', 'orders.export', 'audit_log.view'])
    })

    it('switches one module wholly off', () => {
        expect(withModule(['orders.view', 'orders.edit', 'catalogue.view'], MODULES, 'orders', false)).toEqual(['catalogue.view'])
    })

    it('never adds an action the module does not have', () => {
        expect(withModule([], MODULES, 'audit_log', true)).toEqual(['audit_log.view', 'audit_log.export'])
    })

    it('drops cells that are not real while it is at it', () => {
        expect(withModule(['audit_log.delete'], MODULES, 'orders', false)).toEqual([])
    })
})

describe('moduleState', () => {
    it('tells none, some and all apart', () => {
        const orders = MODULES[1]!

        expect(moduleState([], orders)).toBe('none')
        expect(moduleState(['orders.view'], orders)).toBe('some')
        expect(moduleState(['orders.view', 'orders.edit', 'orders.export'], orders)).toBe('all')
    })
})

describe('matchModules', () => {
    it('keeps the modules whose German name contains the search, ignoring case', () => {
        expect(matchModules(MODULES, '  bestell ').map((m) => m.module)).toEqual(['orders'])
        expect(matchModules(MODULES, 'O').map((m) => m.module)).toEqual(['catalogue', 'audit_log'])
    })

    it('keeps every module for an empty search', () => {
        expect(matchModules(MODULES, '')).toHaveLength(3)
    })
})

describe('realCells', () => {
    it('lists modules down and their own actions across', () => {
        expect(realCells(MODULES)).toHaveLength(11)
        expect(realCells(MODULES).slice(-2)).toEqual(['audit_log.view', 'audit_log.export'])
    })
})
