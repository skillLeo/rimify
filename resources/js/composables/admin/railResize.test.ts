import { describe, expect, it } from 'vitest'
import { RAIL, clampWidth, dragTo, fits, keyTo, labelMode, railSentence, roomFor } from './railResize'

/*
 * The rail's width: the magnets at 260 and 320, the range 232–400, collapse below 200, open again past
 * 120 at the width it had, the content's 960 px, the keys, and the short labels below 248.
 */

const open = (width: number) => ({ collapsed: false, width })

describe('dragging', () => {
    it('snaps to 260 and to 320 within 8 px, and tells which it caught', () => {
        expect(dragTo(253, open(300))).toMatchObject({ collapsed: false, width: 260, holding: false, snapped: 260 })
        expect(dragTo(268, open(300))).toMatchObject({ width: 260, snapped: 260 })
        expect(dragTo(313, open(300))).toMatchObject({ width: 320, snapped: 320 })
        expect(dragTo(328, open(300))).toMatchObject({ width: 320, snapped: 320 })
        // Just outside the pull: free.
        expect(dragTo(269, open(300))).toMatchObject({ width: 269, snapped: null })
        expect(dragTo(329, open(300))).toMatchObject({ width: 329, snapped: null })
    })

    it('stops at 232 and at 400', () => {
        expect(dragTo(210, open(300))).toMatchObject({ collapsed: false, width: 232 })
        expect(dragTo(640, open(300))).toMatchObject({ collapsed: false, width: 400 })
    })

    it('collapses below 200, keeping the width to open to again', () => {
        expect(dragTo(199, open(320))).toMatchObject({ collapsed: true, width: 320, holding: false, snapped: null })
        expect(dragTo(200, open(320))).toMatchObject({ collapsed: false, width: 232 })
    })

    it('opens past 120 at the width it had, and holds there until the pointer reaches it', () => {
        const collapsed = { collapsed: true, width: 320 }

        expect(dragTo(120, collapsed)).toMatchObject({ collapsed: true })

        const opened = dragTo(121, collapsed)
        expect(opened).toMatchObject({ collapsed: false, width: 320, holding: true, snapped: null })

        // Still short of 320: the rail stays open at 320 rather than collapsing under the pointer.
        expect(dragTo(180, opened)).toMatchObject({ collapsed: false, width: 320, holding: true })
        // Back under 120: collapsed again.
        expect(dragTo(110, opened)).toMatchObject({ collapsed: true, width: 320 })
        // Reached: it follows the pointer from here.
        expect(dragTo(350, opened)).toMatchObject({ collapsed: false, width: 350, holding: false })
    })

    it('opens again at the width the collapsing drag started from, not at the 232 it shrank to', () => {
        // A drag from 330: through 232 on the way in, collapsed below 200.
        const shrunk = dragTo(210, { ...open(330), origin: 330 })
        expect(shrunk).toMatchObject({ width: 232 })

        const collapsed = dragTo(190, shrunk)
        expect(collapsed).toMatchObject({ collapsed: true, width: 330 })
    })

    it('opens only when dragged outward: a rail collapsing under a pointer still moving in stays shut', () => {
        // Collapsed at 199 px, the pointer carries on inward to 150 px — past 120, but moving in.
        const collapsed = dragTo(199, { ...open(330), pointer: 210 })
        expect(collapsed).toMatchObject({ collapsed: true, pointer: 199 })
        expect(dragTo(150, collapsed)).toMatchObject({ collapsed: true, width: 330 })

        // Moving out again past 120 px: it opens at the width it had.
        expect(dragTo(170, { ...collapsed, pointer: 150 })).toMatchObject({ collapsed: false, width: 330, holding: true })
    })

    it('never leaves the content less than 960 px', () => {
        // 1280 px: room for 320 at most — and the magnet at 320 still works.
        expect(roomFor(1280)).toBe(320)
        expect(dragTo(390, open(260), 1280)).toMatchObject({ width: 320 })
        // 1180 px: not even room for 232 — the rail stays collapsed.
        expect(dragTo(300, open(260), 1180)).toMatchObject({ collapsed: true })
        expect(dragTo(300, { collapsed: true, width: 260 }, 1180)).toMatchObject({ collapsed: true })
        expect(fits(260, 1220)).toBe(true)
        expect(fits(260, 1219)).toBe(false)
    })
})

describe('the keys', () => {
    it('move it 16 px, 48 with Shift, within the range', () => {
        expect(keyTo('ArrowRight', false, open(260))).toEqual(open(276))
        expect(keyTo('ArrowRight', true, open(260))).toEqual(open(308))
        expect(keyTo('ArrowLeft', false, open(240))).toEqual(open(232))
        expect(keyTo('ArrowRight', true, open(380))).toEqual(open(400))
    })

    it('Home is the default, End the widest the window allows', () => {
        expect(keyTo('Home', false, open(372))).toEqual(open(RAIL.default))
        expect(keyTo('End', false, open(260))).toEqual(open(400))
        expect(keyTo('End', false, open(260), 1250)).toEqual(open(290))
    })

    it('Enter and Space collapse and open it; nothing else does', () => {
        expect(keyTo('Enter', false, open(320))).toEqual({ collapsed: true, width: 320 })
        expect(keyTo(' ', false, { collapsed: true, width: 320 })).toEqual(open(320))
        expect(keyTo('ArrowLeft', false, open(232))).toEqual(open(232))
        expect(keyTo('Tab', false, open(260))).toBeNull()
    })
})

describe('the labels and the words', () => {
    it('switches the group labels to their short form below 248 px', () => {
        expect(labelMode(247)).toBe('short')
        expect(labelMode(248)).toBe('full')
        expect(labelMode(232)).toBe('short')
    })

    it('says the result, not the pixels on the way', () => {
        expect(railSentence(open(320))).toBe('Seitenleiste 320 Pixel breit')
        expect(railSentence({ collapsed: true, width: 320 })).toBe('Seitenleiste eingeklappt')
    })

    it('reads a stored width only when it is one', () => {
        expect(clampWidth(300)).toBe(300)
        expect(clampWidth(500)).toBe(260)
        expect(clampWidth('300')).toBe(260)
        expect(clampWidth(undefined)).toBe(260)
    })
})
