import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { BuildProp } from '../../types/rimify'

/*
 * QA „Letzte Runde (G)“, G-04 (S2) — docs/qa/BUGS.md.
 *
 * „Ändern“ opens the choice for one fact and puts the keyboard on its pressed option; „Abbrechen“ closes it by
 * removing itself (`changing = null`) and nothing takes the focus: it falls to <body>, and the next Tab starts at
 * the top of the page.
 */

const post = vi.fn()

vi.mock('@inertiajs/vue3', () => ({ router: { post: (...args: unknown[]) => post(...args) } }))

const { default: BuildForm } = await import('./BuildForm.vue')

const DERIVED: BuildProp = { bodyForm: 'Kombi', bodySource: 'name', bodyWord: 'Touring', driveAxle: null, driveSource: null, driveWord: null }

let mounted: VueWrapper[] = []

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    post.mockReset()
})

async function openChange(): Promise<VueWrapper> {
    const wrapper = mount(BuildForm, { props: { vehicleId: 82, build: DERIVED, missing: [] }, attachTo: document.body })
    mounted.push(wrapper)

    const change = wrapper.find('.bf__given button')
    ;(change.element as HTMLButtonElement).focus()
    await change.trigger('click')
    await nextTick()
    await nextTick()

    return wrapper
}

describe('G-04 · leaving „Ändern“ without a choice keeps the keyboard where it was', () => {
    it('„Abbrechen“ gives the focus back to the line it opened from, not to <body>', async () => {
        const wrapper = await openChange()
        const cancel = wrapper.find('.bf__cancel')

        expect(cancel.exists()).toBe(true)
        ;(cancel.element as HTMLButtonElement).focus()
        await cancel.trigger('click')
        await nextTick()
        await nextTick()

        expect(document.activeElement).not.toBe(document.body)
        expect(wrapper.element.contains(document.activeElement)).toBe(true)
    })
})
