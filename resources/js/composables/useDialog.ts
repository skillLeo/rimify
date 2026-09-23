/**
 * What every overlay owes the keyboard: Esc closes it, Tab stays inside it, the page behind does
 * not scroll, and focus goes back to the control that opened it.
 *
 * `trapTab` is the one piece the layout's own drawer and vehicle sheet share with page overlays;
 * `useOverlay` wraps all four duties for an overlay a page owns (the listing's filter sheet).
 */

import { nextTick, onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function focusableIn(container: HTMLElement): HTMLElement[] {
    return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.closest('[hidden], [inert]')
    )
}

/** Keep Tab inside `container`: from its last control back to its first, and the reverse. */
export function trapTab(event: KeyboardEvent, container: HTMLElement): void {
    const focusable = focusableIn(container)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (first === undefined || last === undefined) {
        event.preventDefault()

        return
    }

    const active = document.activeElement
    const outside = !(active instanceof Node) || !container.contains(active)

    if (event.shiftKey && (active === first || outside)) {
        event.preventDefault()
        last.focus()
    } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault()
        first.focus()
    }
}

/**
 * Esc, Tab, scroll lock and focus return for an overlay a page renders itself.
 *
 *     const sheetOpen = ref(false)
 *     const sheet = ref<HTMLElement | null>(null)
 *     useOverlay(sheetOpen, sheet)
 *     <div v-if="sheetOpen" ref="sheet" class="sheet" role="dialog" aria-modal="true">…</div>
 */
export function useOverlay(open: Ref<boolean>, container: Ref<HTMLElement | null>): void {
    let returnFocus: HTMLElement | null = null

    function onKeydown(event: KeyboardEvent): void {
        if (!open.value) {
            return
        }

        if (event.key === 'Escape') {
            open.value = false

            return
        }

        if (event.key === 'Tab' && container.value !== null) {
            trapTab(event, container.value)
        }
    }

    watch(open, async (isOpen) => {
        if (typeof document === 'undefined') {
            return
        }

        document.body.style.overflow = isOpen ? 'hidden' : ''

        if (isOpen) {
            returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
            await nextTick()

            if (container.value !== null) {
                focusableIn(container.value)[0]?.focus()
            }

            return
        }

        if (returnFocus?.isConnected) {
            returnFocus.focus()
        }

        returnFocus = null
    })

    onMounted(() => document.addEventListener('keydown', onKeydown))

    onBeforeUnmount(() => {
        document.removeEventListener('keydown', onKeydown)

        if (open.value) {
            document.body.style.removeProperty('overflow')
        }
    })
}
