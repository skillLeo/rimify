import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
//#region resources/js/Pages/Admin/Rollen/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		roles: {},
		modules: {}
	},
	setup(__props) {
		/**
		* Rollen & Rechte — roles as columns, modules as rows.
		*
		* A grid rather than a list of permission strings, because that is how the question is asked:
		* "can the Buchhaltung export orders?" is read across, not looked up. Every cell is written in the
		* database whether allowed or not, so an empty cell here always means denied and never means
		* unknown.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Rollen & Rechte" }, null, _parent));
			_push(`<div class="card rol__legend" data-v-17ad9794><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.roles, (role) => {
				_push(`<article class="rol__role" data-v-17ad9794><span class="rol__name" data-v-17ad9794>${(0, server_renderer_exports.ssrInterpolate)(role.label)}</span>`);
				if (role.isSystem) _push(`<span class="tag tag--unknown rol__sys" data-v-17ad9794>Vorlage</span>`);
				else _push(`<!---->`);
				_push(`<p class="quiet rol__desc" data-v-17ad9794>${(0, server_renderer_exports.ssrInterpolate)(role.description)}</p><span class="data" data-v-17ad9794>${(0, server_renderer_exports.ssrInterpolate)(role.users)} Konten</span></article>`);
			});
			_push(`<!--]--></div><div class="card rol__matrix" data-v-17ad9794><table class="table" data-v-17ad9794><thead data-v-17ad9794><tr data-v-17ad9794><th scope="col" data-v-17ad9794>Modul</th><th scope="col" data-v-17ad9794>Aktion</th><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.roles, (role) => {
				_push(`<th scope="col" class="rol__col" data-v-17ad9794>${(0, server_renderer_exports.ssrInterpolate)(role.label)}</th>`);
			});
			_push(`<!--]--></tr></thead><tbody data-v-17ad9794><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.modules, (module) => {
				_push(`<!--[--><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(module.actions, (action, index) => {
					_push(`<tr data-v-17ad9794>`);
					if (index === 0) _push(`<th${(0, server_renderer_exports.ssrRenderAttr)("rowspan", module.actions.length)} scope="rowgroup" class="rol__module" data-v-17ad9794>${(0, server_renderer_exports.ssrInterpolate)(module.label)}</th>`);
					else _push(`<!---->`);
					_push(`<td data-v-17ad9794>${(0, server_renderer_exports.ssrInterpolate)(action.label)}</td><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.roles, (role) => {
						_push(`<td class="rol__cell" data-v-17ad9794>`);
						if (action.roles[role.id]) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "check",
							size: 20,
							label: `${action.label} erlaubt`
						}, null, _parent));
						else _push(`<span class="rol__no" aria-label="nicht erlaubt" data-v-17ad9794>–</span>`);
						_push(`</td>`);
					});
					_push(`<!--]--></tr>`);
				});
				_push(`<!--]--><!--]-->`);
			});
			_push(`<!--]--></tbody></table></div><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Rollen/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Rollen/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-17ad9794"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
