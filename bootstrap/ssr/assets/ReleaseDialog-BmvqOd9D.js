import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-BPdFERzS.js";
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
		*
		* The count itself is taken before the rows (CountCard, ADMIN-GEFUNDEN 511): here it is shown, not asked. Only a draft
		* with rows that was never counted is asked for it here — each figure with its page — and it is recorded as counted after
		* the entry.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const emit = __emit;
		const partOfReport = (0, vue_exports.computed)(() => props.document.kind === "TEILEGUTACHTEN");
		const stored = (0, vue_exports.computed)(() => props.mode === "release" && props.rows > 0 ? props.document.count ?? null : null);
		const counts = (0, vue_exports.computed)(() => props.mode === "release" && props.rows > 0 && !props.document.count);
		const form = useForm({
			completeness: "",
			missing: "",
			codes: "",
			codes_page: "",
			sizes: "",
			sizes_page: "",
			axle_limit_kg: "",
			axle_limit_page: "",
			abnahme: "",
			abnahme_page: ""
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
					codes_page: number(data.codes_page),
					sizes: number(data.sizes),
					sizes_page: number(data.sizes_page),
					axle_limit_kg: number(data.axle_limit_kg),
					axle_limit_page: data.axle_limit_kg === "" ? null : number(data.axle_limit_page),
					abnahme: data.abnahme === "" ? null : data.abnahme,
					abnahme_page: data.abnahme === "all" || data.abnahme === "some" ? number(data.abnahme_page) : null
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
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-7334b35c${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="rd-form"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.mode === "release" ? "Freigeben" : "Speichern")}</button>`);
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
						_push(`<form id="rd-form" class="rd" novalidate data-v-7334b35c${_scopeId}>`);
						if (__props.note) _push(`<p class="adm-note" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.note)}</p>`);
						else _push(`<!---->`);
						_push(`<fieldset class="rd-group" data-v-7334b35c${_scopeId}><legend class="form-field__label" data-v-7334b35c${_scopeId}>Sind alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst?</legend><label class="check" data-v-7334b35c${_scopeId}><input id="rd-c-complete"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).completeness, "complete")) ? " checked" : ""} type="radio" name="rd-c" value="complete" aria-describedby="rd-c-err" data-v-7334b35c${_scopeId}><span data-v-7334b35c${_scopeId}>Ja, alle – dann sagt der Shop zu jedem Fahrzeug, das hier nicht steht, „nicht freigegeben“.</span></label><label class="check" data-v-7334b35c${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).completeness, "partial")) ? " checked" : ""} type="radio" name="rd-c" value="partial" aria-describedby="rd-c-err" data-v-7334b35c${_scopeId}><span data-v-7334b35c${_scopeId}>Teilweise – Anlagen oder Bereiche fehlen. Fahrzeuge, die hier nicht stehen, sind im Shop „noch nicht bestätigt“.</span></label><label class="check" data-v-7334b35c${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).completeness, "unknown")) ? " checked" : ""} type="radio" name="rd-c" value="unknown" aria-describedby="rd-c-err" data-v-7334b35c${_scopeId}><span data-v-7334b35c${_scopeId}>Weiß ich nicht – Fahrzeuge, die hier nicht stehen, sind im Shop „noch nicht bestätigt“.</span></label>`);
						if (partOfReport.value) _push(`<p class="form-field__help" data-v-7334b35c${_scopeId}>Ein Teilegutachten ist meist eine Anlage eines längeren Prüfberichts – deshalb steht „Teilweise“ schon da.</p>`);
						else _push(`<!---->`);
						_push(`<p id="rd-c-err" class="form-field__error" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.completeness)}</p></fieldset>`);
						if ((0, vue_exports.unref)(form).completeness === "partial") _push(`<div class="form-field" data-v-7334b35c${_scopeId}><label class="form-field__label" for="rd-missing" data-v-7334b35c${_scopeId}>Welche Anlagen oder Bereiche fehlen?</label><input id="rd-missing"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).missing)} class="input" type="text" maxlength="255" placeholder="z. B. Anlagen 1–15"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.missing ? "true" : void 0)} aria-describedby="rd-missing-err" data-v-7334b35c${_scopeId}><p id="rd-missing-err" class="form-field__error" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.missing)}</p></div>`);
						else _push(`<!---->`);
						if (stored.value) {
							_push(`<div class="rd-stored" data-v-7334b35c${_scopeId}><p class="form-field__label" data-v-7334b35c${_scopeId}>Die Freigabe vergleicht die Zeilen mit dieser Zählung</p><ul class="rd-lines" data-v-7334b35c${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(stored.value.lines, (line) => {
								_push(`<li data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line)}</li>`);
							});
							_push(`<!--]--></ul>`);
							if (!stored.value.beforeEntry) _push(`<p class="form-field__help" data-v-7334b35c${_scopeId}>Gezählt, als schon Zeilen standen.</p>`);
							else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						if (counts.value) {
							_push(`<!--[--><p class="adm-note" data-v-7334b35c${_scopeId}>Zähl im PDF, was der Verwendungsbereich für die erfassten Fahrzeuge nennt, und schreib zu jeder Zahl die Seite. Der Shop zählt dasselbe in deinen Zeilen und gibt nur frei, wenn beides übereinstimmt. Festgehalten wird, dass nach der Erfassung gezählt wurde.</p><div class="rd-pair" data-v-7334b35c${_scopeId}><div class="form-field" data-v-7334b35c${_scopeId}><label class="form-field__label" for="rd-codes" data-v-7334b35c${_scopeId}>Auflagen-Codes</label><input id="rd-codes"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).codes)} class="input" type="number" min="0" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.codes ? "true" : void 0)} aria-describedby="rd-codes-err" data-v-7334b35c${_scopeId}><p id="rd-codes-err" class="form-field__error" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.codes)}</p></div><div class="form-field" data-v-7334b35c${_scopeId}><label class="form-field__label" for="rd-codes-page" data-v-7334b35c${_scopeId}>Seite</label><input id="rd-codes-page"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).codes_page)} class="input" type="number" min="1" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.codes_page ? "true" : void 0)} aria-describedby="rd-codes-page-err" data-v-7334b35c${_scopeId}><p id="rd-codes-page-err" class="form-field__error" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.codes_page)}</p></div></div><div class="rd-pair" data-v-7334b35c${_scopeId}><div class="form-field" data-v-7334b35c${_scopeId}><label class="form-field__label" for="rd-sizes" data-v-7334b35c${_scopeId}>Reifengrößen</label><input id="rd-sizes"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).sizes)} class="input" type="number" min="1" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.sizes ? "true" : void 0)} aria-describedby="rd-sizes-err" data-v-7334b35c${_scopeId}><p id="rd-sizes-err" class="form-field__error" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.sizes)}</p></div><div class="form-field" data-v-7334b35c${_scopeId}><label class="form-field__label" for="rd-sizes-page" data-v-7334b35c${_scopeId}>Seite</label><input id="rd-sizes-page"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).sizes_page)} class="input" type="number" min="1" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.sizes_page ? "true" : void 0)} aria-describedby="rd-sizes-page-err" data-v-7334b35c${_scopeId}><p id="rd-sizes-page-err" class="form-field__error" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.sizes_page)}</p></div></div><div class="rd-pair" data-v-7334b35c${_scopeId}><div class="form-field" data-v-7334b35c${_scopeId}><label class="form-field__label" for="rd-limit" data-v-7334b35c${_scopeId}>Achslastgrenze in kg</label><input id="rd-limit"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).axle_limit_kg)} class="input" type="number" min="200" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.axle_limit_kg ? "true" : void 0)} aria-describedby="rd-limit-help rd-limit-err" data-v-7334b35c${_scopeId}><p id="rd-limit-help" class="form-field__help" data-v-7334b35c${_scopeId}>Nur, wenn der Verwendungsbereich eine nennt – etwa „nur für Fahrzeuge mit maximaler Achslast 1160 kg“. Sonst leer lassen.</p><p id="rd-limit-err" class="form-field__error" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.axle_limit_kg)}</p></div>`);
							if ((0, vue_exports.unref)(form).axle_limit_kg !== "") _push(`<div class="form-field" data-v-7334b35c${_scopeId}><label class="form-field__label" for="rd-limit-page" data-v-7334b35c${_scopeId}>Seite</label><input id="rd-limit-page"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).axle_limit_page)} class="input" type="number" min="1" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.axle_limit_page ? "true" : void 0)} aria-describedby="rd-limit-page-err" data-v-7334b35c${_scopeId}><p id="rd-limit-page-err" class="form-field__error" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.axle_limit_page)}</p></div>`);
							else _push(`<!---->`);
							_push(`</div><fieldset class="rd-group" data-v-7334b35c${_scopeId}><legend class="form-field__label" data-v-7334b35c${_scopeId}>Verlangt der Verwendungsbereich eine Abnahme?</legend><label class="check" data-v-7334b35c${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).abnahme, "all")) ? " checked" : ""} type="radio" name="rd-a" value="all" aria-describedby="rd-a-err" data-v-7334b35c${_scopeId}><span data-v-7334b35c${_scopeId}>Ja, bei jeder Kombination</span></label><label class="check" data-v-7334b35c${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).abnahme, "some")) ? " checked" : ""} type="radio" name="rd-a" value="some" aria-describedby="rd-a-err" data-v-7334b35c${_scopeId}><span data-v-7334b35c${_scopeId}>Ja, bei einigen Kombinationen</span></label><label class="check" data-v-7334b35c${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).abnahme, "none")) ? " checked" : ""} type="radio" name="rd-a" value="none" aria-describedby="rd-a-err" data-v-7334b35c${_scopeId}><span data-v-7334b35c${_scopeId}>Nein</span></label><p id="rd-a-err" class="form-field__error" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.abnahme)}</p></fieldset>`);
							if ((0, vue_exports.unref)(form).abnahme === "all" || (0, vue_exports.unref)(form).abnahme === "some") _push(`<div class="form-field rd-page" data-v-7334b35c${_scopeId}><label class="form-field__label" for="rd-a-page" data-v-7334b35c${_scopeId}>Seite der Abnahme</label><input id="rd-a-page"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).abnahme_page)} class="input" type="number" min="1" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.abnahme_page ? "true" : void 0)} aria-describedby="rd-a-page-err" data-v-7334b35c${_scopeId}><p id="rd-a-page-err" class="form-field__error" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.abnahme_page)}</p></div>`);
							else _push(`<!---->`);
							_push(`<!--]-->`);
						} else _push(`<!---->`);
						if (errors.value.release) _push(`<p class="adm-alert" role="alert" data-v-7334b35c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.release)}</p>`);
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
						stored.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 2,
							class: "rd-stored"
						}, [
							(0, vue_exports.createVNode)("p", { class: "form-field__label" }, "Die Freigabe vergleicht die Zeilen mit dieser Zählung"),
							(0, vue_exports.createVNode)("ul", { class: "rd-lines" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(stored.value.lines, (line) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: line }, (0, vue_exports.toDisplayString)(line), 1);
							}), 128))]),
							!stored.value.beforeEntry ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "form-field__help"
							}, "Gezählt, als schon Zeilen standen.")) : (0, vue_exports.createCommentVNode)("", true)
						])) : (0, vue_exports.createCommentVNode)("", true),
						counts.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [
							(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Zähl im PDF, was der Verwendungsbereich für die erfassten Fahrzeuge nennt, und schreib zu jeder Zahl die Seite. Der Shop zählt dasselbe in deinen Zeilen und gibt nur frei, wenn beides übereinstimmt. Festgehalten wird, dass nach der Erfassung gezählt wurde."),
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
									for: "rd-codes-page"
								}, "Seite"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rd-codes-page",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).codes_page = $event,
									class: "input",
									type: "number",
									min: "1",
									inputmode: "numeric",
									"aria-invalid": errors.value.codes_page ? "true" : void 0,
									"aria-describedby": "rd-codes-page-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).codes_page]]),
								(0, vue_exports.createVNode)("p", {
									id: "rd-codes-page-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.codes_page), 1)
							])]),
							(0, vue_exports.createVNode)("div", { class: "rd-pair" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
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
							]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rd-sizes-page"
								}, "Seite"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rd-sizes-page",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).sizes_page = $event,
									class: "input",
									type: "number",
									min: "1",
									inputmode: "numeric",
									"aria-invalid": errors.value.sizes_page ? "true" : void 0,
									"aria-describedby": "rd-sizes-page-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).sizes_page]]),
								(0, vue_exports.createVNode)("p", {
									id: "rd-sizes-page-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.sizes_page), 1)
							])]),
							(0, vue_exports.createVNode)("div", { class: "rd-pair" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
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
							]), (0, vue_exports.unref)(form).axle_limit_kg !== "" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: "form-field"
							}, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rd-limit-page"
								}, "Seite"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rd-limit-page",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).axle_limit_page = $event,
									class: "input",
									type: "number",
									min: "1",
									inputmode: "numeric",
									"aria-invalid": errors.value.axle_limit_page ? "true" : void 0,
									"aria-describedby": "rd-limit-page-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).axle_limit_page]]),
								(0, vue_exports.createVNode)("p", {
									id: "rd-limit-page-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.axle_limit_page), 1)
							])) : (0, vue_exports.createCommentVNode)("", true)]),
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
							]),
							(0, vue_exports.unref)(form).abnahme === "all" || (0, vue_exports.unref)(form).abnahme === "some" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: "form-field rd-page"
							}, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rd-a-page"
								}, "Seite der Abnahme"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rd-a-page",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).abnahme_page = $event,
									class: "input",
									type: "number",
									min: "1",
									inputmode: "numeric",
									"aria-invalid": errors.value.abnahme_page ? "true" : void 0,
									"aria-describedby": "rd-a-page-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).abnahme_page]]),
								(0, vue_exports.createVNode)("p", {
									id: "rd-a-page-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.abnahme_page), 1)
							])) : (0, vue_exports.createCommentVNode)("", true)
						], 64)) : (0, vue_exports.createCommentVNode)("", true),
						errors.value.release ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 4,
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
var ReleaseDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ReleaseDialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7334b35c"]]);
//#endregion
export { ReleaseDialog_exports as n, ReleaseDialog_default as t };
