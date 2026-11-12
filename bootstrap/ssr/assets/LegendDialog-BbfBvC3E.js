import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-Hg9IsA0U.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { r as LEGEND_DRAFT, t as Auflagenverzeichnis_default } from "./Auflagenverzeichnis-pWYWRqN5.js";
import { h as useGutachtenPage, m as useEntry } from "./entryStore-wk8wq0su.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/LegendDialog.vue?vue&type=script&setup=true&lang.ts
var LegendDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "LegendDialog",
	__ssrInlineRender: true,
	props: {
		"open": {
			type: Boolean,
			required: true
		},
		"openModifiers": {}
	},
	emits: ["update:open"],
	setup(__props) {
		/**
		* The paper's whole Auflagenverzeichnis, for what the short list beside the tyres does not do: a legend pasted at once and split
		* for a person to check, a code taken out, a limit confirmed with its reason, how loud a code is in the shop. Saved as it was
		* before the five steps; the page's props carry the result back into the list and the tags.
		*/
		const open = (0, vue_exports.useModel)(__props, "open");
		const { state } = useEntry();
		const page = useGutachtenPage();
		(0, vue_exports.provide)(LEGEND_DRAFT, {
			open: (0, vue_exports.ref)(false),
			pasted: (0, vue_exports.ref)(""),
			split: (0, vue_exports.ref)([])
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				wide: "",
				"content-class": "ef-legend",
				title: "Auflagenverzeichnis",
				description: "Die Codes dieses Gutachtens. Füg sie einzeln oder als ganze Legende ein."
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(Auflagenverzeichnis_default, {
						"document-id": (0, vue_exports.unref)(state).documentId,
						conditions: (0, vue_exports.unref)(page).props.conditions,
						choices: (0, vue_exports.unref)(page).props.choices,
						unresolved: (0, vue_exports.unref)(page).props.unresolved,
						editable: (0, vue_exports.unref)(state).editable,
						"page-count": (0, vue_exports.unref)(page).props.document.pageCount,
						levels: (0, vue_exports.unref)(page).props.levels,
						"levels-editable": (0, vue_exports.unref)(page).props.can.levels === true,
						"level-floor-sentence": (0, vue_exports.unref)(page).props.levelFloorSentence
					}, null, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)(Auflagenverzeichnis_default, {
						"document-id": (0, vue_exports.unref)(state).documentId,
						conditions: (0, vue_exports.unref)(page).props.conditions,
						choices: (0, vue_exports.unref)(page).props.choices,
						unresolved: (0, vue_exports.unref)(page).props.unresolved,
						editable: (0, vue_exports.unref)(state).editable,
						"page-count": (0, vue_exports.unref)(page).props.document.pageCount,
						levels: (0, vue_exports.unref)(page).props.levels,
						"levels-editable": (0, vue_exports.unref)(page).props.can.levels === true,
						"level-floor-sentence": (0, vue_exports.unref)(page).props.levelFloorSentence
					}, null, 8, [
						"document-id",
						"conditions",
						"choices",
						"unresolved",
						"editable",
						"page-count",
						"levels",
						"levels-editable",
						"level-floor-sentence"
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/LegendDialog.vue
var LegendDialog_exports = /* @__PURE__ */ __exportAll({ default: () => LegendDialog_default });
var _sfc_setup = LegendDialog_vue_vue_type_script_setup_true_lang_default.setup;
LegendDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/LegendDialog.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var LegendDialog_default = LegendDialog_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { LegendDialog_exports as n, LegendDialog_default as t };
