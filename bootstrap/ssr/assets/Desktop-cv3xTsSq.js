import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as RevenueChart_default } from "./RevenueChart-YccFpOwz.js";
//#region resources/js/Pages/Admin/Dashboard/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		tiles: {},
		revenue: {},
		conflicts: {}
	},
	setup(__props) {
		const points = __props.revenue.map((r) => ({
			label: r.label,
			value: r.value
		}));
		const KIND_LABEL = {
			ENTRY_REQUIREMENT: "Eintragungspflicht",
			TYRE_SIZES: "Reifengrößen",
			WIDTH_ET_RANGE: "Breite / ET",
			CONDITIONS: "Auflagen"
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Dashboard" }, null, _parent));
			_push(`<div class="tiles" data-v-00dabd26><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.tiles, (tile) => {
				_push(`<article class="tile" data-v-00dabd26><span class="micro" data-v-00dabd26>${(0, server_renderer_exports.ssrInterpolate)(tile.label)}</span><p class="tile__value" data-v-00dabd26>${(0, server_renderer_exports.ssrInterpolate)(tile.value)}</p></article>`);
			});
			_push(`<!--]--></div><div class="dash__row" data-v-00dabd26><section class="card dash__chart" data-v-00dabd26><span class="micro" data-v-00dabd26>Umsatz, 12 Monate</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(RevenueChart_default, {
				points: (0, vue_exports.unref)(points),
				width: 720,
				height: 220
			}, null, _parent));
			_push(`</section><section class="card dash__conflicts" data-v-00dabd26><span class="micro" data-v-00dabd26>Offene Konflikte</span>`);
			if (__props.conflicts.length > 0) {
				_push(`<table class="table dash__table" data-v-00dabd26><tbody data-v-00dabd26><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.conflicts, (conflict) => {
					_push(`<tr data-v-00dabd26><td data-v-00dabd26><p class="dash__vehicle" data-v-00dabd26>${(0, server_renderer_exports.ssrInterpolate)(conflict.vehicle)}</p><span class="data" data-v-00dabd26>${(0, server_renderer_exports.ssrInterpolate)(conflict.keyNumbers)}</span></td><td data-v-00dabd26><span class="${(0, server_renderer_exports.ssrRenderClass)([conflict.blocking ? "tag--danger" : "tag--warn", "tag"])}" data-v-00dabd26>${(0, server_renderer_exports.ssrInterpolate)(KIND_LABEL[conflict.kind] ?? conflict.kind)}</span></td></tr>`);
				});
				_push(`<!--]--></tbody></table>`);
			} else _push(`<p class="quiet dash__empty" data-v-00dabd26>Keine offenen Konflikte.</p>`);
			_push(`</section></div><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Dashboard/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Dashboard/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-00dabd26"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
