import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
//#region resources/js/Components/Admin/AdminSortHeader.vue?vue&type=script&setup=true&lang.ts
var AdminSortHeader_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminSortHeader",
	__ssrInlineRender: true,
	props: {
		label: {},
		column: {},
		sort: {},
		richtung: {},
		num: { type: Boolean },
		disabled: { type: Boolean }
	},
	emits: ["sort"],
	setup(__props, { emit: __emit }) {
		/**
		* A column heading that sorts its list (F-32): pressed, the list orders by this column; pressed again, the other way.
		* The order lives in the address (`sort`, `richtung`), so a sorted list is a link, kept across its pages. The look is
		* Katalog › Felgen's, where sorting began.
		*/
		const props = __props;
		const on = () => props.sort === props.column;
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<th${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				scope: "col",
				class: { num: __props.num },
				"aria-sort": on() ? __props.richtung === "auf" ? "ascending" : "descending" : void 0
			}, _attrs))} data-v-930d640e><button class="adm-sort" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.disabled) ? " disabled" : ""} data-v-930d640e>${(0, server_renderer_exports.ssrInterpolate)(__props.label)} `);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				class: ["adm-sort__icon", { "adm-sort__icon--on": on() }],
				name: on() && __props.richtung === "auf" ? "chevron-up" : "chevron-down",
				size: 16
			}, null, _parent));
			_push(`</button></th>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminSortHeader.vue
var _sfc_setup = AdminSortHeader_vue_vue_type_script_setup_true_lang_default.setup;
AdminSortHeader_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminSortHeader.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var AdminSortHeader_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AdminSortHeader_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-930d640e"]]);
//#endregion
export { AdminSortHeader_default as t };
