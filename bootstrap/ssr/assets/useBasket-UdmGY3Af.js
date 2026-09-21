import { a as router, s as vue_exports } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { c as Svg_default, t as tyreSVG } from "./art-DxGr5VAf.js";
//#region resources/js/Components/Art/Tyre.vue?vue&type=script&setup=true&lang.ts
var Tyre_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Tyre",
	__ssrInlineRender: true,
	props: {
		label: { default: "" },
		size: { default: 400 },
		title: { default: void 0 }
	},
	setup(__props) {
		/** A tyre, carrying its own size on the sidewall. The caller formats the label. */
		const props = __props;
		const markup = (0, vue_exports.computed)(() => tyreSVG({
			label: props.label,
			size: props.size,
			title: props.title
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, (0, vue_exports.mergeProps)({ markup: markup.value }, _attrs), null, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Art/Tyre.vue
var _sfc_setup = Tyre_vue_vue_type_script_setup_true_lang_default.setup;
Tyre_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/Tyre.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Tyre_default = Tyre_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/composables/useBasket.ts
/**
* Basket mutations.
*
* Every change is a server round trip rather than local state, and deliberately so: the basket is
* re-priced and every line re-verified on render, so a quantity change is also the moment a
* superseded document or a stock movement becomes visible. Optimistic local arithmetic would show
* a total the server does not agree with.
*/
function useBasket() {
	function setQuantity(key, quantity) {
		if (quantity < 1) {
			remove(key);
			return;
		}
		router.patch(`/warenkorb/${encodeURIComponent(key)}`, { quantity }, {
			preserveScroll: true,
			preserveState: true
		});
	}
	function remove(key) {
		router.delete(`/warenkorb/${encodeURIComponent(key)}`, { preserveScroll: true });
	}
	return {
		setQuantity,
		remove
	};
}
//#endregion
export { Tyre_default as n, useBasket as t };
