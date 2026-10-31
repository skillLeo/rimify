import { T as useShared } from "./useShopFeedback-kwWPjrW3.js";
import { a as link_default, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AppLayout_default } from "./AppLayout-Dgveskj-.js";
import { t as ValueText_default } from "./ValueText-BQCTeKZ_.js";
import { a as EtCalculator_default, i as OffsetDrawing_default, n as useEtRechner, r as RechnerShare_default, t as DISCLAIMER } from "./rechner-CcN4taOU.js";
//#region resources/js/Pages/Felgenrechner/Desktop.vue?vue&type=script&setup=true&lang.ts
var LEAD = "Vergleiche deine Felge mit einer neuen: wie weit sich Innen- und Außenkante verschieben – gerechnet aus Breite, Einpresstiefe und Distanzscheibe.";
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		prefill: {},
		state: {}
	},
	setup(__props) {
		/**
		* /felgenrechner, desktop document — rebuilt close to the client's example (his #11: „replicate it as closely as
		* possible“; the operator's brief of 29.10.2026, Batch 2). As there: the drawing on the left, the two blocks on the
		* right; under the drawing the two answers in words, under everything the steps and the line about the papers. Below
		* 1024 one column in reading order: drawing, answers, blocks, share, steps, papers.
		*
		* The comparison arrives from the server: `state` when the address carried `?rechner=`, else the prefill (the smallest
		* size a Gutachten names for the chosen car — the sentence says exactly that), else his example — so the first paint
		* already shows it. Everything printed is arithmetic (lib/etRechner); nothing here judges a size (ACCURACY.md §6).
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const { state, update, sentences, shareParam, prefillLine } = useEtRechner({
			prefill: () => props.prefill,
			vehicle: () => vehicle.value,
			state: props.state,
			writeUrl: true
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Felgenrechner" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<meta name="description"${(0, server_renderer_exports.ssrRenderAttr)("content", LEAD)} head-key="description" data-v-113641a2${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("meta", {
						name: "description",
						content: LEAD,
						"head-key": "description"
					})];
				}),
				_: 1
			}, _parent));
			_push(`<section class="section rechner" aria-labelledby="rechner-title" data-v-113641a2><div class="container" data-v-113641a2><nav class="small muted rechner__crumbs" aria-label="Du bist hier" data-v-113641a2><ol class="rechner__crumb-list" data-v-113641a2><li data-v-113641a2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/",
				class: "rechner__crumb",
				prefetch: ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Startseite`);
					else return [(0, vue_exports.createTextVNode)("Startseite")];
				}),
				_: 1
			}, _parent));
			_push(`</li><li aria-current="page" data-v-113641a2>Felgenrechner</li></ol></nav><h1 id="rechner-title" class="h1 rechner__title" data-v-113641a2>Felgenrechner</h1><p class="body-l muted rechner__lead" data-v-113641a2>${(0, server_renderer_exports.ssrInterpolate)(LEAD)}</p><div class="grid rechner__grid" data-v-113641a2><div class="rechner__picture" data-v-113641a2><div class="rechner__answers" aria-live="polite" aria-atomic="true" data-v-113641a2><p class="h3 num rechner__answer" data-v-113641a2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: (0, vue_exports.unref)(sentences).inner }, null, _parent));
			_push(`</p><p class="h3 num rechner__answer" data-v-113641a2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: (0, vue_exports.unref)(sentences).outer }, null, _parent));
			_push(`</p></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(OffsetDrawing_default, { state: (0, vue_exports.unref)(state) }, null, _parent));
			_push(`</div><div class="rechner__form" data-v-113641a2>`);
			if ((0, vue_exports.unref)(prefillLine)) _push(`<p class="small quiet rechner__prefill" data-v-113641a2>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(prefillLine))}</p>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(EtCalculator_default, {
				"model-value": (0, vue_exports.unref)(state),
				"onUpdate:modelValue": (0, vue_exports.unref)(update)
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(RechnerShare_default, { param: (0, vue_exports.unref)(shareParam) }, null, _parent));
			_push(`</div><div class="rechner__about" data-v-113641a2><h2 class="h4" data-v-113641a2>So rechnest du</h2><ol class="rechner__steps" data-v-113641a2><li data-v-113641a2>Gib Breite und Einpresstiefe deiner aktuellen Felge ein – und die Stärke der Distanzscheibe je Rad, wenn du eine fährst.</li><li data-v-113641a2>Gib dann die Werte der neuen Felge ein.</li><li data-v-113641a2>Die zwei Zeilen über der Zeichnung und die Zeichnung selbst zeigen, wie weit sich die Innen- und die Außenkante der neuen Felge gegenüber deiner aktuellen verschieben.</li></ol><p class="small muted rechner__disclaimer" data-v-113641a2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: (0, vue_exports.unref)(DISCLAIMER) }, null, _parent));
			_push(`</p></div></div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Felgenrechner/Desktop.vue
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Felgenrechner/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-113641a2"]]);
//#endregion
export { Desktop_default as default };
