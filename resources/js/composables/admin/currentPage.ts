/**
 * Whether a rail page is where the reader is. A page is current on its own path and on every record
 * beneath it — /admin/seiten/7 is still Seiten — so the rail, the tab bar and the palette keep their
 * place while one record is open. Übersicht is /admin itself and nothing below it, or it would be
 * current everywhere.
 */
export function isCurrentPage(href: string, path: string): boolean {
    return href === path || (href !== '/admin' && path.startsWith(`${href}/`))
}
