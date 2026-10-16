import { describe, expect, it } from 'vitest'
import { installPreloadErrorGuard } from './preloadErrors'

/*
 * WebKit cancels a chunk's stylesheet when the page moves on and reports it as an error; Vite then throws „Unable to
 * preload CSS“ unless its `vite:preloadError` event is prevented (the preview's iPhone pass, 16.10.2026).
 */
describe('installPreloadErrorGuard', () => {
    it('prevents the preload error, so the import goes on instead of throwing', () => {
        const target = new EventTarget() as Window
        installPreloadErrorGuard(target)

        const event = new Event('vite:preloadError', { cancelable: true })
        target.dispatchEvent(event)

        expect(event.defaultPrevented).toBe(true)
    })
})
