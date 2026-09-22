import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { CONSENT_COOKIE, provideConsent, type ConsentStore } from '../../composables/useConsent'
import type { ConsentProp } from '../../types/rimify'
import CookieConsent from './CookieConsent.vue'

let store: ConsentStore | null = null
let mounted: VueWrapper[] = []

function mountSheet(initial: ConsentProp | null = null): VueWrapper {
    const Host = defineComponent({
        setup() {
            store = provideConsent(initial)

            return () => h(CookieConsent)
        },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    mounted.push(wrapper)

    return wrapper
}

function cookieValue(): ConsentProp | null {
    const match = new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=([^;]+)`).exec(document.cookie)

    return match?.[1] === undefined ? null : (JSON.parse(decodeURIComponent(match[1])) as ConsentProp)
}

beforeEach(() => {
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/`
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    store = null
})

describe('CookieConsent — no statistics option while no service exists', () => {
    it('shows the necessary-cookies sentence, the Datenschutz link and one button', () => {
        const sheet = mountSheet().find('section.consent')

        expect(sheet.text()).toContain('Wir verwenden Cookies, die für den Shop nötig sind')
        expect(sheet.find('a').attributes('href')).toBe('/rechtliches/datenschutz')
        expect(sheet.findAll('button').map((b) => b.text())).toEqual(['Verstanden'])
        expect(sheet.text()).not.toContain('Statistik')
        expect(sheet.text()).not.toContain('Alle akzeptieren')
    })

    it('records only the necessary cookies and closes', async () => {
        const wrapper = mountSheet()

        await wrapper.find('section.consent button').trigger('click')
        await nextTick()

        expect(wrapper.find('section.consent').exists()).toBe(false)
        expect(cookieValue()).toMatchObject({ necessary: true, statistics: false })
        expect(store?.decided.value).toMatchObject({ necessary: true, statistics: false })
    })

    it('offers the store no way to record a statistics consent', () => {
        mountSheet()

        expect(store).not.toBeNull()
        expect(Object.keys(store!)).not.toContain('decide')
        expect(Object.keys(store!).sort()).toEqual(['acknowledge', 'decided', 'openSettings', 'settingsOpen'])
    })

    it('stays closed once a choice is on record', () => {
        const wrapper = mountSheet({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })

        expect(wrapper.find('section.consent').exists()).toBe(false)
    })

    it('reopens as settings with the necessary cookies only, and no switch', async () => {
        mountSheet({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })

        store!.openSettings()
        await nextTick()
        await nextTick()

        const dialog = document.body.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
        expect(dialog!.textContent).toContain('Notwendig')
        expect(dialog!.textContent).toContain('Immer aktiv')
        expect(dialog!.textContent).not.toContain('Statistik')
        expect(dialog!.querySelector('input[type="checkbox"]')).toBeNull()
    })
})
