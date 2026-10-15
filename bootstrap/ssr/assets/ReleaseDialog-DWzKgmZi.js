import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-C-07FMpe.js";
import { o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as focusRefused } from "./focusRefused-BCX3fX_F.js";
//#region resources/js/Pages/Admin/Gutachten/ReleaseDialog.vue?vue&type=script&setup=true&lang.ts
var ReleaseDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ReleaseDialog",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		document: {},
		rows: {},
		mode: {},
		note: {}
	}, {
		"open": {
			type: Boolean,
			required: true
		},
		"openModifiers": {}
	}),
	emits: /*@__PURE__*/ (0, vue_exports.mergeModels)(["done"], ["update:open"]),
	setup(__props, { emit: __emit }) {
		/**
		* „Freigeben“ and „Ist alles erfasst?“ (D-227, D-228): what the person releasing reads off the PDF, asked every time and
		* never defaulted — a question someone skips must stop the release, not pass it. Only the type speaks first: a
		* Teilegutachten is usually one Anlage of a longer report and always needs an Abnahme, so it starts at „Teilweise“ and
		* „Ja“. The server counts the same things in the rows and refuses on any difference.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const emit = __emit;
		const partOfReport = (0, vue_exports.computed)(() => props.document.kind === "TEILEGUTACHTEN");
		const counts = (0, vue_exports.computed)(() => props.mode === "release" && props.rows > 0);
		const form = useForm({
			completeness: "",
			missing: "",
			codes: "",
			sizes: "",
			axle_limit_kg: "",
			abnahme: ""
		});
		function preset() {
			form.reset();
			form.clearErrors();
			if (props.mode === "answer") {
				form.completeness = props.document.completeness ?? (partOfReport.value ? "partial" : "");
				form.missing = props.document.missingAnnexes ?? "";
			} else if (partOfReport.value) {
				form.completeness = "partial";
				form.abnahme = "all";
			}
		}
		(0, vue_exports.watch)(open, (now) => {
			if (now) preset();
		}, { immediate: true });
		const number = (value) => value === "" || value === null ? null : Number(value);
		function submit() {
			form.transform((data) => ({
				completeness: data.completeness === "" ? null : data.completeness,
				missing: data.completeness === "partial" ? data.missing : null,
				...counts.value ? {
					codes: number(data.codes),
					sizes: number(data.sizes),
					axle_limit_kg: number(data.axle_limit_kg),
					abnahme: data.abnahme === "" ? null : data.abnahme
				} : {}
			})).post(`/admin/gutachten/${props.document.id}/${props.mode === "release" ? "freigeben" : "vollstaendigkeit"}`, {
				preserveScroll: true,
				onSuccess: () => {
					open.value = false;
					emit("done");
				},
				onError: () => focusRefused(".rd")
			});
		}
		const errors = (0, vue_exports.computed)(() => form.errors);
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: __props.mode === "release" ? "Gutachten freigeben" : "Ist alles erfasst?",
				description: __props.document.label,
				"content-class": "adm-dialog rd-dialog",
				"initial-focus": "#rd-c-complete",
				wide: ""
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-11d99515${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="rd-form"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-11d99515${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.mode === "release" ? "Freigeben" : "Speichern")}</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open.value = false
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "submit",
						form: "rd-form",
						disabled: (0, vue_exports.unref)(form).processing,
						"aria-busy": (0, vue_exports.unref)(form).processing ? "true" : void 0
					}, (0, vue_exports.toDisplayString)(__props.mode === "release" ? "Freigeben" : "Speichern"), 9, ["disabled", "aria-busy"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<form id="rd-form" class="rd" novalidate data-v-11d99515${_scopeId}>`);
						if (__props.note) _push(`<p class="adm-note" data-v-11d99515${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.note)}</p>`);
						else _push(`<!---->`);
						_push(`<fieldset class="rd-group" data-v-11d99515${_scopeId}><legend class="form-field__label" data-v-11d99515${_scopeId}>Sind alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst?</legend><label class="check" data-v-11d99515${_scopeId}><input id="rd-c-complete"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).completeness, "complete")) ? " checked" : ""} type="radio" name="rd-c" value="complete" aria-describedby="rd-c-err" data-v-11d99515${_scopeId}><span data-v-11d99515${_scopeId}>Ja, alle – dann sagt der Shop zu jedem Fahrzeug, das hier nicht steht, „nicht freigegeben“.</span></label><label class="check" data-v-11d99515${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).completeness, "partial")) ? " checked" : ""} type="radio" name="rd-c" value="partial" aria-describedby="rd-c-err" data-v-11d99515${_scopeId}><span data-v-11d99515${_scopeId}>Teilweise – Anlagen oder Bereiche fehlen. Fahrzeuge, die hier nicht stehen, sind im Shop „noch nicht bestätigt“.</span></label><label class="check" data-v-11d99515${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).completeness, "unknown")) ? " checked" : ""} type="radio" name="rd-c" value="unknown" aria-describedby="rd-c-err" data-v-11d99515${_scopeId}><span data-v-11d99515${_scopeId}>Weiß ich nicht – Fahrzeuge, die hier nicht stehen, sind im Shop „noch nicht bestätigt“.</span></label>`);
						if (partOfReport.value) _push(`<p class="form-field__help" data-v-11d99515${_scopeId}>Ein Teilegutachten ist meist eine Anlage eines längeren Prüfberichts – deshalb steht „Teilweise“ schon da.</p>`);
						else _push(`<!---->`);
						_push(`<p id="rd-c-err" class="form-field__error" data-v-11d99515${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.completeness)}</p></fieldset>`);
						if ((0, vue_exports.unref)(form).completeness === "partial") _push(`<div class="form-field" data-v-11d99515${_scopeId}><label class="form-field__label" for="rd-missing" data-v-11d99515${_scopeId}>Welche Anlagen oder Bereiche fehlen?</label><input id="rd-missing"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).missing)} class="input" type="text" maxlength="255" placeholder="z. B. Anlagen 1–15"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.missing ? "true" : void 0)} aria-describedby="rd-missing-err" data-v-11d99515${_scopeId}><p id="rd-missing-err" class="form-field__error" data-v-11d99515${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.missing)}</p></div>`);
						else _push(`<!---->`);
						if (counts.value) _push(`<!--[--><p class="adm-note" data-v-11d99515${_scopeId}>Zähl im PDF, was der Verwendungsbereich für die erfassten Fahrzeuge nennt. Der Shop zählt dasselbe in deinen Zeilen und gibt nur frei, wenn beides übereinstimmt.</p><div class="rd-pair" data-v-11d99515${_scopeId}><div class="form-field" data-v-11d99515${_scopeId}><label class="form-field__label" for="rd-codes" data-v-11d99515${_scopeId}>Auflagen-Codes</label><input id="rd-codes"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).codes)} class="input" type="number" min="0" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.codes ? "true" : void 0)} aria-describedby="rd-codes-err" data-v-11d99515${_scopeId}><p id="rd-codes-err" class="form-field__error" data-v-11d99515${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.codes)}</p></div><div class="form-field" data-v-11d99515${_scopeId}><label class="form-field__label" for="rd-sizes" data-v-11d99515${_scopeId}>Reifengrößen</label><input id="rd-sizes"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).sizes)} class="input" type="number" min="1" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.sizes ? "true" : void 0)} aria-describedby="rd-sizes-err" data-v-11d99515${_scopeId}><p id="rd-sizes-err" class="form-field__error" data-v-11d99515${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.sizes)}</p></div></div><div class="form-field" data-v-11d99515${_scopeId}><label class="form-field__label" for="rd-limit" data-v-11d99515${_scopeId}>Achslastgrenze in kg</label><input id="rd-limit"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).axle_limit_kg)} class="input" type="number" min="200" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.axle_limit_kg ? "true" : void 0)} aria-describedby="rd-limit-help rd-limit-err" data-v-11d99515${_scopeId}><p id="rd-limit-help" class="form-field__help" data-v-11d99515${_scopeId}>Nur, wenn der Verwendungsbereich eine nennt – etwa „nur für Fahrzeuge mit maximaler Achslast 1160 kg“. Sonst leer lassen.</p><p id="rd-limit-err" class="form-field__error" data-v-11d99515${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.axle_limit_kg)}</p></div><fieldset class="rd-group" data-v-11d99515${_scopeId}><legend class="form-field__label" data-v-11d99515${_scopeId}>Verlangt der Verwendungsbereich eine Abnahme?</legend><label class="check" data-v-11d99515${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).abnahme, "all")) ? " checked" : ""} type="radio" name="rd-a" value="all" aria-describedby="rd-a-err" data-v-11d99515${_scopeId}><span data-v-11d99515${_scopeId}>Ja, bei jeder Kombination</span></label><label class="check" data-v-11d99515${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).abnahme, "some")) ? " checked" : ""} type="radio" name="rd-a" value="some" aria-describedby="rd-a-err" data-v-11d99515${_scopeId}><span data-v-11d99515${_scopeId}>Ja, bei einigen Kombinationen</span></label><label class="check" data-v-11d99515${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).abnahme, "none")) ? " checked" : ""} type="radio" name="rd-a" value="none" aria-describedby="rd-a-err" data-v-11d99515${_scopeId}><span data-v-11d99515${_scopeId}>Nein</span></label><p id="rd-a-err" class="form-field__error" data-v-11d99515${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.abnahme)}</p></fieldset><!--]-->`);
						else _push(`<!---->`);
						if (errors.value.release) _push(`<p class="adm-alert" role="alert" data-v-11d99515${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.release)}</p>`);
						else _push(`<!---->`);
						_push(`</form>`);
					} else return [(0, vue_exports.createVNode)("form", {
						id: "rd-form",
						class: "rd",
						novalidate: "",
						onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
					}, [
						__props.note ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-note"
						}, (0, vue_exports.toDisplayString)(__props.note), 1)) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("fieldset", { class: "rd-group" }, [
							(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Sind alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst?"),
							(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "rd-c-complete",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).completeness = $event,
								type: "radio",
								name: "rd-c",
								value: "complete",
								"aria-describedby": "rd-c-err"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).completeness]]), (0, vue_exports.createVNode)("span", null, "Ja, alle – dann sagt der Shop zu jedem Fahrzeug, das hier nicht steht, „nicht freigegeben“.")]),
							(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).completeness = $event,
								type: "radio",
								name: "rd-c",
								value: "partial",
								"aria-describedby": "rd-c-err"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).completeness]]), (0, vue_exports.createVNode)("span", null, "Teilweise – Anlagen oder Bereiche fehlen. Fahrzeuge, die hier nicht stehen, sind im Shop „noch nicht bestätigt“.")]),
							(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).completeness = $event,
								type: "radio",
								name: "rd-c",
								value: "unknown",
								"aria-describedby": "rd-c-err"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).completeness]]), (0, vue_exports.createVNode)("span", null, "Weiß ich nicht – Fahrzeuge, die hier nicht stehen, sind im Shop „noch nicht bestätigt“.")]),
							partOfReport.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "form-field__help"
							}, "Ein Teilegutachten ist meist eine Anlage eines längeren Prüfberichts – deshalb steht „Teilweise“ schon da.")) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("p", {
								id: "rd-c-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.completeness), 1)
						]),
						(0, vue_exports.unref)(form).completeness === "partial" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "form-field"
						}, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "rd-missing"
							}, "Welche Anlagen oder Bereiche fehlen?"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "rd-missing",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).missing = $event,
								class: "input",
								type: "text",
								maxlength: "255",
								placeholder: "z. B. Anlagen 1–15",
								"aria-invalid": errors.value.missing ? "true" : void 0,
								"aria-describedby": "rd-missing-err"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).missing]]),
							(0, vue_exports.createVNode)("p", {
								id: "rd-missing-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.missing), 1)
						])) : (0, vue_exports.createCommentVNode)("", true),
						counts.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [
							(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Zähl im PDF, was der Verwendungsbereich für die erfassten Fahrzeuge nennt. Der Shop zählt dasselbe in deinen Zeilen und gibt nur frei, wenn beides übereinstimmt."),
							(0, vue_exports.createVNode)("div", { class: "rd-pair" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rd-codes"
								}, "Auflagen-Codes"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rd-codes",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).codes = $event,
									class: "input",
									type: "number",
									min: "0",
									inputmode: "numeric",
									"aria-invalid": errors.value.codes ? "true" : void 0,
									"aria-describedby": "rd-codes-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).codes]]),
								(0, vue_exports.createVNode)("p", {
									id: "rd-codes-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.codes), 1)
							]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rd-sizes"
								}, "Reifengrößen"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rd-sizes",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).sizes = $event,
									class: "input",
									type: "number",
									min: "1",
									inputmode: "numeric",
									"aria-invalid": errors.value.sizes ? "true" : void 0,
									"aria-describedby": "rd-sizes-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).sizes]]),
								(0, vue_exports.createVNode)("p", {
									id: "rd-sizes-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.sizes), 1)
							])]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rd-limit"
								}, "Achslastgrenze in kg"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rd-limit",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).axle_limit_kg = $event,
									class: "input",
									type: "number",
									min: "200",
									inputmode: "numeric",
									"aria-invalid": errors.value.axle_limit_kg ? "true" : void 0,
									"aria-describedby": "rd-limit-help rd-limit-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).axle_limit_kg]]),
								(0, vue_exports.createVNode)("p", {
									id: "rd-limit-help",
									class: "form-field__help"
								}, "Nur, wenn der Verwendungsbereich eine nennt – etwa „nur für Fahrzeuge mit maximaler Achslast 1160 kg“. Sonst leer lassen."),
								(0, vue_exports.createVNode)("p", {
									id: "rd-limit-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.axle_limit_kg), 1)
							]),
							(0, vue_exports.createVNode)("fieldset", { class: "rd-group" }, [
								(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Verlangt der Verwendungsbereich eine Abnahme?"),
								(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).abnahme = $event,
									type: "radio",
									name: "rd-a",
									value: "all",
									"aria-describedby": "rd-a-err"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).abnahme]]), (0, vue_exports.createVNode)("span", null, "Ja, bei jeder Kombination")]),
								(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).abnahme = $event,
									type: "radio",
									name: "rd-a",
									value: "some",
									"aria-describedby": "rd-a-err"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).abnahme]]), (0, vue_exports.createVNode)("span", null, "Ja, bei einigen Kombinationen")]),
								(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).abnahme = $event,
									type: "radio",
									name: "rd-a",
									value: "none",
									"aria-describedby": "rd-a-err"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).abnahme]]), (0, vue_exports.createVNode)("span", null, "Nein")]),
								(0, vue_exports.createVNode)("p", {
									id: "rd-a-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.abnahme), 1)
							])
						], 64)) : (0, vue_exports.createCommentVNode)("", true),
						errors.value.release ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 3,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(errors.value.release), 1)) : (0, vue_exports.createCommentVNode)("", true)
					], 32)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/ReleaseDialog.vue
var ReleaseDialog_exports = /* @__PURE__ */ __exportAll({ default: () => ReleaseDialog_default });
var _sfc_setup = ReleaseDialog_vue_vue_type_script_setup_true_lang_default.setup;
ReleaseDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/ReleaseDialog.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ReleaseDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ReleaseDialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-11d99515"]]);
//#endregion
export { ReleaseDialog_exports as n, ReleaseDialog_default as t };
