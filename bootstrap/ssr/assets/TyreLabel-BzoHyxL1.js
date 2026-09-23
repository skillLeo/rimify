import { c as vue_exports } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default } from "./useShared-B1ZdimaV.js";
import { i as withUnit } from "./format--h649JLD.js";
//#region resources/js/Components/Ui/TyreLabel.vue?vue&type=script&setup=true&lang.ts
var TyreLabel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "TyreLabel",
	__ssrInlineRender: true,
	props: {
		fuel: {},
		wet: {},
		noiseDb: {},
		noiseClass: {},
		title: {},
		eprelId: {}
	},
	setup(__props) {
		/**
		* The EU tyre label (Regulation (EU) 2020/740): fuel efficiency, wet grip and external rolling
		* noise, laid out the way the printed label lays them out, and linked to the EPREL entry when the
		* registration number is known. Every value comes from product data; nothing here is a default.
		*/
		const props = __props;
		const eprelHref = props.eprelId ? `https://eprel.ec.europa.eu/qr/${encodeURIComponent(props.eprelId)}` : null;
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<figure${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "tyre-label" }, _attrs))}><figcaption class="small">${(0, server_renderer_exports.ssrInterpolate)(__props.title)}</figcaption><div class="tyre-label__row">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "fuel",
				size: 24
			}, null, _parent));
			_push(`<span class="tyre-label__name">Kraftstoffeffizienz</span><span class="tyre-label__class">${(0, server_renderer_exports.ssrInterpolate)(__props.fuel)}</span></div><div class="tyre-label__row">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "rain",
				size: 24
			}, null, _parent));
			_push(`<span class="tyre-label__name">Nasshaftung</span><span class="tyre-label__class">${(0, server_renderer_exports.ssrInterpolate)(__props.wet)}</span></div><div class="tyre-label__row">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "sound",
				size: 24
			}, null, _parent));
			_push(`<span class="tyre-label__name num">Rollgeräusch ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(__props.noiseDb, "dB"))}</span><span class="tyre-label__class">${(0, server_renderer_exports.ssrInterpolate)(__props.noiseClass)}</span></div><div class="tyre-label__foot">`);
			if ((0, vue_exports.unref)(eprelHref)) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", (0, vue_exports.unref)(eprelHref))} rel="noopener" target="_blank">EU-Reifenlabel in der EPREL-Datenbank</a>`);
			else _push(`<span>EU-Reifenlabel nach Verordnung (EU) 2020/740</span>`);
			_push(`</div></figure>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/TyreLabel.vue
var _sfc_setup = TyreLabel_vue_vue_type_script_setup_true_lang_default.setup;
TyreLabel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/TyreLabel.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var TyreLabel_default = TyreLabel_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { TyreLabel_default as t };
