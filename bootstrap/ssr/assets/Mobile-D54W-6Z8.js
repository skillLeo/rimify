import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
//#region resources/js/Pages/Admin/Rollen/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
	__ssrInlineRender: true,
	props: {
		roles: {},
		modules: {}
	},
	setup(__props) {
		const active = (0, vue_exports.ref)(__props.roles[0]?.id ?? 0);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Rollen & Rechte" }, null, _parent));
			_push(`<div class="mrol__rail" data-v-782fd237><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.roles, (role) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pill--on": role.id === active.value }, "pill"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", role.id === active.value)} data-v-782fd237>${(0, server_renderer_exports.ssrInterpolate)(role.label)}</button>`);
			});
			_push(`<!--]--></div><div class="stack mrol__modules" data-v-782fd237><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.modules, (module) => {
				_push(`<article class="card mrol__module" data-v-782fd237><span class="micro" data-v-782fd237>${(0, server_renderer_exports.ssrInterpolate)(module.label)}</span><div class="chip-row mrol__actions" data-v-782fd237><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(module.actions, (action) => {
					_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([{ "pill--on": action.roles[active.value] }, "pill"])}" data-v-782fd237>`);
					if (action.roles[active.value]) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "check",
						size: 20
					}, null, _parent));
					else _push(`<!---->`);
					_push(` ${(0, server_renderer_exports.ssrInterpolate)(action.label)}</span>`);
				});
				_push(`<!--]--></div></article>`);
			});
			_push(`<!--]--></div><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Rollen/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Rollen/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-782fd237"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
