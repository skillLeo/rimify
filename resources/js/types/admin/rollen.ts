/**
 * Rollen & Rechte — the props RollenController::index() sends (docs/admin/team-build-plan.md).
 *
 * A right is a cell of the grid written `module.action`. Only the actions a module really has exist
 * (PermissionModule::actions()); the page never invents one and never draws a checkbox for one that
 * is not there.
 */

import type { AdminNavGroup } from '../admin'

export interface RollenRole {
    id: number
    /** The identifier; never shown, never changes. */
    name: string
    /** What a human reads, and what renaming changes. */
    label: string
    description: string | null
    /** A standard role: keeps its name and cannot be deleted; its rights can change. */
    isSystem: boolean
    /** Always every right; not changed, renamed or deleted. */
    isSuperAdmin: boolean
    /** Accounts holding the role. */
    users: number
    /** Allowed cells as `module.action`, in the grid's order. */
    rights: string[]
    /** The viewer holds this role and is not a Super-Admin: rights may go, not come. */
    raiseBlocked: boolean
    /** Name and description as loaded (EditStamp): the rename dialog sends it, an older state is refused. */
    nameStamp?: string
}

export interface RollenModule {
    module: string
    /** The German module name, as PermissionModule::labelDe() writes it. */
    label: string
    /** The actions this module really has, in column order. */
    actions: string[]
}

export interface RollenAction {
    action: string
    label: string
}

export interface AdminRollenPageProps {
    /** The selected role's rights the matrix was opened on (EditStamp): a save against older ones is refused. */
    stamp: string | null
    roles: RollenRole[]
    /** Distinct accounts holding any role. */
    accounts: number
    /** The rows of the grid. */
    modules: RollenModule[]
    /** The columns of the grid, all six, in order. */
    actions: RollenAction[]
    /** The role in `?rolle=`, or the server's default; null only when there is no role at all. */
    selected: number | null
    /** "Ansicht als Rolle": the rail the selected role would see. */
    navigation: AdminNavGroup[]
    /** The rights this viewer may hand to a role — their own; null for a Super-Admin (all of them). */
    grantable: string[] | null
    /** Presentation only — the server refuses regardless (R-11). */
    can: { create: boolean; update: boolean; delete: boolean }
}
