/**
 * The hero's four spec values, matched to their slots by what the label says — the same table the
 * desktop hero uses (`Components/Home/HomeHero.vue`, `SLOTS`), so a server that renames a label
 * (*Felgengröße* → *Breite × Durchmesser*) moves nothing on either document. A label no pattern
 * knows falls into the next free slot in the order shipped, as on the desktop.
 *
 * The phone frame shows the first two slots as callouts on the wheel and the other two as one
 * line beneath it; the target of each leader line is the manifest's calibrated point, mapped
 * from the desktop frame's geometry into the phone frame's.
 */

export type SlotKey = 'widthDiameter' | 'offset' | 'boltCircle' | 'centreBore'

export interface SpecEntry {
    label: string
    value: string
}

export interface AssignedSlot extends SpecEntry {
    key: SlotKey
}

export interface Target {
    tx: number
    ty: number
}

export type Targets = Record<SlotKey, Target>

/** Label patterns per slot; the order is the fallback order for labels no pattern matches. */
export const CALLOUT_SLOTS: readonly { key: SlotKey; label: RegExp }[] = [
    { key: 'widthDiameter', label: /größe|breite|durchmesser/i },
    { key: 'offset', label: /einpress|\bET\b/i },
    { key: 'boltCircle', label: /lochkreis|\bLK\b/i },
    { key: 'centreBore', label: /mittenloch|\bMLB\b/i },
]

/** The two slots the phone frame points at; the other two read as one line under the frame. */
export const FRAME_SLOTS: readonly SlotKey[] = ['widthDiameter', 'offset']

/** The short form a value carries in the line under the frame: `LK 5 × 112 · MLB 66,6 mm`. */
export const SHORT_LABEL: Readonly<Record<SlotKey, string>> = {
    widthDiameter: 'Größe',
    offset: 'ET',
    boltCircle: 'LK',
    centreBore: 'MLB',
}

/** The slot a label belongs to, or null when no pattern knows it. */
export function slotFor(label: string): SlotKey | null {
    return CALLOUT_SLOTS.find((slot) => slot.label.test(label))?.key ?? null
}

/**
 * Every shipped value on its slot: matched by label first, else the next free slot in shipping
 * order. A fifth value has nowhere to go and is dropped, never doubled onto a slot.
 */
export function assignSlots(spec: readonly SpecEntry[]): AssignedSlot[] {
    const free = [...CALLOUT_SLOTS]
    const out: AssignedSlot[] = []

    for (const entry of spec) {
        const at = free.findIndex((slot) => slot.label.test(entry.label))
        const slot = at >= 0 ? free.splice(at, 1)[0] : free.shift()

        if (slot === undefined) {
            break
        }

        out.push({ key: slot.key, label: entry.label, value: entry.value })
    }

    return out
}

/**
 * Where the wheel stands inside a frame: its width as a fraction of the frame's width, its bottom
 * edge as a fraction of the frame's height from the top, and the frame's width / height ratio.
 * The cut-out is square, so its height in frame terms is `width × ratio`.
 */
export interface FrameGeometry {
    wheelWidth: number
    wheelBottom: number
    ratio: number
}

/** The desktop stage at ≥ 1024 (`HomeHero.vue`: 5 / 4, wheel 66 %, bottom edge at 84 %), where the manifest's targets were calibrated. */
export const DESKTOP_FRAME: FrameGeometry = { wheelWidth: 0.66, wheelBottom: 0.84, ratio: 5 / 4 }

/** The phone frame (`HeroFrame.vue`: 7 / 6, wheel 70 %, bottom edge at 84 %). */
export const PHONE_FRAME: FrameGeometry = { wheelWidth: 0.7, wheelBottom: 0.84, ratio: 7 / 6 }

/** The calibrated points for the current cut-out, used when a manifest carries none. */
export const DEFAULT_TARGETS: Targets = {
    widthDiameter: { tx: 35, ty: 11 },
    offset: { tx: 59, ty: 41 },
    boltCircle: { tx: 59, ty: 50 },
    centreBore: { tx: 50, ty: 44 },
}

/**
 * A point given in one frame's percentages, expressed in another frame's — via the wheel's own
 * box, which is the only thing the two frames share. Rounded to whole percent, as the manifest is.
 */
export function mapTarget(target: Target, from: FrameGeometry, to: FrameGeometry): Target {
    const fromLeft = (1 - from.wheelWidth) / 2
    const fromHeight = from.wheelWidth * from.ratio
    const fromTop = from.wheelBottom - fromHeight
    const u = (target.tx / 100 - fromLeft) / from.wheelWidth
    const v = (target.ty / 100 - fromTop) / fromHeight

    const toLeft = (1 - to.wheelWidth) / 2
    const toHeight = to.wheelWidth * to.ratio
    const toTop = to.wheelBottom - toHeight

    return {
        tx: Math.round((toLeft + u * to.wheelWidth) * 100),
        ty: Math.round((toTop + v * toHeight) * 100),
    }
}

/** All four targets of a manifest (or the defaults) in the phone frame's percentages. */
export function phoneTargets(targets: Partial<Targets> | undefined): Targets {
    const source: Targets = { ...DEFAULT_TARGETS, ...(targets ?? {}) }
    const out = {} as Targets

    for (const key of Object.keys(source) as SlotKey[]) {
        out[key] = mapTarget(source[key], DESKTOP_FRAME, PHONE_FRAME)
    }

    return out
}
