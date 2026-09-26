/** The sibling pages behind one rail item, for AdminSectionTabs — one list, so both pages agree. */

export interface SectionTab {
    label: string
    href: string
}

/**
 * Einstellungen › Zubehörpreise: what the extras on a Komplettrad cost. The page's `<h1>` is the
 * rail item's name; the tabs name only what differs, so the heading is never said twice.
 */
export const ZUBEHOER_TABS: SectionTab[] = [
    { label: 'Wuchtgewichte', href: '/admin/zubehoerpreise/wuchtgewichte' },
    { label: 'RDKS-Sensoren', href: '/admin/zubehoerpreise/rdks' },
]

/** The tabs behind each rail item that has them, by the item's href — so the palette finds each tab. */
export const SECTION_TABS: Readonly<Record<string, SectionTab[]>> = {
    '/admin/zubehoerpreise': ZUBEHOER_TABS,
}
