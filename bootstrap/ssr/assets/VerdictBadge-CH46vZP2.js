import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as Icon_default } from "./Icon-DUS6sqAV.js";
//#region resources/js/Components/Ui/VerdictBadge.vue?vue&type=script&setup=true&lang.ts
var VerdictBadge_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "VerdictBadge",
	__ssrInlineRender: true,
	props: {
		status: {},
		size: { default: "sm" },
		label: { default: void 0 },
		notesOnly: {
			type: Boolean,
			default: false
		}
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
			UNKNOWN: "Noch nicht bestätigt"
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
		const shown = (0, vue_exports.computed)(() => props.notesOnly && props.status === "CONDITIONAL" ? "PERMITTED" : props.status);
		const tone = (0, vue_exports.computed)(() => TONES[shown.value]);
		const text = (0, vue_exports.computed)(() => props.label ?? LABELS[shown.value]);
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
export { VerdictBadge_default as t };
