import { c as vue_exports } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default } from "./useShared-CY71KcPZ.js";
//#region resources/js/Components/Ui/VerdictBadge.vue?vue&type=script&setup=true&lang.ts
var VerdictBadge_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "VerdictBadge",
	__ssrInlineRender: true,
	props: {
		status: {},
		size: { default: "sm" },
		label: { default: void 0 }
	},
	setup(__props) {
		/**
		* The verdict: four states, one shape, identical wherever it appears (R-07).
		*
		* `UNKNOWN` is neutral on purpose — "we hold no document for this combination" is a different
		* fact from "your car may not have this", and only one of them is about the customer's car.
		* The badge never carries an Auflage; a `CONDITIONAL` verdict always renders its conditions as
		* full sentences beside it (R-15), which is the caller's duty.
		*/
		const props = __props;
		const LABELS = {
			PERMITTED: "Freigegeben",
			CONDITIONAL: "Mit Auflagen",
			NOT_PERMITTED: "Nicht freigegeben",
			UNKNOWN: "Unbekannt"
		};
		const TONES = {
			PERMITTED: {
				cls: "verdict--ok",
				icon: "check"
			},
			CONDITIONAL: {
				cls: "verdict--warn",
				icon: "warning"
			},
			NOT_PERMITTED: {
				cls: "verdict--bad",
				icon: "close"
			},
			UNKNOWN: {
				cls: "verdict--unk",
				icon: "info"
			}
		};
		const tone = (0, vue_exports.computed)(() => TONES[props.status]);
		const text = (0, vue_exports.computed)(() => props.label ?? LABELS[props.status]);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["verdict", [tone.value.cls, { "verdict--lg": __props.size === "lg" }]] }, _attrs))}>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: tone.value.icon,
				size: __props.size === "lg" ? 20 : 16
			}, null, _parent));
			_push(` ${(0, server_renderer_exports.ssrInterpolate)(text.value)}</span>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/VerdictBadge.vue
var _sfc_setup = VerdictBadge_vue_vue_type_script_setup_true_lang_default.setup;
VerdictBadge_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/VerdictBadge.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var VerdictBadge_default = VerdictBadge_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/types/rimify.ts
/** The one key the compare store, the tray and `/vergleich?f=` share (home-overhaul.md §0.3). */
function compareKeyOf(card) {
	return card.compareKey ?? `${card.modelId}:${card.finishId}`;
}
//#endregion
export { VerdictBadge_default as n, compareKeyOf as t };
