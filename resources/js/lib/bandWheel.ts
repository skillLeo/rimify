/**
 * The photographed wheel in the dark band (PROTECTED.md P6, the client's #9), for the desktop band and the phone's.
 *
 * The cut-out is placed in the band's square so that the wheel — not the picture's frame — fills it and sits at its
 * centre: the square turns about its centre, so the wheel turns about its own axle and does not wobble.
 */

import type { BandWheel } from '../types/pages'

/** How much of the square the wheel's diameter takes. */
export const BAND_WHEEL_FILL = 0.92

/** The picture's box inside the square, in percent: scaled so the wheel fills it, moved so the wheel's centre is its centre. */
export function bandWheelStyle(wheel: BandWheel, fill = BAND_WHEEL_FILL): Record<string, string> {
    const width = fill / (2 * wheel.anchor.r)
    const height = (width * wheel.image.height) / wheel.image.width
    const pct = (value: number) => `${Math.round(value * 10000) / 100}%`

    return {
        width: pct(width),
        left: pct(0.5 - wheel.anchor.x * width),
        top: pct(0.5 - wheel.anchor.y * height),
    }
}

/** `BORBET DB8GT2 in Bronze matt, Ansicht von vorn` */
export function bandWheelAlt(wheel: BandWheel): string {
    return `${wheel.brand} ${wheel.name} in ${wheel.finish}, Ansicht von vorn`
}

/** `Felge im Bild: BORBET DB8GT2, Bronze matt` — the band is about Kompletträder; the photograph shows the rim. */
export function bandWheelCaption(wheel: BandWheel): string {
    return `Felge im Bild: ${wheel.brand} ${wheel.name}, ${wheel.finish}`
}
