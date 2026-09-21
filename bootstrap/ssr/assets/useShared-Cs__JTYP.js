import { i as usePage, s as vue_exports } from "../ssr.js";
//#region resources/js/composables/useShared.ts
/**
* Typed access to the props every page receives.
*
* `usePage().props` is `any` by default, which is how a renamed controller key becomes a blank
* header nobody notices until a client review. This narrows it once, here.
*/
function useShared() {
	const page = usePage();
	return (0, vue_exports.computed)(() => page.props);
}
function useMenus() {
	const shared = useShared();
	return (0, vue_exports.computed)(() => shared.value.menus ?? {
		header: [],
		footer_pages: [],
		footer_legal: [],
		mobile_bottom: []
	});
}
/**
* `Felgen suchen` goes to the selector with no vehicle and to the listing with one. The rule lives
* in the nav row's `behaviour`, so marketing can move the item without a developer — and so the
* destination is not a branch buried in a component.
*/
function resolveHref(href, behaviour, hasVehicle, listingHref) {
	return behaviour === "vehicle_aware" && hasVehicle ? listingHref : href;
}
//#endregion
export { useMenus as n, useShared as r, resolveHref as t };
