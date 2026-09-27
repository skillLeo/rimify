/**
 * The admin's own icons (docs/admin/rest-build-plan.md, „Übersicht und Shell“ step G).
 *
 * One hand, one grid: a 20-unit square, a 1.5-unit stroke, square caps, mitre joins, no fills and no
 * second weight. The live area is 2.75–17.25, so every glyph has the same optical size, and shapes sit
 * on the cap height of the 14 px text beside them. `currentColor` throughout.
 *
 * Each object is itself, not a gear standing in for it: Versand is a parcel, Zahlung a card, Steuern a
 * receipt, Einstellungen sliders, Rollen a key. Every glyph reads without its label at 20 px, and no
 * two rail items share one — the collapsed rail is icons only.
 *
 * The storefront keeps its own set (resources/js/icons); nothing in the admin draws from it.
 */

const G = {
    // ── Verkauf ─────────────────────────────────────────────────────────────────────────────────
    overview: '<rect x="2.75" y="2.75" width="6.5" height="8.5"/><rect x="10.75" y="2.75" width="6.5" height="4.5"/><rect x="10.75" y="8.75" width="6.5" height="8.5"/><rect x="2.75" y="12.75" width="6.5" height="4.5"/>',
    orders: '<path d="M3.75 6.75h12.5l-1 10.5h-10.5z"/><path d="M7.25 8.75v-3a2.75 2.75 0 0 1 5.5 0v3"/>',
    returns: '<path d="M6.75 3.75l-3.5 3.5 3.5 3.5"/><path d="M3.75 7.25h8.5a4.5 4.5 0 0 1 0 9h-4.5"/>',
    customers: '<circle cx="7.5" cy="7" r="2.75"/><path d="M2.75 16.75v-.5a4.75 4.75 0 0 1 9.5 0v.5"/><path d="M12.75 4.5a2.75 2.75 0 0 1 0 5"/><path d="M14.5 11.75a4.75 4.75 0 0 1 2.75 4.5v.5"/>',
    inquiries: '<path d="M2.75 10.75h4l1 2h4.5l1-2h4"/><path d="M2.75 10.75l2-7h10.5l2 7v5.5h-14.5z"/>',

    // ── Katalog ─────────────────────────────────────────────────────────────────────────────────
    wheels: '<circle cx="10" cy="10" r="7.25"/><circle cx="10" cy="10" r="2"/><path d="M10 8V2.75M11.9 9.38l5-1.62M11.18 11.62l3.08 4.25M8.82 11.62l-3.08 4.25M8.1 9.38l-5-1.62"/>',
    // A tyre from the front — its tread — so it can never be read as a gear, nor as the rim beside it.
    tyres: '<rect x="5.25" y="2.75" width="9.5" height="14.5" rx="2.5"/><path d="M8.5 2.75v14.5M11.5 2.75v14.5M5.25 6.25h1.5M5.25 10h1.5M5.25 13.75h1.5M13.25 6.25h1.5M13.25 10h1.5M13.25 13.75h1.5"/>',
    // The rim inside its tyre: spokes stop at the rim, the band around them is the tyre.
    'complete-wheels': '<circle cx="10" cy="10" r="7.25"/><circle cx="10" cy="10" r="4.75"/><circle cx="10" cy="10" r="1.25"/><path d="M10 8.75v-3.5M11.19 9.61l3.33-1.08M10.73 11.01l2.06 2.83M9.27 11.01l-2.06 2.83M8.81 9.61l-3.33-1.08"/>',
    brands: '<path d="M3.25 3.25h6.5l7.5 7.5-6.5 6.5-7.5-7.5z"/><circle cx="6.75" cy="6.75" r="1.25"/>',
    stock: '<rect x="2.75" y="10.75" width="6.5" height="6.5"/><rect x="10.75" y="10.75" width="6.5" height="6.5"/><rect x="6.75" y="2.75" width="6.5" height="6.5"/>',
    prices: '<path d="M15.25 5.8a5.5 5.5 0 1 0 0 8.4"/><path d="M3.75 8.75h7.5M3.75 11.25h7.5"/>',
    media: '<rect x="2.75" y="3.75" width="14.5" height="12.5"/><path d="M2.75 14.25l4.5-4.5 4 4 2-2 4 4"/><circle cx="13" cy="7.5" r="1.25"/>',

    // ── Gutachten und Fahrzeuge ─────────────────────────────────────────────────────────────────
    documents: '<path d="M4.75 2.75h7l3.5 3.5v11h-10.5z"/><path d="M11.75 2.75v3.5h3.5M7.25 10.25h5.5M7.25 13.25h5.5"/>',
    conditions: '<path d="M2.75 5.25l1.25 1.25 2.5-2.5M2.75 11.25l1.25 1.25 2.5-2.5"/><path d="M9.25 5.25h8M9.25 11.25h8M9.25 16.25h8M3.75 16.25h2"/>',
    coverage: '<rect x="2.75" y="2.75" width="14.5" height="14.5"/><path d="M7.58 2.75v14.5M12.42 2.75v14.5M2.75 7.58h14.5M2.75 12.42h14.5"/>',
    conflicts: '<path d="M2.75 3.75v12.5M17.25 3.75v12.5"/><path d="M11 4.25l-3.5 6h5l-3.5 5.5"/>',
    vehicles: '<path d="M4.25 13.75h-1.5v-3l2-1 2-4h6l2.5 4 2 1v3h-1.5M7.75 13.75h4.5M4.75 9.75h10.5"/><circle cx="6" cy="13.75" r="1.75"/><circle cx="14" cy="13.75" r="1.75"/>',
    review: '<path d="M7.25 3.75h-3v13.5h11.5v-13.5h-3"/><rect x="7.25" y="2.75" width="5.5" height="2.5"/><path d="M7 11l2 2 4-4"/>',
    imports: '<path d="M3.25 11.75v5h13.5v-5"/><path d="M10 2.75v9.5M6.5 8.75l3.5 3.5 3.5-3.5"/>',

    // ── Inhalte ─────────────────────────────────────────────────────────────────────────────────
    pages: '<rect x="2.75" y="3.25" width="14.5" height="13.5"/><path d="M2.75 6.75h14.5M5.75 10.25h8.5M5.75 13.25h5.5"/>',
    guides: '<path d="M2.75 4.25h4a3.25 3.25 0 0 1 3.25 3.25v9.25a2.25 2.25 0 0 0-2.25-2.25h-5z"/><path d="M17.25 4.25h-4A3.25 3.25 0 0 0 10 7.5v9.25a2.25 2.25 0 0 1 2.25-2.25h5z"/>',
    faq: '<path d="M2.75 3.25h14.5v10.5h-7.5l-4 3v-3h-3z"/><path d="M8.25 6.75a1.75 1.75 0 1 1 2.5 1.6c-.5.25-.75.6-.75 1.15v.25"/><circle cx="10" cy="11.5" r=".4"/>',
    navigation: '<path d="M2.75 4.25h14.5M4.25 4.25v11M4.25 9.75h2.5M4.25 15.25h2.5M9.25 9.75h8M9.25 15.25h8"/>',
    legal: '<path d="M10 3v13.75M6.5 16.75h7M4 5.75h12"/><path d="M4 5.75l-1.75 5M4 5.75l1.75 5M16 5.75l-1.75 5M16 5.75l1.75 5"/><path d="M2.25 10.75h3.5a1.75 1.75 0 0 1-3.5 0zM14.25 10.75h3.5a1.75 1.75 0 0 1-3.5 0z"/>',

    // ── Auswertungen ────────────────────────────────────────────────────────────────────────────
    reports: '<path d="M2.75 2.75v14.5h14.5"/><path d="M6.75 14.25v-4M10.25 14.25v-8M13.75 14.25v-5.5"/>',
    // A rim drawn in dashes: the wheel that is not there. Never a prohibition sign — that reads as Nicht freigegeben.
    gap: '<circle cx="10" cy="10" r="7.25" stroke-dasharray="2.5 2"/><circle cx="10" cy="10" r="2"/>',

    // ── Einstellungen ───────────────────────────────────────────────────────────────────────────
    settings: '<path d="M2.75 5.25h6.5M12.75 5.25h4.5M2.75 10h1.5M7.75 10h9.5M2.75 14.75h9.5M15.75 14.75h1.5"/><circle cx="11" cy="5.25" r="1.75"/><circle cx="6" cy="10" r="1.75"/><circle cx="14" cy="14.75" r="1.75"/>',
    branding: '<path d="M10 2.75l5.25 5.25-2.5 8.25h-5.5l-2.5-8.25z"/><path d="M10 2.75v6.5M7.25 16.25h5.5"/><circle cx="10" cy="10.75" r="1.5"/>',
    shipping: '<path d="M10 2.75l6.75 3.5v7.5L10 17.25l-6.75-3.5v-7.5z"/><path d="M3.25 6.25L10 9.75l6.75-3.5M10 9.75v7.5M6.5 4.5l6.75 3.5"/>',
    payment: '<rect x="2.75" y="4.75" width="14.5" height="10.5"/><path d="M2.75 7.75h14.5M2.75 9.5h14.5M5.25 12.75h3"/>',
    taxes: '<path d="M4.75 2.75h10.5v14.5l-1.75-1.25-1.75 1.25-1.75-1.25-1.75 1.25-1.75-1.25-1.75 1.25z"/><path d="M7.25 6.75h5.5M7.25 9.75h5.5M7.25 12.75h3"/>',
    emails: '<rect x="2.75" y="4.75" width="14.5" height="10.5"/><path d="M2.75 4.75L10 10.75l7.25-6"/>',
    'feature-flags': '<rect x="2.75" y="6.25" width="14.5" height="7.5" rx="3.75"/><circle cx="13.5" cy="10" r="2"/>',

    // ── Team und System ─────────────────────────────────────────────────────────────────────────
    users: '<circle cx="10" cy="6.75" r="3.25"/><path d="M3.75 17.25v-.75a4.5 4.5 0 0 1 4.5-4.5h3.5a4.5 4.5 0 0 1 4.5 4.5v.75"/>',
    roles: '<circle cx="6.75" cy="13.25" r="3.5"/><path d="M9.25 10.75l7.5-7.5M13.75 6.25l2 2M15.75 4.25l1.5 1.5"/>',
    'audit-log': '<path d="M3.25 10a6.75 6.75 0 1 0 2-4.8"/><path d="M3 3.25v2.75h2.75M10 6.25v4l2.75 1.75"/>',
    system: '<rect x="2.75" y="3.25" width="14.5" height="5.5"/><rect x="2.75" y="11.25" width="14.5" height="5.5"/><path d="M5.5 6h1M5.5 14h1M12.25 6h2.5M12.25 14h2.5"/>',
    queue: '<path d="M5.25 2.75h9.5M5.25 17.25h9.5M6.25 2.75v2.5L10 10l-3.75 4.75v2.5M13.75 2.75v2.5L10 10l3.75 4.75v2.5"/>',

    // ── Row actions ─────────────────────────────────────────────────────────────────────────────
    edit: '<path d="M12.75 3.75l3.5 3.5-9 9h-3.5v-3.5z"/><path d="M10.75 5.75l3.5 3.5"/>',
    duplicate: '<rect x="6.75" y="6.75" width="10.5" height="10.5"/><path d="M13.25 6.75v-4H2.75v10.5h4"/>',
    delete: '<path d="M3.25 5.25h13.5M7.75 5.25v-2.5h4.5v2.5M4.75 5.25l.75 12h9l.75-12M8.25 8.75v5M11.75 8.75v5"/>',
    publish: '<circle cx="10" cy="10" r="7.25"/><path d="M2.75 10h14.5"/><path d="M10 2.75c-2 2-3 4.5-3 7.25s1 5.25 3 7.25c2-2 3-4.5 3-7.25s-1-5.25-3-7.25z"/>',
    export: '<path d="M3.25 11.75v5h13.5v-5"/><path d="M10 12.25V3M6.5 6.25L10 2.75l3.5 3.5"/>',
    more: '<circle cx="4.75" cy="10" r=".75"/><circle cx="10" cy="10" r=".75"/><circle cx="15.25" cy="10" r=".75"/>',

    // ── The frame's own controls ────────────────────────────────────────────────────────────────
    search: '<circle cx="8.75" cy="8.75" r="5.5"/><path d="M12.75 12.75l4.5 4.5"/>',
    bell: '<path d="M5.25 13.75v-5a4.75 4.75 0 0 1 9.5 0v5l1.5 1.5H3.75z"/><path d="M8.25 17.25h3.5"/>',
    help: '<circle cx="10" cy="10" r="7.25"/><path d="M7.75 8a2.25 2.25 0 1 1 3.25 2c-.75.4-1 .9-1 1.5v.25"/><circle cx="10" cy="14.25" r=".4"/>',
    info: '<circle cx="10" cy="10" r="7.25"/><path d="M10 9.25v4.75"/><circle cx="10" cy="6.5" r=".4"/>',
    warning: '<path d="M10 2.75l7.5 13.5h-15z"/><path d="M10 8v3.5"/><circle cx="10" cy="13.75" r=".4"/>',
    check: '<path d="M4.25 10.25l4 4 7.5-8"/>',
    'check-circle': '<circle cx="10" cy="10" r="7.25"/><path d="M6.75 10.25l2.25 2.25 4.25-4.5"/>',
    close: '<path d="M4.75 4.75l10.5 10.5M15.25 4.75l-10.5 10.5"/>',
    plus: '<path d="M10 3.75v12.5M3.75 10h12.5"/>',
    minus: '<path d="M3.75 10h12.5"/>',
    'chevron-down': '<path d="M5.75 8L10 12.25 14.25 8"/>',
    'chevron-up': '<path d="M5.75 12.25L10 8l4.25 4.25"/>',
    'chevron-left': '<path d="M12.25 5.75L8 10l4.25 4.25"/>',
    'chevron-right': '<path d="M8 5.75L12.25 10 8 14.25"/>',
    'arrow-right': '<path d="M3.75 10H16M11.75 5.75L16 10l-4.25 4.25"/>',
    'arrow-up': '<path d="M10 16.25V4M5.75 8.25L10 4l4.25 4.25"/>',
    'arrow-down': '<path d="M10 3.75V16M5.75 11.75L10 16l4.25-4.25"/>',
    calendar: '<rect x="2.75" y="4.25" width="14.5" height="13"/><path d="M2.75 8.25h14.5M6.75 2.75v3M13.25 2.75v3"/>',
    clock: '<circle cx="10" cy="10" r="7.25"/><path d="M10 5.75V10l3 2"/>',
    eye: '<path d="M2.25 10Q10 2.5 17.75 10 10 17.5 2.25 10z"/><circle cx="10" cy="10" r="2.5"/>',
    'eye-off': '<path d="M2.25 10Q10 2.5 17.75 10 10 17.5 2.25 10z"/><circle cx="10" cy="10" r="2.5"/><path d="M3.25 3.25l13.5 13.5"/>',
    filter: '<path d="M2.75 3.75h14.5l-5.5 6.5v6l-3.5-2v-4z"/>',
    sort: '<path d="M6.25 3.75v12.5M3.25 6.75l3-3 3 3M13.75 16.25V3.75M10.75 13.25l3 3 3-3"/>',
    keyboard: '<rect x="1.75" y="5.25" width="16.5" height="9.5"/><path d="M6.75 11.75h6.5"/><circle cx="5" cy="8.5" r=".4"/><circle cx="8.33" cy="8.5" r=".4"/><circle cx="11.67" cy="8.5" r=".4"/><circle cx="15" cy="8.5" r=".4"/>',
    logout: '<path d="M8.25 3.25h-5v13.5h5M7.75 10h9M13.25 6.5l3.5 3.5-3.5 3.5"/>',
    lock: '<rect x="4.25" y="8.75" width="11.5" height="8.5"/><path d="M6.75 8.75v-2.5a3.25 3.25 0 0 1 6.5 0v2.5M10 12v2"/>',
    shield: '<path d="M10 2.75l6.25 2.25v4.75c0 3.75-2.75 6.25-6.25 7.5-3.5-1.25-6.25-3.75-6.25-7.5V5z"/><path d="M7.25 10l2 2 3.5-3.5"/>',
    menu: '<path d="M3 5.75h14M3 10h14M3 14.25h14"/>',
    print: '<path d="M5.75 7.25v-4.5h8.5v4.5"/><path d="M5.75 13.75h-3v-6.5h14.5v6.5h-3"/><rect x="5.75" y="11.75" width="8.5" height="5.5"/>',
    table: '<rect x="2.75" y="3.75" width="14.5" height="12.5"/><path d="M2.75 7.75h14.5M2.75 12h14.5M8 7.75v8.5"/>',
    chart: '<path d="M2.75 14.25l4.5-5 3.5 3 6.5-7.5"/><path d="M2.75 17.25h14.5"/>',
    // A list's Spaltenwahl: three columns in a frame, no rows.
    columns: '<rect x="2.75" y="3.75" width="14.5" height="12.5"/><path d="M7.58 3.75v12.5M12.42 3.75v12.5"/>',
    // A Gespeicherte Ansicht: the bookmark it is kept under.
    bookmark: '<path d="M5.25 2.75h9.5v14.5L10 13.25l-4.75 4z"/>',
} as const

export type AdminIconName = keyof typeof G

export const ADMIN_ICON_NAMES = Object.keys(G) as AdminIconName[]

/** The icons the rail can carry: one per object in the brief's list, plus the rail's own few. */
export const NAV_ICONS = [
    'overview', 'orders', 'returns', 'customers', 'inquiries', 'wheels', 'tyres', 'complete-wheels', 'brands', 'stock',
    'prices', 'media', 'documents', 'conditions', 'coverage', 'conflicts', 'vehicles', 'review', 'imports', 'pages',
    'guides', 'faq', 'navigation', 'legal', 'reports', 'gap', 'settings', 'branding', 'shipping', 'payment', 'taxes',
    'emails', 'feature-flags', 'users', 'roles', 'audit-log', 'system', 'queue', 'search', 'filter',
] as const satisfies readonly AdminIconName[]

/** What a row of a list can do to its record. */
export const ROW_ACTION_ICONS = ['edit', 'duplicate', 'delete', 'publish', 'export', 'more'] as const satisfies readonly AdminIconName[]

export function isAdminIconName(name: string): name is AdminIconName {
    return Object.prototype.hasOwnProperty.call(G, name)
}

export function adminIconMarkup(name: AdminIconName): string {
    return G[name]
}
