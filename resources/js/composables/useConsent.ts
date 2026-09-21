/**
 * The cookie choice.
 *
 * The server reads the cookie and shares the choice in the first response, so the sheet is in the
 * server-rendered HTML exactly when it should be. A choice made in the browser is written as a
 * plain cookie for twelve months and mirrored into this store, so the sheet closes at once. The
 * footer's "Cookie-Einstellungen" reopens the settings from anywhere.
 */

import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { ConsentProp } from '../types/rimify'

export const CONSENT_COOKIE = 'rmf_consent'

const TWELVE_MONTHS_S = 60 * 60 * 24 * 365

export interface ConsentStore {
    readonly decided: Ref<ConsentProp | null>
    readonly settingsOpen: Ref<boolean>
    decide(statistics: boolean): void
    openSettings(): void
}

const KEY: InjectionKey<ConsentStore> = Symbol('consent')

export function provideConsent(initial: ConsentProp | null): ConsentStore {
    const decided = ref<ConsentProp | null>(initial)
    const settingsOpen = ref(false)

    function decide(statistics: boolean): void {
        const choice: ConsentProp = { necessary: true, statistics, decidedAt: new Date().toISOString() }
        const secure = location.protocol === 'https:' ? '; Secure' : ''

        document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(choice))}; Max-Age=${TWELVE_MONTHS_S}; Path=/; SameSite=Lax${secure}`
        decided.value = choice
        settingsOpen.value = false
    }

    const store: ConsentStore = {
        decided,
        settingsOpen,
        decide,
        openSettings: () => {
            settingsOpen.value = true
        },
    }

    provide(KEY, store)

    return store
}

export function useConsent(): ConsentStore {
    const store = inject(KEY)

    if (store === undefined) {
        throw new Error('useConsent() needs provideConsent() in the layout')
    }

    return store
}
