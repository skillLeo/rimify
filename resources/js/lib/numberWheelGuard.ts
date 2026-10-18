/*
 * A number field never changes under the mouse wheel (the operator's brief of 18.10.2026 §2, D-290). Chrome steps a
 * focused `<input type="number">` when the wheel turns over it: a customer types 1160 into 8.1, scrolls on to read the
 * page, and 1160 silently becomes 1180 — a figure that then decides a tyre's load index. Every number field of the app,
 * shop and admin alike, lets go of the keyboard the moment the wheel turns over it, before the browser can step it, and
 * the wheel scrolls the page as it was meant to. The fields that feed a verdict from the customer's hand are text
 * fields with a numeric keyboard besides (PapersForm), which the wheel never steps at all.
 */
export function installNumberWheelGuard(root: Document = document): () => void {
    const onWheel = (event: WheelEvent): void => {
        const field = root.activeElement

        if (field instanceof HTMLInputElement && field.type === 'number' && event.target === field) {
            field.blur()
        }
    }

    // Capture, so it runs before anything on the page can stop the event; passive, so the page still scrolls at once.
    root.addEventListener('wheel', onWheel, { capture: true, passive: true })

    return () => root.removeEventListener('wheel', onWheel, { capture: true })
}
