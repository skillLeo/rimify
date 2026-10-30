import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Admin/Seiten/PreviewFrame.vue?vue&type=script&setup=true&lang.ts
var READABLE_DESKTOP = 640;
var PreviewFrame_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PreviewFrame",
	__ssrInlineRender: true,
	props: {
		urls: {},
		version: {},
		unsaved: { type: Boolean }
	},
	setup(__props) {
		/**
		* The draft in the real shop, beside the fields (BRIEF-2 §1: "live preview in a device frame,
		* rendered with the real storefront components").
		*
		* The frame loads the signed preview link, so what it shows is exactly what the link shows a
		* colleague: the storefront's own page with the SAVED draft. Desktop is laid out at 1280 px and
		* scaled to the column, so the composition is the real one, only smaller; Handy is the phone
		* document at 390 px. It reloads whenever `version` changes — after each save.
		*/
		const props = __props;
		const WIDTH = {
			desktop: 1280,
			handy: 390
		};
		const device = (0, vue_exports.ref)("handy");
		const stage = (0, vue_exports.ref)(null);
		const stageWidth = (0, vue_exports.ref)(0);
		const stageHeight = (0, vue_exports.ref)(640);
		const loaded = (0, vue_exports.ref)(false);
		const mounted = (0, vue_exports.ref)(false);
		const scale = (0, vue_exports.computed)(() => stageWidth.value > 0 ? Math.min(1, stageWidth.value / WIDTH[device.value]) : 1);
		const frameStyle = (0, vue_exports.computed)(() => ({
			width: `${WIDTH[device.value]}px`,
			height: `${Math.round(stageHeight.value / scale.value)}px`,
			transform: `scale(${scale.value})`
		}));
		const src = (0, vue_exports.ref)(props.urls[device.value]);
		(0, vue_exports.watch)([device, () => props.version], () => {
			src.value = props.urls[device.value];
			loaded.value = false;
		});
		let observer = null;
		(0, vue_exports.onMounted)(() => {
			if (!stage.value) return;
			const measure = () => {
				stageWidth.value = stage.value?.clientWidth ?? stageWidth.value;
				stageHeight.value = stage.value?.clientHeight ?? stageHeight.value;
				if (!mounted.value && stageWidth.value > 0) {
					device.value = stageWidth.value < READABLE_DESKTOP ? "handy" : "desktop";
					mounted.value = true;
				}
			};
			measure();
			observer = new ResizeObserver(measure);
			observer.observe(stage.value);
		});
		(0, vue_exports.onBeforeUnmount)(() => observer?.disconnect());
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "pg-preview",
				"aria-labelledby": "pg-preview-title"
			}, _attrs))} data-v-a3e8803a><div class="pg-preview__head" data-v-a3e8803a><h2 id="pg-preview-title" class="pg-preview__title" data-v-a3e8803a>Vorschau</h2><div class="pg-preview__devices" role="group" aria-label="Gerät" data-v-a3e8803a><button class="adm-chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", device.value === "desktop")} data-v-a3e8803a>Desktop</button><button class="adm-chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", device.value === "handy")} data-v-a3e8803a>Handy</button></div></div><p class="pg-preview__note" role="status" data-v-a3e8803a>${(0, server_renderer_exports.ssrInterpolate)(__props.unsaved ? "Speichere, damit die Vorschau deine letzten Änderungen zeigt." : "Zeigt den gespeicherten Stand im echten Shop.")}</p><div class="pg-preview__stage"${(0, server_renderer_exports.ssrRenderAttr)("data-device", device.value)} data-v-a3e8803a>`);
			if (!loaded.value) _push(`<div class="pg-preview__loading" data-v-a3e8803a>Vorschau wird geladen …</div>`);
			else _push(`<!---->`);
			if (mounted.value) _push(`<iframe class="${(0, server_renderer_exports.ssrRenderClass)([{ "pg-preview__frame--loaded": loaded.value }, "pg-preview__frame"])}"${(0, server_renderer_exports.ssrRenderAttr)("src", src.value)} style="${(0, server_renderer_exports.ssrRenderStyle)(frameStyle.value)}"${(0, server_renderer_exports.ssrRenderAttr)("title", device.value === "desktop" ? "Vorschau der Seite am Desktop" : "Vorschau der Seite am Handy")} tabindex="-1" data-v-a3e8803a></iframe>`);
			else _push(`<!---->`);
			_push(`</div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Seiten/PreviewFrame.vue
var PreviewFrame_exports = /* @__PURE__ */ __exportAll({ default: () => PreviewFrame_default });
var _sfc_setup = PreviewFrame_vue_vue_type_script_setup_true_lang_default.setup;
PreviewFrame_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Seiten/PreviewFrame.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var PreviewFrame_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PreviewFrame_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-a3e8803a"]]);
//#endregion
export { PreviewFrame_exports as n, PreviewFrame_default as t };
