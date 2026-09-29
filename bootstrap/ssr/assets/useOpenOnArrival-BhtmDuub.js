import { s as usePage, u as vue_exports } from "../ssr.js";
//#region resources/js/composables/admin/useOpenOnArrival.ts
/**
* Opens a page's own create dialog when the page was reached for that purpose — „Neu“ in the rail's
* foot, or the palette, links to `/admin/seiten?neu=1`. The parameter is then taken out of the
* address, so Back, a reload or a bookmark shows the page, not the dialog again.
*
* Arriving on the page you are already on keeps the component, so the address is watched, not only
* read once. The page still decides whether the reader may create (`allowed`): a link cannot open a
* dialog the role would be refused.
*/
function useOpenOnArrival(param, open, allowed = () => true) {
	const page = usePage();
	function check() {
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);
		if (url.searchParams.get(param) !== "1") return;
		url.searchParams.delete(param);
		window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
		if (allowed()) open();
	}
	(0, vue_exports.onMounted)(() => {
		check();
		(0, vue_exports.watch)(() => page.url, () => check());
	});
}
//#endregion
export { useOpenOnArrival as t };
