/*
 * The way on where the tyres wait for the car's papers (D-286): the keyboard into the papers form's first field, the form
 * opened where it stands closed behind its button, the field in the middle of the screen. One action for every place
 * that offers it — the product page's button, the Komplettrad's refusal, the RIMIFY-Check.
 */
export function focusPapersForm(): void {
    // The first field the form asks — 8.1, or T where only T is missing (D-291).
    const field = document.querySelector<HTMLElement>('[data-pp-field]')

    if (field !== null) {
        const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

        field.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' })
        field.focus({ preventScroll: true })

        return
    }

    // Closed: its button opens it, and the form puts the keyboard in its first field itself (PapersForm `change`).
    ;(document.getElementById('pp-open') ?? document.getElementById('pp-change'))?.click()
}

/** Whether a verdict's tyres wait for fields of the car's papers (`tyre.owed`, D-286). */
export function waitsForPapers(verdict: { tyre?: { owed?: string[] } | null } | null | undefined): boolean {
    return (verdict?.tyre?.owed ?? []).length > 0
}
