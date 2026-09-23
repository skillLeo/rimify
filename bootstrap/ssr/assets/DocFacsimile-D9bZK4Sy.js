import { c as vue_exports } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { r as docSVG, t as Svg_default } from "./Svg-Zaejjhw8.js";
//#region resources/js/Components/Art/DocFacsimile.vue?vue&type=script&setup=true&lang.ts
var DocFacsimile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "DocFacsimile",
	__ssrInlineRender: true,
	props: {
		variant: { default: "neu" },
		width: { default: 560 },
		title: { default: void 0 }
	},
	setup(__props) {
		/**
		* The Fahrzeugschein facsimile with the two key-number fields ringed.
		*
		* Both layouts exist because both are in circulation. A customer shown only the certificate issued
		* since 2005, while holding the older document, is worse off than with no help at all.
		*/
		const props = __props;
		const markup = (0, vue_exports.computed)(() => docSVG(props.variant, {
			width: props.width,
			title: props.title
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, (0, vue_exports.mergeProps)({ markup: markup.value }, _attrs), null, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Art/DocFacsimile.vue
var _sfc_setup = DocFacsimile_vue_vue_type_script_setup_true_lang_default.setup;
DocFacsimile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/DocFacsimile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var DocFacsimile_default = DocFacsimile_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { DocFacsimile_default as t };
