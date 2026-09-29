/**
 * The arithmetic behind the Rollen & Rechte editor, kept out of the page so it can be tested alone.
 *
 * A right is a cell written `module.action`. The page never saves a whole role without first
 * showing what would change (BRIEF.md §2: "a diff of what changes before saving"), so the one
 * question asked here over and over is: from these rights to those, what is gained and what is lost
 * — named in German, in the grid's own order, so the list reads like the grid it came from.
 */

import type { RollenAction, RollenModule } from '../../types/admin/rollen'

export interface RightChange {
    /** `module.action` */
    key: string
    module: string
    action: string
    /** `Katalog · Löschen` */
    label: string
}

export interface RoleDiff {
    gained: RightChange[]
    lost: RightChange[]
}

export function rightKey(module: string, action: string): string {
    return `${module}.${action}`
}

/**
 * Every real cell of the grid, in its order: modules down, each module's own actions across.
 */
export function realCells(modules: readonly RollenModule[]): string[] {
    return modules.flatMap((m) => m.actions.map((a) => rightKey(m.module, a)))
}

/**
 * What changes when a role's rights go from `current` to `next`. Cells the grid does not know are
 * ignored on both sides: they are not rights, so neither gaining nor losing one means anything.
 */
export function roleDiff(
    current: readonly string[],
    next: readonly string[],
    modules: readonly RollenModule[],
    actions: readonly RollenAction[]
): RoleDiff {
    const before = new Set(current)
    const after = new Set(next)
    const actionLabel = new Map(actions.map((a) => [a.action, a.label]))
    const gained: RightChange[] = []
    const lost: RightChange[] = []

    for (const module of modules) {
        for (const action of module.actions) {
            const key = rightKey(module.module, action)
            const had = before.has(key)
            const has = after.has(key)

            if (had === has) {
                continue
            }

            const change = { key, module: module.module, action, label: `${module.label} · ${actionLabel.get(action) ?? action}` }
            ;(has ? gained : lost).push(change)
        }
    }

    return { gained, lost }
}

/**
 * The rights with one module switched wholly on or off, everything else untouched — what a
 * module's *Alle* would save. Kept in the grid's order.
 */
export function withModule(rights: readonly string[], modules: readonly RollenModule[], module: string, on: boolean): string[] {
    const target = modules.find((m) => m.module === module)
    const next = new Set(rights)

    for (const action of target?.actions ?? []) {
        const key = rightKey(module, action)

        if (on) {
            next.add(key)
        } else {
            next.delete(key)
        }
    }

    return realCells(modules).filter((key) => next.has(key))
}

/** How much of one module a role holds: none, some, or all of its real actions. */
export function moduleState(rights: readonly string[], module: RollenModule): 'none' | 'some' | 'all' {
    const held = module.actions.filter((a) => rights.includes(rightKey(module.module, a))).length

    if (held === 0) {
        return 'none'
    }

    return held === module.actions.length ? 'all' : 'some'
}

/**
 * The modules whose German name contains the search, ignoring case and spacing at the edges. An
 * empty search is every module.
 */
export function matchModules(modules: readonly RollenModule[], query: string): RollenModule[] {
    const needle = query.trim().toLocaleLowerCase('de-DE')

    if (needle === '') {
        return [...modules]
    }

    return modules.filter((m) => m.label.toLocaleLowerCase('de-DE').includes(needle))
}
