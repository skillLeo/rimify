import { c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { r as useShared } from "./useShared-B1ZdimaV.js";
import { t as AppLayout_default } from "./AppLayout-BVlt5D4s.js";
import { a as ClearanceDrawing_default, c as ValueText_default, i as FitmentCalculator_default, n as RechnerShare_default, o as DISCLAIMER, r as FitmentResults_default, s as SIDES, t as useRechner } from "./useRechner-89WZYcLM.js";
//#region resources/js/Pages/Felgenrechner/Desktop.vue?vue&type=script&setup=true&lang.ts
var LEAD = "Rechne aus, wie sich eine andere Felgen- und Reifengröße rechnerisch auf Abrollumfang, Tacho und die Lage der Felgenkanten auswirkt.";
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
		* /felgenrechner, desktop document (home-overhaul §3.3): the full tool. The compact table of
		* controls with the two summary lines and the share block in the left columns; the results on the
		* right — each answer in a plain sentence first, the rear-view drawing under the position sentence
		* it shows — then the full figures and the disclaimer. Below 1024 the blocks stack in reading
		* order: form, results, figures, share block, disclaimer.
		*
		* The comparison arrives from the server: `state` when the address carried `?rechner=`, else the
		* prefill (the smallest size a Gutachten names for the chosen car, and the note says exactly that),
		* else the worked example — so the first paint already shows it. Every valid change is written
		* back to the address, which is what the share field shows.
		*
		* Everything printed is arithmetic from `lib/felgenGeometry`; nothing on this page judges a size
		* (ACCURACY.md §6). The line under the results points at the papers that do.
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const { state, shown, shareParam, prefillLine, fromVehicle, summaries, specs, update, setValid } = useRechner({
			prefill: () => props.prefill,
			vehicle: () => vehicle.value,
			state: props.state,
			writeUrl: true
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Felgenrechner" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<meta name="description"${(0, server_renderer_exports.ssrRenderAttr)("content", LEAD)} head-key="description" data-v-4beb330e${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("meta", {
						name: "description",
						content: LEAD,
						"head-key": "description"
					})];
				}),
				_: 1
			}, _parent));
			_push(`<section class="section rechner" aria-labelledby="rechner-title" data-v-4beb330e><div class="container" data-v-4beb330e><nav class="small muted rechner__crumbs" aria-label="Du bist hier" data-v-4beb330e><ol class="rechner__crumb-list" data-v-4beb330e><li data-v-4beb330e>`);
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
			_push(`</li><li aria-current="page" data-v-4beb330e>Felgenrechner</li></ol></nav><h1 id="rechner-title" class="h1 rechner__title" data-v-4beb330e>Felgenrechner</h1><p class="body-l muted rechner__lead" data-v-4beb330e>${(0, server_renderer_exports.ssrInterpolate)(LEAD)}</p><div class="grid rechner__grid" data-v-4beb330e><div class="rechner__left" data-v-4beb330e><div class="rechner__form" data-v-4beb330e>`);
			if ((0, vue_exports.unref)(prefillLine)) _push(`<p class="small quiet rechner__prefill" data-v-4beb330e>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(prefillLine))}</p>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(FitmentCalculator_default, {
				"model-value": (0, vue_exports.unref)(state),
				layout: "table",
				prefilled: (0, vue_exports.unref)(fromVehicle),
				"onUpdate:modelValue": (0, vue_exports.unref)(update),
				"onUpdate:valid": (0, vue_exports.unref)(setValid)
			}, null, _parent));
			_push(`<ul class="rechner__summaries" aria-label="Die beiden Größen" data-v-4beb330e><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SIDES), (side) => {
				_push(`<li class="small muted num rechner__summary" data-v-4beb330e><span class="rechner__summary-side" data-v-4beb330e>${(0, server_renderer_exports.ssrInterpolate)(side.label)}:</span> `);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: (0, vue_exports.unref)(summaries)[side.key] }, null, _parent));
				_push(`</li>`);
			});
			_push(`<!--]--></ul></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(RechnerShare_default, {
				class: "rechner__share",
				param: (0, vue_exports.unref)(shareParam)
			}, null, _parent));
			_push(`</div><div class="rechner__right" data-v-4beb330e>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(FitmentResults_default, {
				class: "rechner__results",
				result: (0, vue_exports.unref)(shown)
			}, {
				drawing: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(ClearanceDrawing_default, {
						class: "calc-drawing",
						current: (0, vue_exports.unref)(state).current,
						next: (0, vue_exports.unref)(state).next
					}, null, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)(ClearanceDrawing_default, {
						class: "calc-drawing",
						current: (0, vue_exports.unref)(state).current,
						next: (0, vue_exports.unref)(state).next
					}, null, 8, ["current", "next"])];
				}),
				_: 1
			}, _parent));
			if ((0, vue_exports.unref)(specs).length > 0) {
				_push(`<dl class="specs small rechner__specs" aria-label="Alle Werte" data-v-4beb330e><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(specs), (row) => {
					_push(`<!--[--><dt data-v-4beb330e>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</dt><dd class="num" data-v-4beb330e>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: row.value }, null, _parent));
					_push(`</dd><!--]-->`);
				});
				_push(`<!--]--></dl>`);
			} else _push(`<!---->`);
			_push(`<p class="small muted rechner__disclaimer" data-v-4beb330e>`);
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
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-4beb330e"]]);
//#endregion
export { Desktop_default as default };
