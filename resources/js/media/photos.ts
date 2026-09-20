/**
 * The photography manifest — ONE file, deliberately.
 *
 * ## Why this file exists and what it is not
 *
 * The build pack's rule 1 is that every visual ships as inline SVG: "External images cannot load
 * in this environment. A grey box with a picture icon is a failure." That is why `resources/js/art`
 * exists, and the drawn art remains the default and the fallback everywhere.
 *
 * This manifest layers photography on top so the client can review photographic compositions. It
 * is a REVIEW AID, not a shipping decision:
 *
 *   - These are Unsplash URLs. RIMIFY holds no licence to them. They must be replaced with the
 *     client's own licensed files, served from our own origin, before launch.
 *   - The whole layer switches off with `RIMIFY_STOCK_PHOTOGRAPHY=false`, which also narrows the
 *     CSP's `img-src` back to `'self' data: blob:`.
 *   - Every slot keeps its drawn version as the fallback, so a blocked, throttled or dead URL
 *     degrades to the wheel rather than to the grey box the build pack calls a failure.
 *
 * ## Where product imagery is NOT photography, and why
 *
 * Product cards, the PDP gallery, the basket lines and the tyre cards keep the drawn art. This is
 * not laziness — it is the only correct answer. `wheelSVG` is given the spoke count and finish of
 * the actual catalogue row, so the card depicts the SKU the customer is about to buy. A stock
 * photograph on a product card shows a DIFFERENT wheel, on a page whose entire promise is that
 * RIMIFY tells you the truth about what fits your car. It would also break the one crop logic,
 * one colour temperature, one contrast curve rule the moment two suppliers' photos sat side by
 * side in a grid.
 *
 * ## Provenance
 *
 * Chosen against each slot's written description in the page spec. Every URL below was fetched
 * and visually checked before being written here — not recalled, not assumed. These are review
 * placeholders; the client's own photography replaces them before launch.
 */

export interface Photo {
    /** Absolute URL. Sized per slot so the phone does not download a 2000px hero. */
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

const UNSPLASH = 'https://images.unsplash.com'

/** Every URL is built through here so the transform parameters cannot drift between slots. */
function photo(id: string, width: number, alt: string, shows: string, position?: string): Photo {
    return {
        url: `${UNSPLASH}/${id}?auto=format&fit=crop&w=${width}&q=80`,
        alt,
        shows,
        ...(position === undefined ? {} : { position }),
    }
}

export const PHOTOS = {
    /*
     * The hero is the LCP element. It is painted, never faded in, and a left-to-right scrim from
     * rgba(4,6,10,.94) runs over it — so the left third must be dark and must not carry the
     * subject, and the wheel must stay visible because this is a wheel shop.
     */
    heroDesktop: photo(
        'photo-1542282088-fe8426682b8f',
        2000,
        '',
        'Dark studio front three-quarter of a silver performance coupé, headlight lit, near-black left side',
        '60% center'
    ),

    /** The same scene at 4:5 with a top-to-bottom scrim; a tighter composition survives portrait. */
    heroMobile: photo(
        'photo-1580273916550-e323be2ae537',
        1200,
        '',
        'Silver BMW M4 front three-quarter at dusk, wheels prominent, dark surroundings',
        'center 40%'
    ),

    /*
     * Homepage §6, "Dein Vorteil: RIMIFY-CHECK". Two 1px blue connector lines end in 5px dots on
     * the wheel and on the body, so the composition needs both clearly separated — which is why
     * this is a side view rather than the front three-quarters used elsewhere.
     */
    checkBlock: photo(
        'photo-1502877338535-766e1452684a',
        1400,
        'Vorderrad und Karosserie eines Sportwagens in der Seitenansicht',
        'Side view of a BMW coupé cropped low, front wheel and body panel both clearly readable'
    ),

    /** The RIMIFY-CHECK page hero, behind the full-bleed blue panel. */
    checkHero: photo(
        'photo-1594502184342-2e12f877aa73',
        1600,
        '',
        'Silver Porsche 911 Turbo three-quarter under overcast light, both wheels clearly visible'
    ),

    /*
     * "Dein Felgenpaket" — the spec asks for "the warehouse photograph of stacked wheels,
     * full-bleed to the card edge", and the drawn version is stacked wheels in receding tonal
     * bands. Racked tyres carry the same repetition and depth.
     */
    lager: photo(
        'photo-1578844251758-2f71da64c96f',
        1400,
        'Gestapelte Reifen im Lager',
        'Rows of new tyres stacked in a warehouse, cool light, strong receding repetition'
    ),

    /*
     * The FAQ help card and the Kontakt page. This slot REPLACES the smiling-call-centre stock
     * photo the client's Figma used — the spec is explicit that faces and teams are banned and
     * that "an honest empty space beats a stock photo". Hands and tools only.
     */
    werkstatt: photo(
        'photo-1619642751034-765dfdf7c58e',
        1400,
        'Hände mit Werkzeug an einem Fahrzeug in der Werkstatt',
        "A mechanic's hands with a wrench on dark machinery, warm key light, no face in frame"
    ),

    /** Kontakt takes the wider establishing frame: a real workshop, and nobody in it at all. */
    kontakt: photo(
        'photo-1530046339160-ce3e530c7d2f',
        1400,
        'Werkstattwand mit Werkzeug',
        'Workshop wall of hung tools and suspension parts, utilitarian, no people'
    ),

    /** The compliance story: paper, a pen, a measurement. Never a handshake over a contract. */
    dokument: photo(
        'photo-1450101499163-c8848c66ca85',
        1200,
        'Technische Unterlagen werden ausgefüllt',
        'Hands writing on a technical document with a pencil, desaturated, no face'
    ),
} as const

/**
 * Brand card backdrops, 16:9, behind the drawn wheel and the white wordmark.
 *
 * Each needs a DARK LEFT SIDE, because 34px white type sits at the lower left and the drawn wheel
 * is cropped at the right edge. Keyed by brand slug with a fallback, so a brand the client adds
 * later renders the drawn gradient rather than breaking.
 */
export const BRAND_PHOTOS: Record<string, Photo> = {
    borbet: photo(
        'photo-1549399542-7e3f8b79c341',
        1400,
        '',
        'Dark coupé in a lit garage bay, deep shadow across the left of the frame'
    ),
    'oz-racing': photo(
        'photo-1542282088-fe8426682b8f',
        1400,
        '',
        'Near-black studio front of a silver coupé with a single cold light source'
    ),
    alutec: photo(
        'photo-1486262715619-67b85e0b08d3',
        1400,
        '',
        'Macro of engine belts and pulleys, dark oiled metal, strong texture'
    ),
    bbs: photo(
        'photo-1568844293986-8d0400bd4745',
        1400,
        '',
        'Coupé on a dark showroom stand under dramatic directional light'
    ),
    yido: photo(
        'photo-1567789884554-0b844b597180',
        1400,
        '',
        'Bare car body on a production line, industrial framing, cool grey'
    ),
    rotiform: photo(
        'photo-1504328345606-18bbc8c9d7d1',
        1400,
        '',
        'Welding sparks against a dark industrial background'
    ),
}

export function brandPhoto(slug: string): Photo | null {
    return BRAND_PHOTOS[slug] ?? null
}
