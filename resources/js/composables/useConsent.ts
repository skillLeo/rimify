/**
 * The cookie notice.
 *
 * The server reads the cookie and shares the choice in the first response, so the sheet is in the
 * server-rendered HTML exactly when it should be. Acknowledging it writes a plain cookie for twelve
 * months and mirrors it into this store, so the sheet closes at once. The footer's
 * "Cookie-Einstellungen" reopens the settings from anywhere.
 *
 * There is nothing to consent to: the shop sets only the cookies it needs, and no statistics
 * service is configured (docs/phase0/ACCURACY.md D7). So the store records `statistics: false`
 * and offers no way to record anything else. A statistics choice comes back together with a real
 * service and the consent wording the Kanzlei supplies — never ahead of them.
 */

import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { ConsentProp } from '../types/rimify'

export const CONSENT_COOKIE = 'rmf_consent'

const TWELVE_MONTHS_S = 60 * 60 * 24 * 365

export interface ConsentStore {
    readonly decided: Ref<ConsentProp | null>
    readonly settingsOpen: Ref<boolean>
    /** The visitor has read the notice. Only necessary cookies are, and can be, allowed. */
    acknowledge(): void
    openSettings(): void
}

const KEY: InjectionKey<ConsentStore> = Symbol('consent')

export function provideConsent(initial: ConsentProp | null): ConsentStore {
    const decided = ref<ConsentProp | null>(initial)
    const settingsOpen = ref(false)

    function acknowledge(): void {
        const choice: ConsentProp = { necessary: true, statistics: false, decidedAt: new Date().toISOString() }
        const secure = location.protocol === 'https:' ? '; Secure' : ''

        document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(choice))}; Max-Age=${TWELVE_MONTHS_S}; Path=/; SameSite=Lax${secure}`
        decided.value = choice
        settingsOpen.value = false
    }

    const store: ConsentStore = {
        decided,
        settingsOpen,
        acknowledge,
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
