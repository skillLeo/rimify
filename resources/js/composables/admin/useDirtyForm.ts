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
    method: Method
    url: string | (() => string)
    /**
     * Back to the initial values after a save, instead of keeping what was saved as the new clean
     * state. For forms whose values must not stay on screen — a password.
     */
    resetOnSuccess?: boolean
    onSaved?: () => void
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

        failed.value = false
        const url = typeof options.url === 'function' ? options.url() : options.url

        form.submit(options.method, url, {
            preserveScroll: true,
            onSuccess: () => {
                if (options.resetOnSuccess) {
                    form.reset()
                } else {
                    // What was saved is now what "unchanged" means.
                    form.defaults()
                }

                options.onSaved?.()
            },
            onError: () => {
                failed.value = true
                // The first field the server refused gets the focus, so the fix starts where the
                // problem is and a screen reader hears its error first.
                void nextTick(() => document.querySelector<HTMLElement>('.adm-page [aria-invalid="true"]')?.focus())
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
    let letThrough = false

    function stay(): void {
        leaving.value = false
        held = null
    }

    function leave(): void {
        const url = held

        leaving.value = false
        held = null
        discard()

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

    let unbind: (() => void) | null = null

    onMounted(() => {
        // Only navigation is held: the form's own submit and any other write go through.
        unbind = router.on('before', (event) => {
            const visit = event.detail.visit

            if (letThrough || !form.isDirty || visit.method !== 'get' || visit.async || visit.prefetch) {
                return
            }

            event.preventDefault()
            held = visit.url.href
            leaving.value = true
        })

        window.addEventListener('beforeunload', onBeforeUnload)
        window.addEventListener('keydown', onKeydown)
    })

    onBeforeUnmount(() => {
        unbind?.()
        window.removeEventListener('beforeunload', onBeforeUnload)
        window.removeEventListener('keydown', onKeydown)
    })

    return { form, dirty, saving, failed, save, discard, leaving, stay, leave }
}
