//#region resources/js/lib/mailto.ts
function mailtoHref(email, fields = {}) {
	const query = ["subject", "body"].map((key) => [key, fields[key]]).filter((entry) => typeof entry[1] === "string" && entry[1] !== "").map(([key, value]) => `${key}=${encodeURIComponent(value.replace(/\r?\n/g, "\r\n"))}`).join("&");
	return `mailto:${email.trim()}${query === "" ? "" : `?${query}`}`;
}
//#endregion
export { mailtoHref as t };
