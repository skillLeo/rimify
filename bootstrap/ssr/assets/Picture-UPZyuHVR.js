import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Ui/Picture.vue?vue&type=script&setup=true&lang.ts
var Picture_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Picture",
	__ssrInlineRender: true,
	props: {
		image: {},
		alt: {},
		sizes: { default: "100vw" },
		eager: {
			type: Boolean,
			default: false
		},
		soon: {
			type: Boolean,
			default: false
		},
		late: {
			type: Boolean,
			default: false
		}
	},
	emits: ["loaded", "failed"],
	setup(__props, { emit: __emit }) {
		/**
		* A photograph from the image pipeline (scripts/images.mjs): AVIF, then WebP, then JPEG, at the
		* widths the manifest lists, with the frame's own dimensions so nothing shifts, and the 24 px
		* placeholder behind it until the real file has painted. The desktop hero passes `eager`; everything
		* below the fold is lazy, and the phone's hero, just below the first screen, `late`.
		*/
		const props = __props;
		const emit = __emit;
		const loaded = (0, vue_exports.ref)(false);
		const img = (0, vue_exports.ref)(null);
		(0, vue_exports.onMounted)(() => {
			if (img.value?.complete && img.value.naturalWidth === 0 && img.value.currentSrc !== "") emit("failed");
		});
		const srcset = (ext) => props.image.widths.map((w) => `${props.image.base}-${w}.${ext} ${w}w`).join(", ");
		const formats = (0, vue_exports.computed)(() => props.image.formats ?? ["avif", "webp"]);
		const fallbackExt = (0, vue_exports.computed)(() => props.image.fallback ?? "jpg");
		const fallback = (0, vue_exports.computed)(() => `${props.image.base}-${props.image.widths[props.image.widths.length - 1]}.${fallbackExt.value}`);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<picture${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: ["picture", { "picture--loaded": loaded.value }],
				style: fallbackExt.value === "png" ? void 0 : { backgroundImage: `url(${__props.image.placeholder})` }
			}, _attrs))} data-v-41c8c659><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(formats.value, (format) => {
				_push(`<source${(0, server_renderer_exports.ssrRenderAttr)("type", `image/${format}`)}${(0, server_renderer_exports.ssrRenderAttr)("srcset", srcset(format))}${(0, server_renderer_exports.ssrRenderAttr)("sizes", __props.sizes)} data-v-41c8c659>`);
			});
			_push(`<!--]--><img${(0, server_renderer_exports.ssrRenderAttr)("src", fallback.value)}${(0, server_renderer_exports.ssrRenderAttr)("srcset", srcset(fallbackExt.value))}${(0, server_renderer_exports.ssrRenderAttr)("sizes", __props.sizes)}${(0, server_renderer_exports.ssrRenderAttr)("alt", __props.alt)}${(0, server_renderer_exports.ssrRenderAttr)("width", __props.image.width)}${(0, server_renderer_exports.ssrRenderAttr)("height", __props.image.height)}${(0, server_renderer_exports.ssrRenderAttr)("loading", (__props.eager || __props.soon) && !__props.late ? "eager" : "lazy")}${(0, server_renderer_exports.ssrRenderAttr)("fetchpriority", __props.late ? "low" : __props.eager ? "high" : __props.soon ? "low" : void 0)} decoding="async" data-v-41c8c659></picture>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/Picture.vue
var _sfc_setup = Picture_vue_vue_type_script_setup_true_lang_default.setup;
Picture_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/Picture.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Picture_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Picture_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-41c8c659"]]);
//#endregion
export { Picture_default as t };
