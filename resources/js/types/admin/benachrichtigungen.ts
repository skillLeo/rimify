import type { AdminAlertItem, AdminAlertKind } from '../admin'

/** /admin/benachrichtigungen — BenachrichtigungenController::index. */
export interface AdminBenachrichtigungenProps {
    filter: 'alle' | 'ungelesen'
    items: AdminAlertItem[]
    counts: { unread: number; all: number }
    pagination: { current: number; last: number; prev: string | null; next: string | null }
    /** The kinds this person may receive, with their choices; empty for a role that sees none. */
    kinds: AdminAlertKind[]
    /** The switches as loaded (EditStamp): a flip sends it, one from an older page is refused. */
    kindsStamp?: string
}
