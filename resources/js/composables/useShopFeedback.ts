import { onMounted, shallowRef, watch, type Component, type ShallowRef } from 'vue'

/**
 * The review's feedback button on the shop's pages (D-142), for a signed-in admin while the review is on. The server
 * decides whether there is one (`reviewer`); the page loads it once it is awake, and never draws it on the server.
 *
 * Drawn on the server and loaded on demand, it had to be hydrated when its code arrived — and on a slow host a page the
 * visitor had already left tried to hydrate a button whose code the browser had stopped fetching: „Hydration completed
 * but contains mismatches“ in Safari (#23's iPhone pass on the preview, 16.10.2026; D-255). Mounted after hydration there
 * is nothing to match, and a load the page's own departure cut off is said nowhere: the button belonged to the page
 * that is gone. Its code still never reaches a visitor.
 */
export function useShopFeedback(reviewer: () => boolean): ShallowRef<Component | null> {
    // Typed at the binding: shallowRef<Component | null> distributes over the union and leaves a setter that takes only null.
    const component: ShallowRef<Component | null> = shallowRef(null)

    function load(): void {
        if (component.value !== null) {
            return
        }

        import('../Components/Chrome/ShopFeedback.vue')
            .then((module) => {
                component.value = module.default
            })
            .catch(() => undefined)
    }

    onMounted(() => {
        watch(reviewer, (yes) => {
            if (yes) {
                load()
            }
        }, { immediate: true })
    })

    return component
}
