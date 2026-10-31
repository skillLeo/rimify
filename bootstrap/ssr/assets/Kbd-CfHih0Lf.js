import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Ui/Kbd.vue?vue&type=script&setup=true&lang.ts
var Kbd_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Kbd",
	__ssrInlineRender: true,
	props: {
		keys: {},
		modifier: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* A keyboard hint. The modifier is written the way the visitor's keyboard writes it: ⌘ on a Mac,
		* Strg everywhere else — decided after mount, so the server and the client agree on the first
		* frame and only the label changes.
		*/
		const props = __props;
		const mod = (0, vue_exports.ref)("Strg");
		(0, vue_exports.onMounted)(() => {
			if (/Mac|iPhone|iPad/.test(navigator.platform)) mod.value = "⌘";
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "kbd-group" }, _attrs))} data-v-8ddf4b70>`);
			if (props.modifier) _push(`<kbd class="kbd" data-v-8ddf4b70>${(0, server_renderer_exports.ssrInterpolate)(mod.value)}</kbd>`);
			else _push(`<!---->`);
			_push(`<!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(props.keys, (key) => {
				_push(`<kbd class="kbd" data-v-8ddf4b70>${(0, server_renderer_exports.ssrInterpolate)(key)}</kbd>`);
			});
			_push(`<!--]--></span>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/Kbd.vue
var _sfc_setup = Kbd_vue_vue_type_script_setup_true_lang_default.setup;
Kbd_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/Kbd.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Kbd_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Kbd_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8ddf4b70"]]);
//#endregion
export { Kbd_default as t };
