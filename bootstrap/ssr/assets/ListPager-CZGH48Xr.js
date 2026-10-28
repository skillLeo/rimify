import { a as link_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { n as decimal } from "./format-6R0uUMt3.js";
//#region resources/js/Components/Admin/Lists/ListPager.vue?vue&type=script&setup=true&lang.ts
var ListPager_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ListPager",
	__ssrInlineRender: true,
	props: {
		pagination: {},
		label: {}
	},
	setup(__props) {
		/**
		* The way through a long list, page by page (ListPaging.php): „Vorherige“, where one is, and „Nächste“ — as the lists of
		* Felgen and Reifen have always drawn it. Shown only where there is more than one page.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			if (__props.pagination.last > 1) {
				_push(`<nav${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
					class: "lp",
					"aria-label": __props.label
				}, _attrs))} data-v-fb8db188>`);
				if (__props.pagination.prev) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: __props.pagination.prev,
					class: "btn btn--secondary",
					"preserve-scroll": ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "chevron-left",
								size: 16
							}, null, _parent, _scopeId));
							_push(` Vorherige `);
						} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "chevron-left",
							size: 16
						}), (0, vue_exports.createTextVNode)(" Vorherige ")];
					}),
					_: 1
				}, _parent));
				else _push(`<span aria-hidden="true" data-v-fb8db188></span>`);
				_push(`<p class="lp__where" data-v-fb8db188>Seite ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0))}</p>`);
				if (__props.pagination.next) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: __props.pagination.next,
					class: "btn btn--secondary",
					"preserve-scroll": ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(` Nächste `);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "chevron-right",
								size: 16
							}, null, _parent, _scopeId));
						} else return [(0, vue_exports.createTextVNode)(" Nächste "), (0, vue_exports.createVNode)(AdminIcon_default, {
							name: "chevron-right",
							size: 16
						})];
					}),
					_: 1
				}, _parent));
				else _push(`<span aria-hidden="true" data-v-fb8db188></span>`);
				_push(`</nav>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/Lists/ListPager.vue
var _sfc_setup = ListPager_vue_vue_type_script_setup_true_lang_default.setup;
ListPager_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/Lists/ListPager.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ListPager_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ListPager_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-fb8db188"]]);
//#endregion
export { ListPager_default as t };
