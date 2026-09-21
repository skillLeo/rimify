import { n as link_default, s as vue_exports } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { r as useShared } from "./useShared-Cs__JTYP.js";
//#region resources/js/Layouts/AdminLayout.vue?vue&type=script&setup=true&lang.ts
var AdminLayout_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminLayout",
	__ssrInlineRender: true,
	props: { title: { default: void 0 } },
	setup(__props) {
		/**
		* The admin frame: a black rail, a topbar, and the page.
		*
		* Items a role cannot reach are NOT rendered at all rather than rendered and disabled — a disabled
		* link still tells someone a capability exists, and the permission model says nothing here is
		* merely hidden. The rail is filtered from the server's list, and the server refuses the route
		* regardless (R-11); this is presentation, never enforcement.
		*
		* The dark layer is a token redefinition on `data-theme`, not a second stylesheet.
		*/
		const shared = useShared();
		const theme = (0, vue_exports.ref)("light");
		const rail = [
			{
				label: "Dashboard",
				href: "/admin",
				routeName: "admin.dashboard",
				icon: "grid"
			},
			{
				label: "Gutachten",
				href: "/admin/gutachten",
				routeName: "admin.gutachten.index",
				icon: "document"
			},
			{
				label: "Rollen & Rechte",
				href: "/admin/rollen",
				routeName: "admin.rollen.index",
				icon: "lock"
			}
		];
		function apply() {
			document.documentElement.setAttribute("data-theme", theme.value);
		}
		(0, vue_exports.onMounted)(() => {
			try {
				const stored = window.localStorage.getItem("rmf_admin_theme");
				if (stored === "dark" || stored === "light") theme.value = stored;
			} catch {}
			apply();
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			try {
				window.localStorage.setItem("rmf_admin_theme", theme.value);
			} catch {}
			document.documentElement.removeAttribute("data-theme");
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "adm" }, _attrs))} data-v-0766b6ef><aside class="adm__side" data-v-0766b6ef>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/admin",
				class: "wordmark adm__mark"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`RIMIFY`);
					else return [(0, vue_exports.createTextVNode)("RIMIFY")];
				}),
				_: 1
			}, _parent));
			_push(`<!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(rail, (item) => {
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					key: item.routeName,
					href: item.href,
					class: "adm__link",
					"aria-current": (0, vue_exports.unref)(shared).routeName === item.routeName ? "page" : void 0
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								name: item.icon,
								size: 20
							}, null, _parent, _scopeId));
							_push(` ${(0, server_renderer_exports.ssrInterpolate)(item.label)}`);
						} else return [(0, vue_exports.createVNode)(Icon_default, {
							name: item.icon,
							size: 20
						}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(item.label), 1)];
					}),
					_: 2
				}, _parent));
			});
			_push(`<!--]--><div class="adm__spacer" data-v-0766b6ef></div><button class="adm__link adm__link--button" type="button" data-v-0766b6ef>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "settings",
				size: 20
			}, null, _parent));
			_push(` ${(0, server_renderer_exports.ssrInterpolate)(theme.value === "dark" ? "Helles Design" : "Dunkles Design")}</button></aside><main class="adm__main" data-v-0766b6ef><div class="adm__topbar" data-v-0766b6ef>`);
			if (__props.title) _push(`<h1 class="t-h2 adm__title" data-v-0766b6ef>${(0, server_renderer_exports.ssrInterpolate)(__props.title)}</h1>`);
			else _push(`<!---->`);
			_push(`</div>`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</main></div>`);
		};
	}
});
//#endregion
//#region resources/js/Layouts/AdminLayout.vue
var _sfc_setup = AdminLayout_vue_vue_type_script_setup_true_lang_default.setup;
AdminLayout_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Layouts/AdminLayout.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var AdminLayout_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AdminLayout_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0766b6ef"]]);
//#endregion
export { AdminLayout_default as t };
