import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BA7BbMo6.js";
import { a as link_default, d as vue_exports, l as router, o as useForm } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal, s as withUnit } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-DSdumcrf.js";
import { t as AdminProgress_default } from "./AdminProgress--5wzZ0fU.js";
import { t as FilePick_default } from "./FilePick-2dSToBON.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
import { n as stillReadable, t as FILE_CHANGED } from "./file-65D2TnCP.js";
import { t as xsrfToken } from "./xsrf-CkWwbTAv.js";
//#region resources/js/lib/partUpload.ts
/**
* A file sent to the server in parts (Fahrzeuge › Import, D-462): announced with its name and size, then part after
* part in the size the server asks for, then marked complete. No request carries more than the host takes in one, so
* the file's own size is never the host's question.
*
* A part the server answers with 409 did not start where the file on the server ends: the answer says where it does,
* and the upload goes on from there. A part that gets no answer is sent again, up to five times with growing pauses;
* after that the upload stops with UploadStalled, which names where it stopped so it can be taken up again.
*/
/** The server refused something, said in its own words per field (a 422). */
var UploadRefused = class extends Error {
	errors;
	constructor(errors) {
		super(Object.values(errors)[0] ?? "Die Datei wurde nicht angenommen.");
		this.errors = errors;
	}
};
/** The connection stopped answering: `held` bytes of run `id` are on the server, and the upload can go on from there. */
var UploadStalled = class extends Error {
	id;
	held;
	part;
	constructor(id, held, part) {
		super("Die Verbindung zum Server ist abgerissen.");
		this.id = id;
		this.held = held;
		this.part = part;
	}
};
/** Signed out, or no right to it: the page says so, as every admin page does. */
var UploadForbidden = class extends Error {};
var TRIES = 5;
var pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function headers(json) {
	return {
		Accept: "application/json",
		"X-Requested-With": "XMLHttpRequest",
		"X-XSRF-TOKEN": xsrfToken(),
		...json ? { "Content-Type": "application/json" } : {}
	};
}
async function refusal(response) {
	const answer = await response.json().catch(() => ({}));
	const errors = {};
	for (const [field, value] of Object.entries(answer.errors ?? {})) errors[field] = Array.isArray(value) ? value[0] ?? "" : value;
	return new UploadRefused(Object.keys(errors).length ? errors : { file: "Die Datei wurde nicht angenommen. Lad sie bitte noch einmal hoch." });
}
function guard(response) {
	if (response.status === 401 || response.status === 403 || response.status === 419) throw new UploadForbidden(response.status === 403 ? "Dafür fehlt dir die Berechtigung." : "Du bist abgemeldet. Melde dich bitte neu an.");
}
/** Announces the file and sends it whole. Resolves with the run's id and page once the server has it complete. */
async function uploadInParts(options) {
	const response = await (options.fetcher ?? fetch)(options.start.url, {
		method: "POST",
		credentials: "same-origin",
		headers: headers(true),
		body: JSON.stringify({
			...options.start.body,
			name: options.start.name,
			size: options.file.size
		})
	}).catch(() => {
		throw new UploadStalled(0, 0, 0);
	});
	guard(response);
	if (response.status === 422) throw await refusal(response);
	if (!response.ok) throw new UploadStalled(0, 0, 0);
	return continueUpload(options, await response.json());
}
/** Sends the file from where the server holds it, then marks it complete. */
async function continueUpload(options, started) {
	const send = options.fetcher ?? fetch;
	const wait = options.wait ?? pause;
	const total = options.file.size;
	const part = Math.max(1, started.part);
	let held = started.held;
	options.onProgress?.(held, total);
	while (held < total) {
		const body = new FormData();
		body.append("offset", String(held));
		body.append("part", options.file.slice(held, Math.min(total, held + part)), "teil");
		let answer = null;
		for (let attempt = 0; attempt < TRIES && answer === null; attempt++) {
			if (attempt > 0) await wait(1e3 * 2 ** (attempt - 1));
			try {
				const response = await send(options.partUrl(started.id), {
					method: "POST",
					credentials: "same-origin",
					headers: headers(false),
					body
				});
				answer = response.status >= 500 ? null : response;
			} catch {
				answer = null;
			}
		}
		if (answer === null) throw new UploadStalled(started.id, held, part);
		guard(answer);
		if (answer.status === 422) throw await refusal(answer);
		if (answer.status !== 409 && !answer.ok) throw new UploadStalled(started.id, held, part);
		held = Number((await answer.json()).held);
		options.onProgress?.(held, total);
	}
	const finished = await send(options.finishUrl(started.id), {
		method: "POST",
		credentials: "same-origin",
		headers: headers(true),
		body: "{}"
	}).catch(() => {
		throw new UploadStalled(started.id, held, part);
	});
	guard(finished);
	if (finished.status === 422) throw await refusal(finished);
	if (!finished.ok) throw new UploadStalled(started.id, held, part);
	const done = await finished.json();
	return {
		id: started.id,
		href: done.href
	};
}
//#endregion
//#region resources/js/Pages/Admin/Fahrzeuge/Import.vue?vue&type=script&setup=true&lang.ts
var MB = 1048576;
var Import_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Import",
	__ssrInlineRender: true,
	props: {
		sources: {},
		fields: {},
		imports: {},
		total: {},
		can: {}
	},
	setup(__props) {
		/**
		* Fahrzeuge › Import (his admin item 2, D-297) — a vehicle dataset into the shop: the file and where it comes from, its
		* columns, the Probelauf, the import (VehicleImporter). This page is the first step and the record of every run; each
		* run has its own page (ImportRun.vue).
		*
		* Nothing reaches the cars from here: the upload makes a Probelauf, which only reads. A file of any size (D-462): it
		* goes to the server in parts (lib/partUpload), with a bar for how much is there, and a connection that drops is taken
		* up again where it stopped.
		*/
		const props = __props;
		const upload = useForm({
			file: null,
			quelle: ""
		});
		const focus = useFocusAfter();
		const sending = (0, vue_exports.ref)(false);
		const sent = (0, vue_exports.ref)(0);
		const size = (0, vue_exports.ref)(0);
		const stalled = (0, vue_exports.ref)(null);
		const failure = (0, vue_exports.ref)("");
		const percent = (0, vue_exports.computed)(() => size.value > 0 ? Math.floor(sent.value / size.value * 100) : 0);
		const sentText = (0, vue_exports.computed)(() => `${withUnit(decimal(sent.value / MB, 1), "MB")} von ${withUnit(decimal(size.value / MB, 1), "MB")} hochgeladen`);
		(0, vue_exports.watch)(() => upload.file, (chosen) => {
			if (chosen !== null) {
				upload.clearErrors("file");
				stalled.value = null;
				failure.value = "";
			}
		});
		function options(file) {
			return {
				file,
				start: {
					url: "/admin/fahrzeuge/import/hochladen",
					body: { quelle: upload.quelle },
					name: file.name
				},
				partUrl: (id) => `/admin/fahrzeuge/import/${id}/teil`,
				finishUrl: (id) => `/admin/fahrzeuge/import/${id}/fertig`,
				onProgress: (held, total) => {
					sent.value = held;
					size.value = total;
				}
			};
		}
		async function send(file, from) {
			sending.value = true;
			stalled.value = null;
			failure.value = "";
			sent.value = from?.held ?? 0;
			size.value = file.size;
			try {
				const done = from !== null && from.id > 0 ? await continueUpload(options(file), from) : await uploadInParts(options(file));
				router.visit(done.href);
			} catch (error) {
				if (error instanceof UploadRefused) {
					for (const [field, message] of Object.entries(error.errors)) upload.setError(field === "quelle" ? "quelle" : "file", message);
					if (!error.errors.quelle) upload.file = null;
					focus.request(error.errors.quelle && !error.errors.file && !error.errors.name && !error.errors.size ? "fi-source" : "fi-file-button");
				} else if (error instanceof UploadStalled) {
					stalled.value = error;
					focus.request("fi-resume");
				} else {
					failure.value = error instanceof UploadForbidden ? error.message : "Die Datei ist nicht angekommen. Lad sie bitte noch einmal hoch.";
					focus.request("fi-file-button");
				}
			} finally {
				sending.value = false;
			}
		}
		async function submit() {
			if (sending.value) return;
			if (upload.file === null) {
				upload.setError("file", "Bitte wähl eine Datei aus: CSV oder Excel (.xlsx).");
				focus.request("fi-file-button");
				return;
			}
			if (!await stillReadable(upload.file)) {
				upload.file = null;
				upload.setError("file", FILE_CHANGED);
				focus.request("fi-file-button");
				return;
			}
			upload.clearErrors();
			await send(upload.file, null);
		}
		async function resume() {
			if (upload.file === null || stalled.value === null) return;
			await send(upload.file, stalled.value);
		}
		function counts(run) {
			if ([
				"uploading",
				"reading",
				"checking",
				"failed"
			].includes(run.status)) return "–";
			const s = run.summary;
			const parts = [
				s.create ? `${decimal(s.create, 0)} neu` : "",
				s.update ? `${decimal(s.update, 0)} geändert` : "",
				s.merge ? `${decimal(s.merge, 0)} ergänzt` : "",
				s.refused ? `${decimal(s.refused, 0)} abgelehnt` : ""
			].filter(Boolean);
			if (parts.length > 0) return parts.join(" · ");
			return Object.keys(s).length === 0 ? "Zuordnung unvollständig" : "Nichts zu importieren";
		}
		const required = props.fields.filter((field) => field.required);
		const optional = props.fields.filter((field) => !field.required);
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Fahrzeug-Import",
				context: __props.total === 1 ? "1 Lauf" : `${(0, vue_exports.unref)(decimal)(__props.total, 0)} Läufe`
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.can.preview) {
							_push(`<section class="adm-section" aria-labelledby="fi-h-file" data-v-e37ebbb6${_scopeId}><div class="adm-section__head" data-v-e37ebbb6${_scopeId}><h2 id="fi-h-file" class="adm-section__title" data-v-e37ebbb6${_scopeId}>Datei prüfen</h2></div><p class="adm-note" data-v-e37ebbb6${_scopeId}> Eine Zeile ist ein Fahrzeug. Der Probelauf liest die Datei und zeigt, was sich ändern würde – an den Fahrzeugen ändert sich dabei nichts. Zum Anfangen gibt es eine <a href="/admin/fahrzeuge/import/beispiel.csv" download data-v-e37ebbb6${_scopeId}>Beispieldatei</a> mit allen Spalten. </p><dl class="fi-fields" data-v-e37ebbb6${_scopeId}><div class="fi-fields__row" data-v-e37ebbb6${_scopeId}><dt data-v-e37ebbb6${_scopeId}>Pflicht</dt><dd data-v-e37ebbb6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(required).map((f) => f.label).join(", "))}</dd></div><div class="fi-fields__row" data-v-e37ebbb6${_scopeId}><dt data-v-e37ebbb6${_scopeId}>Optional</dt><dd data-v-e37ebbb6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(optional).map((f) => f.label).join(", "))}</dd></div></dl><p class="adm-note fi-rules" data-v-e37ebbb6${_scopeId}> Ein Fahrzeug erkennt der Import an HSN, TSN und Variante. Fahrzeuge, die von Hand oder aus einem bei uns hinterlegten Gutachten angelegt sind, überschreibt er nie – er füllt dort höchstens leere Felder. Einen Lochkreis braucht der Import nicht. </p><p class="visually-hidden" aria-live="assertive" data-v-e37ebbb6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(upload).errors.file ?? (0, vue_exports.unref)(upload).errors.quelle ?? failure.value)}</p><form class="fi-form" data-v-e37ebbb6${_scopeId}><div class="form-field" data-v-e37ebbb6${_scopeId}><span id="fi-file-label" class="form-field__label" data-v-e37ebbb6${_scopeId}>Datei (CSV oder Excel)</span>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(FilePick_default, {
								id: "fi-file",
								modelValue: (0, vue_exports.unref)(upload).file,
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(upload).file = $event,
								accept: ".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
								invalid: !!(0, vue_exports.unref)(upload).errors.file,
								disabled: sending.value,
								describedby: "fi-file-label fi-file-help fi-file-err",
								onRefused: (name) => (0, vue_exports.unref)(upload).setError("file", `„${name}“ nimmt dieses Feld nicht – nur CSV oder Excel (.xlsx).`)
							}, null, _parent, _scopeId));
							_push(`<p id="fi-file-help" class="form-field__help" data-v-e37ebbb6${_scopeId}>Auch große Dateien sind möglich – sie werden in Teilen hochgeladen und danach auf dem Server geprüft.</p><p id="fi-file-err" class="form-field__error" data-v-e37ebbb6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(upload).errors.file ?? failure.value)}</p></div><div class="form-field" data-v-e37ebbb6${_scopeId}><label class="form-field__label" for="fi-source" data-v-e37ebbb6${_scopeId}>Woher die Daten kommen</label><select id="fi-source" class="input fi-source"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(upload).errors.quelle ? "true" : void 0)} aria-describedby="fi-source-help fi-source-err" data-v-e37ebbb6${_scopeId}><option value="" disabled data-v-e37ebbb6${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(upload).quelle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(upload).quelle, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(upload).quelle, "")) ? " selected" : ""}${_scopeId}>Quelle wählen</option><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.sources, (source) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", source.value)} data-v-e37ebbb6${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(upload).quelle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(upload).quelle, source.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(upload).quelle, source.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(source.label)}</option>`);
							});
							_push(`<!--]--></select><p id="fi-source-help" class="form-field__help" data-v-e37ebbb6${_scopeId}>Jedes neue Fahrzeug trägt diese Quelle. Jede Datei beginnt mit der Spaltenzuordnung des letzten Imports derselben Quelle.</p><p id="fi-source-err" class="form-field__error" data-v-e37ebbb6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(upload).errors.quelle)}</p></div>`);
							if (sending.value || stalled.value) {
								_push(`<div class="fi-progress" data-v-e37ebbb6${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminProgress_default, {
									id: "fi-progress",
									percent: percent.value,
									text: sentText.value
								}, null, _parent, _scopeId));
								if (stalled.value) {
									_push(`<p class="adm-alert fi-progress__stalled" role="alert" data-v-e37ebbb6${_scopeId}> Die Verbindung zum Server ist abgerissen. `);
									if (stalled.value.id > 0) _push(`<!--[-->Was schon angekommen ist, bleibt erhalten. „Weiter hochladen“ schickt nur den Rest.<!--]-->`);
									else _push(`<!--[-->Versuch es bitte noch einmal.<!--]-->`);
									_push(`</p>`);
								} else _push(`<!---->`);
								_push(`</div>`);
							} else _push(`<!---->`);
							_push(`<div class="fi-actions" data-v-e37ebbb6${_scopeId}>`);
							if (stalled.value && stalled.value.id > 0) _push(`<button id="fi-resume" class="btn btn--primary" type="button" data-v-e37ebbb6${_scopeId}>Weiter hochladen</button>`);
							else _push(`<button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", sending.value ? "true" : void 0)} data-v-e37ebbb6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(sending.value ? "Wird hochgeladen …" : "Probelauf starten")}</button>`);
							_push(`</div></form></section>`);
						} else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="fi-h-runs" data-v-e37ebbb6${_scopeId}><div class="adm-section__head" data-v-e37ebbb6${_scopeId}><h2 id="fi-h-runs" class="adm-section__title" data-v-e37ebbb6${_scopeId}>Bisherige Läufe</h2></div>`);
						if (__props.imports.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Noch kein Lauf. Eine geprüfte Datei erscheint hier, mit ihrem Probelauf und, wenn sie importiert ist, mit dem Ergebnis."
						}, null, _parent, _scopeId));
						else {
							_push(`<div class="adm-panel" data-v-e37ebbb6${_scopeId}><table class="adm-table" data-v-e37ebbb6${_scopeId}><caption class="visually-hidden" data-v-e37ebbb6${_scopeId}>Bisherige Läufe des Fahrzeug-Imports</caption><thead data-v-e37ebbb6${_scopeId}><tr data-v-e37ebbb6${_scopeId}><th scope="col" data-v-e37ebbb6${_scopeId}>Datei</th><th scope="col" data-v-e37ebbb6${_scopeId}>Quelle</th><th scope="col" data-v-e37ebbb6${_scopeId}>Stand</th><th scope="col" data-v-e37ebbb6${_scopeId}>Ergebnis</th><th scope="col" data-v-e37ebbb6${_scopeId}>Wann und wer</th></tr></thead><tbody data-v-e37ebbb6${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.imports, (run) => {
								_push(`<tr data-v-e37ebbb6${_scopeId}><td data-label="Datei" data-v-e37ebbb6${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: run.href }, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(run.file)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(run.file), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`</td><td data-label="Quelle" data-v-e37ebbb6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(run.source)}</td><td data-label="Stand" data-v-e37ebbb6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(run.statusLabel)}</td><td data-label="Ergebnis" data-v-e37ebbb6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(counts(run))}</td><td data-label="Wann und wer" data-v-e37ebbb6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(run.at)}`);
								if (run.by) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(run.by)}<!--]-->`);
								else _push(`<!---->`);
								_push(`</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						}
						if (__props.total > __props.imports.length) _push(`<p class="adm-note fi-more" data-v-e37ebbb6${_scopeId}>Hier stehen die letzten ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.imports.length, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.total, 0))} Läufen.</p>`);
						else _push(`<!---->`);
						_push(`</section>`);
					} else return [__props.can.preview ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
						key: 0,
						class: "adm-section",
						"aria-labelledby": "fi-h-file"
					}, [
						(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "fi-h-file",
							class: "adm-section__title"
						}, "Datei prüfen")]),
						(0, vue_exports.createVNode)("p", { class: "adm-note" }, [
							(0, vue_exports.createTextVNode)(" Eine Zeile ist ein Fahrzeug. Der Probelauf liest die Datei und zeigt, was sich ändern würde – an den Fahrzeugen ändert sich dabei nichts. Zum Anfangen gibt es eine "),
							(0, vue_exports.createVNode)("a", {
								href: "/admin/fahrzeuge/import/beispiel.csv",
								download: ""
							}, "Beispieldatei"),
							(0, vue_exports.createTextVNode)(" mit allen Spalten. ")
						]),
						(0, vue_exports.createVNode)("dl", { class: "fi-fields" }, [(0, vue_exports.createVNode)("div", { class: "fi-fields__row" }, [(0, vue_exports.createVNode)("dt", null, "Pflicht"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(required).map((f) => f.label).join(", ")), 1)]), (0, vue_exports.createVNode)("div", { class: "fi-fields__row" }, [(0, vue_exports.createVNode)("dt", null, "Optional"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(optional).map((f) => f.label).join(", ")), 1)])]),
						(0, vue_exports.createVNode)("p", { class: "adm-note fi-rules" }, " Ein Fahrzeug erkennt der Import an HSN, TSN und Variante. Fahrzeuge, die von Hand oder aus einem bei uns hinterlegten Gutachten angelegt sind, überschreibt er nie – er füllt dort höchstens leere Felder. Einen Lochkreis braucht der Import nicht. "),
						(0, vue_exports.createVNode)("p", {
							class: "visually-hidden",
							"aria-live": "assertive"
						}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(upload).errors.file ?? (0, vue_exports.unref)(upload).errors.quelle ?? failure.value), 1),
						(0, vue_exports.createVNode)("form", {
							class: "fi-form",
							onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("span", {
									id: "fi-file-label",
									class: "form-field__label"
								}, "Datei (CSV oder Excel)"),
								(0, vue_exports.createVNode)(FilePick_default, {
									id: "fi-file",
									modelValue: (0, vue_exports.unref)(upload).file,
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(upload).file = $event,
									accept: ".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
									invalid: !!(0, vue_exports.unref)(upload).errors.file,
									disabled: sending.value,
									describedby: "fi-file-label fi-file-help fi-file-err",
									onRefused: (name) => (0, vue_exports.unref)(upload).setError("file", `„${name}“ nimmt dieses Feld nicht – nur CSV oder Excel (.xlsx).`)
								}, null, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"invalid",
									"disabled",
									"onRefused"
								]),
								(0, vue_exports.createVNode)("p", {
									id: "fi-file-help",
									class: "form-field__help"
								}, "Auch große Dateien sind möglich – sie werden in Teilen hochgeladen und danach auf dem Server geprüft."),
								(0, vue_exports.createVNode)("p", {
									id: "fi-file-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(upload).errors.file ?? failure.value), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fi-source"
								}, "Woher die Daten kommen"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "fi-source",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(upload).quelle = $event,
									class: "input fi-source",
									disabled: sending.value,
									"aria-invalid": (0, vue_exports.unref)(upload).errors.quelle ? "true" : void 0,
									"aria-describedby": "fi-source-help fi-source-err"
								}, [(0, vue_exports.createVNode)("option", {
									value: "",
									disabled: ""
								}, "Quelle wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.sources, (source) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: source.value,
										value: source.value
									}, (0, vue_exports.toDisplayString)(source.label), 9, ["value"]);
								}), 128))], 8, [
									"onUpdate:modelValue",
									"disabled",
									"aria-invalid"
								]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(upload).quelle]]),
								(0, vue_exports.createVNode)("p", {
									id: "fi-source-help",
									class: "form-field__help"
								}, "Jedes neue Fahrzeug trägt diese Quelle. Jede Datei beginnt mit der Spaltenzuordnung des letzten Imports derselben Quelle."),
								(0, vue_exports.createVNode)("p", {
									id: "fi-source-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(upload).errors.quelle), 1)
							]),
							sending.value || stalled.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: "fi-progress"
							}, [(0, vue_exports.createVNode)(AdminProgress_default, {
								id: "fi-progress",
								percent: percent.value,
								text: sentText.value
							}, null, 8, ["percent", "text"]), stalled.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-alert fi-progress__stalled",
								role: "alert"
							}, [(0, vue_exports.createTextVNode)(" Die Verbindung zum Server ist abgerissen. "), stalled.value.id > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Was schon angekommen ist, bleibt erhalten. „Weiter hochladen“ schickt nur den Rest.")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Versuch es bitte noch einmal.")], 64))])) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", { class: "fi-actions" }, [stalled.value && stalled.value.id > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								id: "fi-resume",
								class: "btn btn--primary",
								type: "button",
								onClick: resume
							}, "Weiter hochladen")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 1,
								class: "btn btn--primary",
								type: "submit",
								disabled: sending.value,
								"aria-busy": sending.value ? "true" : void 0
							}, (0, vue_exports.toDisplayString)(sending.value ? "Wird hochgeladen …" : "Probelauf starten"), 9, ["disabled", "aria-busy"]))])
						], 32)
					])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("section", {
						class: "adm-section",
						"aria-labelledby": "fi-h-runs"
					}, [
						(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "fi-h-runs",
							class: "adm-section__title"
						}, "Bisherige Läufe")]),
						__props.imports.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 0,
							kind: "empty",
							text: "Noch kein Lauf. Eine geprüfte Datei erscheint hier, mit ihrem Probelauf und, wenn sie importiert ist, mit dem Ergebnis."
						})) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "adm-panel"
						}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
							(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Bisherige Läufe des Fahrzeug-Imports"),
							(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Datei"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Quelle"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Stand"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Ergebnis"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Wann und wer")
							])]),
							(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.imports, (run) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: run.id }, [
									(0, vue_exports.createVNode)("td", { "data-label": "Datei" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: run.href }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(run.file), 1)]),
										_: 2
									}, 1032, ["href"])]),
									(0, vue_exports.createVNode)("td", { "data-label": "Quelle" }, (0, vue_exports.toDisplayString)(run.source), 1),
									(0, vue_exports.createVNode)("td", { "data-label": "Stand" }, (0, vue_exports.toDisplayString)(run.statusLabel), 1),
									(0, vue_exports.createVNode)("td", { "data-label": "Ergebnis" }, (0, vue_exports.toDisplayString)(counts(run)), 1),
									(0, vue_exports.createVNode)("td", { "data-label": "Wann und wer" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(run.at), 1), run.by ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(run.by), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])
								]);
							}), 128))])
						])])),
						__props.total > __props.imports.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 2,
							class: "adm-note fi-more"
						}, "Hier stehen die letzten " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.imports.length, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.total, 0)) + " Läufen.", 1)) : (0, vue_exports.createCommentVNode)("", true)
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Fahrzeuge/Import.vue
var _sfc_setup = Import_vue_vue_type_script_setup_true_lang_default.setup;
Import_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Fahrzeuge/Import.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Import_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Import_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e37ebbb6"]]);
//#endregion
export { Import_default as default };
