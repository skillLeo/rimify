import { c as vue_exports, n as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as Icon_default } from "./Icon-Cd7fU8zT.js";
import { t as AdminLayout_default } from "./AdminLayout-BezLetQd.js";
//#region resources/js/Pages/Admin/Rollen/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		roles: {},
		modules: {}
	},
	setup(__props) {
		/**
		* Rollen & Rechte.
		*
		* The roles first, as a plain list — what each is for and how many accounts hold it. Then the
		* permissions: from 900px a matrix with roles as columns and modules as rows, because "can the
		* Buchhaltung export orders?" is read across, not looked up. Below 900px the matrix does not fit,
		* so the axes swap: one role at a time, chosen above, with its modules listed beneath.
		*
		* Every cell is written in the database whether allowed or not, so an empty cell always means
		* denied and never means unknown. This screen only displays; every change is authorised by a
		* Policy on the server (R-11).
		*/
		const props = __props;
		const active = (0, vue_exports.ref)(props.roles[0]?.id ?? 0);
		const activeRole = (0, vue_exports.computed)(() => props.roles.find((r) => r.id === active.value) ?? null);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Rollen & Rechte" }, null, _parent));
			_push(`<h1 class="t-h1 rol__title" data-v-0152d1e7>Rollen &amp; Rechte</h1><section class="rol__section" aria-labelledby="rol-roles" data-v-0152d1e7><h2 id="rol-roles" class="t-h3" data-v-0152d1e7>Rollen</h2><ul class="rol__roles" data-v-0152d1e7><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.roles, (role) => {
				_push(`<li class="rol__role" data-v-0152d1e7><div class="rol__role-text" data-v-0152d1e7><p class="rol__name" data-v-0152d1e7>${(0, server_renderer_exports.ssrInterpolate)(role.label)} `);
				if (role.isSystem) _push(`<span class="tag tag--unknown" data-v-0152d1e7>Vorlage</span>`);
				else _push(`<!---->`);
				_push(`</p>`);
				if (role.description) _push(`<p class="t-small rol__desc" data-v-0152d1e7>${(0, server_renderer_exports.ssrInterpolate)(role.description)}</p>`);
				else _push(`<!---->`);
				_push(`</div><p class="rol__users" data-v-0152d1e7><span class="tabular" data-v-0152d1e7>${(0, server_renderer_exports.ssrInterpolate)(role.users)}</span> ${(0, server_renderer_exports.ssrInterpolate)(role.users === 1 ? "Konto" : "Konten")}</p></li>`);
			});
			_push(`<!--]--></ul></section><section class="rol__section" aria-labelledby="rol-rights" data-v-0152d1e7><h2 id="rol-rights" class="t-h3" data-v-0152d1e7>Rechte je Modul</h2><div class="rol__matrix" data-v-0152d1e7><table class="table" data-v-0152d1e7><thead data-v-0152d1e7><tr data-v-0152d1e7><th scope="col" data-v-0152d1e7>Modul</th><th scope="col" data-v-0152d1e7>Aktion</th><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.roles, (role) => {
				_push(`<th scope="col" class="rol__col" data-v-0152d1e7>${(0, server_renderer_exports.ssrInterpolate)(role.label)}</th>`);
			});
			_push(`<!--]--></tr></thead><tbody data-v-0152d1e7><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.modules, (module) => {
				_push(`<!--[--><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(module.actions, (action, index) => {
					_push(`<tr data-v-0152d1e7>`);
					if (index === 0) _push(`<th${(0, server_renderer_exports.ssrRenderAttr)("rowspan", module.actions.length)} scope="rowgroup" class="rol__module" data-v-0152d1e7>${(0, server_renderer_exports.ssrInterpolate)(module.label)}</th>`);
					else _push(`<!---->`);
					_push(`<td data-v-0152d1e7>${(0, server_renderer_exports.ssrInterpolate)(action.label)}</td><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.roles, (role) => {
						_push(`<td class="rol__cell" data-v-0152d1e7>`);
						if (action.roles[role.id]) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "check",
							size: 20,
							label: `${role.label}: ${action.label} erlaubt`
						}, null, _parent));
						else _push(`<span class="rol__no" data-v-0152d1e7><span aria-hidden="true" data-v-0152d1e7>–</span><span class="visually-hidden" data-v-0152d1e7>nicht erlaubt</span></span>`);
						_push(`</td>`);
					});
					_push(`<!--]--></tr>`);
				});
				_push(`<!--]--><!--]-->`);
			});
			_push(`<!--]--></tbody></table></div><div class="rol__byrole" data-v-0152d1e7><div class="rol__pick" role="group" aria-label="Rolle" data-v-0152d1e7><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.roles, (role) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pill--on": role.id === active.value }, "pill"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", role.id === active.value)} data-v-0152d1e7>${(0, server_renderer_exports.ssrInterpolate)(role.label)}</button>`);
			});
			_push(`<!--]--></div><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.modules, (module) => {
				_push(`<div class="rol__mod" data-v-0152d1e7><h3 class="rol__mod-title" data-v-0152d1e7>${(0, server_renderer_exports.ssrInterpolate)(module.label)}</h3><ul class="rol__actions"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${module.label} – ${activeRole.value?.label ?? ""}`)} data-v-0152d1e7><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(module.actions, (action) => {
					_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "rol__action--on": action.roles[active.value] }, "rol__action"])}" data-v-0152d1e7><span data-v-0152d1e7>${(0, server_renderer_exports.ssrInterpolate)(action.label)}</span>`);
					if (action.roles[active.value]) {
						_push(`<span class="rol__yes" data-v-0152d1e7>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "check",
							size: 20
						}, null, _parent));
						_push(`<span class="visually-hidden" data-v-0152d1e7>erlaubt</span></span>`);
					} else _push(`<span class="rol__no" data-v-0152d1e7><span aria-hidden="true" data-v-0152d1e7>–</span><span class="visually-hidden" data-v-0152d1e7>nicht erlaubt</span></span>`);
					_push(`</li>`);
				});
				_push(`<!--]--></ul></div>`);
			});
			_push(`<!--]--></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Rollen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Rollen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0152d1e7"]]);
//#endregion
export { Index_default as default };
