import { l as router } from "../ssr.js";
//#region resources/js/lib/freshReload.ts
/**
* A partial reload that replaces the one before it under the same name. Inertia's reloads run side by side and never
* cancel one another: a second one started while the first is on its way can be answered first, and the first — older —
* answer then lands last and puts back what the page showed before. On GitHub's machines it did exactly that in step 5:
* „Mit einem Verweis auf die Fahrzeugpapiere“ was chosen, and the answer of the reload before it put „Bei jeder
* Reifengröße“ back (13.11.2026). Here the older one is called off before the newer one starts.
*/
var pending = /* @__PURE__ */ new Map();
function freshReload(name, options = {}) {
	cancelReload(name);
	let mine;
	router.reload({
		...options,
		onCancelToken: (token) => {
			mine = token;
			pending.set(name, token);
			options.onCancelToken?.(token);
		},
		onFinish: (visit) => {
			if (pending.get(name) === mine) pending.delete(name);
			options.onFinish?.(visit);
		}
	});
}
/**
* Calls off the reload under this name, if one is on its way: a change the person is saving makes its answer old before it
* lands, and it would show the choice before the change until the next one arrives.
*/
function cancelReload(name) {
	pending.get(name)?.cancel();
	pending.delete(name);
}
//#endregion
export { freshReload as n, cancelReload as t };
