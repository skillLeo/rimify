/**
 * Saving as it is typed, and never losing what was typed. One save at a time; what changed meanwhile goes with the next, with the
 * stamp the first one's answer brought. A change is a change of what would be sent, never a redraw. A save that fails stays owed,
 * so moving on tries it again, and stops if it fails again: the part that was typed in is only left once the server has it.
 */

export interface Autosave {
    /** Something on the page changed: saved shortly, if that changed what would be sent. */
    changed(): void
    /** Sends what is owed now, after the save under way. True: the server has everything typed so far. */
    flush(): Promise<boolean>
    /** What is on screen is what the server holds, from here on: after loading it. */
    mark(): void
    /** Owed whatever it reads: a file was chosen, which `content` does not hold. */
    force(): void
    /** Something typed has not reached the server yet. */
    owed(): boolean
}

export interface AutosaveOptions {
    /** What would be sent, as text. */
    content: () => string
    /** Sends it; true when the server took it. Says itself why it did not. */
    write: () => Promise<boolean>
    /** How long after the last change a save goes out, in ms. */
    delay: number
    /** Changed back to what the server holds: nothing to send, and whatever was said against the change is off. */
    clean?: () => void
}

export function createAutosave({ content, write, delay, clean }: AutosaveOptions): Autosave {
    /* What the server holds; null until `mark`: nothing that was never loaded can be owed. */
    let saved: string | null = null
    let forced = false
    let running: Promise<boolean> | null = null
    let timer: ReturnType<typeof setTimeout> | undefined

    function differs(): boolean {
        return saved !== null && (forced || content() !== saved)
    }

    async function flush(): Promise<boolean> {
        clearTimeout(timer)

        while (running !== null) {
            await running
        }

        if (!differs()) {
            return true
        }

        const sending = content()
        const sent = forced

        forced = false
        running = write().catch(() => false).then((ok) => {
            running = null

            if (ok) {
                saved = sending
            } else {
                forced = sent
            }

            return ok
        })

        return (await running) ? flush() : false
    }

    return {
        changed() {
            clearTimeout(timer)

            if (differs()) {
                timer = setTimeout(() => void flush(), delay)
            } else if (running === null) {
                clean?.()
            }
        },
        flush,
        mark() {
            clearTimeout(timer)
            saved = content()
            forced = false
        },
        force() {
            forced = true
        },
        owed() {
            return running !== null || differs()
        },
    }
}
