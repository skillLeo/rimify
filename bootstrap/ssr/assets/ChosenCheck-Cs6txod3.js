import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as Icon_default } from "./Icon-D4PPT3t7.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ConditionGroups_default } from "./ConditionGroups-BwdOTId-.js";
import { a as entryLine } from "./papers-74qppL1N.js";
import { i as fitsWhole, n as LINE_ROOM, r as countedDe } from "./auflagen-GU7i_IxY.js";
//#region resources/js/Pages/Komplettrad/parts/ChosenCheck.vue?vue&type=script&setup=true&lang.ts
var ChosenCheck_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ChosenCheck",
	__ssrInlineRender: true,
	props: {
		answer: {},
		vehicle: {},
		sizes: {},
		papersExempt: { type: Boolean },
		document: {}
	},
	setup(__props) {
		/**
		* The RIMIFY-Check for the tyre sizes chosen in the Komplettrad's tyre step (D-488, the client's review of 19.11.2026): what the
		* Gutachten asks of exactly this combination — its Auflagen, or „Keine Auflagen.“ —, the Eintragung where a code asks for it,
		* and the document to read it in. Its colour is the one the admin gave the codes (D-439): red, yellow or green, loudest first;
		* an Auflage without a colour of its own is the yellow caution. Every word comes from the server's answer (ConditionGroups).
		*/
		const props = __props;
		const standing = (0, vue_exports.computed)(() => props.answer.standing ?? (props.answer.combination.length > 0 || props.answer.sizes.some((s) => s.conditions.length > 0) ? "auflagen" : "keine"));
		const tone = (0, vue_exports.computed)(() => {
			if (standing.value !== "auflagen") return {
				cls: "",
				icon: "check-circle"
			};
			return props.answer.hint === "red" ? {
				cls: "rcheck-panel--danger",
				icon: "warning"
			} : props.answer.hint === "green" ? {
				cls: "",
				icon: "info"
			} : {
				cls: "rcheck-panel--warn",
				icon: "warning"
			};
		});
		const headline = (0, vue_exports.computed)(() => standing.value === "auflagen" ? `Mit Auflagen freigegeben für ${props.vehicle}` : `Freigegeben für ${props.vehicle}`);
		const entry = (0, vue_exports.computed)(() => props.answer.entry === true ? entryLine(true, props.papersExempt) : null);
		const sentences = (0, vue_exports.computed)(() => [...props.answer.combination, ...props.answer.sizes.flatMap((size) => size.conditions)]);
		const folded = (0, vue_exports.computed)(() => !fitsWhole(sentences.value, LINE_ROOM));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: ["rcheck-panel cc", tone.value.cls],
				"aria-labelledby": "cc-h",
				"data-chosen-check": ""
			}, _attrs))} data-v-0d7dd9f4><p class="rcheck-panel__head" data-v-0d7dd9f4>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: tone.value.icon,
				size: 20
			}, null, _parent));
			_push(` RIMIFY-Check </p><h3 id="cc-h" class="rcheck-panel__vehicle" data-v-0d7dd9f4>${(0, server_renderer_exports.ssrInterpolate)(headline.value)}</h3><p class="cc__sizes" data-v-0d7dd9f4>mit <span class="data" translate="no" data-v-0d7dd9f4>${(0, server_renderer_exports.ssrInterpolate)(__props.sizes)}</span></p>`);
			if (entry.value) _push(`<p class="cc__entry" data-v-0d7dd9f4>${(0, server_renderer_exports.ssrInterpolate)(entry.value)}</p>`);
			else _push(`<!---->`);
			if (standing.value === "keine") _push(`<p class="cc__none" data-v-0d7dd9f4>Keine Auflagen.</p>`);
			else if (standing.value === "hinweise") _push(`<p class="cc__notes" data-v-0d7dd9f4>Mit Hinweisen aus dem Gutachten – nichts davon musst du tun.</p>`);
			else _push(`<!---->`);
			if (standing.value !== "keine") {
				_push(`<!--[-->`);
				if (folded.value) {
					_push(`<details class="cc__fold" data-v-0d7dd9f4><summary class="cc__toggle" data-v-0d7dd9f4>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(countedDe)(sentences.value.length))} anzeigen</summary>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
						groups: __props.answer,
						omit: entry.value ? [entry.value] : []
					}, null, _parent));
					_push(`</details>`);
				} else _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
					groups: __props.answer,
					omit: entry.value ? [entry.value] : []
				}, null, _parent));
				_push(`<!--]-->`);
			} else _push(`<!---->`);
			if (__props.document) {
				_push(`<p class="cc__doc" data-v-0d7dd9f4><a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.document.url)} target="_blank" rel="noopener" data-v-0d7dd9f4> Gutachten öffnen (`);
				if (__props.document.example) _push(`<!--[-->Beispiel, <!--]-->`);
				else _push(`<!---->`);
				_push(`PDF`);
				if (__props.document.page) _push(`<!--[-->, Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.document.page)}<!--]-->`);
				else _push(`<!---->`);
				_push(`) </a></p>`);
			} else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Komplettrad/parts/ChosenCheck.vue
var ChosenCheck_exports = /* @__PURE__ */ __exportAll({ default: () => ChosenCheck_default });
var _sfc_setup = ChosenCheck_vue_vue_type_script_setup_true_lang_default.setup;
ChosenCheck_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Komplettrad/parts/ChosenCheck.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ChosenCheck_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ChosenCheck_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0d7dd9f4"]]);
//#endregion
export { ChosenCheck_exports as n, ChosenCheck_default as t };
