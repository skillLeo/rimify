/**
 * An admin form that knows whether it has changed, and does not let the change be lost by accident
 * (admin-shell.md §8.3–8.4).
 *
 * It wraps Inertia's form with the three things every admin form page owes the person filling it:
 *
 *   - a state the save bar can read — clean, dirty, saving, failed — so the bar is always there and
 *     only its words and buttons change;
 *   - a leave guard: a visit away from a dirty form is held and a dialog asks first; a reload or a
 *     closed tab gets the browser's own question;
 *   - Strg S / ⌘S saves when there is something to save (the shell already keeps the browser's
 *     save-page dialog away).
 *
 * The panel fails to a kept change, never a lost one: the guard's safe answer is *Weiter bearbeiten*.
 */

import { router, useForm, type InertiaForm } from '@inertiajs/vue3'
import type { FormDataType, Method } from '@inertiajs/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, type ComputedRef, type Ref } from 'vue'
import { openSheetCount } from '../mobile/useSheetHistory'
import { claimPopstateGuard } from './popstateGuard'

/** What the save bar and the leave dialog read — the form's state, without its fields. */
export interface DirtyFormState {
    dirty: ComputedRef<boolean>
    saving: ComputedRef<boolean>
    /** The last save came back with errors; cleared by the next save or by discarding. */
    failed: Ref<boolean>
    save: () => void
    discard: () => void
    /** The leave dialog is open because a visit was held. */
    leaving: Ref<boolean>
    stay: () => void
    leave: () => void
}

export interface DirtyForm<T extends object> extends DirtyFormState {
    form: InertiaForm<T>
}

export interface DirtyFormOptions {
    /**
     * Asked at each save when a function: a form that creates its record on the first save and
     * changes it after (Inertia keeps the page, so a method fixed at setup would stay `post`).
     */
    method: Method | (() => Method)
    url: string | (() => string)
    /**
     * Back to the initial values after a save, instead of keeping what was saved as the new clean
     * state. For forms whose values must not stay on screen — a password.
     */
    resetOnSuccess?: boolean
    onSaved?: () => void
    /**
     * A question before the save is sent — for changes that must be seen before they are made (the
     * rights of a role: BRIEF §2 "a diff of what changes before saving"). It receives the send and
     * calls it on a yes. Speichern and Strg S both go through it.
     */
    beforeSave?: (send: () => void) => void
}

export function useDirtyForm<T extends FormDataType<T>>(initial: T, options: DirtyFormOptions): DirtyForm<T> {
    const form = useForm(initial) as unknown as InertiaForm<T>

    const dirty = computed(() => form.isDirty)
    const saving = computed(() => form.processing)
    const failed = ref(false)

    function save(): void {
        if (!form.isDirty || form.processing) {
            return
        }

        if (options.beforeSave) {
            options.beforeSave(send)

            return
        }

        send()
    }

    function send(): void {
        if (!form.isDirty || form.processing) {
            return
        }

        failed.value = false
        const url = typeof options.url === 'function' ? options.url() : options.url
        const method = typeof options.method === 'function' ? options.method() : options.method

        /* Exactly what goes out. Words typed while the save is on its way are not in it: they must
           stay "unsaved", or a click away would drop them without asking. */
        const sent = JSON.stringify(form.data())

        form.submit(method, url, {
            preserveScroll: true,
            onSuccess: () => {
                if (options.resetOnSuccess) {
                    form.reset()
                } else {
                    // What was saved — not what the fields hold now — is what "unchanged" means.
                    form.defaults(JSON.parse(sent) as T)
                    form.isDirty = JSON.stringify(form.data()) !== sent
                }

                options.onSaved?.()
            },
            onError: () => {
                failed.value = true
                // The first field the server refused gets the focus, so the fix starts where the
                // problem is and a screen reader hears its error first.
                void nextTick(() => document.querySelector<HTMLElement>('.adm-page [aria-invalid="true"]')?.focus())
            },
            // Expired, refused, offline, or a server fault: the layout says which, and the form —
            // everything typed into it — stays exactly where it is (AdminLayout, AdminErrorPage).
            onHttpException: () => {
                failed.value = true
            },
            onNetworkError: () => {
                failed.value = true
            },
        })
    }

    function discard(): void {
        form.reset()
        form.clearErrors()
        failed.value = false
    }

    /* ── The leave guard ─────────────────────────────────────────────────────────── */

    const leaving = ref(false)
    let held: string | null = null
    let heldBack = false
    let letThrough = false

    /*
     * The browser's Back button never passes through Inertia's `before`: the router restores the
     * previous page from history on `popstate`. So the guard listens there too, ahead of the
     * router (popstateGuard.ts), and while the form holds changes it puts this page back under the
     * button and asks — the same question a click away gets. The entry it puts back is this page's
     * own history state, refreshed after every visit and every save (which rewrites the entry), so
     * Forward or a later Back never brings back an older copy of the page.
     */
    let ownState: unknown = null
    let ownUrl = ''

    function remember(): void {
        ownState = window.history.state as unknown
        ownUrl = window.location.href
    }

    /** True when the pop is this form's to hold: the guard then swallows it (popstateGuard.ts). */
    function onPopstate(event: PopStateEvent): boolean {
        if (letThrough) {
            letThrough = false

            return false
        }

        // An open bottom sheet owns Back first: it closes, and the form is not asked about.
        if (!form.isDirty || event.state === null || ownState === null || openSheetCount() > 0) {
            return false
        }

        window.history.pushState(ownState, '', ownUrl)
        held = null
        heldBack = true
        leaving.value = true

        return true
    }

    function stay(): void {
        leaving.value = false
        held = null
        heldBack = false
    }

    function leave(): void {
        const url = held
        const back = heldBack

        leaving.value = false
        held = null
        heldBack = false
        discard()

        if (back) {
            letThrough = true
            window.history.back()

            return
        }

        if (url) {
            letThrough = true
            router.visit(url, { onFinish: () => (letThrough = false) })
        }
    }

    function onBeforeUnload(event: BeforeUnloadEvent): void {
        if (form.isDirty) {
            event.preventDefault()
            // Older engines only ask when a value is set; the text itself is never shown.
            event.returnValue = ''
        }
    }

    function onKeydown(event: KeyboardEvent): void {
        const altGr = event.getModifierState('AltGraph')

        if ((event.metaKey || event.ctrlKey) && !event.altKey && !altGr && event.key.toLowerCase() === 's') {
            event.preventDefault()
            save()
        }
    }

    const unbind: Array<() => void> = []

    onMounted(() => {
        remember()

        unbind.push(
            // Only navigation is held: the form's own submit and any other write go through.
            router.on('before', (event) => {
                const visit = event.detail.visit

                if (letThrough || !form.isDirty || visit.method !== 'get' || visit.async || visit.prefetch) {
                    return
                }

                event.preventDefault()
                held = visit.url.href
                leaving.value = true
            }),
            // A visit pushes a new entry and a save's answer rewrites the current one: the guard
            // keeps whichever is current.
            router.on('navigate', remember),
            router.on('success', remember),
            claimPopstateGuard(onPopstate)
        )

        window.addEventListener('beforeunload', onBeforeUnload)
        window.addEventListener('keydown', onKeydown)
    })

    onBeforeUnmount(() => {
        unbind.forEach((off) => off())
        window.removeEventListener('beforeunload', onBeforeUnload)
        window.removeEventListener('keydown', onKeydown)
    })

    return { form, dirty, saving, failed, save, discard, leaving, stay, leave }
}
