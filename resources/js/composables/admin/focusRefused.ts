import { nextTick } from 'vue'

/**
 * After a refused save: the first refused field takes the focus, so the keyboard lands where the
 * fix is and a phone scrolls the sentence into view. Where no field is marked (a sentence about the
 * whole form), the first sentence itself is focused instead — never nothing, never the button.
 */
export function focusRefused(scope: string | HTMLElement | null | undefined): void {
    void nextTick(() => {
        const root = typeof scope === 'string' ? document.querySelector<HTMLElement>(scope) : scope

        if (!root) {
            return
        }

        const field = root.querySelector<HTMLElement>('[aria-invalid="true"]:not([aria-hidden="true"])')

        if (field) {
            field.focus()

            return
        }

        const sentence = [...root.querySelectorAll<HTMLElement>('.form-field__error, .adm-alert')].find((el) => el.textContent?.trim())

        if (sentence) {
            sentence.tabIndex = -1
            sentence.focus()
        }
    })
}
/**
 * Runs `then` once every dialog has left the page. Focus moved while a dialog is still closing is taken
 * back by its focus trap (and its close animation held); after it is gone, the page decides again.
 */
export function afterDialogsClose(then: () => void, frames = 90): void {
    if (typeof window === 'undefined') {
        return
    }

    const step = (left: number): void => {
        if (document.querySelector('[role="dialog"], [role="alertdialog"]') === null || left <= 0) {
            then()

            return
        }

        window.requestAnimationFrame(() => step(left - 1))
    }

    window.requestAnimationFrame(() => step(frames))
}
