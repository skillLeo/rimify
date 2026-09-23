import { c as vue_exports } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { i as wheelSVG, t as Svg_default } from "./Svg-Zaejjhw8.js";
//#region resources/js/Components/Art/Wheel.vue?vue&type=script&setup=true&lang.ts
var Wheel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Wheel",
	__ssrInlineRender: true,
	props: {
		spokes: { default: 5 },
		finish: { default: "graphite" },
		size: { default: 400 },
		tyre: {
			type: Boolean,
			default: false
		},
		initial: { default: "R" },
		title: { default: void 0 }
	},
	setup(__props) {
		/**
		* The alloy wheel. Nine layers, drawn in SVG — see resources/js/art/wheel.ts.
		*
		* Memoised on its own props so a listing page with twenty-four cards builds the markup once per
		* distinct spokes-and-finish pair rather than twenty-four times.
		*/
		const props = __props;
		const markup = (0, vue_exports.computed)(() => wheelSVG({
			spokes: props.spokes,
			finish: props.finish,
			size: props.size,
			tyre: props.tyre,
			initial: props.initial,
			title: props.title
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, (0, vue_exports.mergeProps)({ markup: markup.value }, _attrs), null, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Art/Wheel.vue
var _sfc_setup$1 = Wheel_vue_vue_type_script_setup_true_lang_default.setup;
Wheel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/Wheel.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var Wheel_default = Wheel_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Product/ProductPhoto.vue?vue&type=script&setup=true&lang.ts
var ProductPhoto_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ProductPhoto",
	__ssrInlineRender: true,
	props: {
		spokes: {},
		finish: {},
		size: { default: 320 },
		note: {
			type: Boolean,
			default: true
		}
	},
	setup(__props) {
		/**
		* The product frame.
		*
		* RIMIFY has no photography of its own yet, and the two dishonest ways to fill this box are both
		* off the table: a stock photograph of a different wheel (the customer is buying a specific part
		* number), and a drawing presented as though it were a photograph.
		*
		* So the frame shows the technical drawing of the wheel — spoke count and finish are real, they
		* come from the catalogue row — and says plainly, under the drawing, that the photograph is still
		* to come. The day the client's photographs arrive this component swaps the drawing for an <img>
		* and the caption disappears.
		*
		* The frame is a size container: a caption that fits a 560px gallery collides with the drawing in
		* a 140px card on a phone, so the caption shortens by the frame's own width, not the viewport's.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "pphoto" }, _attrs))} data-v-7d9fe3b8><span class="pphoto__art" data-v-7d9fe3b8>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Wheel_default, {
				spokes: __props.spokes,
				finish: __props.finish,
				size: __props.size
			}, null, _parent));
			_push(`</span>`);
			if (__props.note) _push(`<span class="pphoto__note" data-v-7d9fe3b8> Foto folgt<span class="pphoto__kind" data-v-7d9fe3b8> · Technische Darstellung</span></span>`);
			else _push(`<!---->`);
			_push(`</span>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/ProductPhoto.vue
var _sfc_setup = ProductPhoto_vue_vue_type_script_setup_true_lang_default.setup;
ProductPhoto_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/ProductPhoto.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ProductPhoto_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ProductPhoto_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7d9fe3b8"]]);
//#endregion
export { ProductPhoto_default as t };
