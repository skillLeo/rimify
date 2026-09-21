/**
 * Photography for the storefront, served from our own origin (`public/images`).
 *
 * ## Placeholders, deliberately
 *
 * These are review placeholders until the client's own photography arrives. They are real
 * photographs of real wheels and workshops, chosen for composition, but they are not RIMIFY's
 * products: a product photograph on a card shows a wheel of the same character, not the exact
 * model. The client replaces them file by file; nothing else changes.
 *
 * ## Why local files
 *
 * A third-party image host costs a DNS lookup, a TLS handshake and — on the download endpoints —
 * a redirect per photograph, and it throttles. Files on our origin arrive with the page, are
 * cached with it, and need no widening of the Content-Security-Policy.
 */

export interface Photo {
    /** Same-origin path. Sized per slot so the phone does not download a 2000px hero. */
    readonly url: string
    /**
     * Empty string means decorative, and the component then sets `aria-hidden`. A photograph that
     * carries meaning gets a real German alt; the drawn art it replaces follows the same rule, so
     * the two are interchangeable to a screen reader.
     */
    readonly alt: string
    /** `object-position`, where the subject sits off-centre and a naive crop would behead it. */
    readonly position?: string
    /** What this photograph actually shows, verified by looking at it. */
    readonly shows: string
}

/** Every URL is built through here so a moved folder is one change. */
function photo(file: string, alt: string, shows: string, position?: string): Photo {
    return {
        url: `/images/${file}`,
        alt,
        shows,
        ...(position === undefined ? {} : { position }),
    }
}

export const PHOTOS = {
    /*
     * The hero is the LCP element. It is painted, never faded in, and a left-to-right scrim runs
     * over it — so the left third must be dark and must not carry the subject, and the wheel must
     * stay visible because this is a wheel shop.
     */
    heroDesktop: photo(
        'hero.jpg',
        '',
        'Dark studio front three-quarter of a performance car, headlight lit, near-black left side',
        '60% center'
    ),

    /** The same scene at 4:5 with a top-to-bottom scrim; a tighter composition survives portrait. */
    heroMobile: photo(
        'hero-mobile.jpg',
        '',
        'Front three-quarter at dusk, wheels prominent, dark surroundings',
        'center 40%'
    ),

    /** Homepage, "Dein Vorteil: RIMIFY-CHECK": wheel and body both clearly separated. */
    checkBlock: photo(
        'check-car.jpg',
        'Vorderrad und Karosserie eines Sportwagens in der Seitenansicht',
        'Side view of a coupé cropped low, front wheel and body panel both clearly readable'
    ),

    /** The RIMIFY-CHECK page hero, behind the full-bleed blue panel. */
    checkHero: photo(
        'check-car.jpg',
        '',
        'Side view of a coupé, both wheels clearly visible'
    ),

    /** "Dein Felgenpaket": racked stock, repetition and depth. */
    lager: photo(
        'lager.jpg',
        'Gestapelte Reifen im Lager',
        'Rows of new tyres stacked in a warehouse, cool light, strong receding repetition'
    ),

    /** The FAQ help card. Hands and tools only; faces and teams are banned. */
    werkstatt: photo(
        'werkstatt.jpg',
        'Hände mit Werkzeug an einem Fahrzeug in der Werkstatt',
        "A mechanic's hands with a wrench on dark machinery, warm key light, no face in frame"
    ),

    /** Kontakt: a real workshop, and nobody in it at all. */
    kontakt: photo(
        'werkstatt.jpg',
        'Werkstatt mit Werkzeug',
        'Workshop, utilitarian, no people'
    ),
} as const

/**
 * Brand card backdrops, 16:9, behind the wordmark. Keyed by brand slug with a fallback, so a
 * brand the client adds later renders the drawn gradient rather than breaking.
 */
export const BRAND_PHOTOS: Record<string, Photo> = {
    borbet: photo('banner-1.jpg', '', 'Dark wheel close-up, deep shadow across the left of the frame'),
    'oz-racing': photo('banner-2.jpg', '', 'Studio wheel detail with a single cold light source'),
    alutec: photo('banner-3.jpg', '', 'Wheel and brake detail, dark metal, strong texture'),
    bbs: photo('banner-4.jpg', '', 'Wheel under dramatic directional light'),
    yido: photo('banner-1.jpg', '', 'Dark wheel close-up'),
    rotiform: photo('banner-2.jpg', '', 'Studio wheel detail'),
}

export function brandPhoto(slug: string): Photo | null {
    return BRAND_PHOTOS[slug] ?? null
}

/** Product placeholders: six wheel photographs, assigned deterministically per model. */
const PRODUCT_FILES = ['wheel-1.jpg', 'wheel-2.jpg', 'wheel-3.jpg', 'wheel-4.jpg', 'wheel-5.jpg', 'wheel-6.jpg']

export function productPhoto(modelId: number, alt: string): Photo {
    const file = PRODUCT_FILES[Math.abs(modelId) % PRODUCT_FILES.length] ?? 'wheel-1.jpg'

    return photo(file, alt, 'Alloy wheel, three-quarter view, neutral background')
}
