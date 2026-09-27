/**
 * The review's feedback button (the review release §3): one point about the screen in front of you,
 * sent with where it was made — the address, the window, the browser — and what it looked like.
 *
 * The screenshot is taken before the dialog opens, so the dialog is not in it; it is the admin's own
 * page, drawn in the browser (html-to-image) and sent as a PNG. If the browser cannot draw it, the
 * point goes without one — the sentence is what matters.
 *
 * One dialog for the whole panel (FeedbackDialog in the layout); the rail foot, the phone's „Mehr“
 * and the `R` key only open it.
 */

import { reactive } from 'vue'

export type FeedbackType = 'fehler' | 'design' | 'text' | 'wunsch'

export const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
    { value: 'fehler', label: 'Fehler' },
    { value: 'design', label: 'Design' },
    { value: 'text', label: 'Text' },
    { value: 'wunsch', label: 'Wunsch' },
]

export const feedback = reactive({
    open: false,
    capturing: false,
    screenshot: null as string | null,
    url: '',
    viewport: '',
    browser: '',
})

/** `Chrome 128`, `Firefox 131`, `Safari 18` — enough to reproduce, nothing more of the user agent. */
export function browserName(agent: string): string {
    const rules: [RegExp, string][] = [
        [/Edg\/(\d+)/, 'Edge'],
        [/OPR\/(\d+)/, 'Opera'],
        [/Firefox\/(\d+)/, 'Firefox'],
        [/Chrome\/(\d+)/, 'Chrome'],
        [/Version\/(\d+)[\d.]* .*Safari/, 'Safari'],
    ]

    for (const [pattern, name] of rules) {
        const m = agent.match(pattern)

        if (m) {
            return `${name} ${m[1]}${/Mobile|Android|iPhone|iPad/.test(agent) ? ' (mobil)' : ''}`
        }
    }

    return agent.slice(0, 60) || 'unbekannt'
}

export async function startFeedback(): Promise<void> {
    if (feedback.capturing || feedback.open || typeof window === 'undefined') {
        return
    }

    feedback.capturing = true
    feedback.url = `${window.location.pathname}${window.location.search}`
    feedback.viewport = `${window.innerWidth}×${window.innerHeight}`
    feedback.browser = browserName(window.navigator.userAgent)
    feedback.screenshot = null

    try {
        const { toPng } = await import('html-to-image')
        const root = document.querySelector<HTMLElement>('.adm') ?? document.body

        feedback.screenshot = await toPng(root, {
            // What the person sees: the window, not the whole scrolled page.
            width: window.innerWidth,
            height: window.innerHeight,
            canvasWidth: window.innerWidth,
            canvasHeight: window.innerHeight,
            pixelRatio: 1,
            cacheBust: true,
            skipFonts: true,
            filter: (node) => !(node instanceof HTMLElement && node.dataset.feedbackSkip !== undefined),
        })
    } catch {
        feedback.screenshot = null
    } finally {
        feedback.capturing = false
        feedback.open = true
    }
}
