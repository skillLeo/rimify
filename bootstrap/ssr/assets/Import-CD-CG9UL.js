import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-CttJDbw1.js";
import { a as link_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as decimal } from "./format-BSciVE2Q.js";
import { t as AdminState_default } from "./AdminState-Dv1vTfZV.js";
import { t as FilePick_default } from "./FilePick-B_4pn1x_.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
import { n as stillReadable, t as FILE_CHANGED } from "./file-65D2TnCP.js";
//#region resources/js/Pages/Admin/Katalog/Import.vue?vue&type=script&setup=true&lang.ts
var Import_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Import",
	__ssrInlineRender: true,
	props: {
		fields: {},
		suppliers: {},
		imports: {},
		total: {},
		can: {}
	},
	setup(__props) {
		/**
		* Katalog › Import — a supplier feed into the catalogue: the file, its columns, the Probelauf, the
		* import (the review release §4.2). This page is the first step and the record of every run; each run
		* has its own page (ImportRun.vue).
		*
		* Nothing reaches the catalogue from here: the upload makes a Probelauf, which only reads.
		*/
		const props = __props;
		const upload = useForm({
			file: null,
			dezimal: "komma",
			lieferant: ""
		});
		const focus = useFocusAfter();
		(0, vue_exports.watch)(() => upload.file, (chosen) => {
			if (chosen !== null) upload.clearErrors("file");
		});
		async function submit() {
			if (upload.processing) return;
			if (upload.file === null) {
				upload.setError("file", "Bitte wähl eine Datei aus: CSV oder Excel (.xlsx).");
				focus.request("im-file-button");
				return;
			}
			if (!await stillReadable(upload.file)) {
				upload.file = null;
				upload.setError("file", FILE_CHANGED);
				focus.request("im-file-button");
				return;
			}
			upload.post("/admin/katalog/import/probelauf", {
				forceFormData: true,
				preserveScroll: true,
				onError: (errors) => {
					if (errors.file) upload.file = null;
					focus.request(errors.lieferant ? "im-supplier" : "im-file-button");
				}
			});
		}
		function counts(run) {
			const s = run.summary;
			const parts = [];
			if (s.create) parts.push(`${decimal(s.create, 0)} neu`);
			if (s.update) parts.push(`${decimal(s.update, 0)} geändert`);
			if (s.refused) parts.push(`${decimal(s.refused, 0)} abgelehnt`);
			return parts.length ? parts.join(" · ") : "Zuordnung unvollständig";
		}
		const required = props.fields.filter((field) => field.required);
		const optional = props.fields.filter((field) => !field.required);
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Katalog-Import",
				context: __props.total === 1 ? "1 Lauf" : `${(0, vue_exports.unref)(decimal)(__props.total, 0)} Läufe`
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.can.preview) {
							_push(`<section class="adm-section" aria-labelledby="im-h-file" data-v-9bb305cd${_scopeId}><div class="adm-section__head" data-v-9bb305cd${_scopeId}><h2 id="im-h-file" class="adm-section__title" data-v-9bb305cd${_scopeId}>Datei prüfen</h2></div><p class="adm-note" data-v-9bb305cd${_scopeId}> Eine Zeile ist eine Größe. Der Probelauf liest die Datei und zeigt, was sich ändern würde – im Katalog ändert sich dabei nichts. Zum Anfangen gibt es eine <a href="/admin/katalog/import/beispiel.csv" download data-v-9bb305cd${_scopeId}>Beispieldatei</a> mit allen Spalten. </p><dl class="im-fields" data-v-9bb305cd${_scopeId}><div class="im-fields__row" data-v-9bb305cd${_scopeId}><dt data-v-9bb305cd${_scopeId}>Pflicht</dt><dd data-v-9bb305cd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(required).map((f) => f.label).join(", "))}</dd></div><div class="im-fields__row" data-v-9bb305cd${_scopeId}><dt data-v-9bb305cd${_scopeId}>Optional</dt><dd data-v-9bb305cd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(optional).map((f) => f.label).join(", "))}</dd></div></dl><p class="adm-note im-rules" data-v-9bb305cd${_scopeId}>Der Import erkennt die Spalten an ihrem Namen; im nächsten Schritt kannst du sie auch selbst zuordnen. Eine bekannte SKU ändert nur Preis, Bestand, EAN, KBA-Nummer und Gewicht. Maße ändert ein Import nie, Demodaten fasst er nicht an, und neue Felgen sind Entwürfe.</p><p class="visually-hidden" aria-live="assertive" data-v-9bb305cd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(upload).errors.file ?? (0, vue_exports.unref)(upload).errors.lieferant ?? "")}</p><form class="im-form" data-v-9bb305cd${_scopeId}><div class="form-field" data-v-9bb305cd${_scopeId}><span id="im-file-label" class="form-field__label" data-v-9bb305cd${_scopeId}>Datei (CSV oder Excel, höchstens 5 MB)</span>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(FilePick_default, {
								id: "im-file",
								modelValue: (0, vue_exports.unref)(upload).file,
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(upload).file = $event,
								onRefused: (name) => (0, vue_exports.unref)(upload).setError("file", `„${name}“ nimmt dieses Feld nicht – nur CSV oder Excel (.xlsx).`),
								accept: ".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
								invalid: !!(0, vue_exports.unref)(upload).errors.file,
								describedby: "im-file-label im-file-err"
							}, null, _parent, _scopeId));
							_push(`<p id="im-file-err" class="form-field__error" data-v-9bb305cd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(upload).errors.file)}</p></div><div class="form-field" data-v-9bb305cd${_scopeId}><label class="form-field__label" for="im-supplier" data-v-9bb305cd${_scopeId}>Lieferant <span class="im-optional" data-v-9bb305cd${_scopeId}>(optional)</span></label><input id="im-supplier"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(upload).lieferant)} class="input im-supplier" type="text" maxlength="80" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("list", __props.suppliers.length ? "im-suppliers" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(upload).errors.lieferant ? "true" : void 0)} aria-describedby="im-supplier-help im-supplier-err" data-v-9bb305cd${_scopeId}>`);
							if (__props.suppliers.length) {
								_push(`<datalist id="im-suppliers" data-v-9bb305cd${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.suppliers, (name) => {
									_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", name)} data-v-9bb305cd${_scopeId}></option>`);
								});
								_push(`<!--]--></datalist>`);
							} else _push(`<!---->`);
							_push(`<p id="im-supplier-help" class="form-field__help" data-v-9bb305cd${_scopeId}>Nennst du den Lieferanten, merkt sich der Import seine Spaltenzuordnung für die nächste Datei.</p><p id="im-supplier-err" class="form-field__error" data-v-9bb305cd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(upload).errors.lieferant)}</p></div><div class="form-field" data-v-9bb305cd${_scopeId}><label class="form-field__label" for="im-decimal" data-v-9bb305cd${_scopeId}>Kommazahlen in der Datei</label><select id="im-decimal" class="input im-decimal" aria-describedby="im-decimal-help" data-v-9bb305cd${_scopeId}><option value="komma" data-v-9bb305cd${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(upload).dezimal) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(upload).dezimal, "komma") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(upload).dezimal, "komma")) ? " selected" : ""}${_scopeId}>mit Komma: 8,5 und 189,00</option><option value="punkt" data-v-9bb305cd${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(upload).dezimal) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(upload).dezimal, "punkt") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(upload).dezimal, "punkt")) ? " selected" : ""}${_scopeId}>mit Punkt: 8.5 und 189.00</option></select><p id="im-decimal-help" class="form-field__help" data-v-9bb305cd${_scopeId}>Nur für CSV. Eine Excel-Datei liest der Import immer richtig.</p></div><div data-v-9bb305cd${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(upload).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(upload).processing ? "true" : void 0)} data-v-9bb305cd${_scopeId}>Probelauf starten</button></div></form></section>`);
						} else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="im-h-runs" data-v-9bb305cd${_scopeId}><div class="adm-section__head" data-v-9bb305cd${_scopeId}><h2 id="im-h-runs" class="adm-section__title" data-v-9bb305cd${_scopeId}>Bisherige Läufe</h2></div>`);
						if (__props.imports.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Hier steht jeder Probelauf und jeder Import, sobald die erste Datei geprüft ist."
						}, null, _parent, _scopeId));
						else {
							_push(`<div class="adm-panel" data-v-9bb305cd${_scopeId}><table class="adm-table" data-v-9bb305cd${_scopeId}><caption class="visually-hidden" data-v-9bb305cd${_scopeId}>Bisherige Probeläufe und Importe</caption><thead data-v-9bb305cd${_scopeId}><tr data-v-9bb305cd${_scopeId}><th scope="col" data-v-9bb305cd${_scopeId}>Datei</th><th scope="col" data-v-9bb305cd${_scopeId}>Stand</th><th scope="col" data-v-9bb305cd${_scopeId}>Ergebnis</th><th scope="col" data-v-9bb305cd${_scopeId}>Von</th><th scope="col" data-v-9bb305cd${_scopeId}>Wann</th></tr></thead><tbody data-v-9bb305cd${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.imports, (run) => {
								_push(`<tr data-v-9bb305cd${_scopeId}><td data-label="Datei" data-v-9bb305cd${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: run.href,
									class: "im-link"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(run.file)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(run.file), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`<span class="im-sub" data-v-9bb305cd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(run.supplier ? `${run.supplier} · ${run.format}` : run.format)}</span></td><td data-label="Stand" data-phone="status" data-v-9bb305cd${_scopeId}>`);
								if (run.status !== "applied") _push(`<span class="adm-tag adm-tag--neutral" data-v-9bb305cd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(run.statusLabel)}</span>`);
								else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(run.statusLabel)}<!--]-->`);
								_push(`</td><td data-label="Ergebnis" data-v-9bb305cd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(counts(run))}</td><td data-label="Von" data-phone="hide" data-v-9bb305cd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(run.by ?? "–")}</td><td data-label="Wann" class="im-when" data-v-9bb305cd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(run.at ?? "–")}</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						}
						if (__props.total > __props.imports.length) _push(`<p class="adm-note im-more" data-v-9bb305cd${_scopeId}>Hier stehen die letzten ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.imports.length, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.total, 0))} Läufen.</p>`);
						else _push(`<!---->`);
						_push(`</section>`);
					} else return [__props.can.preview ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
						key: 0,
						class: "adm-section",
						"aria-labelledby": "im-h-file"
					}, [
						(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "im-h-file",
							class: "adm-section__title"
						}, "Datei prüfen")]),
						(0, vue_exports.createVNode)("p", { class: "adm-note" }, [
							(0, vue_exports.createTextVNode)(" Eine Zeile ist eine Größe. Der Probelauf liest die Datei und zeigt, was sich ändern würde – im Katalog ändert sich dabei nichts. Zum Anfangen gibt es eine "),
							(0, vue_exports.createVNode)("a", {
								href: "/admin/katalog/import/beispiel.csv",
								download: ""
							}, "Beispieldatei"),
							(0, vue_exports.createTextVNode)(" mit allen Spalten. ")
						]),
						(0, vue_exports.createVNode)("dl", { class: "im-fields" }, [(0, vue_exports.createVNode)("div", { class: "im-fields__row" }, [(0, vue_exports.createVNode)("dt", null, "Pflicht"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(required).map((f) => f.label).join(", ")), 1)]), (0, vue_exports.createVNode)("div", { class: "im-fields__row" }, [(0, vue_exports.createVNode)("dt", null, "Optional"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(optional).map((f) => f.label).join(", ")), 1)])]),
						(0, vue_exports.createVNode)("p", { class: "adm-note im-rules" }, "Der Import erkennt die Spalten an ihrem Namen; im nächsten Schritt kannst du sie auch selbst zuordnen. Eine bekannte SKU ändert nur Preis, Bestand, EAN, KBA-Nummer und Gewicht. Maße ändert ein Import nie, Demodaten fasst er nicht an, und neue Felgen sind Entwürfe."),
						(0, vue_exports.createVNode)("p", {
							class: "visually-hidden",
							"aria-live": "assertive"
						}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(upload).errors.file ?? (0, vue_exports.unref)(upload).errors.lieferant ?? ""), 1),
						(0, vue_exports.createVNode)("form", {
							class: "im-form",
							onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("span", {
									id: "im-file-label",
									class: "form-field__label"
								}, "Datei (CSV oder Excel, höchstens 5 MB)"),
								(0, vue_exports.createVNode)(FilePick_default, {
									id: "im-file",
									modelValue: (0, vue_exports.unref)(upload).file,
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(upload).file = $event,
									onRefused: (name) => (0, vue_exports.unref)(upload).setError("file", `„${name}“ nimmt dieses Feld nicht – nur CSV oder Excel (.xlsx).`),
									accept: ".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
									invalid: !!(0, vue_exports.unref)(upload).errors.file,
									describedby: "im-file-label im-file-err"
								}, null, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"onRefused",
									"invalid"
								]),
								(0, vue_exports.createVNode)("p", {
									id: "im-file-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(upload).errors.file), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "im-supplier"
								}, [(0, vue_exports.createTextVNode)("Lieferant "), (0, vue_exports.createVNode)("span", { class: "im-optional" }, "(optional)")]),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "im-supplier",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(upload).lieferant = $event,
									class: "input im-supplier",
									type: "text",
									maxlength: "80",
									autocomplete: "off",
									list: __props.suppliers.length ? "im-suppliers" : void 0,
									"aria-invalid": (0, vue_exports.unref)(upload).errors.lieferant ? "true" : void 0,
									"aria-describedby": "im-supplier-help im-supplier-err"
								}, null, 8, [
									"onUpdate:modelValue",
									"list",
									"aria-invalid"
								]), [[vue_exports.vModelText, (0, vue_exports.unref)(upload).lieferant]]),
								__props.suppliers.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("datalist", {
									key: 0,
									id: "im-suppliers"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.suppliers, (name) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: name,
										value: name
									}, null, 8, ["value"]);
								}), 128))])) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("p", {
									id: "im-supplier-help",
									class: "form-field__help"
								}, "Nennst du den Lieferanten, merkt sich der Import seine Spaltenzuordnung für die nächste Datei."),
								(0, vue_exports.createVNode)("p", {
									id: "im-supplier-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(upload).errors.lieferant), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "im-decimal"
								}, "Kommazahlen in der Datei"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "im-decimal",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(upload).dezimal = $event,
									class: "input im-decimal",
									"aria-describedby": "im-decimal-help"
								}, [(0, vue_exports.createVNode)("option", { value: "komma" }, "mit Komma: 8,5 und 189,00"), (0, vue_exports.createVNode)("option", { value: "punkt" }, "mit Punkt: 8.5 und 189.00")], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(upload).dezimal]]),
								(0, vue_exports.createVNode)("p", {
									id: "im-decimal-help",
									class: "form-field__help"
								}, "Nur für CSV. Eine Excel-Datei liest der Import immer richtig.")
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
						"aria-labelledby": "im-h-runs"
					}, [
						(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "im-h-runs",
							class: "adm-section__title"
						}, "Bisherige Läufe")]),
						__props.imports.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 0,
							kind: "empty",
							text: "Hier steht jeder Probelauf und jeder Import, sobald die erste Datei geprüft ist."
						})) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "adm-panel"
						}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
							(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Bisherige Probeläufe und Importe"),
							(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Datei"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Stand"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Ergebnis"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Von"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Wann")
							])]),
							(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.imports, (run) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: run.id }, [
									(0, vue_exports.createVNode)("td", { "data-label": "Datei" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
										href: run.href,
										class: "im-link"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(run.file), 1)]),
										_: 2
									}, 1032, ["href"]), (0, vue_exports.createVNode)("span", { class: "im-sub" }, (0, vue_exports.toDisplayString)(run.supplier ? `${run.supplier} · ${run.format}` : run.format), 1)]),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Stand",
										"data-phone": "status"
									}, [run.status !== "applied" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "adm-tag adm-tag--neutral"
									}, (0, vue_exports.toDisplayString)(run.statusLabel), 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(run.statusLabel), 1)], 64))]),
									(0, vue_exports.createVNode)("td", { "data-label": "Ergebnis" }, (0, vue_exports.toDisplayString)(counts(run)), 1),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Von",
										"data-phone": "hide"
									}, (0, vue_exports.toDisplayString)(run.by ?? "–"), 1),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Wann",
										class: "im-when"
									}, (0, vue_exports.toDisplayString)(run.at ?? "–"), 1)
								]);
							}), 128))])
						])])),
						__props.total > __props.imports.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 2,
							class: "adm-note im-more"
						}, "Hier stehen die letzten " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.imports.length, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.total, 0)) + " Läufen.", 1)) : (0, vue_exports.createCommentVNode)("", true)
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Katalog/Import.vue
var _sfc_setup = Import_vue_vue_type_script_setup_true_lang_default.setup;
Import_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Katalog/Import.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Import_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Import_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9bb305cd"]]);
//#endregion
export { Import_default as default };
