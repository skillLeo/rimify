/**
 * Whether a rail page is where the reader is. A page is current on its own path and on every record
 * beneath it — /admin/seiten/7 is still Seiten — so the rail, the tab bar and the palette keep their
 * place while one record is open. Übersicht is /admin itself and nothing below it, or it would be
 * current everywhere.
 */
export function isCurrentPage(href: string, path: string): boolean {
    if (href === '/admin') {
        return path === '/admin' || BENEATH_UEBERSICHT.includes(path)
    }

    return href === path || path.startsWith(`${href}/`)
}

/**
 * Pages beneath the Übersicht that are not on the rail (AdminNavigation::BENEATH_UEBERSICHT): while
 * one is open, the Übersicht is where the reader is — its crumb says „Übersicht › Nachfrage“ too.
 */
export const BENEATH_UEBERSICHT = ['/admin/nachfrage']
