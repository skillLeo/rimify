import { u as vue_exports } from "../ssr.js";
import { n as xsrfToken } from "./preferences-y4YLrdI-.js";
import { n as stillReadable, t as FILE_CHANGED } from "./file-DmDd3um7.js";
//#region resources/js/composables/admin/usePresignedUpload.ts
var PRESIGN_URL = "/admin/uploads/pdf";
var ATTEMPTS = 3;
var BACKOFF_MS = [1e3, 3e3];
var UPLOAD_SENTENCES = {
	notPdf: "Das ist keine PDF-Datei. Ein Gutachten wird nur im PDF-Format angenommen.",
	start: "Das Hochladen lässt sich gerade nicht starten. Versuch es bitte gleich noch einmal.",
	refused: "Der Speicher hat die Datei nicht angenommen. Prüf bitte, ob es die richtige PDF-Datei ist.",
	connection: "Die Datei konnte nicht hochgeladen werden. Prüf bitte deine Verbindung und versuch es noch einmal."
};
function tooLarge(maxBytes) {
	return `Die Datei ist größer als ${Math.round(maxBytes / 1048576)} MB.`;
}
/** Worth another try: no answer, a timeout, too many requests, or the bucket's own failure. */
function retryable(status) {
	return status === 0 || status === 408 || status === 429 || status >= 500;
}
function sameOrigin(url) {
	if (typeof window === "undefined") return false;
	return new URL(url, window.location.href).origin === window.location.origin;
}
var xhrSender = (url, body, headers, onProgress) => new Promise((resolve) => {
	const xhr = new XMLHttpRequest();
	xhr.open("POST", url);
	xhr.withCredentials = sameOrigin(url);
	Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
	xhr.upload.onprogress = (event) => {
		if (event.lengthComputable) onProgress(event.loaded / event.total);
	};
	xhr.onload = () => resolve(xhr.status);
	xhr.onerror = () => resolve(0);
	xhr.ontimeout = () => resolve(0);
	xhr.send(body);
});
async function fetchForm() {
	try {
		const response = await fetch(PRESIGN_URL, {
			method: "POST",
			credentials: "same-origin",
			headers: {
				Accept: "application/json",
				"X-Requested-With": "XMLHttpRequest",
				"X-XSRF-TOKEN": xsrfToken()
			}
		});
		return response.ok ? await response.json() : null;
	} catch {
		return null;
	}
}
function usePresignedUpload(options = {}) {
	const presign = options.presign ?? fetchForm;
	const send = options.send ?? xhrSender;
	const wait = options.wait ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
	const state = (0, vue_exports.ref)("idle");
	const progress = (0, vue_exports.ref)(0);
	const attempt = (0, vue_exports.ref)(0);
	const error = (0, vue_exports.ref)(null);
	function fail(sentence) {
		state.value = "failed";
		error.value = sentence;
		return null;
	}
	/** The pending key once the bucket has the file; null with `error` set when it does not. */
	async function upload(file) {
		error.value = null;
		progress.value = 0;
		attempt.value = 0;
		if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return fail(UPLOAD_SENTENCES.notPdf);
		if (!await stillReadable(file)) return fail(FILE_CHANGED);
		state.value = "uploading";
		const form = await presign();
		if (form === null) return fail(UPLOAD_SENTENCES.start);
		if (file.size > form.maxBytes) return fail(tooLarge(form.maxBytes));
		const headers = sameOrigin(form.url) ? {
			"X-XSRF-TOKEN": xsrfToken(),
			"X-Requested-With": "XMLHttpRequest"
		} : {};
		for (let n = 1; n <= ATTEMPTS; n++) {
			attempt.value = n;
			const body = new FormData();
			Object.entries(form.fields).forEach(([name, value]) => body.append(name, value));
			body.append("file", file);
			const status = await send(form.url, body, headers, (share) => {
				progress.value = share;
			});
			if (status >= 200 && status < 300) {
				progress.value = 1;
				state.value = "done";
				return form.key;
			}
			if (!retryable(status)) return fail(UPLOAD_SENTENCES.refused);
			if (n < ATTEMPTS) {
				state.value = "retrying";
				progress.value = 0;
				await wait(BACKOFF_MS[n - 1] ?? 3e3);
			}
		}
		return fail(UPLOAD_SENTENCES.connection);
	}
	return {
		state,
		progress,
		attempt,
		error,
		upload
	};
}
//#endregion
export { usePresignedUpload as t };
