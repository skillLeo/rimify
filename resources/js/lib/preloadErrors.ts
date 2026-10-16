/*
 * A stylesheet of a chunk loaded on demand that the browser stopped fetching is no reason to throw.
 *
 * WebKit reports a load the page cancelled — the visitor moved on while the chunk's CSS was still coming — as an error;
 * Vite's preload helper then rejects the import with „Unable to preload CSS for …“, and with nothing to catch it the page
 * logged a crash. Found by the acceptance run on the preview's iPhone pass (16.10.2026): the shop's feedback button, loaded
 * for a signed-in reviewer, cancelled mid-load by the next page („Load request cancelled“ in the trace).
 *
 * `vite:preloadError` is Vite's own hook for it: prevented, the import goes on. A chunk whose module really is missing
 * still fails, at its own import, and says so; a stylesheet really missing leaves the component without it, not the page
 * without the component.
 */
export function installPreloadErrorGuard(target: Window = window): void {
    target.addEventListener('vite:preloadError', (event) => {
        event.preventDefault()
    })
}
