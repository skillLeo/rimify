/**
 * The review's feedback button (the review release §3): one point about the screen in front of you,
 * sent with where it was made — the address, the window, the browser — and what it looked like.
 *
 * The screenshot is taken before the dialog opens, so the dialog is not in it; it is the admin's own
 * page as far as the window shows it, drawn in the browser (html-to-image) and sent as a PNG. If the browser cannot draw it, the
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

/*
 * The page's own typeface in its picture (D-142): drawn without it, every line breaks where the fallback face breaks
 * it, and a Design or Text point arrives with a page that never was. The fonts are read once per page load and kept;
 * if they cannot be, the picture is drawn as before, without them.
 */
let fontCss: Promise<string> | null = null

async function fontEmbedCss(root: HTMLElement, read: (node: HTMLElement) => Promise<string>): Promise<string> {
    fontCss ??= read(root).catch(() => '')

    return fontCss
}

/** How long the picture may take; after that the point goes without one rather than keep the person waiting. */
export const CAPTURE_TIMEOUT_MS = 8000

async function capture(): Promise<string | null> {
    const { toCanvas, getFontEmbedCSS } = await import('html-to-image')
    const root = document.querySelector<HTMLElement>('.adm') ?? document.body
    const fonts = await fontEmbedCss(root, getFontEmbedCSS)

    /*
     * What the person sees: the window where it is scrolled to, not the top of the page. The page is
     * drawn from its top down to the window's lower edge, and the part above the window is cut off.
     */
    const width = window.innerWidth
    const height = window.innerHeight
    const top = Math.max(0, Math.round(-root.getBoundingClientRect().top))
    const page = await toCanvas(root, {
        width,
        height: top + height,
        canvasWidth: width,
        canvasHeight: top + height,
        pixelRatio: 1,
        cacheBust: true,
        ...(fonts === '' ? { skipFonts: true } : { fontEmbedCSS: fonts }),
        // A photograph that cannot be drawn leaves a gap, never the whole picture missing.
        onImageErrorHandler: () => undefined,
        /*
         * The button itself never; and a <picture>'s <source> never: the library draws the <img> it holds, but a
         * <source> left in the copy makes the browser reach for its AVIF or WebP file, which a drawn page may not
         * load — the photograph came out broken on every page that has one (SHOP-FEEDBACK-05).
         */
        filter: (node) => !(node instanceof HTMLSourceElement) && !(node instanceof HTMLElement && node.dataset.feedbackSkip !== undefined),
    })
    const view = document.createElement('canvas')
    view.width = width
    view.height = height
    view.getContext('2d')?.drawImage(page, 0, top, width, height, 0, 0, width, height)

    return view.toDataURL('image/png')
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

    let timer: ReturnType<typeof setTimeout> | undefined

    try {
        feedback.screenshot = await Promise.race([
            capture(),
            new Promise<null>((resolve) => {
                timer = setTimeout(() => resolve(null), CAPTURE_TIMEOUT_MS)
            }),
        ])
    } catch {
        feedback.screenshot = null
    } finally {
        clearTimeout(timer)
        feedback.capturing = false
        feedback.open = true
    }
}
