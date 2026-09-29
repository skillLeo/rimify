import { describe, expect, it } from 'vitest'
import { RAIL, clampWidth, dragTo, effectiveRail, fitWidth, keyTo, labelMode, maxFit, nextRev, pageWidth, railSentence, toggleHint, toggleIntent } from './railResize'

/*
 * The rail's width: the magnets at 260 and 320, the range 232–400, collapse below 200, open again past
 * 120 at the width it had, the content's 960 px (the width shown as wide as the window allows, and a
 * window without room for the rail at all owning its collapse), the keys, and the short labels below 248.
 */

const open = (width: number) => ({ collapsed: false, width })

describe('dragging', () => {
    it('snaps to 260 and to 320 within 8 px, and tells which holds it', () => {
        expect(dragTo(253, open(300))).toMatchObject({ collapsed: false, width: 260, holding: false, magnet: 260 })
        expect(dragTo(268, open(300))).toMatchObject({ width: 260, magnet: 260 })
        expect(dragTo(313, open(300))).toMatchObject({ width: 320, magnet: 320 })
        expect(dragTo(328, open(300))).toMatchObject({ width: 320, magnet: 320 })
        // Just outside the pull: free.
        expect(dragTo(269, open(300))).toMatchObject({ width: 269, magnet: null })
        expect(dragTo(329, open(300))).toMatchObject({ width: 329, magnet: null })
    })

    it('holds a caught rail until the pointer is more than 12 px away — distance, not time', () => {
        const caught = dragTo(318, open(300))
        expect(caught).toMatchObject({ width: 320, magnet: 320 })

        // Past the 8 px that caught it, still inside the 12 that hold it: it stays.
        expect(dragTo(330, caught)).toMatchObject({ width: 320, magnet: 320 })
        expect(dragTo(309, caught)).toMatchObject({ width: 320, magnet: 320 })
        expect(dragTo(332, caught)).toMatchObject({ width: 320, magnet: 320 })

        // One pixel further: let go, and it follows the pointer.
        expect(dragTo(333, caught)).toMatchObject({ width: 333, magnet: null })
        expect(dragTo(307, caught)).toMatchObject({ width: 307, magnet: null })

        // Coming back from outside, only the 8 px catch it again — no flicker at the edge of the hold.
        const free = dragTo(333, caught)
        expect(dragTo(329, free)).toMatchObject({ width: 329, magnet: null })
        expect(dragTo(328, free)).toMatchObject({ width: 320, magnet: 320 })
    })

    it('stops at 232 and at 400', () => {
        expect(dragTo(210, open(300))).toMatchObject({ collapsed: false, width: 232 })
        expect(dragTo(640, open(300))).toMatchObject({ collapsed: false, width: 400 })
    })

    it('collapses below 200, keeping the width to open to again', () => {
        expect(dragTo(199, open(320))).toMatchObject({ collapsed: true, width: 320, holding: false, magnet: null })
        expect(dragTo(200, open(320))).toMatchObject({ collapsed: false, width: 232 })
    })

    it('opens past 120 at the width it had, and holds there until the pointer reaches it', () => {
        const collapsed = { collapsed: true, width: 320 }

        expect(dragTo(120, collapsed)).toMatchObject({ collapsed: true })

        const opened = dragTo(121, collapsed)
        expect(opened).toMatchObject({ collapsed: false, width: 320, holding: true, magnet: null })

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
        expect(maxFit(1280)).toBe(320)
        expect(dragTo(390, open(260), 1280)).toMatchObject({ width: 320 })
        // Opened in a narrower window than it was set in: as wide as there is room for.
        expect(dragTo(170, { collapsed: true, width: 400 }, 1280)).toMatchObject({ collapsed: false, width: 320 })
    })

    it('shows a stored width at the widest that fits, and keeps it for a wider window', () => {
        expect(fitWidth(400, 1280)).toBe(320)
        expect(fitWidth(260, 1200)).toBe(240)
        expect(fitWidth(260, 1440)).toBe(260)
    })

    it('fits the rail to the page without the scrollbar — which a headless browser never draws', () => {
        // A classic 17 px Windows scrollbar at 1237 px: 1220 px of page — exactly room for 260.
        expect(effectiveRail(open(260), pageWidth(1237, 17))).toMatchObject({ width: 260, clamped: false })
        // One pixel less of window: the rail gives way, the content keeps its 960 px.
        expect(effectiveRail(open(260), pageWidth(1236, 17))).toMatchObject({ width: 259, clamped: true })
        // Overlay scrollbars (0 px) leave the whole window.
        expect(effectiveRail(open(260), pageWidth(1220, 0))).toMatchObject({ width: 260 })
        // No room even for 232 px of rail beside the content: collapsed by the window.
        expect(effectiveRail(open(260), pageWidth(1208, 17))).toMatchObject({ collapsed: true, forced: true })
        expect(effectiveRail(open(260), pageWidth(1209, 17))).toMatchObject({ collapsed: false, forced: false, width: 232 })
    })

    it('changes nothing in a window with no room for the rail at all: that collapse is the window’s', () => {
        // 1100 px: not even room for 232. A drag neither collapses nor opens what the person chose.
        expect(dragTo(150, open(260), 1100)).toMatchObject({ collapsed: false, width: 260 })
        expect(dragTo(300, { collapsed: true, width: 260 }, 1100)).toMatchObject({ collapsed: true, width: 260 })
        expect(keyTo('Enter', false, open(260), 1100)).toBeNull()
        expect(keyTo('ArrowRight', false, open(260), 1100)).toBeNull()
    })
})

describe('the intent and what the window shows of it', () => {
    it('shows the intent as it is where nothing is known — on the server, below 1024 px', () => {
        expect(effectiveRail({ collapsed: false, width: 400 }, null)).toEqual({ collapsed: false, width: 400, forced: false, clamped: false, max: 400 })
    })

    it('collapses by the window without touching the intent, and opens at the stored width once there is room', () => {
        const intent = open(400)

        expect(effectiveRail(intent, 1100)).toMatchObject({ collapsed: true, forced: true, width: 400 })
        expect(effectiveRail(intent, 1280)).toMatchObject({ collapsed: false, width: 320, clamped: true, max: 320 })
        expect(effectiveRail(intent, 1440)).toMatchObject({ collapsed: false, width: 400, clamped: false })
    })

    it('toggles the one way the button, [ and Enter all do — and not at all where the window collapsed it', () => {
        expect(toggleIntent(open(400), 1280)).toEqual({ collapsed: true, width: 400 })
        // Opened on a narrow page, the stored width stays the person's: it is only shown narrower.
        expect(toggleIntent({ collapsed: true, width: 400 }, 1280)).toEqual({ collapsed: false, width: 400 })
        expect(toggleIntent(open(260), 1100)).toBeNull()
    })

    it('says in the toggle’s tooltip why it opens narrower, or not at all', () => {
        expect(toggleHint({ collapsed: true, width: 400 }, 1280)).toBe('Fenster zu schmal für 400 px, öffnet mit 320 px')
        expect(toggleHint(open(260), 1100)).toBe('Fenster zu schmal für die Seitenleiste')
        expect(toggleHint({ collapsed: true, width: 260 }, 1440)).toBeNull()
        expect(toggleHint(open(400), 1280)).toBeNull()
    })

    it('numbers every save higher than the last, even on a clock that stands still or runs back', () => {
        expect(nextRev(0, 1_700_000_000_000)).toBe(1_700_000_000_000)
        expect(nextRev(1_700_000_000_000, 1_700_000_000_000)).toBe(1_700_000_000_001)
        expect(nextRev(1_700_000_000_500, 1_700_000_000_000)).toBe(1_700_000_000_501)
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
