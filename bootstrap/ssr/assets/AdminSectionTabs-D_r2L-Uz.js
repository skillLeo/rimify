import { a as link_default, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
//#region resources/js/Components/Admin/AdminSectionTabs.vue?vue&type=script&setup=true&lang.ts
var AdminSectionTabs_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminSectionTabs",
	__ssrInlineRender: true,
	props: {
		label: {},
		items: {}
	},
	setup(__props) {
		/**
		* A row of sibling pages under one rail item — Einstellungen › Zubehörpreise holds the Wuchtgewicht
		* colours and the RDKS sensor prices. Each is its own page with its own address, so this is a small
		* navigation with `aria-current`, not an ARIA tab list: the browser's Back, a bookmark and a pasted
		* link all work, and nothing is hidden inside one page.
		*/
		const props = __props;
		const page = usePage();
		/** The address without its query or hash: `?seite=2` is still the same tab. */
		const path = (0, vue_exports.computed)(() => {
			const url = page.url;
			return typeof url === "string" ? url.replace(/[?#].*$/, "") : "";
		});
		const items = (0, vue_exports.computed)(() => props.items.map((item) => ({
			...item,
			current: path.value === item.href
		})));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<nav${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "adm-tabs",
				"aria-label": __props.label
			}, _attrs))}><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(items.value, (item) => {
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					key: item.href,
					href: item.href,
					class: "adm-tabs__item",
					"aria-current": item.current ? "page" : void 0
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)];
					}),
					_: 2
				}, _parent));
			});
			_push(`<!--]--></nav>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminSectionTabs.vue
var _sfc_setup = AdminSectionTabs_vue_vue_type_script_setup_true_lang_default.setup;
AdminSectionTabs_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminSectionTabs.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var AdminSectionTabs_default = AdminSectionTabs_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { AdminSectionTabs_default as t };
