//#region resources/js/lib/xsrf.ts
/** Laravel's XSRF cookie, decoded, as the `X-XSRF-TOKEN` header a `fetch` to the shop is checked against. */
function xsrfToken() {
	const match = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(typeof document === "undefined" ? "" : document.cookie);
	return match?.[1] ? decodeURIComponent(match[1]) : "";
}
//#endregion
export { xsrfToken as t };
