import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-B8jfLKlm.js";
import { a as link_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-BXpi0AIC.js";
import { t as FilePick_default } from "./FilePick-DkpmaeUr.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
import { n as stillReadable, t as FILE_CHANGED } from "./file-65D2TnCP.js";
//#region resources/js/Pages/Admin/Fahrzeuge/Import.vue?vue&type=script&setup=true&lang.ts
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
		* Nothing reaches the cars from here: the upload makes a Probelauf, which only reads.
		*/
		const props = __props;
		const upload = useForm({
			file: null,
			quelle: ""
		});
		const focus = useFocusAfter();
		(0, vue_exports.watch)(() => upload.file, (chosen) => {
			if (chosen !== null) upload.clearErrors("file");
		});
		async function submit() {
			if (upload.processing) return;
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
			upload.post("/admin/fahrzeuge/import/probelauf", {
				forceFormData: true,
				preserveScroll: true,
				onError: (errors) => {
					if (errors.file) upload.file = null;
					focus.request(errors.quelle && !errors.file ? "fi-source" : "fi-file-button");
				}
			});
		}
		function counts(run) {
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
							_push(`<section class="adm-section" aria-labelledby="fi-h-file" data-v-1784473f${_scopeId}><div class="adm-section__head" data-v-1784473f${_scopeId}><h2 id="fi-h-file" class="adm-section__title" data-v-1784473f${_scopeId}>Datei prüfen</h2></div><p class="adm-note" data-v-1784473f${_scopeId}> Eine Zeile ist ein Fahrzeug. Der Probelauf liest die Datei und zeigt, was sich ändern würde – an den Fahrzeugen ändert sich dabei nichts. Zum Anfangen gibt es eine <a href="/admin/fahrzeuge/import/beispiel.csv" download data-v-1784473f${_scopeId}>Beispieldatei</a> mit allen Spalten. </p><dl class="fi-fields" data-v-1784473f${_scopeId}><div class="fi-fields__row" data-v-1784473f${_scopeId}><dt data-v-1784473f${_scopeId}>Pflicht</dt><dd data-v-1784473f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(required).map((f) => f.label).join(", "))}</dd></div><div class="fi-fields__row" data-v-1784473f${_scopeId}><dt data-v-1784473f${_scopeId}>Optional</dt><dd data-v-1784473f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(optional).map((f) => f.label).join(", "))}</dd></div></dl><p class="adm-note fi-rules" data-v-1784473f${_scopeId}> Ein Fahrzeug erkennt der Import an HSN, TSN und Variante. Fahrzeuge, die von Hand oder aus einem bei uns hinterlegten Gutachten angelegt sind, überschreibt er nie – er füllt dort höchstens leere Felder. Einen Lochkreis braucht der Import nicht. </p><p class="visually-hidden" aria-live="assertive" data-v-1784473f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(upload).errors.file ?? (0, vue_exports.unref)(upload).errors.quelle ?? "")}</p><form class="fi-form" data-v-1784473f${_scopeId}><div class="form-field" data-v-1784473f${_scopeId}><span id="fi-file-label" class="form-field__label" data-v-1784473f${_scopeId}>Datei (CSV oder Excel, höchstens 5 MB)</span>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(FilePick_default, {
								id: "fi-file",
								modelValue: (0, vue_exports.unref)(upload).file,
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(upload).file = $event,
								accept: ".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
								invalid: !!(0, vue_exports.unref)(upload).errors.file,
								describedby: "fi-file-label fi-file-err",
								onRefused: (name) => (0, vue_exports.unref)(upload).setError("file", `„${name}“ nimmt dieses Feld nicht – nur CSV oder Excel (.xlsx).`)
							}, null, _parent, _scopeId));
							_push(`<p id="fi-file-err" class="form-field__error" data-v-1784473f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(upload).errors.file)}</p></div><div class="form-field" data-v-1784473f${_scopeId}><label class="form-field__label" for="fi-source" data-v-1784473f${_scopeId}>Woher die Daten kommen</label><select id="fi-source" class="input fi-source"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(upload).errors.quelle ? "true" : void 0)} aria-describedby="fi-source-help fi-source-err" data-v-1784473f${_scopeId}><option value="" disabled data-v-1784473f${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(upload).quelle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(upload).quelle, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(upload).quelle, "")) ? " selected" : ""}${_scopeId}>Quelle wählen</option><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.sources, (source) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", source.value)} data-v-1784473f${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(upload).quelle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(upload).quelle, source.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(upload).quelle, source.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(source.label)}</option>`);
							});
							_push(`<!--]--></select><p id="fi-source-help" class="form-field__help" data-v-1784473f${_scopeId}>Jedes neue Fahrzeug trägt diese Quelle. Jede Datei beginnt mit der Spaltenzuordnung des letzten Imports derselben Quelle.</p><p id="fi-source-err" class="form-field__error" data-v-1784473f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(upload).errors.quelle)}</p></div><div data-v-1784473f${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(upload).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(upload).processing ? "true" : void 0)} data-v-1784473f${_scopeId}>Probelauf starten</button></div></form></section>`);
						} else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="fi-h-runs" data-v-1784473f${_scopeId}><div class="adm-section__head" data-v-1784473f${_scopeId}><h2 id="fi-h-runs" class="adm-section__title" data-v-1784473f${_scopeId}>Bisherige Läufe</h2></div>`);
						if (__props.imports.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Noch kein Lauf. Eine geprüfte Datei erscheint hier, mit ihrem Probelauf und, wenn sie importiert ist, mit dem Ergebnis."
						}, null, _parent, _scopeId));
						else {
							_push(`<div class="adm-panel" data-v-1784473f${_scopeId}><table class="adm-table" data-v-1784473f${_scopeId}><caption class="visually-hidden" data-v-1784473f${_scopeId}>Bisherige Läufe des Fahrzeug-Imports</caption><thead data-v-1784473f${_scopeId}><tr data-v-1784473f${_scopeId}><th scope="col" data-v-1784473f${_scopeId}>Datei</th><th scope="col" data-v-1784473f${_scopeId}>Quelle</th><th scope="col" data-v-1784473f${_scopeId}>Stand</th><th scope="col" data-v-1784473f${_scopeId}>Ergebnis</th><th scope="col" data-v-1784473f${_scopeId}>Wann und wer</th></tr></thead><tbody data-v-1784473f${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.imports, (run) => {
								_push(`<tr data-v-1784473f${_scopeId}><td data-label="Datei" data-v-1784473f${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: run.href }, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(run.file)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(run.file), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`</td><td data-label="Quelle" data-v-1784473f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(run.source)}</td><td data-label="Stand" data-v-1784473f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(run.statusLabel)}</td><td data-label="Ergebnis" data-v-1784473f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(counts(run))}</td><td data-label="Wann und wer" data-v-1784473f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(run.at)}`);
								if (run.by) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(run.by)}<!--]-->`);
								else _push(`<!---->`);
								_push(`</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						}
						if (__props.total > __props.imports.length) _push(`<p class="adm-note fi-more" data-v-1784473f${_scopeId}>Hier stehen die letzten ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.imports.length, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.total, 0))} Läufen.</p>`);
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
						}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(upload).errors.file ?? (0, vue_exports.unref)(upload).errors.quelle ?? ""), 1),
						(0, vue_exports.createVNode)("form", {
							class: "fi-form",
							onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("span", {
									id: "fi-file-label",
									class: "form-field__label"
								}, "Datei (CSV oder Excel, höchstens 5 MB)"),
								(0, vue_exports.createVNode)(FilePick_default, {
									id: "fi-file",
									modelValue: (0, vue_exports.unref)(upload).file,
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(upload).file = $event,
									accept: ".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
									invalid: !!(0, vue_exports.unref)(upload).errors.file,
									describedby: "fi-file-label fi-file-err",
									onRefused: (name) => (0, vue_exports.unref)(upload).setError("file", `„${name}“ nimmt dieses Feld nicht – nur CSV oder Excel (.xlsx).`)
								}, null, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"invalid",
									"onRefused"
								]),
								(0, vue_exports.createVNode)("p", {
									id: "fi-file-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(upload).errors.file), 1)
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
								}), 128))], 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(upload).quelle]]),
								(0, vue_exports.createVNode)("p", {
									id: "fi-source-help",
									class: "form-field__help"
								}, "Jedes neue Fahrzeug trägt diese Quelle. Jede Datei beginnt mit der Spaltenzuordnung des letzten Imports derselben Quelle."),
								(0, vue_exports.createVNode)("p", {
									id: "fi-source-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(upload).errors.quelle), 1)
							]),
							(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								disabled: (0, vue_exports.unref)(upload).processing,
								"aria-busy": (0, vue_exports.unref)(upload).processing ? "true" : void 0
							}, "Probelauf starten", 8, ["disabled", "aria-busy"])])
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
var Import_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Import_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-1784473f"]]);
//#endregion
export { Import_default as default };
